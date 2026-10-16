import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

/** Old locale prefixes and their current segments. */
const OLD_PREFIXES = [
  ["hi", "hi-in"],
  ["hinglish", "hi-latn-in"],
] as const;
const APEX_HOST = { type: "host", value: "vayasyaseva.com" } as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
      {
        // Downloadable brand assets are immutable once generated.
        source: "/brand/downloads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  async redirects() {
    return [
      // The apex host (vayasyaseva.com) redirects to www in src/proxy.ts, in
      // one hop with the locale routing. Redirects here run before the proxy,
      // so a host rule here would bring back the second hop.
      // Old locale prefixes (before 1 October 2026). English had none and is
      // handled by the locale routing in src/proxy.ts. On the apex they go
      // straight to www, so an old link there is one hop too.
      ...OLD_PREFIXES.flatMap(([from, to]) =>
        [
          { source: `/${from}`, destination: `/${to}` },
          { source: `/${from}/:path*`, destination: `/${to}/:path*` },
        ].flatMap((rule) => [
          { ...rule, has: [APEX_HOST], destination: `https://www.vayasyaseva.com${rule.destination}`, permanent: true },
          { ...rule, permanent: true },
        ]),
      ),
    ];
  },
};

export default nextConfig;
