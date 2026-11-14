/**
 * The lead's two emails (owner, 14 Nov 2026: out of MSG91, into Resend from
 * here, where the key already is). The website writes them as plain text
 * (src/lib/contact-email.ts) and sends them inside the lead (`mail`);
 * saveLead queues one delivery each, and f/leads/sync_crm sends them:
 *
 *   staff_mail  to the shared inbox; replies go to the person when they gave
 *               an email on our own form (an agent's address is unconfirmed,
 *               so its enquiries reply to the inbox)
 *   buyer_mail  to the person's email, replies to the shared inbox
 *
 * Each send carries an Idempotency-Key, so a retry after a timeout never
 * mails twice. Failures back off like the CRM delivery and stop at the cap;
 * a staff email that stops raises lead.email_failed (the inbox does not
 * have the lead; Twenty and the lead.received push still do).
 */
import { responseDetail, retryableStatus, type Fetch, type SendResult } from "../../notify/lib/ntfy.ts";
import type { Notify } from "../../notify/lib/emit.ts";
import type { Query } from "../../talent/lib/db.ts";
import type { Lead } from "./lead.ts";
import { leadEmailFailedEvent } from "./lead-notify.ts";
import { leadBackoffSeconds } from "./run-leads.ts";
import { LEAD_MAIL_CLAIM, LEAD_MAIL_FINISH } from "./sql.ts";

const RESEND_EMAILS = "https://api.resend.com/emails";

export interface LeadEmail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

export type LeadMailSend = (email: LeadEmail, idempotencyKey: string) => Promise<SendResult>;

/** Resend, plain text only. No key yet (or the infra placeholder): kept for a later try. */
export function leadMailer(apiKey: string, fetchImpl: Fetch = fetch): LeadMailSend {
  return async (email, idempotencyKey) => {
    if (!apiKey || apiKey === "set-by-owner") return { ok: false, retryable: true, error: "resend is not configured" };
    try {
      const res = await fetchImpl(RESEND_EMAILS, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify({ from: email.from, to: [email.to], reply_to: email.replyTo, subject: email.subject, text: email.text }),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) return { ok: true, retryable: false };
      return { ok: false, retryable: retryableStatus(res.status), error: `resend HTTP ${res.status} ${await responseDetail(res)}`.trim() };
    } catch (err) {
      return { ok: false, retryable: true, error: `resend ${err instanceof Error ? err.name : "error"}` };
    }
  };
}

export interface LeadMailDeps {
  query: Query;
  send: LeadMailSend;
  /** Senders on the verified notify.vayasyaseva.com domain, and the shared inbox. */
  staffFrom: string;
  buyerFrom: string;
  inbox: string;
  notify?: Notify;
  log?: (message: string) => void;
}

export interface LeadMailResult {
  sent: number;
  retried: number;
  dead: number;
}

type Target = "staff_mail" | "buyer_mail";

/** The email a delivery sends, or why it cannot be sent. */
export function leadEmail(lead: Lead, target: Target, deps: Pick<LeadMailDeps, "staffFrom" | "buyerFrom" | "inbox">): LeadEmail | string {
  if (target === "staff_mail") {
    if (!lead.mail) return "the lead carries no emails";
    const replyTo = lead.channel === "web" && lead.email ? lead.email : deps.inbox;
    return { from: deps.staffFrom, to: deps.inbox, replyTo, ...lead.mail.staff };
  }
  if (!lead.mail?.buyer || !lead.email) return "the lead carries no buyer copy";
  return { from: deps.buyerFrom, to: lead.email, replyTo: deps.inbox, ...lead.mail.buyer };
}

/** Sends the due emails (one lead's when `leadId` is set), oldest first. */
export async function runLeadMail(deps: LeadMailDeps, options: { leadId?: string | null; batch?: number } = {}): Promise<LeadMailResult> {
  const log = deps.log ?? ((m: string) => console.error(m));
  const result: LeadMailResult = { sent: 0, retried: 0, dead: 0 };
  const batch = options.batch ?? 20;
  for (let n = 0; n < batch; n++) {
    const [claim] = await deps.query<{ lead_id: string; target: Target; attempts: number; case_id: string; payload: Lead }>(LEAD_MAIL_CLAIM, [
      options.leadId ?? null,
    ]);
    if (!claim) break;
    const email = leadEmail(claim.payload, claim.target, deps);
    const outcome: SendResult =
      typeof email === "string" ? { ok: false, retryable: false, error: email } : await deps.send(email, `lead-mail:${claim.target}:${claim.case_id}`);
    const [finished] = await deps.query<{ status: string }>(LEAD_MAIL_FINISH, [
      claim.lead_id,
      claim.target,
      outcome.ok ? "done" : outcome.retryable ? "retry" : "dead",
      outcome.ok ? null : (outcome.error ?? "unknown error").slice(0, 500),
      leadBackoffSeconds(claim.attempts),
    ]);
    if (finished?.status === "done") result.sent++;
    else if (finished?.status === "dead") result.dead++;
    else result.retried++;
    // The case ID and the error's kind, never the person: the job log is read by staff.
    if (!outcome.ok) log(`lead ${claim.case_id} ${claim.target} not sent: ${outcome.error ?? "unknown error"}`);
    if (finished?.status === "dead" && claim.target === "staff_mail" && deps.notify) {
      await deps.notify(leadEmailFailedEvent(claim.case_id, claim.attempts, outcome.error ?? null));
    }
  }
  return result;
}
