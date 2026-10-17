"use client";
/**
 * The visitor's area signals, kept in the browser (docs/area-intent.md):
 * session signals in sessionStorage (gone when the tab closes) and only an
 * area the visitor explicitly picked in localStorage. Nothing leaves the
 * browser except the anonymous decision sent to analytics. Every read and
 * write tolerates blocked storage.
 */
import { clustersInUtm, geoCluster, type AreaSignals } from "./model";

const SESSION_KEY = "vs-area-session-v1";
const CHOICE_KEY = "vs-area-choice-v1";
/** v2: the cached answer carries the IP city too. */
const REGION_KEY = "vs-area-region-v2";
/** An explicit pick is remembered for 90 days. */
const CHOICE_DAYS = 90;

type Session = { landing?: string; param?: string; utm?: string[]; views?: Record<string, number>; seen?: string[] };

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
    // Private mode or blocked storage: the header falls back to the default.
  }
};
const session = () => window.sessionStorage;
const local = () => window.localStorage;

/** Records this page view's signals: its cluster, the session's landing page, ?cluster= and UTM tags. */
export function notePageView(pageCluster: string | undefined, url: URL, known: (id: string) => boolean) {
  const s = read<Session>(session, SESSION_KEY) ?? {};
  if (!s.seen?.includes(url.pathname)) {
    s.seen = [...(s.seen ?? []), url.pathname].slice(-30);
    if (pageCluster) s.views = { ...s.views, [pageCluster]: (s.views?.[pageCluster] ?? 0) + 1 };
  }
  if (s.landing === undefined) s.landing = pageCluster ?? "";
  const param = url.searchParams.get("cluster");
  if (param && known(param)) s.param = param;
  const utm = clustersInUtm(["utm_campaign", "utm_term", "utm_content", "utm_source"].map((k) => url.searchParams.get(k))).filter(known);
  if (utm.length) s.utm = [...new Set([...(s.utm ?? []), ...utm])];
  write(session, SESSION_KEY, s);
}

/** The visitor picked an area (an area link, or a form answer that names one). */
export function noteChoice(cluster: string) {
  write(local, CHOICE_KEY, { cluster, at: Date.now() });
}

function choice() {
  const c = read<{ cluster: string; at: number }>(local, CHOICE_KEY);
  return c && Date.now() - c.at < CHOICE_DAYS * 864e5 ? c.cluster : undefined;
}

/** The visitor's region and city, asked of /api/context once per session; the city stays in this tab. */
export async function regionCluster(): Promise<{ region?: string; cluster?: string }> {
  let cached = read<{ region: string | null; city?: string | null }>(session, REGION_KEY);
  if (!cached) {
    try {
      const res = await fetch("/api/context", { cache: "no-store" });
      cached = res.ok ? ((await res.json()) as { region: string | null; city: string | null }) : { region: null };
    } catch {
      cached = { region: null };
    }
    write(session, REGION_KEY, cached);
  }
  const region = cached.region ?? undefined;
  return { region, cluster: geoCluster(region, cached.city) };
}

/** Everything the model needs, for the page being viewed. */
export function currentSignals(pageCluster: string | undefined, geo: string | undefined): AreaSignals {
  const s = read<Session>(session, SESSION_KEY) ?? {};
  return { chosen: choice(), landing: s.landing || undefined, page: pageCluster, param: s.param, utm: s.utm, views: s.views, geo };
}
