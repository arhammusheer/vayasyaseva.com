import { NextResponse, type NextRequest } from "next/server";
import { FALLBACK_LOCALE, fromLegacyPrefix, isGone, localePath, localesOf, movedPathname, neutralTarget, splitLocalePath } from "@/lib/i18n";
import { LANGUAGE_COOKIE, isRankSegment, rankSegmentFor, visitorRegion } from "@/lib/language-rank";

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

/**
 * The language picker (app/(picker)/select-language/[rank]); reached only by
 * the rewrite below. [rank] is the order of the choices for this request
 * (src/lib/language-rank.ts), one prerendered variant per order.
 */
const PICKER_ROUTE = "/select-language";
/** A path under a locale that no route serves, so it renders the 404 page. */
const GONE_PATH = "/_gone";
const isGoneRewrite = (response: NextResponse) =>
  new URL(response.headers.get("x-middleware-rewrite") ?? "/", "http://x").pathname.endsWith(GONE_PATH);
const PER_VISITOR_CACHE_HEADERS = ["CDN-Cache-Control", "Cloudflare-CDN-Cache-Control"];

/**
 * Locale routing (src/lib/i18n.ts). Every page lives under a locale segment.
 * A neutral URL (no segment) opens the page's default language, or shows the
 * language picker when the page's override is "prompt". The address bar keeps
 * the neutral URL for the picker, so /jobs stays shareable as is.
 *
 * Old locale prefixes (/hi/*, /hinglish/*, before 1 October 2026) are mapped
 * here rather than in next.config.ts redirects, which run before the proxy:
 * the mapped URL is routed in turn, so an old link takes one redirect to its
 * final page even when that page has moved or retired since.
 */
function routeLocale(request: NextRequest, pathname = request.nextUrl.pathname): NextResponse {
  const legacy = fromLegacyPrefix(pathname);
  if (legacy !== undefined) {
    const routed = routeLocale(request, legacy);
    // Permanent even where the mapped URL's own redirect is temporary
    // (/hi -> /en-in while the Hindi home is unbuilt): the old prefix never
    // comes back, so search engines should drop it.
    const location = routed.headers.get("location");
    if (location && (routed.status === 307 || routed.status === 308)) return NextResponse.redirect(location, 308);
    // A 404 answers at the old URL itself, with no hop to a dead new one.
    if (isGoneRewrite(routed)) return routed;
    const url = request.nextUrl.clone();
    url.pathname = legacy;
    return NextResponse.redirect(url, 308);
  }

  const { locale, path } = splitLocalePath(pathname);
  const url = request.nextUrl.clone();
  url.pathname = pathname;

  // Aliases and retired pages or languages (src/content/registry): one 308
  // straight to the target page, in the language asked for when the target
  // is published in it (reviewers in an unpublished locale may land on a
  // built version). The target may carry an #anchor.
  const moved = movedPathname(path, locale);
  if (moved) {
    const [movedPath, anchor] = moved.split("#");
    url.pathname = movedPath;
    url.hash = anchor ? `#${anchor}` : "";
    return NextResponse.redirect(url, 308);
  }
  // Retired with no target, or never built: a 404 at the URL asked for,
  // with no hop to another language. Rewritten to a path no route has, so it
  // is a 404 even where the page's route folder still exists. The 404 page
  // is the shared English one, with no phone (src/app/[locale]/not-found.tsx).
  if (isGone(path, locale)) {
    url.pathname = localePath(GONE_PATH, locale ?? FALLBACK_LOCALE);
    return NextResponse.rewrite(url);
  }

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
    const [, rank, ...rest] = pathname.slice(PICKER_ROUTE.length).split("/");
    const segments = isRankSegment(rank) ? rest : [rank, ...rest].filter((s) => s !== undefined);
    url.pathname = `/${segments.join("/")}`.replace(/\/$/, "") || "/";
    return NextResponse.redirect(url, 308);
  }

  const target = neutralTarget(path);
  if (target === "prompt") {
    if (locale) return NextResponse.redirect(url, 307);
    // The order of the choices for this visitor; never a redirect, and the
    // page is the same set of links whatever the order (PLAN §6.4).
    const rank = rankSegmentFor(
      path,
      {
        chosen: request.cookies.get(LANGUAGE_COOKIE)?.value,
        acceptLanguage: request.headers.get("accept-language"),
        ...visitorRegion(request.headers),
      },
      request.nextUrl.searchParams,
    );
    url.pathname = `${PICKER_ROUTE}/${rank}${path === "/" ? "" : path}`;
    const response = NextResponse.rewrite(url);
    // The order differs per visitor, but the prerendered variant still says
    // s-maxage: no shared cache in front of a self-hosted server (Cloudflare,
    // an ingress cache, another CDN) may keep one visitor's order for /jobs.
    // CDN-Cache-Control is the portable opt-out (Cloudflare honours it too).
    // On Vercel the proxy runs before its cache, which keys on the variant
    // path, so Vercel-CDN-Cache-Control (which wins there) keeps that cache.
    for (const name of PER_VISITOR_CACHE_HEADERS) response.headers.set(name, "no-store");
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=31536000");
    return response;
  }
  // Permanent for the neutral URL: the target stays a real page even if the
  // page's default changes later. Temporary for a missing translation
  // (/hi-in/about), which stops applying once the translation exists.
  url.pathname = localePath(path, target);
  return NextResponse.redirect(url, locale ? 307 : 308);
}

/** One canonical host. The apex is handled here, not in next.config.ts, so a page takes one hop. */
const APEX_HOST = "vayasyaseva.com";
const CANONICAL_ORIGIN = "https://www.vayasyaseva.com";
/** The paths routeLocale handles (the second matcher below, as a test). */
const PAGE_PATH = /^\/(?!api\/|_next\/|_vercel\/|_t\/|opengraph-image)(?!.*\.[a-zA-Z0-9]+$)/;

/**
 * vayasyaseva.com/about goes straight to www.vayasyaseva.com/en-in/about:
 * the locale routing's own redirect, on the canonical host, in one hop.
 * Pages that answer at their URL (the picker at /jobs, /en-in/about) and
 * everything else (files, the API) keep their path on www.
 */
function apexRedirect(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  let target = `${pathname}${search}`;
  let status = 308;
  if (PAGE_PATH.test(pathname)) {
    const routed = routeLocale(request);
    const location = routed.headers.get("location");
    if (location && (routed.status === 307 || routed.status === 308)) {
      const next = new URL(location, request.url);
      target = `${next.pathname}${next.search}${next.hash}`;
      status = routed.status;
    }
  }
  return NextResponse.redirect(new URL(target, CANONICAL_ORIGIN), status);
}

/**
 * The Host header's hostname: no port, no trailing dot ("vayasyaseva.com:443",
 * "vayasyaseva.com." both count). Read from the header, as nextUrl may carry
 * the server's own host when self-hosted.
 */
function requestHost(request: NextRequest) {
  return request.headers.get("host")?.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

export function proxy(request: NextRequest) {
  if (requestHost(request) === APEX_HOST) return apexRedirect(request);
  if (request.nextUrl.pathname.startsWith("/_t/")) return umami(request);
  return routeLocale(request);
}

export const config = {
  matcher: [
    "/_t/:path*",
    // Pages only: not the API, Next internals, metadata images or files with an extension.
    "/((?!api/|_next/|_vercel/|opengraph-image|.*\\.[a-zA-Z0-9]+$).*)",
    // Everything on the apex host, which redirects to www.
    { source: "/:path*", has: [{ type: "host", value: "vayasyaseva.com" }] },
  ],
};
