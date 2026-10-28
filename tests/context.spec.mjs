// The visitor context (src/context, docs/visitor-context.md): audience,
// region and language, the pre-paint boot script and its CSS. The golden
// scenarios are the plan's (docs/visitor-context-plan.md §5.5): a change to
// weights.ts that moves one must bump CONTEXT_VERSION and rewrite it here on purpose.
import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { importTs } from "../scripts/lib/register-ts.mjs";

const { resolveContext } = await importTs("src/context/core.ts");
const { collectSignals, picksCookie, parsePicksCookie } = await importTs("src/context/collect.ts");
const { contextAttributes } = await importTs("src/context/attrs.ts");
const { contextTables, collectData, LOCALE_CODES } = await importTs("src/context/tables.ts");
const { bootScript, bootCss } = await importTs("src/context/boot.ts");
const { CONTEXT_VERSION, HOLDOUT_SHARE } = await importTs("src/context/weights.ts");

const T = contextTables();
const NOW = Date.UTC(2026, 9, 18, 6);
const HOUR = 36e5;
const base = (over = {}) => ({
  now: NOW,
  sessionStart: NOW - HOUR / 4,
  page: { audience: "jobs", locale: "en-IN", locales: ["en-IN", "hi-IN", "hi-Latn-IN"] },
  ...over,
});
const decide = (over) => resolveContext(base(over), T);
const region = (over) => {
  const c = decide(over);
  return [c.region.band, c.region.markets];
};

test("no signal: nothing decided, nothing shown, the default languages", () => {
  const c = decide({});
  assert.deepEqual([c.region.band, c.region.markets, c.sides.business, c.sides.jobs], ["unknown", [], [], []]);
  assert.equal(c.audience.value, "jobs");
  assert.equal(c.v, CONTEXT_VERSION);
});

test("golden: job seekers", () => {
  const ad = { arrival: { param: "jalandhar", utm: ["jalandhar"], landing: "jalandhar" }, page: { ...base().page, market: "jalandhar" }, views: { jalandhar: 1 }, geo: { country: "IN", state: "PB", market: "punjab", level: "city" } };
  const c = decide(ad);
  assert.deepEqual([c.region.band, c.region.markets, c.region.scores], ["confident", ["jalandhar"], { jalandhar: 16, punjab: 5 }]);
  assert.equal(c.region.basis, "arrival");
  assert.equal(c.region.arrival, "param");
  // ...then taps Bengaluru: a pick this session is the decision (owner decision 2).
  const picked = decide({ ...ad, page: { ...ad.page, market: "bengaluru" }, picks: [{ kind: "link", market: "bengaluru", at: NOW - 1000 }] });
  assert.deepEqual([picked.region.band, picked.region.markets], ["stated", ["bengaluru"]]);
  assert.deepEqual(picked.sides.jobs, ["bengaluru"]);
  // Next day a Haridwar ad, the Bengaluru pick from an earlier session: both, the ad first.
  assert.deepEqual(
    region({ arrival: { param: "haridwar", landing: "haridwar" }, page: { ...base().page, market: "haridwar" }, views: { haridwar: 1 }, picks: [{ kind: "link", market: "bengaluru", at: NOW - 24 * HOUR }] }),
    ["leaning", ["haridwar", "bengaluru"]],
  );
  // Organic /jobs/10th-pass from Roorkee: leaning Haridwar.
  assert.deepEqual(region({ geo: { country: "IN", state: "UK", market: "haridwar", level: "city" } }), ["leaning", ["haridwar"]]);
  // Viewed /jobs/haridwar, now on 10th-pass, IP Bengaluru: both.
  assert.deepEqual(region({ arrival: { landing: "haridwar" }, views: { haridwar: 1 }, geo: { country: "IN", state: "KA", market: "bengaluru", level: "city" } }), ["leaning", ["haridwar", "bengaluru"]]);
});

