/**
 * Reads one page view's signals for resolveContext (docs/visitor-context.md):
 * the page, the session (sessionStorage), the remembered picks (the vs_ctx
 * cookie), the IP region (the vs_geo cookie the proxy sets), the browser's
 * languages and the language cookie.
 *
 * Pure and self-contained like core.ts (no imports at run time, helpers
 * nested), because the pre-paint boot script inlines it. The caller reads
 * and writes the storage: this only computes.
 *
 * Cookies (first-party, readable by the page, SameSite=Lax):
 *   vs_ctx  the visitor's picks, one per kind, 90 days:
 *           "l.haridwar.1760000000~a.punjab.1760000000~s.jalandhar.…~u.jobs.…"
 *           l = labelled market link, a = jobs form area answer,
 *           s = crew form site place, u = audience (a door or a form started);
 *           times in seconds.
 *   vs_geo  set by the proxy, this browser session only: "IN.UK.haridwar.c"
 *           (country, state, the state's or city's market, c = city / s = state).
 */
import type { ContextSignals, Pick } from "./core";

export type GeoCookie = { country?: string; state?: string; market?: string; level?: "city" | "state" };

export type Session = {
  v: 1;
  startedAt: number;
  lastSeen: number;
  /** The ad or tagged link that started the session (its arrival parameters). */
  arrival?: string;
  param?: string;
  utm?: string[];
  /** The landing page's market ("" when it had none). */
  landing?: string;
  arrivalAudience?: "jobs" | "business";
  /** Neutral paths seen, so one page in two languages counts once. */
  seen: string[];
  views: Record<string, number>;
  wageViews: Record<string, number>;
  /** Pages viewed this session by audience, the current one included. */
  pages: { jobs?: number; business?: number };
  holdout: boolean;
};

export type CollectData = {
  /** Neutral path → [market, audience (b, j, m), locale codes, wage page's market]. */
  pages: Readonly<Record<string, readonly [string, string, string, string]>>;
  /** Locale segment → locale tag ("hi-latn-in" → "hi-Latn-IN"). */
  segments: Readonly<Record<string, string>>;
  /** Locale code (as in `pages`) → locale tag. */
  codes: Readonly<Record<string, string>>;
  markets: readonly string[];
  /** The markets' words in rank order (src/markets placeGroups), for UTM tags. */
  words: readonly (readonly [string, string])[];
  /** Words in campaign tags that say who an ad is for. */
  audienceWords: { jobs: readonly string[]; business: readonly string[] };
  /** URL parameters that preset the jobs form (an applicant's link). */
  jobsParams: readonly string[];
  arrivalParams: readonly string[];
  idleMs: number;
  holdoutShare: number;
  languageCookie: string;
};

export type CollectInput = {
  now: number;
  pathname: string;
  search: string;
  cookie: string;
  session: Session | null;
  /** The pick model 3 kept in localStorage (vs-area-choice-v1), read once to migrate it. */
  legacyChoice?: { cluster?: string; at?: number } | null;
  /** navigator.languages, or Accept-Language's tags in order. */
  languages: readonly string[];
  /** A number in [0, 1) for the holdout draw of a new session. */
  random: number;
  /** The IP region when the vs_geo cookie is missing (from /api/context). */
  geo?: GeoCookie;
};

