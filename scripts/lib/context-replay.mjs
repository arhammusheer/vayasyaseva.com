// Replays recorded sessions through the visitor context engine
// (src/context, docs/visitor-context.md) under candidate weights, and scores
// each candidate against what visitors then did (docs/visitor-context-plan.md
// §9, "Ground truth and targets"). Pure: scripts/context-replay.mjs fetches
// the sessions from Umami and prints the report.
//
// A session is rebuilt from what Umami already holds, so tuning needs no new
// collection: its pageviews (path and query) go through collectSignals as
// the browser would see them, the IP region comes from the area_intent
// events' geo props, the browser language from Umami's session, and picks
// and audience from the events the site sends when they happen
// (market_chosen_*, quick_step area answers, area_nav_click, form starts,
// language_choice). Signals are computed once; only resolveContext reruns
// per candidate. The rebuild is checked against the decisions the site
// logged (area_intent) before any score is trusted.
//
// Not rebuilt: tabs (each tab keeps its own session, Umami can't tell them
// apart), picks made in an earlier Umami session (another device or month),
// the crew form's site place (contact_form_step carries no place), the
// browser's second and later languages, and header doors that send no event
// ("Apply", "Request a crew"). The fidelity check counts what that costs.
import { importTs } from "./register-ts.mjs";

/** Session dump format; bump when its shape changes. */
export const DUMP_VERSION = 1;

/** The site's targets for the first four weeks of model 4 (plan §9). */
export const TARGETS = {
  confident: { min: 0.85 },
  leaning: { min: 0.7 },
  formCorrection: { max: 0.1 },
  audience: { min: 0.9 },
  askRate: { max: 0.3 },
};

/** Below this many cases a rate is printed but marked as too few to act on. */
export const SMALL = 30;

export async function loadEngine() {
  const { resolveContext } = await importTs("src/context/core.ts");
  const { collectSignals, picksCookie } = await importTs("src/context/collect.ts");
  const { contextTables, collectData } = await importTs("src/context/tables.ts");
  const { CONTEXT_VERSION } = await importTs("src/context/weights.ts");
  const { AREA_CLUSTERS } = await importTs("src/lib/talent-intake/rules.ts");
  return { resolveContext, collectSignals, picksCookie, tables: contextTables(), data: collectData(), version: CONTEXT_VERSION, areaClusters: AREA_CLUSTERS };
}

/** The base tables with a candidate's overrides: { jobs, business, audience, bands, days }. */
export function withWeights(base, over = {}) {
  return {
    ...base,
    weights: { jobs: { ...base.weights.jobs, ...over.jobs }, business: { ...base.weights.business, ...over.business } },
    audience: { ...base.audience, ...over.audience },
    bands: { ...base.bands, ...over.bands },
    days: { ...base.days, ...over.days },
  };
}

/** Checks a candidate names only weights that exist, so a typo can't pass as "no change". */
export function checkCandidate(base, over) {
  const known = { jobs: base.weights.jobs, business: base.weights.business, audience: base.audience, bands: base.bands, days: base.days };
  const errors = [];
  for (const [group, values] of Object.entries(over)) {
    if (group === "name") continue;
    if (!known[group]) {
      errors.push(`unknown group "${group}" (jobs, business, audience, bands, days)`);
      continue;
    }
    for (const [k, v] of Object.entries(values)) {
      if (!(k in known[group])) errors.push(`unknown weight ${group}.${k}`);
      else if (typeof v !== "number" || !Number.isFinite(v)) errors.push(`${group}.${k} must be a number`);
    }
  }
  return errors;
}

const at = (iso) => Date.parse(iso);

/** The IP region the site used near time t: the nearest area_intent's geo props. */
function geoAt(events, t) {
  let best;
  for (const e of events) {
    if (e.name !== "area_intent" || !e.data?.country) continue;
    if (!best || Math.abs(e.at - t) < Math.abs(best.at - t)) best = e;
  }
  if (!best || best.data.country === "none") return undefined;
  const d = best.data;
  return { country: d.country, state: d.region !== "none" ? d.region : "", market: d.geo !== "none" ? d.geo : "" };
}

