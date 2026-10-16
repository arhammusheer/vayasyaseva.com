# Search pipeline

After every successful production deploy, `.github/workflows/search.yml`
tells the search engines. It starts from Vercel's `deployment_status` event
(production only) and can be run by hand from the Actions tab.

| Job | What it does |
|---|---|
| `check` | Waits 30 seconds for the domain to point at the new deploy, then runs `scripts/seo-check.mjs` against https://www.vayasyaseva.com. The other two jobs run only if it passes. |
| `indexnow` | Submits the pages whose content fingerprint changed since the last successful run to IndexNow (Bing, Yandex and others; `scripts/indexnow.mjs --changed`). The fingerprints are an artifact of the last run. |
| `search-console` | Submits `sitemap.xml` to Google Search Console (`sc-domain:vayasyaseva.com`) and prints what Google last read from it (URLs seen, errors, warnings) in the run summary. Fails if the sitemap does not load, Google refuses, or Google's last read had errors (`scripts/search-console/submit-sitemap.mjs`). |

Google has no IndexNow, and its Indexing API is only for job postings and
livestreams, so the sitemap is how Google hears about new and changed pages.
Resubmitting an unchanged sitemap is harmless; Google decides when to fetch it.

## Access (keyless)

The `search-console` job has no stored key. GitHub's OIDC token is exchanged
through workload identity federation for a one-hour access token of the
service account `search-console-submit@vayasya-ads.iam.gserviceaccount.com`
(scope `webmasters`). The account has no Google Cloud roles; only workflows of
this repository can use it (the provider's attribute condition), and it can
only do what Search Console lets it.

Set up once, idempotently, by `node scripts/search-console/setup-gcp.mjs`
(your Application Default Credentials, project `vayasya-ads`): the APIs, the
service account, the `github` pool, the `vayasyaseva-com` provider and the
binding. Then one manual step, as Search Console has no API for users:

> Search Console → property `vayasyaseva.com` → Settings → Users and
> permissions → Add user → `search-console-submit@vayasya-ads.iam.gserviceaccount.com`,
> permission **Full**.

Until that is done the job fails with HTTP 403 and says so.
