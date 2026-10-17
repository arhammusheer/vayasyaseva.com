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
 * One vocabulary per market (owner direction, 17 Oct 2026): the place
 * groups' words name the market for an IP city (exact match), a typed site
 * city (whole words) and UTM tags and campaign names (whole words, with `_`
 * and `-` read as spaces). There is no second list of ad words.
 *
 * Order matters, and the ranks say it outright: `placeGroups[].rank`. A
 * city, typed place or tag is matched against the groups in rank order;
 * for a city or typed place the first match wins, and for tags the markets
 * come out in the order of their first matching group (the language picker
 * takes the first: src/lib/language-rank.ts urlIntent). Narrow markets come
 * first (Haridwar before the rest of Uttarakhand), then the state names,
 * then Delhi NCR's Delhi and Haryana groups (a "Delhi Road" in another
 * state's town matches that town first), then "NCR" (no state of its own).
 */
import type { ClusterId, LocaleTag } from "@/content/registry/identifiers";

/**
 * Markets, alphabetical by English name (owner direction, 17 Oct 2026: no
 * market comes first by default). Every market is a cluster id (stored,
 * append-only, in identifiers.ts); not every cluster is a market.
 */
export const MARKET_IDS = ["bengaluru", "delhi-ncr", "haridwar", "jalandhar", "punjab", "uttarakhand"] as const satisfies readonly ClusterId[];
export type MarketId = (typeof MARKET_IDS)[number];

/** A region code: ISO 3166-2:IN without "IN-". Always the current code: old ones are aliases (REGION_ALIASES). */
export type RegionCode = string;

/**
 * Old region codes and the current code each stands for. Geo databases and
 * IP headers still send Uttarakhand's pre-2007 code UT; it means UK
 * everywhere (owner direction, 17 Oct 2026). Market records use only the
 * current codes; the queries in ./index.ts read every code through this.
 */
export const REGION_ALIASES: Readonly<Record<string, RegionCode>> = { UT: "UK" };

/** The picker's language orders a market can take (src/lib/language-rank.ts RANK_SETS). */
export type LanguageSetName = "hindi" | "karnataka" | "punjab";

/** A side of the site: the buyer pages, or the jobs pages. */
export type Side = "business" | "jobs";

export type PlaceGroup = {
  /** Position among every market's groups: lower is tried first. */
  rank: number;
  /**
   * The regions the words lie in. With one region, it is the state a typed
   * place names (placeState); a group across several ("NCR") names no state.
   */
  region: readonly RegionCode[];
  /** Lower case, accents stripped, single spaces (the form `plain()` gives). */
  words: readonly string[];
  /**
   * The words name the whole state ("Uttarakhand", "Punjab"), not a place
   * in it: they give the state (placeState) and the market in ad tags, but
   * never narrow an IP city or a typed site city away from the sending
   * page's market ("Plot 12, Uttarakhand" from /locations/haridwar stays
   * Haridwar). The group's market is the state's default.
   */
  wholeState?: true;
};

