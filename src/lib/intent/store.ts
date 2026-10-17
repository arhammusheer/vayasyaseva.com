"use client";
/**
 * The visitor's area signals, kept in the browser (docs/area-intent.md):
 * session signals in sessionStorage, and only a market the visitor picked
 * from a labelled market link in localStorage. Nothing leaves the browser
 * except the anonymous decision sent to analytics. Every read and write
 * tolerates blocked storage.
 */
import { geoMarket, marketsInAdTags } from "@/markets/index";
import type { AreaSignals } from "./model";

/** v2: sessions carry their start and last-seen times and the form's area answer. */
const SESSION_KEY = "vs-area-session-v2";
const CHOICE_KEY = "vs-area-choice-v1";
/** v3: only Indian visitors' region and city are kept (the country is checked). */
const REGION_KEY = "vs-area-region-v3";
/** A market picked from a labelled link is remembered for 90 days. */
const CHOICE_DAYS = 90;
/**
 * A session ends after 30 minutes without a page view, or when a URL
 * arrives from a new ad or tagged link: mobile browsers keep tabs (and their
 * sessionStorage) for weeks, and last week's ad shouldn't steer today's.
 */
const SESSION_IDLE_MS = 30 * 60 * 1000;
const ARRIVAL_PARAMS = ["gclid", "gbraid", "wbraid", "utm_campaign", "utm_source", "cluster"];

type Session = {
  startedAt?: number;
  lastSeen?: number;
  /** The ad or tagged link that started the session (its ARRIVAL_PARAMS values). */
  arrival?: string;
  landing?: string;
  param?: string;
  utm?: string[];
  views?: Record<string, number>;
  seen?: string[];
  /** The jobs form's "Where do you live?" market: this session only. */
  answer?: string;
};

const read = <T,>(storage: () => Storage, key: string): T | null => {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const write = (storage: () => Storage, key: string, value: unknown) => {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or blocked storage: the site shows the no-signal order.
  }
};
const session = () => window.sessionStorage;
const local = () => window.localStorage;

/** The neutral path (no locale segment), so one page in two languages counts once. */
const neutralPath = (pathname: string) => pathname.replace(/^\/(en-in|hi-in|hi-latn-in|pa-in|kn-in)(?=\/|$)/, "") || "/";

/**
 * Records this page view's signals: its cluster, the session's landing page,
 * ?cluster= and UTM tags. Starts a new session after 30 idle minutes or when
 * the URL carries a new arrival (an ad click, a tagged link).
 */
export function notePageView(pageCluster: string | undefined, url: URL, known: (id: string) => boolean) {
  const now = Date.now();
  // The arrival's own parameters: the same ad URL reloaded is the same session.
  const arrival = ARRIVAL_PARAMS.some((k) => url.searchParams.has(k)) ? ARRIVAL_PARAMS.map((k) => url.searchParams.get(k) ?? "").join("|") : undefined;
  let s = read<Session>(session, SESSION_KEY) ?? {};
  if (!s.startedAt || now - (s.lastSeen ?? 0) > SESSION_IDLE_MS || (arrival && arrival !== s.arrival)) s = { startedAt: now, arrival };
  s.lastSeen = now;
  const path = neutralPath(url.pathname);
  if (!s.seen?.includes(path)) {
    s.seen = [...(s.seen ?? []), path].slice(-30);
    if (pageCluster) s.views = { ...s.views, [pageCluster]: (s.views?.[pageCluster] ?? 0) + 1 };
  }
  if (s.landing === undefined) s.landing = pageCluster ?? "";
  const param = url.searchParams.get("cluster");
  if (param && known(param)) s.param = param;
  const utm = marketsInAdTags(["utm_campaign", "utm_term", "utm_content", "utm_source"].map((k) => url.searchParams.get(k))).filter(known);
  if (utm.length) s.utm = [...new Set([...(s.utm ?? []), ...utm])];
  write(session, SESSION_KEY, s);
}

/**
 * The visitor picked a market. A labelled market link ("Jobs in Punjab",
 * a /jobs or /locations list item) is remembered for 90 days; the jobs
 * form's "Where do you live?" (`kind: "answer"`) only for this session: it
 * says where the person lives, which is a strong hint for now, not a
 * standing preference. Unlabelled doors ("Jobs") and the crew form's site
 * state are not picks.
 */
export function noteChoice(cluster: string, kind: "link" | "answer" = "link") {
  if (kind === "answer") {
    const s = read<Session>(session, SESSION_KEY) ?? { startedAt: Date.now() };
    write(session, SESSION_KEY, { ...s, answer: cluster });
    return;
  }
  write(local, CHOICE_KEY, { cluster, at: Date.now() });
}

function choice(known: (id: string) => boolean): { cluster?: string; fresh: boolean } {
  const s = read<Session>(session, SESSION_KEY);
  if (s?.answer && known(s.answer)) return { cluster: s.answer, fresh: true };
  const c = read<{ cluster: string; at: number }>(local, CHOICE_KEY);
  if (!c || !known(c.cluster) || Date.now() - c.at >= CHOICE_DAYS * 864e5) return { fresh: false };
  return { cluster: c.cluster, fresh: Boolean(s?.startedAt && c.at >= s.startedAt) };
}

type Context = { country: string | null; region: string | null; city?: string | null };
let pending: Promise<Context | null> | null = null;

/**
 * The visitor's country, region and city, asked of /api/context once per
 * session (one request shared by every caller on the page; a failed answer
 * is not kept, so the next page tries again). Only an Indian region counts:
 * PB, UT and KA are also codes in other countries.
 */
export async function regionCluster(): Promise<{ country?: string; region?: string; cluster?: string }> {
  let cached = read<Context>(session, REGION_KEY);
  if (!cached) {
    pending ??= fetch("/api/context", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<Context>) : null))
      .catch(() => null)
      .finally(() => {
        pending = null;
      });
    cached = await pending;
    if (cached) write(session, REGION_KEY, cached);
  }
  const country = cached?.country ?? undefined;
  const region = country === "IN" ? (cached?.region ?? undefined) : undefined;
  return { country, region, cluster: geoMarket(region, cached?.city) };
}

/** Everything the model needs, for the page being viewed. */
export function currentSignals(pageCluster: string | undefined, geo: string | undefined, known: (id: string) => boolean): AreaSignals {
  const s = read<Session>(session, SESSION_KEY) ?? {};
  const picked = choice(known);
  return {
    chosen: picked.cluster,
    chosenFresh: picked.fresh,
    landing: s.landing || undefined,
    page: pageCluster,
    param: s.param,
    utm: s.utm,
    views: s.views,
    geo,
  };
}
