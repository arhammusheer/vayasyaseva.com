export const gaId =
  process.env.NEXT_PUBLIC_GA_ID ||
  (process.env.NODE_ENV === "production" ? "G-80VCZT0V6G" : undefined);

export const clarityId =
  process.env.NEXT_PUBLIC_CLARITY_ID ||
  (process.env.NODE_ENV === "production" ? "yogh8zv088" : undefined);

// Umami runs on our own infrastructure; the tag is proxied through /_t (next.config.ts).
export const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
