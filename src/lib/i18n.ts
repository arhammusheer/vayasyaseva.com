/**
 * Locales and routing. Every page lives under a locale segment
 * (/en-in/about, /hi-in/jobs, /hi-latn-in/jobs); see docs/plan-multilingual.md.
 *
 * hi-Latn-IN is Hindi written in Latin script. Its BCP 47 tag says exactly
 * that: language hi, script Latn, region IN.
 *
 * An unpublished locale's pages are noindex and carry no hreflang, sitemap
 * entry or header link from published pages. Flip `published` once a native
 * speaker has reviewed the copy.
 */
import { JOB_HUB_SLUGS, JOB_ROLE_SLUGS } from "@/lib/talent-intake/rules";

export const locales = {
  "en-IN": {
    segment: "en-in",
    hreflang: "en-IN",
    ogLocale: "en_IN",
    label: "English",
    hint: "Read this page in English",
    published: true,
  },
  "hi-IN": {
    segment: "hi-in",
    hreflang: "hi-IN",
    ogLocale: "hi_IN",
    label: "हिंदी",
    hint: "यह पेज हिंदी में पढ़ें",
    published: true,
  },
  "hi-Latn-IN": {
    segment: "hi-latn-in",
    hreflang: "hi-Latn-IN",
    ogLocale: "hi_IN",
    label: "Hindi",
    hint: "Ye page Hindi mein padhein, English letters mein",
    published: true,
  },
} as const;

export type Locale = keyof typeof locales;
export const allLocales = Object.keys(locales) as Locale[];

/** What a page's neutral URL (no locale segment) does. */
export type LocaleOverride = Locale | "prompt";

/** The code-level default: a neutral URL opens the English page. */
export const FALLBACK_LOCALE: Locale = "en-IN";

type PageLocales = {
  /** Languages the page exists in. Default: English only. */
  locales: readonly Locale[];
  /**
   * Where the neutral URL goes. Unset: English (FALLBACK_LOCALE), or the
   * page's first language if it has no English. A locale: always that one.
   * "prompt": show a language picker at the neutral URL, for links shared
   * with people whose language we don't know (e.g. /jobs read out on a call).
   */
  override?: LocaleOverride;
};

const ALL = allLocales;

/**
 * Pages with more than English, or with an override. Any page not listed is
 * English only and its neutral URL opens English. Business pages (home,
 * services index, compliance, about…) stay English only; see
 * docs/plan-multilingual.md.
 */
export const pages: Record<string, PageLocales> = {
  "/haridwar-sidcul": { locales: ALL },
  "/services/contract-labour": { locales: ALL },
  "/services/warehouse-labour": { locales: ["en-IN", "hi-Latn-IN"] },
  "/services/loading-unloading-labour": { locales: ["en-IN", "hi-Latn-IN"] },
  "/services/factory-labour": { locales: ["en-IN", "hi-Latn-IN"] },
  "/services/housekeeping": { locales: ["en-IN", "hi-Latn-IN"] },
  "/jobs": { locales: ALL, override: "prompt" },
  // Guided form, a Google Ads landing page (noindex, not in the sitemap).
  "/jobs/apply": { locales: ALL, override: "prompt" },
  ...Object.fromEntries(
    [...JOB_ROLE_SLUGS, ...JOB_HUB_SLUGS].map((slug) => [`/jobs/${slug}`, { locales: ALL, override: "prompt" } as const]),
  ),
};

const ENGLISH_ONLY: PageLocales = { locales: [FALLBACK_LOCALE] };

function pageConfig(path: string) {
  return pages[path] ?? ENGLISH_ONLY;
}

/** Languages a page exists in, given its neutral path ("/jobs"). */
export function localesOf(path: string): readonly Locale[] {
  return pageConfig(path).locales;
}

/** The locale a page falls back to when no other choice applies. */
function defaultLocaleOf(path: string): Locale {
  const { locales: available, override } = pageConfig(path);
  if (override && override !== "prompt" && available.includes(override)) return override;
  return available.includes(FALLBACK_LOCALE) ? FALLBACK_LOCALE : available[0];
}

/** What the neutral URL of a page resolves to: a locale, or "prompt". */
export function neutralTarget(path: string): LocaleOverride {
  return pageConfig(path).override === "prompt" ? "prompt" : defaultLocaleOf(path);
}

/** Locale for a URL segment, matched case-insensitively ("hi-IN" or "hi-in"). */
export function localeFromSegment(segment: string | undefined): Locale | undefined {
  if (!segment) return undefined;
  const lower = segment.toLowerCase();
  return allLocales.find((l) => locales[l].segment === lower);
}

/** Split "/hi-in/jobs" into its locale and neutral path ("/jobs"). */
export function splitLocalePath(pathname: string): { locale: Locale | undefined; path: string } {
  const [, first, ...rest] = pathname.split("/");
  const locale = localeFromSegment(first);
  if (!locale) return { locale: undefined, path: pathname || "/" };
  return { locale, path: `/${rest.join("/")}` };
}

export function localePath(path: string, locale: Locale) {
  return `/${locales[locale].segment}${path === "/" ? "" : path}`;
}

/** Static params for a page under app/[locale]: one per language it has. */
export function localeParams(path: string) {
  return () => localesOf(path).map((l) => ({ locale: locales[l].segment }));
}

/** Locale of a page from its route params; unknown segments are English. */
export function localeOfParams(params: { locale?: string }): Locale {
  return localeFromSegment(params.locale) ?? FALLBACK_LOCALE;
}

/**
 * Point an in-site link at a real page. A neutral path ("/contact") goes to
 * the reader's locale when the page exists in it, else the page's default
 * language. Paths that already carry a locale, other sites, anchors, files
 * and the API are left alone.
 */
export function localizeHref(href: string, locale?: Locale) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const match = /^([^?#]*)(.*)$/.exec(href)!;
  const path = match[1] || "/";
  const suffix = match[2];
  if (splitLocalePath(path).locale) return href;
  if (/^\/(api|_next|_t)(\/|$)/.test(path) || /\.[a-z0-9]+$/i.test(path)) return href;
  const target = locale && localesOf(path).includes(locale) ? locale : defaultLocaleOf(path);
  return `${localePath(path, target)}${suffix}`;
}

/**
 * hreflang alternates for a page, given its neutral path. x-default must not
 * redirect: it is the language picker on "prompt" pages (served at the
 * neutral URL) and the default language's page everywhere else.
 */
export function languageAlternates(path: string) {
  const published = localesOf(path).filter((l) => locales[l].published);
  if (published.length < 2) return undefined;
  const xDefault = neutralTarget(path) === "prompt" ? path : localePath(path, defaultLocaleOf(path));
  return {
    ...Object.fromEntries(published.map((l) => [locales[l].hreflang, localePath(path, l)])),
    "x-default": xDefault,
  } as Record<string, string>;
}

/**
 * Other-language versions of the current page for the header switch.
 * From a published locale, only published locales show; from an unpublished
 * one, every version shows so reviewers can move between drafts.
 */
export function languageLinks(pathname: string) {
  const { locale: current, path } = splitLocalePath(pathname);
  const available = localesOf(path);
  if (!current || available.length < 2 || !available.includes(current)) return [];
  return available
    .filter((l) => l !== current && (!locales[current].published || locales[l].published))
    .map((l) => ({
      href: localePath(path, l),
      label: locales[l].label,
      lang: l,
    }));
}
