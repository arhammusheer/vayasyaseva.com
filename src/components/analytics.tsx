"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import { analyticsConsentKey, trackAnalyticsEvent } from "@/lib/analytics";
import { gaId } from "@/lib/analytics-config";
import { Button } from "@/components/ui/button";

type Consent = "accepted" | "rejected" | null;
const preferencesEvent = "vayasya:analytics-preferences";
const consentEvent = "vayasya:analytics-consent";

function getConsent(): Consent {
  try {
    const saved = localStorage.getItem(analyticsConsentKey);
    return saved === "accepted" || saved === "rejected" ? saved : null;
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

export function Analytics({ gaId }: { gaId: string }) {
  const consent = useSyncExternalStore(subscribeToConsent, getConsent, () => "loading");
  const [showPreferences, setShowPreferences] = useState(false);

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
      const source_path = window.location.pathname;

      if (href.startsWith("tel:")) {
        trackAnalyticsEvent("contact_click", { contact_method: "phone", source_path });
      } else if (href.startsWith("mailto:")) {
        trackAnalyticsEvent("contact_click", { contact_method: "email", source_path });
      } else {
        const destination = new URL(link.href);
        if (destination.origin === window.location.origin && destination.pathname === "/contact") {
          trackAnalyticsEvent("contact_intent", { source_path });
        }
      }
    }

    document.addEventListener("click", trackContactClick);
    return () => document.removeEventListener("click", trackContactClick);
  }, [consent]);

  function choose(next: Exclude<Consent, null>) {
    try {
      localStorage.setItem(analyticsConsentKey, next);
    } catch {
      return;
    }
    if (consent === "accepted" && next === "rejected") {
      window.location.reload();
      return;
    }
    window.dispatchEvent(new Event(consentEvent));
    setShowPreferences(false);
  }

  return (
    <>
      {consent === "accepted" && <GoogleAnalytics gaId={gaId} />}
      {consent !== "loading" && (consent === null || showPreferences) && (
        <section
          aria-label="Analytics preferences"
          className="fixed bottom-3 right-3 z-[100] w-[min(360px,calc(100vw-1.5rem))] rounded-md border border-white/10 border-l-[3px] border-l-gold-500/70 bg-neutral-950/55 p-3 text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-200 hover:border-l-gold-500 hover:bg-neutral-950/95 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)] focus-within:border-l-gold-500 focus-within:bg-neutral-950/95 sm:right-5"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm leading-snug">
              May we use analytics to improve this site?
            </p>
            <Link href="/privacy" className="text-xs text-white/70 underline underline-offset-2 hover:text-white">Privacy</Link>
          </div>
          <div className="mt-2 flex items-center justify-end gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => choose("rejected")} className="text-white/75 hover:bg-white/10 hover:text-white">
              No thanks
            </Button>
            <Button type="button" size="sm" onClick={() => choose("accepted")}>
              Allow
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
      Analytics settings
    </button>
  );
}
