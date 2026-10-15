import type { MetadataRoute } from "next";
import { pageEntries } from "@/content/registry";
import { isIndexable, languageAlternates, localePath, localesOf } from "@/lib/i18n";

const baseUrl = "https://www.vayasyaseva.com";

/**
 * Generated from the page registry (src/content/registry/pages.ts): each
 * page is listed once per language it is published in, with every published
 * language as an alternate. Review, paused, draft and retired versions stay
 * out. lastmod is the page's `updated` date, never the build date.
 * tests/sitemap-snapshot.spec.mjs compares the output with a committed snapshot.
 */
export default function sitemap(): MetadataRoute.Sitemap {
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

  return pageEntries.flatMap(({ path, updated, changeFrequency, priority }) => {
    const alternates = withLanguages(path);
    return localesOf(path)
      .filter((locale) => isIndexable(path, locale))
      .map((locale) => ({
        url: `${baseUrl}${localePath(path, locale)}`,
        lastModified: new Date(updated),
        changeFrequency,
        priority,
        ...(alternates && { alternates }),
      }));
  });
}