test("golden: clients", () => {
  const biz = { page: { audience: "business", locale: "en-IN", locales: ["en-IN"] } };
  // A Mumbai buyer lands on /locations/haridwar from Google (a mixed page: audience unknown, the mean weights).
  const mumbai = decide({ page: { audience: "mixed", market: "haridwar", locale: "en-IN", locales: ["en-IN"] }, arrival: { landing: "haridwar" }, views: { haridwar: 1 } });
  assert.deepEqual([mumbai.region.band, mumbai.region.markets, mumbai.sides.business], ["confident", ["haridwar"], ["haridwar"]]);
  // IP Bengaluru on the home page only: neutral (a buyer's IP is their head office).
  assert.deepEqual(region({ ...biz, geo: { country: "IN", state: "KA", market: "bengaluru", level: "city" } }), ["unknown", []]);
  // Read three Delhi NCR estates, IP Haridwar, now on /contact.
  assert.deepEqual(region({ ...biz, arrival: { landing: "delhi-ncr" }, views: { "delhi-ncr": 3 }, pagesByAudience: { business: 3 }, geo: { country: "IN", state: "UK", market: "haridwar", level: "city" } }), ["confident", ["delhi-ncr"]]);
  // A crew form for a Punjab site last week (owner decision 4): weighed, not stated.
  const site = decide({ ...biz, picks: [{ kind: "site", market: "jalandhar", at: NOW - 7 * 24 * HOUR }] });
  assert.deepEqual([site.region.band, site.region.markets, site.region.scores], ["confident", ["jalandhar"], { jalandhar: 14 }]);
  // A site place made this session is still evidence, never a pick.
  assert.equal(decide({ ...biz, picks: [{ kind: "site", market: "jalandhar", at: NOW }] }).region.band, "confident");
});

test("one arrival counts once: the strongest source, plus a bonus when sources agree", () => {
  const c = decide({ arrival: { param: "haridwar", utm: ["haridwar"], landing: "haridwar" } });
  assert.equal(c.region.scores.haridwar, 8 + 2);
  assert.equal(decide({ arrival: { utm: ["haridwar"] } }).region.scores.haridwar, 6);
  // Two markets in one arrival each count once.
  assert.deepEqual(decide({ arrival: { param: "haridwar", utm: ["bengaluru"] } }).region.scores, { haridwar: 8, bengaluru: 6 });
});

test("weights differ by audience: a worker's IP counts, a buyer's barely does", () => {
  const geo = { country: "IN", state: "UK", market: "haridwar", level: "city" };
  assert.equal(decide({ geo }).region.scores.haridwar, 5);
  assert.equal(decide({ geo, page: { audience: "business", locale: "en-IN", locales: ["en-IN"] } }).region.scores.haridwar, 1);
  // A buyer's estate browsing counts double a worker's.
  assert.equal(decide({ views: { haridwar: 3 }, page: { audience: "business", locale: "en-IN", locales: ["en-IN"] } }).region.scores.haridwar, 6);
  assert.equal(decide({ views: { haridwar: 3 } }).region.scores.haridwar, 3);
  // Wage pages: evidence for clients.
  assert.equal(decide({ wageViews: { punjab: 1 }, page: { audience: "business", locale: "en-IN", locales: ["en-IN"] } }).region.scores.punjab, 3);
});

test("audience: doors and forms state it; pages, ads and languages weigh it", () => {
  const aud = (over) => decide(over).audience;
  assert.equal(aud({ page: { audience: "mixed", locale: "en-IN", locales: ["en-IN"] } }).value, "unknown");
  assert.deepEqual(aud({ page: { audience: "mixed", locale: "en-IN", locales: ["en-IN"] }, audiencePick: { audience: "business", at: NOW } }), { value: "business", stated: true, scores: { jobs: 0, business: 0 } });
  // A jobs ad on a mixed page.
  assert.equal(aud({ page: { audience: "mixed", locale: "en-IN", locales: ["en-IN"] }, arrival: { audience: "jobs" } }).value, "jobs");
  // A Hinglish location page reads as a job seeker.
  assert.equal(aud({ page: { audience: "mixed", locale: "hi-Latn-IN", locales: ["en-IN", "hi-Latn-IN"] } }).value, "jobs");
  // A door from an earlier session weighs against the current page: neither leads by enough.
  assert.equal(aud({ page: { audience: "business", locale: "en-IN", locales: ["en-IN"] }, audiencePick: { audience: "jobs", at: NOW - 48 * HOUR } }).value, "unknown");
  assert.equal(aud({ page: { audience: "mixed", locale: "en-IN", locales: ["en-IN"] }, audiencePick: { audience: "jobs", at: NOW - 48 * HOUR } }).value, "jobs");
});

test("picks expire: links and sites after 90 days, form answers after 30", () => {
  const old = (kind, days) => decide({ picks: [{ kind, market: "punjab", at: NOW - days * 24 * HOUR }] }).region.markets;
  assert.deepEqual(old("link", 89), ["punjab"]);
  assert.deepEqual(old("link", 91), []);
  assert.deepEqual(old("answer", 29), ["punjab"]);
  assert.deepEqual(old("answer", 31), []);
});

