/**
 * What each cluster can show in the header (docs/area-intent.md): its buyer
 * page on the business side and its jobs hub on the jobs side, only where
 * that page is published. Client-safe: reads the registry, no content.
 */
import { clusters, linkable, pageEntry } from "@/content/registry";
import { LOCALE_TAGS, jobsHubPath, type ClusterId } from "@/content/registry/identifiers";
import { JOBS_LINK_LABELS, businessLabel } from "@/markets/labels";
import { nearestLocalePath, type Locale } from "@/lib/i18n";
import { MARKET_IDS as MARKET_ORDER } from "@/markets/index";
import type { AreaSurfaces } from "./model";

export function areaSurfaces(): AreaSurfaces {
  const out: Record<string, { business?: string; jobs?: string }> = {};
  for (const c of clusters) {
    const jobs = jobsHubPath(c.id as Exclude<ClusterId, "other">);
    out[c.id] = {
      business: c.buyerHub && linkable(c.buyerHub, "en-IN") ? c.buyerHub : undefined,
      jobs: pageEntry(jobs)?.kind === "jobs-city" && linkable(jobs, "en-IN") ? jobs : undefined,
    };
  }
  return out;
}

export const knownCluster = (id: string) => clusters.some((c) => c.id === id);

/** The page's own cluster (its registry entry), not the jobs default. */
export const ownCluster = (path: string) => pageEntry(path)?.cluster;

/** The business header's label for a cluster's buyer page (src/markets/labels.ts). */
export { businessLabel };

/** The jobs door and menu label for a cluster's jobs hub, in a language (src/markets/labels.ts). */
export const JOBS_AREA_LABEL: Record<Locale, Record<string, string>> = Object.fromEntries(
  LOCALE_TAGS.map((l) => [l, Object.fromEntries(Object.entries(JOBS_LINK_LABELS).map(([id, labels]) => [id, labels[l]]))]),
) as Record<Locale, Record<string, string>>;
/** A market's jobs hub in `locale` (never the neutral picker URL; see jobsDoorHref). */
export const jobsAreaHref = (id: string, locale: Locale) => nearestLocalePath(jobsHubPath(id as Exclude<ClusterId, "other">), locale);

/**
 * Markets with a published jobs hub: the decided ones first, the rest in
 * MARKET_ORDER (no market is the default, owner direction 17 Oct 2026).
 */
export function orderedJobMarkets(decided: readonly string[] = []): string[] {
  const surfaces = areaSurfaces();
  const all: string[] = MARKET_ORDER.filter((id) => surfaces[id]?.jobs);
  return [...decided.filter((id) => all.includes(id)), ...all.filter((id) => !decided.includes(id))];
}
