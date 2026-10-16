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
import { builtLocales, builtPages, clusterById, pageEntry, publishedLocales, redirectTarget } from "@/content/registry";
import type { LocaleTag } from "@/content/registry/identifiers";

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
    label: "Hinglish",
    hint: "Ye page Hindi mein padhein, English letters mein",
    published: true,
  },
} as const satisfies Record<LocaleTag, unknown>;

export type Locale = keyof typeof locales;
export const allLocales = Object.keys(locales) as Locale[];

/** What a page's neutral URL (no locale segment) does. */
export type LocaleOverride = Locale | "prompt";

/** The code-level default: a neutral URL opens the English page. */
export const FALLBACK_LOCALE: Locale = "en-IN";

type PageLocales = {
  /** Languages the page is built in. */
  locales: readonly Locale[];
  /**
   * Where the neutral URL goes. Unset: English (FALLBACK_LOCALE), or the
   * page's first language if it has no English. A locale: always that one.
   * "prompt": show a language picker at the neutral URL, for links shared
   * with people whose language we don't know (e.g. /jobs read out on a call).
   */
  override?: LocaleOverride;
};

/**
 * Every built page and its languages, derived from the page registry
 * (src/content/registry/pages.ts), which also holds each language's status.
 * A path that isn't listed is treated as English only, so unknown URLs
 * resolve to /en-in/... and 404 there.
 */
export const pages: Record<string, PageLocales> = Object.fromEntries(
  builtPages().map((entry) => [
    entry.path,
    { locales: builtLocales(entry.path), ...(entry.neutral && { override: entry.neutral }) },
  ]),
);

const ENGLISH_ONLY: PageLocales = { locales: [FALLBACK_LOCALE] };

function pageConfig(path: string) {
  return pages[path] ?? ENGLISH_ONLY;
}

/** Languages a page exists in (is built in), given its neutral path ("/jobs"). */
export function localesOf(path: string): readonly Locale[] {
  return pageConfig(path).locales;
}

/**
 * Whether a language version may be indexed, listed in the sitemap and
 * hreflang, and linked from published pages: its locale is published and
 * the page's status in it is "published". A path outside the registry is
 * not a page (content:check keeps routes and registry in step).
 */
export function isIndexable(path: string, locale: Locale) {
  return locales[locale].published && publishedLocales(path).includes(locale);
}

/** The languages to offer a reader: the published ones, or every built one while none is. */
export function preferredLocales(path: string): readonly Locale[] {
  const available = localesOf(path);
  const published = available.filter((l) => isIndexable(path, l));
  return published.length ? published : available;
}

/** The locale a page falls back to when no other choice applies. */
function defaultLocaleOf(path: string): Locale {
  const { override } = pageConfig(path);
  const available = preferredLocales(path);
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
 * the reader's locale when the page is published in it (or, for reviewers
 * reading an unpublished locale, built in it), else the page's default
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
  const reachable = locale && localesOf(path).includes(locale) && (isIndexable(path, locale) || !locales[locale].published);
  const target = reachable ? locale : defaultLocaleOf(path);
  return `${localePath(path, target)}${suffix}`;
}

/**
 * Where an alias or retired page 308s to (src/content/registry
 * redirectTarget), as a full pathname: the target in the language asked for
 * when it is reachable there, by the same rule as localizeHref, else the
 * target's neutral URL resolution. Undefined when the path is not moved.
 */
export function movedPathname(path: string, locale?: Locale): string | undefined {
  const moved = redirectTarget(path);
  if (!moved) return undefined;
  const keep = locale && localesOf(moved).includes(locale) && (isIndexable(moved, locale) || !locales[locale].published);
  const target = keep ? locale : neutralTarget(moved);
  return target === "prompt" ? moved : localePath(moved, target);
}

/**
 * hreflang alternates for a page, given its neutral path. x-default must not
 * redirect: it is the language picker on "prompt" pages (served at the
 * neutral URL) and the default language's page everywhere else.
 */
export function languageAlternates(path: string) {
  const published = localesOf(path).filter((l) => isIndexable(path, l));
  if (published.length < 2) return undefined;
  const xDefault = neutralTarget(path) === "prompt" ? path : localePath(path, defaultLocaleOf(path));
  return {
    ...Object.fromEntries(published.map((l) => [locales[l].hreflang, localePath(path, l)])),
    "x-default": xDefault,
  } as Record<string, string>;
}

/**
 * The header quick switch on pages without a cluster (PLAN §6.4, default and
 * Hindi belt): English · हिंदी · Hinglish. A cluster page uses its cluster's
 * `quickSwitch` (src/content/registry/clusters.ts). Fixed per page, never
 * per visitor, so the switch stays in the static HTML.
 */
export const DEFAULT_QUICK_SWITCH: readonly Locale[] = ["en-IN", "hi-IN", "hi-Latn-IN"];

/** The quick-switch order for a page: its cluster's set, else the default. */
export function quickSwitchOf(path: string): readonly Locale[] {
  const cluster = pageEntry(path)?.cluster;
  return (cluster && clusterById(cluster)?.quickSwitch) || DEFAULT_QUICK_SWITCH;
}

/**
 * Other-language versions of the current page for the header switch, in the
 * page's quick-switch order. Languages outside that set come last with
 * `more: true` (shown under "More"). From a published version, only
 * published versions show; from an unpublished one (a locale or page still
 * in review), every built version shows so reviewers can move between drafts.
 */
export function languageLinks(pathname: string) {
  const { locale: current, path } = splitLocalePath(pathname);
  const available = localesOf(path);
  if (!current || available.length < 2 || !available.includes(current)) return [];
  const set = quickSwitchOf(path);
  const rank = (l: Locale) => (set.includes(l) ? set.indexOf(l) : set.length + allLocales.indexOf(l));
  return available
    .filter((l) => l !== current && (!isIndexable(path, current) || isIndexable(path, l)))
    .sort((a, b) => rank(a) - rank(b))
    .map((l) => ({
      href: localePath(path, l),
      label: locales[l].label,
      hint: locales[l].hint,
      lang: l,
      more: !set.includes(l),
    }));
}

/**
 * Why a link from the page at `fromPathname` to `href` is not allowed, or
 * undefined when it is. A published page may link only to published pages
 * (the registry's linkable rule); pages that are not published are not
 * checked. (Their links still resolve through localizeHref, so from a
 * published locale they open published versions only.) Links to other sites, files, the
 * API and anchors on the same page are not checked.
 */
export function linkProblem(href: string, fromPathname: string): string | undefined {
  const from = splitLocalePath(fromPathname);
  if (!from.locale || !isIndexable(from.path, from.locale)) return undefined;
  if (!href.startsWith("/") || href.startsWith("//")) return undefined;
  const target = /^[^?#]*/.exec(href)![0] || "/";
  if (/^\/(api|_next|_t)(\/|$)/.test(target) || /\.[a-z0-9]+$/i.test(target)) return undefined;
  const to = splitLocalePath(target.length > 1 ? target.replace(/\/$/, "") : target);
  if (to.locale ? isIndexable(to.path, to.locale) : localesOf(to.path).some((l) => isIndexable(to.path, l))) return undefined;
  return `${fromPathname} links to ${href}, which is not a published page (src/content/registry/pages.ts)`;
}
