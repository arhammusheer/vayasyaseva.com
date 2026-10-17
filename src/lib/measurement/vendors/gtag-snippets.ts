/**
 * The Google tag's inline scripts, as strings (pure, so node tests can pin
 * them). consent-tags.tsx renders them with next/script.
 */
import type { ConsentModeSignal } from "../purposes";

/**
 * Google Consent Mode (basic): the tag loads only after "Allow All" and
 * says so, so Google Ads can model the conversions it can't see. Google
 * signals and ad personalisation signals stay off for every hit.
 */
export function consentDefaultSnippet(defaults: Record<ConsentModeSignal, "granted" | "denied">) {
  const signals = Object.entries(defaults).map(([signal, value]) => `${signal}:'${value}'`).join(",");
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{${signals}});gtag('set',{allow_google_signals:false,allow_ad_personalization_signals:false});`;
}

/**
 * One Google tag for GA4 and Ads: the Ads destination is configured on
 * load, so the ad click id is kept across pages (conversion linker). No
 * remarketing, and no enhanced conversions: the tag must not read form
 * fields, whatever the account setting.
 */
export function adsConfigSnippet(googleAdsId: string) {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('config','${googleAdsId}',{allow_ad_personalization_signals:false,allow_enhanced_conversions:false});`;
}
