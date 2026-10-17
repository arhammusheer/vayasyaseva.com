"use client";
/**
 * Google Analytics 4 through @next/third-parties: the GA4 tag component and
 * events. With google-ads.ts, the only files that touch dataLayer.
 */
import { sendGAEvent } from "@next/third-parties/google";
import type { AnalyticsParams } from "../types";

export { GoogleAnalytics } from "@next/third-parties/google";

/** One GA4 event, once the Google tag has loaded (dataLayer exists only then). */
export function ga4Event(name: string, parameters?: AnalyticsParams) {
  if (window.dataLayer) sendGAEvent("event", name, parameters ?? {});
}
