import type { NextRequest } from "next/server";

/**
 * The caller's IP as Vercel reports it, or null. The rate limits themselves
 * are src/server/submissions/policies/rate-limit.ts.
 */
export function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || null;
}
