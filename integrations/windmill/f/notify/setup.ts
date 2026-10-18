// Generated from integrations/windmill/notify/scripts/setup.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

// integrations/windmill/notify/lib/config.ts
const { NOTIFY_VARIABLES, notifyVariablePath, setNotifyConfigForTests, notifyConfig, OWNER_PLACEHOLDER } = (() => {
const NOTIFY_VARIABLES = {
    notify_pg_url: { secret: true },
    ingest_secret: { secret: true },
    alertmanager_secret: { secret: true },
    ntfy_token: { secret: true },
    ntfy_base_url: { secret: false },
    resend_api_key: { secret: true },
    email_from: { secret: false },
    email_to: { secret: true },
    policy: { secret: false },
};
const notifyVariablePath = (name) => `f/notify/${name}`;
let notifyOverride = null;
function setNotifyConfigForTests(values) {
    notifyOverride = values;
}
async function notifyConfig(name) {
    if (notifyOverride) {
        const value = notifyOverride[name];
        if (value === undefined)
            throw new Error(`test config has no ${name}`);
        return value;
    }
    const value = await wmill.getVariable(notifyVariablePath(name));
    if (!value)
        throw new Error(`variable ${notifyVariablePath(name)} is empty`);
    return value;
}
const OWNER_PLACEHOLDER = "set-by-owner";
  return { NOTIFY_VARIABLES, notifyVariablePath, setNotifyConfigForTests, notifyConfig, OWNER_PLACEHOLDER };
})();

