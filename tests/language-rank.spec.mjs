// Language picker ranking and the header quick switch (PLAN §6.4,
// src/lib/language-rank.ts, src/lib/i18n.ts).
import assert from "node:assert/strict";
import test from "node:test";
import { importTs } from "../scripts/lib/register-ts.mjs";

const rank = await importTs("src/lib/language-rank.ts");
const i18n = await importTs("src/lib/i18n.ts");

const ALL = ["en-IN", "hi-IN", "hi-Latn-IN"];
const order = (input, available = ALL) => rank.rankLocales(available, input);

test("default, crawlers and visitors outside India: English · हिंदी · Hinglish", () => {
  assert.deepEqual(order({}), ["en-IN", "hi-IN", "hi-Latn-IN"]);
  assert.deepEqual(order({ country: "US", region: "CA", acceptLanguage: "en-US,en;q=0.9" }), ["en-IN", "hi-IN", "hi-Latn-IN"]);
  // Outside India the default set comes before the page's cluster.
  assert.deepEqual(order({ country: "US", cluster: "haridwar" }), ["en-IN", "hi-IN", "hi-Latn-IN"]);
});

test("Hindi belt by region: हिंदी · Hinglish · English, old and new codes", () => {
  for (const region of ["UP", "UK", "UT", "DL", "HR", "BR", "CG", "CT"]) {
    assert.deepEqual(order({ country: "IN", region }), ["hi-IN", "hi-Latn-IN", "en-IN"], region);
  }
  assert.deepEqual(order({ country: "IN", region: "PB" }), ["hi-Latn-IN", "en-IN", "hi-IN"]);
  // Karnataka until kn-IN is published.
  assert.deepEqual(order({ country: "IN", region: "KA" }), ["en-IN", "hi-Latn-IN", "hi-IN"]);
  // A state without a set (and Maharashtra, until promoted) falls to the page's cluster, then the default.
  assert.deepEqual(order({ country: "IN", region: "MH" }), ["en-IN", "hi-IN", "hi-Latn-IN"]);
  assert.deepEqual(order({ country: "IN", region: "TN", cluster: "haridwar" }), ["hi-IN", "hi-Latn-IN", "en-IN"]);
});

test("Accept-Language: non-English tags by q-value; English never pushes others down; with no signal an Indian region leads", () => {
  assert.deepEqual(order({ acceptLanguage: "en-IN,en;q=0.9,hi;q=0.8", country: "US" }), ["hi-IN", "hi-Latn-IN", "en-IN"]);
  // No cookie, no intent: location weighs more than the browser's list (owner direction, 17 Oct 2026).
  assert.deepEqual(order({ acceptLanguage: "hi-Latn-IN", country: "IN", region: "UP" }), ["hi-IN", "hi-Latn-IN", "en-IN"]);
  assert.deepEqual(order({ acceptLanguage: "hi;q=0", country: "US" }), ["en-IN", "hi-IN", "hi-Latn-IN"]);
  assert.deepEqual(order({ acceptLanguage: "kn-IN,hi;q=0.5", country: "IN", region: "KA" }), ["en-IN", "hi-Latn-IN", "hi-IN"]);
  // With intent in the request, the browser's languages come before the region again.
  assert.deepEqual(order({ acceptLanguage: "hi-Latn-IN", country: "IN", region: "UP", intent: "haridwar" }), ["hi-Latn-IN", "hi-IN", "en-IN"]);
  // An Indian visitor with no region known: the browser's list leads.
  assert.deepEqual(order({ acceptLanguage: "hi-Latn-IN", country: "IN" }), ["hi-Latn-IN", "hi-IN", "en-IN"]);
  assert.deepEqual(rank.acceptLanguageLocales("garbage;;q=x, *"), []);
});

test("an explicit choice (vspl_lang) comes first; unknown values are ignored", () => {
  assert.deepEqual(order({ chosen: "en-IN", acceptLanguage: "hi", country: "IN", region: "UP" }), ["en-IN", "hi-IN", "hi-Latn-IN"]);
  assert.deepEqual(order({ chosen: "fr-FR", country: "IN", region: "UP" }), ["hi-IN", "hi-Latn-IN", "en-IN"]);
});

test("only the page's languages are ranked", () => {
  assert.deepEqual(order({ country: "IN", region: "UP" }, ["en-IN", "hi-Latn-IN"]), ["hi-Latn-IN", "en-IN"]);
});