/**
 * Rebuilds a session's decision points: every pageview and every recompute
 * after a pick or an audience note, with the signals the browser had then,
 * and the truth events (what the visitor picked or started) with the
 * signals from just before them. `level` is the vs_geo cookie's city/state
 * flag, which no event records: the caller tries both (prepareSession).
 * `raw` is a dump session: { id, language, holdout, events: [{ at, type
 * ("view" or "event"), path, query, name, data }] }, oldest first.
 */
function rebuild(raw, e, level) {
  const events = raw.events;
  const points = [];
  const truths = [];
  let session = null;
  let last = null;
  let picks = [];
  let audiencePick;
  let languagePick;
  const isMarket = (m) => e.tables.markets.includes(m);

  const cookie = (t) => {
    const parts = [];
    const ctx = e.picksCookie(picks, audiencePick);
    if (ctx) parts.push(`vs_ctx=${encodeURIComponent(ctx)}`);
    const geo = geoAt(events, t);
    if (geo) parts.push(`vs_geo=${[geo.country, geo.state, geo.market, level].join(".")}`);
    if (languagePick) parts.push(`${e.data.languageCookie}=${languagePick}`);
    return parts.join("; ");
  };
  const collect = (t, view, prior) =>
    e.collectSignals(
      { now: t, pathname: view.path, search: view.query ? `?${view.query}` : "", cookie: cookie(t), session: prior, languages: raw.language ? [raw.language] : [], random: raw.holdout ? 0 : 0.99 },
      e.data,
    );
  const point = (t, kind) => {
    const o = collect(t, last, session);
    session = o.session;
    points.push({ at: t, kind, path: last.path, signals: o.signals });
    return o.signals;
  };

  for (const ev of events) {
    if (ev.type === "view") {
      last = ev;
      point(ev.at, "view");
      continue;
    }
    if (!last) continue;
    const d = ev.data ?? {};
    const before = () => collect(ev.at, last, session).signals;
    const noteAudience = (aud) => {
      if (audiencePick?.audience === aud && audiencePick.at >= Math.floor((session?.startedAt ?? 0) / 1000) * 1000) return;
      audiencePick = { audience: aud, at: ev.at };
      point(ev.at, "audience");
    };
    const notePick = (kind, market) => {
      picks = [...picks.filter((p) => p.kind !== kind), { kind, market, at: ev.at }];
      point(ev.at, "pick");
    };

    if (ev.name === "job_form_start" || ev.name === "contact_form_start") {
      const audience = ev.name === "job_form_start" ? "jobs" : "business";
      truths.push({ at: ev.at, kind: "audience", truth: audience, signals: before() });
      noteAudience(audience);
    } else if (ev.name === "quick_step" && d.step === "area") {
      const market = Object.hasOwn(e.areaClusters, d.answer) ? e.areaClusters[d.answer] : null;
      // The form asked from the context's decision or asked outright; a page or link preset is not a test of it.
      if (d.area_source === "decision" || d.area_source === "ask") truths.push({ at: ev.at, kind: "answer", side: "jobs", truth: isMarket(market) ? market : "other", signals: before() });
      if (isMarket(market)) notePick("answer", market);
    } else if (ev.name?.startsWith("market_chosen_") && d.surface !== "jobs-form" && isMarket(d.market)) {
      const side = d.surface === "business" || d.surface === "locations-index" ? "business" : "jobs";
      truths.push({ at: ev.at, kind: "link", side, truth: d.market, surface: d.surface, signals: before() });
      notePick("link", d.market);
    } else if (ev.name === "area_nav_click") {
      if (d.surface && d.surface !== "business") noteAudience("jobs");
    } else if (ev.name === "language_choice" && d.locale) {
      languagePick = d.locale;
    }
  }
  return { points, truths };
}

const FIDELITY_KEYS = ["band", "intent", "second", "aud", "basis"];

/** What a context says in area_intent's terms, for comparing with the logged event. */
export const asLogged = (ctx) => ({
  band: ctx.region.band,
  intent: ctx.region.markets[0] ?? "none",
  second: ctx.region.markets[1] ?? "none",
  aud: ctx.audience.value,
  basis: ctx.region.basis,
});

