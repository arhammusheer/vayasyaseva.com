# Area intent: what the site shows

No market is the default (owner direction, 17 Oct 2026). The site decides
per visitor which market(s) to put first, and measures what people pick. The
markets:

| Market (cluster id) | Jobs | Business |
|---|---|---|
| Bengaluru (`bengaluru`) | `/jobs/bengaluru`, worker list | `/locations/bengaluru` |
| Delhi NCR (`delhi-ncr`) | none | `/locations/delhi-ncr` |
| Haridwar (`haridwar`) | `/jobs/haridwar` | `/locations/haridwar` |
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

## Signals and weights (`model.ts`, model version 2)

| Signal | Weight | From |
|---|---|---|
| Pick, this session | 20 | A labelled market link (header area link or menu item, a `/jobs` or `/locations` list item; 90 days in localStorage), or the jobs form's "Where do you live?" (this session only). |
| Pick, earlier session | 12 | The same localStorage pick, made before this session began. |
| `?cluster=<id>` | 7 | Any URL this session: ads, SMS, shared links |
| Landing page | 6 | The cluster of the session's first page |
| Current page | 5 | The cluster of the page being viewed |
| UTM tags | 4 | Place words, as whole words, in `utm_campaign`, `utm_term`, `utm_content`, `utm_source`. A generic campaign name (`search_jobs`) names no market: campaigns carry `cluster=` or a place word (`jobs_jalandhar`). |
| Pages viewed | 1 each, up to 3 | Cluster pages seen this session (by neutral path: one page in two languages counts once) |
| Region | 3 | Indian visitors only (`/api/context` checks the country; PB, UT and KA are codes elsewhere too). The state's market (UK/UT → Uttarakhand, PB → Punjab, KA → Bengaluru, DL/HR → Delhi NCR; UP has none), narrowed by the IP city or a typed place (`geoCluster`, `siteCluster`: accents stripped, old spellings such as Hardwar and Jullundur, Noida and Ghaziabad → Delhi NCR). IP cities in India are rough, hence the low weight. |

Not picks: the unlabelled jobs door ("Jobs"), and the crew form's site state (where the business's site is, not what the visitor wants to see).

A **session** ends after 30 minutes without a page view, or when a URL arrives with new ad or link tags (`gclid`, `gbraid`, `wbraid`, `utm_campaign`, `utm_source`, `cluster`): mobile browsers keep tabs for weeks.

The strongest non-region cluster is the intent. It wins outright unless the region's market or a second intent (an old pick against a fresh ad) has at least half its points; then both show, intent first. Each side then lists up to two markets with a page there: **the page's own market first** (on `/jobs/bengaluru` Bengaluru leads, whatever else happened), then the decision, then a **stand-in** for a market with no page on that side (Punjab's business side is Jalandhar–Kapurthala's page), else the next market by score.

The jobs form's area answers follow the same rules (`areaOptions` in `quick-apply.ts`): the page's or link's market shows its own areas (Haridwar's and Jalandhar's now include the rest of their state, filed under Uttarakhand or Punjab); a decided market shows its areas and **every other market instead of "Outside X"**, so a wrong guess can't file someone as `other`; with nothing decided the form asks which market (alphabetical, "Somewhere else" last). A saved answer stays among the options if the decision moves.

Business leads are filed by `siteCluster`: a place named in the site city, else the sending page's market when it covers the site's state, else the state's market.

## Search engines

The server always renders the no-signal page, so a crawler sees the same page
as a visitor with no history; only the order and the area links change after
load. Canonicals never change, and `?cluster=` never creates an indexed URL.

## Measurement

Events (Umami for every visitor; Google Analytics only with Allow All, about 7% of visitors, so use Umami and the talent database):

