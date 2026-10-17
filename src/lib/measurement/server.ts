/**
 * Measurement from the server: the only entry points for route handlers.
 * Layer 3 (server): wraps src/lib/server-events.ts (Umami server counts)
 * and src/lib/google-ads-conversions.ts (the Data Manager click import),
 * which nothing else may import (eslint.config.mjs).
 */
import { uploadJobApplicationConversion } from "@/lib/google-ads-conversions";
import { trackServerEvent } from "@/lib/server-events";
import type { AdClick } from "@/lib/talent-intake/contract";
import { measurementEnv } from "./config";
import { blockedState, dataManagerConsent, decide, stateOfClaim, type MeasurementClaim } from "./policy";

/**
 * One server count in Umami (application_received, enquiry_received):
 * every accepted submission, whatever the visitor chose (server-counts:
 * always; production only). Fixed labels only.
 */
export function reportServerCount(name: string, url: string, data: Record<string, string | number>) {
  if (!decide("server-counts", blockedState(Date.now()), measurementEnv)) return;
  trackServerEvent(name, url, data);
}

/**
 * The ad click to report for an accepted job application, or null. The
 * browser leaves the click out after "Required Only" (any consent version)
 * and sends its choice as `measurement`; with a claim the server decides
 * ads-click-report from it, the same rule as the browser. Without one (a
 * page built before the claim existed), today's rule: report whenever the
 * click is present.
 */
export function adClickToReport(request: { adClick?: AdClick | null; measurement?: MeasurementClaim | null }): AdClick | null {
  const { adClick, measurement } = request;
  if (!adClick) return null;
  if (measurement && !decide("ads-click-report", stateOfClaim(measurement, Date.now()), measurementEnv)) return null;
  return adClick;
}

/** After the response: tell Google Ads which click led to application `ref` (Data Manager; measurement only). */
export function reportAdClickConversion(click: AdClick, ref: string) {
  uploadJobApplicationConversion(click, ref, dataManagerConsent());
}
