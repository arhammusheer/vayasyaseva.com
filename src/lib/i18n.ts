/**
 * Locales. English is the default at the root; translations live under a
 * prefix with the same slug as their English pair. See docs/plan-multilingual.md.
 *
 * Hinglish is Hindi written in Latin script (BCP 47 "hi-Latn").
 *
 * An unpublished locale's pages are noindex and carry no hreflang, sitemap
 * entry or header link from English pages. Flip `published` once a native
 * speaker has reviewed the copy. Both enabled 26 September 2026.
 */
export const locales = {
  en: { prefix: "", lang: "en", hreflang: "en-IN", ogLocale: "en_IN", label: "English", published: true },
  hi: { prefix: "/hi", lang: "hi", hreflang: "hi-IN", ogLocale: "hi_IN", label: "हिंदी", published: true },
  hinglish: { prefix: "/hinglish", lang: "hi-Latn", hreflang: "hi-Latn", ogLocale: "hi_IN", label: "Hinglish", published: true },
} as const;

export type Locale = keyof typeof locales;
export const translatedLocales = ["hi", "hinglish"] as const satisfies Locale[];

/**
 * Which translations each English page has. Business pages (home, services
 * index, compliance, about…) stay English only. See docs/plan-multilingual.md.
 */
export const pageLocales: Record<string, readonly Locale[]> = {
  "/haridwar-sidcul": ["hi", "hinglish"],
  "/services/contract-labour": ["hi", "hinglish"],
  "/services/warehouse-labour": ["hinglish"],
  "/services/factory-labour": ["hinglish"],
  "/services/housekeeping": ["hinglish"],
};

export function translationsOf(englishPath: string): readonly Locale[] {
  return pageLocales[englishPath] ?? [];
}

export function localeOf(path: string): Locale {
  for (const locale of translatedLocales) {
    const { prefix } = locales[locale];
    if (path === prefix || path.startsWith(`${prefix}/`)) return locale;
  }
  return "en";
}

export function toEnglish(path: string) {
  const { prefix } = locales[localeOf(path)];
  return path.slice(prefix.length) || "/";
}

export function localePath(englishPath: string, locale: Locale) {
  return `${locales[locale].prefix}${englishPath}`;
}

/** hreflang alternates for a translated page, given its English path. */
export function languageAlternates(englishPath: string) {
  const published = translationsOf(englishPath).filter((l) => locales[l].published);
  if (!published.length) return undefined;
  return {
    [locales.en.hreflang]: englishPath,
    ...Object.fromEntries(
      published.map((l) => [locales[l].hreflang, localePath(englishPath, l)]),
    ),
    "x-default": englishPath,
  } as Record<string, string>;
}

/**
 * Other-language versions of the current page for the header switch.
 * From English, only published locales show; from a translation, every
 * version shows so reviewers can move between drafts.
 */
export function languageLinks(path: string) {
  const current = localeOf(path);
  const englishPath = toEnglish(path);
  const available: Locale[] = ["en", ...translationsOf(englishPath)];
  // No links on English-only pages or on a translation that doesn't exist.
  if (available.length < 2 || !available.includes(current)) return [];
  return available
    .filter((l) => l !== current && (current !== "en" || locales[l].published))
    .map((l) => ({
      href: localePath(englishPath, l),
      label: locales[l].label,
      lang: locales[l].lang,
    }));
}
