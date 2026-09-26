import { NextResponse, type NextRequest } from "next/server";

/**
 * First-party proxy for our self-hosted Umami: /_t/s.js (tracker) and /_t/e
 * (collection) go to t.vayasyaseva.com.
 *
 * A plain rewrite is not enough: Traefik in front of Umami does not trust
 * forwarded headers, so it overwrites X-Forwarded-For with Vercel's egress IP
 * and every visitor looks like one Vercel server. Here the visitor's IP goes in
 * a header Traefik leaves alone, which Umami reads via CLIENT_IP_HEADER
 * (vayasya-infra apps/umami). Vercel's geo headers are passed explicitly too;
 * Umami uses them for country, region and city.
 */
const UMAMI_ORIGIN = "https://t.vayasyaseva.com";
const CLIENT_IP_HEADER = "x-vspl-client-ip";
const GEO_HEADERS = ["x-vercel-ip-country", "x-vercel-ip-country-region", "x-vercel-ip-city"];

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  // Never pass through a value the visitor sent themselves.
  headers.delete(CLIENT_IP_HEADER);
  if (ip) headers.set(CLIENT_IP_HEADER, ip);
  for (const name of GEO_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const target = new URL(request.nextUrl.pathname.replace(/^\/_t/, "") + request.nextUrl.search, UMAMI_ORIGIN);
  return NextResponse.rewrite(target, { request: { headers } });
}

export const config = {
  matcher: "/_t/:path*",
};
