/**
 * Suggestions for "City or industrial area" on Request a crew (owner
 * direction, 24 Nov 2026): three to five places, filtered by the state
 * picked and ranked by what the request and the visitor tell us.
 *
 * Signals, strongest first:
 * 1. what has been typed (name, then other spellings, then word starts);
 * 2. the market the request came from (a location page's Request a crew,
 *    a #location= link) and the visitor's own markets (src/context);
 * 3. places in a market we supply;
 * 4. how much contract labour a place employs (`scale`, a public-knowledge
 *    proxy, src/markets/site-places.json);
 * 5. the work picked (packing leans to pharma and FMCG estates, ITI trades
 *    to engineering) and the headcount (large crews lean to big estates,
 *    small ones to towns).
 *
 * Pure: no React, no storage. The form passes the signals in; tests run it
 * on fixtures. The list is data only (./site-places.json), loaded by the
 * form when the field is first used.
 */
/** Lower case, accents stripped, digits kept ("Sector 24" is not "Sector 25"). */
export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export type SiteKind = "estate" | "cluster" | "city";

export type SitePlace = {
  id: string;
  name: string;
  /** The contact form's state code (UK, PB, KA…). */
  state: string;
  kind: SiteKind;
  district?: string;
  /** Labour demand proxy: 3 a major hub, 2 established, 1 small. */
  scale: 1 | 2 | 3;
  sectors?: readonly string[];
  aka?: readonly string[];
  /** The market (src/markets/data.ts) it lies in, where we supply crews. */
  market?: string;
};

export type SuggestSignals = {
  query: string;
  /** The state picked; empty for none. */
  state?: string;
  /** The work picked (ROLE_OPTIONS keys). */
  roles?: readonly string[];
  /** HEADCOUNT_BAND_OPTIONS key. */
  headcountBand?: string;
  /** The market the request came from (a location page, a link): strongest. */
  originMarket?: string | null;
  /** The visitor's markets (visitor context), in their order. */
  visitorMarkets?: readonly string[];
  /** The visitor's state (IP), used only when no state is picked. */
  visitorState?: string;
};

/** The sectors each kind of work is most found in. */
const ROLE_SECTORS: Readonly<Record<string, readonly string[]>> = {
  packing: ["pharma", "fmcg", "food", "logistics"],
  "factory-helpers": ["engineering", "auto", "fmcg", "pharma", "textile", "garments", "plastics", "food", "mixed"],
  "machine-operators": ["engineering", "auto", "plastics", "electronics", "metal", "steel", "textile"],
  "loading-unloading": ["logistics", "fmcg", "steel", "cement", "food"],
  warehouse: ["logistics", "fmcg"],
  housekeeping: ["it-campus", "pharma", "food", "mixed"],
  "iti-trades": ["engineering", "auto", "steel", "metal", "electronics"],
};

const LARGE = new Set(["100-249", "250+"]);
const SMALL = new Set(["1-9", "10-19"]);

/** Up to five while typing; three to start with. */
export const SUGGEST_LIMIT = { typing: 5, idle: 3 } as const;

const words = (s: string) => s.split(" ").filter(Boolean);

/** One-letter slips in longer words ("pithampur" for "pitampur"). */
function near(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1 || a.length < 4) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** How well the typed text names a place: 0 for not at all. */
export function textScore(place: SitePlace, q: string): number {
  if (!q) return 0;
  const name = norm(place.name);
  const akas = (place.aka ?? []).map(norm);
  if (name === q || akas.includes(q)) return 120;
  if (name.startsWith(q)) return 100;
  if (akas.some((a) => a.startsWith(q))) return 90;
  if (words(name).some((w) => w.startsWith(q))) return 80;
  if (akas.some((a) => words(a).some((w) => w.startsWith(q)))) return 70;
  if (q.length >= 3 && name.includes(q)) return 50;
  if (q.length >= 3 && akas.some((a) => a.includes(q))) return 40;
  if (place.district && norm(place.district).startsWith(q)) return 35;
  const qWords = words(q);
  const last = qWords[qWords.length - 1];
  // Slips only from four letters: "sid" is not "sindhudurg".
  if (last && last.length >= 4 && [...words(name), ...akas.flatMap(words)].some((w) => near(w, last) || (w.length > last.length && near(w.slice(0, last.length + 1), last))))
    return 30;
  return 0;
}

/** The ranking score, given a text score (or none while idle). */
export function signalScore(place: SitePlace, s: SuggestSignals): number {
  let score = place.scale * 10;
  if (place.market) score += 10;
  if (s.originMarket && place.market === s.originMarket) score += 25;
  const vi = place.market ? (s.visitorMarkets ?? []).indexOf(place.market) : -1;
  if (vi === 0) score += 12;
  else if (vi > 0) score += 6;
  if (!s.state && s.visitorState && place.state === s.visitorState) score += 6;
  const wanted = new Set((s.roles ?? []).flatMap((r) => ROLE_SECTORS[r] ?? []));
  const fit = (place.sectors ?? []).filter((x) => wanted.has(x)).length;
  score += Math.min(fit, 2) * 6;
  if (s.headcountBand && LARGE.has(s.headcountBand)) score += place.kind === "city" ? 0 : 8;
  if (s.headcountBand && SMALL.has(s.headcountBand)) score += place.kind === "city" ? 5 : 0;
  if (wanted.has("it-campus") && place.kind === "city") score += 4;
  // Most crews work in an estate or belt: a small lift for those, unless the crew is small.
  if (!s.query.trim() && place.kind !== "city" && !(s.headcountBand && SMALL.has(s.headcountBand))) score += 4;
  return score;
}

/**
 * Three to five places for the field. With a state picked, only that
 * state's places. Nothing to show while idle with no state and no
 * market to go on.
 */
export function suggestSites(places: readonly SitePlace[], s: SuggestSignals): SitePlace[] {
  const q = norm(s.query ?? "");
  const pool = s.state ? places.filter((p) => p.state === s.state) : places;
  if (!q) {
    const hint = s.originMarket ?? s.visitorMarkets?.[0];
    if (!s.state && !hint) return [];
    const scoped = s.state ? pool : pool.filter((p) => p.market && (p.market === s.originMarket || (s.visitorMarkets ?? []).includes(p.market)));
    return rank(scoped.map((p) => [p, signalScore(p, s)] as const), SUGGEST_LIMIT.idle);
  }
  const scored: (readonly [SitePlace, number])[] = [];
  for (const p of pool) {
    const t = textScore(p, q);
    if (t > 0) scored.push([p, t * 2 + signalScore(p, s)]);
  }
  const list = rank(scored, SUGGEST_LIMIT.typing);
  // Nothing to offer when the one match is what they already typed.
  return list.length === 1 && norm(list[0].name) === q ? [] : list;
}

function rank(scored: readonly (readonly [SitePlace, number])[], limit: number) {
  const seen = new Set<string>();
  return [...scored]
    .sort((a, b) => b[1] - a[1] || b[0].scale - a[0].scale || a[0].name.localeCompare(b[0].name))
    .map(([p]) => p)
    .filter((p) => {
      const key = `${p.state}:${norm(p.name)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

/** The line under a suggestion: what it is and where. */
export function suggestionDetail(p: SitePlace, stateName: (code: string) => string, showState: boolean) {
  const what = p.kind === "estate" ? "Industrial area" : p.kind === "cluster" ? "Industrial belt" : "City";
  const where = [p.district && p.kind !== "city" && norm(p.district) !== norm(p.name) ? p.district : null, showState ? stateName(p.state) : null].filter(Boolean);
  return where.length ? `${what}, ${where.join(", ")}` : what;
}
