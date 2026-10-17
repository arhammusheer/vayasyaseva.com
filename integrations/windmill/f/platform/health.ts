// Generated from integrations/windmill/platform/scripts/health.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

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

// integrations/windmill/talent/lib/mask.ts
const { maskIds, maskDeep } = (() => {
  function maskIds(value) {
      return value
          .replace(/\b([2-9]\d{3})[ -]?(\d{4})[ -]?(\d{4})\b/g, (_m, _a, _b, last) => `XXXX XXXX ${last}`)
          .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[PAN removed]");
  }
  function maskDeep(value) {
      if (typeof value === "string")
          return maskIds(value);
      if (Array.isArray(value))
          return value.map(maskDeep);
      if (value && typeof value === "object") {
          return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskDeep(v)]));
      }
      return value;
  }
  return { maskIds, maskDeep };
})();

// integrations/windmill/notify/lib/event.ts
const { EVENT_SOURCES, SEVERITIES, STATUSES, TITLE_MAX, SUMMARY_MAX, BODY_MAX, scrubText, validateEvent, maskPhone, telUrl } = (() => {
  const EVENT_SOURCES = ["talent", "leads", "seo-watch", "compliance", "platform", "alertmanager", "github", "website"];
  const SEVERITIES = ["info", "notice", "warning", "critical"];
  const STATUSES = ["firing", "resolved"];
  const TITLE_MAX = 80;
  const SUMMARY_MAX = 500;
  const BODY_MAX = 20_000;
  const PII_MAX = 200;
  const PHONE_LIKE = /(?<![\w/=-])\+?\d(?:[\s.-]?\d){9,14}(?![\w/-])/g;
  const EMAIL_LIKE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
  function scrubText(value) {
      return maskIds(value).replace(EMAIL_LIKE, "[email removed]").replace(PHONE_LIKE, "[phone removed]");
  }
  const clip = (value, max) => (value.length <= max ? value : `${value.slice(0, max - 1)}…`);
  const oneLine = (value) => value.replace(/\s+/g, " ").trim();
  const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
  const str = (v) => (typeof v === "string" ? v : undefined);
  function validateEvent(input, now = new Date()) {
      if (!isRecord(input))
          return { ok: false, errors: ["event must be an object"] };
      const errors = [];
      if (input.v !== 1)
          errors.push("v must be 1");
      const source = str(input.source);
      if (!source || !EVENT_SOURCES.includes(source))
          errors.push(`source must be one of ${EVENT_SOURCES.join(", ")}`);
      const type = str(input.type);
      if (!type || !/^[a-z][a-z0-9_]*(\.[a-zA-Z0-9_-]+)+$/.test(type) || type.length > 100)
          errors.push("type must be dotted, e.g. lead.received");
      const severity = str(input.severity);
      if (!severity || !SEVERITIES.includes(severity))
          errors.push(`severity must be one of ${SEVERITIES.join(", ")}`);
      const dedupeKey = str(input.dedupeKey);
      if (!dedupeKey || dedupeKey.length > 200)
          errors.push("dedupeKey is required (≤ 200 characters)");
      const status = input.status === undefined || input.status === null ? undefined : str(input.status);
      if (status !== undefined && !STATUSES.includes(status))
          errors.push("status must be firing or resolved");
      const occurred = str(input.occurredAt);
      const occurredAt = occurred && !Number.isNaN(Date.parse(occurred)) ? new Date(occurred) : null;
      if (occurred !== undefined && !occurredAt)
          errors.push("occurredAt must be an ISO 8601 time");
      const title = str(input.title);
      if (!title?.trim())
          errors.push("title is required");
      const summary = str(input.summary);
      if (summary === undefined)
          errors.push("summary is required");
      if (input.body !== undefined && input.body !== null && typeof input.body !== "string")
          errors.push("body must be text");
      let link;
      if (input.link !== undefined && input.link !== null) {
          const l = isRecord(input.link) ? input.link : {};
          const url = str(l.url);
          if (!url || !/^https?:\/\//.test(url) || url.length > 2000)
              errors.push("link.url must be an http(s) URL");
          else
              link = { label: clip(oneLine(scrubText(str(l.label) ?? "Open")), 40), url };
      }
      let pii;
      if (input.pii !== undefined && input.pii !== null) {
          if (!isRecord(input.pii))
              errors.push("pii must be an object");
          else {
              pii = {};
              for (const key of ["name", "phone", "email", "company"]) {
                  const value = input.pii[key];
                  if (value === undefined || value === null || value === "")
                      continue;
                  if (typeof value !== "string")
                      errors.push(`pii.${key} must be text`);
                  else if (key === "phone") {
                      const phone = value.replace(/[^\d+]/g, "");
                      if (!/^\+?\d{6,15}$/.test(phone))
                          errors.push("pii.phone must be a phone number");
                      else
                          pii.phone = phone;
                  }
                  else
                      pii[key] = clip(oneLine(maskIds(value)), PII_MAX);
              }
              if (Object.keys(pii).length === 0)
                  pii = undefined;
          }
      }
      if (errors.length)
          return { ok: false, errors };
      return {
          ok: true,
          event: {
              v: 1,
              source: source,
              type: type,
              severity: severity,
              dedupeKey: dedupeKey,
              ...(status ? { status: status } : {}),
              occurredAt: (occurredAt ?? now).toISOString(),
              title: clip(oneLine(scrubText(title)), TITLE_MAX),
              summary: clip(scrubText(summary).trim(), SUMMARY_MAX),
              ...(typeof input.body === "string" && input.body.trim() ? { body: clip(maskIds(input.body), BODY_MAX) } : {}),
              ...(link ? { link } : {}),
              ...(pii ? { pii } : {}),
          },
      };
  }
  function maskPhone(phone) {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 4)
          return "XXXX";
      const last = digits.slice(-4);
      if (digits.length === 12 && digits.startsWith("91"))
          return `+91 XXXXXX${last}`;
      return `${"X".repeat(Math.max(2, digits.length - 4))}${last}`;
  }
  function telUrl(phone) {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 6)
          return null;
      if (digits.length === 10 && /^[6-9]/.test(digits))
          return `tel:+91${digits}`;
      if (digits.length === 12 && /^91[6-9]/.test(digits))
          return `tel:+${digits}`;
      return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits}`;
  }
  return { EVENT_SOURCES, SEVERITIES, STATUSES, TITLE_MAX, SUMMARY_MAX, BODY_MAX, scrubText, validateEvent, maskPhone, telUrl };
})();

// integrations/windmill/notify/lib/emit.ts
const { InvalidEventError, emit, tryEmit } = (() => {
  class InvalidEventError extends Error {
      errors;
      constructor(errors) {
          super(`invalid notification event: ${errors.join("; ")}`);
          this.name = "InvalidEventError";
          this.errors = errors;
      }
  }
  async function emit(input, options = {}) {
      const now = options.now ?? new Date();
      const checked = validateEvent({ v: 1, ...input }, now);
      if (!checked.ok)
          throw new InvalidEventError(checked.errors);
      if (options.store)
          return options.store.insertEvent(checked.event, now);
      return withNotifyDb((sql) => pgNotifyStore(sql).insertEvent(checked.event, now));
  }
  async function tryEmit(input, options = {}) {
      try {
          await emit(input, options);
          return true;
      }
      catch (err) {
          console.error("notify: emit failed:", err instanceof InvalidEventError ? err.message : err instanceof Error ? err.name : "unknown error");
          return false;
      }
  }
  return { InvalidEventError, emit, tryEmit };
})();

// integrations/windmill/platform/lib/health-notify.ts
const { HEALTH_KEY_PREFIX, describeKey, healthConditions, healthEvents, notifyHealth } = (() => {
  const HEALTH_KEY_PREFIX = "platform:health:";
  const OPERATIONS = "https://github.com/arhammusheer/vayasyaseva.com/blob/main/integrations/windmill/OPERATIONS.md";
  const REASONS = {
      dead: {
          type: "platform.deliveries_dead",
          severity: "warning",
          what: (t) => `${t} deliveries stopped (attempt cap)`,
          next: "Fix the cause, then reset the rows (OPERATIONS.md, stuck and dead work).",
      },
      unknown: {
          type: "platform.sms_unknown",
          severity: "notice",
          what: () => "SMS sends interrupted (unknown)",
          next: "Check Fast2SMS's delivery history, then retry or settle each by hand (OPERATIONS.md). Never resent automatically.",
      },
      stuck: {
          type: "platform.deliveries_stuck",
          severity: "warning",
          what: (t) => `${t} deliveries running for over 15 minutes`,
          next: "A run may have crashed; the dispatcher recovers them. If this stays, check the Windmill runs.",
      },
      overdue: {
          type: "platform.deliveries_overdue",
          severity: "critical",
          what: (t) => `${t} deliveries overdue by an hour`,
          next: "The dispatcher or the lead sync is not running: check its schedule and the Windmill workers.",
      },
  };
  const DATABASES = { talent: "Job applications", leads: "Lead inbox" };
  const TARGETS = { sms: "SMS", chatwoot: "Chatwoot", crm: "Twenty" };
  function describeKey(key) {
      const [db, reason, target = ""] = key.slice(HEALTH_KEY_PREFIX.length).split(":");
      const where = DATABASES[db] ?? db;
      if (reason === "unreadable")
          return { key, type: "platform.db_unreadable", severity: "critical", title: `${where}: health check cannot read the database` };
      if (reason === "erasure_failed")
          return { key, type: "platform.erasure_failed", severity: "warning", title: `${where}: erasure requests failed` };
      const r = REASONS[reason];
      if (!r)
          return { key, type: "platform.health", severity: "warning", title: `${where}: ${reason}` };
      return { key, type: r.type, severity: r.severity, title: `${where}: ${r.what(TARGETS[target] ?? target)}` };
  }
  function healthConditions(health) {
      const firing = [];
      const checked = [];
      for (const db of Object.keys(DATABASES)) {
          const counts = health[db];
          if (!counts) {
              firing.push({
                  ...describeKey(`${HEALTH_KEY_PREFIX}${db}:unreadable`),
                  summary: "f/platform/health could not read it, so dead or stuck work there would go unseen. Check pg-main and the Windmill variable.",
              });
              continue;
          }
          checked.push(db);
          for (const reason of Object.keys(REASONS)) {
              for (const [target, count] of Object.entries(counts[reason])) {
                  if (!count)
                      continue;
                  firing.push({
                      ...describeKey(`${HEALTH_KEY_PREFIX}${db}:${reason}:${target}`),
                      summary: `${count} now${counts.oldest ? `; the oldest open item in this database dates from ${counts.oldest.slice(0, 16).replace("T", " ")} UTC` : ""}. ${REASONS[reason].next}`,
                  });
              }
          }
      }
      const erasure = health.talent?.erasureFailed ?? 0;
      if (erasure) {
          firing.push({
              ...describeKey(`${HEALTH_KEY_PREFIX}talent:erasure_failed`),
              summary: `${erasure} failed after three attempts. The person's data is still held: fix the cause and requeue (OPERATIONS.md, retention and erasure).`,
          });
      }
      return { firing, checked };
  }
  const event = (c, status) => ({
      source: "platform",
      type: c.type,
      severity: c.severity,
      dedupeKey: c.key,
      status,
      title: c.title,
      summary: c.summary,
      link: { label: "Operations", url: OPERATIONS },
  });
  async function healthEvents(health, store) {
      const { firing, checked } = healthConditions(health);
      const known = await store.keyStatuses(HEALTH_KEY_PREFIX);
      const events = [];
      const result = { fired: [], resolved: [], unchanged: 0 };
      const now = new Set(firing.map((c) => c.key));
      for (const c of firing) {
          if (known[c.key] === "firing")
              result.unchanged++;
          else {
              events.push(event(c, "firing"));
              result.fired.push(c.key);
          }
      }
      for (const [key, status] of Object.entries(known)) {
          if (status !== "firing" || now.has(key))
              continue;
          const [db, reason] = key.slice(HEALTH_KEY_PREFIX.length).split(":");
          if (reason !== "unreadable" && !checked.includes(db))
              continue;
          events.push(event({ ...describeKey(key), summary: "Clear at the latest health check." }, "resolved"));
          result.resolved.push(key);
      }
      return { events, result };
  }
  async function notifyHealth(health, store, now = new Date()) {
      const { events, result } = await healthEvents(health, store);
      for (const e of events)
          await emit(e, { store, now });
      return result;
  }
  return { HEALTH_KEY_PREFIX, describeKey, healthConditions, healthEvents, notifyHealth };
})();

