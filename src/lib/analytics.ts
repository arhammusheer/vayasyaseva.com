"use client";

import { sendGAEvent } from "@next/third-parties/google";

export const analyticsConsentKey = "vayasya-analytics-consent";

export function trackAnalyticsEvent(
  name: string,
  parameters?: Record<string, string>,
) {
  try {
    if (
      localStorage.getItem(analyticsConsentKey) !== "accepted" ||
      !window.dataLayer
    ) {
      return;
    }
    sendGAEvent("event", name, parameters ?? {});
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
}
