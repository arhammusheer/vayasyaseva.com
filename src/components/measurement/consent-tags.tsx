"use client";

import Script from "next/script";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { MetaPixel } from "@/components/measurement/meta-pixel";
import { googleAdsId, metaPixelId, umamiWebsiteId } from "@/lib/measurement/config";
import { flushUmami } from "@/lib/measurement/gateway";
import { consentAllows, googleConsentDefault } from "@/lib/measurement/policy";
import { useAllowed } from "@/lib/measurement/react";
import { readConsent } from "@/lib/measurement/store";
import { GoogleAnalytics } from "@/lib/measurement/vendors/ga4";
import { adsConfigSnippet, consentDefaultSnippet } from "@/lib/measurement/vendors/gtag-snippets";
import { VercelAnalytics, sanitizeBasicEvent } from "@/lib/measurement/vendors/vercel";

/**
 * Every measurement tag, in this order (the order they load in), each gated
 * by its purpose (src/lib/measurement/purposes.ts): Vercel Analytics, the
 * Umami tracker, AnalyticsTracker, Umami recordings, the Consent Mode
 * default, GA4, the Google Ads config, the Meta Pixel. Opt-in tags are off
 * on the server and the first render (useAllowed).
 */
export function ConsentTags({ gaId }: { gaId: string }) {
  const replays = useAllowed("replays");
  const ga4 = useAllowed("ga4");
  const adsMeasurement = useAllowed("ads-measurement");
  const metaPixel = useAllowed("meta-pixel");
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
      {replays && umamiWebsiteId && (
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
      {(ga4 || adsMeasurement) && (
        // Google Consent Mode (basic): Google's tags only load after "Allow All",
        // and say so, so Google Ads can model the conversions it can't see.
        // Ad personalisation stays denied: measurement only, no remarketing.
        <Script id="google-consent" strategy="afterInteractive">
          {consentDefaultSnippet(googleConsentDefault((id) => consentAllows(id, readConsent())))}
        </Script>
      )}
      {ga4 && <GoogleAnalytics gaId={gaId} />}
      {adsMeasurement && googleAdsId && (
        <Script id="google-ads-config" strategy="afterInteractive">
          {adsConfigSnippet(googleAdsId)}
        </Script>
      )}
      {metaPixel && metaPixelId && <MetaPixel pixelId={metaPixelId} />}
    </>
  );
}
