export const gaId =
  process.env.NEXT_PUBLIC_GA_ID ||
  (process.env.NODE_ENV === "production" ? "G-80VCZT0V6G" : undefined);

export const clarityId =
  process.env.NEXT_PUBLIC_CLARITY_ID ||
  (process.env.NODE_ENV === "production" ? "yogh8zv088" : undefined);

// Google Ads conversion measurement, after "Allow All" only, with ad
// personalisation off (no remarketing). Loaded through the same gtag.js as GA4.
export const googleAdsId =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
  (process.env.NODE_ENV === "production" ? "AW-18475903983" : undefined);

/** Conversion labels from Google Ads (Goals > Conversions). */
export const adsConversions = {
  jobApplication: "AzNfCOO8nI4dEO_X_-lE",
  // Secondary in Google Ads: recorded, not used for bidding on the jobs campaigns.
  businessEnquiry: "hotZCK2HrY4dEO_X_-lE",
} as const;

// Umami runs on our own infrastructure; the tag is proxied through /_t (next.config.ts).
export const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
