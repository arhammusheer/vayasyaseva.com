"use client";

import { safeAnalyticsPath } from "@/lib/analytics-pages";
import { gaId } from "@/lib/measurement/config";
import { track } from "@/lib/measurement/gateway";
import { openPreferences } from "@/lib/measurement/store";

/** The footer's "Privacy choices": opens the consent banner again. */
export function AnalyticsPreferencesButton() {
  if (!gaId) return null;
  return (
    <button
      type="button"
      className="inline-flex min-h-6 items-center transition-colors hover:text-gold-500"
      onClick={() => {
        track("privacy_choices_open", { page: safeAnalyticsPath(window.location.pathname) });
        openPreferences();
      }}
    >
      Privacy choices
    </button>
  );
}
