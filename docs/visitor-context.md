# Visitor context: who, where, which language

One engine (`src/context/`, model version 4 since 18 Oct 2026) decides for
every visitor:

1. **Who**: a job seeker, a client, or not known yet.
2. **Where**: the market(s) to put first, and the visitor's state even
   where no market covers it.
3. **Which language**: the order of the language picker and the header switch.

No market is the default (owner direction, 17 Oct 2026). The site decides
what to put first and measures what people pick. Owner decisions of
18 Oct 2026 shape it (docs/visitor-context-plan.md §11):
- A pick this session is authoritative.
- The `vs_geo` cookie lets the page decide before paint.
- The jobs form's area answer is kept 30 days.
- The crew form's site place is client evidence.
- Job seekers outside our markets see nearby markets first.
- A **10% holdout** sees the neutral site.
- The phone's language always gets a picker slot.
- Location pages put the jobs button first for a decided job seeker.

| Market (cluster id) | Jobs | Business |
|---|---|---|
| Bengaluru (`bengaluru`) | `/jobs/bengaluru`, worker list | `/locations/bengaluru` |
| Dehradun (`dehradun`, since 18 Oct 2026) | `/jobs/dehradun`, worker list | `/locations/dehradun` (Selaqui under it) |
| Delhi NCR (`delhi-ncr`) | none (nearby: Haridwar, Uttarakhand) | `/locations/delhi-ncr` |
| Haridwar (`haridwar`) | `/jobs/haridwar` | `/locations/haridwar` |
| Jalandhar–Kapurthala (`jalandhar`) | `/jobs/jalandhar` | `/locations/jalandhar` |
| Punjab outside it (`punjab`) | `/jobs/punjab`, worker list | none (Jalandhar's page stands in) |
| Uttarakhand outside Haridwar and Dehradun (`uttarakhand`) | `/jobs/uttarakhand`, worker list | `/locations/uttarakhand` |

## The pieces

| File | Role |
|---|---|
| `core.ts` | `resolveContext(signals, tables)`: pure and self-contained. The proxy, the boot script, the runtime and the tests all run it. |
| `collect.ts` | `collectSignals`: one page view's signals from the URL, cookies, session and browser languages. Pure and self-contained. |
| `weights.ts` | Every weight, the bands, pick lifetimes, the holdout share and `CONTEXT_VERSION`. The only file tuning touches. |
| `tables.ts` | The tables `core` and `collect` read, built from `src/markets` and the registry. |
| `attrs.ts`, `css.ts` | The `<html data-ctx-*>` attributes and the generated CSS that applies them. |
| `boot.ts` | The pre-paint script inlined in every page's `<head>` (root and picker layouts). |
| `runtime.ts`, `use-context.ts` | The browser after hydration (navigation, picks, the IP fallback), and the React hook. |
| `report.ts` | Analytics events. |
| `geo.ts` | The `vs_geo` cookie, which the proxy (`src/proxy.ts`) sets. |
| `surfaces.ts` | Market links and labels for the surfaces. |

Market knowledge stays in `src/markets` (places and ad words, regions,
stand-ins, `NEARBY`, language sets in `languages.ts`).

## Who: audience

| Signal | Job seeker | Client |
|---|---|---|
| A door ("Jobs", "For businesses", Apply, Request a crew) or a form started, this session | stated | stated |
| The same from an earlier session (90 days) | 6 | 6 |
| Current page's audience (registry `audience`; `mixed` gives 0) | 5 | 5 |
| Earlier pages this session | 2 each, max 6 | 2 each, max 6 |
| Arrival from a jobs ad (campaign words *job, jobs, naukri, vacancy, bharti, hiring, career*; `?work=`, `?hub=`, `?role=`) | 8 | — |
| Arrival from a business ad (*crew, manpower, contractor, staffing, outsourcing, b2b*) | — | 8 |
| A non-English page or picked language (business pages are English only) | 4 | — |
| A non-English phone language | 1 | — |

The leader decides when it is 4 or more ahead; otherwise the audience is
unknown, and region detection uses the mean of the two weight columns.

## Where: region

Signals sit in four **families**, so one fact counts once:

| Family | Signal | Job seeker | Client |
|---|---|---|---|
| **Stated** | A labelled market link, the "Jobs in" row, or the jobs form's area answer, this session | **decides** | **decides** |
| | A labelled link from an earlier session (90 days) | 12 | 10 |
| | The jobs form's area answer, earlier session (30 days) | 12 | 0 |
| | The crew form's site place (90 days, any session) | 0 | 14 |
| **Arrival**: the strongest one counts | `?cluster=<market>` | 8 | 8 |
| | Market words in UTM tags | 6 | 6 |
| | The landing page's market | 6 | 6 |
| | Two or more sources agree | +2 | +2 |
| **Browsing** | Current page's market | 5 | 5 |
| | Market pages viewed (by neutral path) | 1 each, max 3 | 2 each, max 6 |
| | State wage pages viewed (the state's market) | 1 each, max 2 | 3 each, max 6 |
| **Ambient** | IP city names a market | 5 | 1 |
| | IP state only | 3 | 1 |
| | Phone language hints a market (kn → Bengaluru, pa → Punjab) | 2 | 0 |
| | Language picked on the picker (same hints) | 3 | 0 |

**Notes on the families:**
- **Arrival**: one ad click counts once. Model 3 counted `?cluster=`, the
  landing page, UTM and the view all at once: 18 points, which a pick
  couldn't beat.
- **Ambient**: IP region for Indian visitors only (PB, UT and KA are codes
  elsewhere too). The city narrows the state through `geoMarket`. IP cities in India are rough.
- **Sessions** end after 30 idle minutes, or when a URL arrives with new ad
  or link tags (`gclid`, `gbraid`, `wbraid`, `utm_campaign`, `utm_source`,
  `cluster`). So a new ad starts a new session, and an older pick then
  competes as a weight.

### One vocabulary per market

Each market has one list of words (`placeGroups` in `src/markets/data.ts`),
used three ways:
- **An IP city** must be exactly one word ("Roorkee").
- **A typed site city** contains one as whole words ("SIDCUL Haridwar").
- **A UTM tag or campaign name** contains one as whole words, with `_` and
  `-` read as spaces ("jobs_sidcul_haridwar").

Groups are tried in `rank` order:
1. Narrow places first (Haridwar before the rest of Uttarakhand).
2. Then the state names.
3. Then Delhi's and Haryana's towns.
4. Then "NCR".

A generic campaign name (`search_jobs`) names no market. Campaigns carry
`cluster=` or a place word. Uttarakhand's old code UT is read as UK
everywhere (`REGION_ALIASES`).

### Decision and bands

- **Stated**: a pick this session. Its market leads, alone.
- **Order**: the leader, plus the runner-up when the leader has less than
  twice its points. At most two markets.
- **Confident**: one market, at least 67% of all points and at least 8 points.
- **Leaning**: the leader has at least 3 points.
- **Unknown**: anything weaker. Nothing is put first.
- **Ties** break by family (stated, arrival, browsing, ambient), then `MARKET_ORDER`.
- **`basis`** is the family that gave the leader most points. `arrival`
  also says which source (`param`, `utm`, `landing`).

**Sides.** Each side (business, jobs) lists up to two markets with a page
there:
1. The page's own market first (on `/jobs/bengaluru` Bengaluru leads,
   whatever else happened).
2. Then the visitor's markets.
3. Then a stand-in for a market with no page on that side (Punjab's
   business side is Jalandhar–Kapurthala's page).

The visitor's own order (`region.markets`) is kept separately, for language
and measurement.

**Nearby** (job seekers): when the visitor's state has no market (UP outside
NCR, Himachal, J&K, Chandigarh, the south) or their market has no jobs hub
(Delhi NCR), `NEARBY` markets are listed first. This is an order hint, never a
decision: the jobs door and Apply stay on `/jobs`.

**Holdout**: 10% of sessions (drawn at session start) get neutral sides, so
nothing inferred is put first. A pick and the page's own market still
apply. The decision is still computed and reported (`holdout=yes`), so the
two groups compare like for like.

## What follows the decision

| Surface | stated / confident | leaning | unknown |
|---|---|---|---|
| Header jobs door | The market's hub ("Jobs") | Labelled doors ("Jobs in Haridwar") | `/jobs` |
| Header Apply | The market's hub (or the page's own) | `/jobs/apply` | `/jobs/apply` |
| Header business area slot | The market's buyer page(s) | Same | "Locations" |
| `/jobs`, `/locations`, jobs menu | Decided first, then nearby, then alphabetical | Same | Alphabetical (nearby first) |
| "Jobs in" row on neutral job pages | That market, marked as current | The market(s) and nearby | Every market |
| Jobs form "Where do you live?" | The market's areas, then every other market | Same with one market; with two, which market, theirs first | Which market (nearby first) |
| Crew form state list | The markets' states first | Same | Published states, alphabetical |
| Location pages (not Hindi) | Jobs button first for a job seeker | Same | Request a crew first |

