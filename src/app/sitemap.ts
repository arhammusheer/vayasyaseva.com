import type { MetadataRoute } from "next";
import { jobRoles } from "@/content/pages/job-roles";
import { languageAlternates, localePath, locales, localesOf } from "@/lib/i18n";
import { JOB_HUB_SLUGS } from "@/lib/talent-intake/rules";

const lastModified = new Date("2026-09-13");
const contentUpdated = new Date("2026-10-01");
const jobsAdded = new Date("2026-10-02");

type Page = {
  path: string;
  lastModified: Date;
  changeFrequency: "monthly" | "yearly";
  priority: number;
};

/** Pages by neutral path. Each is listed once per published language it has. */
const sitePages: Page[] = [
  { path: "/", lastModified: contentUpdated, changeFrequency: "monthly", priority: 1 },
  { path: "/services", lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.9 },
  { path: "/services/contract-labour", lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.9 },
  { path: "/services/warehouse-labour", lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/loading-unloading-labour", lastModified: jobsAdded, changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/factory-labour", lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/housekeeping", lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.8 },
  { path: "/jobs", lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.8 },
  ...jobRoles["en-IN"].map((r) => ({
    path: `/jobs/${r.slug}`,
    lastModified: jobsAdded,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  })),
  // Hubs are not linked from the site; the sitemap is how search engines find them.
  ...JOB_HUB_SLUGS.map((slug) => ({
    path: `/jobs/${slug}`,
    lastModified: jobsAdded,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  })),
  { path: "/haridwar-sidcul", lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.9 },
  { path: "/industries", lastModified, changeFrequency: "monthly", priority: 0.8 },
  { path: "/how-we-operate", lastModified, changeFrequency: "monthly", priority: 0.8 },
  { path: "/compliance", lastModified, changeFrequency: "monthly", priority: 0.8 },
  { path: "/vayasya-setu", lastModified, changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", lastModified, changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", lastModified, changeFrequency: "yearly", priority: 0.9 },
  { path: "/brand", lastModified, changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", lastModified, changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", lastModified, changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.vayasyaseva.com";

  // Each translated page lists every published language on every entry.
  const withLanguages = (path: string) => {
    const languages = languageAlternates(path);
    return languages && {
      languages: Object.fromEntries(
        Object.entries(languages)
          .filter(([key]) => key !== "x-default")
          .map(([key, href]) => [key, `${baseUrl}${href}`]),
      ),
    };
  };

  return sitePages.flatMap(({ path, ...entry }) => {
    const alternates = withLanguages(path);
    return localesOf(path)
      .filter((locale) => locales[locale].published)
      .map((locale) => ({
        url: `${baseUrl}${localePath(path, locale)}`,
        ...entry,
        ...(alternates && { alternates }),
      }));
  });
}
