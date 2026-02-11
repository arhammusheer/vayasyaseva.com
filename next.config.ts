import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.vayasyaseva.com" }],
        destination: "https://vayasyaseva.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
