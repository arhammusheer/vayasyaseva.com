/**
 * Visitor context: who the visitor is, where they want to see and which
 * language they read (docs/visitor-context.md). One pure function,
 * resolveContext, used by the proxy (the signals a request carries), the
 * pre-paint boot script (src/context/boot.ts), the React hook and the tests.
 *
 * Self-contained on purpose: no imports at run time and every helper nested
 * inside the function, because the boot script inlines it with
 * Function.prototype.toString. Everything it knows about markets and
 * languages comes in `t` (tables.ts builds it from src/markets); the weights
 * are in weights.ts.
 *
 * Rules (owner decisions, 18 Oct 2026):
 * - Signals sit in families. A pick made this session is authoritative
 *   ("stated"). One arrival counts once: the largest of ?cluster=, UTM words
 *   and the landing page, plus a bonus when two agree.
 * - Job seekers and clients have their own weights: a worker's IP is near
 *   where they live, a buyer's is their head office; a buyer's browsing and
 *   the crew form's site place say where their site is.
 * - The band says how far the page may act: stated and confident act,
 *   leaning puts the guess first beside the others, unknown stays neutral.
 * - The holdout (10% of sessions) sees the neutral site whatever was
 *   inferred; stated picks and the page's own market still apply.
 * - Guesses order things; they never become form answers.
 */

export type Audience = "jobs" | "business" | "unknown";
export type PageAudience = "jobs" | "business" | "mixed";
export type Band = "stated" | "confident" | "leaning" | "unknown";
export type Family = "stated" | "arrival" | "browsing" | "ambient" | "none";
export type ArrivalSource = "param" | "utm" | "landing";
export type Side = "business" | "jobs";

/**
 * A market the visitor picked, remembered in the vs_ctx cookie (store.ts):
 * a labelled market link, the jobs form's "Where do you live?" answer, or
 * the crew form's site place (client evidence, never authoritative).
 */
export type Pick = { kind: "link" | "answer" | "site"; market: string; at: number };

export type ContextSignals = {
  now: number;
  /** When this session began (store.ts: 30 idle minutes or a new arrival start a new one). */
  sessionStart: number;
  page: {
    /** The page's own market (registry `cluster`), when it is a market. */
    market?: string;
    audience: PageAudience;
    /** The page's language and the languages it is published in. */
    locale: string;
    locales: readonly string[];
  };
  picks?: readonly Pick[];
  /** The last door or form that said who the visitor is ("Jobs", "For businesses", a form started). */
  audiencePick?: { audience: "jobs" | "business"; at: number };
  /** How this session arrived: the markets its URL named and its landing page's market. */
  arrival?: { param?: string; utm?: readonly string[]; landing?: string; audience?: "jobs" | "business" };
  /** Market pages viewed this session (the current one included), by market. */
  views?: Readonly<Record<string, number>>;
  /** State wage pages viewed this session, by the state's market. */
  wageViews?: Readonly<Record<string, number>>;
  /** Earlier pages this session, by audience. */
  pagesByAudience?: Readonly<{ jobs?: number; business?: number }>;
  /** The visitor's country from the IP and, for Indian visitors, the state and its market if any (narrowed by the city when `level` is "city"). */
  geo?: { country?: string; state?: string; market?: string; level?: "city" | "state" };
  /** The browser's non-English languages as site locales, in order (Accept-Language or navigator.languages). */
  deviceLocales?: readonly string[];
  /** The vspl_lang cookie: a language picked on the picker. */
  languagePick?: string;
  holdout?: boolean;
};

export type RegionWeights = {
  /** A labelled-link pick from an earlier session. */
  pickOld: number;
  /** The jobs form's area answer from an earlier session. */
  answerOld: number;
  /** The crew form's site place (any session). */
  site: number;
  param: number;
  utm: number;
  landing: number;
  /** Added once when two or more arrival sources name the same market. */
  agree: number;
  page: number;
  view: number;
  viewCap: number;
  wageView: number;
  wageViewCap: number;
  ipCity: number;
  ipState: number;
  deviceLang: number;
  langPick: number;
};

export type AudienceWeights = {
  page: number;
  earlierPage: number;
  earlierPageCap: number;
  arrival: number;
  /** A non-English page or picked language (business pages are English only). */
  regionalLanguage: number;
  deviceLanguage: number;
  /** A door or form from an earlier session. */
  pickOld: number;
  /** How far the leader must be ahead to decide. */
  margin: number;
};

