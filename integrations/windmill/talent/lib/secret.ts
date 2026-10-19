/** The shared-secret check of the talent webhooks (intake, delivery reports), in constant time. */
import { timingSafeEqual } from "node:crypto";

export function secretMatches(given: string | undefined, expected: string): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
