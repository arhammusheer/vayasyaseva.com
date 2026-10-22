# Compliance monitor

The minimum wage pages (`/minimum-wages/<state>`) show two things that the
states and the Centre change without warning: each state's minimum wages,
and what employers owe there (EPF, ESIC, Professional Tax, Labour Welfare
Fund, the contract labour licence). The compliance monitor fetches their
primary sources every morning from the cluster and messages the owner in
Chatwoot when something changes. The owner then dispatches the update pull
request (Claude can draft it from the new document). It is PLAN §11 (owner
decision 4), widened to the employer dues on 16 October 2026.

The code is `scripts/wage-monitor/` (the name predates the wider scope).

## What it watches

Every source has a **topic**: `wages`, `epf`, `esic`, `pt`, `lwf`,
`licence`, `codes` or `locations`.

**Per state with a wage page** (`src/content/wages/<state>.json`):

- **Wages.** Every cited document in the dataset (SHA-256 against the
  snapshot, or on a first run the `sha256` in the dataset), and the
  department listing pages where a new notification first appears.
- **Professional Tax, Labour Welfare Fund, contract labour licence.** The
  state pages where a change would show, with a `match` pattern per topic,
  and the documents the employer dues cite for that state.

**National** (EPF, ESIC, labour codes): the EPFO circulars list, EPFO's home
page updates and press releases, ESIC's circulars and notifications, ESIC's
contribution rates page, the Ministry of Labour's gazette notifications, and
every gazette, EPFO and Ministry document `src/content/statutory.ts` or a
guide cites. The Ministry's site renders in the browser, so it is read
through its documents API (`format: "wp-documents"`): each post is an entry
keyed by its public page, and new ones are named in the alert rather than
fetched.

**Guides** (`src/content/guides/sources.ts`): every source is watched before
a guide can publish. India Code does not answer automated requests, so an Act
cited there is watched as its Gazette copy (`watchedAs`).

**Location page sources** (`src/content/locations`, about 77 links): checked
for loading only, on the first three days of each month (or `--locations`).
Their content is never compared, since estate profiles and district pages
change in ways that do not matter; a link that fails all three days raises
the usual "not loaded for 3 days" alert under "Location page sources".

`pnpm content:unit` fails if a published state has no source for wages, PT,
LWF or the licence, if EPF, ESIC or the codes have none, or if a document the
employer dues or a guide cite is not watched (`coverageProblems`).

Three kinds of source:

| Kind | Compared by |
|---|---|
| Document | The file's SHA-256. The text layer is extracted (`pdf-text.mjs`, no dependency) so the alert shows the lines that changed; scans have none, so the alert gives size and pages. |
| Listing | The documents it links (URL and link text), not its HTML, so menus and counters never alert. `match` keeps only relevant links. |
| Page | The lines of its text that match `match`, de-duplicated and sorted, so a page that reorders its text (ESIC's) is stable. For rate pages with no documents. |

Sources by state today (`scripts/wage-monitor/sources.json`):

| Scope | Wages | PT | LWF | Licence |
|---|---|---|---|---|
| Uttarakhand | Labour Department minimum wage notifications; circulars; home page notices | Circulars (PT pattern) | Acts and rules (LWF pattern); UP LWF Rules, 1972 | Acts and rules (OSH pattern) |
| Uttar Pradesh | Home page notices; Minimum Wages Act orders | Home page (PT pattern) | Home page (LWF pattern); UP LWF Rules, 1972 | Home page (OSH pattern) |
| Delhi | Current minimum wage rates | Notifications (PT pattern) | Delhi Labour Welfare Board circulars and orders; LWF contribution notification (page) | Notifications (OSH pattern) |
| Haryana | News and notifications (wage pattern) | News and notifications (PT pattern) | Same listing (LWF pattern); the LWF Act as amended by Haryana; the Board's 2026 ceiling notice (SGCMS copy) | Same listing (OSH pattern); draft OSH rules, 2026 |
| Punjab | Home page notifications | Development tax site downloads; the 2018 Act and 2021 amendment rules | Acts and rules (LWF pattern); LWF Act, 1965; Amendment Act, 2014 (PRS copy) | Acts and rules (OSH pattern); contract labour licence page |
| Andhra Pradesh | Labour Department site, read from its app bundle (`spa-bundle`: VDA notifications, contract labour wages, the wage sheets) | Tax on Professions Act (PRS copy); the 2013 amendment's slabs (LegitQuest copy: the Commercial Taxes Department's own schedule PDF is down) | Same site (LWF pattern); LWF Act, 1987; LWF Rules, 1988; G.O.Ms. 9 of 2020 | Same site (codes and contract labour pattern); OSH (AP) Rules, 2026 (G.O.Rt. 146); the other three final code rules |
| National | | | | Labour codes handbook |

