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
import { builtLocales, builtPages, clusterById, isNoindex, isPaused, pageEntry, publishedLocales, redirectTarget } from "@/content/registry";
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
  // Punjabi in Gurmukhi (owner direction, 17 Oct 2026): the jobs pages for
  // the Jalandhar region only. Drafts pending native review, like hi-IN.
  "pa-IN": {
    segment: "pa-in",
    hreflang: "pa-IN",
    ogLocale: "pa_IN",
    label: "ਪੰਜਾਬੀ",
    hint: "ਇਹ ਪੰਨਾ ਪੰਜਾਬੀ ਵਿੱਚ ਪੜ੍ਹੋ",
    published: true,
  },
} as const satisfies Record<LocaleTag, unknown>;

export type Locale = keyof typeof locales;
export const allLocales = Object.keys(locales) as Locale[];

/**
 * The languages every multi-language page is written in. Punjabi covers only
 * the pages that list it in the registry (the Jalandhar region's jobs pages).
 */
export type CoreLocale = Exclude<Locale, "pa-IN">;
/** Copy for pages not written in every language: the core three, and others where a page has them. */
export type CopyIn<T> = Record<CoreLocale, T> & Partial<Record<Locale, T>>;
/** A page's copy in one language. Throws if the registry builds a page in a language it has no copy for. */
export function copyIn<T>(copy: CopyIn<T>, locale: Locale, what: string): T {
  const t = copy[locale];
  if (!t) throw new Error(`${what} has no ${locale} copy; remove ${locale} from its registry entry or write it`);
  return t;
}

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
 * resolve to /en-in/... and 404 there. A listed page with nothing built
 * (draft or retired everywhere) has no languages: its route builds no
 * version, and the proxy lets its URLs 404 (isGone).
 */
export const pages: Record<string, PageLocales> = Object.fromEntries(
  builtPages().map((entry) => [
    entry.path,
    { locales: builtLocales(entry.path), ...(entry.neutral && { override: entry.neutral }) },
  ]),
);

const ENGLISH_ONLY: PageLocales = { locales: [FALLBACK_LOCALE] };
const NOT_BUILT: PageLocales = { locales: [] };

function pageConfig(path: string) {
  return pages[path] ?? (pageEntry(path) ? NOT_BUILT : ENGLISH_ONLY);
}

/** Languages a page exists in (is built in), given its neutral path ("/jobs"). */
export function localesOf(path: string): readonly Locale[] {
  return pageConfig(path).locales;
}

/**
 * Whether a language version is public: its locale is published and the
 * page's status in it is "published". Public versions may be linked from
 * published pages and offered in the language switch. A path outside the
 * registry is not a page (content:check keeps routes and registry in step).
 */
export function isPublic(path: string, locale: Locale) {
  return locales[locale].published && publishedLocales(path).includes(locale);
}

/**
 * Whether a language version may be indexed and listed in the sitemap and
 * hreflang: it is public and the page is not flagged noindex (a form
 * endpoint or the brand kit stays linkable but out of search).
 */
export function isIndexable(path: string, locale: Locale) {
  return isPublic(path, locale) && !isNoindex(path);
}

/** The languages to offer a reader: the public ones, or every built one while none is. */
export function preferredLocales(path: string): readonly Locale[] {
  const available = localesOf(path);
  const published = available.filter((l) => isPublic(path, l));
  return published.length ? published : available;
}

