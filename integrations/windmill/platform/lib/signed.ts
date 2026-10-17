/**
 * The preprocessor of the signed routes (webhook/vspl-submission,
 * webhook/vspl-idempotency): checks the site's HMAC over the timestamp and
 * the raw body (packages/contracts/src/signing.ts, five minutes of skew),
 * then parses the body. Only the outcome and the parsed body reach main, so
 * neither the secret nor the signature appears in the job's arguments. The
 * routes are created with raw_string, so Windmill passes the body exactly as
 * it was signed; without it every request is refused.
 */
import { checkSignature } from "../../../../packages/contracts/src/signing.ts";
import { config } from "../../talent/lib/config.ts";

export interface SignedHttpEvent {
  headers?: Record<string, string>;
  raw_string?: unknown;
  body?: unknown;
}

export async function signedPreprocessor(event: SignedHttpEvent, nowSeconds = Math.floor(Date.now() / 1000)) {
  const raw = typeof event.raw_string === "string" ? event.raw_string : null;
  let secret = "";
  try {
    secret = await config("submission_signing_secret");
  } catch {
    // Not configured: every request is refused.
  }
  if (raw === null || checkSignature(secret, event.headers ?? {}, raw, nowSeconds) !== "ok") return { authorized: false, body: null };
  try {
    return { authorized: true, body: JSON.parse(raw) as unknown };
  } catch {
    return { authorized: true, body: null };
  }
}
