/**
 * The rate alert emails: the confirmation, the note to an address that is
 * already subscribed, and the alert itself. Plain text and a simple HTML
 * part, sent through Resend with an Idempotency-Key (a retry never mails
 * twice) and the one-click unsubscribe headers (RFC 8058).
 *
 * Every email carries the unsubscribe link. The links to the site's pages
 * keep the token in the fragment, so it is not in any server's logs; the
 * header's one-click URL has to carry it in the query, and posts straight
 * to /api/alerts/unsubscribe.
 */
import { responseDetail, retryableStatus, type Fetch, type SendResult } from "../../notify/lib/ntfy.ts";

export const ALERT_SITE = "https://www.vayasyaseva.com";
const RESEND_EMAILS = "https://api.resend.com/emails";
const SENDER_NAME = "Vayasya Seva Private Limited";

export interface AlertEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
}

export interface AlertMailer {
  send(email: AlertEmail, idempotencyKey: string): Promise<SendResult>;
}

/** `apiKey` empty or the infra placeholder: nothing is sent, and the caller is told so. */
export function alertMailer(apiKey: string, from: string, replyTo: string, fetchImpl: Fetch = fetch): AlertMailer {
  return {
    async send(email, idempotencyKey) {
      if (!apiKey || apiKey === "set-by-owner") return { ok: false, retryable: false, error: "resend is not configured" };
      try {
        const res = await fetchImpl(RESEND_EMAILS, {
          method: "POST",
          headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": idempotencyKey },
          body: JSON.stringify({ from, to: [email.to], reply_to: replyTo, subject: email.subject, text: email.text, html: email.html, headers: email.headers }),
          signal: AbortSignal.timeout(20_000),
        });
        if (res.ok) return { ok: true, retryable: false };
        return { ok: false, retryable: retryableStatus(res.status), error: `resend HTTP ${res.status} ${await responseDetail(res)}`.trim() };
      } catch (err) {
        return { ok: false, retryable: true, error: `resend ${err instanceof Error ? err.name : "error"}` };
      }
    },
  };
}

/** "uttar-pradesh" as "Uttar Pradesh": the wage pages' slugs are the states' names. */
export const alertStateName = (slug: string) =>
  slug
    .split("-")
    .map((word) => (word === "and" ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");

/** "Punjab", "Punjab and Delhi", "Punjab, Delhi and Haryana". */
export function alertStateList(slugs: string[]): string {
  const names = slugs.map(alertStateName);
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

export const alertConfirmUrl = (token: string) => `${ALERT_SITE}/en-in/alerts/confirm#t=${token}`;
export const alertUnsubscribeUrl = (token: string) => `${ALERT_SITE}/en-in/alerts/unsubscribe#t=${token}`;
const oneClickUrl = (token: string) => `${ALERT_SITE}/api/alerts/unsubscribe?t=${token}`;

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface Part {
  /** A paragraph, or a link on its own line (shown as a button when `button`). */
  text?: string;
  link?: { label: string; url: string; button?: boolean };
  quiet?: boolean;
}

function render(parts: Part[]): { text: string; html: string } {
  const text = parts.map((p) => (p.link ? `${p.link.label}:\n${p.link.url}` : (p.text ?? ""))).join("\n\n");
  const body = parts
    .map((p) => {
      if (p.link?.button) {
        return `<p style="margin:24px 0"><a href="${escapeHtml(p.link.url)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#DAA236;color:#111111;font-weight:600;text-decoration:none">${escapeHtml(p.link.label)}</a></p>`;
      }
      const style = p.quiet ? "margin:16px 0;font-size:14px;line-height:1.5;color:#4B5563" : "margin:16px 0";
      if (p.link) return `<p style="${style}"><a href="${escapeHtml(p.link.url)}" style="color:#8F6818">${escapeHtml(p.link.label)}</a></p>`;
      return `<p style="${style}">${escapeHtml(p.text ?? "")}</p>`;
    })
    .join("");
  const html = `<!doctype html><html lang="en"><body style="margin:0;padding:24px;background:#FFFFFF;color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6"><div style="max-width:560px">${body}</div></body></html>`;
  return { text, html };
}

const footer = (token: string): Part[] => [
  { link: { label: "Stop these emails", url: alertUnsubscribeUrl(token) }, quiet: true },
  { text: `${SENDER_NAME} · ${ALERT_SITE}`, quiet: true },
];

const unsubscribeHeaders = (token: string) => ({
  "List-Unsubscribe": `<${oneClickUrl(token)}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
});

/** The first email: nothing else is sent until its link is opened. No unsubscribe link: there is nothing to stop yet. */
export function alertConfirmEmail(to: string, states: string[], token: string): AlertEmail {
  const { text, html } = render([
    { text: `You asked Vayasya Seva to email you when minimum wage rates change in ${alertStateList(states)}.` },
    { link: { label: "Confirm this address", url: alertConfirmUrl(token), button: true } },
    { text: "If you did not ask for this, ignore this email. Nothing more will be sent, and the address is deleted after 7 days.", quiet: true },
    { text: `${SENDER_NAME} · ${ALERT_SITE}`, quiet: true },
  ]);
  return { to, subject: "Confirm your minimum wage alerts", text, html };
}

/** To an address that is already confirmed and asked again: what it now follows. */
export function alertUpdatedEmail(to: string, states: string[], token: string): AlertEmail {
  const { text, html } = render([
    { text: `This address already gets our minimum wage alerts. It now follows ${alertStateList(states)}.` },
    { text: "If you did not ask for this, you can stop the emails below.", quiet: true },
    ...footer(token),
  ]);
  return { to, subject: "Your minimum wage alerts", text, html, headers: unsubscribeHeaders(token) };
}

export interface AlertContent {
  /** The wage page's state slug. */
  state: string;
  subject: string;
  /** What changed, a paragraph each, as the wage page states it. */
  lines: string[];
}

export function alertRatesEmail(to: string, content: AlertContent, token: string): AlertEmail {
  const { text, html } = render([
    ...content.lines.map((line) => ({ text: line })),
    { link: { label: `${alertStateName(content.state)} minimum wages: every rate and the notification`, url: `${ALERT_SITE}/en-in/minimum-wages/${content.state}`, button: true } },
    { link: { label: "How we check the figures", url: `${ALERT_SITE}/en-in/minimum-wages/how-we-check` }, quiet: true },
    { text: `You get this because you asked for alerts on ${alertStateName(content.state)}'s minimum wages.`, quiet: true },
    ...footer(token),
  ]);
  return { to, subject: content.subject, text, html, headers: unsubscribeHeaders(token) };
}
