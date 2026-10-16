import { visitorRegion } from "@/lib/language-rank";

/**
 * The visitor's country and state, from the request's geo headers (Vercel,
 * or Cloudflare when self-hosted), for the header's area intent
 * (src/lib/intent). No location permission is asked; nothing is stored or
 * logged here. Private and uncached, since it differs per visitor.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { country, region } = visitorRegion(request.headers);
  return Response.json({ country: country ?? null, region: region ?? null }, { headers: { "cache-control": "private, no-store" } });
}
