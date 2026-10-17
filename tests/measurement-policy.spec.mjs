// The consent and measurement module's pure layer (src/lib/measurement,
// roadmap 1C): the policy matches today's rules, the registry, ledger,
// notice and catalogue agree with each other and with the docs. The browser
// side is pinned by tests/measurement.spec.mjs (pnpm measurement:check).
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { importTs, root } from "../scripts/lib/register-ts.mjs";

const policy = await importTs("src/lib/measurement/policy.ts");
const { PURPOSES, PURPOSE_IDS } = await importTs("src/lib/measurement/purposes.ts");
const { CONSENT_VERSION, CONSENT_LEDGER, latestLedgerEntry } = await importTs("src/lib/measurement/ledger.ts");
const { consentFingerprint } = await importTs("src/lib/measurement/fingerprint.ts");
const { noticeRows } = await importTs("src/lib/measurement/notice.ts");
const { BANNER } = await importTs("src/lib/measurement/copy.ts");
const { consentDefaultSnippet } = await importTs("src/lib/measurement/vendors/gtag-snippets.ts");
const catalogue = await importTs("src/lib/measurement/catalogue/index.ts");
const routes = await importTs("src/lib/measurement/routes.ts");
const { MARKET_IDS, eventKey } = await importTs("src/markets/index.ts");
const { analyticsSummary, privacyContent } = await importTs("src/content/privacy.ts");
const { privacyRetentionProblems } = await import("../scripts/check-privacy-retention.mjs");

const DAY = 864e5;
const NOW = Date.UTC(2026, 9, 17, 12);
const PROD = { production: true, gaId: "G-TEST", googleAdsId: "AW-TEST", umamiWebsiteId: "u", metaPixelId: undefined };
const state = (over) => ({ blocked: false, choice: null, at: 0, legacyRefused: false, now: NOW, ...over });
const fresh = { choice: "accepted", at: NOW - DAY };

test("policy truth table: today's rules for the banner, opt-in purposes and the ad-click report", () => {
  // [case, state, banner, opt-in (ga4), ad-click report]
  const rows = [
    ["unanswered", state({}), null, false, true],
    ["allow all", state(fresh), "accepted", true, true],
    ["allow all, 179 days old", state({ choice: "accepted", at: NOW - 179 * DAY }), "accepted", true, true],
    ["allow all, exactly 180 days old", state({ choice: "accepted", at: NOW - 180 * DAY }), null, false, true],
    ["allow all, 181 days old", state({ choice: "accepted", at: NOW - 181 * DAY }), null, false, true],
    ["allow all, dated in the future", state({ choice: "accepted", at: NOW + DAY }), null, false, true],
    ["allow all, no date", state({ choice: "accepted", at: 0 }), null, false, true],
    ["allow all, date not a number", state({ choice: "accepted", at: Number("soon") }), null, false, true],
    ["allow all, dated now", state({ choice: "accepted", at: NOW }), "accepted", true, true],
    ["unknown value", state({ choice: "maybe" }), null, false, true],
    // The scan in the store counts the current key too, so a current refusal is a legacy refusal.
    ["required only", state({ choice: "rejected", legacyRefused: true }), "rejected", false, false],
    ["required only under v4, then allow all", state({ ...fresh, legacyRefused: true }), "accepted", true, false],
    ["storage blocked", policy.blockedState(NOW), null, false, true],
  ];
  for (const [name, s, banner, optIn, adClick] of rows) {
    assert.equal(policy.bannerState(s), banner, `${name}: banner`);
    for (const id of ["ga4", "replays", "form-drafts", "ads-measurement"]) assert.equal(policy.decide(id, s, PROD), optIn, `${name}: ${id}`);
    assert.equal(policy.decide("ads-click-report", s, PROD), adClick, `${name}: ads-click-report`);
    for (const id of ["basic-counts", "form-behaviour", "area-intent", "server-counts", "language-preference"]) assert.equal(policy.decide(id, s, PROD), true, `${name}: ${id}`);
  }
});