// integrations/windmill/platform/lib/run-health.ts
const { HEALTH_COUNTS, HEALTH_ERASURE, runHealth } = (() => {
  const HEALTH_COUNTS = `
  SELECT target, reason, count(*)::int AS count, min(updated_at) AS oldest
  FROM deliveries_attention GROUP BY target, reason ORDER BY target, reason;`;
  const HEALTH_ERASURE = `SELECT count(*)::int AS failed FROM erasure_requests WHERE status = 'failed';`;
  const empty = () => ({ dead: {}, unknown: {}, stuck: {}, overdue: {}, oldest: null });
  async function counts(query) {
      const out = empty();
      for (const row of await query(HEALTH_COUNTS)) {
          out[row.reason][row.target] = row.count;
          const oldest = new Date(row.oldest).toISOString();
          if (!out.oldest || oldest < out.oldest)
              out.oldest = oldest;
      }
      return out;
  }
  const total = (c) => (c ? ["dead", "unknown", "stuck", "overdue"].reduce((n, r) => n + Object.values(c[r]).reduce((a, b) => a + b, 0), 0) : 0);
  async function runHealth(db, now = new Date()) {
      const errors = [];
      const talent = await db
          .talent(async (q) => ({ ...(await counts(q)), erasureFailed: (await q(HEALTH_ERASURE))[0]?.failed ?? 0 }))
          .catch((err) => (errors.push(`talent: ${err instanceof Error ? err.message : "unknown error"}`), null));
      const leads = await db.leads(counts).catch((err) => (errors.push(`leads: ${err instanceof Error ? err.message : "unknown error"}`), null));
      return {
          ok: errors.length === 0 && total(talent) === 0 && total(leads) === 0 && (talent?.erasureFailed ?? 0) === 0,
          checkedAt: now.toISOString(),
          talent,
          leads,
          errors,
      };
  }
  return { HEALTH_COUNTS, HEALTH_ERASURE, runHealth };
})();

export async function main() {
    const health = await runHealth({ talent: (fn) => withTalentDb(fn), leads: (fn) => withDatabase("leads_pg_url", fn) });
    try {
        const notified = await withNotifyDb((sql) => notifyHealth(health, pgNotifyStore(sql)));
        return { ...health, notified };
    }
    catch (err) {
        console.error("health: notify failed:", err instanceof Error ? err.name : "unknown error");
        return { ...health, notified: null };
    }
}

