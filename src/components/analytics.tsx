"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import Link from "@/components/i18n/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics as VercelAnalytics, type BeforeSendEvent } from "@vercel/analytics/next";
import {
  analyticsConsentAtKey,
  analyticsConsentKey,
  flushUmami,
  hasAnalyticsConsent,
  setSessionData,
  trackAnalyticsEvent,
} from "@/lib/analytics";
import { splitLocalePath } from "@/lib/i18n";
import { safeAnalyticsPath } from "@/lib/analytics-pages";
import { AnalyticsTracker, pageLocale, pageType } from "@/components/analytics-tracker";
import { clarityId, gaId, umamiWebsiteId } from "@/lib/analytics-config";
import { Button } from "@/components/ui/button";

type Consent = "accepted" | "rejected" | null;
const preferencesEvent = "vayasya:analytics-preferences";
const consentEvent = "vayasya:analytics-consent";

function getConsent(): Consent {
  try {
    const saved = localStorage.getItem(analyticsConsentKey);
    if (saved === "rejected") return "rejected";
    return hasAnalyticsConsent() ? "accepted" : null;
  } catch {
    return null;
  }
}

function subscribeToConsent(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(consentEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(consentEvent, callback);
  };
}

function sanitizeBasicEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return { ...event, url: `${url.origin}${safeAnalyticsPath(url.pathname)}` };
  } catch {
    return null;
  }
}

export function Analytics({ gaId }: { gaId: string }) {
  const consent = useSyncExternalStore(subscribeToConsent, getConsent, () => "loading");
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const detailsId = useId();

  useEffect(() => {
    const openPreferences = () => setShowPreferences(true);
    window.addEventListener(preferencesEvent, openPreferences);
    return () => window.removeEventListener(preferencesEvent, openPreferences);
  }, []);

  const pathname = usePathname();
  const locale = pageLocale(pathname);
  const consentState = consent === "loading" ? null : (consent ?? "none");

  // Session properties in Umami, and tags on Clarity recordings so they can be
  // filtered by language, page type and consent.
  useEffect(() => {
    if (!consentState) return;
    setSessionData({ locale, consent: consentState });
    if (consentState !== "accepted") return;
    try {
      const w = window as Window & { clarity?: ((...args: unknown[]) => void) & { q?: unknown[] } };
      // Same stub as Clarity's snippet: calls queue until the tag loads.
      if (typeof w.clarity !== "function") {
        const stub = Object.assign((...args: unknown[]) => void (stub.q ??= []).push(args), { q: undefined as unknown[] | undefined });
        w.clarity = stub;
      }
      w.clarity("set", "locale", locale);
      w.clarity("set", "page_type", pageType(splitLocalePath(pathname).path));
    } catch {
      // Analytics must never interrupt the visitor's task.
    }
  }, [consentState, locale, pathname]);

  // How many visitors see the prompt, for the choice rate.
  useEffect(() => {
    if (consent === null) trackAnalyticsEvent("consent_prompt", { page: safeAnalyticsPath(pathname) });
    // Once per page load, not per navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consent]);

  function choose(next: Exclude<Consent, null>) {
    const from = consent === "accepted" ? "allow_all" : consent === "rejected" ? "required_only" : "none";
    trackAnalyticsEvent("consent_choice", { choice: next, from });
    // One event per choice too: Umami funnel steps match event names, not properties.
    trackAnalyticsEvent(next === "accepted" ? "consent_allow_all" : "consent_required_only", { from });
    try {
      localStorage.setItem(analyticsConsentKey, next);
      if (next === "accepted") {
        localStorage.setItem(analyticsConsentAtKey, String(Date.now()));
      } else {
        localStorage.removeItem(analyticsConsentAtKey);
      }
    } catch {
      return;
    }
    if (consent === "accepted" && next === "rejected") {
      window.location.reload();
      return;
    }
    window.dispatchEvent(new Event(consentEvent));
    setShowPreferences(false);
    setShowDetails(false);
  }

  return (
    <>
      {/* Cookie-free counts (Vercel) and events (Umami) run for every visitor; "Allow All" adds GA4, Clarity, Umami recordings and the Google Ads conversion. */}
      <VercelAnalytics beforeSend={sanitizeBasicEvent} />
      {umamiWebsiteId && (
        <Script
          src="/_t/s.js"
          data-host-url="/_t"
          data-website-id={umamiWebsiteId}
          // AnalyticsTracker sends page views itself, with a sanitised URL.
          data-auto-track="false"
          strategy="afterInteractive"
          onReady={flushUmami}
        />
      )}
      <AnalyticsTracker />
      {consent === "accepted" && umamiWebsiteId && (
        // Umami replays and heatmaps. Sampling, strict masking and the blocked
        // forms are set per website in the Umami dashboard, not here.
        <Script
          src="/_t/recorder.js"
          data-host-url="/_t"
          data-website-id={umamiWebsiteId}
          strategy="afterInteractive"
        />
      )}
      {consent === "accepted" && <GoogleAnalytics gaId={gaId} />}
      {consent === "accepted" && clarityId && (
        // Not id="clarity": an element id becomes a window property, so window.clarity
        // would be this <script> and Clarity's stub would never install.
        <Script id="ms-clarity-tag" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`}
        </Script>
      )}
      {consent !== "loading" && (consent === null || showPreferences) && (
        <section
          aria-label="Privacy choices"
          className="fixed bottom-3 right-3 z-[100] max-h-[calc(100dvh-1.5rem)] w-[min(320px,calc(100vw-1.5rem))] overflow-y-auto rounded-md border border-white/10 border-l-[3px] border-l-gold-500/70 bg-neutral-950/55 p-3 text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-200 hover:border-l-gold-500 hover:bg-neutral-950/95 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)] focus-within:border-l-gold-500 focus-within:bg-neutral-950/95 sm:right-5"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm leading-snug">Allow additional analytics?</p>
            <button
              type="button"
              aria-expanded={showDetails}
              aria-controls={detailsId}
              onClick={() => setShowDetails((open) => !open)}
              className="inline-flex min-h-6 shrink-0 items-center gap-0.5 text-xs text-white/70 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
            >
              {showDetails ? "Show less" : "Learn more"}
              <ChevronDownIcon aria-hidden="true" className={`size-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>
          </div>
          <div id={detailsId} hidden={!showDetails} className="mt-2 text-xs leading-relaxed text-white/80">
            Cookie-free page counts and usage events (which links and form steps are used, never what you type) always run. Allowing adds Google Analytics (referrals, approximate location, device details, site actions) and recordings of clicks, scrolls and cursor movement (Microsoft Clarity, and Umami on our own servers), with page text and form fields hidden, and Google Ads counting when a visit from one of our ads ends in a job application. If you leave a form unfinished, what you typed is kept on our own servers for 30 days, only to fix the forms; voice notes and files are never kept. No ad targeting or remarketing. See our{" "}
            <Link href="/privacy" className="text-white underline underline-offset-2 hover:text-gold-400">privacy policy</Link>.
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-end gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => choose("rejected")} className="text-white/75 hover:bg-white/10 hover:text-white">
              Required Only
            </Button>
            <Button type="button" size="sm" onClick={() => choose("accepted")}>
              Allow All
            </Button>
          </div>
        </section>
      )}
    </>
  );
}

export function AnalyticsPreferencesButton() {
  if (!gaId) return null;
  return (
    <button
      type="button"
      className="inline-flex min-h-6 items-center transition-colors hover:text-gold-500"
      onClick={() => window.dispatchEvent(new Event(preferencesEvent))}
    >
      Privacy choices
    </button>
  );
}
