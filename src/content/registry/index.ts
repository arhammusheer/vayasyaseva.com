/**
 * Read the page registry. Status rules (identifiers.ts PAGE_STATUSES):
 * draft and retired are not built, review and paused are built but noindex
 * and unlinked, published is indexed and linkable. src/lib/i18n.ts adds the
 * locale-wide publish flag on top: an unpublished locale is never indexed.
 *
 * The proxy imports this file: keep it free of heavy dependencies (the Zod
 * schema lives in schema.ts and is used only by content:check).
 */
import { LOCALE_TAGS, type LocaleTag, type PageStatus } from "./identifiers";
import { pageEntries, pathAliases, type PageEntry } from "./pages";

export { clusters, clusterById } from "./clusters";
export { pageEntries, pathAliases } from "./pages";
export type { PageEntry, PageKind } from "./pages";

/**
 * Preview builds may show drafts; production never does. A build-time flag:
 * next.config.ts inlines it so server, browser and proxy agree. Set it for
 * the build, not at runtime.
 */
const showDrafts = process.env.VSPL_SHOW_DRAFTS === "1";

const BUILT: ReadonlySet<PageStatus> = new Set<PageStatus>(
  showDrafts ? ["draft", "review", "published", "paused"] : ["review", "published", "paused"],
);

const byPath = new Map(pageEntries.map((entry) => [entry.path, entry]));

export function pageEntry(path: string): PageEntry | undefined {
  return byPath.get(path);
}

export function statusOf(path: string, locale: LocaleTag): PageStatus | undefined {
  return byPath.get(path)?.locales[locale];
}

/** Languages a page is built in (has a URL that answers 200), in locale order. */
export function builtLocales(path: string): LocaleTag[] {
  const entry = byPath.get(path);
  if (!entry) return [];
  return LOCALE_TAGS.filter((l) => {
    const status = entry.locales[l];
    return status !== undefined && BUILT.has(status);
  });
}

/** Languages a page is published in, ignoring the locale-wide flag. */
export function publishedLocales(path: string): LocaleTag[] {
  const entry = byPath.get(path);
  if (!entry) return [];
  return LOCALE_TAGS.filter((l) => entry.locales[l] === "published");
}

/** Pages built in at least one language. */
export function builtPages(): PageEntry[] {
  return pageEntries.filter((entry) => builtLocales(entry.path).length > 0);
}

/**
 * Page kinds that can render the paused notice (PLAN §1a, §8.3): a cluster's
 * jobs hub ("We're not taking applications for this area right now", its form
 * replaced by a link to /jobs/apply) and a cluster's buyer hub. content:check
 * rejects `paused` on any other kind of page.
 */
export const PAUSABLE_KINDS: ReadonlySet<PageEntry["kind"]> = new Set(["jobs-city", "cluster-hub"]);

/** Whether this language version is paused: built, noindex, saying plainly it is not taking applications or new work. */
export function isPaused(path: string, locale: LocaleTag): boolean {
  return statusOf(path, locale) === "paused";
}

/**
 * Whether a published page may link to this page. With a locale: that
 * language version. Without one: any published version (links resolve to
 * a published language; see localizeHref in src/lib/i18n.ts). Links to a
 * paused page are allowed too (linkProblem in src/lib/i18n.ts): pausing an
 * area is a person's quick decision, so existing links keep working and land
 * on the page's notice; linkable() itself stays "published only" for lists.
 */
export function linkable(path: string, locale?: LocaleTag): boolean {
  return locale ? statusOf(path, locale) === "published" : publishedLocales(path).length > 0;
}

/**
 * Where a URL that is not a page 308s to: an alias (/locations/haridwar), or
 * a retired page with `retiredTo` set (the schema allows retiredTo only when
 * every language is retired).
 */
export function redirectTarget(path: string): string | undefined {
  if (Object.hasOwn(pathAliases, path)) return pathAliases[path];
  const entry = byPath.get(path);
  if (!entry?.retiredTo) return undefined;
  const statuses = Object.values(entry.locales);
  return statuses.length > 0 && statuses.every((s) => s === "retired") ? entry.retiredTo : undefined;
}
