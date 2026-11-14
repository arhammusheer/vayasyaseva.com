/**
 * The contact forms' emails, sent through Resend as plain text (owner,
 * 14 Nov 2026: MSG91's templates forced too much structure). Two emails:
 *
 * - the staff email to the shared inbox: which form, what to do, then only
 *   what the person filled in;
 * - the buyer's copy, when they gave an email: what they sent and how to
 *   correct it.
 *
 * Both are written here, in code; there are no templates to keep in step.
 * They send from the verified notify.vayasyaseva.com domain (the one the
 * notification hub and the rate alerts use) and replies go to people, not
 * to that sending address.
 */
import { siteConfig } from "@/content/site";
import type { ContactFormData } from "@/lib/contact-contract";
import {
  assessCrewRequest,
  BUSINESS_NOTICE_VERSION,
  CALLBACK_WINDOW,
  outOfScopeLabel,
  requirementLines,
} from "@/lib/crew-request";

const RESEND_API = "https://api.resend.com/emails";
const SITE_URL = "https://www.vayasyaseva.com";
const DEFAULT_STAFF_FROM = "Vayasya Seva website <website@notify.vayasyaseva.com>";
const DEFAULT_BUYER_FROM = `${siteConfig.companyName} <enquiries@notify.vayasyaseva.com>`;
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
}

export interface ContactEmail {
  subject: string;
  text: string;
}

export interface ContactEmailResult {
  /** Resend's id for the email. */
  messageId?: string;
}

const formName = (data: ContactFormData) => FORM_NAMES[data.requestType ?? "crew"] ?? FORM_NAMES.crew;

/** Blocks of lines, a blank line between blocks, empty blocks left out. */
const blocks = (...parts: string[][]) =>
  parts
    .filter((part) => part.length)
    .map((part) => part.join("\n"))
    .join("\n\n");

const line = (label: string, value: string | undefined) => (value?.trim() ? [`${label}: ${value.trim()}`] : []);

/** The form name already says what was asked for. */
const requirement = (data: ContactFormData) => requirementLines(data).filter((l) => !l.startsWith("Request: "));

/**
 * The email to the shared inbox: which form, what to do, then what the
 * person filled in, nothing else. The lead flags are for our team only
 * (PLAN §8.1): never in the buyer's copy, the response or the page.
 */
export function staffEmail(data: ContactFormData, options: ContactEmailOptions): ContactEmail {
  const { crew, callback, qualified, judged, soon, outOfScope } = assessCrewRequest(data);
  const name = formName(data);

  const todo = [
    ...(callback ? ["Phone them within one working day."] : []),
    ...(crew && !callback && judged && qualified ? ["Qualified lead: 20 or more workers for 3 months or more."] : []),
    ...(crew && !callback && soon ? ["Wants to start within 4 weeks."] : []),
    ...(!crew ? ["Not a crew request: guide them and connect them with the Vayasya Network."] : []),
    ...(options.agentName !== undefined
      ? [`Sent by an AI agent${options.agentName ? ` (${options.agentName})` : ""} on their behalf. Confirm the details when you reply.`]
      : []),
    ...outOfScope.map((id) => `Check: ${outOfScopeLabel(id)}`),
  ];
  const person = [
    ...line("Name", data.name),
    ...line("Phone", data.phone),
    ...line("Email", data.email),
    ...line("Company", data.company),
    ...line("Role", data.role),
  ];
  const message = data.details?.trim() ? [`Message:\n${data.details.trim()}`] : [];
  const footer = [
    ...(data.sourcePath ? [`Came from: ${SITE_URL}${data.sourcePath}`] : []),
    `Reference: ${options.caseId}`,
    `Privacy notice: ${BUSINESS_NOTICE_VERSION}`,
  ];

  const who = [data.name, data.company].map((v) => v?.trim()).filter(Boolean).join(", ");
  return {
    subject: `${name}: ${who}`.replace(/\s+/g, " "),
    text: blocks([name], todo, person, requirement(data), message, footer),
  };
}

/** The buyer's copy: what they sent, when to expect us, how to correct it. No lead flags. */
export function buyerEmail(data: ContactFormData, options: ContactEmailOptions): ContactEmail {
  const first = data.name?.trim().split(/\s+/)[0];
  const sent = [...requirement(data), ...(data.details?.trim() ? [`Message: ${data.details.trim()}`] : [])];
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

function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** The shared inbox: help@ unless CONTACT_INTERNAL_RECIPIENT_EMAIL says otherwise. */
const sharedInbox = () => env("CONTACT_INTERNAL_RECIPIENT_EMAIL") ?? siteConfig.email;

const maskEmail = (value: string) => value.replace(/^(.).*@/, "$1***@");

async function send(
  kind: "contact_internal_notification" | "contact_autoreply",
  caseId: string,
  message: { from: string; to: string; replyTo: string } & ContactEmail,
): Promise<ContactEmailResult> {
  const apiKey = env("RESEND_API_KEY");
  if (!apiKey) throw new Error("Missing required email configuration: RESEND_API_KEY");
  const response = await fetch(RESEND_API, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: message.from,
      to: [message.to],
      reply_to: message.replyTo,
      subject: message.subject,
      text: message.text,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => null)) as { id?: string; name?: string; message?: string } | null;
  const log = { kind, caseId, to: maskEmail(message.to), status: response.status };
  if (!response.ok) {
    // Resend's error name and message only: never the email's text.
    console.error("[CONTACT EMAIL] Resend refused", { ...log, error: body?.name, detail: body?.message });
    throw new Error(`Resend send failed with status ${response.status}`);
  }
  console.info("[CONTACT EMAIL] sent", { ...log, messageId: body?.id });
  return { messageId: body?.id };
}

export async function sendInternalContactEmail(data: ContactFormData, options: ContactEmailOptions) {
  const inbox = sharedInbox();
  // Reply goes straight to the person when they gave an email on our own
  // form; an agent's address is unconfirmed, so its enquiries reply to us.
  const customer = options.agentName === undefined ? data.email?.trim() : undefined;
  return send("contact_internal_notification", options.caseId, {
    from: env("CONTACT_STAFF_EMAIL_FROM") ?? DEFAULT_STAFF_FROM,
    to: inbox,
    replyTo: customer || inbox,
    ...staffEmail(data, options),
  });
}

export async function sendContactAutoReply(data: ContactFormData, options: ContactEmailOptions) {
  const to = data.email?.trim();
  if (!to) throw new Error("Missing required contact field: email");
  return send("contact_autoreply", options.caseId, {
    from: env("CONTACT_BUYER_EMAIL_FROM") ?? DEFAULT_BUYER_FROM,
    to,
    replyTo: sharedInbox(),
    ...buyerEmail(data, options),
  });
}
