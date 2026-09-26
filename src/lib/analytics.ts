"use client";

import { sendGAEvent } from "@next/third-parties/google";

export const analyticsConsentKey = "vayasya-site-measurement-v1";
export const analyticsConsentAtKey = "vayasya-site-measurement-v1-at";
const consentMaxAge = 180 * 24 * 60 * 60 * 1000;

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

export function trackAnalyticsEvent(
  name: string,
  parameters?: Record<string, string>,
) {
  try {
    if (!hasAnalyticsConsent() || !window.dataLayer) {
      return;
    }
    sendGAEvent("event", name, parameters ?? {});
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
}
