/**
 * Area intent: which cluster(s) the header shows a visitor (docs/area-intent.md).
 *
 * Signals are weighted and summed per cluster. What the visitor did beats how
 * they arrived, and both beat where their IP says they are: a buyer in
 * Mumbai who lands on /haridwar-sidcul from an Uttarakhand ad sees
 * Haridwar, not Mumbai. When the visitor's region points at one cluster and
 * their intent at another and neither clearly wins, the header shows both.
 *
 * No market is the default (owner direction, 17 Oct 2026): with no signal
 * the decision is empty and the site shows every market on equal terms
 * (MARKET_ORDER). Markets: Haridwar, Uttarakhand outside Haridwar,
 * Jalandhar–Kapurthala, Punjab outside it, Bengaluru (jobs and business),
 * and Delhi NCR (business only).
 *
 * Pure and dependency-free: the header (client), the tests and analytics
 * all use it. The server always renders the default, so search engines see
 * the same page as a visitor with no signals; only the header adapts.
 */

export type AreaSignals = {
  /** An area the visitor picked: a header area link, or a form answer. Strongest. */
  chosen?: string;
  /** The cluster of the first page of this session (its own page, e.g. /jobs/bengaluru). */
  landing?: string;
  /** The cluster of the page being viewed now. */
  page?: string;
  /** ?cluster=<id> on any URL this session (ads, SMS, shared links). */
  param?: string;
  /** Clusters named by UTM tags this session (campaign, term, content). */
  utm?: string[];
  /** Cluster pages viewed this session, by cluster. */
  views?: Record<string, number>;
  /** The cluster of the visitor's state, from the IP region (no permission asked). */
  geo?: string;
};

/** How much each signal counts. Tuned from the area_intent events (docs/area-intent.md). */
export const WEIGHTS = { chosen: 12, param: 7, landing: 6, page: 5, utm: 4, view: 1, viewCap: 3, geo: 3 } as const;

/** A visitor's region (ISO 3166-2:IN, without "IN-") to the market covering the state. */
export const REGION_CLUSTERS: Readonly<Record<string, string>> = { UK: "uttarakhand", UT: "uttarakhand", KA: "bengaluru", DL: "delhi-ncr", HR: "delhi-ncr", PB: "punjab" };

/**
 * Cities (the IP's, lower case) that narrow a state to the market inside it.
 * IP cities in India are rough (mobile networks often report a gateway city),
 * so this only refines the region's low-weight signal.
 */
const CITY_CLUSTERS: readonly { city: RegExp; region: readonly string[]; cluster: string }[] = [
  { city: /^(haridwar|roorkee|laksar|bhagwanpur|bahadrabad|jwalapur|ranipur|manglaur|jhabrera)$/, region: ["UK", "UT"], cluster: "haridwar" },
  { city: /^(jalandhar|kapurthala|phagwara|goraya|kartarpur|phillaur|nakodar|sultanpur lodhi|adampur|bholath)$/, region: ["PB"], cluster: "jalandhar" },
];

/**
 * The market for a visitor's region and city: the city's market when it is
 * one inside that state, else the state's. A city outside its state's list
 * (or a mismatched region) is ignored.
 */
export function geoCluster(region: string | null | undefined, city?: string | null): string | undefined {
  if (!region) return undefined;
  const place = city?.trim().toLowerCase();
  const narrowed = place ? CITY_CLUSTERS.find((c) => c.region.includes(region) && c.city.test(place)) : undefined;
  return narrowed?.cluster ?? REGION_CLUSTERS[region];
}

/**
 * The order markets are listed in when nothing is known about the visitor
 * (owner direction, 17 Oct 2026: no market comes first by default):
 * alphabetical by English name. A decision moves its market(s) to the front.
 */
export const MARKET_ORDER: readonly string[] = ["bengaluru", "delhi-ncr", "haridwar", "jalandhar", "punjab", "uttarakhand"];

/** A site state picked on the crew form (STATE_OPTIONS codes) to the cluster that serves it. */
export const SITE_STATE_CLUSTERS: Readonly<Record<string, string>> = { UK: "uttarakhand", KA: "bengaluru", DL: "delhi-ncr", HR: "delhi-ncr", PB: "jalandhar" };

