"use client";
/**
 * The one way the browser sends measurement. Layer 3: call sites name an
 * event and its properties; the gateway routes it.
 *
 * Route table (as before 1C):
 *   - Umami: every event, every visitor (cookie-free, our own servers);
 *   - GA4: the same event when ga4 is allowed ("Allow All"), unless the
 *     call is Umami-only (the area-intent board's outcome events);
 *   - Meta: the three outcome events in routes.ts META_EVENTS, when
 *     meta-pixel is allowed (dormant);
 *   - FORM_DONE: an event that completes a tracked form tells
 *     AnalyticsTracker, which sends form_complete.
 * In development and test each call is checked against the event catalogue
 * (observe mode: logs or throws, never changes the call). The check loads
 * the catalogue with a dynamic import behind a NODE_ENV test, so production
 * bundles carry neither the check nor the catalogue.
 */
import type { AdClick } from "@/lib/talent-intake/contract";
import { safeAnalyticsPath } from "@/lib/analytics-pages";
import type { Sink } from "./catalogue";
import type { AdsConversion } from "./config";
import { CONSENT_VERSION } from "./version";
import { claimOf, type MeasurementClaim } from "./policy";
import { FORM_DONE, FORM_DONE_EVENT, META_EVENTS } from "./routes";
import { allowed, readConsent } from "./store";
import type { AnalyticsParams } from "./types";
import { ga4Event } from "./vendors/ga4";
import { adsConversionEvent } from "./vendors/google-ads";
import { metaTrack } from "./vendors/meta";
import { umamiIdentify, umamiPageView, umamiTrack } from "./vendors/umami";

export { FORM_DONE_EVENT } from "./routes";
export { flushUmami } from "./vendors/umami";
export type { AnalyticsParams } from "./types";

/** Development and test: check a call against the catalogue (catalogue/index.ts observe). */
function check(name: string, props: AnalyticsParams | undefined, sinks: Sink[]) {
  if (process.env.NODE_ENV !== "production") {
    import("./catalogue").then(({ observe }) => observe(name, props, sinks)).catch((error: unknown) => {
      if (process.env.NODE_ENV === "test") throw error;
    });
  }
}

export type TrackOptions = {
  /** Umami only: no GA4, no Meta (the area-intent board's outcome events). */
  umamiOnly?: boolean;
};

/** Where the gateway will send a call, for the development check. */
function sinksOf(name: string, opts?: TrackOptions): Sink[] {
  if (opts?.umamiOnly) return ["umami"];
  return ["umami", "ga4", ...(META_EVENTS[name] ? (["meta"] as const) : [])];
}

/** One interaction event: Umami for every visitor; GA4 (and Meta, when mapped) with "Allow All". */
export function track(name: string, props?: AnalyticsParams, opts?: TrackOptions) {
  check(name, props, sinksOf(name, opts));
  try {
    umamiTrack(name, props);
    if (opts?.umamiOnly) return;
    if (FORM_DONE[name]) window.dispatchEvent(new CustomEvent(FORM_DONE_EVENT, { detail: FORM_DONE[name] }));
    if (!allowed("ga4")) return;
    ga4Event(name, props);
    // Meta's standard events for the outcomes only, no parameters.
    if (META_EVENTS[name] && allowed("meta-pixel")) metaTrack(META_EVENTS[name]);
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
}

/** A page view in Umami with a sanitised URL (see AnalyticsTracker). */
export function trackPage(url: string) {
  try {
    umamiPageView(url);
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
}

/** Session properties in Umami (no identifier): language, consent state, campaign tags. */
export function setSession(data: AnalyticsParams) {
  try {
    umamiIdentify(data);
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
}

/**
 * One Google Ads conversion through the browser's Google tag, only with
 * "Allow All" (secondary in Google Ads: the server's click import is the
 * primary job conversion, server.ts).
 */
export function trackConversion(conversion: AdsConversion) {
  try {
    check("conversion", { send_to: conversion }, ["google-ads"]);
    if (!allowed("ads-measurement")) return;
    adsConversionEvent(conversion);
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
}

/**
 * What an unfinished form held, with "Allow All" only. Umami alone (our own
 * servers), never Google, as the separate event `form_abandon_draft` so a
 * nightly job can delete its data after 30 days (vayasya-infra apps/umami).
 * Used only to see why forms are left; it never reaches the enquiry or
 * applicant records. The catalogue's one personal event (its exception).
 */
export function trackDraft(props: AnalyticsParams) {
  try {
    if (!allowed("form-drafts")) return;
    check("form_abandon_draft", props, ["umami"]);
    umamiTrack("form_abandon_draft", props);
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
}

/** The page a form event happened on, as a known path (e.g. /hi-latn-in/jobs/packing). */
export function formPage() {
  try {
    return safeAnalyticsPath(window.location.pathname);
  } catch {
    return "/other";
  }
}

/* ---------- The ad-click report (ads-click-report: unless refused) ---------- */

/**
 * The Google Ads click a visit came from (gclid, or gbraid/wbraid from iOS),
 * read from the landing URL and kept in this browser tab (sessionStorage)
 * until a job application is sent with it. The server then reports the
 * conversion to Google Ads (server.ts). Not kept, and not sent, after
 * "Required Only" under any consent version.
 */
const AD_CLICK_KEY = "vayasya-ad-click";
const AD_CLICK_TYPES = ["gclid", "gbraid", "wbraid"] as const;
const AD_CLICK_ID = /^[\w-]{10,300}$/;

/** On every page load: keep the click id if the URL carries one. */
export function rememberAdClick() {
  try {
    if (!allowed("ads-click-report")) {
      sessionStorage.removeItem(AD_CLICK_KEY);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    for (const type of AD_CLICK_TYPES) {
      const id = params.get(type);
      if (id && AD_CLICK_ID.test(id)) {
        sessionStorage.setItem(AD_CLICK_KEY, JSON.stringify({ type, id } satisfies AdClick));
        return;
      }
    }
  } catch {
    // Storage off: the conversion just isn't reported.
  }
}

/** The click to send with an application, if any. */
export function currentAdClick(): AdClick | null {
  try {
    if (!allowed("ads-click-report")) return null;
    const saved = JSON.parse(sessionStorage.getItem(AD_CLICK_KEY) ?? "null") as AdClick | null;
    return saved && AD_CLICK_TYPES.includes(saved.type) && AD_CLICK_ID.test(saved.id) ? saved : null;
  } catch {
    return null;
  }
}

/** What this browser's choice is, sent with a job application so the server decides the ad-click report. */
export function measurementClaim(): MeasurementClaim {
  return claimOf(readConsent(), CONSENT_VERSION);
}
