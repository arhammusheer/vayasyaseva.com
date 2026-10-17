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
 * The store sits behind an interface: Windmill's durable store
 * (windmillIdempotencyStore) once the site has SUBMISSION_SIGNING_SECRET,
 * else this instance's memory (a retry that reaches another Vercel instance
 * then runs again, as it did before keys existed).
 */
import { createHash } from "node:crypto";
import { IDEMPOTENCY_KEY_PATTERN } from "@vspl/contracts/envelope";
import { signRequest } from "@vspl/contracts/signing";

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

const IDEMPOTENCY_URL = "https://hooks.vayasyaseva.com/api/r/webhook/vspl-idempotency";
const DURABLE_TIMEOUT_MS = 2_500;

/**
 * The durable store: Windmill's f/platform/idempotency (signed like the
 * envelope route), which keeps the jobs routes' keys in the talent database
 * and the contact routes' keys in the lead inbox, so a retry that reaches
 * another Vercel instance still gets the first answer. If Windmill does not
 * answer in time, this instance's memory takes over for that call: a
 * submission is never refused because the store is down.
 */
export function windmillIdempotencyStore(fallback: IdempotencyStore, fetchImpl: typeof fetch = fetch): IdempotencyStore {
  async function call(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const secret = process.env.SUBMISSION_SIGNING_SECRET?.trim();
    if (!secret) throw new Error("SUBMISSION_SIGNING_SECRET is not set");
    const raw = JSON.stringify(body);
    const res = await fetchImpl(process.env.SUBMISSION_IDEMPOTENCY_URL?.trim() || IDEMPOTENCY_URL, {
      method: "POST",
      headers: { "content-type": "application/json", ...signRequest(secret, raw) },
      body: raw,
      signal: AbortSignal.timeout(DURABLE_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`idempotency store answered ${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  }
  const warn = (op: string, error: unknown) =>
    console.warn("[IDEMPOTENCY STORE FALLBACK]", { op, error: error instanceof Error ? error.message : "unknown" });
  return {
    async begin(scope, key, fingerprint) {
      try {
        const r = await call({ op: "begin", scope, key, fingerprint });
        if (r.state === "replay" && r.answer && typeof r.answer === "object") return { state: "replay", answer: r.answer as StoredAnswer };
        if (r.state === "in_progress" || r.state === "mismatch") return { state: r.state };
        if (r.state === "new") return r.carry && typeof r.carry === "object" ? { state: "new", carry: r.carry as Record<string, string> } : { state: "new" };
        throw new Error(`unexpected answer ${String(r.state)}`);
      } catch (error) {
        warn("begin", error);
        return fallback.begin(scope, key, fingerprint);
      }
    },
    async complete(scope, key, answer) {
      await fallback.complete(scope, key, answer);
      await call({ op: "complete", scope, key, answer }).catch((error) => warn("complete", error));
    },
    async abandon(scope, key, carry) {
      await fallback.abandon(scope, key, carry);
      await call({ op: "abandon", scope, key, carry: carry ?? null }).catch((error) => warn("abandon", error));
    },
  };
}

const memory = memoryIdempotencyStore();
const durable = windmillIdempotencyStore(memory);
let override: IdempotencyStore | null = null;

/** Windmill's store once the site has SUBMISSION_SIGNING_SECRET; this instance's memory until then. */
export const idempotencyStore = (): IdempotencyStore =>
  override ?? (process.env.SUBMISSION_SIGNING_SECRET?.trim() ? durable : memory);

/** Tests only. */
export function setIdempotencyStore(next: IdempotencyStore | null) {
  override = next;
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
