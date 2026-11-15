/**
 * The caller's IP as Vercel reports it, or null. One reading for the whole
 * site: the submission routes (their rate limits and Turnstile's remoteip)
 * and the Umami proxy (src/proxy.ts). The rate limits themselves are
 * src/server/submissions/policies/rate-limit.ts.
 *
 *   x-real-ip         set by Vercel's edge to the address that connected,
 *                     replacing any value the caller sent: read first.
 *   x-forwarded-for   the fallback, for a server without x-real-ip. Its first
 *                     entry is the caller's own claim unless the proxy in
 *                     front overwrites the header (Vercel does), so a
 *                     self-hosted deployment must put such a proxy in front.
 */
export function clientIp(request: { headers: Headers }): string | null {
  return request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}
