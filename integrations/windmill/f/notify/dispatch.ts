// Generated from integrations/windmill/notify/scripts/dispatch.ts by integrations/windmill/build.mts. Edit the source, not this.

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

// integrations/windmill/notify/lib/policy.ts
const { PUSH_MODES, EMAIL_MODES, PII_LEVELS, DEFAULT_PRIORITY, RESOLVED_PRIORITY, DEFAULT_POLICY, policyErrors, parsePolicy, resolveRoute, freshState, decide, sweepDecision } = (() => {
const PUSH_MODES = ["instant", "one_line", "firing_daily", "collapsed_hourly", "none"];
const EMAIL_MODES = ["instant", "digest", "none"];
const PII_LEVELS = ["full", "masked", "none"];
const DEFAULT_PRIORITY = { info: 3, notice: 3, warning: 4, critical: 5 };
const RESOLVED_PRIORITY = 2;
const DEFAULT_POLICY = {
    v: 1,
    topic: "vspl-ops",
    criticalEmail: true,
    fallbackEmail: ["critical"],
    reminderHours: 24,
    collapseMinutes: 60,
    rules: [
        {
            name: "New job application: instant, name and full phone, Call",
            match: { type: "application.received" },
            push: { mode: "instant", pii: "full", call: true, topic: "vspl-jobs", priority: { info: 4, notice: 4 } },
            email: "digest",
        },
        {
            name: "Business lead: instant, masked phone; qualified (notice) higher",
            match: { type: "lead.received" },
            push: { mode: "instant", pii: "masked", topic: "vspl-leads", priority: { info: 3, notice: 4 } },
            email: "none",
        },
        {
            name: "Lead not filed or not emailed",
            match: { type: ["lead.forward_failed", "lead.email_failed"] },
            push: { mode: "instant", topic: "vspl-leads", priority: { info: 4, notice: 4, warning: 4 } },
            email: "instant",
        },
        { name: "SEO weekly report: email only (search data stays off the lock screen)", match: { type: "seo.weekly_report" }, push: { mode: "none" }, email: "instant" },
        { name: "SEO rule tripped", match: { type: "seo.rule_tripped" }, push: { mode: "instant" }, email: "instant" },
        { name: "Compliance source changed (GitHub issue)", match: { type: "compliance.source_changed" }, push: { mode: "instant" }, email: "instant" },
        {
            name: "A monitor did not run",
            match: { type: ["compliance.monitor_failed", "seo.watch_failed"] },
            push: { mode: "instant", priority: { info: 4, notice: 4 } },
            email: "instant",
        },
        { name: "Platform: when firing starts, then daily", match: { type: "platform.*" }, push: { mode: "firing_daily" }, email: "digest" },
        { name: "Windmill job failures, per script, hourly", match: { type: "windmill.job_failed" }, push: { mode: "collapsed_hourly" }, email: "digest" },
        { name: "Alertmanager critical", match: { source: "alertmanager", severity: ["critical"] }, push: { mode: "instant" }, email: "instant" },
        { name: "Alertmanager warning and below", match: { source: "alertmanager" }, push: { mode: "instant" }, email: "digest" },
        { name: "Search pipeline failed", match: { type: "search.pipeline_failed" }, push: { mode: "instant", priority: { info: 4, notice: 4 } }, email: "none" },
        { name: "Everything else: digest only", match: { type: "*" }, push: { mode: "none" }, email: "digest" },
    ],
};
const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function policyErrors(input) {
    if (!isRecord(input))
        return ["policy must be a JSON object"];
    const errors = [];
    if (input.v !== 1)
        errors.push("v must be 1");
    if (typeof input.topic !== "string" || !/^[\w-]{1,64}$/.test(input.topic))
        errors.push("topic must be a ntfy topic name");
    if (!Array.isArray(input.rules) || input.rules.length === 0)
        return [...errors, "rules must be a non-empty list"];
    input.rules.forEach((rule, i) => {
        const at = `rules[${i}]`;
        if (!isRecord(rule) || !isRecord(rule.match) || !isRecord(rule.push))
            return void errors.push(`${at} needs match and push`);
        if (!PUSH_MODES.includes(rule.push.mode))
            errors.push(`${at}.push.mode must be one of ${PUSH_MODES.join(", ")}`);
        if (rule.push.pii !== undefined && !PII_LEVELS.includes(rule.push.pii))
            errors.push(`${at}.push.pii must be one of ${PII_LEVELS.join(", ")}`);
        if (rule.push.call && rule.push.pii !== "full")
            errors.push(`${at}.push.call needs pii full`);
        if (rule.push.topic !== undefined && (typeof rule.push.topic !== "string" || !/^[\w-]{1,64}$/.test(rule.push.topic)))
            errors.push(`${at}.push.topic must be a ntfy topic name`);
        if (!EMAIL_MODES.includes(rule.email))
            errors.push(`${at}.email must be one of ${EMAIL_MODES.join(", ")}`);
        const sev = rule.match.severity;
        if (sev !== undefined && (!Array.isArray(sev) || sev.some((s) => !SEVERITIES.includes(s))))
            errors.push(`${at}.match.severity must list severities`);
    });
    for (const key of ["reminderHours", "collapseMinutes"]) {
        if (typeof input[key] !== "number" || !(input[key] > 0))
            errors.push(`${key} must be a positive number`);
    }
    return errors;
}
function parsePolicy(text) {
    if (!text?.trim())
        return { policy: DEFAULT_POLICY, problem: "f/notify/policy is empty" };
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch {
        return { policy: DEFAULT_POLICY, problem: "f/notify/policy is not valid JSON" };
    }
    const errors = policyErrors(parsed);
    if (errors.length)
        return { policy: DEFAULT_POLICY, problem: `f/notify/policy: ${errors.join("; ")}` };
    const p = parsed;
    return { policy: { ...p, criticalEmail: p.criticalEmail !== false, fallbackEmail: Array.isArray(p.fallbackEmail) ? p.fallbackEmail : ["critical"] }, problem: null };
}
function typeMatches(pattern, type) {
    if (pattern === "*")
        return true;
    if (pattern.endsWith(".*"))
        return type.startsWith(pattern.slice(0, -1));
    return pattern === type;
}
const NO_RULE = { name: "(no rule matched)", match: {}, push: { mode: "none" }, email: "digest" };
function resolveRoute(policy, event) {
    const rule = policy.rules.find((r) => {
        const types = r.match.type === undefined ? null : Array.isArray(r.match.type) ? r.match.type : [r.match.type];
        if (types && !types.some((t) => typeMatches(t, event.type)))
            return false;
        if (r.match.source !== undefined && r.match.source !== event.source)
            return false;
        if (r.match.severity && !r.match.severity.includes(event.severity))
            return false;
        return true;
    }) ?? NO_RULE;
    const pii = rule.push.pii ?? "none";
    const email = event.severity === "critical" && policy.criticalEmail ? "instant" : rule.email;
    return {
        rule: rule.name,
        push: rule.push.mode,
        pii,
        call: Boolean(rule.push.call) && pii === "full",
        topic: rule.push.topic ?? policy.topic,
        priority: clampPriority(rule.push.priority?.[event.severity] ?? DEFAULT_PRIORITY[event.severity]),
        email,
    };
}
const clampPriority = (n) => Math.min(5, Math.max(1, Math.round(n)));
const freshState = () => ({ status: null, firingPushed: false, firingEmailed: false, lastPushAt: null, pendingCount: 0, seenCount: 0 });
const minutesSince = (iso, now) => (iso ? (now.getTime() - Date.parse(iso)) / 60_000 : Infinity);
function decide(event, route, prev, now, policy = DEFAULT_POLICY) {
    const state = { ...(prev ?? freshState()), seenCount: (prev?.seenCount ?? 0) + 1 };
    const pushes = route.push !== "none";
    const emailNow = route.email === "instant" ? { kind: "event" } : null;
    const digest = route.email === "digest";
    const nothing = (s) => ({ push: null, email: null, digest: false, duplicate: true, state: s });
    const nowIso = now.toISOString();
    if (route.push === "collapsed_hourly" && !event.status) {
        let push = null;
        if (minutesSince(state.lastPushAt, now) >= policy.collapseMinutes) {
            push = { kind: state.pendingCount > 0 ? "collapsed" : "event", count: state.pendingCount + 1 };
            state.pendingCount = 0;
            state.lastPushAt = nowIso;
        }
        else {
            state.pendingCount += 1;
        }
        return { push, email: emailNow, digest, duplicate: false, state };
    }
    if (!event.status) {
        if (prev)
            return nothing(state);
        if (pushes)
            state.lastPushAt = nowIso;
        return { push: pushes ? { kind: "event", count: 1 } : null, email: emailNow, digest, duplicate: false, state };
    }
    if (event.status === "firing") {
        if (prev?.status === "firing")
            return nothing(state);
        state.status = "firing";
        state.firingPushed = pushes;
        state.firingEmailed = emailNow !== null;
        state.pendingCount = 0;
        if (pushes)
            state.lastPushAt = nowIso;
        return { push: pushes ? { kind: "event", count: 1 } : null, email: emailNow, digest, duplicate: false, state };
    }
    if (prev?.status !== "firing")
        return nothing({ ...state, status: prev?.status ?? "resolved" });
    const push = prev.firingPushed ? { kind: "resolved", count: 1 } : null;
    const email = prev.firingEmailed ? { kind: "resolved" } : null;
    state.status = "resolved";
    state.firingPushed = false;
    state.firingEmailed = false;
    if (push)
        state.lastPushAt = nowIso;
    return { push, email, digest, duplicate: false, state };
}
function sweepDecision(state, route, now, policy = DEFAULT_POLICY) {
    if (route.push === "firing_daily" && state.status === "firing" && state.firingPushed && minutesSince(state.lastPushAt, now) >= policy.reminderHours * 60) {
        return { push: { kind: "reminder", count: 1 }, state: { ...state, lastPushAt: now.toISOString() } };
    }
    if (route.push === "collapsed_hourly" && state.pendingCount > 0 && minutesSince(state.lastPushAt, now) >= policy.collapseMinutes) {
        return { push: { kind: "collapsed", count: state.pendingCount }, state: { ...state, pendingCount: 0, lastPushAt: now.toISOString() } };
    }
    return null;
}
  return { PUSH_MODES, EMAIL_MODES, PII_LEVELS, DEFAULT_PRIORITY, RESOLVED_PRIORITY, DEFAULT_POLICY, policyErrors, parsePolicy, resolveRoute, freshState, decide, sweepDecision };
})();

