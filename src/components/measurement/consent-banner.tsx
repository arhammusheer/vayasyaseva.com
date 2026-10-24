"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import Link from "@/components/i18n/link";
import { Button } from "@/components/ui/button";
import { bannerCopy } from "@/lib/measurement/copy";
import { PREFERENCES_EVENT, setChoice } from "@/lib/measurement/store";
import type { ConsentSnapshot } from "@/lib/measurement/store";

type Shown = ConsentSnapshot["banner"];

/**
 * The consent banner: two sentences, a link to the §3 table and two
 * answers (copy.ts). Open while there is no valid answer, or after the
 * footer's "Privacy choices" (openPreferences). On jobs pages on a phone it
 * is a slim bar across the foot (globals.css, .consent-banner): layout only,
 * the same copy and choices.
 */
export function ConsentBanner({ consent, locale }: { consent: Shown; locale: string }) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const detailsId = useId();
  const bannerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const openPreferences = () => setShowPreferences(true);
    window.addEventListener(PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(PREFERENCES_EVENT, openPreferences);
  }, []);

  const t = bannerCopy(locale);
  const bannerOpen = consent !== "loading" && (consent === null || showPreferences);

  // While the banner is open, reserve its height at the foot of the page so
  // the last form controls can scroll clear of it (globals.css, .consent-open).
  useEffect(() => {
    const root = document.documentElement;
    const banner = bannerRef.current;
    if (!bannerOpen || !banner) {
      root.classList.remove("consent-open");
      return;
    }
    const measure = () => root.style.setProperty("--consent-banner-h", `${Math.ceil(banner.getBoundingClientRect().height)}px`);
    measure();
    root.classList.add("consent-open");
    const observer = new ResizeObserver(measure);
    observer.observe(banner);
    return () => {
      observer.disconnect();
      root.classList.remove("consent-open");
    };
  }, [bannerOpen]);

  function choose(next: "accepted" | "rejected") {
    if (consent === "loading") return;
    if (setChoice(next, consent) !== "saved") return;
    setShowPreferences(false);
    setShowDetails(false);
  }

  if (!bannerOpen) return null;
  return (
    <section
      ref={bannerRef}
      lang={locale}
      aria-label={t.label}
      className="consent-banner fixed bottom-3 right-3 z-[100] max-h-[calc(100dvh-1.5rem)] w-[min(340px,calc(100vw-1.5rem))] overflow-y-auto rounded-md border border-white/10 border-l-[3px] border-l-gold-500/70 bg-neutral-950/95 p-3 text-white shadow-[0_12px_32px_rgba(0,0,0,0.22)] sm:right-5"
    >
      <div className="consent-head flex items-center justify-between gap-2">
        <p className="text-sm leading-snug">{t.question}</p>
        <button
          type="button"
          aria-expanded={showDetails}
          aria-controls={detailsId}
          onClick={() => setShowDetails((open) => !open)}
          className="consent-more inline-flex min-h-12 shrink-0 items-center gap-0.5 px-1 text-xs text-white/75 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 sm:min-h-10"
        >
          {showDetails ? t.less : t.more}
          <ChevronDownIcon aria-hidden="true" className={`size-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div id={detailsId} hidden={!showDetails} className="consent-details mt-1 text-xs leading-relaxed text-white/80">
        {t.details}{" "}
        <Link href="/privacy#analytics" className="text-white underline underline-offset-2 hover:text-gold-400">{t.privacy}</Link>{t.end}
      </div>
      <div className="consent-actions mt-2 grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" onClick={() => choose("rejected")} className="min-h-12 whitespace-normal px-3 text-white/80 hover:bg-white/10 hover:text-white sm:h-10 sm:min-h-10">
          {t.reject}
        </Button>
        <Button type="button" onClick={() => choose("accepted")} className="min-h-12 whitespace-normal px-3 sm:h-10 sm:min-h-10">
          {t.accept}
        </Button>
      </div>
    </section>
  );
}