// integrations/windmill/notify/lib/db.ts
const { withNotifyDb, NOTIFY_INSERT_EVENT, NOTIFY_KEY_STATUSES, NOTIFY_CLAIM_UNROUTED, NOTIFY_ENSURE_KEY, NOTIFY_LOCK_KEY, NOTIFY_SAVE_KEY, NOTIFY_MARK_ROUTED, NOTIFY_ADD_DELIVERY, NOTIFY_CLAIM_SWEEP, NOTIFY_CLAIM_DIGEST, NOTIFY_MARK_DIGESTED, NOTIFY_RECOVER_STUCK, NOTIFY_CLAIM_DELIVERIES, NOTIFY_FINISH_DELIVERY, NOTIFY_RELEASE_PII, NOTIFY_CLEAR_PII_BEFORE, NOTIFY_PURGE_BEFORE, toStoredEvent, insertEventWith, pgNotifyStore, notifySchemaStatements } = (() => {
async function withNotifyDb(fn) {
    const sql = postgres(await notifyConfig("notify_pg_url"), {
        max: 1,
        connect_timeout: 10,
        idle_timeout: 5,
        prepare: false,
        onnotice: () => { },
    });
    try {
        return await fn(sql);
    }
    finally {
        await sql.end({ timeout: 5 });
    }
}
const NOTIFY_INSERT_EVENT = `
INSERT INTO notify_events (v, source, type, severity, dedupe_key, status, occurred_at, title, summary, body, link, pii, received_at)
VALUES (1, $1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9, $10::jsonb, $11::jsonb, $12::timestamptz)
RETURNING id::text AS id;`;
const NOTIFY_KEY_STATUSES = `
WITH k AS (
  SELECT dedupe_key, status FROM notify_keys WHERE left(dedupe_key, length($1)) = $1 AND status IS NOT NULL
), p AS (
  SELECT DISTINCT ON (dedupe_key) dedupe_key, status FROM notify_events
  WHERE routed_at IS NULL AND status IS NOT NULL AND left(dedupe_key, length($1)) = $1
  ORDER BY dedupe_key, id DESC
)
SELECT dedupe_key, coalesce(p.status, k.status) AS status FROM k FULL JOIN p USING (dedupe_key);`;
const EVENT_COLUMNS = `e.id::text AS id, e.source, e.type, e.severity, e.dedupe_key, e.status, e.occurred_at, e.received_at, e.title, e.summary, e.body, e.link, e.pii`;
const NOTIFY_CLAIM_UNROUTED = `
SELECT ${EVENT_COLUMNS} FROM notify_events e
WHERE e.routed_at IS NULL
ORDER BY e.id
LIMIT $1
FOR UPDATE SKIP LOCKED;`;
const NOTIFY_ENSURE_KEY = `INSERT INTO notify_keys (dedupe_key) VALUES ($1) ON CONFLICT (dedupe_key) DO NOTHING RETURNING 1 AS created;`;
const NOTIFY_LOCK_KEY = `SELECT status, firing_pushed, firing_emailed, last_push_at, pending_count, seen_count FROM notify_keys WHERE dedupe_key = $1 FOR UPDATE;`;
const NOTIFY_SAVE_KEY = `
UPDATE notify_keys SET status = $2, firing_pushed = $3, firing_emailed = $4, last_push_at = $5::timestamptz,
  pending_count = $6, seen_count = $7, last_event_id = coalesce($8::bigint, last_event_id), updated_at = $9::timestamptz
WHERE dedupe_key = $1;`;
const NOTIFY_MARK_ROUTED = `
UPDATE notify_events SET routed_at = $6::timestamptz, rule = $2, duplicate = $3, digest = $4,
  pii = CASE WHEN $5 THEN pii ELSE NULL END
WHERE id = $1::bigint;`;
const NOTIFY_ADD_DELIVERY = `
INSERT INTO notify_deliveries (event_id, channel, kind, count, next_attempt_at, created_at, updated_at)
VALUES ($1::bigint, $2, $3, $4, $5::timestamptz, $5::timestamptz, $5::timestamptz);`;
const NOTIFY_CLAIM_SWEEP = `
SELECT k.dedupe_key, k.status AS key_status, k.firing_pushed, k.firing_emailed, k.last_push_at, k.pending_count, k.seen_count, ${EVENT_COLUMNS}
FROM notify_keys k JOIN notify_events e ON e.id = k.last_event_id
WHERE k.last_push_at IS NOT NULL AND (
  (k.status = 'firing' AND k.firing_pushed AND k.last_push_at <= $1::timestamptz - make_interval(mins => $2::int))
  OR (k.pending_count > 0 AND k.last_push_at <= $1::timestamptz - make_interval(mins => $3::int))
)
ORDER BY k.last_push_at
LIMIT $4
FOR UPDATE OF k SKIP LOCKED;`;
const NOTIFY_CLAIM_DIGEST = `
SELECT ${EVENT_COLUMNS} FROM notify_events e
WHERE e.digest AND e.digested_at IS NULL AND e.routed_at IS NOT NULL
ORDER BY e.id
LIMIT $1
FOR UPDATE SKIP LOCKED;`;
const NOTIFY_MARK_DIGESTED = `UPDATE notify_events SET digested_at = $2::timestamptz WHERE id = ANY($1::bigint[]);`;
const NOTIFY_RECOVER_STUCK = `
UPDATE notify_deliveries
SET status = CASE WHEN attempts >= $2 THEN 'failed' ELSE 'pending' END, last_error = 'interrupted', updated_at = $1::timestamptz
WHERE status = 'sending' AND updated_at <= $1::timestamptz - interval '10 minutes'
RETURNING id;`;
const NOTIFY_CLAIM_DELIVERIES = `
WITH due AS (
  SELECT id FROM notify_deliveries
  WHERE status = 'pending' AND next_attempt_at <= $1::timestamptz AND attempts < $3
  ORDER BY next_attempt_at, id
  LIMIT $2
  FOR UPDATE SKIP LOCKED
), claimed AS (
  UPDATE notify_deliveries d SET status = 'sending', attempts = d.attempts + 1, updated_at = $1::timestamptz
  FROM due WHERE d.id = due.id
  RETURNING d.id, d.event_id, d.channel, d.kind, d.count, d.attempts
)
SELECT c.id::text AS delivery_id, c.channel, c.kind, c.count, c.attempts, ${EVENT_COLUMNS}
FROM claimed c JOIN notify_events e ON e.id = c.event_id
ORDER BY c.id;`;
const NOTIFY_FINISH_DELIVERY = `
UPDATE notify_deliveries SET status = $2, last_error = $3, next_attempt_at = coalesce($4::timestamptz, next_attempt_at),
  sent_at = CASE WHEN $2 = 'sent' THEN $5::timestamptz ELSE sent_at END, updated_at = $5::timestamptz
WHERE id = $1::bigint;`;
const NOTIFY_RELEASE_PII = `
UPDATE notify_events SET pii = NULL
WHERE id = $1::bigint AND pii IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM notify_deliveries d WHERE d.event_id = $1::bigint AND d.channel = 'push' AND d.status IN ('pending', 'sending')
);`;
const NOTIFY_CLEAR_PII_BEFORE = `UPDATE notify_events SET pii = NULL WHERE pii IS NOT NULL AND received_at < $1::timestamptz RETURNING id;`;
const NOTIFY_PURGE_BEFORE = `DELETE FROM notify_events WHERE received_at < $1::timestamptz RETURNING id;`;
const iso = (v) => (v instanceof Date ? v.toISOString() : v === null || v === undefined ? null : new Date(String(v)).toISOString());
function toStoredEvent(r) {
    return {
        v: 1,
        id: String(r.id),
        source: r.source,
        type: String(r.type),
        severity: r.severity,
        dedupeKey: String(r.dedupe_key),
        ...(r.status ? { status: r.status } : {}),
        occurredAt: iso(r.occurred_at),
        receivedAt: iso(r.received_at),
        title: String(r.title),
        summary: String(r.summary),
        ...(r.body ? { body: String(r.body) } : {}),
        ...(r.link ? { link: r.link } : {}),
        ...(r.pii ? { pii: r.pii } : {}),
    };
}
const toState = (r, statusColumn = "status") => ({
    status: r[statusColumn] ?? null,
    firingPushed: Boolean(r.firing_pushed),
    firingEmailed: Boolean(r.firing_emailed),
    lastPushAt: iso(r.last_push_at),
    pendingCount: Number(r.pending_count ?? 0),
    seenCount: Number(r.seen_count ?? 0),
});
const execOn = (sql) => async (text, params = []) => (await sql.unsafe(text, params));
function insertEventWith(exec) {
    return async (e, now) => {
        const rows = await exec(NOTIFY_INSERT_EVENT, [
            e.source, e.type, e.severity, e.dedupeKey, e.status ?? null, e.occurredAt, e.title, e.summary, e.body ?? null, e.link ?? null, e.pii ?? null, now,
        ]);
        return String(rows[0].id);
    };
}
function txOn(exec) {
    const addDelivery = async (eventId, channel, kind, count, now) => {
        await exec(NOTIFY_ADD_DELIVERY, [eventId, channel, kind, count, now]);
    };
    return {
        claimUnrouted: async (limit) => (await exec(NOTIFY_CLAIM_UNROUTED, [limit])).map(toStoredEvent),
        async lockKey(key) {
            const created = (await exec(NOTIFY_ENSURE_KEY, [key])).length > 0;
            const rows = await exec(NOTIFY_LOCK_KEY, [key]);
            return created || rows.length === 0 ? null : toState(rows[0]);
        },
        async saveKey(key, s, lastEventId, now) {
            await exec(NOTIFY_SAVE_KEY, [key, s.status, s.firingPushed, s.firingEmailed, s.lastPushAt, s.pendingCount, s.seenCount, lastEventId, now]);
        },
        async markRouted(id, o, now) {
            await exec(NOTIFY_MARK_ROUTED, [id, o.rule, o.duplicate, o.digest, o.keepPii, now]);
        },
        addDelivery,
        claimSweepKeys: async (now, reminderMinutes, collapseMinutes, limit) => (await exec(NOTIFY_CLAIM_SWEEP, [now, Math.round(reminderMinutes), Math.round(collapseMinutes), limit])).map((r) => ({
            key: String(r.dedupe_key),
            state: toState(r, "key_status"),
            event: toStoredEvent(r),
        })),
        claimDigest: async (limit) => (await exec(NOTIFY_CLAIM_DIGEST, [limit])).map(toStoredEvent),
        async markDigested(ids, now) {
            await exec(NOTIFY_MARK_DIGESTED, [ids, now]);
        },
    };
}
function pgNotifyStore(sql) {
    const exec = execOn(sql);
    const tx = txOn(exec);
    return {
        transaction: async (fn) => (await sql.begin((t) => fn(txOn(execOn(t))))),
        insertEvent: insertEventWith(exec),
        keyStatuses: async (prefix) => Object.fromEntries((await exec(NOTIFY_KEY_STATUSES, [prefix])).map((r) => [String(r.dedupe_key), r.status])),
        recoverStuck: async (now, maxAttempts) => (await exec(NOTIFY_RECOVER_STUCK, [now, maxAttempts])).length,
        claimDeliveries: async (now, limit, maxAttempts) => (await exec(NOTIFY_CLAIM_DELIVERIES, [now, limit, maxAttempts])).map((r) => ({
            id: String(r.delivery_id),
            channel: r.channel,
            kind: r.kind,
            count: Number(r.count),
            attempts: Number(r.attempts),
            event: toStoredEvent(r),
        })),
        async finishDelivery(id, o, now) {
            await exec(NOTIFY_FINISH_DELIVERY, [id, o.status, o.status === "sent" ? null : o.error, o.status === "pending" ? o.retryAt : null, now]);
        },
        addDelivery: tx.addDelivery,
        async releasePii(eventId) {
            await exec(NOTIFY_RELEASE_PII, [eventId]);
        },
        clearPiiBefore: async (before) => (await exec(NOTIFY_CLEAR_PII_BEFORE, [before])).length,
        purgeBefore: async (before) => (await exec(NOTIFY_PURGE_BEFORE, [before])).length,
    };
}
const notifySchemaStatements = (schema) => schema.replace(/^--.*\n/gm, "");
  return { withNotifyDb, NOTIFY_INSERT_EVENT, NOTIFY_KEY_STATUSES, NOTIFY_CLAIM_UNROUTED, NOTIFY_ENSURE_KEY, NOTIFY_LOCK_KEY, NOTIFY_SAVE_KEY, NOTIFY_MARK_ROUTED, NOTIFY_ADD_DELIVERY, NOTIFY_CLAIM_SWEEP, NOTIFY_CLAIM_DIGEST, NOTIFY_MARK_DIGESTED, NOTIFY_RECOVER_STUCK, NOTIFY_CLAIM_DELIVERIES, NOTIFY_FINISH_DELIVERY, NOTIFY_RELEASE_PII, NOTIFY_CLEAR_PII_BEFORE, NOTIFY_PURGE_BEFORE, toStoredEvent, insertEventWith, pgNotifyStore, notifySchemaStatements };
})();