test("visitorRegion reads Vercel headers, else Cloudflare's", () => {
  const h = (o) => new Headers(o);
  assert.deepEqual(rank.visitorRegion(h({ "x-vercel-ip-country": "IN", "x-vercel-ip-country-region": "UT" })), { country: "IN", region: "UT" });
  assert.deepEqual(rank.visitorRegion(h({ "cf-ipcountry": "in", "cf-region-code": "UP" })), { country: "IN", region: "UP" });
  assert.deepEqual(rank.visitorRegion(h({ "cf-ipcountry": "XX" })), { country: undefined, region: undefined });
  assert.deepEqual(rank.visitorRegion(h({})), { country: undefined, region: undefined });
});

test("picker variants: every order is prerendered and parses back; /jobs/apply adds share variants", () => {
  // /jobs has five languages: every ordered three that includes English (3 places × 4 × 3).
  const keys = rank.orderKeys("/jobs");
  assert.equal(keys.length, 36);
  assert.ok(keys.includes("hi-hl-en") && keys.includes("en-hi-hl") && keys.includes("kn-en-hl") && !keys.includes("pa-kn-hl"));
  assert.deepEqual(rank.parseRankSegment("hi-hl-en", "/jobs"), { key: "hi-hl-en", order: ["hi-IN", "hi-Latn-IN", "en-IN", "pa-IN", "kn-IN"], variant: "" });
  // A page in three languages keeps its six orders.
  assert.equal(rank.orderKeys("/jobs/packing").length, 6);
  assert.equal(rank.parseRankSegment("hi-hl-en_role-packing", "/jobs"), undefined);
  assert.equal(rank.parseRankSegment("xx-hl-en", "/jobs"), undefined);
  assert.equal(rank.parseRankSegment("hi-hl-en_role-packing", "/jobs/apply")?.variant, "role-packing");
  assert.equal(rank.rankSegmentFor("/jobs/apply", { country: "IN", region: "UP" }, new URLSearchParams("role=packing&utm_source=x")), "hi-hl-en_role-packing");
  assert.equal(rank.rankSegmentFor("/jobs/apply", { country: "US" }, new URLSearchParams("role=not-a-role")), "en-hi-hl");
  // The page's cluster fills in when nothing else says: /jobs/haridwar is Hindi belt.
  assert.equal(rank.rankSegmentFor("/jobs/haridwar", {}, new URLSearchParams()), "hi-hl-en");
  for (const path of Object.keys(i18n.pages).filter((p) => i18n.neutralTarget(p) === "prompt")) {
    for (const segment of rank.rankSegments(path)) assert.ok(rank.parseRankSegment(segment, path), `${path} ${segment}`);
    assert.ok(rank.rankSegments(path).includes(rank.rankSegmentFor(path, { country: "IN", region: "PB" }, new URLSearchParams())));
  }
  assert.equal(rank.isRankSegment("hi-hl-en_hub-freshers"), true);
  assert.equal(rank.isRankSegment("jobs"), false);
  // Strict: a lone code or a made-up variant is a path, not a key.
  assert.equal(rank.isRankSegment("hi"), false);
  assert.equal(rank.isRankSegment("en"), false);
  assert.equal(rank.isRankSegment("hi-hi-en"), false);
  assert.equal(rank.isRankSegment("hi-hl-en_nope"), false);
  assert.equal(rank.isRankSegment("hi-hl-en_"), false);
  assert.equal(rank.isRankSegment("en-hi"), true);
});

test("jobs pages without a market of their own take no market's order: the visitor's signals decide", () => {
  const none = new URLSearchParams();
  for (const path of ["/jobs", "/jobs/apply", "/jobs/12th-pass", "/jobs/freshers", "/jobs/packing"]) {
    // No signal: the default set, not Haridwar's (owner direction, 17 Oct 2026).
    assert.equal(rank.rankSegmentFor(path, {}, none).split("_")[0], "en-hi-hl", `${path} {}`);
    assert.equal(rank.rankSegmentFor(path, { country: "IN", region: "MH" }, none).split("_")[0], "en-hi-hl", `${path} MH`);
    // Region and intent decide.
    assert.equal(rank.rankSegmentFor(path, { country: "IN", region: "UK" }, none).split("_")[0], "hi-hl-en", `${path} UK`);
    // Karnataka: ಕನ್ನಡ first where the page has it.
    const kannada = ["/jobs", "/jobs/apply"].includes(path);
    assert.equal(rank.rankSegmentFor(path, { country: "IN", region: "KA" }, none).split("_")[0], kannada ? "kn-en-hl" : "en-hl-hi", `${path} KA`);
    assert.equal(rank.rankSegmentFor(path, { country: "IN" }, new URLSearchParams("utm_campaign=search_jobs&cluster=haridwar")).split("_")[0], "hi-hl-en", `${path} Haridwar ad`);
    // A generic campaign name alone says nothing about the market.
    assert.equal(rank.rankSegmentFor(path, {}, new URLSearchParams("utm_campaign=search_jobs")).split("_")[0], "en-hi-hl", `${path} generic ad`);
  }
  assert.equal(rank.pageCluster("/jobs"), undefined);
  assert.equal(rank.pageCluster("/jobs/haridwar"), "haridwar");
  assert.equal(rank.pageCluster("/about"), undefined);
});