test("a purpose runs only where the build can run it", () => {
  const s = state(fresh);
  assert.equal(policy.decide("ga4", s, { ...PROD, gaId: undefined }), false);
  assert.equal(policy.decide("ads-measurement", s, { ...PROD, googleAdsId: undefined }), false);
  assert.equal(policy.decide("replays", s, { ...PROD, umamiWebsiteId: undefined }), false);
  assert.equal(policy.decide("meta-pixel", s, PROD), false, "Meta Pixel is dormant without an id");
  assert.equal(policy.decide("meta-pixel", s, { ...PROD, metaPixelId: "1" }), true);
  assert.equal(policy.decide("server-counts", s, { ...PROD, production: false }), false);
});

test("the server decides the ad-click report from the browser's claim as the browser would", () => {
  for (const s of [state({}), state(fresh), state({ choice: "rejected", legacyRefused: true }), state({ ...fresh, legacyRefused: true }), policy.blockedState(NOW)]) {
    const claim = policy.claimOf(s, CONSENT_VERSION);
    assert.equal(policy.decide("ads-click-report", policy.stateOfClaim(claim, NOW), PROD), policy.decide("ads-click-report", s, PROD), JSON.stringify(claim));
  }
  assert.deepEqual(policy.claimOf(state({ choice: "rejected", legacyRefused: true }), 8), { v: 8, choice: "required", legacyRefused: true });
  assert.deepEqual(policy.dataManagerConsent(), { adPersonalization: "CONSENT_DENIED" });
});

test("the Consent Mode default equals today's literal, key order included", () => {
  const accepted = state(fresh);
  const defaults = policy.googleConsentDefault((id) => policy.consentAllows(id, accepted));
  assert.equal(JSON.stringify(defaults), JSON.stringify({ ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "denied" }));
  assert.equal(
    consentDefaultSnippet(defaults),
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'granted',analytics_storage:'granted',ad_user_data:'granted',ad_personalization:'denied'});gtag('set',{allow_google_signals:false,allow_ad_personalization_signals:false});",
  );
  assert.ok(!PURPOSES.some((p) => p.consentModeSignals.includes("ad_personalization")), "no purpose grants ad personalisation");
});

test("the registry: unique ids, a version that covers every purpose, a notice for every enabled purpose", () => {
  assert.deepEqual(PURPOSES.map((p) => p.id), [...PURPOSE_IDS]);
  assert.ok(CONSENT_VERSION >= Math.max(...PURPOSES.map((p) => p.since)), "CONSENT_VERSION >= max(since)");
  for (const p of PURPOSES) {
    if (p.id === "meta-pixel") {
      assert.equal(p.enabled(PROD), false, "meta-pixel is off in this build, so it may have no notice");
      assert.equal(p.notice, null);
      continue;
    }
    assert.ok(p.notice, `${p.id} needs a notice entry`);
    assert.ok(privacyContent.includes(p.notice.lead), `${p.id}: privacy.ts has no paragraph "${p.notice.lead}"`);
  }
});

test("the ledger: consecutive versions, the latest is CONSENT_VERSION and carries today's fingerprint", () => {
  assert.deepEqual(CONSENT_LEDGER.map((e) => e.v), CONSENT_LEDGER.map((_, i) => i + 1));
  assert.equal(latestLedgerEntry().v, CONSENT_VERSION);
  assert.equal(
    consentFingerprint(),
    latestLedgerEntry().fingerprint,
    "The purpose registry or the banner copy changed. Add a ledger entry (src/lib/measurement/ledger.ts) with the new fingerprint, and agree with the owner whether it bumps the consent version.",
  );
  for (const v of [7, 8]) assert.equal(CONSENT_LEDGER[v - 1].signoff, "pending");
});

test("the banner has the same five locales and keys", () => {
  assert.deepEqual(Object.keys(BANNER), ["en-IN", "hi-IN", "hi-Latn-IN", "kn-IN", "pa-IN"]);
  for (const copy of Object.values(BANNER)) {
    assert.deepEqual(Object.keys(copy), ["label", "question", "more", "less", "reject", "accept", "details", "privacy", "end"]);
    assert.match(copy.details, /30/, "every locale names the 30-day unsent-form period");
  }
});

test("noticeRows() is today's §3 table", () => {
  const today = JSON.parse(readFileSync(join(root, "tests/fixtures/privacy-analytics-summary.json"), "utf8"));
  assert.deepEqual(noticeRows(), today);
  assert.deepEqual(analyticsSummary, today);
});

