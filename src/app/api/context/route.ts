import { visitorCity, visitorRegion } from "@/lib/language-rank";

/**
 * The visitor's country, state and city, from the request's geo headers
 * (Vercel, or Cloudflare when self-hosted), for the site's area intent
 * (src/lib/intent): the city narrows a state to the market inside it
 * (Haridwar in Uttarakhand, Jalandhar–Kapurthala in Punjab). No location
 * permission is asked; nothing is stored or logged here. Private and
 * uncached, since it differs per visitor.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { country, region } = visitorRegion(request.headers);
  // Region codes repeat across countries (PB is also Pakistan's Punjab, UT a US
  // state): state and city only for visitors in India.
  const india = country === "IN";
  return Response.json(
    { country: country ?? null, region: india ? (region ?? null) : null, city: india ? (visitorCity(request.headers) ?? null) : null },
    { headers: { "cache-control": "private, no-store" } },
  );
}
