"use client";
/**
 * The visitor context in the browser after hydration (docs/visitor-context.md).
 * The boot script (boot.ts) decided the first page before paint; this
 * module takes over: it recomputes on each client navigation, records
 * picks, falls back to /api/context when the proxy's vs_geo cookie is
 * missing, keeps the <html data-ctx-*> attributes current and tells
 * subscribers (useVisitorContext) and analytics (report.ts).
 *
 * Within a page the decision only moves for something the visitor does
 * (a pick): a late answer (the IP fallback) after the first tap or key
 * press waits for the next page, so nothing moves under their finger.
 */
import { contextAttributes } from "./attrs";
import { collectSignals, picksCookie, type GeoCookie, type Session } from "./collect";
import { resolveContext, type ContextSignals, type Pick, type VisitorContext } from "./core";
import { GEO_FALLBACK_KEY, LEGACY_CHOICE_KEY, LEGACY_KEYS, PICKS_COOKIE, PICKS_COOKIE_MAX_AGE, SESSION_KEY } from "./keys";
import { reportContext } from "./report";
import { LOCALE_CODES, collectData, contextTables } from "./tables";

type State = { pathname: string; search: string; ctx: VisitorContext; signals: ContextSignals; frozen: boolean };

declare global {
  interface Window {
    __vsctx?: { pathname: string; search: string; ctx: VisitorContext; signals: ContextSignals };
  }
}

let state: State | null = null;
const listeners = new Set<() => void>();
let geoAsked = false;
// What the visitor picked since this page loaded, kept here first: the
// vs_ctx cookie only carries it to later loads, and a blocked cookie
// (written without error, read back empty) must not undo the pick.
const made: { picks: Pick[]; audience?: ContextSignals["audiencePick"] } = { picks: [] };

/** The signals with this page's picks over the cookie's (the newer of each kind). */
function withMade(s: ContextSignals): ContextSignals {
  const picks = [...(s.picks ?? [])];
  for (const p of made.picks) {
    const i = picks.findIndex((q) => q.kind === p.kind);
    if (i < 0) picks.push(p);
    else if (picks[i].at < p.at) picks[i] = p;
  }
  const audiencePick = made.audience && !(s.audiencePick && s.audiencePick.at >= made.audience.at) ? made.audience : s.audiencePick;
  return { ...s, picks, audiencePick };
}

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
    // Private mode or blocked storage: the context still works for this page.
  }
};
const session = () => window.sessionStorage;
const local = () => window.localStorage;

function compute(pathname: string, search: string): State {
  const o = collectSignals(
    {
      now: Date.now(),
      pathname,
      search,
      cookie: document.cookie,
      session: read<Session>(session, SESSION_KEY),
      legacyChoice: read<{ cluster?: string; at?: number }>(local, LEGACY_CHOICE_KEY),
      languages: navigator.languages ?? [navigator.language ?? ""],
      random: Math.random(),
      geo: read<GeoCookie>(session, GEO_FALLBACK_KEY) ?? undefined,
    },
    collectData(),
  );
  write(session, SESSION_KEY, o.session);
  const signals = withMade(o.signals);
  return { pathname, search, ctx: resolveContext(signals, contextTables()), signals, frozen: false };
}

function apply(s: State | null) {
  const html = document.documentElement;
  for (const name of html.getAttributeNames()) if (name === "data-ctx" || name.startsWith("data-ctx-")) html.removeAttribute(name);
  if (!s) {
    for (const l of listeners) l();
    return;
  }
  const attrs = contextAttributes(s.ctx, { locale: s.signals.page.locale, market: s.signals.page.market }, LOCALE_CODES);
  for (const [k, v] of Object.entries(attrs)) html.setAttribute(k, v);
  for (const l of listeners) l();
}

/** Model 3 kept its pick in localStorage: move it to the vs_ctx cookie once and drop model 3's keys. */
function migrate(picks: readonly Pick[]) {
  if (!read(local, LEGACY_CHOICE_KEY)) return;
  writePicks(picks, undefined);
  for (const k of LEGACY_KEYS.local) try { local().removeItem(k); } catch {}
  for (const k of LEGACY_KEYS.session) try { session().removeItem(k); } catch {}
}

