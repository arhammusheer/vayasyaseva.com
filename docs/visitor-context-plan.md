# Visitor context: one system for audience, region and language

Plan, 18 Oct 2026. Replaces the area-intent model (`src/lib/intent`, model 3)
and the separate language ranker (`src/lib/language-rank.ts`) with one engine
that answers three questions for every visitor, on every page:

1. **Who**: a job seeker, a client (buyer), or not known yet.
2. **Where**: the market (and state) they want to see.
3. **Which language**: the order of the picker and the header switch.

Each answer comes with a confidence band. The page uses the band to decide
how strongly to act. Nothing redirects, and no URL or locale changes on its own.

Status (18 Oct 2026): the owner approved all eight decisions in section 11, with a **10%** holdout (not 5%). Built as model 4 on branch feat/visitor-context; the system as built is documented in docs/visitor-context.md. Phases 0–5 shipped together, with no separate shadow week: the 10% holdout and the `area_intent` points give the comparison. Still to do from phase 6: `scripts/context-replay.mjs`, and the Umami board's new `intent_by_arrival` tile.

---

## 1. What is wrong today (audit, 18 Oct 2026)

- **One ad click is counted four times.** `?cluster=` 7 + landing 6 + UTM 4 +
  view 1 = 18 points that last the whole session. A visitor's own pick (20)
  then can't win outright: 21 vs 18 stays "both".
- **Ads show up as "page" on the board.** `basis` takes the single largest
  signal, so a UTM-only ad is reported as `intent_by_page`.
- **The language switch takes the page's market, not the visitor's.** It
  reads `area.jobs[0]`, which is page-first.
- **Hindi drops under "More" in Karnataka.** With no cookie, the region's set
  takes the top three slots ahead of the phone's language.
- **The header changes after load.** Every first page waits for `/api/context`
  before deciding.
- **Job seekers and clients are weighed the same.** A buyer's IP (their head
  office) counts as much as a worker's IP (where they live), and
  the crew form's site state, the strongest business signal there is, counts
  for nothing.
- **Neutral job pages have no visible location choice.** The 10th pass,
  12th pass and fresher pages and the 11 role pages only ask "Where do you live?"
  as the form's last step.

## 2. Principles: how it should feel

1. **What the visitor says beats what we guess, at once and for good.** A
   tapped market, a form answer, a language pick: the site follows it on the
   next paint and does not second-guess it for the rest of the session.
2. **Act only as far as the evidence goes.** Three bands (section 6):
   - *confident*: act directly.
   - *leaning*: put the guess first, keep the alternatives on screen.
   - *unknown*: stay neutral and ask lightly.
3. **Nothing moves after the first paint.** Decide before paint from what is
   already in the browser and the request (section 7), so lists don't reorder
   and links don't change under someone's finger.
