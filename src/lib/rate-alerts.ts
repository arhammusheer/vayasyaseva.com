/**
 * Minimum wage rate alerts (rate_alert.v1, packages/contracts): a reader of
 * a wage page leaves an email address, confirms it from a link, and gets an
 * email when that state's rates change. What the site's routes and pages
 * share. The list and the emails are Windmill's (integrations/windmill
 * leads/lib/run-alerts.ts); docs/rate-alerts.md has the whole flow.
 */
import { WAGE_STATE_SLUGS, wageStatePath, type WageStateSlug } from "@/content/registry/identifiers";
import { linkable } from "@/content/registry";

/**
 * Version of the privacy notice a subscriber signs up under (/privacy §2
 * "Minimum wage alerts"), kept with their row.
 */
export const ALERT_NOTICE_VERSION = "2026-11-10";

/** The page the links in our emails open: /alerts#confirm=<token> and /alerts#stop=<token>. */
export const ALERTS_PATH = "/alerts";

/** States a reader can follow: every wage page that is published. */
export const alertStates = (): WageStateSlug[] => WAGE_STATE_SLUGS.filter((slug) => linkable(wageStatePath(slug), "en-IN"));

/** ALR-<date>-<8 hex>: names one request in the logs (never shown to the reader). */
export function createAlertRef(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `ALR-${stamp}-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
}