export async function main() {
    await withNotifyDb((sql) => sql.unsafe(notifySchemaStatements("-- Notification hub schema for the `notify` database on pg-main.\n-- Owned by the `notify` role; applied by the Windmill script f/notify/setup\n-- (safe to re-run). See docs/notification-hub.md.\nDO $$\nBEGIN\n  -- Every event any producer emitted (lib/event.ts, schema v1). title and\n  -- summary carry no personal data; pii is cleared once its push is sent\n  -- (or never needed), and after a day at the latest.\n  CREATE TABLE IF NOT EXISTS notify_events (\n    id           bigserial PRIMARY KEY,\n    v            int NOT NULL DEFAULT 1,\n    source       text NOT NULL,\n    type         text NOT NULL,\n    severity     text NOT NULL CHECK (severity IN ('info', 'notice', 'warning', 'critical')),\n    dedupe_key   text NOT NULL,\n    status       text CHECK (status IN ('firing', 'resolved')),\n    occurred_at  timestamptz NOT NULL,\n    received_at  timestamptz NOT NULL DEFAULT now(),\n    title        text NOT NULL,\n    summary      text NOT NULL,\n    body         text,\n    link         jsonb,\n    pii          jsonb,\n    -- Set by dispatch: when it was routed, by which rule, and its outcome.\n    routed_at    timestamptz,\n    rule         text,\n    duplicate    boolean NOT NULL DEFAULT false,\n    -- In the daily digest (email mode digest), and when it went out in one.\n    digest       boolean NOT NULL DEFAULT false,\n    digested_at  timestamptz\n  );\n  CREATE INDEX IF NOT EXISTS notify_events_unrouted_idx ON notify_events (id) WHERE routed_at IS NULL;\n  CREATE INDEX IF NOT EXISTS notify_events_digest_idx ON notify_events (received_at) WHERE digest AND digested_at IS NULL;\n  CREATE INDEX IF NOT EXISTS notify_events_pii_idx ON notify_events (received_at) WHERE pii IS NOT NULL;\n  CREATE INDEX IF NOT EXISTS notify_events_key_idx ON notify_events (dedupe_key, id);\n\n  -- What the hub remembers per dedupeKey: dedupe, firing/resolved, the\n  -- daily reminder and hourly collapsing (lib/policy.ts KeyState).\n  -- last_event_id: the event that opened the current episode (or the latest,\n  -- for collapsed keys); reminders and summaries are rendered from it.\n  CREATE TABLE IF NOT EXISTS notify_keys (\n    dedupe_key     text PRIMARY KEY,\n    status         text CHECK (status IN ('firing', 'resolved')),\n    firing_pushed  boolean NOT NULL DEFAULT false,\n    firing_emailed boolean NOT NULL DEFAULT false,\n    last_push_at   timestamptz,\n    pending_count  int NOT NULL DEFAULT 0,\n    seen_count     int NOT NULL DEFAULT 0,\n    last_event_id  bigint REFERENCES notify_events (id) ON DELETE SET NULL,\n    updated_at     timestamptz NOT NULL DEFAULT now()\n  );\n  CREATE INDEX IF NOT EXISTS notify_keys_sweep_idx ON notify_keys (last_push_at) WHERE status = 'firing' OR pending_count > 0;\n\n  -- The outbox: one row per push or email to send. Claimed with FOR UPDATE\n  -- SKIP LOCKED; four tries (the first and three retries), then failed. A\n  -- failed push of a fallback severity (policy.fallbackEmail) queues an email.\n  CREATE TABLE IF NOT EXISTS notify_deliveries (\n    id              bigserial PRIMARY KEY,\n    event_id        bigint NOT NULL REFERENCES notify_events (id) ON DELETE CASCADE,\n    channel         text NOT NULL CHECK (channel IN ('push', 'email')),\n    kind            text NOT NULL CHECK (kind IN ('event', 'resolved', 'reminder', 'collapsed', 'fallback')),\n    count           int NOT NULL DEFAULT 1,\n    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),\n    attempts        int NOT NULL DEFAULT 0,\n    next_attempt_at timestamptz NOT NULL DEFAULT now(),\n    last_error      text,\n    sent_at         timestamptz,\n    created_at      timestamptz NOT NULL DEFAULT now(),\n    updated_at      timestamptz NOT NULL DEFAULT now()\n  );\n  CREATE INDEX IF NOT EXISTS notify_deliveries_due_idx ON notify_deliveries (next_attempt_at, id) WHERE status = 'pending';\n  CREATE INDEX IF NOT EXISTS notify_deliveries_sending_idx ON notify_deliveries (updated_at) WHERE status = 'sending';\n  CREATE INDEX IF NOT EXISTS notify_deliveries_event_idx ON notify_deliveries (event_id);\nEND\n$$;\n")));
    return { ok: true };
}