/** Each logged area_intent beside the replay's decision at that moment (same path, latest recompute up to 3 s after). */
function fidelity(raw, points, e, tables, version) {
  const out = [];
  for (const ev of raw.events) {
    if (ev.name !== "area_intent" || Number(ev.data?.v) !== version) continue;
    const same = points.filter((p) => p.path === ev.path && p.at <= ev.at + 3000);
    const p = same[same.length - 1];
    if (!p) continue;
    const replayed = asLogged(e.resolveContext(p.signals, tables));
    const logged = Object.fromEntries(FIDELITY_KEYS.map((k) => [k, String(ev.data[k] ?? "none")]));
    out.push({ logged, replayed, match: FIDELITY_KEYS.every((k) => logged[k] === replayed[k]) });
  }
  return out;
}

/** A session's signals, with the vs_geo city/state flag that best reproduces its logged decisions. */
export function prepareSession(raw, e) {
  let best;
  for (const level of ["c", "s"]) {
    const built = rebuild(raw, e, level);
    const checks = fidelity(raw, built.points, e, e.tables, e.version);
    const hits = checks.filter((c) => c.match).length;
    if (!best || hits > best.hits) best = { ...built, checks, hits };
  }
  const geo = geoAt(raw.events, raw.events[0]?.at ?? 0);
  const firstJobsView = best.points.find((p) => p.kind === "view");
  return {
    id: raw.id,
    holdout: Boolean(raw.holdout),
    indianJobSeeker: geo?.country === "IN" && firstJobsView?.signals.page.audience === "jobs",
    firstView: firstJobsView,
    points: best.points,
    truths: best.truths,
    checks: best.checks,
  };
}

const rate = (hit, n) => ({ hit, n, rate: n ? hit / n : null });

/** Every metric for one set of tables, and each truth's decision (for diffs). */
export function score(prepared, e, tables) {
  const m = {
    confident: [0, 0],
    leaning: [0, 0],
    missed: [0, 0],
    restated: [0, 0],
    formCorrection: [0, 0],
    audience: [0, 0],
    audienceDecided: [0, 0],
    askRate: [0, 0],
    holdoutRegion: [0, 0],
  };
  const add = (k, hit) => {
    m[k][1] += 1;
    if (hit) m[k][0] += 1;
  };
  const decisions = [];
  for (const s of prepared) {
    if (s.indianJobSeeker && s.firstView) add("askRate", e.resolveContext(s.firstView.signals, tables).region.band === "unknown");
    for (const t of s.truths) {
      const ctx = e.resolveContext(t.signals, tables);
      decisions.push({ session: s.id, truth: t, ctx });
      if (t.kind === "audience") {
        const decided = ctx.audience.value !== "unknown";
        add("audienceDecided", decided);
        if (decided) add("audience", ctx.audience.value === t.truth);
        continue;
      }
      const { band, markets } = ctx.region;
      add("missed", band === "unknown");
      if (band === "stated") add("restated", markets.includes(t.truth));
      if (band === "confident") add("confident", markets[0] === t.truth);
      if (band === "leaning") add("leaning", markets.includes(t.truth));
      if (t.kind === "answer" && band !== "unknown" && band !== "stated") add("formCorrection", !markets.includes(t.truth));
      if (s.holdout && (band === "confident" || band === "leaning")) add("holdoutRegion", markets.includes(t.truth));
    }
  }
  return { metrics: Object.fromEntries(Object.entries(m).map(([k, [hit, n]]) => [k, rate(hit, n)])), decisions };
}

/** The rebuild against the logged decisions: share reproduced, and the commonest misses. */
export function fidelitySummary(prepared) {
  const checks = prepared.flatMap((s) => s.checks);
  const misses = {};
  for (const c of checks) {
    if (c.match) continue;
    const fields = FIDELITY_KEYS.filter((k) => c.logged[k] !== c.replayed[k]);
    const key = fields.map((k) => `${k} ${c.logged[k]}→${c.replayed[k]}`).join(", ");
    misses[key] = (misses[key] ?? 0) + 1;
  }
  return { ...rate(checks.filter((c) => c.match).length, checks.length), misses: Object.entries(misses).sort((a, b) => b[1] - a[1]) };
}

