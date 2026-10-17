"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pageLocale } from "@/components/analytics-tracker";
import { ConsentBanner } from "@/components/measurement/consent-banner";
import { ConsentTags } from "@/components/measurement/consent-tags";
import { safeAnalyticsPath } from "@/lib/analytics-pages";
import { setSession, track } from "@/lib/measurement/gateway";
import { useConsent } from "@/lib/measurement/react";

export { AnalyticsPreferencesButton } from "@/components/measurement/preferences-button";

/**
 * Campaign tags (utm_*) from the landing URL, as Umami session properties, so
 * every later event in the visit (form steps, abandonment, submissions) can be
 * filtered by the ad campaign or keyword that brought the visitor. Kept on the
 * Umami server with the session; nothing is stored in the browser.
 */
function campaignTags() {
  const tags: Record<string, string> = {};
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "cluster"]) {
      const value = params.get(key);
      if (value) tags[key] = value.slice(0, 100);
    }
  } catch {
    // Analytics must never interrupt the visitor's task.
  }
  return tags;
}

/**
 * Consent and measurement for a page (src/lib/measurement): the tags, each
 * gated by its purpose, and the banner. Mounted by the layouts only when a
 * GA4 id is set.
 */
export function Analytics({ gaId }: { gaId: string }) {
  const consent = useConsent();
  const pathname = usePathname();
  const locale = pageLocale(pathname);
  const consentState = consent === "loading" ? null : (consent ?? "none");

  // Session properties in Umami, so any report can be filtered by language,
  // consent and the ad campaign that brought the visit.
  useEffect(() => {
    if (!consentState) return;
    setSession({ locale, consent: consentState, ...campaignTags() });
  }, [consentState, locale]);

  // How many visitors see the prompt, for the choice rate. Once per visit:
  // not again when a page of this site loads another (language switch,
  // picker), judged from the referrer so nothing is stored in the browser.
  useEffect(() => {
    let internal = false;
    try {
      internal = document.referrer !== "" && new URL(document.referrer).origin === window.location.origin;
    } catch {
      internal = false;
    }
    if (consent === null && !internal) track("consent_prompt", { page: safeAnalyticsPath(pathname) });
    // Once per page load, not per navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consent]);

  return (
    <>
      <ConsentTags gaId={gaId} />
      <ConsentBanner consent={consent} locale={locale} />
    </>
  );
}
