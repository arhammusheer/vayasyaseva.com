"use client";
/**
 * The area-intent board's events (Umami board "Area intent", docs/area-intent.md).
 *
 * Umami's board tiles (goals, funnels) count events by name and can't filter
 * on properties, so each outcome worth a tile is its own event, named for
 * what it means. The detailed events (area_intent, area_nav_click,
 * quick_step) keep every property for drill-down; these only make the board
 * readable. Umami only: no GA4 or Meta.
 *
 * - How the site decided, once per session per decision: intent_by_pick,
 *   intent_by_link (?cluster=), intent_by_ad (UTM), intent_by_page (landing,
 *   current page, pages viewed), intent_by_location (IP), intent_none.
 * - What it put first: market_shown_<market>, once per session per market.
 * - What the visitor picked: market_chosen_<market>, and whether it matched
 *   what was shown: intent_confirmed, intent_corrected, or intent_self_chosen
 *   when nothing had been decided.
 */
import { trackUmamiEvent } from "@/lib/analytics";
import { eventKey } from "@/markets/index";
import { MODEL_VERSION, type AreaDecision } from "./model";

const REPORTED_KEY = "vs-area-board-v1";

const BASIS_EVENT: Record<AreaDecision["basis"], string> = {
  chosen: "intent_by_pick",
  param: "intent_by_link",
  utm: "intent_by_ad",
  landing: "intent_by_page",
  page: "intent_by_page",
  views: "intent_by_page",
  geo: "intent_by_location",
  none: "intent_none",
};

/** Event-safe market id (delhi-ncr → delhi_ncr). */
const marketKey = eventKey;

/** Sends each key once per tab session; true if this call should send. */
function once(key: string) {
  try {
    const seen: string[] = JSON.parse(window.sessionStorage.getItem(REPORTED_KEY) ?? "[]");
    if (seen.includes(key)) return false;
    window.sessionStorage.setItem(REPORTED_KEY, JSON.stringify([...seen, key].slice(-100)));
  } catch {
    // Blocked storage: report anyway.
  }
  return true;
}

/** The markets a decision put first, on either side. */
export const shownMarkets = (d: Pick<AreaDecision, "business" | "jobs">) => [...new Set([...d.jobs, ...d.business])];

/** How the site decided, and what it put first. */
export function reportDecision(d: AreaDecision) {
  const shown = shownMarkets(d);
  if (once(`decision|${d.basis}|${shown.join("+")}`)) {
    trackUmamiEvent(BASIS_EVENT[d.basis], { markets: shown.join("+") || "none", mode: d.mode, v: MODEL_VERSION });
  }
  for (const id of shown) if (once(`shown|${id}`)) trackUmamiEvent(`market_shown_${marketKey(id)}`, { mode: d.mode, v: MODEL_VERSION });
}

/**
 * The visitor picked a market (a labelled market link, or the jobs form's
 * area answer when the form's market came from the decision or the form
 * asked). `decided` is what the site had put first at that moment.
 */
export function reportChoice(cluster: string, decided: readonly string[], surface: string) {
  const outcome = !decided.length ? "intent_self_chosen" : decided.includes(cluster) ? "intent_confirmed" : "intent_corrected";
  const params = { market: cluster, decided: decided.join("+") || "none", surface, v: MODEL_VERSION };
  trackUmamiEvent(`market_chosen_${marketKey(cluster)}`, params);
  trackUmamiEvent(outcome, params);
}
