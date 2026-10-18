// The weight-tuning replay (scripts/context-replay.mjs, scripts/lib/context-replay.mjs):
// a session rebuilt from Umami's events reproduces what the site decided,
// picks and form starts become the truths it is scored on, and a candidate's
// changed decisions are grouped by scenario.
import assert from "node:assert/strict";
import test from "node:test";
import {
  checkCandidate,
  diffs,
  eventProps,
  fidelitySummary,
  loadEngine,
  prepareSession,
  score,
  toDumpSession,
  wilson,
  withWeights,
} from "../scripts/lib/context-replay.mjs";

const e = await loadEngine();
const T0 = Date.UTC(2026, 10, 2, 5);
const S = 1000;

const intent = (over) => ({
  v: e.version,
  band: "unknown",
  intent: "none",
  second: "none",
  aud: "unknown",
  basis: "none",
  country: "IN",
  region: "UK",
  geo: "haridwar",
  ...over,
});

// A Haridwar ad from Roorkee: lands on /jobs/haridwar, opens 10th pass,
// taps "Jobs in Bengaluru", starts the form and answers Bengaluru North.
const adSession = {
  id: "s-ad",
  language: "hi-IN",
  holdout: false,
  events: [
    { at: T0, type: "view", path: "/hi-in/jobs/haridwar", query: "cluster=haridwar&utm_campaign=search_jobs_haridwar&gclid=x" },
    { at: T0 + S, type: "event", path: "/hi-in/jobs/haridwar", name: "area_intent", data: intent({ band: "confident", intent: "haridwar", aud: "jobs", basis: "arrival" }) },
    { at: T0 + 20 * S, type: "view", path: "/hi-in/jobs/10th-pass", query: "" },
    { at: T0 + 21 * S, type: "event", path: "/hi-in/jobs/10th-pass", name: "area_intent", data: intent({ band: "confident", intent: "haridwar", aud: "jobs", basis: "arrival" }) },
    { at: T0 + 40 * S, type: "event", path: "/hi-in/jobs/10th-pass", name: "market_chosen_bengaluru", data: { market: "bengaluru", surface: "jobs-row", decided: "haridwar", band: "confident", v: e.version } },
    { at: T0 + 41 * S, type: "event", path: "/hi-in/jobs/10th-pass", name: "area_nav_click", data: { cluster: "bengaluru", surface: "jobs-row", explicit: "yes" } },
    { at: T0 + 41 * S, type: "event", path: "/hi-in/jobs/10th-pass", name: "area_intent", data: intent({ band: "stated", intent: "bengaluru", aud: "jobs", basis: "stated" }) },
    { at: T0 + 60 * S, type: "event", path: "/hi-in/jobs/10th-pass", name: "job_form_start", data: {} },
    { at: T0 + 90 * S, type: "event", path: "/hi-in/jobs/10th-pass", name: "quick_step", data: { step: "area", answer: "bengaluru:north", area_source: "decision", decided: "bengaluru" } },
  ],
};

// An organic visitor from Roorkee reading the crew page, then starting the crew form.
const clientSession = {
  id: "s-client",
  language: "en-IN",
  holdout: true,
  events: [
    { at: T0, type: "view", path: "/en-in/minimum-wages/uttarakhand", query: "" },
    { at: T0 + S, type: "event", path: "/en-in/minimum-wages/uttarakhand", name: "area_intent", data: intent({}) },
    { at: T0 + 30 * S, type: "view", path: "/en-in/contact", query: "" },
    { at: T0 + 31 * S, type: "event", path: "/en-in/contact", name: "contact_form_start", data: {} },
  ],
};

test("a rebuilt session reproduces the site's logged decisions", () => {
  const s = prepareSession(adSession, e);
  assert.deepEqual(
    s.checks.map((c) => [c.match, c.replayed.band, c.replayed.intent]),
    [
      [true, "confident", "haridwar"],
      [true, "confident", "haridwar"],
      [true, "stated", "bengaluru"],
    ],
  );
  assert.equal(fidelitySummary([s]).rate, 1);
  // The pick, the form start and the area answer are the truths, each with the signals from before it.
  assert.deepEqual(
    s.truths.map((t) => [t.kind, t.truth]),
    [
      ["link", "bengaluru"],
      ["audience", "jobs"],
      ["answer", "bengaluru"],
    ],
  );
  assert.equal(s.indianJobSeeker, true);
});

