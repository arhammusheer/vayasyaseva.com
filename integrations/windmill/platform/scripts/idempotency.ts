/**
 * f/platform/idempotency: the signed route `webhook/vspl-idempotency`, the
 * durable Idempotency-Key store the site uses when SUBMISSION_SIGNING_SECRET
 * is set (see platform/lib/run-idempotency.ts).
 */
import { withDatabase, withTalentDb } from "../../talent/lib/db.ts";
import { runIdempotency } from "../lib/run-idempotency.ts";
import { signedPreprocessor, type SignedHttpEvent } from "../lib/signed.ts";

export async function preprocessor(event: SignedHttpEvent) {
  return signedPreprocessor(event);
}

export async function main(authorized: boolean, body: unknown) {
  return runIdempotency(authorized, body, (store, fn) => (store === "talent" ? withTalentDb(fn) : withDatabase("leads_pg_url", fn)));
}