// integrations/windmill/notify/lib/render.ts
const { IST, istTime, piiLines, renderPush, renderEmail, DIGEST_ITEMS_PER_TYPE, groupDigest, renderDigest } = (() => {
const SEVERITY_TAG = { info: "information_source", notice: "bell", warning: "warning", critical: "rotating_light" };
const clip = (value, max) => (value.length <= max ? value : `${value.slice(0, max - 1)}…`);
const firstLine = (value) => value.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
const IST = "Asia/Kolkata";
function istTime(iso, withDate = true) {
    const d = new Date(iso);
    const time = d.toLocaleTimeString("en-IN", { timeZone: IST, hour: "2-digit", minute: "2-digit", hour12: false });
    if (!withDate)
        return time;
    return `${d.toLocaleDateString("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric" })} ${time} IST`;
}
function piiLines(event, route) {
    const pii = event.pii;
    if (!pii || route.pii === "none")
        return [];
    if (route.pii === "full") {
        return [[pii.name, pii.phone].filter(Boolean).join(" · "), [pii.company, pii.email].filter(Boolean).join(" · ")].filter(Boolean);
    }
    return [[pii.name, pii.company, pii.phone ? maskPhone(pii.phone) : undefined].filter(Boolean).join(" · ")].filter(Boolean);
}
function renderPush(event, route, delivery) {
    const tags = [delivery.kind === "resolved" ? "white_check_mark" : SEVERITY_TAG[event.severity], event.source];
    const base = { topic: route.topic, tags, ...(event.link ? { click: event.link.url } : {}) };
    const linkAction = event.link ? [{ action: "view", label: event.link.label, url: event.link.url }] : [];
    if (delivery.kind === "resolved") {
        return { ...base, title: clip(`Resolved: ${event.title}`, 100), message: clip(firstLine(event.summary) || event.title, 300), priority: RESOLVED_PRIORITY, actions: linkAction };
    }
    if (delivery.kind === "reminder") {
        return {
            ...base,
            title: clip(`Still firing: ${event.title}`, 100),
            message: clip(`Firing since ${istTime(event.occurredAt)}. ${firstLine(event.summary)}`.trim(), 300),
            priority: Math.min(route.priority, 3),
            actions: linkAction,
        };
    }
    if (delivery.kind === "collapsed") {
        return {
            ...base,
            title: clip(`${event.title} (${delivery.count} times)`, 100),
            message: clip(`${delivery.count} times since the last notice; latest ${istTime(event.occurredAt, false)}. ${firstLine(event.summary)}`.trim(), 300),
            priority: route.priority,
            actions: linkAction,
        };
    }
    if (route.push === "one_line") {
        return { ...base, title: event.title, message: clip(firstLine(event.summary) || event.title, 140), priority: route.priority, actions: linkAction };
    }
    const people = piiLines(event, route);
    const actions = [];
    const tel = route.call && route.pii === "full" && event.pii?.phone ? telUrl(event.pii.phone) : null;
    if (tel)
        actions.push({ action: "view", label: "Call", url: tel, clear: false });
    actions.push(...linkAction);
    const message = [...people, event.summary.trim()].filter(Boolean).join("\n") || event.title;
    return { ...base, title: event.title, message: clip(message, 1000), priority: route.priority, actions: actions.slice(0, 3) };
}
function renderEmail(event, kind) {
    const label = kind === "resolved" ? "Resolved: " : kind === "fallback" ? "Push failed, by email: " : event.severity === "critical" ? "[critical] " : event.severity === "warning" ? "[warning] " : "";
    const lines = [
        event.summary.trim(),
        kind !== "resolved" && event.body ? `\n${event.body.trim()}` : "",
        event.link ? `\n${event.link.label}: ${event.link.url}` : "",
        `\n${event.source} · ${event.type}${event.status ? ` · ${kind === "resolved" ? "resolved" : event.status}` : ""} · ${istTime(event.occurredAt)}`,
        kind === "fallback" ? "\nThis was meant to be a push notification; ntfy did not accept it after every try. Check ntfy (apps/ntfy)." : "",
    ];
    return { subject: clip(`${label}${event.title}`, 150), text: `${lines.filter(Boolean).join("\n")}\n` };
}
const SEVERITY_RANK = { critical: 3, warning: 2, notice: 1, info: 0 };
const DIGEST_ITEMS_PER_TYPE = 10;
function groupDigest(items) {
    const bySource = new Map();
    for (const item of items) {
        const types = bySource.get(item.source) ?? new Map();
        bySource.set(item.source, types);
        const list = types.get(item.type) ?? [];
        types.set(item.type, list);
        list.push(item);
    }
    const worst = (list) => Math.max(...list.map((i) => SEVERITY_RANK[i.severity]));
    return [...bySource.entries()]
        .map(([source, types]) => {
        const all = [...types.values()].flat();
        return {
            source,
            count: all.length,
            worst: worst(all),
            types: [...types.entries()]
                .map(([type, list]) => ({ type, count: list.length, items: [...list].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)) }))
                .sort((a, b) => worst(b.items) - worst(a.items) || b.count - a.count || a.type.localeCompare(b.type)),
        };
    })
        .sort((a, b) => b.worst - a.worst || b.count - a.count || a.source.localeCompare(b.source))
        .map((g) => ({ source: g.source, count: g.count, types: g.types }));
}
function renderDigest(items, since, now) {
    const groups = groupDigest(items);
    const day = now.toLocaleDateString("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric" });
    const out = [`${items.length} ${items.length === 1 ? "event" : "events"} since ${istTime(since.toISOString())}.`, ""];
    for (const g of groups) {
        out.push(`${g.source} (${g.count})`);
        for (const t of g.types) {
            out.push(`  ${t.type} × ${t.count}`);
            for (const i of t.items.slice(-DIGEST_ITEMS_PER_TYPE)) {
                const mark = i.severity === "critical" || i.severity === "warning" ? ` [${i.severity}]` : "";
                out.push(`    · ${istTime(i.occurredAt, false)}${mark}${i.status === "resolved" ? " resolved:" : ""} ${i.title}${i.link ? ` <${i.link.url}>` : ""}`);
            }
            if (t.items.length > DIGEST_ITEMS_PER_TYPE)
                out.push(`    · and ${t.items.length - DIGEST_ITEMS_PER_TYPE} earlier`);
        }
        out.push("");
    }
    out.push("Events that had their own email are not repeated here. Routing: Windmill variable f/notify/policy.");
    return { subject: `VSPL daily digest · ${day} · ${items.length} ${items.length === 1 ? "event" : "events"}`, text: `${out.join("\n")}\n`, groups };
}
  return { IST, istTime, piiLines, renderPush, renderEmail, DIGEST_ITEMS_PER_TYPE, groupDigest, renderDigest };
})();

