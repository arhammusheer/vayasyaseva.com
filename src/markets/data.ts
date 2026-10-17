/**
 * Market knowledge, one record per market (docs/area-intent.md "Adding a
 * market"). Layer 1: data only. The query functions are in ./index.ts;
 * labels (./labels.ts) and schema.org places (./schema-org.ts) are separate
 * entry points, so the proxy and client bundles that need a decision never
 * carry the strings.
 *
 * Dependency-free except types from the stored identifiers: the proxy
 * (via src/lib/language-rank.ts), every client bundle, the scripts and the
 * tests import it. Never import the registry, i18n, React or page content here.
 *
 * Order matters in two places, and the ranks say it outright:
 * - `placeGroups[].rank`: a city or typed place is matched against the groups
 *   in rank order, first match wins. Narrow markets come first (Haridwar
 *   before the rest of Uttarakhand), Delhi NCR's Delhi and Haryana groups
 *   last (a "Delhi Road" in another state's town matches that town first).
 * - `adRank`: UTM tags are matched against the ad words in rank order; the
 *   language picker takes the first market found (src/lib/language-rank.ts
 *   urlIntent).
 */
import type { ClusterId, LocaleTag } from "@/content/registry/identifiers";

/**
 * Markets, alphabetical by English name (owner direction, 17 Oct 2026: no
 * market comes first by default). Every market is a cluster id (stored,
 * append-only, in identifiers.ts); not every cluster is a market.
 */
export const MARKET_IDS = ["bengaluru", "delhi-ncr", "haridwar", "jalandhar", "punjab", "uttarakhand"] as const satisfies readonly ClusterId[];
export type MarketId = (typeof MARKET_IDS)[number];

/** A region code: ISO 3166-2:IN without "IN-". Uttarakhand has two (UK and the older UT). */
export type RegionCode = string;

/** The picker's language orders a market can take (src/lib/language-rank.ts RANK_SETS). */
export type LanguageSetName = "hindi" | "karnataka" | "punjab";

/** A side of the site: the buyer pages, or the jobs pages. */
export type Side = "business" | "jobs";

export type PlaceGroup = {
  /** Position among every market's groups: lower is tried first. */
  rank: number;
  /** The regions the words lie in; the first is the state a typed place names (placeState). */
  region: readonly RegionCode[];
  /** Lower case, accents stripped, single spaces (the form `plain()` gives). */
  words: readonly string[];
};

export type MarketRecord = {
  /** The states the market's sites are in (ISO 3166-2:IN codes). */
  states: readonly RegionCode[];
  /**
   * The regions this market covers when nothing narrower is known:
   * `region` for a visitor's IP region, `siteState` for the state picked on
   * the crew form. They differ for Uttarakhand: the form never sends the old
   * UT code, so only the IP side lists it.
   */
  defaultFor: { region: readonly RegionCode[]; siteState: readonly RegionCode[] };
  /**
   * Places that narrow a state to this market: for the IP's city, and for
   * the city typed on the crew form. Spellings include the old and
   * transliterated ones geo databases and people use.
   */
  placeGroups: readonly PlaceGroup[];
  /**
   * Place words in UTM tags and campaign names, matched as whole words
   * (letters on either side don't match: "punjabi" isn't Punjab). A second
   * list, not the place words: campaigns use short forms (blr, ncr).
   */
  adWords: readonly string[];
  /** Position of `adWords` among every market's: lower is tried first. */
  adRank: number;
  /** The picker's language order for a page or request in this market. */
  languageSet: LanguageSetName;
  /**
   * The header language switch on this market's pages, in order (PLAN §6.4).
   * A page's other languages go under "More".
   */
  quickSwitch: readonly LocaleTag[];
  /** The sides of the site this market has pages on (published or not: the registry decides that). */
  sides: readonly Side[];
  /** Where this market has no page on a side, the market whose page stands in for it there. */
  standIn?: Partial<Record<Side, MarketId>>;
};

const HINDI_BELT_SWITCH = ["en-IN", "hi-IN", "hi-Latn-IN"] as const satisfies readonly LocaleTag[];
// Punjabi first where a page has it (owner direction, 17 Oct 2026), then
// PLAN §6.4's Punjab order: Hinglish · English · हिंदी.
const PUNJAB_SWITCH = ["pa-IN", "hi-Latn-IN", "en-IN"] as const satisfies readonly LocaleTag[];

