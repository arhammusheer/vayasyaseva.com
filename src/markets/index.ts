/**
 * Market queries (docs/visitor-context.md). Layer 2: pure functions over the
 * market records in ./data.ts, the place ids in ./places.ts and the form
 * areas in ./areas.ts. The proxy and client bundles import this file, so it
 * carries no labels: those are in ./labels.ts and ./schema-org.ts, imported
 * on their own. Never import the registry, i18n, React or page content here.
 */
import { CLUSTER_IDS, type ClusterId } from "@/content/registry/identifiers";
import { AREA_CLUSTERS } from "@/lib/talent-intake/rules";
import { FORM_AREAS, MARKET_AREA_ANSWERS, areaFilesUnder, areaSetOf, type AreaId } from "./areas";
import { MARKETS, MARKET_IDS, REGION_ALIASES, type LanguageSetName, type MarketId, type MarketRecord, type PlaceGroup, type RegionCode, type Side } from "./data";
import { PLACES_BY_ID, type Place, type PlaceId } from "./places";

export { MARKETS, MARKET_IDS, NEARBY, NON_MARKET_CLUSTERS, REGION_ALIASES } from "./data";
export { PLACES_BY_ID } from "./places";
export { FORM_AREAS, MARKET_AREA_ANSWERS, UNPREFIXED_AREA_SET } from "./areas";
export type { BusinessMarketId, JobsMarketId, LanguageSetName, MarketId, MarketRecord, PlaceGroup, RegionCode, Side } from "./data";
export type { Place, PlaceId } from "./places";
export type { AreaId } from "./areas";

export const isMarketId = (id: unknown): id is MarketId => typeof id === "string" && (MARKET_IDS as readonly string[]).includes(id);
export const isClusterId = (id: unknown): id is ClusterId => typeof id === "string" && (CLUSTER_IDS as readonly string[]).includes(id);

/** The records widened to MarketRecord, for queries over every market. */
const RECORDS: Readonly<Record<MarketId, MarketRecord>> = MARKETS;
const entries = MARKET_IDS.map((id) => [id, RECORDS[id]] as const);

/* ---------- Regions and states ---------- */

/** The current code for a region code: an old one (UT) is read as its current code (UK). */
export function canonicalRegion(code: string): RegionCode;
export function canonicalRegion(code: string | null | undefined): RegionCode | undefined;
export function canonicalRegion(code: string | null | undefined) {
  if (!code) return undefined;
  return Object.hasOwn(REGION_ALIASES, code) ? REGION_ALIASES[code] : code;
}

/**
 * A state (current codes only) to the market covering it when nothing
 * narrower is known: for a visitor's IP region and for the site state
 * picked on the crew form (UP has none: only its NCR cities do). Look codes
 * up with marketForRegion, which reads old codes too.
 */
export const REGION_MARKETS: Readonly<Record<RegionCode, MarketId>> = Object.fromEntries(
  entries.flatMap(([id, m]) => m.defaultStates.map((r) => [r, id])),
);
/** The same table for a site state picked on the crew form (one table since UT became an alias). */
export const SITE_STATE_MARKETS: Readonly<Record<RegionCode, MarketId>> = REGION_MARKETS;
/** The states each market's sites are in. */
export const MARKET_STATES = Object.fromEntries(entries.map(([id, m]) => [id, m.states])) as Readonly<Record<MarketId, readonly RegionCode[]>>;

export const marketForRegion = (region: string | null | undefined): MarketId | undefined => {
  const code = canonicalRegion(region);
  return code && Object.hasOwn(REGION_MARKETS, code) ? REGION_MARKETS[code] : undefined;
};
export const marketForSiteState = marketForRegion;
/** The states a cluster's sites are in; none for a cluster that is not a market. */
export const statesOf = (id: string): readonly RegionCode[] => (isMarketId(id) ? RECORDS[id].states : []);
/** The markets whose sites are in a state, in MARKET_IDS order. */
export const marketsForState = (state: string | null | undefined): MarketId[] => {
  const code = canonicalRegion(state);
  return code ? MARKET_IDS.filter((id) => RECORDS[id].states.includes(code)) : [];
};
/** Whether a market's sites are in a state (false for a cluster that is not a market). */
export const marketCoversState = (id: string | null | undefined, state: string) =>
  isMarketId(id) && RECORDS[id].states.includes(canonicalRegion(state));

/* ---------- Places ---------- */

/** Every market's place groups, in rank order (first match wins). */
export const PLACE_GROUPS: readonly (PlaceGroup & { market: MarketId })[] = entries
  .flatMap(([id, m]) => m.placeGroups.map((g) => ({ ...g, market: id })))
  .sort((a, b) => a.rank - b.rank);

/** Lower case, accents stripped (Haridwār → haridwar), spaces collapsed. */
export const plain = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
const hasWord = (text: string, word: string) => ` ${text} `.includes(` ${word} `);

type PlaceMatch = {
  /** Only this region's groups (an old code reads as its current one). */
  region?: string;
  /** "exact": the whole text is one word (an IP city); "word": a word appears in it as whole words. */
  match: "exact" | "word";
  /** Leave out the state-name groups (`wholeState`): for narrowing a state to a market. */
  narrowOnly?: boolean;
};