**The "Jobs in" row** sits on the 10th pass, 12th pass and fresher hubs,
the role pages and `/jobs/apply` (not with `?cluster=`):
- It reads "Jobs in Haridwar · More places".
- A tap is a stated pick. The page stays, and the form below asks that
  market's areas.
- "More places" links every hub.

**The language picker** and the header switch use the same ranking. See
"Which language" below.

## Before paint

Nothing moves after the first paint:

1. **The proxy** sets `vs_geo` ("IN.UK.haridwar.c": country, state, market,
   city or state level), for the browser session, only when it is missing
   or changed. It never stores the city name.
2. **The boot script** in `<head>` reads the URL, `vs_ctx`, `vs_geo`, the
   session and `navigator.languages`, runs `collectSignals` and
   `resolveContext`, and sets `data-ctx-*` on `<html>` (`attrs.ts`).
3. **Every surface renders all its candidates** in the server HTML (every
   buyer page in the area slot, every door, every Apply target, every
   market in a list, every language in the bar and under More). The
   generated CSS (`css.ts`) hides or orders them from the attributes. The
   rules only hide (`display: none`) or set `order`, so each element keeps
   its own styles. Without the attributes (crawlers, a blocked script),
   each surface shows its neutral version.
4. **React never reorders those surfaces.** It reads the context at click
   time (`currentContext()`). `useVisitorContext()` (server snapshot: null)
   serves parts that render on interaction: the menu sheet, the jobs form's
   area answers, the crew form's state order.
