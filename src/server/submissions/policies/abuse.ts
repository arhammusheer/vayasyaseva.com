/**
 * The contact form's bot checks, moved from /api/contact unchanged: a hidden
 * honeypot field the form sends as a header, and the time since the form
 * was opened (a person takes more than a second and a half).
 */

export const MIN_FORM_COMPLETION_MS = 1_500;

export type AbuseReason = "honeypot" | "invalid-started-at" | "future-started-at" | "completed-too-fast";

/** Why the request looks automated, or null. Read from the form's headers. */
export function formAbuseReason(headers: Headers, now: number): AbuseReason | null {
  const honeypot = headers.get("x-contact-form-honeypot");
  if (honeypot && honeypot.trim().length > 0) return "honeypot";

  const startedAt = headers.get("x-contact-form-started-at");
  if (!startedAt) return null;
  const parsedStartedAt = Number.parseInt(startedAt, 10);
  if (!Number.isFinite(parsedStartedAt)) return "invalid-started-at";
  if (parsedStartedAt > now + 5_000) return "future-started-at";
  if (now - parsedStartedAt < MIN_FORM_COMPLETION_MS) return "completed-too-fast";
  return null;
}

/** One sender, however they typed it: the IP with the lower-cased email and the phone's digits. */
export function duplicateKey(ip: string, email: string, phone: string) {
  return `${ip}:${email.trim().toLowerCase()}:${phone.replace(/\D/g, "")}`;
}
