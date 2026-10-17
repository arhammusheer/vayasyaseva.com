"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
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
import { safeAnalyticsPath } from "@/lib/analytics-pages";
import { AnalyticsTracker, pageLocale } from "@/components/analytics-tracker";
import { gaId, googleAdsId, metaPixelId, umamiWebsiteId } from "@/lib/analytics-config";
import { MetaPixel } from "@/components/meta-pixel";
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

function sanitizeBasicEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return { ...event, url: `${url.origin}${safeAnalyticsPath(url.pathname)}` };
  } catch {
    return null;
  }
}

/**
 * The banner speaks the page's language. Hindi and Hinglish strings are drafts
 * for native review, like every hi-IN and hi-Latn-IN string. Two sentences
 * and a link: the detail is the table in the privacy notice (§3, #analytics),
 * which is English only, and the link says so. The sentences keep what
 * consent v7 rests on (cookie-free counts, the ad-click report, recordings
 * with typed text, 30-day unsent forms, no remarketing); dropping any of
 * them needs owner or legal sign-off and a consent version bump.
 */
const BANNER = {
  "en-IN": {
    label: "Privacy choices",
    question: "Allow additional analytics?",
    more: "Learn more",
    less: "Show less",
    reject: "Required Only",
    accept: "Allow All",
    details:
      "Cookie-free page counts run on every visit, and if you apply for a job after clicking one of our ads, Google Ads learns which click it was unless you choose Required Only. Allow All adds Google Analytics, ad measurement (no remarketing) and recordings of your visit, including what you type in forms; a form you leave unsent is kept 30 days, only to fix the forms.",
    privacy: "How each one works",
    end: ".",
  },
  "hi-IN": {
    label: "गोपनीयता के विकल्प",
    question: "ज़्यादा एनालिटिक्स चालू करें?",
    more: "और जानें",
    less: "कम दिखाएँ",
    reject: "सिर्फ़ ज़रूरी",
    accept: "सब की अनुमति दें",
    details:
      "हर विज़िट पर बिना कुकी वाली पेज गिनती चलती है, और अगर आप हमारे विज्ञापन से आकर आवेदन करते हैं, तो Google Ads को बस यह पता चलता है कि कौन सा क्लिक था (“सिर्फ़ ज़रूरी” चुनने पर यह भी नहीं)। “सब की अनुमति दें” चुनने पर Google Analytics, विज्ञापन की गिनती (रीमार्केटिंग नहीं) और आपकी विज़िट की रिकॉर्डिंग भी चलती है, जिसमें फ़ॉर्म में लिखी बातें भी आती हैं; अधूरा छोड़ा फ़ॉर्म 30 दिन रखा जाता है, सिर्फ़ फ़ॉर्म ठीक करने के लिए।",
    privacy: "हर एक का ब्योरा (अंग्रेज़ी में)",
    end: "।",
  },
  "hi-Latn-IN": {
    label: "Privacy ke vikalp",
    question: "Extra analytics chalu karein?",
    more: "Aur jaanein",
    less: "Kam dikhayein",
    reject: "Sirf zaroori",
    accept: "Sab allow karein",
    details:
      "Har visit par bina cookie wali page ginti chalti hai, aur agar aap hamare ad se aakar apply karte hain, to Google Ads ko bas yeh pata chalta hai ki kaun sa click tha (“Sirf zaroori” chunne par yeh bhi nahi). “Sab allow karein” chunne par Google Analytics, ad ki ginti (remarketing nahi) aur aapki visit ki recording bhi chalti hai, jismein form mein likhi baatein bhi aati hain; adhoora chhoda form 30 din rakha jaata hai, sirf form theek karne ke liye.",
    privacy: "Poori jaankari (English mein)",
    end: ".",
  },
  // Same points as the Hindi text, sentence for sentence (drafts for native review).
  "kn-IN": {
    label: "ಗೌಪ್ಯತೆಯ ಆಯ್ಕೆಗಳು",
    question: "ಹೆಚ್ಚುವರಿ ಅನಾಲಿಟಿಕ್ಸ್ ಆನ್ ಮಾಡಬೇಕೇ?",
    more: "ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ",
    less: "ಕಡಿಮೆ ತೋರಿಸಿ",
    reject: "ಅಗತ್ಯವಿರುವುದು ಮಾತ್ರ",
    accept: "ಎಲ್ಲವನ್ನೂ ಅನುಮತಿಸಿ",
    details:
      "ಪ್ರತಿ ಭೇಟಿಯಲ್ಲಿ ಕುಕೀ ಇಲ್ಲದ ಪುಟ ಎಣಿಕೆ ನಡೆಯುತ್ತದೆ, ಮತ್ತು ನೀವು ನಮ್ಮ ಜಾಹೀರಾತಿನಿಂದ ಬಂದು ಅರ್ಜಿ ಸಲ್ಲಿಸಿದರೆ, ಅದು ಯಾವ ಕ್ಲಿಕ್ ಎಂದು ಮಾತ್ರ Google Ads ಗೆ ತಿಳಿಯುತ್ತದೆ (“ಅಗತ್ಯವಿರುವುದು ಮಾತ್ರ” ಆರಿಸಿದರೆ ಅದೂ ಇಲ್ಲ). “ಎಲ್ಲವನ್ನೂ ಅನುಮತಿಸಿ” ಆರಿಸಿದರೆ Google Analytics, ಜಾಹೀರಾತಿನ ಎಣಿಕೆ (ರೀಮಾರ್ಕೆಟಿಂಗ್ ಅಲ್ಲ) ಮತ್ತು ನಿಮ್ಮ ಭೇಟಿಯ ರೆಕಾರ್ಡಿಂಗ್ ಕೂಡ ನಡೆಯುತ್ತದೆ, ಫಾರ್ಮ್‌ನಲ್ಲಿ ನೀವು ಬರೆದದ್ದೂ ಸೇರಿ; ಕಳುಹಿಸದೆ ಬಿಟ್ಟ ಫಾರ್ಮ್ ಅನ್ನು 30 ದಿನ ಇಡಲಾಗುತ್ತದೆ, ಫಾರ್ಮ್‌ಗಳನ್ನು ಸರಿಪಡಿಸಲು ಮಾತ್ರ.",
    privacy: "ಪ್ರತಿಯೊಂದರ ವಿವರ (ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ)",
    end: ".",
  },
  "pa-IN": {
    label: "ਨਿੱਜਤਾ ਦੇ ਵਿਕਲਪ",
    question: "ਹੋਰ ਐਨਾਲਿਟਿਕਸ ਚਾਲੂ ਕਰੀਏ?",
    more: "ਹੋਰ ਜਾਣੋ",
    less: "ਘੱਟ ਵਿਖਾਓ",
    reject: "ਸਿਰਫ਼ ਜ਼ਰੂਰੀ",
    accept: "ਸਭ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ",
    details:
      "ਹਰ ਵਿਜ਼ਿਟ 'ਤੇ ਬਿਨਾਂ ਕੁਕੀ ਵਾਲੀ ਪੇਜ ਗਿਣਤੀ ਚੱਲਦੀ ਹੈ, ਅਤੇ ਜੇ ਤੁਸੀਂ ਸਾਡੇ ਇਸ਼ਤਿਹਾਰ ਤੋਂ ਆ ਕੇ ਅਪਲਾਈ ਕਰਦੇ ਹੋ, ਤਾਂ Google Ads ਨੂੰ ਬੱਸ ਇਹ ਪਤਾ ਲੱਗਦਾ ਹੈ ਕਿ ਕਿਹੜਾ ਕਲਿੱਕ ਸੀ (“ਸਿਰਫ਼ ਜ਼ਰੂਰੀ” ਚੁਣਨ 'ਤੇ ਇਹ ਵੀ ਨਹੀਂ)। “ਸਭ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ” ਚੁਣਨ 'ਤੇ Google Analytics, ਇਸ਼ਤਿਹਾਰ ਦੀ ਗਿਣਤੀ (ਰੀਮਾਰਕੀਟਿੰਗ ਨਹੀਂ) ਅਤੇ ਤੁਹਾਡੀ ਵਿਜ਼ਿਟ ਦੀ ਰਿਕਾਰਡਿੰਗ ਵੀ ਚੱਲਦੀ ਹੈ, ਜਿਸ ਵਿੱਚ ਫ਼ਾਰਮ ਵਿੱਚ ਲਿਖੀਆਂ ਗੱਲਾਂ ਵੀ ਆਉਂਦੀਆਂ ਹਨ; ਅਧੂਰਾ ਛੱਡਿਆ ਫ਼ਾਰਮ 30 ਦਿਨ ਰੱਖਿਆ ਜਾਂਦਾ ਹੈ, ਸਿਰਫ਼ ਫ਼ਾਰਮ ਠੀਕ ਕਰਨ ਲਈ।",
    privacy: "ਹਰ ਇੱਕ ਦਾ ਵੇਰਵਾ (ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ)",
    end: "।",
  },
} as const;

