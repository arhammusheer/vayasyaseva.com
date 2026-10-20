/**
 * The jobs form's "Where do you live?" answers, by market. The ids and the
 * market each files under are stored values in src/lib/talent-intake/rules.ts
 * (AREA_CLUSTERS, append-only; n8n and Windmill inline that file, so the
 * dependency runs from here to rules, never back). This file only orders them.
 *
 * Layer 1: no imports but the rules and ./data.
 */
import { AREA_CLUSTERS, FORMLESS_AREAS, type IntakeCluster } from "@/lib/talent-intake/rules";
import { MARKET_IDS, type MarketId } from "./data";

export type AreaId = keyof typeof AREA_CLUSTERS;
/** The answers a form may offer: every stored id but the ones taken off the forms (FORMLESS_AREAS). */
const AREA_IDS = (Object.keys(AREA_CLUSTERS) as AreaId[]).filter((id) => !FORMLESS_AREAS.has(id));

/**
 * The set an id without a "<set>:" prefix belongs to: Haridwar's, the first
 * market with a form (stored before prefixes were used).
 */
export const UNPREFIXED_AREA_SET = "haridwar";

/** The set an area id belongs to: its prefix, else UNPREFIXED_AREA_SET. */
export const areaSetOf = (id: string) => (id.includes(":") ? id.split(":")[0] : UNPREFIXED_AREA_SET);

/** The market an area answer files under; null for an "outside" answer (the page's market or "other" decides). */
export const areaFilesUnder = (id: string): IntakeCluster | null =>
  Object.hasOwn(AREA_CLUSTERS, id) ? AREA_CLUSTERS[id as AreaId] : null;

/**
 * A set's answers in form order: its own places in id order, then the
 * answers that file under no market ("outside") last.
 */
const formOrder = (ids: readonly AreaId[]) => [...ids.filter((id) => areaFilesUnder(id) !== null), ...ids.filter((id) => areaFilesUnder(id) === null)];

/** Each market's own form answers, for the markets that have them (a jobs hub's form). */
export const FORM_AREAS: Readonly<Partial<Record<MarketId, readonly AreaId[]>>> = Object.fromEntries(
  MARKET_IDS.map((m) => [m, formOrder(AREA_IDS.filter((id) => areaSetOf(id) === m))] as const).filter(([, ids]) => ids.length),
);

/**
 * The form with no market of its own: which market the person lives in, in
 * MARKET_IDS order (alphabetical), "Somewhere else" last.
 */
export const MARKET_AREA_ANSWERS: readonly AreaId[] = [
  ...MARKET_IDS.flatMap((m) => AREA_IDS.filter((id) => areaSetOf(id) === "market" && areaFilesUnder(id) === m)),
  ...AREA_IDS.filter((id) => areaSetOf(id) === "market" && areaFilesUnder(id) === null),
];
