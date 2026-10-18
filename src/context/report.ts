"use client";
/**
 * The visitor context's analytics events (docs/visitor-context.md,
 * "Measurement"). Umami for every visitor; `area_intent` and
 * `area_nav_click` also go to GA4 with Allow All, like every tracked event.
 *
 * - area_intent: once per session per distinct decision, with each
 *   family's points for the leader, so weights can be replayed
 *   (scripts/context-replay.mjs).
 * - The "Area intent" board (Umami tiles count events by name):
 *   intent_by_<basis> once per decision (pick, arrival, page, location, none),
 *   market_shown_<market> once per session per market, and for a pick
 *   market_chosen_<market> plus intent_confirmed / intent_corrected /
 *   intent_self_chosen.
 */
import { track } from "@/lib/measurement/gateway";
import { eventKey } from "@/markets/index";
import type { ContextSignals, Family, VisitorContext } from "./core";
import { REPORTED_KEY } from "./keys";
import { CONTEXT_VERSION } from "./weights";

const UMAMI_ONLY = { umamiOnly: true } as const;

const BASIS_EVENT: Record<Family, string> = {
  stated: "intent_by_pick",
  arrival: "intent_by_arrival",
  browsing: "intent_by_page",
  ambient: "intent_by_location",
  none: "intent_none",
};

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

/** The markets a context put first, on either side. */
export const shownMarkets = (ctx: Pick<VisitorContext, "sides">) => [...new Set([...ctx.sides.jobs, ...ctx.sides.business])];

/** "single", "both" or "default", as the board has always counted it. */
export const contextMode = (ctx: VisitorContext) => (ctx.region.markets.length > 1 ? "both" : ctx.region.markets.length ? "single" : "default");

/** How the site decided, and what it put first. */
export function reportContext(ctx: VisitorContext, signals: ContextSignals) {
  const shown = shownMarkets(ctx);
  const mode = contextMode(ctx);
  const key = [ctx.region.band, ctx.region.markets.join("+"), ctx.sides.business.join("+"), ctx.sides.jobs.join("+"), ctx.region.basis, ctx.audience.value, ctx.language.top.join("+")].join("|");
  if (once(`decision|${key}`)) {
    const p = ctx.region.parts;
    track("area_intent", {
      v: CONTEXT_VERSION,
      mode,
      band: ctx.region.band,
      aud: ctx.audience.value,
      aud_stated: ctx.audience.stated ? "yes" : "no",
      intent: ctx.region.markets[0] ?? "none",
      second: ctx.region.markets[1] ?? "none",
      geo: signals.geo?.market ?? "none",
      country: signals.geo?.country ?? "none",
      region: signals.geo?.state ?? "none",
      basis: ctx.region.basis,
      arrival: ctx.region.arrival ?? "none",
      business: ctx.sides.business.join("+"),
      jobs: ctx.sides.jobs.join("+"),
      nearby: ctx.region.nearby.join("+") || "none",
      confidence: ctx.region.share,
      pts_stated: p.stated ?? 0,
      pts_arrival: p.arrival ?? 0,
      pts_browsing: p.browsing ?? 0,
      pts_ambient: p.ambient ?? 0,
      lang: ctx.language.top.join("+"),
      lang_basis: ctx.language.basis,
      holdout: ctx.holdout ? "yes" : "no",
    });
    track(BASIS_EVENT[ctx.region.basis], { markets: shown.join("+") || "none", mode, band: ctx.region.band, holdout: ctx.holdout ? "yes" : "no", v: CONTEXT_VERSION }, UMAMI_ONLY);
  }
  for (const id of shown) if (once(`shown|${id}`)) track(`market_shown_${eventKey(id)}`, { mode, v: CONTEXT_VERSION }, UMAMI_ONLY);
}

/**
 * The visitor picked a market (a labelled market link, the "Jobs in" row,
 * or the jobs form's area answer when the form's options came from the
 * context or the form asked). `decided` is what the site had put first on
 * that surface at that moment.
 */
export function reportChoice(cluster: string, decided: readonly string[], surface: string, band = "unknown") {
  const outcome = !decided.length ? "intent_self_chosen" : decided.includes(cluster) ? "intent_confirmed" : "intent_corrected";
  const params = { market: cluster, decided: decided.join("+") || "none", surface, band, v: CONTEXT_VERSION };
  track(`market_chosen_${eventKey(cluster)}`, params, UMAMI_ONLY);
  track(outcome, params, UMAMI_ONLY);
}
