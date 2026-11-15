/**
 * Pseudonyms for personal data the submission routes need to compare but
 * must never write down: the same email and phone always give the same short
 * value, so the duplicate checks and rate limits still match a sender, and a
 * log line can say "the same sender again" without the address or number.
 *
 * A keyed hash (HMAC-SHA-256), not a plain SHA-256: Indian mobile numbers
 * are about four billion values and emails are guessable, so an unkeyed hash
 * in a log is reversed by trying them all. The key is derived from a secret
 * the site already has (no new env var), with its own label so it is never
 * the key that signs anything else:
 *
 *   TICKET_SIGNING_KEY, else TALENT_INTAKE_WEBHOOK_SECRET, else
 *   SUBMISSION_SIGNING_SECRET; with none (local development), a random key
 *   for this process, so values match only within one instance.
 *
 * Rotating the chosen secret changes every pseudonym, which only means logs
 * from before and after the rotation no longer line up.
 */
import { createHmac, randomBytes } from "node:crypto";

const LABEL = "vspl-log-pseudonym-v1";
const SECRETS = ["TICKET_SIGNING_KEY", "TALENT_INTAKE_WEBHOOK_SECRET", "SUBMISSION_SIGNING_SECRET"] as const;
/** 96 bits: no collisions in practice, short enough to read in a log line. */
const LENGTH = 16;

let processKey: Buffer | undefined;
let derived: { from: string; key: Buffer } | undefined;

function key(): Buffer {
  const secret = SECRETS.map((name) => process.env[name]?.trim()).find(Boolean);
  if (!secret) return (processKey ??= randomBytes(32));
  if (derived?.from !== secret) derived = { from: secret, key: createHmac("sha256", secret).update(LABEL).digest() };
  return derived.key;
}

/** A short keyed hash of the parts (joined with a separator no part can hold). */
export function pseudonym(...parts: string[]): string {
  return createHmac("sha256", key()).update(parts.join("\u0000")).digest("base64url").slice(0, LENGTH);
}