National EPF, ESIC and codes: EPFO circulars; wage ceiling circular and FAQs;
ESIC circulars, notifications and contribution rates; Social Security
(Central) Rules, 2026; S.O. 2698(E); the Code on Social Security, 2020; the
Code on Wages, 2019.

**Andhra Pradesh's labour site** (labour.ap.gov.in) is a single-page app: its
HTML is an empty shell and every notice, act and wage sheet is an object
literal in its main script (`/static/js/main.<hash>.js`), served from
`api.apfd.apcfss.in`. Its listings use `format: "spa-bundle"`: the monitor
fetches the shell, follows it to the current main script (the hash changes
with each release) and reads the documents the script links, labelled by
their notice text (`spaBundleLinks`, with `publicBase` the download prefix).
A shell without its script counts as a failed load. The department publishes
its per-employment wage tables as Excel sheets, so those sources are watched
by hash like PDFs and hosted as they are.

**Leads** (`pages` with `allowEmpty`): SGCMS's minimum wage posts and
AscentHR's notifications, one target per state with the state's name as the
pattern. A lead alerts on a new line only: posts age off these feeds every
week, and a line that scrolled off is not news (18 Oct 2026, after six
"page changed" alerts for exactly that). A lead's `ignore` pattern drops
lines that match the state but are not posts: AscentHR's state menu and
category tags ("Haryana", "Haryana , Notification"), which raised six alerts
on 19 October 2026 when the page first loaded in full. Delhi's AscentHR
excerpts often say "National Capital Territory" rather than Delhi, so its
pattern matches both. Compliance firms often post an order before the state does (UP's
brick-kiln and agriculture orders were never on uplabour.gov.in), so a new
line there is a prompt to find the order, not a source in itself. A week
with nothing on a state is not a failure.

**Hosts that need help** (`sources.json`): `plainUserAgentHosts` refuse the
monitor's user agent and get a browser's; `legacyTlsHosts` (SIIDCUL, the
Punjab Assembly) need TLS legacy renegotiation, which Node refuses by default
and browsers allow.

**The relay** (`relayHosts`): Punjab's state data centre (DGG&IT,
pblabour.gov.in) drops every TCP connection from the cluster's hosting
network (Tier4Cloud, 202.66.172.0/23), found on 19 October 2026 after three
days of timeouts; it answers Indian home connections and Cloudflare. The
monitor fetches those hosts through `vayasya-fetch-relay`, a Cloudflare
Worker in `scripts/wage-monitor/relay/`: `GET /?url=<source>` with the
shared secret in `x-relay-secret`. It fetches only the hosts in its
`ALLOWED_HOSTS` (kept equal to `relayHosts` by a test), checks every redirect
against them, and bypasses Cloudflare's cache. The monitor uses it only when
`FETCH_RELAY_URL` and `FETCH_RELAY_SECRET` are set, so a local run fetches
directly. Which Cloudflare location serves the Worker matters: called from
the cluster it reaches Punjab, called from Delhi it timed out (522), so test
from the cluster. Deploy and rotate:

```sh
vayasya-infra/cloudflare/run npx wrangler@4 deploy -c scripts/wage-monitor/relay/wrangler.toml
# rotate: one new value into the Worker and into vayasya-infra's
# apps/compliance-monitor/overlays/growth/secrets.sops.yaml (FETCH_RELAY_SECRET)
vayasya-infra/cloudflare/run npx wrangler@4 secret put RELAY_SECRET -c scripts/wage-monitor/relay/wrangler.toml
```

