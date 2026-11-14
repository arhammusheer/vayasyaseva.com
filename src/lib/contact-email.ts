/**
 * The contact forms' emails. Two of them:
 *
 * - the staff email to the shared inbox, built to be read at a glance
 *   (owner, 14 Nov 2026): which form, who, how to reach them and what to do
 *   at the top; then the request, their message and where they came from.
 *   HTML for the inbox, with the same content as plain text beside it;
 * - the buyer's copy, when they gave an email on our own form: what they
 *   sent and how to correct it, in plain text.
 *
 * The site writes them; they travel inside the lead (`mail`, business_enquiry.v1)
 * and Windmill sends them through Resend with the key it already holds
 * (integrations/windmill/leads/lib/lead-mail.ts), with retries. There are
 * no templates to keep in step.
 */
import { siteConfig } from "@/content/site";
import type { ContactFormData } from "@/lib/contact-contract";
import { LEAD_LIMITS, type LeadCanonical } from "@vspl/contracts/business-enquiry";
import {
  assessCrewRequest,
  BUSINESS_NOTICE_VERSION,
  CALLBACK_WINDOW,
  outOfScopeLabel,
  requirementLines,
} from "@/lib/crew-request";
import { normaliseIndianMobile } from "@/lib/talent-intake/rules";

const SITE_URL = "https://www.vayasyaseva.com";
// The response-time wording (PLAN §8.1): a target, never a promise.
const DEFAULT_RESPONSE_WINDOW = "We aim to reply within two working days (Monday to Saturday, IST)";

/** Which form the person filled, as the emails name it. */
const FORM_NAMES: Record<string, string> = {
  callback: "Call back request",
  crew: "Crew request",
  "site-assessment": "Site assessment request",
  "compliance-help": "Compliance help request",
};

export interface ContactEmailOptions {
  caseId: string;
  /** Set when an AI agent sent the enquiry: its name, or null when it gave none. */
  agentName?: string | null;
  /** When the enquiry arrived (shown in IST); now when not given. */
  receivedAt?: Date;
}

export interface ContactEmail {
  subject: string;
  text: string;
  /** The staff email only. */
  html?: string;
}

const formName = (data: ContactFormData) => FORM_NAMES[data.requestType ?? "crew"] ?? FORM_NAMES.crew;

/** Blocks of lines, a blank line between blocks, empty blocks left out. */
const blocks = (...parts: string[][]) =>
  parts
    .filter((part) => part.length)
    .map((part) => part.join("\n"))
    .join("\n\n");

const clean = (value: string | undefined) => value?.trim() || undefined;

/** The requirement as [label, value]; the form name already says what was asked for. */
function requirementRows(data: ContactFormData): [string, string][] {
  return requirementLines(data)
    .filter((l) => !l.startsWith("Request: "))
    .map((l) => {
      const at = l.indexOf(": ");
      return [l.slice(0, at), l.slice(at + 2)];
    });
}

