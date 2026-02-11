import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/llms.txt",
          "/llms-full.txt",
          "/openapi/v1.json",
          "/mcp",
          "/.well-known/agent-card.json",
          "/.well-known/agent.json",
        ],
        disallow: ["/api/"],
      },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot"],
        allow: [
          "/",
          "/llms.txt",
          "/llms-full.txt",
          "/openapi/v1.json",
          "/mcp",
          "/.well-known/agent-card.json",
          "/.well-known/agent.json",
        ],
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://www.vayasyaseva.com/sitemap.xml",
  };
}
