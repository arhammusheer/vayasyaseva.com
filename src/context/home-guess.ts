/**
 * Where a visitor seems to live, for the jobs form's "Where do you live?"
 * guesses (src/markets/home.ts): the places nearest the request's IP
 * position, and its state. Read per request by /api/context/near and
 * answered to that visitor only; never stored, logged or put in a cookie
 * (the vs_geo cookie keeps no city: owner decision, 18 Oct 2026).
 *
 * Indian mobile IPs often place someone in the wrong city, so this is only
 * ever a guess the form offers, never an answer.
 */
import { visitorCity, visitorRegion } from "@/lib/language-rank";
import { canonicalRegion } from "@/markets/index";
import { isStateId, nearestPlaces, placeNamed, type HomeId } from "@/markets/india";

export type HomeGuess = {
  /** The IP's state, as a home id ("wb"). */
  state?: HomeId;
  /** Places nearest the IP position, nearest first (at most 3). */
  near?: HomeId[];
  /** The IP's city named the first of `near`. */
  confident?: true;
};

const coordinate = (value: string | null, max: number) => {
  const n = value === null || value.trim() === "" ? NaN : Number(value);
  return Number.isFinite(n) && Math.abs(n) <= max ? n : undefined;
};

/** Vercel's x-vercel-ip-latitude/-longitude, or Cloudflare's cf-iplatitude/-longitude. */
export function homeGuess(headers: Headers): HomeGuess {
  const { country, region } = visitorRegion(headers);
  if (country !== "IN") return {};
  const code = canonicalRegion(region)?.toLowerCase();
  const state = code && isStateId(code) ? code : undefined;
  const lat = coordinate(headers.get("x-vercel-ip-latitude") ?? headers.get("cf-iplatitude"), 90);
  const lon = coordinate(headers.get("x-vercel-ip-longitude") ?? headers.get("cf-iplongitude"), 180);
  const named = placeNamed(visitorCity(headers));
  let near = lat !== undefined && lon !== undefined ? nearestPlaces(lat, lon).map((p) => p.id) : [];
  // The IP's own city leads when it is one of the near ones (or there is no position).
  if (named && (!near.length || near.includes(named))) near = [named, ...near.filter((id) => id !== named)];
  return {
    ...(state && { state }),
    ...(near.length && { near }),
    ...(named && near[0] === named && { confident: true as const }),
  };
}