test("sides: the page's own market leads its side; stand-ins cover a missing side", () => {
  const c = decide({ page: { ...base().page, market: "bengaluru" }, picks: [{ kind: "link", market: "punjab", at: NOW }] });
  assert.deepEqual(c.region.markets, ["punjab"]);
  assert.deepEqual(c.sides.jobs, ["bengaluru", "punjab"]);
  // Punjab has no buyer page: Jalandhar's stands in.
  assert.deepEqual(c.sides.business, ["bengaluru", "jalandhar"]);
});

test("nearby: job seekers outside our markets see the nearest first, never a decision", () => {
  const up = decide({ geo: { country: "IN", state: "UP", level: "state" } });
  assert.deepEqual([up.region.band, up.region.nearby, up.sides.jobs], ["unknown", ["haridwar", "uttarakhand"], []]);
  const ncr = decide({ geo: { country: "IN", state: "DL", market: "delhi-ncr", level: "city" } });
  assert.deepEqual([ncr.region.markets, ncr.sides.jobs, ncr.region.nearby], [["delhi-ncr"], [], ["haridwar", "uttarakhand"]]);
});

test("holdout: neutral sides whatever was inferred; a pick and the page's own market still apply", () => {
  const geo = { country: "IN", state: "UK", market: "haridwar", level: "city" };
  const held = decide({ geo, arrival: { param: "haridwar" }, holdout: true });
  assert.deepEqual([held.region.markets, held.sides.jobs, held.holdout], [["haridwar"], [], true]);
  assert.deepEqual(decide({ holdout: true, picks: [{ kind: "link", market: "bengaluru", at: NOW }] }).sides.jobs, ["bengaluru"]);
  assert.deepEqual(decide({ holdout: true, page: { ...base().page, market: "punjab" } }).sides.jobs, ["punjab"]);
  const attrs = contextAttributes(held, { locale: "en-IN" }, LOCALE_CODES);
  assert.equal(attrs["data-ctx-holdout"], "1");
  assert.equal(attrs["data-ctx-m1"], undefined);
  assert.equal(attrs["data-ctx-jd"], "none");
  // Nearby is inferred too: a held-out UP visitor sees the plain order (the jobs menu and form read it).
  const up = { geo: { country: "IN", state: "UP", level: "state" } };
  assert.deepEqual(decide({ ...up, holdout: true }).region.nearby, []);
  assert.deepEqual(decide({ ...up, holdout: true, picks: [{ kind: "link", market: "delhi-ncr", at: NOW }] }).region.nearby, ["haridwar", "uttarakhand"]);
});

test("collect: sessions end after 30 idle minutes or a new arrival; one page in two languages counts once", () => {
  const d = collectData();
  const input = (over) => ({ now: NOW, pathname: "/jobs/haridwar", search: "", cookie: "", session: null, languages: [], random: 0.5, ...over });
  const first = collectSignals(input({ search: "?utm_campaign=jobs_haridwar&cluster=haridwar" }), d);
  assert.deepEqual([first.signals.arrival.param, first.signals.arrival.utm, first.signals.arrival.landing, first.signals.arrival.audience], ["haridwar", ["haridwar"], "haridwar", "jobs"]);
  assert.deepEqual(first.signals.views, { haridwar: 1 });
  const again = collectSignals(input({ now: NOW + 60e3, pathname: "/hi-in/jobs/haridwar", session: first.session }), d);
  assert.deepEqual([again.signals.views, again.signals.sessionStart, again.locale], [{ haridwar: 1 }, NOW, "hi-IN"]);
  const idle = collectSignals(input({ now: NOW + 32 * 60e3, pathname: "/jobs", session: again.session }), d);
  assert.deepEqual([idle.signals.sessionStart, idle.signals.arrival.param], [NOW + 32 * 60e3, undefined]);
  const newAd = collectSignals(input({ now: NOW + 2 * 60e3, pathname: "/jobs", search: "?cluster=bengaluru", session: again.session }), d);
  assert.deepEqual([newAd.signals.sessionStart, newAd.signals.arrival.param, newAd.signals.views], [NOW + 2 * 60e3, "bengaluru", {}]);
  // The holdout is drawn once per session.
  assert.equal(collectSignals(input({ random: HOLDOUT_SHARE - 0.01 }), d).session.holdout, true);
  assert.equal(collectSignals(input({ random: HOLDOUT_SHARE }), d).session.holdout, false);
});

