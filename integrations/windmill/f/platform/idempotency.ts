// Generated from integrations/windmill/platform/scripts/idempotency.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

import { createHmac, timingSafeEqual } from "node:crypto";

// integrations/windmill/talent/lib/config.ts
const { VARIABLES, variablePath, setConfigForTests, config } = (() => {
const VARIABLES = {
    talent_pg_url: { secret: true },
    fast2sms_api_key: { secret: true },
    intake_webhook_secret: { secret: true },
    r2_read_key_id: { secret: true },
    r2_read_secret: { secret: true },
    r2_erase_key_id: { secret: true },
    r2_erase_secret: { secret: true },
    chatwoot_admin_token: { secret: true },
    chatwoot_inbox_identifier: { secret: true },
    chatwoot_base_url: { secret: false },
    chatwoot_account_id: { secret: false },
    r2_endpoint: { secret: false },
    r2_bucket: { secret: false },
    twenty_base_url: { secret: false },
    twenty_api_key: { secret: true },
    lead_webhook_secret: { secret: true },
    fast2sms_dlr_secret: { secret: true },
    leads_pg_url: { secret: true },
    submission_signing_secret: { secret: true },
};
const variablePath = (name) => `f/talent/${name}`;
let override = null;
function setConfigForTests(values) {
    override = values;
}
async function config(name) {
    if (override) {
        const value = override[name];
        if (value === undefined)
            throw new Error(`test config has no ${name}`);
        return value;
    }
    const value = await wmill.getVariable(variablePath(name));
    if (!value)
        throw new Error(`variable ${variablePath(name)} is empty`);
    return value;
}
  return { VARIABLES, variablePath, setConfigForTests, config };
})();

// integrations/windmill/talent/lib/db.ts
const { withTalentDb, withDatabase, queryWith } = (() => {
const passThroughJson = (oid) => ({
    to: oid,
    from: [oid],
    serialize: (value) => (typeof value === "string" ? value : JSON.stringify(value)),
    parse: (value) => JSON.parse(value),
});
async function withTalentDb(fn) {
    return withDatabase("talent_pg_url", fn);
}
async function withDatabase(url, fn) {
    const sql = postgres(await config(url), {
        max: 1,
        connect_timeout: 10,
        idle_timeout: 5,
        prepare: false,
        types: { json: passThroughJson(114), jsonb: passThroughJson(3802) },
        onnotice: () => { },
    });
    try {
        return await fn(queryWith(sql));
    }
    finally {
        await sql.end({ timeout: 5 });
    }
}
const queryWith = (sql) => async (text, params = []) => (await sql.unsafe(text, params));
  return { withTalentDb, withDatabase, queryWith };
})();

// integrations/windmill/talent/lib/response.ts
const { respond, accepted, forbidden, invalid, failed } = (() => {
function respond(status, body) {
    return { wm_status_code: status, result: body };
}
const accepted = (ref) => respond(202, { ok: true, ref });
const forbidden = () => respond(403, { ok: false, error: "Forbidden" });
const invalid = (errors) => respond(400, { ok: false, error: `Invalid submission: ${errors.join(", ")}` });
const failed = () => respond(500, { ok: false, error: "Internal error" });
  return { respond, accepted, forbidden, invalid, failed };
})();

// integrations/windmill/platform/lib/idempotency-sql.ts
const { IDEMPOTENCY_SWEEP, IDEMPOTENCY_BEGIN, IDEMPOTENCY_COMPLETE, IDEMPOTENCY_ABANDON } = (() => {
const IDEMPOTENCY_SWEEP = `DELETE FROM idempotency_keys WHERE updated_at < now() - interval '24 hours';`;
const IDEMPOTENCY_BEGIN = `
WITH before AS (
  SELECT fingerprint, state, answer, carry, updated_at FROM idempotency_keys WHERE scope = $1 AND key = $2 FOR UPDATE
), claimed AS (
  INSERT INTO idempotency_keys (scope, key, fingerprint, state, carry, updated_at)
  VALUES ($1, $2, $3, 'running', NULL, now())
  ON CONFLICT (scope, key) DO UPDATE
  SET state = 'running', updated_at = now()
  WHERE idempotency_keys.fingerprint = $3
    AND (idempotency_keys.state = 'failed' OR (idempotency_keys.state = 'running' AND idempotency_keys.updated_at < now() - interval '2 minutes'))
  RETURNING 1
)
SELECT (SELECT row_to_json(before) FROM before) AS before, (SELECT count(*) FROM claimed) > 0 AS claimed;`;
const IDEMPOTENCY_COMPLETE = `
UPDATE idempotency_keys SET state = 'done', answer = $3::jsonb, carry = NULL, updated_at = now()
WHERE scope = $1 AND key = $2;`;
const IDEMPOTENCY_ABANDON = `
WITH gone AS (
  DELETE FROM idempotency_keys WHERE scope = $1 AND key = $2 AND $3::jsonb IS NULL RETURNING 1
)
UPDATE idempotency_keys SET state = 'failed', carry = $3::jsonb, updated_at = now()
WHERE scope = $1 AND key = $2 AND $3::jsonb IS NOT NULL;`;
  return { IDEMPOTENCY_SWEEP, IDEMPOTENCY_BEGIN, IDEMPOTENCY_COMPLETE, IDEMPOTENCY_ABANDON };
})();