test("the catalogue is well formed and agrees with the gateway's route tables", () => {
  const sinks = new Set(["umami", "ga4", "meta", "google-ads", "umami-server"]);
  const classes = new Set(["anonymous", "pseudonymous", "personal"]);
  for (const [id, spec] of Object.entries(catalogue.EVENTS)) {
    assert.ok(PURPOSE_IDS.includes(spec.purpose), `${id}: purpose`);
    assert.ok(spec.sinks.length && spec.sinks.every((s) => sinks.has(s)), `${id}: sinks`);
    assert.ok(Object.values(spec.props).every((c) => classes.has(c)), `${id}: data classes`);
    assert.ok(spec.source, `${id}: source`);
    assert.equal(spec.meta ?? null, routes.META_EVENTS[id] ?? null, `${id}: Meta mapping`);
    assert.equal(spec.completesForm ?? null, routes.FORM_DONE[id] ?? null, `${id}: completesForm`);
    if (spec.meta) assert.ok(spec.sinks.includes("meta"), `${id}: mapped to Meta, so meta is a sink`);
  }
  for (const name of catalogue.wireNames()) assert.ok(catalogue.resolveEvent(name)?.listed, `${name} resolves`);
  assert.equal(catalogue.resolveEvent("no_such_event"), null);
  assert.deepEqual(catalogue.sanitise("job_form_start", { locale: "en-IN", variant: "quick", page: "/en-in/jobs/apply" }, ["umami", "ga4"]), []);
  assert.equal(catalogue.sanitise("job_form_start", { phone: "9999900001" }, ["umami"]).length, 1, "an undeclared property is reported");
  assert.equal(catalogue.sanitise("intent_by_page", { markets: "haridwar", mode: "single", v: 2 }, ["ga4"]).length, 1, "a board event sent to GA4 is reported");
});

test("no personal property goes to an analytics sink, except the documented draft exception", () => {
  const personal = Object.entries(catalogue.EVENTS).filter(([, spec]) => Object.values(spec.props).includes("personal"));
  assert.deepEqual(personal.map(([id]) => id), ["form_abandon_draft"]);
  const [, draft] = personal[0];
  assert.deepEqual([...draft.sinks], ["umami"], "drafts go to Umami only");
  assert.equal(draft.purpose, "form-drafts");
  assert.match(draft.exception, /30 days/);
  assert.ok(!Object.values(catalogue.SESSION_PROPS).includes("personal"));
});

test("every event the area-intent doc names resolves in the catalogue", () => {
  const doc = readFileSync(join(root, "docs/area-intent.md"), "utf8");
  const board = doc.slice(doc.indexOf("## The Umami board"), doc.indexOf("## Storage and privacy"));
  const names = new Set();
  for (const row of board.split("\n").filter((l) => l.startsWith("|") && !l.startsWith("|---") && !l.startsWith("| Board"))) {
    for (const [, name] of row.split("|")[2].matchAll(/`([a-z_<>]+)`/g)) names.add(name);
  }
  for (const [, name] of doc.matchAll(/^- (?:Server )?`([a-z_]+)`/gm)) names.add(name);
  assert.ok(names.size >= 15, `found ${names.size} board events`);
  for (const name of names) {
    const expanded = name.includes("<market>") ? MARKET_IDS.map((m) => name.replace("<market>", eventKey(m))) : [name];
    for (const wire of expanded) assert.ok(catalogue.resolveEvent(wire)?.listed, `${wire} (docs/area-intent.md) is not in the catalogue`);
  }
});

test("every event name sent from src/ is in the catalogue", () => {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(name)) files.push(path);
    }
  };
  walk(join(root, "src"));
  const sent = new Set();
  const CALL = /\b(?:track|trackServerEvent|reportServerCount|once)\(\s*(?:`[^`]*`\s*,\s*)?["']([a-z_]+)["']/g;
  const LINK = /\["([a-z_]+)", \{/g;
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const [, name] of text.matchAll(CALL)) sent.add(name);
    if (file.endsWith("analytics-tracker.tsx")) for (const [, name] of text.matchAll(LINK)) sent.add(name);
  }
  assert.ok(sent.size >= 40, `found ${sent.size} event names at call sites`);
  for (const name of sent) assert.ok(catalogue.resolveEvent(name), `${name} is sent but not in the catalogue`);
});

test("retention: every period in the privacy notice matches the registry", async () => {
  const { problems } = await privacyRetentionProblems();
  assert.deepEqual(problems, []);
});