5. **The runtime** takes over after hydration. It recomputes on client
   navigations and after a pick. A late answer (the `/api/context` fallback,
   used only without `vs_geo`) after the first tap or key press waits for
   the next page.

The server always renders the no-signal page, so crawlers see the same
page as a visitor with no history. Canonicals never change, and
`?cluster=` never creates an indexed URL.

## Which language

The picker's precedence (PLAN §6.4, owner directions of 17 Oct 2026) is
unchanged:
1. The `vspl_lang` cookie.
2. With no pick and no intent, the IP state's set (Indian phones list Hindi
   or English whatever the person reads).
3. The browser's non-English languages.
4. The intent's set.
5. The state's set (outside India, the default set).
6. The page's market's set.
7. The default.

**What is new in model 4:**
- **Intent** is the visitor's decided market when a pick, an arrival or
  browsing beyond the page decided it, never the IP alone. The page's own
  market only fills gaps. The proxy sees picks through the `vs_ctx` cookie.
- **The top three** always include English, and the phone's first language
  the page has (owner decision 7). A Hindi phone in Karnataka sees
  ಕನ್ನಡ · English · हिंदी on `/jobs`.
- **The header switch** shows the visitor's order before paint
  (`data-ctx-lr-<code>`). On a non-English page English stays among the
  first two.

