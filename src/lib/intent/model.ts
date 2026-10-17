/**
 * Area intent: which market(s) the site puts first for a visitor
 * (docs/area-intent.md).
 *
 * Signals are weighted and summed per cluster. What the visitor did beats how
 * they arrived, and both beat where their IP says they are: a buyer in
 * Mumbai who lands on /locations/haridwar from an Uttarakhand ad sees
 * Haridwar, not Mumbai. When the visitor's region points at one cluster and
 * their intent at another and neither clearly wins, both show. A market's
 * own page always leads on its own side, whatever else the visitor did.
 *
 * No market is the default (owner direction, 17 Oct 2026): with no signal
 * the decision is empty and the site shows every market on equal terms
 * (MARKET_ORDER). Markets: Haridwar, Uttarakhand outside Haridwar,
 * Jalandhar–Kapurthala, Punjab outside it, Bengaluru (jobs and business),
 * and Delhi NCR (business only).
 *
 * Pure: the header, the market lists and the jobs form (client), the tests
 * and analytics all use it. Market knowledge (places, regions, ad words,
 * stand-ins) comes from src/markets; this file holds the weighing. The server always renders
 * the no-signal page, so search engines see the same page as a visitor with
 * no signals; only the order and the area links adapt after load.
 */

import {
  MARKET_IDS,
  MARKET_STATES,
  PLACE_GROUPS,
  REGION_MARKETS,
  SITE_STATE_MARKETS,
  geoMarket,
  marketsInAdTags,
  siteMarket,
  standInFor,
  stateForPlace,
} from "@/markets/index";

/** Bumped when the decision rules change, so analytics can tell the models' data apart. */
export const MODEL_VERSION = 2;

export type AreaSignals = {
  /**
   * A market the visitor picked (a labelled market link, or the jobs form's
   * "Where do you live?"). The strongest signal, but a weight, not an
   * override: a fresh ad for another market can outweigh an old pick.
   */
  chosen?: string;
  /** Whether `chosen` was made in this session (counts more than an older pick). */
  chosenFresh?: boolean;
  /** The cluster of the first page of this session (its own page, e.g. /jobs/bengaluru). */
  landing?: string;
  /** The cluster of the page being viewed now. */
  page?: string;
  /** ?cluster=<id> on any URL this session (ads, SMS, shared links). */
  param?: string;
  /** Clusters named by UTM tags this session (campaign, term, content, source). */
  utm?: string[];
  /** Cluster pages viewed this session, by cluster. */
  views?: Record<string, number>;
  /** The market of the visitor's state and city, from the IP (no permission asked). Indian visitors only. */
  geo?: string;
};

/** How much each signal counts. Tuned from the area_intent events (docs/area-intent.md). */
export const WEIGHTS = { chosenFresh: 20, chosen: 12, param: 7, landing: 6, page: 5, utm: 4, view: 1, viewCap: 3, geo: 3 } as const;

/*
 * The market tables below are derived from src/markets (one record per
 * market); edit them there. They stay here as aliases because the tests,
 * the header and the forms import them by these names.
 */

/** A visitor's region (ISO 3166-2:IN, without "IN-") to the market covering the state. UP has none: only its NCR cities do. */
export const REGION_CLUSTERS: Readonly<Record<string, string>> = REGION_MARKETS;

/** The states each market's sites are in (ISO 3166-2:IN codes). */
export const CLUSTER_STATES: Readonly<Record<string, readonly string[]>> = MARKET_STATES;

/**
 * Places that narrow a state to the market inside it, in match order (first
 * match wins): src/markets/data.ts placeGroups, by rank.
 */
export const PLACES: readonly { words: readonly string[]; region: readonly string[]; cluster: string }[] = PLACE_GROUPS.map((g) => ({
  words: g.words,
  region: g.region,
  cluster: g.market,
}));

/**
 * The state a typed city is in, when it names a place in PLACES ("Roorkee"
 * → UK, "Peenya" → KA, "Noida" → UP), for every market alike.
 */
export const placeState = (city: string | null | undefined): string | undefined => stateForPlace(city);

/**
 * The market for a visitor's region and city: the city's market when it is
 * one inside that state, else the state's. A city outside its state's list
 * (or a mismatched region) is ignored.
 */
export const geoCluster = (region: string | null | undefined, city?: string | null): string | undefined => geoMarket(region, city);

/**
 * The order markets are listed in when nothing is known about the visitor
 * (owner direction, 17 Oct 2026: no market comes first by default):
 * alphabetical by English name. A decision moves its market(s) to the front.
 */
export const MARKET_ORDER: readonly string[] = MARKET_IDS;

/** A site state picked on the crew form to the market covering it, when nothing narrower is known. */
export const SITE_STATE_CLUSTERS: Readonly<Record<string, string>> = SITE_STATE_MARKETS;

/**
 * The market a business site is in: a place named in the city ("SIDCUL
 * Haridwar", "Kapurthala") inside the state, else the page the form was sent
 * from when its market covers that state (a Haridwar enquiry from
 * /locations/haridwar), else the state's market. Null when the state is
 * covered by none (a UP site outside NCR) or unknown.
 */
export const siteCluster = (state: string | null | undefined, city: string | null | undefined, pageCluster?: string | null): string | null =>
  siteMarket(state, city, pageCluster);

