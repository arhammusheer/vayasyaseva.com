// Generated from integrations/windmill/notify/scripts/alertmanager.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

import { timingSafeEqual } from "node:crypto";

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

// integrations/windmill/notify/lib/alertmanager.ts
const { IGNORED_ALERTS, alertSeverity, alertmanagerEvents } = (() => {
const IGNORED_ALERTS = ["Watchdog", "InfoInhibitor"];
const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v) => (typeof v === "string" ? v : "");
function alertSeverity(label) {
    switch (label.toLowerCase()) {
        case "critical":
        case "page":
            return "critical";
        case "warning":
            return "warning";
        case "info":
        case "none":
            return "info";
        default:
            return "notice";
    }
}
const validTime = (v) => v && !v.startsWith("0001-") && !Number.isNaN(Date.parse(v));
function alertmanagerEvents(payload) {
    if (!isRecord(payload) || !Array.isArray(payload.alerts))
        return { events: [], ignored: 0, errors: ["not an Alertmanager webhook payload (no alerts)"] };
    if (payload.version !== undefined && String(payload.version) !== "4")
        return { events: [], ignored: 0, errors: [`unsupported webhook version ${String(payload.version)}`] };
    const externalUrl = text(payload.externalURL).replace(/\/$/, "");
    const events = [];
    const errors = [];
    let ignored = 0;
    payload.alerts.forEach((alert, i) => {
        if (!isRecord(alert) || !isRecord(alert.labels))
            return void errors.push(`alerts[${i}] has no labels`);
        const labels = alert.labels;
        const annotations = isRecord(alert.annotations) ? alert.annotations : {};
        const name = text(labels.alertname) || "Alert";
        if (IGNORED_ALERTS.includes(name))
            return void ignored++;
        const fingerprint = text(alert.fingerprint);
        if (!fingerprint)
            return void errors.push(`alerts[${i}] has no fingerprint`);
        const status = text(alert.status) === "resolved" ? "resolved" : "firing";
        const namespace = text(labels.namespace);
        const summary = [text(annotations.summary), text(annotations.description)].filter(Boolean).join(" ") || name;
        const occurredAt = status === "resolved" && validTime(text(alert.endsAt)) ? text(alert.endsAt) : validTime(text(alert.startsAt)) ? text(alert.startsAt) : undefined;
        const labelLines = Object.entries(labels)
            .filter(([k]) => k !== "alertname")
            .map(([k, v]) => `  ${k}=${text(v)}`)
            .sort();
        events.push({
            source: "alertmanager",
            type: `alert.${name.replace(/[^A-Za-z0-9_-]/g, "_")}`,
            severity: alertSeverity(text(labels.severity)),
            dedupeKey: `am:${fingerprint}`,
            status,
            ...(occurredAt ? { occurredAt } : {}),
            title: namespace ? `${name} (${namespace})` : name,
            summary,
            body: [text(annotations.description) || text(annotations.summary), "", "Labels:", ...labelLines, text(annotations.runbook_url) ? `\nRunbook: ${text(annotations.runbook_url)}` : ""].join("\n").trim(),
            ...(/^https?:\/\//.test(externalUrl) ? { link: { label: "Alertmanager", url: `${externalUrl}/#/alerts` } } : {}),
        });
    });
    return { events, ignored, errors };
}
  return { IGNORED_ALERTS, alertSeverity, alertmanagerEvents };
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

// integrations/windmill/notify/lib/http.ts
const { lowerHeaders, notifySecretMatches, bearer } = (() => {
function lowerHeaders(event) {
    return Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
}
function notifySecretMatches(given, expected) {
    if (!given || !expected)
        return false;
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}
function bearer(value) {
    const m = value?.match(/^Bearer\s+(.+)$/i);
    return m ? m[1].trim() : undefined;
}
  return { lowerHeaders, notifySecretMatches, bearer };
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

export const SECRET_HEADER = "authorization";
export async function preprocessor(event) {
    const authorized = notifySecretMatches(bearer(lowerHeaders(event)[SECRET_HEADER]), await notifyConfig("alertmanager_secret"));
    return { authorized, body: authorized ? (event.body ?? null) : null };
}
export async function main(authorized, body) {
    if (!authorized)
        return respond(403, { ok: false, error: "Forbidden" });
    const mapped = alertmanagerEvents(body);
    if (mapped.errors.length && mapped.events.length === 0 && mapped.ignored === 0)
        return respond(400, { ok: false, errors: mapped.errors });
    const now = new Date();
    const valid = mapped.events.map((e) => validateEvent({ v: 1, ...e }, now)).flatMap((c) => (c.ok ? [c.event] : []));
    try {
        const ids = await withNotifyDb(async (sql) => {
            const store = pgNotifyStore(sql);
            const out = [];
            for (const e of valid)
                out.push(await store.insertEvent(e, now));
            return out;
        });
        return respond(200, { ok: true, queued: ids.length, ignored: mapped.ignored, errors: mapped.errors });
    }
    catch (err) {
        console.error("notify alertmanager failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
        return respond(500, { ok: false, error: "Internal error" });
    }
}

