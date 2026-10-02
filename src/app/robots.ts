import type { MetadataRoute } from "next";

/**
 * Everything public is open to every crawler, search engine and AI system,
 * as permitted by the Terms of Use (s.3.2). The only exclusion is the API
 * behind the website's own forms. /api/agent/ is allowed: those are the open
 * submission routes for AI agents (see /llms.txt and /ai-access-policy.txt).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/agent/"],
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://www.vayasyaseva.com/sitemap.xml",
    host: "https://www.vayasyaseva.com",
  };
}