export const MARKETS = {
  bengaluru: {
    states: ["KA"],
    defaultFor: { region: ["KA"], siteState: ["KA"] },
    placeGroups: [
      { rank: 5, region: ["KA"], words: ["bengaluru", "bangalore", "peenya", "bommasandra", "jigani", "attibele", "hoskote", "whitefield", "electronic city", "narasapura"] },
    ],
    adWords: ["bengaluru", "bangalore", "blr", "peenya", "bommasandra", "whitefield", "jigani"],
    adRank: 1,
    languageSet: "karnataka",
    // Karnataka: ಕನ್ನಡ (published 17 Oct 2026) · English · Hinglish.
    quickSwitch: ["kn-IN", "en-IN", "hi-Latn-IN"],
    sides: ["business", "jobs"],
  },
  "delhi-ncr": {
    // UP has no market of its own: only its NCR cities do.
    states: ["DL", "HR", "UP"],
    defaultFor: { region: ["DL", "HR"], siteState: ["DL", "HR"] },
    placeGroups: [
      { rank: 2, region: ["UP"], words: ["noida", "greater noida", "ghaziabad", "gautam buddha nagar"] },
      // The Delhi and Haryana sides, one state each, so a typed town names
      // its state (placeState). Last: a "Delhi Road" in another state's town
      // matches that town first. Same market as the region alone, so no decision changes.
      { rank: 6, region: ["DL"], words: ["delhi", "new delhi", "okhla", "bawana", "narela", "mayapuri", "naraina", "wazirpur", "patparganj", "mundka"] },
      { rank: 7, region: ["HR"], words: ["gurugram", "gurgaon", "manesar", "faridabad", "ballabgarh", "sonipat", "kundli", "bahadurgarh"] },
    ],
    adWords: ["delhi", "ncr", "noida", "gurugram", "gurgaon", "manesar", "faridabad", "ghaziabad", "bawana", "narela"],
    adRank: 5,
    languageSet: "hindi",
    quickSwitch: HINDI_BELT_SWITCH,
    // Business only: no jobs hub yet.
    sides: ["business"],
  },
  haridwar: {
    states: ["UK", "UT"],
    // The state's default is the rest of Uttarakhand; Haridwar is named by place.
    defaultFor: { region: [], siteState: [] },
    placeGroups: [
      { rank: 0, region: ["UK", "UT"], words: ["haridwar", "hardwar", "sidcul", "roorkee", "rurki", "laksar", "bhagwanpur", "bahadrabad", "jwalapur", "ranipur", "manglaur", "jhabrera"] },
    ],
    adWords: ["haridwar", "hardwar", "sidcul", "roorkee", "bahadrabad", "bhagwanpur"],
    adRank: 0,
    languageSet: "hindi",
    // Hindi belt (PLAN §6.4): English · हिंदी · Hinglish.
    quickSwitch: HINDI_BELT_SWITCH,
    sides: ["business", "jobs"],
  },
  jalandhar: {
    states: ["PB"],
    // The state's default is the rest of Punjab; the Jalandhar region is named by place.
    defaultFor: { region: [], siteState: [] },
    placeGroups: [
      { rank: 1, region: ["PB"], words: ["jalandhar", "jullundur", "kapurthala", "phagwara", "goraya", "kartarpur", "phillaur", "nakodar", "sultanpur lodhi", "adampur", "bholath"] },
    ],
    adWords: ["jalandhar", "kapurthala", "phagwara", "goraya"],
    adRank: 2,
    languageSet: "punjab",
    quickSwitch: PUNJAB_SWITCH,
    sides: ["business", "jobs"],
  },
  punjab: {
    states: ["PB"],
    defaultFor: { region: ["PB"], siteState: ["PB"] },
    placeGroups: [
      // The rest of the state, so a typed city names its market even on another market's page.
      { rank: 4, region: ["PB"], words: ["ludhiana", "mohali", "kharar", "amritsar", "patiala", "rajpura", "bathinda", "zirakpur", "dera bassi"] },
    ],
    adWords: ["punjab", "ludhiana", "mohali", "kharar", "amritsar", "patiala"],
    adRank: 3,
    languageSet: "punjab",
    quickSwitch: PUNJAB_SWITCH,
    // Jobs only: Punjab outside Jalandhar–Kapurthala has no buyer page, and
    // the Jalandhar region's covers Punjab's buyers.
    sides: ["jobs"],
    standIn: { business: "jalandhar" },
  },
  uttarakhand: {
    states: ["UK", "UT"],
    // The crew form's state list has UK only; the IP side also sends the older UT.
    defaultFor: { region: ["UK", "UT"], siteState: ["UK"] },
    placeGroups: [
      // The rest of the state, so a typed city names its market even on another market's page.
      { rank: 3, region: ["UK", "UT"], words: ["dehradun", "selaqui", "rudrapur", "kashipur", "sitarganj", "pantnagar", "haldwani", "kotdwar", "rishikesh"] },
    ],
    adWords: ["uttarakhand", "dehradun", "selaqui", "rudrapur", "kashipur", "sitarganj", "pantnagar"],
    adRank: 4,
    languageSet: "hindi",
    quickSwitch: HINDI_BELT_SWITCH,
    sides: ["business", "jobs"],
  },
} as const satisfies Record<MarketId, MarketRecord>;

/** Markets with pages on a side (by `sides`). */
type MarketsWithSide<S extends Side> = { [K in MarketId]: S extends (typeof MARKETS)[K]["sides"][number] ? K : never }[MarketId];
export type BusinessMarketId = MarketsWithSide<"business">;
export type JobsMarketId = MarketsWithSide<"jobs">;

/**
 * Clusters that are not markets: stored ids with no pages of their own.
 * Saharanpur (UP) still takes the Hindi picker order when a request names it
 * (?cluster=saharanpur); "other" is the filing cluster for no market.
 */
export const NON_MARKET_CLUSTERS = {
  saharanpur: { languageSet: "hindi" },
  other: { languageSet: undefined },
} as const satisfies Record<Exclude<ClusterId, MarketId>, { languageSet: LanguageSetName | undefined }>;
