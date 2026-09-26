export const gaId =
  process.env.NEXT_PUBLIC_GA_ID ||
  (process.env.NODE_ENV === "production" ? "G-80VCZT0V6G" : undefined);
