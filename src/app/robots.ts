import type { MetadataRoute } from "next";

/**
 * Everything public is open to every crawler, search engine and AI system,
 * as permitted by the Terms of Use (s.3.2). The only exclusion is the private
 * API surface (form submission), which the Terms and Privacy Policy exclude.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://www.vayasyaseva.com/sitemap.xml",
    host: "https://www.vayasyaseva.com",
  };
}
