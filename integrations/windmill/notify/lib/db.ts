/**
 * The `notify` database on pg-main (role `notify`, capped at 5 connections
 * in vayasya-infra apps/pg-main/base/cluster.yaml): one short-lived
 * connection per run, and NotifyStore on it. Every query is here.
 */
import postgres from "postgres";
import { notifyConfig } from "./config.ts";
import type { NotifyEvent } from "./event.ts";
import type { DeliveryKind, KeyState } from "./policy.ts";
import type { Channel, ClaimedDelivery, NotifyStore, NotifyTx, StoredEvent } from "./store.ts";

export async function withNotifyDb<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(await notifyConfig("notify_pg_url"), {
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
    prepare: false,
    onnotice: () => {},
  });
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/** $1..$12. pii and link are jsonb (objects or null). */
export const NOTIFY_INSERT_EVENT = `
INSERT INTO notify_events (v, source, type, severity, dedupe_key, status, occurred_at, title, summary, body, link, pii, received_at)
VALUES (1, $1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9, $10::jsonb, $11::jsonb, $12::timestamptz)
RETURNING id::text AS id;`;

const EVENT_COLUMNS = `e.id::text AS id, e.source, e.type, e.severity, e.dedupe_key, e.status, e.occurred_at, e.received_at, e.title, e.summary, e.body, e.link, e.pii`;

export const NOTIFY_CLAIM_UNROUTED = `
SELECT ${EVENT_COLUMNS} FROM notify_events e
WHERE e.routed_at IS NULL
ORDER BY e.id
LIMIT $1
FOR UPDATE SKIP LOCKED;`;

export const NOTIFY_ENSURE_KEY = `INSERT INTO notify_keys (dedupe_key) VALUES ($1) ON CONFLICT (dedupe_key) DO NOTHING RETURNING 1 AS created;`;
export const NOTIFY_LOCK_KEY = `SELECT status, firing_pushed, firing_emailed, last_push_at, pending_count, seen_count FROM notify_keys WHERE dedupe_key = $1 FOR UPDATE;`;

/** $1 key, $2..$7 state, $8 last event id (null keeps it), $9 now. */
export const NOTIFY_SAVE_KEY = `
UPDATE notify_keys SET status = $2, firing_pushed = $3, firing_emailed = $4, last_push_at = $5::timestamptz,
  pending_count = $6, seen_count = $7, last_event_id = coalesce($8::bigint, last_event_id), updated_at = $9::timestamptz
WHERE dedupe_key = $1;`;

/** $1 id, $2 rule, $3 duplicate, $4 digest, $5 keep pii, $6 now. */
export const NOTIFY_MARK_ROUTED = `
UPDATE notify_events SET routed_at = $6::timestamptz, rule = $2, duplicate = $3, digest = $4,
  pii = CASE WHEN $5 THEN pii ELSE NULL END
WHERE id = $1::bigint;`;

/** $1 event, $2 channel, $3 kind, $4 count, $5 now. */
export const NOTIFY_ADD_DELIVERY = `
INSERT INTO notify_deliveries (event_id, channel, kind, count, next_attempt_at, created_at, updated_at)
VALUES ($1::bigint, $2, $3, $4, $5::timestamptz, $5::timestamptz, $5::timestamptz);`;

/** $1 now, $2 reminder minutes, $3 collapse minutes, $4 limit. */
export const NOTIFY_CLAIM_SWEEP = `
SELECT k.dedupe_key, k.status AS key_status, k.firing_pushed, k.firing_emailed, k.last_push_at, k.pending_count, k.seen_count, ${EVENT_COLUMNS}
FROM notify_keys k JOIN notify_events e ON e.id = k.last_event_id
WHERE k.last_push_at IS NOT NULL AND (
  (k.status = 'firing' AND k.firing_pushed AND k.last_push_at <= $1::timestamptz - make_interval(mins => $2::int))
  OR (k.pending_count > 0 AND k.last_push_at <= $1::timestamptz - make_interval(mins => $3::int))
)
ORDER BY k.last_push_at
LIMIT $4
FOR UPDATE OF k SKIP LOCKED;`;

export const NOTIFY_CLAIM_DIGEST = `
SELECT ${EVENT_COLUMNS} FROM notify_events e
WHERE e.digest AND e.digested_at IS NULL AND e.routed_at IS NOT NULL
ORDER BY e.id
LIMIT $1
FOR UPDATE SKIP LOCKED;`;

export const NOTIFY_MARK_DIGESTED = `UPDATE notify_events SET digested_at = $2::timestamptz WHERE id = ANY($1::bigint[]);`;

/** $1 now, $2 max attempts. A sending row untouched for 10 minutes was interrupted. */
export const NOTIFY_RECOVER_STUCK = `
UPDATE notify_deliveries
SET status = CASE WHEN attempts >= $2 THEN 'failed' ELSE 'pending' END, last_error = 'interrupted', updated_at = $1::timestamptz
WHERE status = 'sending' AND updated_at <= $1::timestamptz - interval '10 minutes'
RETURNING id;`;

