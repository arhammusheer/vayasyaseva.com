/**
 * The hub's two HTTP routes check a shared secret in their preprocessor, as
 * f/leads/intake does: only the outcome and the body reach main, so the
 * secret never appears in a job's arguments.
 */
import { timingSafeEqual } from "node:crypto";

export interface NotifyHttpEvent {
  headers?: Record<string, string>;
  body?: unknown;
}

export function lowerHeaders(event: NotifyHttpEvent): Record<string, string> {
  return Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
}

export function notifySecretMatches(given: string | undefined, expected: string): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The token of `Authorization: Bearer <token>` (how Alertmanager's http_config.authorization sends it). */
export function bearer(value: string | undefined): string | undefined {
  const m = value?.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : undefined;
}
