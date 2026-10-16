import { builtPages } from "@/content/registry";
import { splitLocalePath } from "@/lib/i18n";

/**
 * Pages by neutral path, from the page registry; any locale of them may be
 * reported. Includes review and paused pages, which are reachable by URL.
 */
const publicPages = new Set(builtPages().map((entry) => entry.path));

/** The path as is for a known page (/hi-in/jobs, or neutral /jobs on the language picker), else "/other". */
export function safeAnalyticsPath(pathname: string) {
  return publicPages.has(splitLocalePath(pathname).path) ? pathname : "/other";
}