- `area_intent`, once per session per distinct decision: `mode`, `intent`, `geo`, `country`, `region` (Indian visitors only), `basis` (the signal that gave the leading market most of its points: chosen, param, landing, page, utm, views, geo, none), `chosen` (yes/no), `business`, `jobs`, `confidence`, `v` (model version; production before this change sent no `v`).
- `area_nav_click`: `cluster`, `surface` (business, jobs, jobs-door, jobs-index, locations-index), `mode`, `decided` (what the site had put first on that side), `is_decided`, `position` (1 = first in the list), `explicit` (yes for labelled market links), `v`.
- `quick_step` with `step=area`: `answer`, `area_source` (page, link, decision, ask), `decided`, `v`.
- `job_form_submit` / `quick_apply_submit`: also `cluster` (the market the application files under) and `area_source`.
- Server `application_received`: also `page_cluster` and `area` (the answer's set: market, haridwar, jalandhar…).
- Page views keep `?cluster=` beside the UTM tags.

Metrics (computable from these, model `v=2` only):

- **Decision accuracy**: of `area_nav_click` with `explicit=yes` and `decided≠none`, the share with `is_decided=yes`. Low means the decision is wrong more often than it looks.
- **First-position tap rate** on `/jobs` and `/locations`: `area_nav_click` with surface jobs-index/locations-index and `position=1`, over all taps there.
- **Form correction rate**: `quick_step` area answers with `area_source=decision` whose answer is a `market:*` id (the person picked another market than the decided one).
- **Basis mix**: `area_intent` by `basis`; weights are tuned where a basis's decisions are often corrected.
- **Demand per market**: `application_received` by `cluster`, or `SELECT cluster, count(*) FROM submissions … GROUP BY 1`.

No report runs these yet; they are Umami event-data queries (`/api/websites/<id>/event-data/values?event=area_nav_click&propertyName=is_decided`, filtered to `v=2`).

## The Umami board "Area intent"

Umami's board tiles count events by name and can't filter on properties, so `src/lib/intent/report.ts` also sends one plainly named event per outcome (Umami only, never GA4 or Meta):

| Board section | Events |
|---|---|
| How the site decided (once per decision) | `intent_by_pick`, `intent_by_link` (?cluster=), `intent_by_ad` (UTM), `intent_by_page` (landing, page, views), `intent_by_location` (IP), `intent_none` |
| What it put first (once per session per market) | `market_shown_<market>` (bengaluru, delhi_ncr, haridwar, jalandhar, punjab, uttarakhand) |
| What visitors picked | `market_chosen_<market>`, plus `market_chosen_other` for "Somewhere else" |
| Was the decision right? | `intent_confirmed` (picked a market the site had put first), `intent_corrected` (picked another), `intent_self_chosen` (nothing had been decided) |

Picks counted: labelled market links (header, `/jobs`, `/locations`) and the jobs form's area answer when the form's options came from the decision or the form asked; an answer on a market's own page or a `?cluster=` link isn't a test of the decision. The board's funnels follow confirmed and corrected decisions to an application. Detail stays in the full events (filter by `v=2` in Umami's Events → Properties).

## Storage and privacy

Session signals live in sessionStorage (gone when the tab closes); only an
explicit pick persists (localStorage, 90 days). The region and city are
fetched once per session and kept in sessionStorage. None of it is sent
anywhere except the anonymous decision above. Counsel should confirm the
privacy notice's description of browser storage covers it.

## Adding a market

Market knowledge lives in one module, `src/markets` (roadmap 1B):

1. **`src/markets/data.ts`**: add the id to `MARKET_IDS` (alphabetical; it
   must already be a stored cluster id in `identifiers.ts`, append-only) and
   one record to `MARKETS`: its `states`, the regions it covers by default
   (`defaultFor.region` for the IP, `defaultFor.siteState` for the crew
   form), its `placeGroups` (city spellings, each group with its region and
   a global `rank`: narrow markets before the rest of their state), its
   `adWords` and `adRank` (UTM and campaign words), its `languageSet` and
   `quickSwitch`, its `sides` and any `standIn`. TypeScript fails until the
   record is complete.
2. **`src/markets/labels.ts`**: its name per language (and `short` if the
   header label differs), and its jobs link label in every language if it
   has a jobs side.
3. **`src/markets/schema-org.ts`**: its schema.org place, if it has a
   business side (required by the type).
4. **`src/markets/places.ts`**: a place id per location page, if it has
   them (stored values, append-only).
5. **Its area answers**: append-only ids `<market>:<area>` to rules.ts
   (`QUICK_ANSWERS.area`, `AREA_CLUSTERS`) and `identifiers.ts`; the form
   order (places in id order, "outside" last) follows from them.

Then add its cluster to `src/content/registry/clusters.ts` and its pages to
the registry; the header, `/jobs`, `/locations` and the footer pick it up.
`tests/markets.spec.mjs` will fail, because a new market moves decisions:
check each moved decision in the diff, then rewrite the snapshot on purpose
(`node scripts/write-behaviour-snapshots.mjs`).

`src/markets/index.ts` holds the queries and is imported by the proxy and
every client bundle: keep labels and schema.org out of it, and never import
the registry, i18n, React or page content into `src/markets`.
