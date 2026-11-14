/**
 * The contact forms' emails, as plain text (owner, 14 Nov 2026: MSG91's
 * templates forced too much structure). Two emails:
 *
 * - the staff email to the shared inbox: which form, what to do, then only
 *   what the person filled in;
 * - the buyer's copy, when they gave an email on our own form: what they
 *   sent and how to correct it.
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
}

export interface ContactEmail {
  subject: string;
  text: string;
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

/** Both emails, cut to the contract's lengths, as the lead carries them to Windmill. */
export function leadMail(data: ContactFormData, options: ContactEmailOptions): NonNullable<LeadCanonical["mail"]> {
  const fit = (email: ContactEmail) => ({
    subject: email.subject.slice(0, LEAD_LIMITS.mailSubject),
    text: email.text.slice(0, LEAD_LIMITS.mailText),
  });
  // No copy for an agent's enquiry: its address is unconfirmed, and the route must not mail strangers.
  const buyer = options.agentName === undefined && canSendContactAutoReply(data) ? fit(buyerEmail(data, options)) : null;
  return { staff: fit(staffEmail(data, options)), buyer };
}
