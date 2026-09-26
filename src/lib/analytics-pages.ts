const publicPages = new Set([
  "/",
  "/about",
  "/brand",
  "/compliance",
  "/contact",
  "/haridwar-sidcul",
  "/how-we-operate",
  "/industries",
  "/privacy",
  "/services",
  "/services/contract-labour",
  "/terms",
  "/vayasya-setu",
]);

export function safeAnalyticsPath(pathname: string) {
  return publicPages.has(pathname) ? pathname : "/other";
}
