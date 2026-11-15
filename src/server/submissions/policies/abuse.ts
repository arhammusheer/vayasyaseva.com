/**
 * The website forms' bot checks (the contact and call back forms, and the
 * rate alert sign-up): a hidden honeypot field the form sends as a header,
 * and the time since the form was opened (a person takes more than a second
 * and a half). Each of those forms always sends `x-contact-form-started-at`,
 * so a request without it did not come from one of them and is refused.
 * The honeypot header is sent only when the hidden field has a value, so its
 * absence is the normal case; it catches bots that fill every field.
 *
 * Both checks run after Turnstile and only slow down scripts that skip the
 * page; Turnstile is the real gate. The agent routes (/api/agent/*) and the
 * jobs form do not use them.
 */
import { normaliseIndianMobile } from "@/lib/talent-intake/rules";
import { pseudonym } from "./pseudonym";

export const MIN_FORM_COMPLETION_MS = 1_500;
export const STARTED_AT_HEADER = "x-contact-form-started-at";
export const HONEYPOT_HEADER = "x-contact-form-honeypot";

export type AbuseReason = "honeypot" | "missing-started-at" | "invalid-started-at" | "future-started-at" | "completed-too-fast";

/** Why the request looks automated, or null. Read from the form's headers. */
export function formAbuseReason(headers: Headers, now: number): AbuseReason | null {
  const honeypot = headers.get(HONEYPOT_HEADER);
  if (honeypot && honeypot.trim().length > 0) return "honeypot";

  const startedAt = headers.get(STARTED_AT_HEADER)?.trim();
  if (!startedAt) return "missing-started-at";
  if (!/^\d{1,16}$/.test(startedAt)) return "invalid-started-at";
  const parsedStartedAt = Number(startedAt);
  if (parsedStartedAt > now + 5_000) return "future-started-at";
  if (now - parsedStartedAt < MIN_FORM_COMPLETION_MS) return "completed-too-fast";
  return null;
}

/** One phone number however it was typed: the Indian mobile form, else its digits. */
const phoneOf = (phone: string) => normaliseIndianMobile(phone) ?? phone.replace(/\D/g, "");

/**
 * One sender, however they typed it (the lower-cased email and the phone),
 * as a pseudonym (./pseudonym.ts): safe to log, and the same sender always
 * gives the same value, so the duplicate checks still match.
 */
export function senderKey(email: string, phone: string) {
  return pseudonym("sender", email.trim().toLowerCase(), phoneOf(phone));
}

/** One sender from one IP: the contact form's duplicate check. Never holds the email or phone itself. */
export function duplicateKey(ip: string, email: string, phone: string) {
  return pseudonym("duplicate", ip, email.trim().toLowerCase(), phoneOf(phone));
}
