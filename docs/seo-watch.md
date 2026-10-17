# SEO watch

Every Monday at 08:00 IST a CronJob in the cluster (`vayasya-infra`
`apps/seo-watch`) runs `scripts/seo-watch/index.mjs` and sends a Search
Console report to the owner in Chatwoot (the "SEO watch" API inbox, assigned
to the owner by the "Monitors: assign to owner" rule).

The report covers:

- the last four full weeks against the weekly average of the 13 weeks before
  the home retitle (15 July to 13 October 2026): impressions, clicks,
  non-brand impressions (all minus branded queries, since filtering on "not
  brand" also drops anonymised queries), and Haridwar-query impressions split
  by page (home, `/jobs/haridwar`, the Haridwar hub at `/locations/haridwar`, formerly `/haridwar-sidcul`, other);
- the month-3 targets of PLAN §9.5 over the last 28 days;
- the location pages (live since 17 October 2026): last week's impressions
  and clicks per region (/locations, Uttarakhand, Bengaluru, Delhi NCR), how
  many of each region's pages Google has indexed (URL Inspection API, read
  from the live sitemap, about 13 calls a week), the top queries reaching
  them, and the pages still to request indexing for;
- the top ten queries of the last week.

## The home retitle rule (PLAN §9.5)

The home page dropped "Haridwar" from its title on 16 October 2026. If
Haridwar job or buyer impressions to the site fall more than 30% for four
weeks and `/jobs/haridwar` and `/locations/haridwar` haven't picked them up,
restore "Haridwar" in the home title.

The watch checks it each week, but only judges it when there is enough data:
before the retitle, Haridwar queries brought about 2 impressions a week (the
rank snapshot of 13 October shows 10 such queries, 28 impressions in 13
weeks, none on the home page), and a 30% fall in 2 impressions is noise.
Below 20 a week it says "not judged". When the rule trips, the message goes
to its own conversation, "SEO · home retitle rule tripped".

## Access

Keyless. The pod's projected service account token (`growth/seo-watch`) is
exchanged through workload identity federation (pool `vayasya-cluster`,
provider `kubernetes` in Google Cloud project `vayasya-ads`, admitting only
that one Kubernetes service account) for a 15-minute token of
`search-console-submit@vayasya-ads.iam.gserviceaccount.com`, read-only scope.
`scripts/search-console/setup-gcp.mjs` sets it up; re-run it if the cluster's
signing key changes (it reads `google/cluster-jwks.json` from vayasya-infra).

Search data goes to Chatwoot and the notification hub's email body only. The
logs say "sent" and the rule's status, never queries or figures: this
repository and its Actions are public.

`--notify chatwoot,hub` (the cluster's flags until Chatwoot is retired; the
default is `chatwoot`) also posts to the notification hub
(`docs/notification-hub.md`, needs `NOTIFY_URL` and `NOTIFY_INGEST_SECRET`):
`seo.weekly_report` by email only, `seo.rule_tripped` as a push and an email
when the rule trips, `seo.watch_failed` when the run fails. Their titles and
summaries carry the week and the rule's status, never a figure.

## Running it

```sh
GOOGLE_ACCESS_TOKEN=$(gcloud auth application-default print-access-token) node scripts/seo-watch/index.mjs --dry-run
kubectl -n growth create job --from=cronjob/seo-watch seo-watch-now
```

Deeper pulls for analysis (Search Console, GA4, Google Ads, Keyword Planner,
Umami) live outside this repository in `~/.config/google-ads/seo_data.py`
and the search data archive.