**Internet Archive captures** (`web.archive.org/web/<timestamp>id_/…`): Andhra
Pradesh no longer hosts most of its minimum wage notifications (2006 to 2012);
the Internet Archive kept the department's own files. A fixed capture cannot
change, so the dataset cites it with `via`, our hosted copy is linked first,
and the monitor neither fetches it nor counts it as unwatched (`ARCHIVED`).

**Copies from third parties** (`via` on a source): where the state never
published the document and a compliance firm did, the dataset cites that
copy, says so in `via`, and the monitor watches the file but not the firm's
article page.

**Location pages** quote some rates in prose (the NCR and Bengaluru hubs).
`pnpm content:unit` fails if one of those figures is not a current rate in a
wage dataset or `statutory.ts`, so a revision cannot leave them behind.

None of Uttarakhand, UP, Delhi or Haryana levies Professional Tax (Punjab's
equivalent is its ₹200 development tax), so its sources only catch a
new levy if the labour department announces it. Uttar Pradesh's labour site
links few documents; its final OSH rules came out on another host. Treat a
quiet PT or UP topic as weak evidence, not proof nothing changed.

## When it alerts

**Chatwoot** (the default in the cluster): the "Compliance monitor" API
inbox in the Vayasya Seva account. One conversation per state and topic
("Minimum wages · Uttarakhand", "EPF · all states", "Labour Welfare Fund ·
Delhi"), created the first time and reused; a day's new events for it are
one message. Messages arrive as incoming, so the inbox's agents get the usual
Chatwoot notification. Each message ends with what to do: open the documents,
and if the figures changed, dispatch an update PR (`src/content/wages/
<state>.json` for wages, `src/content/statutory.ts` for the rest) and reply
with its link. Resolve the conversation when the page matches the sources;
the next change reopens it.

Every event has a fingerprint kept in the snapshot for 400 days, so the same
change is never sent twice. If a conversation was deleted in Chatwoot, the
monitor starts a new one.

| Event | Meaning |
|---|---|
| A cited document changed | The file at a watched URL is not the one last seen. Size, pages and the text lines added and removed. |
| A listing changed | A document appeared on or left a page. New files are fetched and described (size, pages, lines with figures); a cited file that left the page is called out. |
| A page changed | Watched lines were added or removed (for example a new ESIC rate). |
| Not loaded for 3 days | A source failed on three separate India days with no successful load in between. One alert. |
| Loads again | A source that raised the 3-day alert loads again. Only sent into an existing conversation. |
| Monitor failed | The run itself failed (a bad registry, a crash). Sent to its own conversation; the CronJob's logs have the detail. |

A response that is not the source counts as a failed load, not a change: an
HTML page where a PDF used to be, a listing with no document links or fewer
than half its earlier links, a page with none of its watched lines, or a
page with no text at all (even a lead page, which may otherwise be empty). So a
bad day on a government site does not report everything as removed and then
new.

**GitHub issues** (`--notify github`): one open issue per state titled
`Wage monitor: <State> sources changed`, label `wage-monitor`, with hidden
fingerprints. The manual **Wage monitor** workflow uses this.

**The notification hub** (`--notify hub`, or `chatwoot,hub` as the cluster
runs it until Chatwoot is retired): one event per state and topic,
`compliance.source_changed` (a push and an email with the same Markdown as
the Chatwoot message), or `compliance.source_unreachable` /
`compliance.source_recovered` (the morning digest). A failed run is
`compliance.monitor_failed`. It needs `NOTIFY_URL` and `NOTIFY_INGEST_SECRET`;
the hub's fingerprints are kept in the snapshot apart from Chatwoot's. See
`docs/notification-hub.md`.

## Running it

```sh
pnpm wages:monitor --dry-run --notify chatwoot   # fetch and compare; print the summary and the messages it would send
pnpm wages:monitor --dry-run --only delhi        # one state (national sources are always checked)
pnpm wages:monitor --dry-run --save-state        # also save the snapshot
pnpm wages:monitor                               # notify: Chatwoot if CHATWOOT_BASE_URL is set, else GitHub
```

Chatwoot needs `CHATWOOT_BASE_URL` (in the cluster
`http://chatwoot.growth.svc.cluster.local`) and `CHATWOOT_INBOX_IDENTIFIER`
(the API inbox's identifier; it authorises the public API, so keep it in the
SOPS secret, not in git). No agent token. GitHub needs `GITHUB_TOKEN` and
`GITHUB_REPOSITORY`.

`--state <file>` sets the snapshot (default `.wage-monitor/state.json`,
git-ignored; about 650 KB with every source). Exit 0 means the run
completed; 2 means the monitor failed. The snapshot is saved only after
every alert was sent, so a failed run reports again the next day.

Hosts are fetched in parallel, each host's URLs in turn, 45 seconds per
request with one retry; a host that does not answer at all fails its other
URLs at once. egazette.gov.in sends an incomplete certificate chain, so the
monitor trusts the two Let's Encrypt certificates in
`scripts/wage-monitor/certs/` (the YR1 intermediate and Root YR cross-signed
by ISRG Root X1), and pblabour.gov.in and psdt.punjab.gov.in omit their
intermediates, so it also trusts Sectigo Public Server Authentication CA DV
R36 and GeoTrust TLS RSA CA G1 from the same folder. www.labour.gov.in refuses descriptive user agents and ascent-hr.com
answers them with an empty page (since 18 October 2026), so both get a plain
one (`plainUserAgentHosts`).

## Where it runs

A Kubernetes CronJob in the `growth` namespace, `vayasya-infra`
`apps/compliance-monitor`: daily at 07:00 IST, from India, close to the
sources. Each run clones this public repository's `main` (so a merged change
to the registry or code takes effect the next morning), runs
`scripts/wage-monitor/index.mjs` with Node 24, and keeps the snapshot on a
small volume. It reaches Chatwoot over cluster DNS (Chatwoot's network policy
allows it). Run it now:

