/**
 * Rate limits for the submission routes, behind one interface so a shared
 * store can replace the in-memory one without touching the routes. The site
 * has no shared counter today (no KV or Redis; Postgres sits behind Windmill,
 * which runs a job per call and would turn a flood into a backlog in front
 * of real leads), so each Vercel instance keeps its own counts: they slow a
 * flood from one source rather than enforce an exact global limit. The
 * shared limit in front is the Vercel WAF (docs/submissions-edge.md).
 *
 * The open agent routes (/api/agent/*) have no Turnstile, by design (AI
 * agents send for a person; src/content/ai-access-policy.ts), so their
 * limits are the tight ones: per IP over ten minutes and a day, per sender
 * or phone, and a budget for the whole route on this instance that no
 * spread of addresses can get around. IPv6 addresses count per /64, the
 * block one subscriber is given, so rotating addresses inside it gains
 * nothing.
 */

export interface RateLimiter {
  /** Counts `cost` requests (default 1) for `key`; false once `key` is over its limit. */
  take(key: string, now?: number, cost?: number): Promise<boolean>;
  /** Gives back requests that failed for reasons other than the caller's. */
  release(key: string, cost?: number): Promise<void>;
}

type MemoryRateLimiter = RateLimiter & { clear(): void };

/**
 * Fixed-window counter kept in this function instance's memory. At most
 * `maxKeys` keys are kept (the oldest window goes first), so a flood of new
 * addresses cannot grow memory without bound; the route budgets still count
 * every request.
 */
export function memoryRateLimiter({ windowMs, max, maxKeys = 20_000 }: { windowMs: number; max: number; maxKeys?: number }): MemoryRateLimiter {
  const hits = new Map<string, { start: number; count: number }>();
  let swept = 0;
  return {
    async take(key, now = Date.now(), cost = 1) {
      // Expired windows are dropped at most once a second, not on every request.
      if (now - swept >= Math.min(windowMs, 1_000)) {
        for (const [k, v] of hits) if (now - v.start >= windowMs) hits.delete(k);
        swept = now;
      }
      const entry = hits.get(key);
      if (!entry || now - entry.start >= windowMs) {
        hits.delete(key);
        while (hits.size >= maxKeys) hits.delete(hits.keys().next().value!);
        hits.set(key, { start: now, count: cost });
        return cost <= max;
      }
      entry.count += cost;
      return entry.count <= max;
    },
    async release(key, cost = 1) {
      const entry = hits.get(key);
      if (entry) entry.count = Math.max(0, entry.count - cost);
    },
    clear: () => hits.clear(),
  };
}

/** One slot: a limiter, the key it counts, and how many requests this one is (default 1). */
export type Slot = [RateLimiter, string] | [RateLimiter, string, number];

/**
 * Takes one slot from each limiter in turn and stops at the first refusal.
 * With `releaseOnRefusal`, the slots this call already took are given back,
 * so a refused request counts against none of them (the contact form's
 * rule: neither the IP nor the duplicate key was recorded unless both were
 * free); without it, the earlier slots stay taken (the agent routes' rule).
 * Returns `release` for a request that then fails on our side.
 */
export async function takeAll(slots: Slot[], { releaseOnRefusal = false, now = Date.now() } = {}) {
  const taken: [RateLimiter, string, number][] = [];
  const release = async () => {
    for (const [limiter, key, cost] of taken) await limiter.release(key, cost);
  };
  for (const [limiter, key, cost = 1] of slots) {
    if (!(await limiter.take(key, now, cost))) {
      if (releaseOnRefusal) {
        await limiter.release(key, cost);
        await release();
      }
      return { allowed: false as const, release: async () => {} };
    }
    taken.push([limiter, key, cost]);
  }
  return { allowed: true as const, release };
}

/**
 * The key an IP is counted under: an IPv4 address as is, an IPv6 address by
 * its /64 (an IPv4-mapped one as the IPv4 address), "unknown" without one.
 */
export function ipKey(ip: string | null | undefined): string {
  if (!ip) return "unknown";
  const address = ip.trim().toLowerCase().split("%")[0];
  if (!address.includes(":")) return address;
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(address);
  if (mapped) return mapped[1];
  const [head, tail] = address.split("::");
  const front = head ? head.split(":") : [];
  const back = tail === undefined ? [] : tail ? tail.split(":") : [];
  const groups = tail === undefined ? front : [...front, ...Array(Math.max(0, 8 - front.length - back.length)).fill("0"), ...back];
  const prefix = groups.slice(0, 4).map((g) => (Number.parseInt(g, 16) || 0).toString(16));
  return `${prefix.join(":")}::/64`;
}

/** The key a route's own budget on this instance is counted under. */
export const ROUTE_BUDGET = "route";

// --- Each route's limits --------------------------------------------------------

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** /api/contact (website form, Turnstile): one enquiry a minute per IP, and the same email+phone once in five minutes per IP. */
export const contactFormLimits = {
  perIp: memoryRateLimiter({ windowMs: MINUTE, max: 1 }),
  duplicate: memoryRateLimiter({ windowMs: 5 * MINUTE, max: 1 }),
};

/**
 * /api/agent/contact: 3 per IP in ten minutes and 10 a day; 1 per sender
 * (email+phone) in ten minutes and 3 a day; 20 in ten minutes for the whole
 * route on this instance.
 */
export const agentContactLimits = {
  perIp: memoryRateLimiter({ windowMs: 10 * MINUTE, max: 3 }),
  perIpDaily: memoryRateLimiter({ windowMs: DAY, max: 10 }),
  perSender: memoryRateLimiter({ windowMs: 10 * MINUTE, max: 1 }),
  perSenderDaily: memoryRateLimiter({ windowMs: DAY, max: 3 }),
  route: memoryRateLimiter({ windowMs: 10 * MINUTE, max: 20 }),
};

/**
 * /api/alerts/subscribe: 5 per IP in ten minutes and 3 per address an hour
 * (Windmill also sends one address at most one email in ten minutes).
 * /api/alerts/confirm and /unsubscribe (the links in our emails): 30 per IP in ten minutes.
 */
export const alertLimits = {
  perIp: memoryRateLimiter({ windowMs: 10 * MINUTE, max: 5 }),
  perEmail: memoryRateLimiter({ windowMs: HOUR, max: 3 }),
  links: memoryRateLimiter({ windowMs: 10 * MINUTE, max: 30 }),
};

/**
 * /api/agent/jobs, /start and /submit, counted together: 6 per IP in ten
 * minutes and 20 a day; 3 per phone an hour; 40 in ten minutes for the
 * three routes on this instance. /start also counts the upload URLs it
 * hands out: 16 files per IP an hour (two applications with the most
 * files) and 120 an hour on this instance.
 */
export const agentJobsLimits = {
  perIp: memoryRateLimiter({ windowMs: 10 * MINUTE, max: 6 }),
  perIpDaily: memoryRateLimiter({ windowMs: DAY, max: 20 }),
  perPhone: memoryRateLimiter({ windowMs: HOUR, max: 3 }),
  route: memoryRateLimiter({ windowMs: 10 * MINUTE, max: 40 }),
  filesPerIp: memoryRateLimiter({ windowMs: HOUR, max: 16 }),
  files: memoryRateLimiter({ windowMs: HOUR, max: 120 }),
};

/** Tests only: every count back to zero. */
export function resetRateLimitsForTests() {
  for (const group of [contactFormLimits, agentContactLimits, alertLimits, agentJobsLimits]) {
    for (const limiter of Object.values(group)) limiter.clear();
  }
}
