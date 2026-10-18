/**
 * Market links for the surfaces the visitor context orders (the header, the
 * market lists, the "Jobs in" row): each market's buyer page and jobs hub
 * where published, and their labels. Client-safe: reads the registry, no
 * page content. Moved from src/lib/intent/surfaces.ts (model 3).
 */
import { LOCALE_TAGS, jobsHubPath, type ClusterId } from "@/content/registry/identifiers";
import { JOBS_LINK_LABELS, businessLabel } from "@/markets/labels";
import { nearestLocalePath, type Locale } from "@/lib/i18n";
import { MARKET_IDS } from "@/markets/index";
import { marketSurfaces } from "./tables";

export { businessLabel, marketSurfaces };

/** The jobs door and menu label for a market's jobs hub, in a language (src/markets/labels.ts). */
export const JOBS_AREA_LABEL: Record<Locale, Record<string, string>> = Object.fromEntries(
  LOCALE_TAGS.map((l) => [l, Object.fromEntries(Object.entries(JOBS_LINK_LABELS).map(([id, labels]) => [id, labels[l]]))]),
) as Record<Locale, Record<string, string>>;

/** A market's jobs hub in `locale` (never the neutral picker URL; see jobsDoorHref). */
export const jobsAreaHref = (id: string, locale: Locale) => nearestLocalePath(jobsHubPath(id as Exclude<ClusterId, "other">), locale);

/** Markets with a published jobs hub, in MARKET_ORDER (no market is the default). */
export const jobMarkets = (): string[] => MARKET_IDS.filter((id) => marketSurfaces()[id]?.jobs);

/** Markets with a published buyer page, in MARKET_ORDER. */
export const businessMarkets = (): string[] => MARKET_IDS.filter((id) => marketSurfaces()[id]?.business);

/** Markets with a published jobs hub: the decided ones first, then nearby, then the rest in MARKET_ORDER. */
export function orderedJobMarkets(decided: readonly string[] = [], nearby: readonly string[] = []): string[] {
  const all = jobMarkets();
  const first = [...decided, ...nearby].filter((id, i, a) => all.includes(id) && a.indexOf(id) === i);
  return [...first, ...all.filter((id) => !first.includes(id))];
}
