"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics as VercelAnalytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { analyticsConsentAtKey, analyticsConsentKey, hasAnalyticsConsent, trackAnalyticsEvent } from "@/lib/analytics";
import { safeAnalyticsPath } from "@/lib/analytics-pages";
import { gaId } from "@/lib/analytics-config";
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

  useEffect(() => {
    if (consent !== "accepted") return;

    function trackContactClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      const source_path = safeAnalyticsPath(window.location.pathname);

      if (href.startsWith("tel:")) {
        trackAnalyticsEvent("contact_click", { contact_method: "phone", source_path });
      } else if (href.startsWith("mailto:")) {
        trackAnalyticsEvent("contact_click", { contact_method: "email", source_path });
      } else {
        const destination = new URL(link.href);
        if (destination.origin === window.location.origin && destination.pathname === "/contact") {
          trackAnalyticsEvent("contact_intent", {
            source_path,
            intent_type: destination.searchParams.get("type") === "assessment" ? "assessment" : "general",
          });
        }
      }
    }

    document.addEventListener("click", trackContactClick);
    return () => document.removeEventListener("click", trackContactClick);
  }, [consent]);

  function choose(next: Exclude<Consent, null>) {
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
      {consent === "accepted" && <VercelAnalytics beforeSend={sanitizeBasicEvent} />}
      {consent === "accepted" && <GoogleAnalytics gaId={gaId} />}
      {consent !== "loading" && (consent === null || showPreferences) && (
        <section
          aria-label="Privacy choices"
          className="fixed bottom-3 right-3 z-[100] max-h-[calc(100dvh-1.5rem)] w-[min(320px,calc(100vw-1.5rem))] overflow-y-auto rounded-md border border-white/10 border-l-[3px] border-l-gold-500/70 bg-neutral-950/55 p-3 text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-200 hover:border-l-gold-500 hover:bg-neutral-950/95 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)] focus-within:border-l-gold-500 focus-within:bg-neutral-950/95 sm:right-5"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm leading-snug">Allow site analytics?</p>
            <button
              type="button"
              aria-expanded={showDetails}
              aria-controls={detailsId}
              onClick={() => setShowDetails((open) => !open)}
              className="inline-flex shrink-0 items-center gap-0.5 text-xs text-white/70 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
            >
              {showDetails ? "Show less" : "Learn more"}
              <ChevronDownIcon aria-hidden="true" className={`size-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>
          </div>
          <div id={detailsId} hidden={!showDetails} className="mt-2 text-xs leading-relaxed text-white/80">
            We measure page views, referrals, approximate location, device details and contact actions using analytics identifiers. No form entries or advertising. See our{" "}
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
      className="transition-colors hover:text-gold-500"
      onClick={() => window.dispatchEvent(new Event(preferencesEvent))}
    >
      Privacy choices
    </button>
  );
}
