import { splitLocalePath } from "@/lib/i18n";

/** Public pages by neutral path; any locale of them may be reported. */
const publicPages = new Set([
  "/",
  "/about",
  "/brand",
  "/compliance",
  "/contact",
  "/haridwar-sidcul",
  "/how-we-operate",
  "/industries",
  "/jobs",
  ...["factory-helper", "warehouse", "data-entry-operator", "housekeeping", "iti-trades"].map((slug) => `/jobs/${slug}`),
  "/privacy",
  "/services",
  "/services/contract-labour",
  "/services/factory-labour",
  "/services/housekeeping",
  "/services/warehouse-labour",
  "/terms",
  "/vayasya-setu",
]);

/** The path as is for a known page (/hi-in/jobs, or neutral /jobs on the language picker), else "/other". */
export function safeAnalyticsPath(pathname: string) {
  return publicPages.has(splitLocalePath(pathname).path) ? pathname : "/other";
}
