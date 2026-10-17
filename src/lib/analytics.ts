"use client";
/**
 * Migration shim (roadmap 1C): the old names, re-exported from the
 * measurement gateway. Call sites move to "@/lib/measurement/gateway"; this
 * file is then deleted.
 */
import { track, type AnalyticsParams } from "@/lib/measurement/gateway";

export {
  track as trackAnalyticsEvent,
  trackPage as trackPageView,
  setSession as setSessionData,
  trackConversion as trackAdsConversion,
  trackDraft as trackAbandonedDraft,
  formPage,
  flushUmami,
  FORM_DONE_EVENT,
} from "@/lib/measurement/gateway";
export type { AnalyticsParams } from "@/lib/measurement/gateway";

/** An event for Umami only (the area-intent board's outcome events). */
export const trackUmamiEvent = (name: string, parameters?: AnalyticsParams) => track(name, parameters, { umamiOnly: true });