Locale URLs never switch. Detection happens only on the picker.

## Measurement

Events (Umami for every visitor; Google Analytics only with Allow All, about
7% of visitors, so use Umami and the talent database):

- `area_intent`, once per session per distinct decision. Properties:
  - The decision: `v` (4), `mode`, `band`, `intent`, `second`, `basis`, `arrival`, `confidence`.
  - The audience: `aud`, `aud_stated`.
  - The IP: `geo`, `country`, `region`.
  - The sides: `business`, `jobs`, `nearby`.
  - The leader's points per family, for replay: `pts_stated`, `pts_arrival`, `pts_browsing`, `pts_ambient`.
  - The language: `lang`, `lang_basis`.
  - The holdout: `holdout`.
- `area_nav_click`: `cluster`, `surface` (business, jobs, jobs-door, jobs-index, locations-index, jobs-row), `mode`, `band`, `decided`, `is_decided`, `position`, `explicit`, `v`.
- `quick_step` with `step=area`: `answer`, `area_source` (page, link, decision, ask), `decided`, `band`, `v`.
- `job_form_submit` / `quick_apply_submit`: also `cluster`, `area_source`, `band`, `holdout`.
- Server `application_received`: also `page_cluster` and `area`.

Compare a metric within one model version (`v`): 2 until 17 Oct 2026, 3 until 18 Oct 2026, **4** from then.

Metrics (from these, `v=4`):

- **Decision accuracy** by band: of `area_nav_click` with `explicit=yes`
  and `decided≠none`, the share with `is_decided=yes`. Targets: 85% or more
  when confident, 70% or more when leaning.
- **Form correction rate**: `quick_step` area answers with
  `area_source=decision` whose answer is another market's. Target: 10% or less.
- **Lift**: applications and enquiries per session, `holdout=no` against
  `holdout=yes` (`quick_apply_submit` and `generate_lead` by session).
- **Basis mix**: `area_intent` by `basis` and `band`. Weights are tuned
  where a basis's decisions are often corrected.
- **Demand per market**: `application_received` by `cluster`.

Weights are tuned only in `weights.ts`, with a `CONTEXT_VERSION` bump and
the golden scenarios in `tests/context.spec.mjs` rewritten on purpose.

### Tuning with the replay

`pnpm context:replay` (`scripts/context-replay.mjs`) rebuilds real sessions
from Umami and decides them again under candidate weights. It scores each
candidate on the metrics above (by band, with 95% intervals, against the
targets) and lists the decisions a candidate changes, grouped by scenario
("arrival param haridwar · jobs page · IP IN/UP · picked bengaluru").

```
pnpm context:replay --save ~/vspl-replay.json        # last 28 days, current weights
pnpm context:replay --from ~/vspl-replay.json --set jobs.ipCity=4
pnpm context:replay --from ~/vspl-replay.json --candidate try.json --json out.json
```

A candidate file names only what it changes (`{ "name": "…", "jobs": {
"ipCity": 4 }, "bands": { "confidentPoints": 7 } }`). The groups are `jobs`,
`business`, `audience`, `bands` and `days`, and an unknown name is an error.

It needs no new collection. Pageviews (path and query) go through
`collectSignals` in order. The IP region comes from `area_intent`'s geo
props, the browser language from Umami's session, and picks and audience
from the events sent when they happen: `market_chosen_*`, `quick_step` area
answers, `area_nav_click`, `job_form_start`, `contact_form_start` and
`language_choice`. Only sessions with decisions from the current
`CONTEXT_VERSION` are replayed.

**Check the rebuild first.** The report starts with the share of logged
`area_intent` decisions the rebuild reproduces with today's weights, and
the commonest misses. Below 90%, read the misses before trusting the
scores. Known gaps:

- Each tab has its own session, but Umami can't see tabs. A page opened in
  a new tab starts afresh on the site and not in the rebuild.
- Picks from another Umami session (another device or month) are not seen.
- The crew form's site place (`contact_form_step` carries no place).
- Browser languages after the first.
- Header doors that send no event ("Apply", "Request a crew").