/** Place words in UTM tags and campaign names, to the cluster they mean. */
const UTM_WORDS: readonly [RegExp, string][] = [
  [/haridwar|sidcul|roorkee|bahadrabad|bhagwanpur|search_jobs/i, "haridwar"],
  [/bengaluru|bangalore|blr|peenya|bommasandra|whitefield/i, "bengaluru"],
  [/jalandhar|kapurthala|phagwara|goraya/i, "jalandhar"],
  [/punjab|ludhiana|mohali|kharar|amritsar|patiala/i, "punjab"],
  [/uttarakhand|dehradun|selaqui|rudrapur|kashipur|sitarganj|pantnagar/i, "uttarakhand"],
];
export const clustersInUtm = (values: (string | null | undefined)[]) => {
  const found = new Set<string>();
  for (const v of values) for (const [re, id] of UTM_WORDS) if (v && re.test(v)) found.add(id);
  return [...found];
};

/** What a cluster has on each side of the site; only these can be shown. */
export type AreaSurfaces = Readonly<Record<string, { business?: string; jobs?: string }>>;

export type AreaDecision = {
  /** Clusters to show in the business header's area slot, in order (one, or two when torn). */
  business: string[];
  /** Clusters whose jobs hub the jobs door and Apply open, in order. */
  jobs: string[];
  /** "default": no signal; "single": one cluster won; "both": region and intent disagree with no clear winner. */
  mode: "default" | "single" | "both";
  /** The strongest non-region cluster, and the region's, for measurement. */
  intent?: string;
  geo?: string;
  /** Winner's share of all points, 0 to 1 (1 when there is one signal). */
  confidence: number;
  scores: Record<string, number>;
};

/** A cluster must out-score the other by this factor to win outright over a disagreeing region. */
const CLEAR_WIN = 2;

export function scoreSignals(s: AreaSignals) {
  const intent: Record<string, number> = {};
  const add = (id: string | undefined, points: number) => {
    if (id) intent[id] = (intent[id] ?? 0) + points;
  };
  add(s.chosen, WEIGHTS.chosen);
  add(s.param, WEIGHTS.param);
  add(s.landing, WEIGHTS.landing);
  add(s.page, WEIGHTS.page);
  for (const id of new Set(s.utm ?? [])) add(id, WEIGHTS.utm);
  for (const [id, n] of Object.entries(s.views ?? {})) add(id, Math.min(n, WEIGHTS.viewCap) * WEIGHTS.view);
  const scores = { ...intent };
  if (s.geo) scores[s.geo] = (scores[s.geo] ?? 0) + WEIGHTS.geo;
  return { intent, scores };
}

/**
 * The decision for one visitor. With no signal it is empty ("default"): no
 * market is preferred. A side only shows clusters that have a page there; a
 * side left with none is empty, and the site shows every market there.
 */
export function decideArea(s: AreaSignals, surfaces: AreaSurfaces): AreaDecision {
  const { intent, scores } = scoreSignals(s);
  const ranked = Object.entries(intent).sort((a, b) => b[1] - a[1]);
  const top = ranked[0]?.[0];
  const topScore = ranked[0]?.[1] ?? 0;
  const geo = s.geo;
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  let order: string[];
  let mode: AreaDecision["mode"];
  if (s.chosen) {
    // The visitor said so: nothing outweighs an explicit pick.
    order = [s.chosen];
    mode = "single";
  } else if (!top && !geo) {
    order = [];
    mode = "default";
  } else if (!top) {
    order = [geo!];
    mode = "single";
  } else if (!geo || geo === top || topScore >= CLEAR_WIN * (scores[geo] ?? 0)) {
    // Intent wins outright: it agrees with the region, there is no region,
    // or it is at least twice the region's pull.
    order = [top];
    mode = "single";
  } else {
    order = [top, geo];
    mode = "both";
  }

  const side = (key: "business" | "jobs") => order.filter((id) => surfaces[id]?.[key]);
  const business = side("business");
  const jobs = side("jobs");
  return {
    business,
    jobs,
    mode: !business.length && !jobs.length ? "default" : mode === "both" && business.length < 2 && jobs.length < 2 ? "single" : mode,
    intent: top,
    geo,
    confidence: total ? Math.round(((scores[order[0]] ?? 0) / total) * 100) / 100 : 0,
    scores,
  };
}
