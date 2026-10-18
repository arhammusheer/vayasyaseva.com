/**
 * The vs_geo cookie (docs/visitor-context.md, "Before paint"): the visitor's
 * country and, for Indian visitors, state and market, from the request's
 * geo headers (src/lib/language-rank.ts visitorRegion, visitorCity). The
 * proxy sets it for this browser session so the boot script can decide
 * before paint without asking /api/context. No city name is stored: only
 * the market a city narrows the state to. Owner decision, 18 Oct 2026.
 */
import { visitorCity, visitorRegion } from "@/lib/language-rank";
import { canonicalRegion, geoMarket, marketForPlace } from "@/markets/index";
import type { GeoCookie } from "./collect";

export function requestGeo(headers: Headers): GeoCookie | undefined {
  const { country, region } = visitorRegion(headers);
  if (!country) return undefined;
  if (country !== "IN") return { country };
  const state = canonicalRegion(region);
  const city = visitorCity(headers);
  const market = geoMarket(state, city);
  return { country, state, market, level: market && marketForPlace(city, { region: state, match: "exact" }) ? "city" : "state" };
}

/** "IN.UK.haridwar.c": country, state, market, c (city) or s (state). */
export const geoCookieValue = (geo: GeoCookie) =>
  [geo.country ?? "", geo.state ?? "", geo.market ?? "", geo.level === "city" ? "c" : "s"].join(".");
