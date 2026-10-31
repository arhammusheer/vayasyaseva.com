import { parseListingChecks, wageStates, withListingChecks } from "@/content/wages";

/**
 * The compliance monitor's listing checks (scripts/wage-monitor/checks.mjs):
 * per state, the last morning it read every wage listing and found nothing
 * added since the hand check. Published to our CDN after each run; the wage
 * pages read it when they regenerate (ISR, daily), so a quiet listing keeps
 * a page current without a commit. Any failure means no automatic checks:
 * the pages fall back to the hand check in the dataset.
 */
export const LISTING_CHECKS_URL = "https://cdn.vayasyaseva.com/monitor/wage-listing-checks.json";

export async function wageListingChecks() {
  try {
    // A day, like the pages: the 14-day rule leaves room for a day or two of lag.
    const res = await fetch(LISTING_CHECKS_URL, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) });
    return res.ok ? parseListingChecks(await res.json()) : {};
  } catch {
    return {};
  }
}

/** Every wage dataset with its listing check attached. */
export const checkedWageStates = async () => withListingChecks(wageStates, await wageListingChecks());
