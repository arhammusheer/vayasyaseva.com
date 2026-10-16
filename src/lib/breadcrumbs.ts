import { BREADCRUMB_NAMES } from "@/content/breadcrumbs";
import { pageEntry } from "@/content/registry";
import { localePath, localizeHref, type Locale } from "@/lib/i18n";

export type Crumb = { name: string; href: string };

/**
 * A page's breadcrumb trail from the registry's parent chain, home first and
 * the page itself last (named by the caller). The visible breadcrumb and the
 * BreadcrumbList JSON-LD both use it, so they cannot disagree. Ancestors link
 * to the version in `locale` where it is public, else their default language.
 */
export function breadcrumbTrail(path: string, locale: Locale, name: string): Crumb[] {
  const ancestors: string[] = [];
  for (let parent = pageEntry(path)?.parent; parent !== undefined; parent = pageEntry(parent)?.parent) {
    if (ancestors.includes(parent) || parent === path) throw new Error(`Breadcrumb loop at ${parent} (src/content/registry/pages.ts)`);
    ancestors.unshift(parent);
  }
  return [
    ...ancestors.map((ancestor) => {
      const names = BREADCRUMB_NAMES[ancestor];
      if (!names) throw new Error(`No breadcrumb name for ${ancestor}: add it to src/content/breadcrumbs.ts`);
      return { name: names[locale] ?? names["en-IN"], href: localizeHref(ancestor, locale) };
    }),
    { name, href: localePath(path, locale) },
  ];
}

/**
 * The visible breadcrumb shows only two levels below home (a service landing,
 * a wage state, a jobs role): a top-level page is one tap from the header,
 * so its single crumb would only add chrome.
 */
export const VISIBLE_BREADCRUMB_DEPTH = 2;
export const showsBreadcrumb = (trail: Crumb[]) => trail.length - 1 >= VISIBLE_BREADCRUMB_DEPTH;

/**
 * The crumbs shown on the page: on jobs pages the trail starts at Jobs, so
 * the first crumb never sends a seeker to the English business home
 * (src/content/breadcrumbs.ts). The JSON-LD keeps the whole trail.
 */
export function visibleTrail(path: string, trail: Crumb[]): Crumb[] {
  return pageEntry(path)?.audience === "jobs" ? trail.slice(1) : trail;
}
