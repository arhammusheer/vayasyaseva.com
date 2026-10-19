import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Framing: our own pages plus the Umami dashboard, whose heatmaps render the
  // live page in an iframe. frame-ancestors replaces X-Frame-Options, which
  // can't name another origin.
  { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://umami.vayasyaseva.com" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

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