const IST = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "14 Nov 2026, 3:42 pm IST". */
export function istTime(date: Date) {
  const parts = Object.fromEntries(IST.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute} ${String(parts.dayPeriod).toLowerCase()} IST`;
}

type Tone = "success" | "info";

/** What the staff email says, before it is laid out as text or HTML. */
interface StaffModel {
  form: string;
  caseId: string;
  name: string;
  company?: string;
  role?: string;
  phone?: string;
  email?: string;
  /** The one thing to do. */
  action: string;
  /** Good news about the lead. */
  tags: { text: string; tone: Tone }[];
  /** Things to check before replying. */
  checks: string[];
  request: [string, string][];
  message?: string;
  cameFrom?: string;
  received: string;
  /** Replying reaches the person (they gave an email on our own form; an agent's address is unconfirmed). */
  replyReachesThem: boolean;
}

function staffModel(data: ContactFormData, options: ContactEmailOptions): StaffModel {
  const { crew, callback, qualified, judged, soon, outOfScope } = assessCrewRequest(data);
  return {
    form: formName(data),
    caseId: options.caseId,
    name: clean(data.name) ?? "Name not given",
    company: clean(data.company),
    role: clean(data.role),
    phone: clean(data.phone),
    email: clean(data.email),
    action: callback
      ? "Phone them within one working day."
      : crew
        ? "Reply within two working days."
        : "Compliance help, not a crew: guide them and connect them with the Vayasya Network.",
    tags: [
      ...(crew && !callback && judged && qualified ? [{ text: "Qualified: 20+ workers, 3+ months", tone: "success" as const }] : []),
      ...(crew && !callback && soon ? [{ text: "Starts within 4 weeks", tone: "info" as const }] : []),
    ],
    checks: [
      ...(options.agentName !== undefined
        ? [`Sent by an AI agent${options.agentName ? ` (${options.agentName})` : ""} on their behalf: confirm the details when you reply.`]
        : []),
      ...outOfScope.map((id) => outOfScopeLabel(id)),
    ],
    request: requirementRows(data),
    message: clean(data.details),
    cameFrom: data.sourcePath ? `${SITE_URL}${data.sourcePath}` : undefined,
    received: istTime(options.receivedAt ?? new Date()),
    replyReachesThem: Boolean(clean(data.email)) && options.agentName === undefined,
  };
}

function staffText(m: StaffModel): string {
  const line = (label: string, value: string | undefined) => (value ? [`${label}: ${value}`] : []);
  return blocks(
    [m.form],
    [m.action, ...m.tags.map((t) => `${t.text}.`), ...m.checks.map((c) => `Check: ${c}`)],
    [...line("Name", m.name), ...line("Phone", m.phone), ...line("Email", m.email), ...line("Company", m.company), ...line("Role", m.role)],
    m.request.map(([label, value]) => `${label}: ${value}`),
    m.message ? [`Message:\n${m.message}`] : [],
    [...line("Came from", m.cameFrom), `Received: ${m.received}`, `Reference: ${m.caseId}`, `Privacy notice: ${BUSINESS_NOTICE_VERSION}`],
  );
}

// --- The staff email as HTML -------------------------------------------------------

/** The site's palette (brand.vayasyaseva.com): gold for the accent, semantic tints for flags. */
const C = {
  fg: "#111111",
  muted: "#4B5563",
  subtle: "#6B7280",
  border: "#E5E7EB",
  surface: "#F6F7F8",
  page: "#F6F7F8",
  gold: "#DAA236",
  gold700: "#8F6818",
  goldTint: "#FBF6E7",
  success: "#1F7A4D",
  successTint: "#E8F3ED",
  info: "#215EA6",
  infoTint: "#E9F0F8",
  warning: "#A45E0C",
};
const FONT = "Arial, Helvetica, sans-serif";
const MONO = "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace";

const esc = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** tel: in E.164 when it is an Indian mobile, else the digits as typed (with a leading +). */
function telHref(phone: string) {
  return `tel:${normaliseIndianMobile(phone) ?? phone.replace(/(?!^\+)\D/g, "")}`;
}

/** A section's small label. */
const label = (text: string) =>
  `<p style="margin:0 0 8px;font:600 12px/16px ${FONT};letter-spacing:0.08em;text-transform:uppercase;color:${C.subtle};">${esc(text)}</p>`;

/**
 * A check (scope, agent): outlined in the warning colour, so it never reads
 * as the action band; the part before the first colon in bold.
 */
function check(text: string) {
  const at = text.indexOf(": ");
  const body = at > 0 ? `<strong style="color:${C.fg};">${esc(text.slice(0, at))}</strong>: ${esc(text.slice(at + 2))}` : esc(text);
  return `<tr><td style="padding:10px 14px;border:1px solid ${C.warning};border-radius:8px;font:400 14px/20px ${FONT};color:${C.fg};"><span style="display:inline-block;margin-right:8px;padding:1px 6px;border-radius:4px;background:${C.warning};color:#FFFFFF;font:700 11px/16px ${FONT};letter-spacing:0.06em;text-transform:uppercase;">Check</span>${body}</td></tr><tr><td style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>`;
}

function staffHtml(m: StaffModel): string {
  const who = [m.company, m.role].filter(Boolean).map((v) => esc(v!)).join(" &middot; ");
  const preheader = [m.action, ...m.request.filter(([l]) => l === "Workers" || l === "Site").map(([l, v]) => (l === "Workers" ? `${v} workers` : v))].join(" ");
  const tags = m.tags
    .map((t) => {
      const [fg, bg] = t.tone === "success" ? [C.success, C.successTint] : [C.info, C.infoTint];
      return `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border-radius:6px;background:${bg};color:${fg};font:600 13px/18px ${FONT};">${esc(t.text)}</span>`;
    })
    .join("");
  // Rules separate rows only: none above the first, none after the last.
  const rows = m.request
    .map(
      ([l, v], i) =>
        `<tr><td valign="top" width="120" style="padding:10px 16px 10px 0;${i ? `border-top:1px solid ${C.border};` : ""}font:400 14px/20px ${FONT};color:${C.subtle};">${esc(l)}</td><td valign="top" style="padding:10px 0;${i ? `border-top:1px solid ${C.border};` : ""}font:600 15px/20px ${FONT};color:${C.fg};">${esc(v)}</td></tr>`,
    )
    .join("");
  const footer = [
    m.cameFrom ? `From <a href="${esc(m.cameFrom)}" style="color:${C.muted};">${esc(m.cameFrom.replace(/^https:\/\/www\./, ""))}</a>` : null,
    `Received ${esc(m.received)}`,
    `Privacy notice ${BUSINESS_NOTICE_VERSION}`,
  ]
    .filter(Boolean)
    .join(" &middot; ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${esc(m.form)}: ${esc(m.name)}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid ${C.border};border-radius:8px;border-collapse:separate;">
<tr><td style="height:4px;line-height:4px;font-size:0;background:${C.gold};border-radius:8px 8px 0 0;">&nbsp;</td></tr>
<tr><td style="padding:24px 28px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font:600 12px/16px ${FONT};letter-spacing:0.08em;text-transform:uppercase;color:${C.gold700};">${esc(m.form)}</td>
<td align="right" style="font:400 12px/16px ${MONO};color:${C.subtle};">${esc(m.caseId)}</td>
</tr></table>
<h1 style="margin:10px 0 0;font:700 26px/32px ${FONT};color:${C.fg};">${esc(m.name)}</h1>
${who ? `<p style="margin:4px 0 0;font:400 15px/22px ${FONT};color:${C.muted};">${who}</p>` : ""}
${m.phone ? `<p style="margin:14px 0 0;font:600 20px/26px ${FONT};"><a href="${esc(telHref(m.phone))}" style="color:${C.fg};text-decoration:none;">${esc(m.phone)}</a></p>` : ""}
${m.email ? `<p style="margin:4px 0 0;font:400 15px/22px ${FONT};"><a href="mailto:${esc(m.email)}" style="color:${C.gold700};text-decoration:none;">${esc(m.email)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:20px 28px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 16px;background:${C.goldTint};border-left:4px solid ${C.gold};border-radius:0 8px 8px 0;font:600 16px/22px ${FONT};color:${C.fg};">${esc(m.action)}</td></tr></table>
${tags ? `<div style="margin-top:12px;">${tags}</div>` : ""}
${m.checks.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:${tags ? 2 : 12}px;">${m.checks.map(check).join("")}</table>` : ""}
</td></tr>
${
  rows
    ? `<tr><td style="padding:24px 28px 0;">${label("The request")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>`
    : ""
}
${
  m.message
    ? `<tr><td style="padding:24px 28px 0;">${label("Their message")}<div style="padding:14px 16px;background:${C.surface};border-radius:8px;font:400 15px/23px ${FONT};color:${C.fg};white-space:pre-wrap;">${esc(m.message)}</div></td></tr>`
    : ""
}
<tr><td style="padding:24px 28px 24px;"><p style="margin:0;font:400 12px/18px ${FONT};color:${C.subtle};">${footer}</p></td></tr>
</table>
<p style="margin:12px 0 0;font:400 12px/18px ${FONT};color:${C.subtle};">${esc(siteConfig.companyName)} website enquiry. ${
  m.replyReachesThem
    ? `Reply to this email to answer ${esc(m.name.split(/\s+/)[0])} directly.`
    : m.email
      ? "Replies go to the shared inbox: write to the address above to answer them."
      : "No email given: phone them."
}</p>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * The email to the shared inbox. The lead flags are for our team only
 * (PLAN §8.1): never in the buyer's copy, the response or the page.
 */
export function staffEmail(data: ContactFormData, options: ContactEmailOptions): ContactEmail {
  const m = staffModel(data, options);
  const workers = m.request.find(([l]) => l === "Workers")?.[1];
  const who = [m.name, m.company].filter(Boolean).join(", ");
  return {
    subject: `${m.form}: ${who}${workers ? ` · ${workers} workers` : ""}`.replace(/\s+/g, " "),
    text: staffText(m),
    html: staffHtml(m),
  };
}

/** The buyer's copy: what they sent, when to expect us, how to correct it. No lead flags. */
export function buyerEmail(data: ContactFormData, options: ContactEmailOptions): ContactEmail {
  const first = data.name?.trim().split(/\s+/)[0];
  const sent = [...requirementRows(data).map(([l, v]) => `${l}: ${v}`), ...(data.details?.trim() ? [`Message: ${data.details.trim()}`] : [])];
  return {
    subject: `We have your ${formName(data).toLowerCase()} (${options.caseId})`,
    text: blocks(
      [first ? `Hello ${first},` : "Hello,"],
      [`Thank you. ${assessCrewRequest(data).callback ? CALLBACK_WINDOW : DEFAULT_RESPONSE_WINDOW}.`],
      sent.length ? ["What you sent:", ...sent] : [],
      ["To add or correct anything, reply to this email."],
      [`Reference: ${options.caseId}`],
      [siteConfig.companyName, SITE_URL],
    ),
  };
}

export function canSendContactAutoReply(data: ContactFormData) {
  return Boolean(data.email?.trim());
}

export function createContactCaseId(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  const token = crypto.randomUUID().split("-")[0].toUpperCase();
  return `REQ-${stamp}-${token}`;
}

/** Both emails, cut to the contract's lengths, as the lead carries them to Windmill. */
export function leadMail(data: ContactFormData, options: ContactEmailOptions): NonNullable<LeadCanonical["mail"]> {
  const fit = (email: ContactEmail) => ({
    subject: email.subject.slice(0, LEAD_LIMITS.mailSubject),
    text: email.text.slice(0, LEAD_LIMITS.mailText),
    // An HTML part too long to carry is left out rather than cut mid-tag: the text part still goes.
    ...(email.html && email.html.length <= LEAD_LIMITS.mailHtml ? { html: email.html } : {}),
  });
  // No copy for an agent's enquiry: its address is unconfirmed, and the route must not mail strangers.
  const buyer = options.agentName === undefined && canSendContactAutoReply(data) ? fit(buyerEmail(data, options)) : null;
  return { staff: fit(staffEmail(data, options)), buyer };
}