test("header quick switch: the page's regional set, fixed per page", () => {
  // /jobs: English · हिंदी · Hinglish in the bar (the default set), Punjabi and Kannada under More.
  assert.deepEqual(i18n.languageLinks("/hi-in/jobs").map((l) => [l.lang, l.more]), [["en-IN", false], ["hi-Latn-IN", false], ["pa-IN", true], ["kn-IN", true]]);
  assert.deepEqual(i18n.languageLinks("/en-in/jobs/haridwar").map((l) => l.lang), ["hi-IN", "hi-Latn-IN"]);
  assert.deepEqual(i18n.languageLinks("/hi-latn-in/locations/haridwar").map((l) => l.lang), ["en-IN", "hi-IN"]);
  assert.deepEqual(i18n.languageLinks("/en-in/about"), []);
  assert.ok(i18n.languageLinks("/en-in/jobs").every((l) => l.hint));
});

const WITH_PA = [...ALL, "pa-IN"];

test("Punjabi: first for a visitor in Punjab and for a request that names the Jalandhar region", () => {
  assert.deepEqual(order({ country: "IN", region: "PB" }, WITH_PA), ["pa-IN", "hi-Latn-IN", "en-IN", "hi-IN"]);
  // Intent the request carries (?cluster=, UTM tags) beats a region elsewhere in India...
  assert.deepEqual(order({ country: "IN", region: "UP", intent: "jalandhar" }, WITH_PA).slice(0, 2), ["pa-IN", "hi-Latn-IN"]);
  // With no signal, a visitor in Punjab gets Punjabi even if the phone lists Hindi...
  assert.equal(order({ country: "IN", region: "PB", acceptLanguage: "hi-IN,hi;q=0.9" }, WITH_PA)[0], "pa-IN");
  // ...but a picked language (the cookie) still wins.
  assert.equal(order({ country: "IN", region: "PB", chosen: "hi-IN" }, WITH_PA)[0], "hi-IN");
  assert.equal(order({ acceptLanguage: "pa-IN,pa;q=0.9,en;q=0.8" }, WITH_PA)[0], "pa-IN");
  // The page's cluster fills gaps: the Jalandhar hub puts Punjabi first for an unknown region.
  assert.equal(order({ country: "IN", cluster: "jalandhar" }, WITH_PA)[0], "pa-IN");
  // A Hindi-belt visitor with no Punjab signal keeps the Hindi order; Punjabi comes last.
  assert.deepEqual(order({ country: "IN", region: "UP" }, WITH_PA), ["hi-IN", "hi-Latn-IN", "en-IN", "pa-IN"]);
  // Pages without Punjabi are unchanged.
  assert.deepEqual(order({ country: "IN", region: "PB" }), ["hi-Latn-IN", "en-IN", "hi-IN"]);
});

test("urlIntent reads ?cluster= and the Punjab campaigns' UTM tags", () => {
  assert.equal(rank.urlIntent(new URLSearchParams("cluster=jalandhar")), "jalandhar");
  assert.equal(rank.urlIntent(new URLSearchParams("utm_campaign=jobs_jalandhar&utm_term=packing%20job")), "jalandhar");
  assert.equal(rank.urlIntent(new URLSearchParams("utm_term=ludhiana%20job")), "punjab");
  assert.equal(rank.urlIntent(new URLSearchParams("utm_term=kapurthala%20job")), "jalandhar");
  assert.equal(rank.urlIntent(new URLSearchParams("cluster=nowhere")), undefined);
  // A Punjab ad landing on the neutral /jobs/apply gets the Punjabi-first picker.
  const seg = rank.rankSegmentFor("/jobs/apply", { country: "IN", region: "UP" }, new URLSearchParams("utm_campaign=jobs_jalandhar"));
  assert.ok(seg.startsWith("pa-"), seg);
  assert.ok(rank.rankSegments("/jobs/apply").includes(seg));
});