export type MarketRecord = {
  /** The states the market's sites are in (ISO 3166-2:IN codes). */
  states: readonly RegionCode[];
  /**
   * The states this market covers when nothing narrower is known: for a
   * visitor's IP region and for the state picked on the crew form.
   */
  defaultStates: readonly RegionCode[];
  /**
   * The market's words: places that narrow a state to it (for the IP's
   * city, and the city typed on the crew form), its state's name where the
   * market is the state's default, and the short forms campaigns use (blr,
   * ncr). UTM tags and campaign names are matched against the same words, as
   * whole words (letters on either side don't match: "punjabi" isn't Punjab).
   * Spellings include the old and transliterated ones geo databases and
   * people use.
   */
  placeGroups: readonly PlaceGroup[];
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
    defaultStates: ["KA"],
    placeGroups: [
      { rank: 5, region: ["KA"], words: ["bengaluru", "bangalore", "blr", "peenya", "bommasandra", "jigani", "attibele", "hoskote", "whitefield", "electronic city", "narasapura"] },
    ],
    languageSet: "karnataka",
    // Karnataka: ಕನ್ನಡ (published 17 Oct 2026) · English · Hinglish.
    quickSwitch: ["kn-IN", "en-IN", "hi-Latn-IN"],
    sides: ["business", "jobs"],
  },
  "delhi-ncr": {
    // UP has no market of its own: only its NCR cities do.
    states: ["DL", "HR", "UP"],
    defaultStates: ["DL", "HR"],
    placeGroups: [
      { rank: 2, region: ["UP"], words: ["noida", "greater noida", "ghaziabad", "gautam buddha nagar"] },
      // The Delhi and Haryana sides, one state each, so a typed town names
      // its state (placeState). After the towns and the state names: a
      // "Delhi Road" in another state's town matches that town first. Same
      // market as the region alone. "Delhi" is the city and the state.
      { rank: 8, region: ["DL"], words: ["delhi", "new delhi", "okhla", "bawana", "narela", "mayapuri", "naraina", "wazirpur", "patparganj", "mundka"] },
      { rank: 9, region: ["HR"], words: ["gurugram", "gurgaon", "manesar", "faridabad", "ballabgarh", "sonipat", "kundli", "bahadurgarh"] },
      // "NCR" spans all three states, so it names the market in each (a UP
      // site in "NCR" is Delhi NCR's) but no state. Last: "Gurgaon NCR" is Haryana.
      { rank: 10, region: ["DL", "HR", "UP"], words: ["ncr"] },
    ],
    languageSet: "hindi",
    quickSwitch: HINDI_BELT_SWITCH,
    // Business only: no jobs hub yet.
    sides: ["business"],
  },
  haridwar: {
    states: ["UK"],
    // The state's default is the rest of Uttarakhand; Haridwar is named by place.
    defaultStates: [],
    placeGroups: [
      { rank: 0, region: ["UK"], words: ["haridwar", "hardwar", "sidcul", "roorkee", "rurki", "laksar", "bhagwanpur", "bahadrabad", "jwalapur", "ranipur", "manglaur", "jhabrera"] },
    ],
    languageSet: "hindi",
    // Hindi belt (PLAN §6.4): English · हिंदी · Hinglish.
    quickSwitch: HINDI_BELT_SWITCH,
    sides: ["business", "jobs"],
  },
  jalandhar: {
    states: ["PB"],
    // The state's default is the rest of Punjab; the Jalandhar region is named by place.
    defaultStates: [],
    placeGroups: [
      { rank: 1, region: ["PB"], words: ["jalandhar", "jullundur", "kapurthala", "phagwara", "goraya", "kartarpur", "phillaur", "nakodar", "sultanpur lodhi", "adampur", "bholath"] },
    ],
    languageSet: "punjab",
    quickSwitch: PUNJAB_SWITCH,
    sides: ["business", "jobs"],
  },
  punjab: {
    states: ["PB"],
    defaultStates: ["PB"],
    placeGroups: [
      // The rest of the state, so a typed city names its market even on another market's page.
      { rank: 4, region: ["PB"], words: ["ludhiana", "mohali", "kharar", "amritsar", "patiala", "rajpura", "bathinda", "zirakpur", "dera bassi"] },
      // The state's name: the state's default market ("jobs_punjab").
      { rank: 7, region: ["PB"], words: ["punjab"], wholeState: true },
    ],
    languageSet: "punjab",
    quickSwitch: PUNJAB_SWITCH,
    // Jobs only: Punjab outside Jalandhar–Kapurthala has no buyer page, and
    // the Jalandhar region's covers Punjab's buyers.
    sides: ["jobs"],
    standIn: { business: "jalandhar" },
  },
  uttarakhand: {
    states: ["UK"],
    defaultStates: ["UK"],
    placeGroups: [
      // The rest of the state, so a typed city names its market even on another market's page.
      { rank: 3, region: ["UK"], words: ["dehradun", "selaqui", "rudrapur", "kashipur", "sitarganj", "pantnagar", "haldwani", "kotdwar", "rishikesh"] },
      // The state's name: the state's default market ("Roorkee, Uttarakhand" stays Haridwar's: rank 0 is tried first).
      { rank: 6, region: ["UK"], words: ["uttarakhand"], wholeState: true },
    ],
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
 * Clusters that are not markets: stored ids with no pages of their own and
 * no intent. Neither steers the language picker or area intent (owner
 * direction, 17 Oct 2026: ?cluster=saharanpur is no longer intent; only
 * markets count). The ids stay stored values (identifiers.ts).
 */
export const NON_MARKET_CLUSTERS = {
  saharanpur: "An older cluster id (UP), kept for stored rows; not a market.",
  other: "The filing cluster for no market.",
} as const satisfies Record<Exclude<ClusterId, MarketId>, string>;