/** The locale a page falls back to when no other choice applies. */
function defaultLocaleOf(path: string): Locale {
  const { override } = pageConfig(path);
  const available = preferredLocales(path);
  if (override && override !== "prompt" && available.includes(override)) return override;
  return available.includes(FALLBACK_LOCALE) || available.length === 0 ? FALLBACK_LOCALE : available[0];
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

/**
 * URL segments used before 1 October 2026 (/hi/jobs, /hinglish/jobs). The
 * proxy maps them and then routes the result, so an old URL takes one 308
 * to its final page, even when that page has moved since.
 */
const LEGACY_SEGMENTS: Readonly<Record<string, Locale>> = { hi: "hi-IN", hinglish: "hi-Latn-IN" };

/** The current pathname for an old-prefix URL ("/hinglish/jobs" -> "/hi-latn-in/jobs"), or undefined. */
export function fromLegacyPrefix(pathname: string): string | undefined {
  const [, first, ...rest] = pathname.split("/");
  const locale = first !== undefined && Object.hasOwn(LEGACY_SEGMENTS, first.toLowerCase()) ? LEGACY_SEGMENTS[first.toLowerCase()] : undefined;
  if (!locale) return undefined;
  const path = `/${rest.join("/")}`.replace(/\/+$/, "");
  return `/${locales[locale].segment}${path}`;
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
 * Where a reader goes for a page not written in their language, before the
 * page's default: Punjabi readers to Hinglish (the Punjab picker's next
 * choice), not straight to English.
 */
const NEAREST: Partial<Record<Locale, Locale>> = { "pa-IN": "hi-Latn-IN" };

/**
 * A page's URL for a reader of `locale`: in that language when the page is
 * built in it, else the nearest language it is built in (NEAREST, then the
 * page's default). For links built from the page's language, such as the
 * jobs header and footer, which reach pages Punjabi doesn't cover.
 */
export function nearestLocalePath(path: string, locale: Locale) {
  const built = localesOf(path);
  const near = NEAREST[locale];
  const target = built.includes(locale) ? locale : near && built.includes(near) ? near : defaultLocaleOf(path);
  return localePath(path, target);
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
  const reachableIn = (l: Locale) =>
    localesOf(path).includes(l) && (isPublic(path, l) || isPaused(path, l) || !locales[l].published);
  const near = locale && NEAREST[locale];
  const target = locale && reachableIn(locale) ? locale : near && reachableIn(near) ? near : defaultLocaleOf(path);
  return `${localePath(path, target)}${suffix}`;
}

/**
 * Where an alias or retired page (or one retired language of a page) 308s
 * to (src/content/registry redirectTarget), as a full pathname with any
 * #anchor: the target in the language asked for when it is reachable there,
 * by the same rule as localizeHref, else the target's neutral URL
 * resolution. Undefined when the path is not moved.
 */
export function movedPathname(path: string, locale?: Locale): string | undefined {
  const to = redirectTarget(path, locale);
  if (!to) return undefined;
  const [moved, anchor] = to.split("#");
  const hash = anchor ? `#${anchor}` : "";
  const keep = locale && localesOf(moved).includes(locale) && (isPublic(moved, locale) || !locales[locale].published);
  const target = keep ? locale : neutralTarget(moved);
  return `${target === "prompt" ? moved : localePath(moved, target)}${hash}`;
}

/**
 * Whether a registered page has nothing to show at this URL, so it should
 * 404 rather than fall back to another language: it is built in no language
 * (draft or retired everywhere), or this language is retired with no target
 * (a version that was never public). Check movedPathname first.
 */
export function isGone(path: string, locale?: Locale): boolean {
  const entry = pageEntry(path);
  if (!entry) return false;
  if (localesOf(path).length === 0) return true;
  return locale !== undefined && entry.locales[locale] === "retired";
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
    .filter((l) => l !== current && (!isPublic(path, current) || isPublic(path, l)))
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
 * (the registry's linkable rule) or paused ones, which stay reachable and
 * show their notice (PLAN §8.3); pages that are not published are not
 * checked. (Their links still resolve through localizeHref, so from a
 * published locale they open published versions only.) Links to other sites, files, the
 * API and anchors on the same page are not checked.
 */
export function linkProblem(href: string, fromPathname: string): string | undefined {
  const from = splitLocalePath(fromPathname);
  if (!from.locale || !isPublic(from.path, from.locale)) return undefined;
  if (!href.startsWith("/") || href.startsWith("//")) return undefined;
  const target = /^[^?#]*/.exec(href)![0] || "/";
  if (/^\/(api|_next|_t)(\/|$)/.test(target) || /\.[a-z0-9]+$/i.test(target)) return undefined;
  const to = splitLocalePath(target.length > 1 ? target.replace(/\/$/, "") : target);
  const open = (l: Locale) => isPublic(to.path, l) || isPaused(to.path, l);
  if (to.locale ? open(to.locale) : localesOf(to.path).some(open)) return undefined;
  return `${fromPathname} links to ${href}, which is not a published page (src/content/registry/pages.ts)`;
}
