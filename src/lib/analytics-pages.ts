import { splitLocalePath } from "@/lib/i18n";
import { JOB_HUB_SLUGS } from "@/lib/job-hubs";
import { JOB_ROLE_SLUGS } from "@/lib/talent-intake/rules";

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
  ...[...JOB_ROLE_SLUGS, ...JOB_HUB_SLUGS].map((slug) => `/jobs/${slug}`),
  "/privacy",
  "/services",
  "/services/contract-labour",
  "/services/factory-labour",
  "/services/loading-unloading-labour",
  "/services/housekeeping",
  "/services/warehouse-labour",
  "/terms",
  "/vayasya-setu",
]);

/** The path as is for a known page (/hi-in/jobs, or neutral /jobs on the language picker), else "/other". */
export function safeAnalyticsPath(pathname: string) {
  return publicPages.has(splitLocalePath(pathname).path) ? pathname : "/other";
}