/** $1 now, $2 limit, $3 max attempts. Claimed and committed in one statement. */
export const NOTIFY_CLAIM_DELIVERIES = `
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

/** $1 id, $2 status, $3 error, $4 retry at, $5 now. */
export const NOTIFY_FINISH_DELIVERY = `
UPDATE notify_deliveries SET status = $2, last_error = $3, next_attempt_at = coalesce($4::timestamptz, next_attempt_at),
  sent_at = CASE WHEN $2 = 'sent' THEN $5::timestamptz ELSE sent_at END, updated_at = $5::timestamptz
WHERE id = $1::bigint;`;

export const NOTIFY_RELEASE_PII = `
UPDATE notify_events SET pii = NULL
WHERE id = $1::bigint AND pii IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM notify_deliveries d WHERE d.event_id = $1::bigint AND d.channel = 'push' AND d.status IN ('pending', 'sending')
);`;

export const NOTIFY_CLEAR_PII_BEFORE = `UPDATE notify_events SET pii = NULL WHERE pii IS NOT NULL AND received_at < $1::timestamptz RETURNING id;`;
export const NOTIFY_PURGE_BEFORE = `DELETE FROM notify_events WHERE received_at < $1::timestamptz RETURNING id;`;

type Row = Record<string, unknown>;
type Exec = (text: string, params?: unknown[]) => Promise<Row[]>;

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v === null || v === undefined ? null : new Date(String(v)).toISOString());

export function toStoredEvent(r: Row): StoredEvent {
  return {
    v: 1,
    id: String(r.id),
    source: r.source as StoredEvent["source"],
    type: String(r.type),
    severity: r.severity as StoredEvent["severity"],
    dedupeKey: String(r.dedupe_key),
    ...(r.status ? { status: r.status as StoredEvent["status"] } : {}),
    occurredAt: iso(r.occurred_at)!,
    receivedAt: iso(r.received_at)!,
    title: String(r.title),
    summary: String(r.summary),
    ...(r.body ? { body: String(r.body) } : {}),
    ...(r.link ? { link: r.link as StoredEvent["link"] } : {}),
    ...(r.pii ? { pii: r.pii as StoredEvent["pii"] } : {}),
  };
}

const toState = (r: Row, statusColumn = "status"): KeyState => ({
  status: (r[statusColumn] as KeyState["status"]) ?? null,
  firingPushed: Boolean(r.firing_pushed),
  firingEmailed: Boolean(r.firing_emailed),
  lastPushAt: iso(r.last_push_at),
  pendingCount: Number(r.pending_count ?? 0),
  seenCount: Number(r.seen_count ?? 0),
});

const execOn = (sql: postgres.Sql | postgres.TransactionSql): Exec => async (text, params = []) =>
  (await sql.unsafe(text, params as postgres.ParameterOrJSON<never>[])) as unknown as Row[];

export function insertEventWith(exec: Exec) {
  return async (e: NotifyEvent, now: Date) => {
    const rows = await exec(NOTIFY_INSERT_EVENT, [
      e.source, e.type, e.severity, e.dedupeKey, e.status ?? null, e.occurredAt, e.title, e.summary, e.body ?? null, e.link ?? null, e.pii ?? null, now,
    ]);
    return String(rows[0].id);
  };
}

function txOn(exec: Exec): NotifyTx {
  const addDelivery = async (eventId: string, channel: Channel, kind: DeliveryKind, count: number, now: Date) => {
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
    claimSweepKeys: async (now, reminderMinutes, collapseMinutes, limit) =>
      (await exec(NOTIFY_CLAIM_SWEEP, [now, Math.round(reminderMinutes), Math.round(collapseMinutes), limit])).map((r) => ({
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

export function pgNotifyStore(sql: postgres.Sql): NotifyStore {
  const exec = execOn(sql);
  const tx = txOn(exec);
  return {
    transaction: async (fn) => (await sql.begin((t) => fn(txOn(execOn(t))))) as never,
    insertEvent: insertEventWith(exec),
    recoverStuck: async (now, maxAttempts) => (await exec(NOTIFY_RECOVER_STUCK, [now, maxAttempts])).length,
    claimDeliveries: async (now, limit, maxAttempts) =>
      (await exec(NOTIFY_CLAIM_DELIVERIES, [now, limit, maxAttempts])).map(
        (r): ClaimedDelivery => ({
          id: String(r.delivery_id),
          channel: r.channel as Channel,
          kind: r.kind as DeliveryKind,
          count: Number(r.count),
          attempts: Number(r.attempts),
          event: toStoredEvent(r),
        }),
      ),
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

/** The schema file without its leading comment lines (inlined by build.mts). */
export const notifySchemaStatements = (schema: string) => schema.replace(/^--.*\n/gm, "");
