/**
 * The signature on the site's requests to Windmill's signed routes
 * (webhook/vspl-submission, webhook/vspl-idempotency): HMAC-SHA256 over
 * "v1:<timestamp>.<raw body>" with SUBMISSION_SIGNING_SECRET, sent as
 *
 *   x-vspl-timestamp: <Unix seconds>
 *   x-vspl-signature: v1=<base64url HMAC>
 *
 * Windmill refuses a timestamp more than five minutes from its own clock, so
 * a captured request cannot be replayed later. The site and the Windmill
 * build share this file; it imports only node:crypto.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const TIMESTAMP_HEADER = "x-vspl-timestamp";
export const SIGNATURE_HEADER = "x-vspl-signature";
export const SIGNATURE_SKEW_SECONDS = 5 * 60;

const mac = (secret: string, timestamp: string, body: string) =>
  createHmac("sha256", secret).update(`v1:${timestamp}.${body}`).digest("base64url");

/** The two headers for `body`, signed now (or at `nowSeconds`). */
export function signRequest(secret: string, body: string, nowSeconds = Math.floor(Date.now() / 1000)): Record<string, string> {
  const timestamp = String(nowSeconds);
  return { [TIMESTAMP_HEADER]: timestamp, [SIGNATURE_HEADER]: `v1=${mac(secret, timestamp, body)}` };
}

export type SignatureCheck = "ok" | "missing" | "stale" | "mismatch";

/** Checks the headers against the raw body as received. */
export function checkSignature(
  secret: string,
  headers: Record<string, string | undefined>,
  rawBody: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): SignatureCheck {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const timestamp = lower[TIMESTAMP_HEADER];
  const signature = lower[SIGNATURE_HEADER];
  if (!secret || !timestamp || !signature || !/^\d{1,12}$/.test(timestamp)) return "missing";
  if (Math.abs(nowSeconds - Number(timestamp)) > SIGNATURE_SKEW_SECONDS) return "stale";
  const expected = Buffer.from(`v1=${mac(secret, timestamp, rawBody)}`);
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given) ? "ok" : "mismatch";
}
