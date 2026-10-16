# Area intent: what the header shows

The header names an area: the business bar's area link (Haridwar SIDCUL,
Bengaluru, Delhi NCR…) and the jobs door and Apply on the jobs side. Which
area is decided per visitor, after the page loads, from what the visitor did
and how they arrived, then where they are (`src/lib/intent/`).

## Signals and weights (`model.ts`)

| Signal | Weight | From |
|---|---|---|
| Explicit pick | decides | An area link in the header, the jobs form's "Where do you live?", the crew form's site state. Kept 90 days in localStorage. |
| `?cluster=<id>` | 7 | Any URL this session: ads, SMS, shared links |
| Landing page | 6 | The cluster of the session's first page |
| Current page | 5 | The cluster of the page being viewed |
| UTM tags | 4 | Place words in `utm_campaign`, `utm_term`, `utm_content`, `utm_source` (`search_jobs` means Haridwar) |
| Pages viewed | 1 each, up to 3 | Cluster pages seen this session |
| Region | 3 | The visitor's state from the IP (`/api/context`, Vercel geo headers; no permission asked, nothing stored server-side). UK/UT → Haridwar, KA → Bengaluru, DL/HR → Delhi NCR |

The strongest non-region cluster is the intent. It wins outright when it
agrees with the region, when there is no region, or when it scores at least
twice the region's cluster. Otherwise the header shows **both**, intent first
(for example a visitor in Bengaluru who opened one Haridwar page). A side only
shows clusters that have a page there (Bengaluru appears on the jobs side once
it has a jobs hub, on the business side once it has a buyer page); anything
else falls back to Haridwar. With no signal at all the header shows Haridwar.

## Search engines

The server always renders the no-signal default, so a crawler sees the same
page as a visitor with no history; only the header's area links change after
load. Canonicals never change, and `?cluster=` never creates an indexed URL
(every page's canonical is its clean URL).

## Measurement

- `area_intent`, once per session per distinct decision: `mode` (default,
  single, both), `intent`, `geo`, `region`, `business`, `jobs`, `confidence`.
- `area_nav_click`: `cluster`, `surface` (business or jobs), `mode`.

Umami records them for every visitor; Google Analytics only with Allow All.
Tune `WEIGHTS` from them: for example, if "both" headers mostly get clicks on
the region's link, the region is under-weighted.

## Storage and privacy

Session signals live in sessionStorage (gone when the tab closes); only an
explicit pick persists (localStorage, 90 days). The region is fetched once per
session and kept in sessionStorage. None of it is sent anywhere except the
anonymous decision above. Counsel should confirm the privacy notice's
description of browser storage covers it.

## Adding an area

Add the cluster to `src/content/registry/clusters.ts` with its pages; the
header picks it up. Add its region code to `REGION_CLUSTERS`, its form state to
`SITE_STATE_CLUSTERS` and its place words to `clustersInUtm` in `model.ts`.
