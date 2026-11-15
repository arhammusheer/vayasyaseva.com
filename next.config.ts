import type { NextConfig } from "next";

/**
 * Production: Vercel's production deployment; off Vercel, a production
 * build. HSTS goes out there only: previews already get it from vercel.app,
 * and a pinned host would outlive a local or staging test.
 */
const production = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";

/** The jobs form's uploads go straight from the browser to this R2 endpoint (src/lib/talent-intake/server.ts). */
const R2_UPLOADS = "https://3f03827748ac33418f1176adaa436f26.r2.cloudflarestorage.com";

/**
 * A full Content-Security-Policy, sent as Report-Only: browsers report what
 * it would block in the console and block nothing. Every source the site
 * loads is listed: Next's inline bootstrap ('unsafe-inline': the pages are
 * static, so there is no per-request nonce), Turnstile, Vercel Analytics
 * (/_vercel, same origin), Umami (/_t, same origin), and after "Allow All"
 * the Google tag (GA4 and Ads) and the Meta Pixel. A local production build
 * (home, contact, jobs apply, a wage page; before and after "Allow All")
 * reported only Zod's eval probe (`Function("")` in a try/catch; Zod then
 * parses without it). Umami, the Pixel and Vercel Analytics need production
 * env and could not be loaded there, so it stays Report-Only until the
 * production console shows no other reports; then rename the header to
 * Content-Security-Policy and merge in frame-ancestors.
 */
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    "https://challenges.cloudflare.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://www.googleadservices.com",
    "https://googleads.g.doubleclick.net",
    "https://connect.facebook.net",
    "https://va.vercel-scripts.com",
  ].join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    R2_UPLOADS,
    "https://challenges.cloudflare.com",
    "https://www.googletagmanager.com",
    "https://*.google-analytics.com",
    "https://analytics.google.com",
    "https://*.analytics.google.com",
    "https://www.google.com",
    "https://www.googleadservices.com",
    "https://*.doubleclick.net",
    "https://www.facebook.com",
    "https://connect.facebook.net",
  ].join(" "),
  "frame-src https://challenges.cloudflare.com https://www.googletagmanager.com https://*.doubleclick.net https://www.facebook.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self' https://umami.vayasyaseva.com",
].join("; ");

const securityHeaders = [
  ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Framing: our own pages plus the Umami dashboard, whose heatmaps render the
  // live page in an iframe. frame-ancestors replaces X-Frame-Options, which
  // can't name another origin.
  { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://umami.vayasyaseva.com" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Geolocation for our own pages only: the jobs form's "Use my location"
  // (src/components/jobs/home-step.tsx). Without (self) the browser refuses it unasked.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()" },
];

/**
 * The API routes whose answers carry personal data or what stands for it
 * (case IDs, references, tickets, upload URLs, alert states): never stored
 * by a browser or a shared cache. The submission pipeline sets the same
 * header (src/server/submissions/pipeline.ts); this covers every route here
 * whatever its code does. /api/context sets its own private, no-store, and
 * /api/umami-recorder is a public script.
 */
const PERSONAL_API = "/api/:route(contact|agent|jobs|alerts)/:path*";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The contracts workspace package (packages/contracts) ships TypeScript source.
  transpilePackages: ["@vspl/contracts"],
  env: {
    // Build-time flag (src/content/registry/index.ts): inlined so the server,
    // the browser and the proxy agree on which drafts exist.
    VSPL_SHOW_DRAFTS: process.env.VSPL_SHOW_DRAFTS ?? "",
  },
  experimental: {
    // The root layout is per locale (app/[locale]), so unmatched URLs need their own 404.
    globalNotFound: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: PERSONAL_API, headers: [{ key: "Cache-Control", value: "no-store" }] },
      {
        // Downloadable brand assets are immutable once generated.
        source: "/brand/downloads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  // No redirects() here: they run before src/proxy.ts, so a rule here would
  // add a hop in front of the proxy's own redirect. The apex host and the old
  // locale prefixes (/hi, /hinglish) are handled in the proxy, in one hop.
};

export default nextConfig;