export function collectSignals(input: CollectInput, d: CollectData): { signals: ContextSignals; session: Session; path: string; locale: string; picks: Pick[] } {
  const isMarket = (m: string | undefined | null): m is string => typeof m === "string" && d.markets.indexOf(m) >= 0;
  const plain = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z]+/g, " ")
      .trim();
  const hasWord = (text: string, word: string) => (" " + text + " ").indexOf(" " + word + " ") >= 0;

  const cookies: Record<string, string> = {};
  for (const part of input.cookie.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) cookies[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }

  // The page: its locale segment, neutral path, market, audience and languages.
  const segs = input.pathname.split("/");
  const locale = d.segments[(segs[1] || "").toLowerCase()];
  const path = (locale ? "/" + segs.slice(2).join("/") : input.pathname).replace(/\/+$/, "") || "/";
  const entry = d.pages[path];
  const pageMarket = entry && isMarket(entry[0]) ? entry[0] : undefined;
  const audienceCode = entry ? entry[1] : path === "/jobs" || path.indexOf("/jobs/") === 0 ? "j" : "b";
  const pageAudience: "jobs" | "business" | "mixed" = audienceCode === "j" ? "jobs" : audienceCode === "m" ? "mixed" : "business";
  const pageLocales: string[] = [];
  const codes = entry ? entry[2] : "en";
  for (let i = 0; i + 1 < codes.length; i += 2) {
    const tag = d.codes[codes.slice(i, i + 2)];
    if (tag) pageLocales.push(tag);
  }
  const pageLocale = locale || pageLocales[0] || "en-IN";

  // The session: a new one after idle time or when a new ad or tagged link arrives.
  const params = new URLSearchParams(input.search);
  const tagged = d.arrivalParams.some((k) => params.has(k));
  const arrivalKey = tagged ? d.arrivalParams.map((k) => params.get(k) || "").join("|") : undefined;
  let s = input.session;
  if (!s || s.v !== 1 || input.now - (s.lastSeen || 0) > d.idleMs || (arrivalKey && arrivalKey !== s.arrival)) {
    s = { v: 1, startedAt: input.now, lastSeen: input.now, arrival: arrivalKey, seen: [], views: {}, wageViews: {}, pages: {}, holdout: input.random < d.holdoutShare };
  }
  s = { ...s, lastSeen: input.now, views: { ...s.views }, wageViews: { ...s.wageViews }, pages: { ...s.pages }, seen: [...s.seen] };
  const firstView = s.seen.indexOf(path) < 0;
  if (firstView) {
    s.seen = [...s.seen, path].slice(-30);
    if (pageMarket) s.views[pageMarket] = (s.views[pageMarket] || 0) + 1;
    const wage = entry && isMarket(entry[3]) ? entry[3] : undefined;
    if (wage) s.wageViews[wage] = (s.wageViews[wage] || 0) + 1;
    if (pageAudience !== "mixed") s.pages[pageAudience] = (s.pages[pageAudience] || 0) + 1;
  }
  if (s.landing === undefined) s.landing = pageMarket || "";

  // Arrival: ?cluster=, the markets' words in UTM tags, who the ad is for.
  const param = params.get("cluster");
  if (isMarket(param)) s.param = param;
  const tags = ["utm_campaign", "utm_term", "utm_content", "utm_source"].map((k) => params.get(k)).filter((v): v is string => Boolean(v)).map(plain);
  const named: string[] = [];
  for (const tag of tags) for (const [word, market] of d.words) if (isMarket(market) && hasWord(tag, word) && named.indexOf(market) < 0) named.push(market);
  if (named.length) s.utm = [...new Set([...(s.utm || []), ...named])];
  const says = (words: readonly string[]) => tags.some((tag) => words.some((w) => hasWord(tag, w)));
  const jobsAd = says(d.audienceWords.jobs) || d.jobsParams.some((k) => params.has(k));
  const businessAd = says(d.audienceWords.business);
  if (jobsAd !== businessAd) s.arrivalAudience = jobsAd ? "jobs" : "business";

  // Picks from the vs_ctx cookie (and model 3's localStorage pick, once).
  const picks: Pick[] = [];
  let audiencePick: ContextSignals["audiencePick"];
  for (const item of (cookies.vs_ctx ? decodeURIComponent(cookies.vs_ctx) : "").split("~")) {
    const [kind, value, at] = item.split(".");
    const when = Number(at) * 1000;
    if (!Number.isFinite(when) || when <= 0) continue;
    if (kind === "u" && (value === "jobs" || value === "business")) audiencePick = { audience: value, at: when };
    const k = kind === "l" ? "link" : kind === "a" ? "answer" : kind === "s" ? "site" : undefined;
    if (k && isMarket(value)) picks.push({ kind: k, market: value, at: when });
  }
  const legacy = input.legacyChoice;
  if (legacy && isMarket(legacy.cluster) && typeof legacy.at === "number" && !picks.some((p) => p.kind === "link")) {
    picks.push({ kind: "link", market: legacy.cluster, at: legacy.at });
  }

  // The IP region: the proxy's cookie, else the fallback answer.
  let geo: GeoCookie | undefined = input.geo;
  if (cookies.vs_geo) {
    const [country, state, market, level] = decodeURIComponent(cookies.vs_geo).split(".");
    geo = { country: country || undefined, state: country === "IN" && state ? state : undefined, market: country === "IN" && isMarket(market) ? market : undefined, level: level === "c" ? "city" : "state" };
  }

  // The browser's non-English languages as site locales (English is skipped:
  // Indian phones list it whatever the person reads); "hi" adds हिंदी then
  // Hinglish, "hi-Latn" Hinglish first.
  const siteLocales = Object.keys(d.codes).map((c) => d.codes[c]);
  const device: string[] = [];
  for (const raw of input.languages.slice(0, 20)) {
    const [language, ...sub] = raw.trim().toLowerCase().split("-");
    if (!language || language === "en" || language === "*") continue;
    const latin = sub.indexOf("latn") >= 0;
    const matches = siteLocales
      .filter((l) => l.split("-")[0].toLowerCase() === language)
      .sort((a, b) => Number(b.indexOf("-Latn-") >= 0 === latin) - Number(a.indexOf("-Latn-") >= 0 === latin));
    for (const l of matches) if (device.indexOf(l) < 0) device.push(l);
  }
  const lang = cookies[d.languageCookie];
  const languagePick = lang && siteLocales.indexOf(lang) >= 0 ? lang : undefined;

  // Pages by audience before this one (the current page counts on its own).
  const earlier = { ...s.pages };
  if (pageAudience !== "mixed" && earlier[pageAudience]) earlier[pageAudience] = (earlier[pageAudience] || 0) - (firstView ? 1 : 0);

  const signals: ContextSignals = {
    now: input.now,
    sessionStart: s.startedAt,
    page: { market: pageMarket, audience: pageAudience, locale: pageLocale, locales: pageLocales.length ? pageLocales : [pageLocale] },
    picks,
    audiencePick,
    arrival: { param: s.param, utm: s.utm, landing: s.landing || undefined, audience: s.arrivalAudience },
    views: s.views,
    wageViews: s.wageViews,
    pagesByAudience: earlier,
    geo,
    deviceLocales: device,
    languagePick,
    holdout: s.holdout,
  };
  return { signals, session: s, path, locale: pageLocale, picks };
}

