/**
 * Minimum wage rate alerts (rate_alert.v1), step by step, with the database
 * and the mailer injected so the tests drive every path.
 *
 *   runAlertAction  f/platform/submission: subscribe (save, then the
 *                   confirmation email), confirm and unsubscribe (the links
 *                   in our emails, relayed by the site)
 *   runAlertSend    f/leads/alerts_send, run by hand (`pnpm alerts:send`):
 *                   one state's new rates to its confirmed followers, each
 *                   once per revision
 *
 * Double opt-in: an address gets one confirmation email and nothing else
 * until its link is opened. Asking again within ten minutes sends nothing
 * more, so the form cannot be used to flood someone's inbox. The answer to
 * a subscribe never says whether the address was known.
 */
import { randomBytes } from "node:crypto";
import type { RateAlertCanonical } from "../../../../packages/contracts/src/rate-alert.v1.ts";
import type { Notify } from "../../notify/lib/emit.ts";
import type { Query } from "../../talent/lib/db.ts";
import { respond } from "../../talent/lib/response.ts";
import { alertConfirmEmail, alertRatesEmail, alertStateList, alertUpdatedEmail, type AlertContent, type AlertMailer } from "./alert-mail.ts";
import { ALERTS_CONFIRM, ALERTS_COUNTS, ALERTS_DUE, ALERTS_MAILED, ALERTS_PURGE_PENDING, ALERTS_SENT, ALERTS_UNSUBSCRIBE, ALERTS_UPSERT } from "./alerts-sql.ts";

export interface AlertDeps {
  query: Query;
  mail: AlertMailer;
  /** The notification hub (tryEmit in the script). Unset: no notifications. */
  notify?: Notify;
  now?: () => Date;
  newToken?: () => string;
}

/** Between two emails to one address that has not confirmed, or has and asks again. */
export const ALERT_MAIL_GAP_MS = 10 * 60_000;

interface SubscriberRow {
  id: string;
  status: "pending" | "confirmed";
  states: string[];
  token: string;
  last_mail_at: Date | string | null;
  created: boolean;
}

export async function runAlertAction(payload: RateAlertCanonical, deps: AlertDeps) {
  if (payload.action === "confirm") {
    const [row] = await deps.query<{ id: string; states: string[]; first_time: boolean }>(ALERTS_CONFIRM, [payload.token]);
    if (!row) return respond(404, { ok: false, error: "unknown_token" });
    // How many, and which states: never the address.
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
    const [row] = await deps.query<{ states: string[] }>(ALERTS_UNSUBSCRIBE, [payload.token]);
    return row ? respond(200, { ok: true, states: row.states }) : respond(404, { ok: false, error: "unknown_token" });
  }

  await deps.query(ALERTS_PURGE_PENDING);
  const token = (deps.newToken ?? (() => randomBytes(32).toString("base64url")))();
  const [row] = await deps.query<SubscriberRow>(ALERTS_UPSERT, [
    payload.email,
    JSON.stringify(payload.states),
    token,
    payload.sourcePath,
    payload.noticeVersion,
    payload.ref,
  ]);
  const now = (deps.now ?? (() => new Date()))().getTime();
  const lastMail = row.last_mail_at ? new Date(row.last_mail_at).getTime() : null;
  if (lastMail !== null && now - lastMail < ALERT_MAIL_GAP_MS) return respond(202, { ok: true });

  const email = row.status === "confirmed" ? alertUpdatedEmail(payload.email, row.states, row.token) : alertConfirmEmail(payload.email, row.states, row.token);
  // The reference keys the send: the site's retry of this request never mails twice.
  const sent = await deps.mail.send(email, `alert-${row.status}:${payload.ref}`);
  if (!sent.ok) {
    // The kind of failure only: the error text can echo the address.
    console.error("rate alert email not sent:", payload.ref, sent.error?.match(/HTTP \d{3}|not configured/)?.[0] ?? "error");
    return respond(sent.retryable ? 502 : 503, { ok: false, error: "email_not_sent" });
  }
  await deps.query(ALERTS_MAILED, [row.id]);
  return respond(202, { ok: true });
}

export interface AlertSendArgs extends AlertContent {
  /** What makes this change one alert: the date the new rates are in force from. */
  revision: string;
  /** Count only. */
  dryRun?: boolean;
  /** At most this many in one run (run again for the rest). */
  limit?: number;
}

export interface AlertSendResult {
  state: string;
  revision: string;
  dryRun: boolean;
  /** Followers who have not had this revision. */
  due: number;
  sent: number;
  failed: number;
  /** Confirmed subscribers per state, for the summary. */
  subscribers: Record<string, number>;
}

/** Resend allows two requests a second: one send, then a pause. */
export const ALERT_SEND_PAUSE_MS = 600;

export async function runAlertSend(args: AlertSendArgs, deps: AlertDeps & { pause?: (ms: number) => Promise<void> }): Promise<AlertSendResult> {
  const pause = deps.pause ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const counts = await deps.query<{ state: string; subscribers: number }>(ALERTS_COUNTS);
  const due = await deps.query<{ id: string; email: string; token: string }>(ALERTS_DUE, [args.state, args.revision, args.limit ?? 500]);
  const result: AlertSendResult = {
    state: args.state,
    revision: args.revision,
    dryRun: Boolean(args.dryRun),
    due: due.length,
    sent: 0,
    failed: 0,
    subscribers: Object.fromEntries(counts.map((c) => [c.state, c.subscribers])),
  };
  if (args.dryRun) return result;
  for (const [index, subscriber] of due.entries()) {
    if (index > 0) await pause(ALERT_SEND_PAUSE_MS);
    const sent = await deps.mail.send(alertRatesEmail(subscriber.email, args, subscriber.token), `alert-rates:${subscriber.id}:${args.state}:${args.revision}`);
    if (sent.ok) {
      await deps.query(ALERTS_SENT, [subscriber.id, args.state, args.revision]);
      result.sent++;
    } else {
      result.failed++;
      console.error("rate alert not sent to one subscriber:", sent.error?.match(/HTTP \d{3}|not configured/)?.[0] ?? "error");
      // Not configured, or refused outright: the rest would fail the same way.
      if (!sent.retryable) break;
    }
  }
  return result;
}
