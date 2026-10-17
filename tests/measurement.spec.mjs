// What the site measures, as it stands, for the consent and measurement
// refactor (roadmap 1C) to keep exactly:
//   1. the consent matrix: for each stored consent state, which tags load,
//      the Consent Mode default, whether the ad click is kept and sent, and
//      whether the banner shows;
//   2. the golden payloads: every Umami, Google tag and Meta call a full job
//      application makes, unanswered and with Allow All, timings stripped
//      (tests/fixtures/measurement-golden.json).
// Runs against a production build with a Umami website id set, all
// third-party scripts stubbed and the APIs mocked; nothing leaves the machine:
//   NEXT_PUBLIC_UMAMI_WEBSITE_ID=00000000-0000-4000-8000-000000000000 pnpm build && pnpm start
//   pnpm measurement:check            (MEASUREMENT_TEST_ORIGIN, default http://localhost:3000)
//   MEASUREMENT_WRITE=1 pnpm measurement:check   rewrites the golden file (an intended change only)
// The Meta Pixel needs its own build (NEXT_PUBLIC_META_PIXEL_ID); it is dormant, so only "off" is checked.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

const origin = process.env.MEASUREMENT_TEST_ORIGIN ?? "http://localhost:3000";
const GOLDEN = new URL("./fixtures/measurement-golden.json", import.meta.url);
const KEY = "vayasya-site-measurement-v8";
const DAY = 864e5;
const GCLID = "TeStClIcK-0123456789abcdef";
const APPLY = "/en-in/jobs/apply?work=any&experience=fresher&education=12th&shift=day&start=now&area=laksar";

const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROME ? { executablePath: process.env.PLAYWRIGHT_CHROME } : {}) });

/** A fresh browser with consent `stored` (localStorage entries) or storage blocked, every third party stubbed. */
async function session(stored, { blockStorage = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  await context.addInitScript(
    ({ stored, blockStorage }) => {
      window.__calls = [];
      window.turnstile = { render: (_box, o) => (queueMicrotask(() => o.callback("token")), "w1"), reset() {}, remove() {} };
      if (blockStorage) {
        Object.defineProperty(window, "localStorage", { get() { throw new DOMException("blocked", "SecurityError"); } });
        return;
      }
      if (!sessionStorage.getItem("__seeded")) {
        for (const [k, v] of Object.entries(stored)) localStorage.setItem(k, v);
        sessionStorage.setItem("__seeded", "1");
      }
    },
    { stored, blockStorage },
  );
  const requested = new Set();
  const calls = [];
  // Umami: a stand-in tracker that records each call.
  await context.route("**/_t/s.js", (r) =>
    r.fulfill({
      contentType: "application/javascript",
      body: `window.umami={track(a,b){window.__calls.push(typeof a==="function"?["umami.pageview",a({}).url]:["umami.track",a,b??null])},identify(d){window.__calls.push(["umami.identify",d])}};`,
    }),
  );
  await context.route("**/_t/recorder.js", (r) => (requested.add("umami-recorder"), r.fulfill({ contentType: "application/javascript", body: "" })));
  await context.route("**/_t/e", (r) => r.fulfill({ status: 200, body: "" }));
  await context.route(/googletagmanager\.com\//, (r) => (requested.add("gtag.js"), r.fulfill({ contentType: "application/javascript", body: "" })));
  await context.route(/connect\.facebook\.net\//, (r) => (requested.add("meta"), r.fulfill({ contentType: "application/javascript", body: "" })));
  await context.route("**/_vercel/insights/**", (r) => r.fulfill({ status: 200, body: "" }));
  await context.route("**/challenges.cloudflare.com/**", (r) => r.fulfill({ contentType: "application/javascript", body: "" }));
  await context.route("**/api/context", (r) => r.fulfill({ json: { country: "IN", region: "UK", city: "Haridwar" } }));
  await context.route("**/api/jobs/start", (r) => r.fulfill({ json: { ref: "VS-J-TEST01", ticket: "ticket-1", uploads: [] } }));
  await context.route("**/api/jobs/submit", (r) => (calls.push(["submit", r.request().postDataJSON()]), r.fulfill({ status: 202, json: { ref: "VS-J-TEST01" } })));
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return { context, page, requested, calls, errors };
}

const fresh = () => ({ [KEY]: "accepted", [`${KEY}-at`]: String(Date.now() - DAY) });
const STATES = {
  unanswered: [{}],
  "allow all": [fresh()],
  "allow all, 181 days old": [{ [KEY]: "accepted", [`${KEY}-at`]: String(Date.now() - 181 * DAY) }],
  "allow all, dated in the future": [{ [KEY]: "accepted", [`${KEY}-at`]: String(Date.now() + DAY) }],
  "required only": [{ [KEY]: "rejected" }],
  "required only under v4, then allow all": [{ ...fresh(), "vayasya-site-measurement-v4": "rejected" }],
  "storage blocked": [{}, { blockStorage: true }],
};

/** Today's behaviour per state. The refactor keeps every cell. */
const EXPECTED = {
  unanswered: { banner: true, gtag: false, consentDefault: false, adsConfig: false, recorder: false, adClickKept: true, adClickSent: true },
  "allow all": { banner: false, gtag: true, consentDefault: true, adsConfig: true, recorder: true, adClickKept: true, adClickSent: true },
  "allow all, 181 days old": { banner: true, gtag: false, consentDefault: false, adsConfig: false, recorder: false, adClickKept: true, adClickSent: true },
  "allow all, dated in the future": { banner: true, gtag: false, consentDefault: false, adsConfig: false, recorder: false, adClickKept: true, adClickSent: true },
  "required only": { banner: false, gtag: false, consentDefault: false, adsConfig: false, recorder: false, adClickKept: false, adClickSent: false },
  // An old refusal still stops the ad-click report after a later Allow All (src/lib/ad-click.ts scans every version).
  "required only under v4, then allow all": { banner: false, gtag: true, consentDefault: true, adsConfig: true, recorder: true, adClickKept: false, adClickSent: false },
  // Blocked storage: opt-in tags fail closed, the ad-click report fails open.
  "storage blocked": { banner: true, gtag: false, consentDefault: false, adsConfig: false, recorder: false, adClickKept: true, adClickSent: true },
};

/** Sends a full guided application from an ad click; returns the submitted body. */
async function apply(s, extra = "") {
  await s.page.goto(`${origin}${APPLY}&gclid=${GCLID}${extra}`);
  await s.page.waitForTimeout(300);
  await s.page.locator("[data-analytics-form=quick] button[type=submit]").click();
  // The form moves focus to the name field once the step has settled (as in forms.spec.mjs); typing before that can land in the wrong field.
  await s.page.waitForFunction(() => {
    const el = document.querySelector("#quick-name");
    return el && document.activeElement === el && el.getBoundingClientRect().top >= 64 && el.getBoundingClientRect().top < 200;
  }, null, { timeout: 8000 });
  await s.page.locator("#quick-name").fill("Measure Test");
  await s.page.locator("#quick-phone").fill("9999900001");
  await s.page.locator("[name=agree]").check();
  await s.page.locator("[data-analytics-form=quick] button[type=submit]").click();
  await s.page.locator(".jobs-done h2").waitFor({ timeout: 10000 });
  await s.page.waitForTimeout(300);
  return s.calls.find(([k]) => k === "submit")?.[1];
}

/** Numbers that vary run to run (timings, positions), as a placeholder. */
const VARYING = /seconds|time|_ms$|^ms$|duration|position_y|percent/i;
function stable(value, key = "") {
  if (Array.isArray(value)) return value.map((v) => stable(v));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stable(v, k)]));
  if (typeof value === "number" && VARYING.test(key)) return "<n>";
  if (typeof value === "string" && /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(value)) return "<date>";
  if (typeof value === "string" && /^\d+(:\d+)?(,|$)/.test(value) && VARYING.test(key)) return "<n>";
  return value;
}