export type ContextTables = {
  version: number;
  /** Every market, alphabetical (no market is the default). */
  markets: readonly string[];
  /** Which sides each market has a published page on. */
  surfaces: Readonly<Record<string, { business?: boolean; jobs?: boolean }>>;
  /** The market whose page stands in for one with no page on a side. */
  standIn: Readonly<Record<string, Partial<Record<Side, string>>>>;
  /** Markets near a state no market covers, or near a market with no jobs side (job seekers). */
  nearby: Readonly<Record<string, readonly string[]>>;
  weights: { jobs: RegionWeights; business: RegionWeights };
  audience: AudienceWeights;
  bands: { clearWin: number; confidentShare: number; confidentPoints: number; leaningPoints: number };
  /** How long picks count, in days. */
  days: { link: number; answer: number; site: number; audience: number };
  /** Each market's language order, each state's (ISO 3166-2:IN, Indian visitors), and the default. */
  languages: {
    market: Readonly<Record<string, readonly string[]>>;
    state: Readonly<Record<string, readonly string[]>>;
    default: readonly string[];
    /** A phone or picked language that hints at a market (kn → Bengaluru, pa → Punjab). */
    hint: Readonly<Record<string, string>>;
    /** Always among the top choices. */
    always: string;
    top: number;
  };
};

export type VisitorContext = {
  v: number;
  holdout: boolean;
  audience: { value: Audience; stated: boolean; scores: { jobs: number; business: number } };
  region: {
    /** The visitor's markets, in their order (at most two); not page-first. */
    markets: string[];
    band: Band;
    basis: Family;
    arrival?: ArrivalSource;
    scores: Record<string, number>;
    /** The leader's share of all points, 0 to 1. */
    share: number;
    /** Points the leader got from each family (measurement, replay). */
    parts: Partial<Record<Family, number>>;
    /** The IP's state, kept even where no market covers it. */
    state?: string;
    /** Markets near the visitor when theirs has no jobs side (or none covers their state): an order hint, never a decision. */
    nearby: string[];
  };
  /** What each side shows: the page's own market first, then the visitor's (stand-ins where a market has no page). Empty when nothing is decided. */
  sides: { business: string[]; jobs: string[] };
  language: { order: string[]; top: string[]; basis: "stated" | "device" | "region" | "page" | "default" };
};

