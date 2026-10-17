/**
 * Idempotency-Key for every submission route (optional). A caller that sends
 * the same key with the same request gets the first answer again (the same
 * reference or case ID) instead of a second submission. The website's forms
 * send a UUID kept in session storage; AI agents may send one.
 *
 *   no key                     the route runs as it always has
 *   new key                    runs; a 2xx answer is kept for 24 hours
 *   same key, same request     the kept answer, with `idempotent-replayed: true`
 *   same key, still running    409 { error: "in_progress" }
 *   same key, other request    422 { error: "idempotency_key_reused" }
 *   malformed key              400 { error: "invalid_idempotency_key" }
 *
 * A failed run (not 2xx) is forgotten, so the retry runs again; a route may
 * leave a note for that retry (`carry`), e.g. the case ID it had issued, so
 * the retry files under the same one.
 *
 * The store sits behind an interface: in this instance's memory for now
 * (a retry that reaches another Vercel instance runs again, as before); a
 * durable store comes with the Windmill submission inbox.
 */
import { createHash } from "node:crypto";
import { IDEMPOTENCY_KEY_PATTERN } from "@vspl/contracts/envelope";

export const IDEMPOTENCY_HEADER = "idempotency-key";
export const REPLAYED_HEADER = "idempotent-replayed";

export interface StoredAnswer {
  status: number;
  body: unknown;
}

export type Begin =
  | { state: "new"; carry?: Record<string, string> }
  | { state: "replay"; answer: StoredAnswer }
  | { state: "in_progress" }
  | { state: "mismatch" };

export interface IdempotencyStore {
  /** Claims `key` in `scope` for a request with this fingerprint. */
  begin(scope: string, key: string, fingerprint: string): Promise<Begin>;
  /** The run answered 2xx: keep the answer for replays. */
  complete(scope: string, key: string, answer: StoredAnswer): Promise<void>;
  /** The run failed: forget the claim, keeping `carry` for the retry. */
  abandon(scope: string, key: string, carry?: Record<string, string>): Promise<void>;
}

type Entry =
  | { state: "running"; fingerprint: string; at: number; carry?: Record<string, string> }
  | { state: "done"; fingerprint: string; at: number; answer: StoredAnswer }
  | { state: "failed"; fingerprint: string; at: number; carry?: Record<string, string> };

/** Kept answers last a day; a run that never finished is released after two minutes. */
const KEEP_MS = 24 * 60 * 60_000;
const RUNNING_MS = 2 * 60_000;
const MAX_ENTRIES = 5_000;

export function memoryIdempotencyStore({ now = () => Date.now() } = {}): IdempotencyStore {
  const entries = new Map<string, Entry>();
  const id = (scope: string, key: string) => `${scope}\n${key}`;
  const sweep = (t: number) => {
    for (const [k, e] of entries) if (t - e.at >= KEEP_MS) entries.delete(k);
    // Oldest first (insertion order) when full.
    while (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value!);
  };
  return {
    async begin(scope, key, fingerprint) {
      const t = now();
      sweep(t);
      const k = id(scope, key);
      const e = entries.get(k);
      if (e && e.fingerprint !== fingerprint) return { state: "mismatch" };
      if (e?.state === "done") return { state: "replay", answer: e.answer };
      if (e?.state === "running" && t - e.at < RUNNING_MS) return { state: "in_progress" };
      const carry = e?.state === "failed" || e?.state === "running" ? e.carry : undefined;
      entries.delete(k);
      entries.set(k, { state: "running", fingerprint, at: t, carry });
      return carry ? { state: "new", carry } : { state: "new" };
    },
    async complete(scope, key, answer) {
      const e = entries.get(id(scope, key));
      if (e) entries.set(id(scope, key), { state: "done", fingerprint: e.fingerprint, at: now(), answer });
    },
    async abandon(scope, key, carry) {
      const e = entries.get(id(scope, key));
      if (!e) return;
      if (carry) entries.set(id(scope, key), { state: "failed", fingerprint: e.fingerprint, at: now(), carry });
      else entries.delete(id(scope, key));
    },
  };
}

let store: IdempotencyStore = memoryIdempotencyStore();

export const idempotencyStore = () => store;

/** Tests, and the durable store when it lands. */
export function setIdempotencyStore(next: IdempotencyStore) {
  store = next;
}

/** The header's key; null when absent, "invalid" when malformed. */
export function idempotencyKeyOf(headers: Headers): string | null | "invalid" {
  const raw = headers.get(IDEMPOTENCY_HEADER);
  if (raw === null) return null;
  const key = raw.trim();
  return IDEMPOTENCY_KEY_PATTERN.test(key) ? key : "invalid";
}

/** Stable JSON (sorted keys), so the same request always has the same fingerprint. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stable((value as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export const fingerprintOf = (value: unknown) => createHash("sha256").update(stable(value)).digest("base64url");
