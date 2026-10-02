import type { NextRequest } from "next/server";

/** The caller's IP as Vercel reports it, or null. */
export function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || null;
}

/**
 * Fixed-window counter kept in the function instance's memory. On Vercel each
 * instance has its own, so this slows a flood from one source rather than
 * enforcing an exact global limit.
 */
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, { start: number; count: number }>();

  return {
    /** Counts one request for `key`; false once `key` is over its limit. */
    take(key: string, now = Date.now()): boolean {
      for (const [k, v] of hits) if (now - v.start >= windowMs) hits.delete(k);
      const entry = hits.get(key);
      if (!entry) {
        hits.set(key, { start: now, count: 1 });
        return true;
      }
      entry.count += 1;
      return entry.count <= max;
    },
    /** Gives back a request that failed for reasons other than the caller's. */
    release(key: string) {
      const entry = hits.get(key);
      if (entry && entry.count > 0) entry.count -= 1;
    },
  };
}