// integrations/windmill/notify/lib/dispatch.ts
const { MAX_ATTEMPTS, RETRY_DELAYS_MS, ROUTE_BATCH, SEND_BATCH, PII_MAX_HOURS, EVENT_RETENTION_DAYS, runDispatch, DIGEST_LIMIT, runDigest } = (() => {
const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [60_000, 2 * 60_000, 5 * 60_000];
const ROUTE_BATCH = 100;
const SEND_BATCH = 10;
const PII_MAX_HOURS = 24;
const EVENT_RETENTION_DAYS = 90;
async function runDispatch(deps) {
    const clock = deps.now ?? (() => new Date());
    const { store, policy } = deps;
    const started = clock();
    const result = { recovered: 0, routed: 0, duplicates: 0, swept: 0, sent: 0, retrying: 0, failed: 0, fallbacks: 0, piiCleared: 0 };
    result.recovered = await store.recoverStuck(started, MAX_ATTEMPTS);
    await store.transaction(async (tx) => {
        for (const event of await tx.claimUnrouted(ROUTE_BATCH)) {
            const route = resolveRoute(policy, event);
            const prev = await tx.lockKey(event.dedupeKey);
            const d = decide(event, route, prev, started, policy);
            await tx.saveKey(event.dedupeKey, d.state, d.duplicate ? null : event.id, started);
            if (d.push)
                await tx.addDelivery(event.id, "push", d.push.kind, d.push.count, started);
            if (d.email)
                await tx.addDelivery(event.id, "email", d.email.kind, 1, started);
            const keepPii = Boolean(event.pii) && d.push?.kind === "event" && route.pii !== "none";
            await tx.markRouted(event.id, { rule: route.rule, duplicate: d.duplicate, digest: d.digest, keepPii }, started);
            result.routed++;
            if (d.duplicate)
                result.duplicates++;
        }
    });
    await store.transaction(async (tx) => {
        for (const c of await tx.claimSweepKeys(started, policy.reminderHours * 60, policy.collapseMinutes, ROUTE_BATCH)) {
            const due = sweepDecision(c.state, resolveRoute(policy, c.event), started, policy);
            if (!due)
                continue;
            await tx.saveKey(c.key, due.state, null, started);
            await tx.addDelivery(c.event.id, "push", due.push.kind, due.push.count, started);
            result.swept++;
        }
    });
    const budget = deps.budgetMs ?? 40_000;
    while (clock().getTime() - started.getTime() < budget) {
        const batch = await store.claimDeliveries(clock(), SEND_BATCH, MAX_ATTEMPTS);
        if (batch.length === 0)
            break;
        for (const delivery of batch)
            await send(deps, delivery, clock(), result);
    }
    result.piiCleared = await store.clearPiiBefore(new Date(clock().getTime() - PII_MAX_HOURS * 3_600_000));
    return result;
}
async function send(deps, d, now, result) {
    const { store, policy } = deps;
    const route = resolveRoute(policy, d.event);
    const outcome = d.channel === "push"
        ? await deps.ntfy.publish(renderPush(d.event, route, d))
        : await deps.resend.send(renderEmail(d.event, d.kind), `vspl-notify-delivery-${d.id}`);
    if (outcome.ok) {
        await store.finishDelivery(d.id, { status: "sent" }, now);
        if (d.channel === "push")
            await store.releasePii(d.event.id);
        result.sent++;
        return;
    }
    const error = outcome.error ?? "send failed";
    if (outcome.retryable && d.attempts < MAX_ATTEMPTS) {
        const delay = RETRY_DELAYS_MS[Math.min(d.attempts, RETRY_DELAYS_MS.length) - 1];
        await store.finishDelivery(d.id, { status: "pending", error, retryAt: new Date(now.getTime() + delay) }, now);
        result.retrying++;
        return;
    }
    await store.finishDelivery(d.id, { status: "failed", error }, now);
    result.failed++;
    console.error(`notify: delivery ${d.id} (${d.channel}, event ${d.event.id}, ${d.event.type}) failed after ${d.attempts} tries: ${error}`);
    if (d.channel !== "push")
        return;
    await store.releasePii(d.event.id);
    const alreadyEmailed = route.email === "instant" && (d.kind === "event" || d.kind === "resolved");
    if (policy.fallbackEmail.includes(d.event.severity) && !alreadyEmailed) {
        await store.addDelivery(d.event.id, "email", "fallback", d.count, now);
        result.fallbacks++;
    }
}
const DIGEST_LIMIT = 2000;
async function runDigest(deps) {
    const clock = deps.now ?? (() => new Date());
    const now = clock();
    const { sent, events } = await deps.store.transaction(async (tx) => {
        const items = await tx.claimDigest(DIGEST_LIMIT);
        if (items.length === 0)
            return { sent: false, events: 0 };
        const dayAgo = new Date(now.getTime() - 24 * 3_600_000);
        const earliest = new Date(Math.min(dayAgo.getTime(), ...items.map((i) => Date.parse(i.receivedAt))));
        const email = renderDigest(items, earliest, now);
        const last = items[items.length - 1].id;
        const outcome = await deps.resend.send(email, `vspl-notify-digest-${now.toISOString().slice(0, 10)}-${last}`);
        if (!outcome.ok)
            throw new Error(`digest not sent: ${outcome.error ?? "unknown"}`);
        await tx.markDigested(items.map((i) => i.id), now);
        return { sent: true, events: items.length };
    });
    const purged = await deps.store.purgeBefore(new Date(now.getTime() - EVENT_RETENTION_DAYS * 86_400_000));
    return { sent, events, purged };
}
  return { MAX_ATTEMPTS, RETRY_DELAYS_MS, ROUTE_BATCH, SEND_BATCH, PII_MAX_HOURS, EVENT_RETENTION_DAYS, runDispatch, DIGEST_LIMIT, runDigest };
})();

