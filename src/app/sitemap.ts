import type { MetadataRoute } from "next";
import {
  languageAlternates,
  localePath,
  locales,
  translatedLocales,
  pageLocales,
} from "@/lib/i18n";

const lastModified = new Date("2026-09-13");
const contentUpdated = new Date("2026-09-26");

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.vayasyaseva.com";

  const english: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: contentUpdated, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/services`, lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/services/contract-labour`, lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/services/warehouse-labour`, lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/services/factory-labour`, lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/services/housekeeping`, lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/haridwar-sidcul`, lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/industries`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/how-we-operate`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/compliance`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/vayasya-setu`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: "yearly", priority: 0.9 },
    { url: `${baseUrl}/brand`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
  if (!translatedLocales.some((l) => locales[l].published)) return english;

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
  const paired = english.map((entry) => {
    const path = entry.url.replace(baseUrl, "") || "/";
    const alternates = withLanguages(path);
    return alternates ? { ...entry, alternates } : entry;
  });
  const translated = Object.entries(pageLocales).flatMap(([path, pageLangs]) =>
    pageLangs
      .filter((locale) => locales[locale].published)
      .map((locale) => ({
        url: `${baseUrl}${localePath(path, locale)}`,
        lastModified: contentUpdated,
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: withLanguages(path),
      })),
  );
  return [...paired, ...translated];
}
