/**
 * Job hub pages under /jobs/<slug>: who a search is from (freshers, 10th or
 * 12th pass), not a kind of work. They are in the sitemap but deliberately
 * not linked from the site's navigation, jobs page or role pages; content in
 * src/content/pages/job-hubs.ts. Kept apart from that file so i18n (used by
 * client components) doesn't pull the copy into the browser bundle.
 */
export const JOB_HUB_SLUGS = ["freshers", "10th-pass", "12th-pass"] as const;
export type JobHub = (typeof JOB_HUB_SLUGS)[number];

export function isJobHub(value: unknown): value is JobHub {
  return typeof value === "string" && (JOB_HUB_SLUGS as readonly string[]).includes(value);
}