// integrations/windmill/platform/lib/run-idempotency.ts
const { storeFor, runIdempotency } = (() => {
const KEY = /^[A-Za-z0-9_.:-]{8,128}$/;
const MAX_JSON = 64 * 1024;
function storeFor(scope) {
    if (/^\/api\/(agent\/)?jobs(\/(start|submit))?$/.test(scope))
        return "talent";
    if (/^\/api\/(agent\/)?contact$/.test(scope))
        return "leads";
    return null;
}
function parse(body) {
    const b = (body && typeof body === "object" ? body : {});
    if (b.op !== "begin" && b.op !== "complete" && b.op !== "abandon")
        return null;
    if (typeof b.scope !== "string" || !storeFor(b.scope) || typeof b.key !== "string" || !KEY.test(b.key))
        return null;
    if (b.op === "begin" && (typeof b.fingerprint !== "string" || !/^[\w-]{10,100}$/.test(b.fingerprint)))
        return null;
    if (b.op === "complete") {
        const a = b.answer;
        if (!a || typeof a !== "object" || typeof a.status !== "number" || JSON.stringify(a).length > MAX_JSON)
            return null;
    }
    if (b.carry !== undefined && b.carry !== null) {
        if (typeof b.carry !== "object" || Object.values(b.carry).some((v) => typeof v !== "string") || JSON.stringify(b.carry).length > 2048)
            return null;
    }
    return b;
}
async function runIdempotency(authorized, body, db) {
    if (!authorized)
        return respond(403, { ok: false, error: "Forbidden" });
    const r = parse(body);
    if (!r)
        return respond(400, { ok: false, error: "Invalid request" });
    const store = storeFor(r.scope);
    try {
        if (r.op === "complete") {
            await db(store, (q) => q(IDEMPOTENCY_COMPLETE, [r.scope, r.key, JSON.stringify(r.answer)]));
            return respond(200, { ok: true });
        }
        if (r.op === "abandon") {
            await db(store, (q) => q(IDEMPOTENCY_ABANDON, [r.scope, r.key, r.carry ? JSON.stringify(r.carry) : null]));
            return respond(200, { ok: true });
        }
        const row = (await db(store, async (q) => {
            await q(IDEMPOTENCY_SWEEP);
            return (await q(IDEMPOTENCY_BEGIN, [r.scope, r.key, r.fingerprint]))[0];
        }));
        const before = row?.before ?? null;
        if (row?.claimed)
            return respond(200, { state: "new", ...(before?.carry ? { carry: before.carry } : {}) });
        if (!before)
            return respond(200, { state: "in_progress" });
        if (before.fingerprint !== r.fingerprint)
            return respond(200, { state: "mismatch" });
        if (before.state === "done")
            return respond(200, { state: "replay", answer: before.answer });
        return respond(200, { state: "in_progress" });
    }
    catch (err) {
        console.error("idempotency failed:", r.op, r.scope, err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
        return respond(500, { ok: false, error: "Internal error" });
    }
}
  return { storeFor, runIdempotency };
})();

// packages/contracts/src/signing.ts
const { TIMESTAMP_HEADER, SIGNATURE_HEADER, SIGNATURE_SKEW_SECONDS, signRequest, checkSignature } = (() => {
const TIMESTAMP_HEADER = "x-vspl-timestamp";
const SIGNATURE_HEADER = "x-vspl-signature";
const SIGNATURE_SKEW_SECONDS = 5 * 60;
const mac = (secret, timestamp, body) => createHmac("sha256", secret).update(`v1:${timestamp}.${body}`).digest("base64url");
function signRequest(secret, body, nowSeconds = Math.floor(Date.now() / 1000)) {
    const timestamp = String(nowSeconds);
    return { [TIMESTAMP_HEADER]: timestamp, [SIGNATURE_HEADER]: `v1=${mac(secret, timestamp, body)}` };
}
function checkSignature(secret, headers, rawBody, nowSeconds = Math.floor(Date.now() / 1000)) {
    const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    const timestamp = lower[TIMESTAMP_HEADER];
    const signature = lower[SIGNATURE_HEADER];
    if (!secret || !timestamp || !signature || !/^\d{1,12}$/.test(timestamp))
        return "missing";
    if (Math.abs(nowSeconds - Number(timestamp)) > SIGNATURE_SKEW_SECONDS)
        return "stale";
    const expected = Buffer.from(`v1=${mac(secret, timestamp, rawBody)}`);
    const given = Buffer.from(signature);
    return expected.length === given.length && timingSafeEqual(expected, given) ? "ok" : "mismatch";
}
  return { TIMESTAMP_HEADER, SIGNATURE_HEADER, SIGNATURE_SKEW_SECONDS, signRequest, checkSignature };
})();

// integrations/windmill/platform/lib/signed.ts
const { signedPreprocessor } = (() => {
async function signedPreprocessor(event, nowSeconds = Math.floor(Date.now() / 1000)) {
    const raw = typeof event.raw_string === "string" ? event.raw_string : null;
    let secret = "";
    try {
        secret = await config("submission_signing_secret");
    }
    catch {
    }
    if (raw === null || checkSignature(secret, event.headers ?? {}, raw, nowSeconds) !== "ok")
        return { authorized: false, body: null };
    try {
        return { authorized: true, body: JSON.parse(raw) };
    }
    catch {
        return { authorized: true, body: null };
    }
}
  return { signedPreprocessor };
})();

export async function preprocessor(event) {
    return signedPreprocessor(event);
}
export async function main(authorized, body) {
    return runIdempotency(authorized, body, (store, fn) => (store === "talent" ? withTalentDb(fn) : withDatabase("leads_pg_url", fn)));
}

