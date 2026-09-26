/**
 * Locales. English is the default at the root; translations live under a
 * prefix with the same slug as their English pair. See docs/plan-multilingual.md.
 *
 * Hinglish is Hindi written in Latin script (BCP 47 "hi-Latn").
 *
 * An unpublished locale's pages are noindex and carry no hreflang, sitemap
 * entry or header link from English pages. Flip `published` once a native
 * speaker has reviewed the copy.
 */
export const locales = {
  en: { prefix: "", lang: "en", hreflang: "en-IN", ogLocale: "en_IN", label: "English", published: true },
  hi: { prefix: "/hi", lang: "hi", hreflang: "hi-IN", ogLocale: "hi_IN", label: "हिंदी", published: false },
  hinglish: { prefix: "/hinglish", lang: "hi-Latn", hreflang: "hi-Latn", ogLocale: "hi_IN", label: "Hinglish", published: false },
} as const;

export type Locale = keyof typeof locales;
export const translatedLocales = ["hi", "hinglish"] as const satisfies Locale[];

/** English paths that have Hindi and Hinglish versions. */
export const translatedPaths = [
  "/haridwar-sidcul",
  "/services/contract-labour",
  "/services/warehouse-labour",
  "/services/factory-labour",
  "/services/housekeeping",
] as const;

export function hasTranslations(englishPath: string) {
  return (translatedPaths as readonly string[]).includes(englishPath);
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
  if (!hasTranslations(englishPath)) return undefined;
  const published = translatedLocales.filter((l) => locales[l].published);
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
 * locale shows so reviewers can move between drafts.
 */
export function languageLinks(path: string) {
  const current = localeOf(path);
  const englishPath = toEnglish(path);
  if (!hasTranslations(englishPath)) return [];
  return (Object.keys(locales) as Locale[])
    .filter((l) => l !== current && (current !== "en" || locales[l].published))
    .map((l) => ({
      href: localePath(englishPath, l),
      label: locales[l].label,
      lang: locales[l].lang,
    }));
}