/** Every tracker call so far: the Umami stand-in's log and the Google tag's dataLayer. */
async function trackerCalls(page) {
  return page.evaluate(() => [
    ...window.__calls.map((c) => JSON.parse(JSON.stringify(c))),
    ...(window.dataLayer ?? []).map((entry) => ["dataLayer", JSON.parse(JSON.stringify(Array.from(entry)))]),
  ]);
}

const golden = {};
try {
  for (const [name, [stored, opts]] of Object.entries(STATES)) {
    const s = await session(stored, opts);
    const body = await apply(s);
    const seen = await s.page.evaluate(() => ({
      banner: Boolean(document.querySelector(".consent-banner")),
      consentDefault: Boolean(document.querySelector("#google-consent")),
      adsConfig: Boolean(document.querySelector("#google-ads-config")),
      metaPixel: Boolean(document.querySelector("#meta-pixel")),
      firstDataLayer: window.dataLayer?.[0] ? Array.from(window.dataLayer[0]) : null,
    }));
    const actual = {
      banner: seen.banner,
      gtag: s.requested.has("gtag.js"),
      consentDefault: seen.consentDefault,
      adsConfig: seen.adsConfig,
      recorder: s.requested.has("umami-recorder"),
      adClickKept: await s.page.evaluate(() => { try { return sessionStorage.getItem("vayasya-ad-click") !== null; } catch { return null; } }),
      adClickSent: Boolean(body?.adClick),
    };
    assert.deepEqual(actual, EXPECTED[name], name);
    assert.equal(seen.metaPixel || s.requested.has("meta"), false, `${name}: Meta Pixel is dormant`);
    if (actual.consentDefault) {
      // Consent Mode default goes first, ahead of the Google tag's own init.
      assert.deepEqual(seen.firstDataLayer, ["consent", "default", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "denied" }], name);
    }
    if (actual.adClickSent) assert.deepEqual(body.adClick, { type: "gclid", id: GCLID }, name);
    assert.deepEqual(s.errors, [], `${name}: no script errors`);
    if (name === "unanswered" || name === "allow all") {
      golden[name] = (await trackerCalls(s.page)).map((c) => stable(c)).map((c) => JSON.stringify(c)).sort();
    }
    await s.context.close();
    console.log(`consent: ${name} ✓`);
  }

  if (process.env.MEASUREMENT_WRITE) {
    writeFileSync(GOLDEN, `${JSON.stringify(golden, null, 2)}\n`);
    console.log(`Wrote ${GOLDEN.pathname}`);
  } else {
    const expected = JSON.parse(readFileSync(GOLDEN, "utf8"));
    for (const state of Object.keys(expected)) {
      const missing = expected[state].filter((c) => !golden[state].includes(c));
      const extra = golden[state].filter((c) => !expected[state].includes(c));
      assert.deepEqual({ missing, extra }, { missing: [], extra: [] }, `golden payloads, ${state}`);
    }
    console.log("golden payloads match: every tracker call of a job application, unanswered and with Allow All");
  }
  console.log("Measurement checks passed (mocked third parties and APIs; nothing sent).");
} finally {
  await browser.close();
}
