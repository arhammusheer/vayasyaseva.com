// The SEO watch's events for the notification hub (docs/notification-hub.md):
//
//   seo.weekly_report  email only, the full report in the body
//   seo.rule_tripped   the home retitle rule tripped: a push and an email
//   seo.watch_failed   the watch did not run: a push and an email
//
// Search data (queries, impressions, clicks, positions) goes in the email
// body only. Titles and summaries, which reach a phone's lock screen and the
// digest, carry the week and the rule's status, never a number from Search
// Console. The dedupeKeys are per week (per day for a failure), so a rerun is
// one notification.

/** The events for one week's report; `message` is the report's Markdown (the email body). */
export function seoEvents({ weekEnd, ruleStatus, message }) {
  const events = [
    {
      source: "seo-watch",
      type: "seo.weekly_report",
      severity: "info",
      dedupeKey: `seo:weekly:${weekEnd}`,
      title: `SEO weekly report, week to ${weekEnd}`,
      summary: `The Search Console report for the week to ${weekEnd}. Home retitle rule: ${ruleStatus}.`,
      body: message,
      link: { label: "Search Console", url: "https://search.google.com/search-console?resource_id=sc-domain%3Avayasyaseva.com" },
    },
  ];
  if (ruleStatus === "tripped") {
    events.push({
      source: "seo-watch",
      type: "seo.rule_tripped",
      severity: "warning",
      dedupeKey: `seo:rule_tripped:${weekEnd}`,
      title: "SEO: the home retitle rule tripped",
      summary: 'Haridwar impressions stayed more than 30% below the pre-retitle level for 4 weeks. PLAN §9.5: restore "Haridwar" in the home title. The email has the figures.',
      body: message,
      link: { label: "Search Console", url: "https://search.google.com/search-console?resource_id=sc-domain%3Avayasyaseva.com" },
    });
  }
  return events;
}

/** seo.watch_failed: one a day; the error (an HTTP status from Google, no search data) in the email body only. */
export function seoFailedEvent(error, today) {
  return {
    source: "seo-watch",
    type: "seo.watch_failed",
    severity: "warning",
    dedupeKey: `seo:watch_failed:${today}`,
    title: "SEO watch failed",
    summary: "This week's Search Console report was not built or not sent. Check the CronJob's logs (seo-watch).",
    body: String(error?.message ?? error).split("\n").slice(0, 6).join("\n"),
  };
}