/** The vs_ctx cookie's value for a set of picks and an audience pick (one of each kind, newest kept). */
export function picksCookie(picks: readonly Pick[], audience?: { audience: string; at: number }): string {
  const code = { link: "l", answer: "a", site: "s" } as const;
  const newest: Record<string, Pick> = {};
  for (const p of picks) if (!newest[p.kind] || newest[p.kind].at < p.at) newest[p.kind] = p;
  const items = Object.values(newest).map((p) => `${code[p.kind]}.${p.market}.${Math.floor(p.at / 1000)}`);
  if (audience) items.push(`u.${audience.audience}.${Math.floor(audience.at / 1000)}`);
  return items.join("~");
}

/** The picks in a vs_ctx cookie value (for the proxy; collectSignals reads the cookie itself). */
export function parsePicksCookie(raw: string | undefined): Pick[] {
  const out: Pick[] = [];
  let value = raw ?? "";
  try {
    value = decodeURIComponent(value);
  } catch {
    return out;
  }
  for (const item of value.split("~")) {
    const [kind, market, at] = item.split(".");
    const k = kind === "l" ? "link" : kind === "a" ? "answer" : kind === "s" ? "site" : undefined;
    const when = Number(at) * 1000;
    if (k && market && Number.isFinite(when) && when > 0) out.push({ kind: k, market, at: when });
  }
  return out;
}