export function resolveContext(s: ContextSignals, t: ContextTables): VisitorContext {
  const DAY = 864e5;
  const FAMILY_ORDER: Family[] = ["stated", "arrival", "browsing", "ambient"];
  const has = (m: string | undefined): m is string => typeof m === "string" && t.markets.indexOf(m) >= 0;
  // Pick times are kept in whole seconds (the vs_ctx cookie).
  const fresh = (at: number) => at >= Math.floor(s.sessionStart / 1000) * 1000;
  const within = (at: number, days: number) => s.now - at < days * DAY;

  /* ---------- Who ---------- */
  const aw = t.audience;
  const aud = { jobs: 0, business: 0 };
  let audStated: "jobs" | "business" | undefined;
  if (s.audiencePick && within(s.audiencePick.at, t.days.audience)) {
    if (fresh(s.audiencePick.at)) audStated = s.audiencePick.audience;
    else aud[s.audiencePick.audience] += aw.pickOld;
  }
  if (s.page.audience !== "mixed") aud[s.page.audience] += aw.page;
  aud.jobs += Math.min((s.pagesByAudience?.jobs ?? 0) * aw.earlierPage, aw.earlierPageCap);
  aud.business += Math.min((s.pagesByAudience?.business ?? 0) * aw.earlierPage, aw.earlierPageCap);
  if (s.arrival?.audience) aud[s.arrival.audience] += aw.arrival;
  const regional = (l: string | undefined) => Boolean(l) && l !== t.languages.always;
  if (regional(s.page.locale) || regional(s.languagePick)) aud.jobs += aw.regionalLanguage;
  if ((s.deviceLocales ?? []).length) aud.jobs += aw.deviceLanguage;
  const audience: Audience = audStated ?? (aud.jobs - aud.business >= aw.margin ? "jobs" : aud.business - aud.jobs >= aw.margin ? "business" : "unknown");

  /* ---------- Where ---------- */
  const w: RegionWeights =
    audience === "unknown"
      ? (Object.fromEntries(Object.keys(t.weights.jobs).map((k) => [k, (t.weights.jobs[k as keyof RegionWeights] + t.weights.business[k as keyof RegionWeights]) / 2])) as RegionWeights)
      : t.weights[audience];
  const scores: Record<string, number> = {};
  const parts: Record<string, Partial<Record<Family, number>>> = {};
  const add = (m: string | undefined, n: number, family: Family) => {
    if (!has(m) || !(n > 0)) return;
    scores[m] = (scores[m] ?? 0) + n;
    parts[m] = parts[m] ?? {};
    parts[m][family] = (parts[m][family] ?? 0) + n;
  };

  // Stated: the latest pick made this session is the decision. Older picks are weighted.
  const picks = (s.picks ?? []).filter((p) => has(p.market) && within(p.at, t.days[p.kind]));
  const statedNow = picks
    .filter((p) => p.kind !== "site" && fresh(p.at))
    .sort((a, b) => b.at - a.at)[0];
  for (const p of picks) {
    if (p.kind === "site") add(p.market, w.site, "stated");
    else if (!fresh(p.at)) add(p.market, p.kind === "link" ? w.pickOld : w.answerOld, "stated");
  }

  // Arrival: one arrival counts once, by its strongest source, plus `agree` when sources agree.
  const arrivalBest: Record<string, { n: number; count: number; source: ArrivalSource }> = {};
  const arrive = (m: string | undefined, n: number, source: ArrivalSource) => {
    if (!has(m)) return;
    const cur = arrivalBest[m];
    if (!cur) arrivalBest[m] = { n, count: 1, source };
    else arrivalBest[m] = { n: Math.max(cur.n, n), count: cur.count + 1, source: n > cur.n ? source : cur.source };
  };
  arrive(s.arrival?.param, w.param, "param");
  for (const m of new Set(s.arrival?.utm ?? [])) arrive(m, w.utm, "utm");
  arrive(s.arrival?.landing, w.landing, "landing");
  for (const [m, a] of Object.entries(arrivalBest)) add(m, a.n + (a.count > 1 ? w.agree : 0), "arrival");

  // Browsing: the current page, market pages viewed, state wage pages viewed.
  add(s.page.market, w.page, "browsing");
  for (const [m, n] of Object.entries(s.views ?? {})) add(m, Math.min(Math.max(n, 0) * w.view, w.viewCap), "browsing");
  for (const [m, n] of Object.entries(s.wageViews ?? {})) add(m, Math.min(Math.max(n, 0) * w.wageView, w.wageViewCap), "browsing");

  // Ambient: the IP region, the phone's language, a language picked on the picker.
  if (s.geo?.market) add(s.geo.market, s.geo.level === "city" ? w.ipCity : w.ipState, "ambient");
  const hinted = (s.deviceLocales ?? []).map((l) => t.languages.hint[l]).find(has);
  add(hinted, w.deviceLang, "ambient");
  add(s.languagePick ? t.languages.hint[s.languagePick] : undefined, w.langPick, "ambient");

  // Strongest family of a market, for ties and for `basis`.
  const topFamily = (m: string): Family => {
    const p = parts[m] ?? {};
    let best: Family = "none";
    for (const f of FAMILY_ORDER) if ((p[f] ?? 0) > (best === "none" ? 0 : (p[best] ?? 0))) best = f;
    return best;
  };
  const ranked = Object.keys(scores).sort(
    (a, b) =>
      scores[b] - scores[a] ||
      FAMILY_ORDER.indexOf(topFamily(a)) - FAMILY_ORDER.indexOf(topFamily(b)) ||
      t.markets.indexOf(a) - t.markets.indexOf(b),
  );
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  let markets: string[];
  let band: Band;
  if (statedNow) {
    markets = [statedNow.market];
    band = "stated";
  } else if (!ranked.length) {
    markets = [];
    band = "unknown";
  } else {
    const [top, second] = ranked;
    const ts = scores[top];
    markets = second !== undefined && ts < t.bands.clearWin * scores[second] ? [top, second] : [top];
    band =
      markets.length === 1 && ts / total >= t.bands.confidentShare && ts >= t.bands.confidentPoints
        ? "confident"
        : ts >= t.bands.leaningPoints
          ? "leaning"
          : "unknown";
    if (band === "unknown") markets = [];
  }
  const lead = markets[0];
  const share = statedNow ? 1 : lead && total ? Math.round((scores[lead] / total) * 100) / 100 : 0;
  const basis: Family = statedNow ? "stated" : lead ? topFamily(lead) : "none";
  const arrival = lead && arrivalBest[lead] ? arrivalBest[lead].source : undefined;

  // The holdout sees nothing inferred put first: no visitor markets on the sides, no nearby.
  const inferred = !(s.holdout && !statedNow);

  // Near the visitor, for job seekers: their state has no market, or their market no jobs side.
  const nearby: string[] = [];
  const near = (key: string | undefined) => {
    for (const m of (key && t.nearby[key]) || []) if (has(m) && nearby.indexOf(m) < 0) nearby.push(m);
  };
  if (inferred) {
    if (lead && !t.surfaces[lead]?.jobs) near(lead);
    if (s.geo?.state && !s.geo.market) near(s.geo.state);
    if (s.geo?.market && !t.surfaces[s.geo.market]?.jobs) near(s.geo.market);
  }

  // What each side shows: the page's own market first, then the visitor's.
  const side = (key: Side) => {
    const out: string[] = [];
    const push = (m: string | undefined) => {
      if (has(m) && t.surfaces[m]?.[key] && out.indexOf(m) < 0) out.push(m);
    };
    push(s.page.market);
    if (inferred) for (const m of markets) {
      push(m);
      push(t.standIn[m]?.[key]);
    }
    return out.slice(0, 2);
  };

  /* ---------- Which language ---------- */
  // The picker's precedence (PLAN §6.4, owner directions of 17 Oct 2026):
  // the picked language; with no pick and no intent, the region's set
  // (Indian phones list Hindi or English whatever the person reads); the
  // browser's languages; the intent's set; the region's set (outside India,
  // the default set); the page's market's set; the default set. Intent is
  // the visitor's decided market when something they did or how they arrived
  // decided it, never the IP alone.
  const L = t.languages;
  const order: string[] = [];
  const addL = (l: string | undefined) => {
    if (l && s.page.locales.indexOf(l) >= 0 && order.indexOf(l) < 0) order.push(l);
  };
  const chosen = s.languagePick && s.page.locales.indexOf(s.languagePick) >= 0 ? s.languagePick : undefined;
  // The page's own market only fills gaps (the path says where the job is, not what the reader reads).
  const intentMarket = markets[0] && basis !== "ambient" && !(basis === "browsing" && markets[0] === s.page.market) ? markets[0] : undefined;
  const intentSet = intentMarket ? L.market[intentMarket] : undefined;
  const regionSet = s.geo?.country === "IN" && s.geo.state ? L.state[s.geo.state] : undefined;
  addL(chosen);
  if (!chosen && !intentSet && regionSet) regionSet.forEach(addL);
  (s.deviceLocales ?? []).forEach(addL);
  if (intentSet) intentSet.forEach(addL);
  if (regionSet) regionSet.forEach(addL);
  else if (s.geo?.country && s.geo.country !== "IN") L.default.forEach(addL);
  if (s.page.market) (L.market[s.page.market] ?? []).forEach(addL);
  L.default.forEach(addL);
  s.page.locales.forEach(addL);
  // The large choices: the first `top`, with English always among them and
  // the phone's first language the page has (owner decision, 18 Oct 2026:
  // a Hindi phone in Bengaluru sees ಕನ್ನಡ · English · हिंदी).
  const device = (s.deviceLocales ?? []).find((l) => s.page.locales.indexOf(l) >= 0);
  const required: string[] = [];
  for (const l of [L.always, device]) if (l && order.indexOf(l) >= 0 && required.indexOf(l) < 0) required.push(l);
  let top = order.slice(0, L.top);
  for (const r of required) {
    if (top.indexOf(r) >= 0) continue;
    for (let i = top.length - 1; i >= 0; i--) {
      if (required.indexOf(top[i]) < 0 && top[i] !== chosen) {
        top[i] = r;
        break;
      }
    }
  }
  top = top.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const firstL = order[0];
  const langBasis: VisitorContext["language"]["basis"] = chosen
    ? "stated"
    : !firstL
      ? "default"
      : (s.deviceLocales ?? [])[0] === firstL
        ? "device"
        : (intentSet ?? regionSet ?? [])[0] === firstL
          ? "region"
          : s.page.market && (L.market[s.page.market] ?? [])[0] === firstL
            ? "page"
            : "default";

  return {
    v: t.version,
    holdout: Boolean(s.holdout),
    audience: { value: audience, stated: Boolean(audStated), scores: aud },
    region: {
      markets,
      band,
      basis,
      arrival,
      scores,
      share,
      parts: lead ? (parts[lead] ?? {}) : {},
      state: s.geo?.state,
      nearby: nearby.filter((m) => markets.indexOf(m) < 0),
    },
    sides: { business: side("business"), jobs: side("jobs") },
    language: { order, top, basis: langBasis },
  };
}
