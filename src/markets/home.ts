/**
 * "Where do you live?" on every jobs form (28 Oct 2026): the page's own
 * answers (intent) ranked together with guesses from where the visitor seems
 * to be, so someone in Kolkata on the Haridwar page sees Kolkata, not only
 * Haridwar's areas. A guess is only ever an option to tap: nothing is
 * answered for the person, and nothing says "we detected". Two facts are
 * kept apart: the page (where they want to work) and `home` (where they
 * live); `area` is the answer the application files under.
 *
 * Layer 2: pure functions over ./india.ts and the area answers.
 */
import { AREA_CLUSTERS, type HomeState } from "@/lib/talent-intake/rules";
import { areaFilesUnder, type AreaId } from "./areas";
import { isStateWide } from "./index";
import { homeStateOf, isStateId, placeRow, type HomeId } from "./india";

/** A place offered on the area step, as a choice value ("place:wb:kolkata"). */
const PLACE = "place:";
export const placeChoice = (id: HomeId) => `${PLACE}${id}`;
export const placeOfChoice = (value: string): HomeId | undefined => (value.startsWith(PLACE) ? value.slice(PLACE.length) : undefined);

/** An answer that files under no market: "Outside Haridwar", "Somewhere else". */
export const isOutside = (id: string) => areaFilesUnder(id) === null;
/** An answer for the rest of a state or region ("Elsewhere in Punjab"), not a place. */
const isGeneral = (id: string) => isOutside(id) || /:(other|rest-of-[a-z-]+)$/.test(id);

/**
 * The answer a place files under on this form (`intent`: the form's area
 * answers, areaOptions): the form's own answer for it when it has one, else
 * its market's answer (market:<id>, which files there from any page), else
 * the form's "outside" answer, or "Somewhere else" on a form without one.
 */
export function areaForPlace(id: HomeId, intent: readonly string[]): AreaId {
  const state = homeStateOf(id);
  const rows = [placeRow(id), state && state !== id ? placeRow(state) : undefined].filter((r) => r !== undefined);
  for (const row of rows) for (const a of row.areas ?? []) if (intent.includes(a)) return a;
  for (const row of rows) if (row.market && Object.hasOwn(AREA_CLUSTERS, `market:${row.market}`)) return `market:${row.market}` as AreaId;
  return (intent.find(isOutside) ?? "market:other") as AreaId;
}

/** Phone languages that say which state someone is likely from (Hindi and English say nothing). */
const LANGUAGE_STATES: Readonly<Record<string, readonly HomeState[]>> = {
  bn: ["wb"], te: ["ts", "ap"], ta: ["tn"], mr: ["mh"], gu: ["gj"], or: ["od"], ml: ["kl"], as: ["as"], kn: ["ka"], pa: ["pb"],
};
export const languageStates = (languages: readonly string[]) => [
  ...new Set(languages.flatMap((tag) => LANGUAGE_STATES[tag.toLowerCase().split("-")[0]] ?? [])),
];

export type HomeSignals = {
  /** The form's area answers (areaOptions), "outside" included. */
  intent: readonly string[];
  /** Where those came from (quick-apply.ts AreaSource). */
  source: "page" | "link" | "decision" | "ask";
  /** The form's market (the page's, the link's or the decided one). */
  market: string | null;
  /** Markets the visitor context favours, in order (ask and decision forms). */
  first?: readonly string[];
  /** Places nearest the visitor's IP location, nearest first (/api/context/near). */
  near?: readonly HomeId[];
  /** The IP's city named the first of `near`. */
  confident?: boolean;
  /** The IP's state. */
  state?: HomeId;
  /** The browser's languages (navigator.languages). */
  languages?: readonly string[];
};

/** Why a choice is offered (analytics `pick`): the form's own, a market, or a guess. */
export type HomeWhy = "page" | "market" | "ip" | "state" | "language";
export type HomeChoice = { value: string; why: HomeWhy };

/**
 * The area step's choices, best first. Scores: the form's own places (50 down,
 * in its order), the rest of its state (30), other markets (20 down, the
 * context's first); the nearest IP place (60 when the IP's city named it,
 * else 52, so a visitor far from the page sees their own place first), a
 * second one when the city was not named (44), the IP state (38), a phone
 * language's state (15). A guess
 * the form already has an answer for raises that answer instead of adding a
 * second one. A page form keeps all its own answers and up to 3 guesses; the
 * others show 7. "Outside" answers are never listed: "Somewhere else" opens
 * the search, which can still file there.
 */
export function rankHomeChoices(s: HomeSignals): HomeChoice[] {
  const score = new Map<string, number>();
  const why = new Map<string, HomeWhy>();
  const offer = (value: string, points: number, reason: HomeWhy) => {
    if ((score.get(value) ?? -Infinity) >= points) return;
    score.set(value, points);
    why.set(value, reason);
  };
  const raise = (value: string, points: number) => score.set(value, (score.get(value) ?? 0) + points);
  const drop = (value: string) => {
    score.delete(value);
    why.delete(value);
  };

  const shown = s.intent.filter((id) => !isOutside(id));
  const own = shown.filter((id) => !id.startsWith("market:"));
  const markets = shown.filter((id) => id.startsWith("market:"));
  own.forEach((id, i) => offer(id, isGeneral(id) ? 30 - i / 100 : 50 - i, "page"));
  markets.forEach((id, j) => {
    const k = (s.first ?? []).indexOf(areaFilesUnder(id) ?? "");
    offer(id, 20 - j / 2 + (k < 0 ? 0 : 20 - 3 * k), "market");
  });

  const isOwnPlace = (area: string) => own.includes(area) && !isGeneral(area);
  let guesses = 0;
  (s.near ?? []).slice(0, 3).forEach((id, k) => {
    const row = placeRow(id);
    if (!row) return;
    const area = areaForPlace(id, s.intent);
    // The form already names it (SIDCUL on the Haridwar page): raise that answer, the nearest most.
    if (isOwnPlace(area)) return raise(area, k === 0 ? 35 : 3);
    // The form's market itself (Bengaluru on the Bengaluru page): its areas are listed.
    if (row.market && row.market === s.market && !row.areas?.length) return;
    // When the IP named its city, one city is the guess (no Peenya beside Bengaluru); else two.
    if (guesses >= (s.confident ? 1 : 2)) return;
    guesses++;
    offer(placeChoice(id), k === 0 ? (s.confident ? 60 : 52) : 44, "ip");
    // One answer per place: a city market's answer gives way to the city (Roorkee for "Haridwar / Roorkee").
    if (area.startsWith("market:") && !isStateWide(areaFilesUnder(area), homeStateOf(id)?.toUpperCase() ?? "")) drop(area);
  });

  const state = s.state && isStateId(s.state) ? s.state : undefined;
  if (state) {
    const area = areaForPlace(state, s.intent);
    if (shown.includes(area)) raise(area, 20);
    else offer(placeChoice(state), 38, "state");
  }
  for (const st of languageStates(s.languages ?? [])) {
    const area = areaForPlace(st, s.intent);
    if (shown.includes(area)) raise(area, 5);
    else offer(placeChoice(st), 15, "language");
  }

  // Ties keep the order offered (sort is stable).
  const ranked = [...score.keys()].sort((a, b) => score.get(b)! - score.get(a)!);
  const limit = s.source === "page" || s.source === "link" ? own.length + 3 : 7;
  return ranked.slice(0, limit).map((value) => ({ value, why: why.get(value)! }));
}