```sh
kubectl -n growth create job --from=cronjob/compliance-monitor compliance-monitor-now
kubectl -n growth logs -f job/compliance-monitor-now
```

The **Wage monitor** GitHub workflow is a manual fallback with its own
snapshot in the Actions cache; it reports to GitHub issues.

## Our copies of the documents

Government portals move, replace and drop files, so we keep our own.

- **Hosted copies.** Every document a wage page cites is hosted at
  `cdn.vayasyaseva.com/sources/<state>/<id>-<sha8>.pdf`, compressed
  (grayscale, 120 dpi, JPEG quality 60: Hindi scans stay comfortably readable
  at about a tenth of their size), and the pages link it first, with the
  original beside it. `scripts/wage-monitor/host-copies.mjs` checks each file
  against the dataset's `sha256`, compresses it, uploads it and writes `copy`
  and `copyKb` back. Run it in each update PR after adding a source:

  ```sh
  ../vayasya-infra/cloudflare/run env CLOUDFLARE_ACCOUNT_ID=3f03827748ac33418f1176adaa436f26 \
    node scripts/wage-monitor/host-copies.mjs
  ```

- **Originals.** The bytes as retrieved sit beside them at
  `sources/original/<sha256>.pdf`, one object per hash, never overwritten.
  The daily run stores every PDF it fetches there (`archive.mjs`), cited or
  newly listed, once `R2_ARCHIVE_ACCOUNT_ID`, `R2_ARCHIVE_BUCKET` (`cdn-vspl`),
  `R2_ARCHIVE_ACCESS_KEY_ID` and `R2_ARCHIVE_SECRET_ACCESS_KEY` are set; the
  summary says how many it checked and stored. `r2.mjs` signs the requests
  itself, since the CronJob runs Node with no packages.

## Adding a state or a source

1. Add the state's wage dataset (`src/content/wages/<state>.json`) and its
   employer dues (`src/content/statutory.ts`); cited documents are watched
   automatically once listed.
2. Add the state to `scripts/wage-monitor/sources.json`: its wage listing
   pages (every `listing` the dataset uses), and at least one source each
   for `pt`, `lwf` and `licence`. Add every new document `statutory.ts`
   cites under the state's or `national`'s `documents`.
3. Host our copies (`host-copies.mjs`, above).
4. Run `pnpm content:unit` and `pnpm wages:monitor --dry-run --only <state>`
   and check each source finds what you expect. After merge, the next
   morning's run records the new listings as a baseline.

Sources are public government pages, and the leads public pages of
compliance firms. The registry and the messages hold URLs, document titles
and the text of public orders only.
