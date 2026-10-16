/**
 * The vayasya-talent-intake bucket over R2's S3 API (path-style, SigV4 via
 * aws4fetch). Deliver reads with the read-only token; retention deletes
 * with the erase token. Two separate keys, as in n8n.
 */
import { AwsClient } from "aws4fetch";
import { config } from "./config.ts";

type Access = "read" | "erase";

async function client(access: Access) {
  const [accessKeyId, secretAccessKey, endpoint, bucket] = await Promise.all([
    config(access === "read" ? "r2_read_key_id" : "r2_erase_key_id"),
    config(access === "read" ? "r2_read_secret" : "r2_erase_secret"),
    config("r2_endpoint"),
    config("r2_bucket"),
  ]);
  const aws = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
  const url = (key: string) => `${endpoint.replace(/\/$/, "")}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  return { aws, url };
}

/** Downloads one object. Throws on any failure (the n8n S3 node stopped the run too). */
export async function downloadObject(key: string): Promise<{ data: Blob; contentType: string }> {
  const { aws, url } = await client("read");
  const res = await aws.fetch(url(key), { method: "GET" });
  if (!res.ok) throw new Error(`R2 GET ${key}: HTTP ${res.status}`);
  return { data: await res.blob(), contentType: res.headers.get("content-type") ?? "application/octet-stream" };
}

/** Deletes one object. S3 answers 204 whether or not it existed; anything else stops the erasure. */
export async function deleteObject(key: string): Promise<void> {
  const { aws, url } = await client("erase");
  const res = await aws.fetch(url(key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`R2 DELETE ${key}: HTTP ${res.status}`);
}
