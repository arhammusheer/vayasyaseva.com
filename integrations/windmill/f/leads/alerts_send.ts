// Generated from integrations/windmill/leads/scripts/alerts_send.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

import { randomBytes } from "node:crypto";

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
    r2_endpoint: { secret: false },
    r2_bucket: { secret: false },
    twenty_base_url: { secret: false },
    twenty_api_key: { secret: true },
    lead_webhook_secret: { secret: true },
    fast2sms_dlr_secret: { secret: true },
    leads_pg_url: { secret: true },
    submission_signing_secret: { secret: true },
    alerts_email_from: { secret: false },
    alerts_reply_to: { secret: false },
    lead_staff_email_from: { secret: false },
    lead_buyer_email_from: { secret: false },
    lead_inbox_email: { secret: false },
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

// integrations/windmill/leads/lib/alert-mail.ts
const { ALERT_SITE, alertMailer, alertStateName, alertStateList, alertConfirmUrl, alertUnsubscribeUrl, alertConfirmEmail, alertUpdatedEmail, alertRatesEmail } = (() => {
const ALERT_SITE = "https://www.vayasyaseva.com";
const RESEND_EMAILS = "https://api.resend.com/emails";
const SENDER_NAME = "Vayasya Seva Private Limited";
function alertMailer(apiKey, from, replyTo, fetchImpl = fetch) {
    return {
        async send(email, idempotencyKey) {
            if (!apiKey || apiKey === "set-by-owner")
                return { ok: false, retryable: false, error: "resend is not configured" };
            try {
                const res = await fetchImpl(RESEND_EMAILS, {
                    method: "POST",
                    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": idempotencyKey },
                    body: JSON.stringify({ from, to: [email.to], reply_to: replyTo, subject: email.subject, text: email.text, html: email.html, headers: email.headers }),
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
const alertStateName = (slug) => slug
    .split("-")
    .map((word) => (word === "and" ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
function alertStateList(slugs) {
    const names = slugs.map(alertStateName);
    return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
const alertConfirmUrl = (token) => `${ALERT_SITE}/en-in/alerts#confirm=${token}`;
const alertUnsubscribeUrl = (token) => `${ALERT_SITE}/en-in/alerts#stop=${token}`;
const oneClickUrl = (token) => `${ALERT_SITE}/api/alerts/unsubscribe?t=${token}`;
const escapeHtml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function render(parts) {
    const text = parts.map((p) => (p.link ? `${p.link.label}:\n${p.link.url}` : (p.text ?? ""))).join("\n\n");
    const body = parts
        .map((p) => {
        if (p.link?.button) {
            return `<p style="margin:24px 0"><a href="${escapeHtml(p.link.url)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#DAA236;color:#111111;font-weight:600;text-decoration:none">${escapeHtml(p.link.label)}</a></p>`;
        }
        const style = p.quiet ? "margin:16px 0;font-size:14px;line-height:1.5;color:#4B5563" : "margin:16px 0";
        if (p.link)
            return `<p style="${style}"><a href="${escapeHtml(p.link.url)}" style="color:#8F6818">${escapeHtml(p.link.label)}</a></p>`;
        return `<p style="${style}">${escapeHtml(p.text ?? "")}</p>`;
    })
        .join("");
    const html = `<!doctype html><html lang="en"><body style="margin:0;padding:24px;background:#FFFFFF;color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6"><div style="max-width:560px">${body}</div></body></html>`;
    return { text, html };
}
const footer = (token) => [
    { link: { label: "Stop these emails", url: alertUnsubscribeUrl(token) }, quiet: true },
    { text: `${SENDER_NAME} · ${ALERT_SITE}`, quiet: true },
];
const unsubscribeHeaders = (token) => ({
    "List-Unsubscribe": `<${oneClickUrl(token)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
});
function alertConfirmEmail(to, states, token) {
    const { text, html } = render([
        { text: `You asked Vayasya Seva to email you when minimum wage rates change in ${alertStateList(states)}.` },
        { link: { label: "Confirm this address", url: alertConfirmUrl(token), button: true } },
        { text: "If you did not ask for this, ignore this email. Nothing more will be sent, and the address is deleted after 7 days.", quiet: true },
        { text: `${SENDER_NAME} · ${ALERT_SITE}`, quiet: true },
    ]);
    return { to, subject: "Confirm your minimum wage alerts", text, html };
}
function alertUpdatedEmail(to, states, token) {
    const { text, html } = render([
        { text: `This address already gets our minimum wage alerts. It now follows ${alertStateList(states)}.` },
        { text: "If you did not ask for this, you can stop the emails below.", quiet: true },
        ...footer(token),
    ]);
    return { to, subject: "Your minimum wage alerts", text, html, headers: unsubscribeHeaders(token) };
}
function alertRatesEmail(to, content, token) {
    const { text, html } = render([
        ...content.lines.map((line) => ({ text: line })),
        { link: { label: `${alertStateName(content.state)} minimum wages: every rate and the notification`, url: `${ALERT_SITE}/en-in/minimum-wages/${content.state}`, button: true } },
        { link: { label: "How we check the figures", url: `${ALERT_SITE}/en-in/minimum-wages/how-we-check` }, quiet: true },
        { text: `You get this because you asked for alerts on ${alertStateName(content.state)}'s minimum wages.`, quiet: true },
        ...footer(token),
    ]);
    return { to, subject: content.subject, text, html, headers: unsubscribeHeaders(token) };
}
  return { ALERT_SITE, alertMailer, alertStateName, alertStateList, alertConfirmUrl, alertUnsubscribeUrl, alertConfirmEmail, alertUpdatedEmail, alertRatesEmail };
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

// integrations/windmill/leads/lib/alerts-sql.ts
const { ALERTS_PURGE_PENDING, ALERTS_BY_EMAIL, ALERTS_UPSERT, ALERTS_MAILED, ALERTS_CONFIRM, ALERTS_UNSUBSCRIBE, ALERTS_DUE, ALERTS_SENT, ALERTS_COUNTS } = (() => {
const ALERTS_PURGE_PENDING = `DELETE FROM alert_subscribers WHERE status = 'pending' AND created_at < now() - interval '7 days' RETURNING id;`;
const ALERTS_BY_EMAIL = `SELECT id, status, states, token, last_mail_at FROM alert_subscribers WHERE email = $1;`;
const ALERTS_UPSERT = `
INSERT INTO alert_subscribers AS s (email, states, token, source_path, notice_version, ref)
VALUES ($1, ARRAY(SELECT jsonb_array_elements_text($2::jsonb) ORDER BY 1), $3, $4, $5, $6)
ON CONFLICT (email) DO UPDATE
  SET states = ARRAY(SELECT DISTINCT e FROM unnest(s.states || EXCLUDED.states) AS e ORDER BY 1),
      notice_version = EXCLUDED.notice_version,
      updated_at = now()
RETURNING s.id, s.status, s.states, s.token, s.last_mail_at;`;
const ALERTS_MAILED = `UPDATE alert_subscribers SET last_mail_at = $2::timestamptz WHERE id = $1;`;
const ALERTS_CONFIRM = `
WITH before AS (
  SELECT id, confirmed_at IS NULL AS first_time FROM alert_subscribers WHERE token = $1 FOR UPDATE
)
UPDATE alert_subscribers s SET status = 'confirmed', confirmed_at = coalesce(s.confirmed_at, now()), updated_at = now()
FROM before WHERE s.id = before.id
RETURNING s.id, s.states, before.first_time;`;
const ALERTS_UNSUBSCRIBE = `DELETE FROM alert_subscribers WHERE token = $1 RETURNING states;`;
const ALERTS_DUE = `
SELECT s.id, s.email, s.token
FROM alert_subscribers s
WHERE s.status = 'confirmed' AND $1 = ANY (s.states)
  AND NOT EXISTS (SELECT 1 FROM alert_sends x WHERE x.subscriber_id = s.id AND x.state = $1 AND x.revision = $2)
ORDER BY s.confirmed_at, s.id
LIMIT $3;`;
const ALERTS_SENT = `INSERT INTO alert_sends (subscriber_id, state, revision) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`;
const ALERTS_COUNTS = `
SELECT e AS state, count(*)::int AS subscribers
FROM alert_subscribers s, unnest(s.states) AS e
WHERE s.status = 'confirmed'
GROUP BY e ORDER BY e;`;
  return { ALERTS_PURGE_PENDING, ALERTS_BY_EMAIL, ALERTS_UPSERT, ALERTS_MAILED, ALERTS_CONFIRM, ALERTS_UNSUBSCRIBE, ALERTS_DUE, ALERTS_SENT, ALERTS_COUNTS };
})();

// integrations/windmill/leads/lib/run-alerts.ts
const { ALERT_MAIL_GAP_MS, runAlertAction, ALERT_SEND_PAUSE_MS, runAlertSend } = (() => {
const ALERT_MAIL_GAP_MS = 10 * 60_000;
async function runAlertAction(payload, deps) {
    if (payload.action === "confirm") {
        const [row] = await deps.query(ALERTS_CONFIRM, [payload.token]);
        if (!row)
            return respond(404, { ok: false, error: "unknown_token" });
        if (row.first_time && deps.notify) {
            await deps.notify({
                source: "leads",
                type: "alert.subscribed",
                severity: "info",
                dedupeKey: `alert-subscriber:${row.id}`,
                title: `New rate alert subscriber: ${alertStateList(row.states)}`.slice(0, 80),
                summary: `${payload.ref} · confirmed their address for minimum wage alerts`,
            });
        }
        return respond(200, { ok: true, states: row.states });
    }
    if (payload.action === "unsubscribe") {
        const [row] = await deps.query(ALERTS_UNSUBSCRIBE, [payload.token]);
        return row ? respond(200, { ok: true, states: row.states }) : respond(404, { ok: false, error: "unknown_token" });
    }
    await deps.query(ALERTS_PURGE_PENDING);
    const token = (deps.newToken ?? (() => randomBytes(32).toString("base64url")))();
    const [row] = await deps.query(ALERTS_UPSERT, [
        payload.email,
        JSON.stringify(payload.states),
        token,
        payload.sourcePath,
        payload.noticeVersion,
        payload.ref,
    ]);
    const now = (deps.now ?? (() => new Date()))().getTime();
    const lastMail = row.last_mail_at ? new Date(row.last_mail_at).getTime() : null;
    if (lastMail !== null && now - lastMail < ALERT_MAIL_GAP_MS)
        return respond(202, { ok: true });
    const email = row.status === "confirmed" ? alertUpdatedEmail(payload.email, row.states, row.token) : alertConfirmEmail(payload.email, row.states, row.token);
    const sent = await deps.mail.send(email, `alert-${row.status}:${payload.ref}`);
    if (!sent.ok) {
        console.error("rate alert email not sent:", payload.ref, sent.error?.match(/HTTP \d{3}|not configured/)?.[0] ?? "error");
        return respond(sent.retryable ? 502 : 503, { ok: false, error: "email_not_sent" });
    }
    await deps.query(ALERTS_MAILED, [row.id, new Date(now).toISOString()]);
    return respond(202, { ok: true });
}
const ALERT_SEND_PAUSE_MS = 600;
async function runAlertSend(args, deps) {
    const pause = deps.pause ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    const counts = await deps.query(ALERTS_COUNTS);
    const due = await deps.query(ALERTS_DUE, [args.state, args.revision, args.limit ?? 500]);
    const result = {
        state: args.state,
        revision: args.revision,
        dryRun: Boolean(args.dryRun),
        due: due.length,
        sent: 0,
        failed: 0,
        subscribers: Object.fromEntries(counts.map((c) => [c.state, c.subscribers])),
    };
    if (args.dryRun)
        return result;
    for (const [index, subscriber] of due.entries()) {
        if (index > 0)
            await pause(ALERT_SEND_PAUSE_MS);
        const sent = await deps.mail.send(alertRatesEmail(subscriber.email, args, subscriber.token), `alert-rates:${subscriber.id}:${args.state}:${args.revision}`);
        if (sent.ok) {
            await deps.query(ALERTS_SENT, [subscriber.id, args.state, args.revision]);
            result.sent++;
        }
        else {
            result.failed++;
            console.error("rate alert not sent to one subscriber:", sent.error?.match(/HTTP \d{3}|not configured/)?.[0] ?? "error");
            if (!sent.retryable)
                break;
        }
    }
    return result;
}
  return { ALERT_MAIL_GAP_MS, runAlertAction, ALERT_SEND_PAUSE_MS, runAlertSend };
})();

export async function main(state, revision, subject, lines, dry_run = true, limit) {
    if (!/^[a-z][a-z-]{1,31}$/.test(state))
        throw new Error("state must be a wage page slug");
    if (!/^[\w.:-]{1,40}$/.test(revision))
        throw new Error("revision must be a short id, e.g. the in-force date 2026-10-01");
    if (!subject?.trim() || subject.length > 150)
        throw new Error("subject is required (150 characters at most)");
    if (!Array.isArray(lines) || !lines.length || lines.some((line) => typeof line !== "string" || !line.trim() || line.length > 600)) {
        throw new Error("lines must be one or more short paragraphs");
    }
    const mail = alertMailer(await notifyConfig("resend_api_key").catch(() => ""), await config("alerts_email_from"), await config("alerts_reply_to"));
    return withDatabase("leads_pg_url", (query) => runAlertSend({ state, revision, subject: subject.trim(), lines: lines.map((line) => line.trim()), dryRun: dry_run, limit: limit ?? undefined }, { query, mail }));
}