test("Punjabi readers fall back to Hinglish on pages without Punjabi", () => {
  assert.equal(i18n.nearestLocalePath("/jobs/jalandhar", "pa-IN"), "/pa-in/jobs/jalandhar");
  assert.equal(i18n.nearestLocalePath("/jobs/haridwar", "pa-IN"), "/hi-latn-in/jobs/haridwar");
  assert.equal(i18n.localizeHref("/jobs/packing", "pa-IN"), "/hi-latn-in/jobs/packing");
  assert.equal(i18n.localizeHref("/jobs/privacy", "pa-IN"), "/pa-in/jobs/privacy");
});

test("visitorCity reads Vercel's URL-encoded city or Cloudflare's, and rejects junk", () => {
  assert.equal(rank.visitorCity(new Headers({ "x-vercel-ip-city": "Sultanpur%20Lodhi" })), "Sultanpur Lodhi");
  assert.equal(rank.visitorCity(new Headers({ "cf-ipcity": "Kapurthala" })), "Kapurthala");
  assert.equal(rank.visitorCity(new Headers({ "x-vercel-ip-city": "%3Cscript%3E" })), undefined);
  assert.equal(rank.visitorCity(new Headers({})), undefined);
});

test("the picker's three: English always, the other two by language, intent and location; the rest under More", () => {
  const FIVE = ["en-IN", "hi-IN", "hi-Latn-IN", "pa-IN", "kn-IN"];
  const top = (input) => rank.topChoices(order(input, FIVE));
  assert.deepEqual(top({}), ["en-IN", "hi-IN", "hi-Latn-IN"]);
  assert.deepEqual(top({ country: "IN", region: "KA" }), ["kn-IN", "en-IN", "hi-Latn-IN"]);
  assert.deepEqual(top({ country: "IN", region: "PB" }), ["pa-IN", "hi-Latn-IN", "en-IN"]);
  // The Hindi belt ranks English third already.
  assert.deepEqual(top({ country: "IN", region: "UP" }), ["hi-IN", "hi-Latn-IN", "en-IN"]);
  // A browser asking for Punjabi and Hindi first still keeps English among the three.
  assert.deepEqual(top({ acceptLanguage: "pa-IN,hi-IN;q=0.9" }), ["pa-IN", "hi-IN", "en-IN"]);
  // Intent a request carries (a Bengaluru ad) beats the region.
  assert.equal(top({ country: "IN", region: "UP", intent: "bengaluru" })[0], "kn-IN");
  // /jobs offers all five: every prerendered order has English, and each request's order is one of them.
  const keys = rank.orderKeys("/jobs");
  assert.ok(keys.length > 0 && keys.every((k) => k.split("-").includes("en")));
  for (const region of ["KA", "PB", "UP", "MH"]) {
    assert.ok(keys.includes(rank.rankSegmentFor("/jobs", { country: "IN", region }, new URLSearchParams())), region);
  }
});

test("header switch: the visitor's order fills the bar, English stays visible on non-English pages", async () => {
  const { splitLanguages } = await importTs("src/lib/language-order.ts");
  const links = (langs, more = []) => [...langs.map((lang) => ({ lang, more: false })), ...more.map((lang) => ({ lang, more: true }))];
  const pick = (s) => [s.quick.map((l) => l.lang), s.more.map((l) => l.lang)];
  // On /hi-in/jobs (fixed: English, Hinglish | Punjabi, Kannada), a visitor in Karnataka.
  const onHindi = links(["en-IN", "hi-Latn-IN"], ["pa-IN", "kn-IN"]);
  assert.deepEqual(pick(splitLanguages(onHindi, ["kn-IN", "en-IN", "hi-Latn-IN", "hi-IN", "pa-IN"], "hi-IN")), [["kn-IN", "en-IN"], ["hi-Latn-IN", "pa-IN"]]);
  // A visitor in Punjab whose order puts English fourth: English still takes the last bar slot.
  assert.deepEqual(pick(splitLanguages(onHindi, ["pa-IN", "hi-Latn-IN", "kn-IN", "en-IN", "hi-IN"], "hi-IN")), [["pa-IN", "en-IN"], ["hi-Latn-IN", "kn-IN"]]);
  // On an English page the bar is the visitor's two.
  const onEnglish = links(["hi-IN", "hi-Latn-IN"], ["pa-IN", "kn-IN"]);
  assert.deepEqual(pick(splitLanguages(onEnglish, ["pa-IN", "hi-Latn-IN", "en-IN", "hi-IN", "kn-IN"], "en-IN")), [["pa-IN", "hi-Latn-IN"], ["hi-IN", "kn-IN"]]);
  // Before the order is known: the fixed split.
  assert.deepEqual(pick(splitLanguages(onHindi, null, "hi-IN")), [["en-IN", "hi-Latn-IN"], ["pa-IN", "kn-IN"]]);
});
