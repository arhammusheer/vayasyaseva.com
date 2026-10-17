# Area intent: what the site shows

No market is the default (owner direction, 17 Oct 2026). The site decides
per visitor which market(s) to put first, and measures what people pick. The
markets:

| Market (cluster id) | Jobs | Business |
|---|---|---|
| Bengaluru (`bengaluru`) | `/jobs/bengaluru`, worker list | `/locations/bengaluru` |
| Delhi NCR (`delhi-ncr`) | none | `/locations/delhi-ncr` |
| Haridwar (`haridwar`) | `/jobs/haridwar` | `/haridwar-sidcul` |
| Jalandhar–Kapurthala (`jalandhar`) | `/jobs/jalandhar` | `/locations/jalandhar` |
| Punjab outside it (`punjab`) | `/jobs/punjab`, worker list | none (Jalandhar's page) |
| Uttarakhand outside Haridwar (`uttarakhand`) | `/jobs/uttarakhand`, worker list | `/locations/uttarakhand` |

## What follows the decision

The decision is made after the page loads, from what the visitor did and how
they arrived, then where they are (`src/lib/intent/`).

- **Header:** the business bar's area slot (the market's buyer page, else
  "Locations"), the jobs door (the market's hub, else `/jobs`), Apply (the
  hub's form, else `/jobs/apply`) and the jobs menu (every market, decided first).
- **`/jobs` and `/locations`:** every market in one list (`MarketList`),
  decided first; Apply on `/jobs` opens the decided hub (`DecidedApplyLink`).
- **The jobs form's "Where do you live?":** a page with its own market (or
  `?cluster=`) asks its areas; elsewhere the decided market's areas; with
  nothing decided, or torn between two, which market (`market:*` answers).
  The answer files the application under the market named, whatever the page.
- **The language picker** (`src/lib/language-rank.ts`) uses the region and the
  intent a request carries (`?cluster=`, UTM tags); see docs/punjabi-glossary.md.

With no signal, every list is in `MARKET_ORDER` (alphabetical), the header
shows "Locations" and "Jobs", and the form asks which market.

## Signals and weights (`model.ts`)

| Signal | Weight | From |
|---|---|---|
| Explicit pick | decides | An area link in the header, a tap on the `/jobs` or `/locations` list, the jobs form's "Where do you live?", the crew form's site state. Kept 90 days in localStorage. |
| `?cluster=<id>` | 7 | Any URL this session: ads, SMS, shared links |
| Landing page | 6 | The cluster of the session's first page |
| Current page | 5 | The cluster of the page being viewed |
| UTM tags | 4 | Place words in `utm_campaign`, `utm_term`, `utm_content`, `utm_source` (`search_jobs` is the Haridwar campaign; `jobs_jalandhar` the Jalandhar–Kapurthala one) |
| Pages viewed | 1 each, up to 3 | Cluster pages seen this session |
| Region | 3 | The visitor's state and city from the IP (`/api/context`, Vercel or Cloudflare geo headers; no permission asked, nothing stored server-side). The state gives its market (UK/UT → Uttarakhand, PB → Punjab, KA → Bengaluru, DL/HR → Delhi NCR); a city inside a narrower market narrows it (Roorkee → Haridwar, Kapurthala → Jalandhar–Kapurthala; `geoCluster`). IP cities in India are rough, hence the low weight. |

The strongest non-region cluster is the intent. It wins outright when it
agrees with the region, when there is no region, or when it scores at least
twice the region's cluster. Otherwise both show, intent first (for example a
visitor in Bengaluru who opened one Haridwar page). A side only shows markets
that have a page there; with none, that side shows every market.

## Search engines

The server always renders the no-signal page, so a crawler sees the same page
as a visitor with no history; only the order and the area links change after
load. Canonicals never change, and `?cluster=` never creates an indexed URL.

## Measurement

- `area_intent`, once per session per distinct decision: `mode` (default,
  single, both), `intent`, `geo`, `region`, `business`, `jobs`, `confidence`.
- `area_nav_click`: `cluster`, `surface` (business, jobs, jobs-index,
  locations-index), `mode`.
- The jobs form's area answer, stored with each application (`answers.area`,
  and the filed `cluster`).

Umami records the events for every visitor; Google Analytics only with Allow
All. Tune `WEIGHTS` from them: for example, if "both" headers mostly get
clicks on the region's link, the region is under-weighted; if the first item
on `/jobs` is rarely tapped, the decision is wrong more often than it looks.

## Storage and privacy

Session signals live in sessionStorage (gone when the tab closes); only an
explicit pick persists (localStorage, 90 days). The region and city are
fetched once per session and kept in sessionStorage. None of it is sent
anywhere except the anonymous decision above. Counsel should confirm the
privacy notice's description of browser storage covers it.

## Adding a market

Add the cluster to `src/content/registry/clusters.ts` and its pages to the
registry; the header, `/jobs`, `/locations` and the footer pick it up. Add it
to `MARKET_ORDER`, its state or cities to `REGION_CLUSTERS` / `geoCluster`,
its form state to `SITE_STATE_CLUSTERS`, its place words to `UTM_WORDS`, and
its area answers (append-only ids) to rules.ts and quick-apply.ts.
