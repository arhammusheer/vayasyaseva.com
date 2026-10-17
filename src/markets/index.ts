/**
 * Market queries (docs/area-intent.md). Layer 2: pure functions over the
 * market records in ./data.ts, the place ids in ./places.ts and the form
 * areas in ./areas.ts. The proxy and client bundles import this file, so it
 * carries no labels: those are in ./labels.ts and ./schema-org.ts, imported
 * on their own. Never import the registry, i18n, React or page content here.
 */
import { CLUSTER_IDS, type ClusterId } from "@/content/registry/identifiers";
import { AREA_CLUSTERS } from "@/lib/talent-intake/rules";
import { FORM_AREAS, MARKET_AREA_ANSWERS, areaFilesUnder, areaSetOf, type AreaId } from "./areas";
import { MARKETS, MARKET_IDS, NON_MARKET_CLUSTERS, type LanguageSetName, type MarketId, type MarketRecord, type PlaceGroup, type RegionCode, type Side } from "./data";
import { PLACES_BY_ID, type Place, type PlaceId } from "./places";

export { MARKETS, MARKET_IDS, NON_MARKET_CLUSTERS } from "./data";
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

/** A visitor's IP region to the market covering the state (UP has none: only its NCR cities do). */
export const REGION_MARKETS: Readonly<Record<RegionCode, MarketId>> = Object.fromEntries(
  entries.flatMap(([id, m]) => m.defaultFor.region.map((r) => [r, id])),
);
/** A site state picked on the crew form to the market covering it, when nothing narrower is known. */
export const SITE_STATE_MARKETS: Readonly<Record<RegionCode, MarketId>> = Object.fromEntries(
  entries.flatMap(([id, m]) => m.defaultFor.siteState.map((r) => [r, id])),
);
/** The states each market's sites are in. */
export const MARKET_STATES = Object.fromEntries(entries.map(([id, m]) => [id, m.states])) as Readonly<Record<MarketId, readonly RegionCode[]>>;

export const marketForRegion = (region: string | null | undefined): MarketId | undefined =>
  region && Object.hasOwn(REGION_MARKETS, region) ? REGION_MARKETS[region] : undefined;
export const marketForSiteState = (state: string | null | undefined): MarketId | undefined =>
  state && Object.hasOwn(SITE_STATE_MARKETS, state) ? SITE_STATE_MARKETS[state] : undefined;
/** The markets whose sites are in a state, in MARKET_IDS order. */
export const marketsForState = (state: string | null | undefined): MarketId[] => (state ? MARKET_IDS.filter((id) => RECORDS[id].states.includes(state)) : []);
/** Whether a market's sites are in a state (false for a cluster that is not a market). */
export const marketCoversState = (id: string | null | undefined, state: string) =>
  isMarketId(id) && RECORDS[id].states.includes(state);

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

/**
 * The place group a text names. "exact": the whole text is one place word
 * (an IP city); "word": a place word appears in it as whole words (a typed
 * site city, "SIDCUL Haridwar"). With `region`, only that region's groups.
 */
export function placeGroupFor(text: string | null | undefined, { region, match }: { region?: string; match: "exact" | "word" }) {
  const t = text ? plain(text) : "";
  if (!t) return undefined;
  return PLACE_GROUPS.find(
    (g) => (region === undefined || g.region.includes(region)) && (match === "exact" ? g.words.includes(t) : g.words.some((w) => hasWord(t, w))),
  );
}
export const marketForPlace = (text: string | null | undefined, options: { region?: string; match: "exact" | "word" }): MarketId | undefined =>
  placeGroupFor(text, options)?.market;

/** The state a typed place is in, when it names one ("Roorkee" → UK, "Noida" → UP). */
export const stateForPlace = (text: string | null | undefined): RegionCode | undefined => placeGroupFor(text, { match: "word" })?.region[0];

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

/** Each market's ad words as one whole-word pattern, in adRank order. */
const AD_PATTERNS: readonly [RegExp, MarketId][] = entries
  .slice()
  .sort((a, b) => a[1].adRank - b[1].adRank)
  .map(([id, m]) => [new RegExp(`(?<![a-z])(${m.adWords.join("|")})(?![a-z])`, "i"), id]);

/** The markets UTM tags and campaign names name, in adRank order. */
export function marketsInAdTags(values: readonly (string | null | undefined)[]): MarketId[] {
  const found = new Set<MarketId>();
  for (const v of values) for (const [re, id] of AD_PATTERNS) if (v && re.test(v)) found.add(id);
  return [...found];
}

/* ---------- Languages and sides ---------- */

/** The picker's language order for a cluster (a market's, or Saharanpur's Hindi). */
export function languageSetFor(cluster: string | null | undefined): LanguageSetName | undefined {
  if (isMarketId(cluster)) return RECORDS[cluster].languageSet;
  return cluster && Object.hasOwn(NON_MARKET_CLUSTERS, cluster) ? NON_MARKET_CLUSTERS[cluster as keyof typeof NON_MARKET_CLUSTERS].languageSet : undefined;
}

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