/** A short description of the evidence behind a decision, for grouping changed decisions. */
export function scenario(s) {
  const a = s.arrival ?? {};
  const parts = [];
  const arrival = [a.param && `param ${a.param}`, a.utm?.length && `utm ${a.utm.join("+")}`, a.landing && `landed ${a.landing}`].filter(Boolean);
  if (arrival.length) parts.push(`arrival ${arrival.join(", ")}`);
  parts.push(`${s.page.audience} page${s.page.market ? ` (${s.page.market})` : ""}`);
  const views = Object.entries(s.views ?? {}).filter(([, n]) => n);
  if (views.length) parts.push(`viewed ${views.map(([k, n]) => `${k}×${n}`).join(" ")}`);
  const wages = Object.entries(s.wageViews ?? {}).filter(([, n]) => n);
  if (wages.length) parts.push(`wages ${wages.map(([k, n]) => `${k}×${n}`).join(" ")}`);
  if (s.geo?.country) parts.push(`IP ${[s.geo.country, s.geo.state, s.geo.market].filter(Boolean).join("/")}`);
  const fresh = Math.floor(s.sessionStart / 1000) * 1000;
  for (const p of s.picks ?? []) parts.push(`${p.at >= fresh ? "picked" : "earlier"} ${p.kind} ${p.market}`);
  if (s.audiencePick) parts.push(`said ${s.audiencePick.audience}`);
  if (s.deviceLocales?.length) parts.push(`phone ${s.deviceLocales[0]}`);
  return parts.join(" · ");
}

const decisionText = (ctx, kind) =>
  kind === "audience" ? ctx.audience.value : ctx.region.markets.length ? `${ctx.region.band} ${ctx.region.markets.join("+")}` : ctx.region.band;

const right = (ctx, t) =>
  t.kind === "audience"
    ? ctx.audience.value === t.truth
    : ctx.region.band === "confident"
      ? ctx.region.markets[0] === t.truth
      : ctx.region.markets.includes(t.truth);

/**
 * Truths whose decision a candidate changed, grouped by scenario: how many,
 * the decision before and after, and how many each got right.
 */
export function diffs(base, cand) {
  const groups = new Map();
  for (let i = 0; i < base.decisions.length; i++) {
    const b = base.decisions[i];
    const c = cand.decisions[i];
    const kind = b.truth.kind;
    const before = decisionText(b.ctx, kind);
    const after = decisionText(c.ctx, kind);
    if (before === after) continue;
    const key = `${kind}|${scenario(b.truth.signals)}|${before}|${after}`;
    const g = groups.get(key) ?? { kind, scenario: scenario(b.truth.signals), before, after, n: 0, rightBefore: 0, rightAfter: 0, truths: {} };
    g.n += 1;
    if (right(b.ctx, b.truth)) g.rightBefore += 1;
    if (right(c.ctx, c.truth)) g.rightAfter += 1;
    g.truths[b.truth.truth] = (g.truths[b.truth.truth] ?? 0) + 1;
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.n - a.n || Math.abs(b.rightAfter - b.rightBefore) - Math.abs(a.rightAfter - a.rightBefore));
}

/** Wilson 95% interval, so two rates from small samples aren't read as different. */
export function wilson({ hit, n }) {
  if (!n) return null;
  const z = 1.96;
  const p = hit / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

/** Turns Umami's activity and event-data rows into the dump's session shape. */
export function toDumpSession(session, activity, eventData) {
  const events = [];
  for (const a of [...activity].sort((x, y) => at(x.createdAt) - at(y.createdAt))) {
    const base = { at: at(a.createdAt), path: a.urlPath, query: a.urlQuery || "" };
    if (a.eventType === 1) events.push({ ...base, type: "view" });
    else if (a.eventName) events.push({ ...base, type: "event", name: a.eventName, data: eventData[a.eventId] ?? {} });
  }
  return { id: session.id, language: session.language ?? "", holdout: session.holdout === "yes", events };
}

/** Event-data rows as one props object (strings, and numbers as numbers). */
export function eventProps(rows) {
  const out = {};
  for (const r of rows ?? []) out[r.dataKey] = r.dataType === 2 ? Number(r.numberValue) : r.stringValue;
  return out;
}

/** Which events the replay reads props from; the rest are skipped when fetching. */
export const NEEDS_DATA = (name) =>
  name === "area_intent" || name === "quick_step" || name === "area_nav_click" || name === "language_choice" || (typeof name === "string" && name.startsWith("market_chosen_"));
