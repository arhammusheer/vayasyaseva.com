import { requestGeo } from "@/context/geo";

/**
 * The visitor's IP region for the visitor context (src/context), when the
 * proxy's vs_geo cookie is missing (cookies blocked, a request the proxy
 * didn't see): country and, for Indian visitors, state and market, never
 * the city. No location permission is asked; nothing is stored or logged
 * here. Private and uncached, since it differs per visitor.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return Response.json(requestGeo(request.headers) ?? {}, { headers: { "cache-control": "private, no-store" } });
}