**Truth.** Holdout sessions are the cleanest truth, because nothing was
ordered for them; the report shows them on their own row. A form answer
after a pick in the same session is counted as "already picked", not as a
test of the guess. Review after about 500 decided sessions per audience,
then monthly.

The dump holds pseudonymous Umami session ids, paths, queries and event
props. Keep it outside the repo and delete it when tuning is done.

## The Umami board "Area intent"

Umami's board tiles count events by name and can't filter on properties,
so `src/context/report.ts` also sends one plainly named event per outcome
(Umami only, never GA4 or Meta):

| Board section | Events |
|---|---|
| How the site decided (once per decision) | `intent_by_pick` (stated), `intent_by_arrival` (an ad or tagged link: `?cluster=`, UTM, landing page), `intent_by_page` (browsing), `intent_by_location` (IP, phone language), `intent_none` |
| What it put first (once per session per market) | `market_shown_<market>` (bengaluru, dehradun, delhi_ncr, haridwar, jalandhar, punjab, uttarakhand) |
| What visitors picked | `market_chosen_<market>`, plus `market_chosen_other` for "Somewhere else" |
| Was the decision right? | `intent_confirmed` (picked a market the site had put first), `intent_corrected` (picked another), `intent_self_chosen` (nothing had been decided) |

Model 4 replaces model 3's `intent_by_link` and `intent_by_ad` with
`intent_by_arrival`. The board needs that tile. The decision events carry
`band` and `holdout`, the choice events `band`.

## Storage and privacy

| Where | Key | What | How long |
|---|---|---|---|
| Cookie | `vs_ctx` | Picks, one per kind (`l` link, `a` form area, `s` crew site, `u` audience), with times | 90 days (form area counts 30) |
| Cookie | `vs_geo` | IP country, state, market, level | Browser session |
| sessionStorage | `vs-ctx-session-v1` | This session: arrival, views, wage views, pages by audience, holdout | The tab |
| sessionStorage | `vs-ctx-geo-v1` | The `/api/context` fallback | The tab |
| sessionStorage | `vs-ctx-reported-v1` | Which events this tab has sent | The tab |

Model 3's keys (`vs-area-*`) are migrated once (the localStorage pick
becomes a `vs_ctx` link pick) and removed.
- The privacy notice describes all of this in §2, "Where you want to work or
  hire" (consent version 9, ledger.ts).
- The server reads the cookies only to order the language picker.

## Adding a market

Market knowledge lives in `src/markets`:

1. **`src/markets/data.ts`**:
   - Add the id to `MARKET_IDS` (alphabetical; it must already be a stored
     cluster id in `identifiers.ts`, append-only).
   - Add one record to `MARKETS`: its `states` and `defaultStates`, its
     `placeGroups` (with a global `rank`), its `languageSet` and
     `quickSwitch`, its `sides` and any `standIn`.
   - Add it to `NEARBY` where it is the nearest market for an uncovered
     state.
2. **`src/markets/labels.ts`**: its names, and its jobs link label in
   every language if it has a jobs side.
3. **`src/markets/schema-org.ts`**: its schema.org place, if it has a business side.
4. **`src/markets/places.ts`**: a place id per location page.
5. **Its area answers** in rules.ts and identifiers.ts (append-only).

Then add its cluster to `src/content/registry/clusters.ts` and its pages to
the registry. The header, the lists, the "Jobs in" row and the CSS pick it up.
- `tests/markets.spec.mjs` and `tests/context.spec.mjs` will fail where
  decisions moved.
- Check each one, then rewrite the snapshot on purpose
  (`node scripts/write-behaviour-snapshots.mjs`) and bump `CONTEXT_VERSION`.

`src/context/core.ts`, `collect.ts` and `attrs.ts` are inlined into the
boot script with `Function.prototype.toString`. Keep them self-contained:
no runtime imports, helpers nested inside the function. The boot test runs
the script in a bare sandbox.
