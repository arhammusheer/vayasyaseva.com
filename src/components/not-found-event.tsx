"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { safeAnalyticsPath } from "@/lib/analytics-pages";

/**
 * A 404, with where the visitor came from so broken links can be fixed. The
 * requested path is sent only when it looks like a plain slug, so nothing
 * odd someone typed into the address bar is recorded.
 */
export function NotFoundEvent() {
  useEffect(() => {
    const path = window.location.pathname;
    let from = "direct";
    let source = "";
    try {
      const referrer = document.referrer ? new URL(document.referrer) : null;
      if (referrer?.origin === window.location.origin) {
        from = "internal";
        source = safeAnalyticsPath(referrer.pathname);
      } else if (referrer) {
        from = "external";
        source = referrer.hostname;
      }
    } catch {
      // Unparseable referrer: leave it as direct.
    }
    trackAnalyticsEvent("not_found", {
      path: /^[a-z0-9/._-]{1,80}$/i.test(path) ? path : "other",
      from,
      ...(source && { source }),
    });
  }, []);
  return null;
}
