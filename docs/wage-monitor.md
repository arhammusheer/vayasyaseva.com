# Wage monitor

The minimum wage pages (`/minimum-wages/<state>`) are only as good as their
last check against the state's own documents. The wage monitor fetches those
primary sources every morning and opens a GitHub issue when something there
changes, so the owner hears about a new notification from us before a client
does. It is PLAN §11 (owner decision 4): daily monitors of the primary
sources for every state we publish, a change alerts the owner, Claude drafts
the update pull request.

## What it watches

For each state with a wage dataset (`src/content/wages/<state>.json`):

- **Cited documents.** Every `sources[].url` in the dataset, fetched once per
  URL. The file's SHA-256 is compared with the stored snapshot, or on a first
  run with the `sha256` recorded in the dataset. The text layer is extracted
  (PDF text with no dependency, `scripts/wage-monitor/pdf-text.mjs`) so the
  alert can show the lines that changed. Many state orders are scans with no
  text layer; for those the alert gives the size and page count and asks for
  the file to be read.
- **Listing pages.** The department pages where a new notification first
  appears, from `scripts/wage-monitor/sources.json` (plus every
  `sources[].listing` in the dataset, which the unit tests require to be in
  the registry). A listing is compared by the documents it links (absolute
  URL and link text), not by its HTML, so menus, counters and banners do not
  raise alerts. A `match` pattern keeps only wage links on home pages that
  link everything.

| State | Listing pages |
|---|---|
| Uttarakhand | Labour Department minimum wages notifications; circulars and notifications; home page notices (wage, DA and VDA links only) |
| Uttar Pradesh | Labour Department home page notices (wage links only); Minimum Wages Act orders |
| Delhi | Labour Department current minimum wage rates |

## When it alerts

One open issue per state, titled `Wage monitor: <State> sources changed`,
label `wage-monitor`. A new event on a state with an open issue becomes a
comment on it. Each event carries a hidden fingerprint, so the same change is
never reported twice, even if the snapshot is lost.

| Event | Meaning |
|---|---|
| A cited document changed | The file at a URL the wage page cites is not the one it was checked against. Size, pages, and the text lines added and removed. |
| A listing changed | A document appeared on or left a department page. New files are fetched and described (size, pages, lines with figures); a cited file that left the page is called out. |
| Not loaded for 3 days | A source failed on three separate days (India time) with no successful load in between. A day with no run (a late or dropped schedule, an evicted cache) does not restart the count; only a successful load does. One alert. Retries once within a run. |
| Loads again | A source that raised the 3-day alert loads again. Only a comment; it never opens an issue. |

A response that is not the source counts as a failed load, not a change: an
HTML page served where a PDF used to be (a firewall, captcha or maintenance
page), a listing with no document links at all, or a listing that suddenly
has fewer than half the links it had (counting every document link on the
page, before any `match`). So a bad day on a state site does not report every
document as removed and then as new; if it lasts three days it raises the
"not loaded" alert, which is the right prompt to look at the page.

A file that turns up on several listings the same day (an order on the wage
page and the home page) is downloaded once and described once in the issue.

The issue says what to do: read the document; if rates, dates or zones
changed, update `src/content/wages/<state>.json` (figures, `sources[].sha256`,
`sizeKb`, `retrievedOn`, `checked.on`), run `pnpm content:check`, and link
the pull request. Close the issue once the page matches the sources again.
The run summary also notes a cited file that still differs from the dataset
(`differs-from-dataset`) until the dataset is updated.

## Running it

```sh
pnpm wages:monitor --dry-run                 # fetch and compare; print the summary and the issues it would open
pnpm wages:monitor --dry-run --only delhi    # one state
pnpm wages:monitor --dry-run --save-state    # also save the snapshot (try a change locally by editing it)
pnpm wages:monitor                           # report to GitHub; needs GITHUB_TOKEN and GITHUB_REPOSITORY
```

`--state <file>` changes the snapshot path (default `.wage-monitor/state.json`,
git-ignored). `--json` prints the result as JSON for a scheduler. Exit code 0
means the run completed (alerts go to issues); 2 means the monitor itself
failed. The snapshot is saved only after every alert was sent, so a failed
run reports again the next day.

Each host's URLs are fetched one after another and different hosts in
parallel, with a 45-second timeout per request and one retry. If a host does
not answer at all (timeout, refused, DNS), its other URLs in that run fail at
once instead of each waiting out the timeout, so a hanging state site costs
about a minute and a half, not a minute and a half per document.

`pnpm content:unit` runs the unit tests (`tests/wage-monitor.spec.mjs`):
offline fixtures for the PDF reader, link extraction, change and failure
rules, and issue reporting, plus a check that the registry covers every
dataset.

## Where it runs

`.github/workflows/wage-monitor.yml` runs it daily at 07:00 IST (01:30 UTC;
GitHub may start scheduled runs late) and on demand from the Actions tab,
with a dry-run switch. Permissions are `contents: read` and `issues: write`;
it uses the workflow's own `GITHUB_TOKEN` and no secrets. The snapshot lives
in the Actions cache (restored from the newest entry, saved under a new key
each run), so the workflow never commits to the repository. If the cache is
evicted, the next run records listing pages as a new baseline and compares
cited documents with the dataset hashes.

First steps after merge:

1. Run **Wage monitor** from the Actions tab with `dry_run` ticked. The step
   summary lists every source and whether it loaded from GitHub's US runners.
   The local checks ran from India; state sites sometimes block foreign IPs.
2. If every source loaded, run it once more with `dry_run` off. That run
   records the listing baseline in the cache (a first run never alerts on
   listings). The daily schedule takes over from there.
3. If some sources fail from GitHub but open in a browser in India, move
   the daily run to the India-hosted schedule below and turn the GitHub
   schedule off, rather than living with daily failures.

GitHub disables scheduled workflows in a public repository after 60 days
with no activity in it, and emails the owner first. If the repository goes
quiet that long, re-enable **Wage monitor** in the Actions tab.

Nothing depends on Vercel. When the site moves to its own Kubernetes cluster, the
same command runs as a Kubernetes CronJob or an n8n schedule with a
persistent volume for `.wage-monitor/` and a fine-grained token limited to
this repository's issues. Running from India also helps if a state site
blocks requests from GitHub's US runners: three days of failures from a
source that loads in a browser here is the sign.

## Adding a state or a source

1. Add the state's dataset (`src/content/wages/<state>.json`) as for any
   wage page; its cited documents are watched automatically.
2. Add the state to `scripts/wage-monitor/sources.json` with its listing
   pages: the department's minimum wage notification page, its circulars or
   orders page, and the home page notices with a `match` pattern if new
   orders are announced there first. Include every `listing` the dataset
   uses.
3. Run `pnpm content:unit` and `pnpm wages:monitor --dry-run --only <state>`
   and check each listing finds the documents you expect.

Sources are public government pages. The registry and the issues hold URLs,
document titles and the text of public orders only.