function writePicks(picks: readonly Pick[], audience: ContextSignals["audiencePick"]) {
  try {
    document.cookie = `${PICKS_COOKIE}=${encodeURIComponent(picksCookie(picks, audience))}; Max-Age=${PICKS_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  } catch {
    // Cookies blocked: picks last for this page only.
  }
}

/**
 * Asks /api/context for the IP region when the proxy's cookie is missing
 * (cookies blocked, a direct deploy URL). Resolves once the answer is in
 * (or failed), so the page's decision is reported once, with it.
 */
function askGeo(): Promise<void> {
  if (geoAsked || state?.signals.geo) return Promise.resolve();
  geoAsked = true;
  return fetch("/api/context", { cache: "no-store" })
    .then((res) => (res.ok ? (res.json() as Promise<GeoCookie>) : null))
    .then((geo) => {
      if (!geo?.country) return;
      write(session, GEO_FALLBACK_KEY, geo);
      if (!state || state.frozen) return;
      state = { ...compute(state.pathname, state.search), frozen: false };
      apply(state);
    })
    .catch(() => {
      geoAsked = false;
    });
}

const freeze = () => {
  if (state) state.frozen = true;
};

/**
 * A page view (ContextRuntime, on mount and each navigation). The first
 * page adopts the boot script's result when it read the same URL.
 */
export function pageView(pathname: string, search: string) {
  const boot = window.__vsctx;
  const adopted = !state && boot && boot.pathname === pathname && boot.search === search;
  window.__vsctx = undefined;
  try {
    state = adopted ? { ...boot, frozen: false } : compute(pathname, search);
  } catch {
    // Whatever broke, the page stays neutral (like the boot script), never an error page.
    state = null;
    apply(null);
    return;
  }
  migrate(state.signals.picks ?? []);
  apply(state);
  window.addEventListener("pointerdown", freeze, { once: true, capture: true });
  window.addEventListener("keydown", freeze, { once: true, capture: true });
  const viewed = state;
  // Reported with the IP region when it has to be fetched; the page's own decision otherwise.
  void askGeo().then(() => {
    const now = state && state.pathname === viewed.pathname ? state : viewed;
    reportContext(now.ctx, now.signals);
  });
}

/** The visitor picked a market: a labelled link, the jobs form's area answer, or the crew form's site place. */
export function notePick(kind: Pick["kind"], market: string) {
  const signals = state?.signals ?? window.__vsctx?.signals;
  const pick = { kind, market, at: Date.now() };
  made.picks = [...made.picks.filter((p) => p.kind !== kind), pick];
  writePicks([...(signals?.picks ?? []).filter((p) => p.kind !== kind), pick], signals?.audiencePick);
  refresh();
}

/** A door or form said who the visitor is ("Jobs", "For businesses", a form started). */
export function noteAudience(audience: "jobs" | "business") {
  const signals = state?.signals ?? window.__vsctx?.signals;
  if (signals?.audiencePick?.audience === audience && signals.audiencePick.at >= Math.floor(signals.sessionStart / 1000) * 1000) return;
  made.audience = { audience, at: Date.now() };
  writePicks(signals?.picks ?? [], made.audience);
  refresh();
}

/** Recompute for the current page after something the visitor did. */
function refresh() {
  if (!state) return;
  try {
    state = compute(state.pathname, state.search);
  } catch {
    return;
  }
  apply(state);
  reportContext(state.ctx, state.signals);
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current context, or null before the first page view is recorded. */
export function currentContext(): VisitorContext | null {
  return state?.ctx ?? window.__vsctx?.ctx ?? null;
}

/** The current page's signals (measurement, the jobs form). */
export function currentSignals(): ContextSignals | null {
  return state?.signals ?? window.__vsctx?.signals ?? null;
}
