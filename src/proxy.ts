import { NextResponse, type NextRequest } from "next/server";
import { localePath, localesOf, neutralTarget, splitLocalePath } from "@/lib/i18n";

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

function umami(request: NextRequest) {
  // The replay recorder is patched before it is served (api/umami-recorder).
  if (request.nextUrl.pathname === "/_t/recorder.js") {
    return NextResponse.rewrite(new URL("/api/umami-recorder", request.url));
  }
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

/** The language picker (app/(picker)/select-language); reached only by the rewrite below. */
const PICKER_ROUTE = "/select-language";

/**
 * Locale routing (src/lib/i18n.ts). Every page lives under a locale segment.
 * A neutral URL (no segment) opens the page's default language, or shows the
 * language picker when the page's override is "prompt". The address bar keeps
 * the neutral URL for the picker, so /jobs stays shareable as is.
 */
function routeLocale(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, path } = splitLocalePath(pathname);
  const url = request.nextUrl.clone();

  if (locale) {
    // /hi-IN/jobs -> /hi-in/jobs: one spelling per page.
    const canonical = localePath(path, locale);
    if (pathname !== canonical && pathname !== `${canonical}/`) {
      url.pathname = canonical;
      return NextResponse.redirect(url, 308);
    }
    if (localesOf(path).includes(locale)) return NextResponse.next();
    // Not in this language (e.g. /hi-in/about): resolve it as a neutral URL.
    url.pathname = path;
  }

  // Direct visits to the picker's internal route go to the neutral URL.
  if (pathname === PICKER_ROUTE || pathname.startsWith(`${PICKER_ROUTE}/`)) {
    url.pathname = pathname.slice(PICKER_ROUTE.length) || "/";
    return NextResponse.redirect(url, 308);
  }

  const target = neutralTarget(path);
  if (target === "prompt") {
    if (locale) return NextResponse.redirect(url, 307);
    url.pathname = `${PICKER_ROUTE}${path === "/" ? "" : path}`;
    return NextResponse.rewrite(url);
  }
  // Permanent for the neutral URL: the target stays a real page even if the
  // page's default changes later. Temporary for a missing translation
  // (/hi-in/about), which stops applying once the translation exists.
  url.pathname = localePath(path, target);
  return NextResponse.redirect(url, locale ? 307 : 308);
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/_t/")) return umami(request);
  return routeLocale(request);
}

export const config = {
  // Pages only: not the API, Next internals, metadata images or files with an extension.
  matcher: ["/_t/:path*", "/((?!api/|_next/|_vercel/|opengraph-image|.*\\.[a-zA-Z0-9]+$).*)"],
};
