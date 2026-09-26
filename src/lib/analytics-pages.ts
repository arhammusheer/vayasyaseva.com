const publicPages = new Set([
  "/",
  "/about",
  "/brand",
  "/compliance",
  "/contact",
  "/haridwar-sidcul",
  "/hi/haridwar-sidcul",
  "/hi/services/contract-labour",
  "/hinglish/haridwar-sidcul",
  "/hinglish/services/contract-labour",
  "/hinglish/services/factory-labour",
  "/hinglish/services/housekeeping",
  "/hinglish/services/warehouse-labour",
  "/how-we-operate",
  "/industries",
  "/privacy",
  "/services",
  "/services/contract-labour",
  "/services/factory-labour",
  "/services/housekeeping",
  "/services/warehouse-labour",
  "/terms",
  "/vayasya-setu",
]);

export function safeAnalyticsPath(pathname: string) {
  return publicPages.has(pathname) ? pathname : "/other";
}
