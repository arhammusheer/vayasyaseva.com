import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
        // The jobs pages (hub and role pages) record voice notes: this site (only) may use the
        // microphone there. Overrides the site-wide Permissions-Policy above.
        source: "/:locale(en-in|hi-in|hi-latn-in)/jobs/:role*",
        headers: [{ key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=()" }],
      },
      {
        // Downloadable brand assets are immutable once generated.
        source: "/brand/downloads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        // One canonical host.
        source: "/:path*",
        has: [{ type: "host", value: "vayasyaseva.com" }],
        destination: "https://www.vayasyaseva.com/:path*",
        permanent: true,
      },
      // Old locale prefixes (before 1 October 2026). English had none and is
      // handled by the locale routing in src/proxy.ts.
      { source: "/hi", destination: "/hi-in", permanent: true },
      { source: "/hi/:path*", destination: "/hi-in/:path*", permanent: true },
      { source: "/hinglish", destination: "/hi-latn-in", permanent: true },
      { source: "/hinglish/:path*", destination: "/hi-latn-in/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