/**
 * Markets named by place words in UTM tags and campaign names, as whole
 * words (src/markets/data.ts adWords). Campaigns say which market they are
 * for with ?cluster= or a place word (jobs_jalandhar), never a generic name
 * (search_jobs means no market).
 */
export const clustersInUtm = (values: (string | null | undefined)[]): string[] => marketsInAdTags(values);

/** What a cluster has on each side of the site; only these can be shown. */
export type AreaSurfaces = Readonly<Record<string, { business?: string; jobs?: string }>>;

export type AreaDecision = {
  /** Clusters to show in the business header's area slot, in order (one, or two). */
  business: string[];
  /** Clusters whose jobs hub the jobs door and Apply open, in order (one, or two). */
  jobs: string[];
  /** "default": no signal; "single": one cluster leads; "both": two markets, neither a clear winner (or the page's own and the visitor's). */
  mode: "default" | "single" | "both";
  /** The strongest non-region cluster, and the region's, for measurement. */
  intent?: string;
  geo?: string;
  /** Which signal gave the leading market most of its points (measurement). */
  basis: "chosen" | "param" | "landing" | "page" | "utm" | "views" | "geo" | "none";
  /** Whether a market the visitor picked is among the signals (measurement). */
  chosen: boolean;
  /** Winner's share of all points, 0 to 1 (1 when there is one signal). */
  confidence: number;
  scores: Record<string, number>;
};

/** A cluster must out-score the other by this factor to win outright. */
const CLEAR_WIN = 2;

const points = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? n : 0);

export function scoreSignals(s: AreaSignals) {
  const intent: Record<string, number> = {};
  const parts: Record<string, Partial<Record<AreaDecision["basis"], number>>> = {};
  const add = (id: string | undefined, n: number, signal: AreaDecision["basis"]) => {
    if (!id || n <= 0) return;
    intent[id] = (intent[id] ?? 0) + n;
    parts[id] = { ...parts[id], [signal]: (parts[id]?.[signal] ?? 0) + n };
  };
  add(s.chosen, s.chosenFresh ? WEIGHTS.chosenFresh : WEIGHTS.chosen, "chosen");
  add(s.param, WEIGHTS.param, "param");
  add(s.landing, WEIGHTS.landing, "landing");
  add(s.page, WEIGHTS.page, "page");
  for (const id of new Set(s.utm ?? [])) add(id, WEIGHTS.utm, "utm");
  for (const [id, n] of Object.entries(s.views ?? {})) add(id, Math.min(points(n), WEIGHTS.viewCap) * WEIGHTS.view, "views");
  const scores = { ...intent };
  if (s.geo) {
    scores[s.geo] = (scores[s.geo] ?? 0) + WEIGHTS.geo;
    parts[s.geo] = { ...parts[s.geo], geo: WEIGHTS.geo };
  }
  return { intent, scores, parts };
}

/**
 * The decision for one visitor. With no signal it is empty ("default"): no
 * market is preferred. Each side shows up to two markets with a page there:
 * the page's own market first when it has one on that side, then the
 * visitor's (intent, and the region when torn), a stand-in for a market
 * without a page on that side, else the next market by score.
 */
export function decideArea(s: AreaSignals, surfaces: AreaSurfaces): AreaDecision {
  const { intent, scores, parts } = scoreSignals(s);
  const ranked = Object.entries(intent).sort((a, b) => b[1] - a[1]);
  const [top, topScore = 0] = ranked[0] ?? [];
  const [second, secondScore = 0] = ranked[1] ?? [];
  const geo = s.geo;
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  let order: string[];
  if (!top && !geo) {
    order = [];
  } else if (!top) {
    order = [geo!];
  } else if (geo && geo !== top && topScore < CLEAR_WIN * (scores[geo] ?? 0)) {
    // The region pulls elsewhere and intent isn't twice as strong: both.
    order = [top, geo];
  } else if (second && topScore < CLEAR_WIN * secondScore && (scores[second] ?? 0) >= (scores[geo ?? ""] ?? 0)) {
    // Two intents close together (an old pick and a fresh ad): both.
    order = [top, second];
  } else {
    order = [top];
  }

  const byScore = Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const side = (key: "business" | "jobs") => {
    const out: string[] = [];
    const push = (id: string | undefined) => {
      if (id && surfaces[id]?.[key] && !out.includes(id)) out.push(id);
    };
    if (s.page) push(s.page);
    for (const id of order) {
      push(id);
      push(standInFor(id, key));
    }
    if (!out.length) for (const id of byScore) push(id);
    return out.slice(0, 2);
  };
  const business = side("business");
  const jobs = side("jobs");
  const lead = order[0];
  const leadParts = lead ? parts[lead] ?? {} : {};
  const basis = (Object.entries(leadParts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? "none") as AreaDecision["basis"];
  const mode: AreaDecision["mode"] = !business.length && !jobs.length ? "default" : business.length > 1 || jobs.length > 1 ? "both" : "single";
  return {
    business,
    jobs,
    mode,
    intent: top,
    geo,
    basis,
    chosen: Boolean(s.chosen),
    confidence: total && lead ? Math.round(((scores[lead] ?? 0) / total) * 100) / 100 : 0,
    scores,
  };
}
