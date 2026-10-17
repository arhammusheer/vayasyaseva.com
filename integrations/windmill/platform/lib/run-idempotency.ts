/**
 * f/platform/idempotency: the durable Idempotency-Key store behind the site's
 * IdempotencyStore interface (src/server/submissions/policies/idempotency.ts),
 * so a retry that lands on another Vercel instance still gets the first
 * answer. Keys of the jobs routes live in the talent database, keys of the
 * contact routes in the lead inbox: each with the data it guards.
 *
 *   begin     { op, scope, key, fingerprint } → { state: new | replay | in_progress | mismatch, answer?, carry? }
 *   complete  { op, scope, key, answer }      → { ok }
 *   abandon   { op, scope, key, carry? }      → { ok }
 */
import { respond } from "../../talent/lib/response.ts";
import type { Query } from "../../talent/lib/db.ts";
import { IDEMPOTENCY_ABANDON, IDEMPOTENCY_BEGIN, IDEMPOTENCY_COMPLETE, IDEMPOTENCY_SWEEP } from "./idempotency-sql.ts";

const KEY = /^[A-Za-z0-9_.:-]{8,128}$/;
const MAX_JSON = 64 * 1024;

export type Store = "talent" | "leads";

/** Which database guards a route's keys. */
export function storeFor(scope: string): Store | null {
  if (/^\/api\/(agent\/)?jobs(\/(start|submit))?$/.test(scope)) return "talent";
  if (/^\/api\/(agent\/)?contact$/.test(scope)) return "leads";
  return null;
}

interface Request {
  op: "begin" | "complete" | "abandon";
  scope: string;
  key: string;
  fingerprint?: string;
  answer?: { status: number; body: unknown };
  carry?: Record<string, string> | null;
}

function parse(body: unknown): Request | null {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (b.op !== "begin" && b.op !== "complete" && b.op !== "abandon") return null;
  if (typeof b.scope !== "string" || !storeFor(b.scope) || typeof b.key !== "string" || !KEY.test(b.key)) return null;
  if (b.op === "begin" && (typeof b.fingerprint !== "string" || !/^[\w-]{10,100}$/.test(b.fingerprint))) return null;
  if (b.op === "complete") {
    const a = b.answer as { status?: unknown } | undefined;
    if (!a || typeof a !== "object" || typeof a.status !== "number" || JSON.stringify(a).length > MAX_JSON) return null;
  }
  if (b.carry !== undefined && b.carry !== null) {
    if (typeof b.carry !== "object" || Object.values(b.carry).some((v) => typeof v !== "string") || JSON.stringify(b.carry).length > 2048) return null;
  }
  return b as unknown as Request;
}

interface Before {
  fingerprint: string;
  state: "running" | "done" | "failed";
  answer: unknown;
  carry: Record<string, string> | null;
}

export async function runIdempotency(authorized: boolean, body: unknown, db: (store: Store, fn: (query: Query) => Promise<unknown>) => Promise<unknown>) {
  if (!authorized) return respond(403, { ok: false, error: "Forbidden" });
  const r = parse(body);
  if (!r) return respond(400, { ok: false, error: "Invalid request" });
  const store = storeFor(r.scope)!;
  try {
    if (r.op === "complete") {
      await db(store, (q) => q(IDEMPOTENCY_COMPLETE, [r.scope, r.key, JSON.stringify(r.answer)]));
      return respond(200, { ok: true });
    }
    if (r.op === "abandon") {
      await db(store, (q) => q(IDEMPOTENCY_ABANDON, [r.scope, r.key, r.carry ? JSON.stringify(r.carry) : null]));
      return respond(200, { ok: true });
    }
    const row = (await db(store, async (q) => {
      await q(IDEMPOTENCY_SWEEP);
      return (await q<{ before: Before | null; claimed: boolean }>(IDEMPOTENCY_BEGIN, [r.scope, r.key, r.fingerprint]))[0];
    })) as { before: Before | null; claimed: boolean } | undefined;
    const before = row?.before ?? null;
    if (row?.claimed) return respond(200, { state: "new", ...(before?.carry ? { carry: before.carry } : {}) });
    if (!before) return respond(200, { state: "in_progress" });
    if (before.fingerprint !== r.fingerprint) return respond(200, { state: "mismatch" });
    if (before.state === "done") return respond(200, { state: "replay", answer: before.answer });
    return respond(200, { state: "in_progress" });
  } catch (err) {
    console.error("idempotency failed:", r.op, r.scope, err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
    return respond(500, { ok: false, error: "Internal error" });
  }
}
