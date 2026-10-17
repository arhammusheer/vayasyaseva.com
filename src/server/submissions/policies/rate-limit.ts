/**
 * Rate limits for the submission routes, behind one interface so a shared
 * store (Vercel WAF in front, a durable counter later) can replace the
 * in-memory one without touching the routes. The in-memory limiter stays the
 * fallback: each Vercel instance keeps its own counts, so it slows a flood
 * from one source rather than enforcing an exact global limit. The WAF rules
 * the owner should add in front are in docs/submissions-edge.md.
 */

export interface RateLimiter {
  /** Counts one request for `key`; false once `key` is over its limit. */
  take(key: string, now?: number): Promise<boolean>;
  /** Gives back a request that failed for reasons other than the caller's. */
  release(key: string): Promise<void>;
}

/** Fixed-window counter kept in this function instance's memory. */
export function memoryRateLimiter({ windowMs, max }: { windowMs: number; max: number }): RateLimiter {
  const hits = new Map<string, { start: number; count: number }>();
  return {
    async take(key, now = Date.now()) {
      for (const [k, v] of hits) if (now - v.start >= windowMs) hits.delete(k);
      const entry = hits.get(key);
      if (!entry) {
        hits.set(key, { start: now, count: 1 });
        return true;
      }
      entry.count += 1;
      return entry.count <= max;
    },
    async release(key) {
      const entry = hits.get(key);
      if (entry && entry.count > 0) entry.count -= 1;
    },
  };
}

/**
 * Takes one slot from each limiter in turn and stops at the first refusal.
 * With `releaseOnRefusal`, the slots this call already took are given back,
 * so a refused request counts against none of them (the contact form's
 * rule: neither the IP nor the duplicate key was recorded unless both were
 * free); without it, the earlier slots stay taken (the agent routes' rule).
 * Returns `release` for a request that then fails on our side.
 */
export async function takeAll(slots: [RateLimiter, string][], { releaseOnRefusal = false, now = Date.now() } = {}) {
  const taken: [RateLimiter, string][] = [];
  const release = async () => {
    for (const [limiter, key] of taken) await limiter.release(key);
  };
  for (const [limiter, key] of slots) {
    if (!(await limiter.take(key, now))) {
      if (releaseOnRefusal) {
        await limiter.release(key);
        await release();
      }
      return { allowed: false as const, release: async () => {} };
    }
    taken.push([limiter, key]);
  }
  return { allowed: true as const, release };
}

// --- The limits each route had, unchanged ----------------------------------------

/** /api/contact (website form): one enquiry a minute per IP, and the same email+phone once in five minutes per IP. */
export const contactFormLimits = {
  perIp: memoryRateLimiter({ windowMs: 60_000, max: 1 }),
  duplicate: memoryRateLimiter({ windowMs: 5 * 60_000, max: 1 }),
};

/** /api/agent/contact: 5 per IP and 1 per sender (email+phone) in ten minutes. */
export const agentContactLimits = {
  perIp: memoryRateLimiter({ windowMs: 10 * 60_000, max: 5 }),
  perSender: memoryRateLimiter({ windowMs: 10 * 60_000, max: 1 }),
};

/** /api/agent/jobs*: 10 per IP in ten minutes, 3 per phone an hour. */
export const agentJobsLimits = {
  perIp: memoryRateLimiter({ windowMs: 10 * 60_000, max: 10 }),
  perPhone: memoryRateLimiter({ windowMs: 60 * 60_000, max: 3 }),
};
