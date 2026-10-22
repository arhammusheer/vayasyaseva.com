/**
 * The tables resolveContext reads (src/context/core.ts), built once from
 * src/markets and the page registry. Serialisable: the boot script carries
 * them as JSON (boot.ts), with collectData for reading a page view.
 */
import { builtPages, clusters, linkable, pageEntry } from "@/content/registry";
import { jobsHubPath, type ClusterId, type WageStateSlug } from "@/content/registry/identifiers";
import { MARKETS, MARKET_IDS, NEARBY, PLACE_GROUPS, isMarketId, marketForRegion } from "@/markets/index";
import { LANGUAGE_MARKET_HINTS, LANGUAGE_SETS, STATE_LANGUAGE_SETS } from "@/markets/languages";
import { FALLBACK_LOCALE, allLocales, locales, localesOf, type Locale } from "@/lib/i18n";
import { LANGUAGE_COOKIE } from "@/lib/language-cookie";
import type { ContextTables, Side } from "./core";
import type { CollectData } from "./collect";
import { BANDS, CONTEXT_VERSION, HOLDOUT_SHARE, PICK_DAYS, WEIGHTS } from "./weights";

/** How many languages the picker shows as large choices; English is always one of them. */
export const PICKER_TOP = 3;

/** What each market has on each side of the site: its buyer page and its jobs hub, only where published. */
export function marketSurfaces(): Record<string, { business?: string; jobs?: string }> {
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

let cached: ContextTables | undefined;

export function contextTables(): ContextTables {
  if (cached) return cached;
  const surfaces = marketSurfaces();
  cached = {
    version: CONTEXT_VERSION,
    markets: MARKET_IDS,
    surfaces: Object.fromEntries(MARKET_IDS.map((id) => [id, { business: Boolean(surfaces[id]?.business), jobs: Boolean(surfaces[id]?.jobs) }])),
    standIn: Object.fromEntries(
      MARKET_IDS.map((id) => [id, ("standIn" in MARKETS[id] ? MARKETS[id].standIn : {}) as Partial<Record<Side, string>>]),
    ),
    nearby: NEARBY,
    weights: { jobs: WEIGHTS.jobs, business: WEIGHTS.business },
    audience: WEIGHTS.audience,
    bands: BANDS,
    days: PICK_DAYS,
    languages: {
      market: Object.fromEntries(MARKET_IDS.map((id) => [id, LANGUAGE_SETS[MARKETS[id].languageSet]])),
      state: Object.fromEntries(Object.entries(STATE_LANGUAGE_SETS).map(([state, set]) => [state, LANGUAGE_SETS[set]])),
      default: LANGUAGE_SETS.default,
      hint: LANGUAGE_MARKET_HINTS,
      always: FALLBACK_LOCALE,
      top: PICKER_TOP,
    },
  };
  return cached;
}

/** Locale tag → the two-letter code in the boot data (and the picker's order keys). */
export const LOCALE_CODES = { "en-IN": "en", "hi-IN": "hi", "hi-Latn-IN": "hl", "pa-IN": "pa", "kn-IN": "kn" } as const satisfies Record<Locale, string>;

/** A wage state page's state (ISO 3166-2:IN): its market's evidence for clients. */
const WAGE_STATE_REGIONS: Record<WageStateSlug, string> = {
  uttarakhand: "UK",
  "uttar-pradesh": "UP",
  delhi: "DL",
  haryana: "HR",
  punjab: "PB",
  karnataka: "KA",
  "andhra-pradesh": "AP",
};

/** Session length: 30 idle minutes (mobile browsers keep tabs, and their sessionStorage, for weeks). */
export const SESSION_IDLE_MS = 30 * 60 * 1000;

let cachedData: CollectData | undefined;

/** What collectSignals needs to read a page view (src/context/collect.ts). */
export function collectData(): CollectData {
  if (cachedData) return cachedData;
  const pages: Record<string, [string, string, string, string]> = {};
  for (const p of builtPages()) {
    const wage = p.kind === "wage-state" ? marketForRegion(WAGE_STATE_REGIONS[p.path.split("/").pop() as WageStateSlug]) : undefined;
    pages[p.path] = [
      isMarketId(p.cluster) ? p.cluster : "",
      p.audience === "jobs" ? "j" : p.audience === "mixed" ? "m" : "b",
      localesOf(p.path).map((l) => LOCALE_CODES[l]).join(""),
      wage ?? "",
    ];
  }
  cachedData = {
    pages,
    segments: Object.fromEntries(allLocales.map((l) => [locales[l].segment, l])),
    codes: Object.fromEntries(Object.entries(LOCALE_CODES).map(([l, c]) => [c, l])),
    markets: MARKET_IDS,
    words: PLACE_GROUPS.flatMap((g) => g.words.map((w) => [w, g.market] as const)),
    audienceWords: {
      jobs: ["job", "jobs", "naukri", "vacancy", "vacancies", "bharti", "hiring", "career", "careers"],
      business: ["crew", "crews", "manpower", "contractor", "contractors", "staffing", "outsourcing", "b2b"],
    },
    jobsParams: ["work", "hub", "role"],
    arrivalParams: ["gclid", "gbraid", "wbraid", "utm_campaign", "utm_source", "cluster"],
    idleMs: SESSION_IDLE_MS,
    holdoutShare: HOLDOUT_SHARE,
    languageCookie: LANGUAGE_COOKIE,
  };
  return cachedData;
}
