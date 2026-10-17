"use client";
/**
 * The Google tag's Ads destination in the browser ("Allow All" only; the
 * primary job conversion is the server's click import, server.ts). The Ads
 * destination is configured when the Google tag loads (consent-tags.tsx,
 * adsConfigSnippet), with ad personalisation and enhanced conversions off.
 */
import { sendGAEvent } from "@next/third-parties/google";
import { adsConversions, googleAdsId, type AdsConversion } from "../config";

/** One Google Ads conversion through the loaded Google tag. */
export function adsConversionEvent(conversion: AdsConversion) {
  if (!googleAdsId || !window.dataLayer) return;
  sendGAEvent("event", "conversion", { send_to: `${googleAdsId}/${adsConversions[conversion]}` });
}