// integrations/windmill/notify/lib/ntfy.ts
const { retryableStatus, responseDetail, ntfyClient } = (() => {
const retryableStatus = (status) => status === 408 || status === 429 || status >= 500;
async function responseDetail(res) {
    try {
        return (await res.text()).replace(/\s+/g, " ").slice(0, 200);
    }
    catch {
        return "";
    }
}
function ntfyClient(baseUrl, token, fetchImpl = fetch) {
    const base = baseUrl.replace(/\/$/, "");
    return {
        async publish(message) {
            try {
                const res = await fetchImpl(`${base}/`, {
                    method: "POST",
                    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
                    body: JSON.stringify(message),
                    signal: AbortSignal.timeout(15_000),
                });
                if (res.ok)
                    return { ok: true, retryable: false };
                return { ok: false, retryable: retryableStatus(res.status), error: `ntfy HTTP ${res.status} ${await responseDetail(res)}`.trim() };
            }
            catch (err) {
                return { ok: false, retryable: true, error: `ntfy ${err instanceof Error ? err.name : "error"}` };
            }
        },
    };
}
  return { retryableStatus, responseDetail, ntfyClient };
})();

// integrations/windmill/notify/lib/resend.ts
const { RESEND_API, resendClient } = (() => {
const RESEND_API = "https://api.resend.com/emails";
function resendClient(apiKey, from, to, fetchImpl = fetch) {
    return {
        async send(email, idempotencyKey) {
            try {
                const res = await fetchImpl(RESEND_API, {
                    method: "POST",
                    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": idempotencyKey },
                    body: JSON.stringify({ from, to: [to], subject: email.subject, text: email.text }),
                    signal: AbortSignal.timeout(20_000),
                });
                if (res.ok)
                    return { ok: true, retryable: false };
                return { ok: false, retryable: retryableStatus(res.status), error: `resend HTTP ${res.status} ${await responseDetail(res)}`.trim() };
            }
            catch (err) {
                return { ok: false, retryable: true, error: `resend ${err instanceof Error ? err.name : "error"}` };
            }
        },
    };
}
  return { RESEND_API, resendClient };
})();

export async function readPolicy() {
    let text = null;
    try {
        text = await notifyConfig("policy");
    }
    catch { }
    const { policy, problem } = parsePolicy(text);
    if (problem)
        console.error(`notify: ${problem}; using the default policy`);
    return policy;
}
export async function main() {
    const [ntfyToken, ntfyBase, resendKey, from, to] = await Promise.all([
        notifyConfig("ntfy_token"),
        notifyConfig("ntfy_base_url"),
        notifyConfig("resend_api_key"),
        notifyConfig("email_from"),
        notifyConfig("email_to"),
    ]);
    if (ntfyToken === OWNER_PLACEHOLDER || resendKey === OWNER_PLACEHOLDER) {
        throw new Error("NTFY_TOKEN or RESEND_NOTIFY_API_KEY is still the placeholder: set it in windmill-notify, then pnpm windmill:deploy");
    }
    const policy = await readPolicy();
    return withNotifyDb((sql) => runDispatch({ store: pgNotifyStore(sql), policy, ntfy: ntfyClient(ntfyBase, ntfyToken), resend: resendClient(resendKey, from, to) }));
}