4. **Correcting a guess is one tap**, from wherever the guess shows up.
5. **No announcements.** No "We detected you are in…" banners and no pop-ups. At
   most one quiet line where a choice matters ("Jobs near Haridwar ·
   Change"). The owner dislikes clutter (site restructure, 16 Oct).
6. **Crawlers see the neutral page.** Server HTML is always the version with
   no signals. Canonicals don't change. `?cluster=` never makes an indexed URL.
7. **Guesses order things, they never fill in answers.** Inferred values never
   become form answers. The talent pool's area data must be what people said.

## 3. Architecture

```
            request (proxy)                         browser
  ┌──────────────────────────────┐   ┌───────────────────────────────────────┐
  │ geo headers, ?cluster=, UTM, │   │ store (one key, versioned):           │
  │ cookies vs_lang / vs_ctx     │   │   stated picks, session arrival,      │
  │        │                     │   │   views, form answers, audience acts  │
  │        ▼                     │   │        │                              │
  │ resolveContext(server subset)│   │        ▼                              │
  │        │                     │   │ resolveContext(full signals)          │
  │        ├─ picker variant     │   │        │                              │
  │        └─ Set-Cookie vs_geo  │──▶│ boot script (inline, pre-paint):      │
  └──────────────────────────────┘   │   sets <html data-ctx-*>              │
                                     │ React hook useVisitorContext()        │
                                     │ report.ts → Umami (ctx_* events)      │
                                     └───────────────────────────────────────┘
```

One pure function, `resolveContext(signals, page, weights) → VisitorContext`,
runs in both places. The proxy runs it on the signals a request carries. The
browser runs it on everything, which is a superset. Same code, same weights,
same tests.

```ts
type VisitorContext = {
  v: 4;
  audience: { value: "jobs" | "business" | "unknown"; band: Band; basis: AudienceBasis };
  region: {
    markets: string[];          // decided markets, visitor's order (not page-first)
    state?: RegionCode;         // the state, even where no market covers it (MH, UP outside NCR)
    band: Band;
    basis: Family;              // stated | arrival | browsing | ambient
    scores: Record<string, number>;
  };
  language: { order: Locale[]; top: Locale[]; basis: "stated" | "device" | "region" | "page" | "default" };
};
type Band = "stated" | "confident" | "leaning" | "unknown";
```

### Files (`src/context/`, replacing `src/lib/intent`)

| File | Role |
|---|---|
| `signals.ts` | Signal types. Collectors for URL, page, form, link and language events. |
| `store.ts` | One versioned store `vs-ctx-v1` (session + persistent parts). Migrates `vs-area-*` on first read. |
| `weights.ts` | Per-audience weight tables and `CONTEXT_VERSION`. The only file that changes when tuning. |
| `audience.ts` | Who: job seeker, client, unknown. |
| `region.ts` | Where: evidence families, bands, sides, stand-ins. Uses `src/markets` unchanged. |
| `language.ts` | Which language. Folds in `rankLocales`. The proxy keeps importing a light entry point. |
| `resolve.ts` | `resolveContext`: audience first, then region (with that audience's weights), then language (using the region). |
| `boot.ts` | The inline pre-paint script, built to a string at build time (under 3 KB gzipped). |
| `surfaces.ts` | What each market can show on each side (moved from intent). |
| `report.ts` | `ctx_decision`, `ctx_correction` and the board events. |
| `use-context.ts` | `useVisitorContext()`, via `useSyncExternalStore`. The server snapshot is neutral. |

`src/markets` stays the single source of market knowledge, with one addition:
`nearby` per market for job seekers whose market has no jobs hub (section 5.4).

## 4. Who: audience detection

Points per audience. The audience with more points is the decision when it
leads by 4 or more. Otherwise the audience is unknown.

| Signal | Jobs | Business | Notes |
|---|---|---|---|
| Starts the jobs form / the crew form | stated | stated | The strongest act there is |
| Taps the "Jobs" door / "For businesses" door | stated | stated | Labelled doors are statements |
| Current page's audience (registry `audience`) | 5 | 5 | `mixed` pages give 0 |
| Each earlier page's audience this session | 2 (cap 6) | 2 (cap 6) | |
| Arrival from a jobs ad (campaign word `jobs`, a jobs gclid campaign, `?work=`, `?hub=`) | 8 | — | `src/lib/ad-click.ts` has the gclid |
| Arrival on `/contact`, `/services*`, or a business campaign | — | 8 | |
| Picked a non-English language / is on a non-English locale page | 4 | — | Business pages are English-only |
| Phone language is non-English | 1 | — | Weak: Indian phones list hi/en anyway |
| Stated in an earlier session | 6 | 6 | Persisted 90 days |

The audience matters most on **mixed pages** (`/locations/*`, estates, wage pages):
- It picks which weight table region detection uses.
- It picks which side a mixed page's own links emphasise. This part is an owner decision, 11.8.

## 5. Where: region detection

### 5.1 Evidence families: count each fact once

Today every signal adds up, so one arrival counts four times. Signals now sit in
four **families**:

| Family | Contains | How it combines |
|---|---|---|
| **Stated** | Labelled market pick, jobs form area answer, crew form site place, language pick (as a region hint) | A pick this session is **authoritative**: the band is `stated` and the market leads. Older picks are weighted. |
| **Arrival** | `?cluster=`, UTM words, the landing page's market | **Max** of the three, +2 if two or more name the same market |
| **Browsing** | Current page's market, other market pages viewed, wage state pages viewed | Sum with caps |
| **Ambient** | IP city / IP state, phone language | Highest of IP city and IP state, plus phone language |

**Stated** is authoritative only for picks made in this session. A new
arrival (an ad click) starts a new session, so a new ad can still compete
with an older pick. In that case both show.

### 5.2 Weights per audience

Points per market. The unknown audience uses the mean of the two columns.

| Signal | Job seeker | Client | Why they differ |
|---|---|---|---|
| Pick this session | **stated** | **stated** | |
| Pick from an earlier session (90 days) | 12 | 10 | Workers' home markets change less than buyers' projects |
| Jobs form "Where do you live?" (earlier session, 30 days) | 12 | — | New: persisted, since where someone lives is a standing fact |
| Crew form site city/state (earlier session) | — | 14 | New: where the site is *is* the client's market. Approved. |
| Arrival: `?cluster=` | 8 | 8 | |
| Arrival: UTM word | 6 | 6 | |
| Arrival: landing page | 6 | 6 | |
| Arrival: two or more agree | +2 | +2 | |
| Current page's market | 5 | 5 | |
| Other market page viewed | 1 each, cap 3 | **2 each, cap 6** | Buyers compare estates, so browsing is evidence. Workers tap around. |
| Wage page of a state viewed | 1 | **3** | A buyer checking a state's wages likely has a site there |
| IP city names a market | **5** | 1 | A worker's IP is roughly where they live. A buyer's IP is their head office, not the site. |
| IP state only | **3** | 1 | |
| Phone language hint (pa → Punjab, kn → Karnataka) | 2 | 0 | |
| Language picked on the picker (pa, kn) | 3 | 0 | |

### 5.3 Decision and bands

- **Order**: the leader, plus the runner-up if the leader has less than twice
  its points (the current `CLEAR_WIN = 2`, kept). At most two markets.
- **Bands**:
  - *stated*: a pick made this session.
  - *confident*: one market, at least 67% of all points and at least 8 points.
  - *leaning*: the leader has at least 3 points.
  - *unknown*: anything weaker.
- **Ties** break in family order (stated > arrival > browsing > ambient), then by
  `MARKET_ORDER`. This is written down and tested, instead of relying on the
  order signals were added.
- **Sides**: as today, the page's own market leads *its own side's links*. A
  stand-in covers a market with no page on a side. But the decided markets
  (`region.markets`) keep the visitor's order. Language and measurement read
  those, not the page-first side list.
- **`basis`** names the *family* that gave the leader most points, so an ad
  reads as `arrival` whether it carried `?cluster=` or only UTM tags.

### 5.4 Region beyond our markets

`region.state` is kept even when no market covers the state (Maharashtra, UP
outside NCR). With the state known:
- **Job seeker with no market**: neutral page, but the market question lists
  `nearby` markets first (UP West → Haridwar, Uttarakhand, Delhi NCR side;
  Himachal → Punjab, Jalandhar), then the rest. "Somewhere else" stays last.
  Approved.
- **Delhi NCR job seekers** (no jobs hub): the same nearby list, instead of
  nothing.
- **Clients**: the crew form's state list puts the visitor's state among the
  first states. This changes order only and never fills in the state.
- **Wage hub** (`/minimum-wages`): the visitor's state first, for both
  audiences.

### 5.5 Prototype check (18 Oct 2026)

These are the rules above, run as a prototype:

| Audience | Visitor | Scores | Result |
|---|---|---|---|
| Job seeker | Ad to /jobs/jalandhar (`?cluster=`+UTM+landing), IP Ludhiana | Jalandhar 16, Punjab 5 | confident: Jalandhar |
| Job seeker | …then taps Bengaluru | stated | **Bengaluru only** (today: both, for the rest of the session) |
| Job seeker | Next day a Haridwar ad, old pick Bengaluru | Haridwar 16, Bengaluru 12 | leaning: both, Haridwar first |
| Job seeker | Organic /jobs/10th-pass, IP Roorkee | Haridwar 5 | leaning: Haridwar first, others shown |
| Job seeker | Viewed /jobs/haridwar, then 10th-pass, IP Bengaluru | Haridwar 7, Bengaluru 5 | leaning: both |
| Client | Mumbai buyer lands on /locations/haridwar from Google | Haridwar 13 | confident: Haridwar |
| Client | IP Bengaluru, homepage only | Bengaluru 1 | **unknown**: neutral (today: Bengaluru) |
| Client | Read 3 Delhi NCR estates, IP Haridwar, now on /contact | Delhi NCR 12, Haridwar 1 | confident: Delhi NCR |
| Client | Sent a crew form for a Punjab site last week | Jalandhar 14 | confident: Jalandhar |

These become the golden tests (`tests/context.spec.mjs`), with the current
market behaviour snapshot extended per audience.

## 6. What each band does on the page

| Surface | stated / confident | leaning | unknown |
|---|---|---|---|
| Header jobs door, Apply | The market's hub | `/jobs`, market first | `/jobs`, `/jobs/apply` |
| Header business area slot | The market's buyer page | The two markets' pages | "Locations" |
| `/jobs`, `/locations`, jobs menu | Market first | Market(s) first | Alphabetical |
| **Neutral job pages: "Jobs in" row** (6.1) | Market first, marked as current | Market(s) first | Top three by nearby/alphabetical, "More places" |
| Jobs form "Where do you live?" | Market's areas + every other market | Same | Which market (nearby first if the state is known) |
| Crew form state list | Market's states first | Same | Published states first (today) |
| Wage hub | Visitor's state first | Same | Today's order |
| Language picker / switch | Section 8 | Section 8 | Section 8 |

### 6.1 Neutral job pages (10th pass, 12th pass, freshers, role pages, /jobs/apply)

New: a compact **"Jobs in" row** at the top of the form column, one line:

> Jobs in **Haridwar** · Bengaluru · Jalandhar · More places

- Ordered by the region decision. Up to three markets, then "More places"
  (a disclosure listing every market with a jobs hub, plus nearby for
  uncovered states).
- Tapping a market is a **stated pick**. It also sets the form's area step to that
  market's areas, so the form stops asking which market. The page doesn't
  navigate: the role or qualification stays, and the market comes with it.
  The market's hub is one link away in the disclosure.
- On *stated/confident* the first market is shown as current ("Jobs in
  Haridwar · Change"), so the row reads as one quiet line.
- Rendered as plain links, all present in the server HTML (crawlable, no
  layout shift). Order and current state come from CSS `[data-ctx-*]`
  attributes set before paint (section 7).
- Measurement: `ctx_correction` when a tap differs from the decided lead,
  `ctx_confirm` when it agrees.

This turns the market question into something people can see and correct
early, instead of a surprise at the form's last step. The form's area step
stays last. Its options follow the row.

## 7. No layout shift: deciding before paint

1. **The proxy sets `vs_geo`**: a session cookie with the region and city code,
   Indian visitors only, `SameSite=Lax`, no other data. It is set on the first
   response of a session. This removes the `/api/context` round trip. The
   endpoint stays as a fallback when the cookie is missing. Approved.
2. **Stated picks are mirrored to a cookie `vs_ctx`** (market, audience, form
   answer market, at most about 80 bytes). The proxy can then use them for the
   language picker, and the picker and header agree.
3. **The inline boot script** in `<head>` runs before first paint:
   - It reads `vs_ctx`, `vs_geo` and session storage.
   - It runs the resolver's small core.
   - It sets `data-ctx-aud`, `data-ctx-jobs`, `data-ctx-business`,
     `data-ctx-band`, `data-ctx-lang` on `<html>`.
4. **Ordering is done with CSS from those attributes.** Every candidate is in
   the server HTML. Generated rules (6 markets × a few surfaces) set `order`
   and show or hide header slot variants and the "Jobs in" current state. There
   is no React re-render to reorder.
5. **React reads the same snapshot** through `useSyncExternalStore`. The server
   snapshot stays neutral, so hydration matches. Then the client snapshot takes
   over for interactive parts: the form's options, which appear only at the last
   step.
6. **The decision is frozen once someone interacts.** After the first tap or
   keypress on a page, later recomputation (a late geo answer) can't reorder
   what is on screen. It applies from the next page on.

Check: Umami's performance data shows no CLS added on pages with lists, and a
Playwright test with a slowed network compares screenshots before and after
hydration.

## 8. Which language

Owner rules that stay:
- Auto-detection only on the picker.
- Locale URLs never switch.
- English always among the top three.
- The quick switch shows the region's languages.
- Latin variants only where people use them.

One ranking feeds the picker (proxy) and the header switch (browser). Points
per locale, for the two slots next to English:

| Signal | Points |
|---|---|
| Language cookie (picked on the picker) | stated: first |
| Phone language, deliberate (pa, kn, ta, mr…) | 6 |
| Phone language hi | 3 (Indian phones list it whatever the person reads) |
| Region decision's language set, 1st / 2nd entry, confident or stated | 6 / 3 |
| Same, leaning | 4 / 2 |
| IP state's set when there is no region decision | 4 / 2 |
| Page's own market set (fills gaps) | 2 / 1 |
| Default set | 1 |

The two highest go next to English. Ties go to the region (owner direction,
17 Oct: location weighs more). Results:
- **Punjab IP** → ਪੰਜਾਬੀ · Hinglish · English (as today).
- **Bengaluru IP with a Hindi phone** → ಕನ್ನಡ · हिंदी · English. Today Hindi
  goes under More. Approved.
- **Visitor who picked Punjab, on any page** → Punjab's set, not the page's
  market.

The proxy sees the cookie, `vs_ctx`, URL intent, geo and Accept-Language,
which is everything except browsing. So the picker and the header switch
disagree only when browsing has moved the decision, and the header then shows
the browser's order.

## 9. Measurement and tuning

### Events (Umami, `v=4`)

- `ctx_decision` (once per session per distinct decision): `aud`, `aud_band`,
  `markets`, `band`, `basis` (family), `state`, `lang_top`, `lang_basis`,
  plus each family's points for the leader (`pts_stated`, `pts_arrival`,
  `pts_browsing`, `pts_ambient`) so weights can be replayed.
- `ctx_confirm` / `ctx_correction` / `ctx_self_chosen`: every explicit pick
  (row, header, lists, form area answer, language picker), with what was
  decided and its band. These replace `intent_confirmed` / `intent_corrected`.
- Board events keep their names (`intent_by_*` becomes `ctx_by_<family>`), and the board gets a
  per-band split.
- Server `application_received` / `enquiry_received` add `ctx_band`,
  `ctx_basis`, `aud`. This lets the talent database show which decisions
  produce applications.

### Ground truth and targets

| Metric | Truth | Target (first 4 weeks, v4) |
|---|---|---|
| Accuracy, confident | Explicit picks agreeing with a confident decision | ≥ 85% |
| Accuracy, leaning | Pick is one of the two shown | ≥ 70% |
| Form area correction rate | `market:*` answers against a decided market | ≤ 10% |
| Audience accuracy | Form started vs decided audience | ≥ 90% when decided |
| Ask rate (Indian job seekers) | Unknown band share | ≤ 30% |
| Layout shift from context | CLS on pages with lists | 0 |
| Picker first-choice rate | `language_choice.position = 1` | ≥ 70% |

### Tuning loop

- `scripts/context-replay.mjs` pulls `ctx_decision` + picks from Umami and
  recomputes decisions under candidate weights. It scores each candidate against
  the truth above and prints a diff per scenario.
- Weights change only through `weights.ts`, with a `CONTEXT_VERSION` bump and
  the golden tests rewritten on purpose (as `markets.spec.mjs` works today).
- Review after about 500 decided sessions per audience, then monthly.
- **Holdout** (owner decision 11.6): 5% of sessions get the neutral page
  whatever the signals, to measure whether personalisation lifts
  applications and enquiries at all.

## 10. Phases

Each phase is one PR (or two), shippable alone, behind the same tests.

| # | Phase | Contents | Size |
|---|---|---|---|
| 0 | **Quick fixes on model 3** | Arrival counted once (max + agree), a stated pick this session authoritative, `basis` by family, language reads the visitor's order. `MODEL_VERSION` 4 → ships the audit's fixes before the rebuild. | S |
| 1 | **Core engine, shadow mode** | `src/context/` with audience, region and language resolvers, weights, store migration, golden tests. It runs beside model 3 and logs `ctx_shadow` (agree/disagree), with no UI change. One week of data. | L |
| 2 | **Pre-paint** | Proxy `vs_geo` + `vs_ctx` cookies, boot script, CSS ordering for header slots and market lists, decisions frozen after interaction, CLS test. The switch from model 3 to the new engine happens here. | M |
| 3 | **Neutral job pages** | "Jobs in" row on qualification hubs, role pages and `/jobs/apply`. Form area step follows the row. Nearby markets for uncovered states. | M |
| 4 | **One language ranking** | Picker and header on `language.ts`, device-language slot, picks mirrored into `vs_ctx`, proxy reads them. | M |
| 5 | **Business side** | Audience weights live, crew form site place as client evidence, crew form state order, wage hub state order, mixed-page emphasis (if approved). | M |
| 6 | **Measurement and tuning** | `ctx_*` events, Umami board update, `context-replay.mjs`, holdout (if approved), docs (`area-intent.md` → `visitor-context.md`). | M |

Before the first deploy of phase 2: the privacy notice describes the two
cookies and the stored picks (consent-version rule), with counsel's
paragraph on browser storage, which is already pending.

## 11. Owner decisions (all approved 18 Oct 2026; holdout 10%)

1. **Geo cookie.** The proxy sets `vs_geo` (state and city code, session
   only), so decisions happen before paint. The data is what `/api/context`
   already returns, but it is a new cookie: notice update and, by your
   consent-version rule, a version bump.
2. **Stated picks are authoritative for the session.** Replaces "a pick is a weight,
   not an override" (PR #50). A *new* ad arrival still competes, because it
   starts a new session.
3. **Remember the jobs form area answer for 30 days** (today: this session only).
4. **The crew form's site place counts as client intent.** Reverses part
   of the 17 Oct rule ("crew site state is not a pick"). Proposed as a strong
   weight (14) on the client side only, not as stated.
5. **Nearby markets for job seekers we don't cover** (UP West, Himachal,
   Delhi NCR): show the nearest markets first, or keep the neutral list?
6. **Holdout** with no personalisation, to measure lift: approved at **10%**.
7. **Phone language gets a top-three slot** (Hindi phone in Bengaluru →
   ಕನ್ನಡ · हिंदी · English), or keep location ahead of everything.
8. **Mixed pages follow the audience**: on `/locations/*` and estates, a
   decided job seeker sees the jobs line ahead of "Request a crew". Copy and
   layout stay the same, only the emphasis changes.
