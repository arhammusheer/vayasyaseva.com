// A minimal S3 client for Cloudflare R2: HEAD, PUT and GET of one object,
// signed with AWS Signature Version 4. The monitor runs as plain Node with
// no packages installed (the CronJob downloads scripts/ and src/content/
// only), so it cannot use an SDK.
import { createHash, createHmac } from "node:crypto";

const hash = (data) => createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();
/** RFC 3986 encoding as SigV4 wants it; "/" kept in object keys. */
const encode = (s, keepSlash = false) =>
  [...Buffer.from(s, "utf8")]
    .map((b) => {
      const c = String.fromCharCode(b);
      return /[A-Za-z0-9\-._~]/.test(c) || (keepSlash && c === "/") ? c : `%${b.toString(16).toUpperCase().padStart(2, "0")}`;
    })
    .join("");

/**
 * The Authorization header for one request. `headers` must already hold
 * host, x-amz-date and x-amz-content-sha256; every header given is signed.
 */
export function signRequest({ method, path, query = "", headers, accessKeyId, secretAccessKey, region = "auto", service = "s3" }) {
  const amzDate = headers["x-amz-date"];
  const day = amzDate.slice(0, 8);
  const names = Object.keys(headers)
    .map((h) => h.toLowerCase())
    .sort();
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim().replace(/\s+/g, " ")]));
  const canonical = [method, encode(path, true), query, ...names.map((h) => `${h}:${lower[h]}`), "", names.join(";"), lower["x-amz-content-sha256"]].join("\n");
  const scope = `${day}/${region}/${service}/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, hash(canonical)].join("\n");
  const key = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, day), region), service), "aws4_request");
  const signature = createHmac("sha256", key).update(toSign).digest("hex");
  return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}`;
}

/**
 * A client for one bucket. Metadata keys become x-amz-meta-* headers, so
 * values must be plain ASCII (encode anything else before passing it).
 */
export function r2Client({ accountId, bucket, accessKeyId, secretAccessKey, fetchImpl = fetch, endpoint = `https://${accountId}.r2.cloudflarestorage.com` }) {
  const host = new URL(endpoint).host;
  async function send(method, key, { body, contentType, cacheControl, metadata = {} } = {}) {
    const path = `/${bucket}/${key}`;
    const amzDate = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const sent = { "x-amz-date": amzDate, "x-amz-content-sha256": body ? hash(body) : hash("") };
    if (contentType) sent["content-type"] = contentType;
    if (cacheControl) sent["cache-control"] = cacheControl;
    for (const [k, v] of Object.entries(metadata)) sent[`x-amz-meta-${k.toLowerCase()}`] = String(v);
    // fetch sets host itself; it is signed all the same.
    const authorization = signRequest({ method, path, headers: { host, ...sent }, accessKeyId, secretAccessKey });
    return fetchImpl(`${endpoint}${encode(path, true)}`, { method, body, headers: { ...sent, authorization }, signal: AbortSignal.timeout(60_000) });
  }
  return {
    /** True when the object exists. */
    async exists(key) {
      const res = await send("HEAD", key);
      if (res.status === 404) return false;
      if (!res.ok) throw new Error(`R2 HEAD ${key}: HTTP ${res.status}`);
      return true;
    },
    async put(key, body, { contentType, cacheControl, metadata } = {}) {
      const res = await send("PUT", key, { body, contentType, cacheControl, metadata });
      if (!res.ok) throw new Error(`R2 PUT ${key}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    },
    /** The object's bytes, or null when it does not exist. */
    async get(key) {
      const res = await send("GET", key);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`R2 GET ${key}: HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
  };
}

/** The client from R2_ARCHIVE_* variables, or null when they are not all set. */
export function r2FromEnv(env = process.env) {
  const { R2_ARCHIVE_ACCOUNT_ID: accountId, R2_ARCHIVE_BUCKET: bucket, R2_ARCHIVE_ACCESS_KEY_ID: accessKeyId, R2_ARCHIVE_SECRET_ACCESS_KEY: secretAccessKey } = env;
  return accountId && bucket && accessKeyId && secretAccessKey ? r2Client({ accountId, bucket, accessKeyId, secretAccessKey }) : null;
}
