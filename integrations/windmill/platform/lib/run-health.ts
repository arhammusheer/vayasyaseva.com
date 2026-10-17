/**
 * f/platform/health: counts of work that needs a person, for the
 * notification hub to read (it does not notify anyone itself).
 *
 *   dead      deliveries that hit their attempt cap
 *   unknown   SMS whose send was interrupted (never resent automatically)
 *   stuck     deliveries running for more than 15 minutes
 *   overdue   deliveries due more than an hour ago (the dispatcher is not running)
 *
 * Per database (talent, leads) and target. A database that cannot be read is
 * reported under `errors`, so the hub can tell "nothing wrong" from "could not look".
 */
import type { Query } from "../../talent/lib/db.ts";

export const HEALTH_COUNTS = `
SELECT target, reason, count(*)::int AS count, min(updated_at) AS oldest
FROM deliveries_attention GROUP BY target, reason ORDER BY target, reason;`;

export const HEALTH_ERASURE = `SELECT count(*)::int AS failed FROM erasure_requests WHERE status = 'failed';`;

type Reason = "dead" | "unknown" | "stuck" | "overdue";
export type Counts = Record<Reason, Record<string, number>> & { oldest: string | null };

export interface Health {
  ok: boolean;
  checkedAt: string;
  talent: (Counts & { erasureFailed: number }) | null;
  leads: Counts | null;
  errors: string[];
}

const empty = (): Counts => ({ dead: {}, unknown: {}, stuck: {}, overdue: {}, oldest: null });

async function counts(query: Query): Promise<Counts> {
  const out = empty();
  for (const row of await query<{ target: string; reason: Reason; count: number; oldest: string | Date }>(HEALTH_COUNTS)) {
    out[row.reason][row.target] = row.count;
    const oldest = new Date(row.oldest).toISOString();
    if (!out.oldest || oldest < out.oldest) out.oldest = oldest;
  }
  return out;
}

const total = (c: Counts | null) => (c ? (["dead", "unknown", "stuck", "overdue"] as Reason[]).reduce((n, r) => n + Object.values(c[r]).reduce((a, b) => a + b, 0), 0) : 0);

export async function runHealth(db: { talent: <T>(fn: (q: Query) => Promise<T>) => Promise<T>; leads: <T>(fn: (q: Query) => Promise<T>) => Promise<T> }, now = new Date()): Promise<Health> {
  const errors: string[] = [];
  const talent = await db
    .talent(async (q) => ({ ...(await counts(q)), erasureFailed: (await q<{ failed: number }>(HEALTH_ERASURE))[0]?.failed ?? 0 }))
    .catch((err) => (errors.push(`talent: ${err instanceof Error ? err.message : "unknown error"}`), null));
  const leads = await db.leads(counts).catch((err) => (errors.push(`leads: ${err instanceof Error ? err.message : "unknown error"}`), null));
  return {
    ok: errors.length === 0 && total(talent) === 0 && total(leads) === 0 && (talent?.erasureFailed ?? 0) === 0,
    checkedAt: now.toISOString(),
    talent,
    leads,
    errors,
  };
}
