"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { adsConversions, googleAdsId } from "@/lib/analytics-config";
import { safeAnalyticsPath } from "@/lib/analytics-pages";

export const analyticsConsentKey = "vayasya-site-measurement-v4";
export const analyticsConsentAtKey = "vayasya-site-measurement-v4-at";
// v2 (Sept 2026): Clarity session replay added, so v1 choices no longer cover it.
// v3 (Oct 2026): Google Ads conversion measurement added; everyone is asked again.
// v4 (Oct 2026): unfinished form contents logged in Umami; everyone is asked again.
const consentMaxAge = 180 * 24 * 60 * 60 * 1000;

/** Fixed labels only: never form contents, names, numbers or free text. */
export type AnalyticsParams = Record<string, string | number>;

type UmamiPayload = Record<string, unknown>;
type Umami = {
  track: {
    (name: string, data?: AnalyticsParams): void;
    (props: (base: UmamiPayload) => UmamiPayload): void;
  };
  identify?: (data: AnalyticsParams) => void;
};

declare global {
  interface Window {
    umami?: Umami;
    fbq?: (...args: unknown[]) => void;
  }
}

export function hasAnalyticsConsent() {
  try {
    const acceptedAt = Number(localStorage.getItem(analyticsConsentAtKey));
    return localStorage.getItem(analyticsConsentKey) === "accepted" &&
      Number.isFinite(acceptedAt) &&
      acceptedAt > 0 &&
      acceptedAt <= Date.now() &&
      Date.now() - acceptedAt < consentMaxAge;
  } catch {
    return false;
  }
}

// Calls made before the Umami script loads wait here; capped in case it never
// loads (blocked, or no website ID outside production).
const pending: ((umami: Umami) => void)[] = [];

function withUmami(call: (umami: Umami) => void) {
  if (window.umami) call(window.umami);
  else if (pending.length < 100) pending.push(call);
}

/** Run the calls queued before the Umami script loaded. */
export function flushUmami() {
  const umami = window.umami;
  if (!umami) return;
  for (const call of pending.splice(0)) {
    try {
      call(umami);
    } catch {
      // Analytics must never interrupt the visitor's task.
    }
  }
}

/** Site events that map to Meta's standard events (Meta Pixel, Allow All only). */
const META_EVENTS: Record<string, string> = {
  job_form_submit: "SubmitApplication",
  generate_lead: "Lead",
  contact_click: "Contact",
};

/** Events that complete a tracked form, so it doesn't count as abandoned. */
const FORM_DONE: Record<string, string> = { generate_lead: "contact", job_form_submit: "jobs", quick_apply_submit: "quick" };
export const FORM_DONE_EVENT = "vayasya:form-done";

/**
 * One interaction event. Umami (self-hosted, cookie-free) records it for every
 * visitor. With "Allow All", Google Analytics gets it too.
 */
export function trackAnalyticsEvent(name: string, parameters?: AnalyticsParams) {
  try {
    withUmami((umami) => umami.track(name, parameters));
    if (FORM_DONE[name]) window.dispatchEvent(new CustomEvent(FORM_DONE_EVENT, { detail: FORM_DONE[name] }));
    if (!hasAnalyticsConsent()) return;
    if (window.dataLayer) sendGAEvent("event", name, parameters ?? {});
    // Meta's standard events for the outcomes only, no parameters.
    if (typeof window.fbq === "function" && META_EVENTS[name]) window.fbq("track", META_EVENTS[name]);
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
}

/** A page view in Umami with a sanitised URL (see AnalyticsTracker). */
export function trackPageView(url: string) {
  try {
    withUmami((umami) => umami.track((base) => ({ ...base, url })));
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
}

/** Session properties in Umami (no identifier): language, consent state. */
export function setSessionData(data: AnalyticsParams) {
  try {
    withUmami((umami) => umami.identify?.(data));
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
}

/**
 * One Google Ads conversion, only with "Allow All". The Ads destination is
 * configured when the Google tag loads (components/analytics.tsx), with ad
 * personalisation and enhanced conversions off.
 */
export function trackAdsConversion(conversion: keyof typeof adsConversions) {
  try {
    if (!googleAdsId || !hasAnalyticsConsent() || !window.dataLayer) return;
    sendGAEvent("event", "conversion", { send_to: `${googleAdsId}/${adsConversions[conversion]}` });
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
}

/**
 * What an unfinished form held, with "Allow All" only. Umami alone (our own
 * servers), never Google, as the separate event
 * `form_abandon_draft` so a nightly job can delete its data after 30 days
 * (vayasya-infra apps/umami). Used only to see why forms are left; it never
 * reaches the enquiry or applicant records.
 */
export function trackAbandonedDraft(parameters: AnalyticsParams) {
  try {
    if (!hasAnalyticsConsent()) return;
    withUmami((umami) => umami.track("form_abandon_draft", parameters));
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
