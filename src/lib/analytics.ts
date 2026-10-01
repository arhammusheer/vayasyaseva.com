"use client";

import { sendGAEvent } from "@next/third-parties/google";

export const analyticsConsentKey = "vayasya-site-measurement-v2";
export const analyticsConsentAtKey = "vayasya-site-measurement-v2-at";
// v2 (Sept 2026): Clarity session replay added, so v1 choices no longer cover it.
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
    clarity?: (...args: unknown[]) => void;
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

/** Events that complete a tracked form, so it doesn't count as abandoned. */
const FORM_DONE: Record<string, string> = { generate_lead: "contact", job_form_submit: "jobs" };
export const FORM_DONE_EVENT = "vayasya:form-done";

/**
 * One interaction event. Umami (self-hosted, cookie-free) records it for every
 * visitor. With "Allow All", Google Analytics and Clarity get it too.
 */
export function trackAnalyticsEvent(name: string, parameters?: AnalyticsParams) {
  try {
    withUmami((umami) => umami.track(name, parameters));
    if (FORM_DONE[name]) window.dispatchEvent(new CustomEvent(FORM_DONE_EVENT, { detail: FORM_DONE[name] }));
    if (!hasAnalyticsConsent()) return;
    if (window.dataLayer) sendGAEvent("event", name, parameters ?? {});
    if (typeof window.clarity === "function") window.clarity("event", name);
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