test("collect: cookies, phone languages, wage pages", () => {
  const d = collectData();
  const at = Math.floor(NOW / 1000) * 1000;
  const cookie = `vs_ctx=${encodeURIComponent(picksCookie([{ kind: "link", market: "punjab", at }, { kind: "site", market: "jalandhar", at }], { audience: "business", at }))}; vs_geo=IN.UK.haridwar.c; vspl_lang=hi-IN`;
  const o = collectSignals({ now: NOW, pathname: "/minimum-wages/punjab", search: "", cookie, session: null, languages: ["en-US", "hi", "kn-IN"], random: 0.5 }, d);
  assert.deepEqual(o.picks, [{ kind: "link", market: "punjab", at }, { kind: "site", market: "jalandhar", at }]);
  assert.deepEqual(o.signals.audiencePick, { audience: "business", at });
  assert.deepEqual(o.signals.geo, { country: "IN", state: "UK", market: "haridwar", level: "city" });
  assert.deepEqual(o.signals.deviceLocales, ["hi-IN", "hi-Latn-IN", "kn-IN"]);
  assert.equal(o.signals.languagePick, "hi-IN");
  assert.deepEqual(o.signals.wageViews, { punjab: 1 });
  assert.equal(o.signals.page.audience, "mixed");
  assert.deepEqual(parsePicksCookie(picksCookie(o.picks)), o.picks);
  // A market that isn't one is ignored; so is a malformed cookie.
  assert.deepEqual(collectSignals({ now: NOW, pathname: "/", search: "", cookie: "vs_ctx=l.saharanpur.1~zz; vs_geo=US...s", session: null, languages: [], random: 0.5 }, d).picks, []);
  // A damaged cookie (bad percent-encoding) is dropped alone; the other still counts.
  const pick = `vs_ctx=${encodeURIComponent(picksCookie([{ kind: "link", market: "punjab", at }]))}`;
  const badGeo = collectSignals({ now: NOW, pathname: "/", search: "", cookie: `${pick}; vs_geo=%ZZ`, session: null, languages: [], random: 0.5 }, d);
  assert.deepEqual([badGeo.picks.map((p) => p.market), badGeo.signals.geo], [["punjab"], undefined]);
  const badPicks = collectSignals({ now: NOW, pathname: "/", search: "", cookie: "vs_ctx=%E0%A4; vs_geo=IN.UK.haridwar.c", session: null, languages: [], random: 0.5 }, d);
  assert.deepEqual([badPicks.picks, badPicks.signals.geo?.market], [[], "haridwar"]);
  // Model 3's localStorage pick is read once, until the cookie has one.
  assert.deepEqual(collectSignals({ now: NOW, pathname: "/", search: "", cookie: "", session: null, legacyChoice: { cluster: "bengaluru", at: NOW - HOUR }, languages: [], random: 0.5 }, d).picks, [{ kind: "link", market: "bengaluru", at: NOW - HOUR }]);
});

test("attributes: header doors, Apply and the language switch follow the band", () => {
  const sure = decide({ picks: [{ kind: "link", market: "haridwar", at: NOW }] });
  const a = contextAttributes(sure, { locale: "en-IN" }, LOCALE_CODES);
  assert.deepEqual([a["data-ctx-jd"], a["data-ctx-apply"], a["data-ctx-j1"], a["data-ctx-band"]], ["one", "haridwar", "haridwar", "stated"]);
  // Leaning: labelled doors, Apply stays on /jobs/apply.
  const lean = contextAttributes(decide({ geo: { country: "IN", state: "UK", market: "haridwar", level: "city" } }), { locale: "en-IN" }, LOCALE_CODES);
  assert.deepEqual([lean["data-ctx-jd"], lean["data-ctx-apply"]], ["labelled", undefined]);
  // On a market's own page Apply opens its own hub (the form there).
  const own = contextAttributes(decide({ page: { ...base().page, market: "punjab" }, geo: { country: "IN", state: "KA", market: "bengaluru", level: "city" } }), { locale: "en-IN", market: "punjab" }, LOCALE_CODES);
  assert.equal(own["data-ctx-apply"], "punjab");
  // The switch on /hi-in/jobs for a visitor in Karnataka: ಕನ್ನಡ then English (kept among the first two).
  const five = ["en-IN", "hi-IN", "hi-Latn-IN", "pa-IN", "kn-IN"];
  const ka = decide({ page: { audience: "jobs", locale: "hi-IN", locales: five }, geo: { country: "IN", state: "KA", market: "bengaluru", level: "city" } });
  const k = contextAttributes(ka, { locale: "hi-IN" }, LOCALE_CODES);
  assert.deepEqual([k["data-ctx-lr-kn"], k["data-ctx-lr-en"], k["data-ctx-lr-hi"]], ["0", "1", undefined]);
  // English fourth in a Punjab visitor's order still takes the second place on a non-English page.
  const pb = decide({ page: { audience: "jobs", locale: "hi-IN", locales: five }, geo: { country: "IN", state: "PB", market: "punjab", level: "state" }, deviceLocales: ["kn-IN"] });
  const p = contextAttributes(pb, { locale: "hi-IN" }, LOCALE_CODES);
  assert.equal(p["data-ctx-lr-en"], "1");
});