export function Analytics({ gaId }: { gaId: string }) {
  const consent = useSyncExternalStore(subscribeToConsent, getConsent, () => "loading");
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const detailsId = useId();
  const bannerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const openPreferences = () => setShowPreferences(true);
    window.addEventListener(preferencesEvent, openPreferences);
    return () => window.removeEventListener(preferencesEvent, openPreferences);
  }, []);

  const pathname = usePathname();
  const locale = pageLocale(pathname);
  const t = BANNER[locale as keyof typeof BANNER] ?? BANNER["en-IN"];
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
  const consentState = consent === "loading" ? null : (consent ?? "none");

  // Session properties in Umami, so any report can be filtered by language,
  // consent and the ad campaign that brought the visit.
  useEffect(() => {
    if (!consentState) return;
    setSessionData({ locale, consent: consentState, ...campaignTags() });
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
    if (consent === null && !internal) trackAnalyticsEvent("consent_prompt", { page: safeAnalyticsPath(pathname) });
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
      {/* Cookie-free counts (Vercel) and events (Umami) run for every visitor; "Allow All" adds GA4, Umami recordings and the Google Ads conversion. */}
      <VercelAnalytics beforeSend={sanitizeBasicEvent} />
      {umamiWebsiteId && (
        <Script
          src="/_t/s.js"
          data-host-url="/_t"
          data-website-id={umamiWebsiteId}
          // AnalyticsTracker sends page views itself, with a sanitised URL, so
          // Umami's own page views stay off. Its tracker starts only to measure
          // page speed (Performance report); query strings and the hash, which
          // can hold a prefilled name or phone, never go into its URLs.
          data-auto-pageview="false"
          data-performance="true"
          data-exclude-search="true"
          data-exclude-hash="true"
          strategy="afterInteractive"
          onReady={flushUmami}
        />
      )}
      <AnalyticsTracker />
      {consent === "accepted" && umamiWebsiteId && (
        // Umami replays and heatmaps, unmasked: forms and typed values are
        // recorded (mask level "moderate", nothing blocked, in the Umami
        // dashboard; /_t/recorder.js is patched to honour it, api/umami-recorder).
        <Script
          src="/_t/recorder.js"
          data-host-url="/_t"
          data-website-id={umamiWebsiteId}
          strategy="afterInteractive"
        />
      )}
      {consent === "accepted" && (
        // Google Consent Mode (basic): Google's tags only load after "Allow All",
        // and say so, so Google Ads can model the conversions it can't see.
        // Ad personalisation stays denied: measurement only, no remarketing.
        <Script id="google-consent" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'denied'});gtag('set',{allow_google_signals:false,allow_ad_personalization_signals:false});`}
        </Script>
      )}
      {consent === "accepted" && <GoogleAnalytics gaId={gaId} />}
      {consent === "accepted" && googleAdsId && (
        // One Google tag for GA4 and Ads: the Ads destination is configured on
        // load, so the ad click id is kept across pages (conversion linker).
        // No remarketing, and no enhanced conversions: the tag must not read
        // form fields, whatever the account setting.
        <Script id="google-ads-config" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('config','${googleAdsId}',{allow_ad_personalization_signals:false,allow_enhanced_conversions:false});`}
        </Script>
      )}
      {consent === "accepted" && metaPixelId && <MetaPixel pixelId={metaPixelId} />}
      {bannerOpen && (
        <section
          ref={bannerRef}
          lang={locale}
          aria-label={t.label}
          className="consent-banner fixed bottom-3 right-3 z-[100] max-h-[calc(100dvh-1.5rem)] w-[min(340px,calc(100vw-1.5rem))] overflow-y-auto rounded-md border border-white/10 border-l-[3px] border-l-gold-500/70 bg-neutral-950/95 p-3 text-white shadow-[0_12px_32px_rgba(0,0,0,0.22)] sm:right-5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm leading-snug">{t.question}</p>
            <button
              type="button"
              aria-expanded={showDetails}
              aria-controls={detailsId}
              onClick={() => setShowDetails((open) => !open)}
              className="inline-flex min-h-12 shrink-0 items-center gap-0.5 px-1 text-xs text-white/75 underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500 sm:min-h-10"
            >
              {showDetails ? t.less : t.more}
              <ChevronDownIcon aria-hidden="true" className={`size-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>
          </div>
          <div id={detailsId} hidden={!showDetails} className="mt-1 text-xs leading-relaxed text-white/80">
            {t.details}{" "}
            <Link href="/privacy#analytics" className="text-white underline underline-offset-2 hover:text-gold-400">{t.privacy}</Link>{t.end}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button type="button" variant="ghost" onClick={() => choose("rejected")} className="min-h-12 whitespace-normal px-3 text-white/80 hover:bg-white/10 hover:text-white sm:h-10 sm:min-h-10">
              {t.reject}
            </Button>
            <Button type="button" onClick={() => choose("accepted")} className="min-h-12 whitespace-normal px-3 sm:h-10 sm:min-h-10">
              {t.accept}
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
      onClick={() => {
        trackAnalyticsEvent("privacy_choices_open", { page: safeAnalyticsPath(window.location.pathname) });
        window.dispatchEvent(new Event(preferencesEvent));
      }}
    >
      Privacy choices
    </button>
  );
}