const groupsNamedBy = (text: string | null | undefined, { region, match, narrowOnly }: PlaceMatch) => {
  const t = text ? plain(text) : "";
  if (!t) return [];
  const code = canonicalRegion(region);
  return PLACE_GROUPS.filter(
    (g) =>
      (code === undefined || g.region.includes(code)) &&
      !(narrowOnly && g.wholeState) &&
      (match === "exact" ? g.words.includes(t) : g.words.some((w) => hasWord(t, w))),
  );
};

/**
 * The place group a text names, first by rank. "exact": the whole text is
 * one word (an IP city); "word": a word appears in it as whole words (a
 * typed site city, "SIDCUL Haridwar"). With `region`, only that region's groups.
 */
export const placeGroupFor = (text: string | null | undefined, options: PlaceMatch) => groupsNamedBy(text, options)[0];

/** The market a place narrows a state to (an IP city, a typed site city); state names don't narrow. */
export const marketForPlace = (text: string | null | undefined, options: Omit<PlaceMatch, "narrowOnly">): MarketId | undefined =>
  placeGroupFor(text, { ...options, narrowOnly: true })?.market;

/**
 * The state a typed place is in, when it names one ("Roorkee" → UK, "Noida"
 * → UP, "Punjab" → PB). A word across states ("NCR") names none.
 */
export const stateForPlace = (text: string | null | undefined): RegionCode | undefined => {
  const g = placeGroupFor(text, { match: "word" });
  return g?.region.length === 1 ? g.region[0] : undefined;
};

/**
 * The market for a visitor's IP region and city: the city's market when it
 * is one inside that state, else the state's.
 */
export function geoMarket(region: string | null | undefined, city?: string | null): MarketId | undefined {
  if (!region) return undefined;
  return marketForPlace(city, { region, match: "exact" }) ?? marketForRegion(region);
}

/**
 * The market a business site is in: a place named in the city inside the
 * state, else the page the form was sent from when its market covers that
 * state, else the state's market. Null when no market covers the state.
 */
export function siteMarket(state: string | null | undefined, city: string | null | undefined, pageCluster?: string | null): string | null {
  if (!state) return pageCluster ?? null;
  const named = marketForPlace(city, { region: state, match: "word" });
  if (named) return named;
  if (pageCluster && marketCoversState(pageCluster, state)) return pageCluster;
  return marketForSiteState(state) ?? null;
}

/** A place id from a crew link (#location=), as stored in PLACES_BY_ID. */
export const placeById = (id: string): Place | undefined => (PLACES_BY_ID as Record<string, Place>)[id];
export const isPlaceId = (id: string): id is PlaceId => Object.hasOwn(PLACES_BY_ID, id);

/* ---------- Ad tags ---------- */

/**
 * The markets UTM tags and campaign names name: the markets' words (the
 * same vocabulary as places), as whole words. Tags are read like typed text
 * (`plain()`): `_`, `-` and digits are spaces, so "jobs_electronic_city" and
 * "greater-noida" match their multi-word places. Per tag, markets come in
 * the order of their first matching group (rank).
 */
export function marketsInAdTags(values: readonly (string | null | undefined)[]): MarketId[] {
  const found = new Set<MarketId>();
  for (const v of values) for (const g of groupsNamedBy(v, { match: "word" })) found.add(g.market);
  return [...found];
}

/* ---------- Languages and sides ---------- */

/** The picker's language order for a market; none for a cluster that is not a market (Saharanpur, "other"). */
export const languageSetFor = (cluster: string | null | undefined): LanguageSetName | undefined =>
  isMarketId(cluster) ? RECORDS[cluster].languageSet : undefined;

/** The header language switch for a market's pages; undefined for a cluster that is not a market. */
export const quickSwitchFor = (cluster: string | null | undefined) => (isMarketId(cluster) ? MARKETS[cluster].quickSwitch : undefined);

/** The market whose page stands in for this one on a side where it has none. */
export function standInFor(id: string, side: Side): MarketId | undefined {
  if (!isMarketId(id)) return undefined;
  return RECORDS[id].standIn?.[side];
}

/** Whether a market has pages on a side (published or not: the registry decides that). */
export const hasSide = (id: string, side: Side) => isMarketId(id) && RECORDS[id].sides.includes(side);

/* ---------- Jobs form areas ---------- */

/** A market's own form answers, or undefined when it has no form of its own. */
export const formAreas = (cluster: string | null | undefined): readonly AreaId[] | undefined =>
  isMarketId(cluster) ? FORM_AREAS[cluster] : undefined;
/** The form with no market: which market the person lives in. */
export const marketAreaAnswers = (): readonly AreaId[] => MARKET_AREA_ANSWERS;
export { areaFilesUnder };

/** The set an area answer came from (analytics): "market", a market's id, or "none". */
export const areaSet = (id: string | undefined) => (!id ? "none" : areaSetOf(id));

/** Whether an id is a stored area answer. */
export const isAreaId = (id: string): id is AreaId => Object.hasOwn(AREA_CLUSTERS, id);

/* ---------- Analytics ---------- */

/** Event-safe market id (delhi-ncr → delhi_ncr). */
export const eventKey = (id: string) => id.replace(/[^a-z0-9]+/g, "_");