test("scores: a confident miss, a stated answer, the audience", () => {
  const { metrics } = score([prepareSession(adSession, e), prepareSession(clientSession, e)], e, e.tables);
  assert.deepEqual([metrics.confident.hit, metrics.confident.n], [0, 1]);
  // After the tap the form's answer agrees with a stated decision: not a test of the guess.
  assert.deepEqual([metrics.restated.hit, metrics.restated.n], [1, 1]);
  assert.equal(metrics.formCorrection.n, 0);
  assert.deepEqual([metrics.audience.hit, metrics.audience.n], [2, 2]);
  assert.deepEqual([metrics.askRate.hit, metrics.askRate.n], [0, 1]);
});

test("a candidate's changed decisions are grouped by scenario", () => {
  const prepared = [prepareSession(adSession, e)];
  const base = score(prepared, e, e.tables);
  const cand = score(prepared, e, withWeights(e.tables, { jobs: { param: 0, utm: 0, landing: 0, agree: 0, page: 0, view: 0 } }));
  const changed = diffs(base, cand).filter((g) => g.kind === "link");
  assert.equal(changed.length, 1);
  assert.equal(changed[0].before, "confident haridwar");
  assert.match(changed[0].scenario, /arrival param haridwar, utm haridwar, landed haridwar/);
  assert.match(changed[0].scenario, /IP IN\/UK\/haridwar/);
  assert.deepEqual(changed[0].truths, { bengaluru: 1 });
});

test("candidates: only known weights, numbers only; the base tables untouched", () => {
  assert.deepEqual(checkCandidate(e.tables, { name: "ok", jobs: { ipCity: 4 }, bands: { leaningPoints: 4 } }), []);
  assert.deepEqual(checkCandidate(e.tables, { jobs: { ipcity: 4 }, region: {}, audience: { margin: "4" } }), [
    "unknown weight jobs.ipcity",
    'unknown group "region" (jobs, business, audience, bands, days)',
    "audience.margin must be a number",
  ]);
  const t = withWeights(e.tables, { jobs: { ipCity: 1 } });
  assert.equal(t.weights.jobs.ipCity, 1);
  assert.notEqual(e.tables.weights.jobs.ipCity, 1);
  assert.equal(t.weights.business.ipCity, e.tables.weights.business.ipCity);
});

test("Umami rows become the dump's session; intervals", () => {
  assert.deepEqual(
    eventProps([
      { dataKey: "v", dataType: 2, numberValue: "4", stringValue: "4.0000" },
      { dataKey: "band", dataType: 1, stringValue: "leaning" },
    ]),
    { v: 4, band: "leaning" },
  );
  const dumped = toDumpSession(
    { id: "u1", language: "hi-IN", holdout: "yes" },
    [
      { createdAt: "2026-11-02T05:00:01.000Z", urlPath: "/en-in", urlQuery: "", eventType: 2, eventName: "area_intent", eventId: "e2" },
      { createdAt: "2026-11-02T05:00:00.000Z", urlPath: "/en-in", urlQuery: "cluster=punjab", eventType: 1, eventName: null, eventId: "e1" },
    ],
    { e2: { band: "unknown" } },
  );
  assert.deepEqual(dumped, {
    id: "u1",
    language: "hi-IN",
    holdout: true,
    events: [
      { at: Date.parse("2026-11-02T05:00:00.000Z"), path: "/en-in", query: "cluster=punjab", type: "view" },
      { at: Date.parse("2026-11-02T05:00:01.000Z"), path: "/en-in", query: "", type: "event", name: "area_intent", data: { band: "unknown" } },
    ],
  });
  assert.equal(wilson({ hit: 0, n: 0 }), null);
  const [lo, hi] = wilson({ hit: 85, n: 100 });
  assert.ok(lo > 0.76 && lo < 0.78 && hi > 0.9 && hi < 0.92);
});
