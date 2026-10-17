"use client";
/**
 * Vercel Web Analytics: cookie-free page counts for every visitor, with
 * query strings stripped and unknown paths grouped as /other.
 */
import type { BeforeSendEvent } from "@vercel/analytics/next";
import { safeAnalyticsPath } from "@/lib/analytics-pages";

export { Analytics as VercelAnalytics } from "@vercel/analytics/next";

export function sanitizeBasicEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return { ...event, url: `${url.origin}${safeAnalyticsPath(url.pathname)}` };
  } catch {
    return null;
  }
}
