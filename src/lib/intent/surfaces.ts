/**
 * What each cluster can show in the header (docs/area-intent.md): its buyer
 * page on the business side and its jobs hub on the jobs side, only where
 * that page is published. Client-safe: reads the registry, no content.
 */
import { clusters, linkable, pageEntry } from "@/content/registry";
import { jobsHubPath, type ClusterId } from "@/content/registry/identifiers";
import { localePath, type Locale } from "@/lib/i18n";
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

/** The business header's label for a cluster's buyer page. */
export const businessLabel = (id: string) => clusters.find((c) => c.id === id)?.navLabel ?? clusters.find((c) => c.id === id)?.name["en-IN"] ?? id;

/** The jobs door and menu label for a cluster's jobs hub, in a language. */
export const JOBS_AREA_LABEL: Record<Locale, Record<string, string>> = {
  "en-IN": { haridwar: "Jobs in Haridwar", bengaluru: "Jobs in Bengaluru" },
  "hi-IN": { haridwar: "हरिद्वार में नौकरी", bengaluru: "बेंगलुरु में नौकरी" },
  "hi-Latn-IN": { haridwar: "Haridwar mein job", bengaluru: "Bengaluru mein job" },
};
export const jobsAreaHref = (id: string, locale: Locale) => {
  const path = jobsHubPath(id as Exclude<ClusterId, "other">);
  return locale === "en-IN" ? path : localePath(path, locale);
};
