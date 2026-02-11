import type { MetadataRoute } from "next";

const lastModified = new Date("2026-02-11");

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.vayasyaseva.com";

  return [
    { url: baseUrl, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/services`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/industries`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/how-we-operate`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/compliance`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/vayasya-setu`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: "yearly", priority: 0.9 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${baseUrl}/.well-known/agent-card.json`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/.well-known/agent.json`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/ai-access-policy.txt`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    { url: `${baseUrl}/openapi/v1.json`, lastModified, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/llms.txt`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/llms-full.txt`, lastModified, changeFrequency: "weekly", priority: 0.5 },
  ];
}