test("boot script: self-contained, runs before paint and sets the attributes", () => {
  const run = (url, cookie, languages = ["en-IN"]) => {
    const u = new URL(url);
    const attrs = {};
    const store = {};
    const sandbox = {
      location: { pathname: u.pathname, search: u.search },
      document: { cookie, documentElement: { setAttribute: (k, v) => (attrs[k] = v) } },
      navigator: { languages },
      sessionStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = v) },
      localStorage: { getItem: () => null },
      URLSearchParams,
      // A fixed draw above the holdout share: with Math.random() about one
      // run in ten fell in the holdout and lost its inferred sides.
      Math: Object.assign(Object.create(Math), { random: () => HOLDOUT_SHARE + 0.01 }),
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(bootScript(), sandbox);
    return { attrs, store, ctx: sandbox.__vsctx };
  };
  const r = run("https://www.vayasyaseva.com/jobs/10th-pass", "vs_geo=IN.UK.haridwar.c");
  assert.equal(r.attrs["data-ctx"], String(CONTEXT_VERSION));
  assert.deepEqual([r.attrs["data-ctx-aud"], r.attrs["data-ctx-band"], r.attrs["data-ctx-j1"], r.attrs["data-ctx-jd"]], ["jobs", "leaning", "haridwar", "labelled"]);
  assert.ok(r.store["vs-ctx-session-v1"]);
  assert.equal(r.ctx.pathname, "/jobs/10th-pass");
  // A damaged picks cookie still leaves the IP's decision.
  assert.equal(run("https://www.vayasyaseva.com/jobs/10th-pass", "vs_ctx=%E0%A4; vs_geo=IN.UK.haridwar.c").attrs["data-ctx-j1"], "haridwar");
  // A broken environment leaves the neutral page, never an error.
  assert.doesNotThrow(() => vm.runInContext(bootScript(), vm.createContext({})));
  // The data never closes the script tag early.
  assert.ok(!bootScript().includes("</"));
});

test("css: one rule set per market; rules only hide, order or mark", () => {
  const css = bootCss();
  for (const m of T.markets) assert.ok(css.includes(`[data-ctx-j1="${m}"]`), m);
  const declarations = [...css.matchAll(/\{([^}]*)\}/g)].map((x) => x[1]);
  for (const d of declarations) assert.match(d, /^(display:none|order:-?\d+|font-weight:600;text-decoration-color:var\(--gold-700\))$/, d);
});

test("report: decisions are sent once per context session, not once per tab", async () => {
  const store = {};
  const sent = [];
  globalThis.window = {
    sessionStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = v) },
    umami: { track: (name) => sent.push(name) },
    dispatchEvent: () => true,
  };
  try {
    const { reportContext } = await importTs("src/context/report.ts");
    const signals = base({ geo: { country: "IN", state: "UK", market: "haridwar", level: "city" } });
    const ctx = resolveContext(signals, T);
    const decisions = () => sent.filter((n) => n === "area_intent").length;
    reportContext(ctx, signals);
    reportContext(ctx, signals);
    assert.equal(decisions(), 1);
    // The same tab, a new session after idle time with the same decision: reported again.
    const later = { ...signals, sessionStart: NOW + HOUR };
    reportContext(resolveContext(later, T), later);
    assert.equal(decisions(), 2);
    assert.equal(sent.filter((n) => n === "market_shown_haridwar").length, 2);
  } finally {
    delete globalThis.window;
  }
});
