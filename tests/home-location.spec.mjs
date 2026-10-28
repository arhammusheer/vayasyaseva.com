// "Where do you live?" on every jobs form (28 Oct 2026): the page's own answers
// ranked with location guesses, any place in India by search, and the answer
// the application files under (src/markets/home.ts, india.ts).
import assert from "node:assert/strict";
import test from "node:test";
import { importTs } from "../scripts/lib/register-ts.mjs";

const rules = await importTs("src/lib/talent-intake/rules.ts");
const india = await importTs("src/markets/india.ts");
const { NAMED_PLACES, placeNames } = await importTs("src/markets/place-names.ts");
const { areaForPlace, placeChoice, rankHomeChoices } = await importTs("src/markets/home.ts");
const { areaOptions } = await importTs("src/content/pages/quick-apply.ts");
const { homeGuess } = await importTs("src/context/home-guess.ts");

const HOME_IDS = Object.keys(rules.QUICK_ANSWERS.home);
const values = (choices) => choices.map((c) => c.value);

test("every home place has a position or state row, a name in every script, and valid filing", () => {
  assert.equal(HOME_IDS.length, Object.keys(india.STATE_ROWS).length + Object.keys(india.CITY_ROWS).length);
  assert.deepEqual([...NAMED_PLACES].sort(), [...HOME_IDS].sort());
  for (const id of HOME_IDS) {
    const row = india.placeRow(id);
    assert.ok(row, `${id} has no row`);
    assert.ok(id.length <= 40, `${id} is longer than the contract allows`);
    if (!india.isStateId(id)) assert.ok(row.lat !== undefined && row.lon !== undefined, `${id} has no position`);
    for (const area of row.areas ?? []) assert.ok(Object.hasOwn(rules.AREA_CLUSTERS, area), `${id}: unknown area ${area}`);
    if (row.market) assert.ok(Object.hasOwn(rules.AREA_CLUSTERS, `market:${row.market}`) || !row.areas, `${id}: market ${row.market}`);
  }
  for (const locale of ["hi-IN", "pa-IN", "kn-IN"]) {
    const names = placeNames(locale);
    for (const id of HOME_IDS) assert.ok(names[id]?.trim(), `${locale} ${id}`);
  }
});

test("a place files under the form's own answer, else its market, else the form's outside answer", () => {
  const haridwar = areaOptions("haridwar", "page");
  assert.equal(areaForPlace("uk:roorkee", haridwar), "roorkee-bhagwanpur");
  assert.equal(areaForPlace("uk:haldwani", haridwar), "haridwar:rest-of-uttarakhand");
  assert.equal(areaForPlace("wb:kolkata", haridwar), "outside");
  assert.equal(areaForPlace("ka:peenya", haridwar), "market:bengaluru");
  assert.equal(areaForPlace("pb:ludhiana", areaOptions("jalandhar", "page")), "jalandhar:rest-of-punjab");
  assert.equal(areaForPlace("ka:peenya", areaOptions("bengaluru", "page")), "bengaluru:north");
  assert.equal(areaForPlace("wb:kolkata", areaOptions(null)), "market:other");
  assert.equal(areaForPlace("uk:dehradun", areaOptions(null)), "market:dehradun");
  // The filing rule is unchanged: Kolkata on the Haridwar page files under Haridwar, and the home is kept beside it.
  assert.equal(rules.submissionCluster("haridwar", { area: ["outside"], home: ["wb:kolkata"] }), "haridwar");
  assert.deepEqual(rules.cleanQuickAnswers({ area: ["outside"], home: ["wb:kolkata", "nowhere"] }), { area: ["outside"], home: ["wb:kolkata"] });
});

test("Kolkata on the Haridwar page: Kolkata first, Haridwar's own areas kept, no 'Outside Haridwar'", () => {
  const intent = areaOptions("haridwar", "page");
  const choices = rankHomeChoices({ intent, source: "page", market: "haridwar", near: ["wb:kolkata", "wb:howrah"], confident: true, state: "wb" });
  const list = values(choices);
  assert.equal(list[0], placeChoice("wb:kolkata"));
  for (const own of ["sidcul-bahadrabad", "haridwar-jwalapur", "roorkee-bhagwanpur", "laksar"]) assert.ok(list.includes(own), own);
  assert.ok(list.includes(placeChoice("wb")), "the state is offered too");
  assert.ok(!list.includes("outside"));
  assert.equal(choices[0].why, "ip");
});

test("near the page's own areas, the guess raises that area instead of adding a place", () => {
  const intent = areaOptions("haridwar", "page");
  const list = values(rankHomeChoices({ intent, source: "page", market: "haridwar", near: ["uk:roorkee", "uk:haridwar"], confident: true, state: "uk" }));
  assert.equal(list[0], "roorkee-bhagwanpur");
  assert.ok(!list.some((v) => v.startsWith("place:")), list.join());
  // Bengaluru on the Bengaluru page: the market's own areas cover it.
  const blr = values(rankHomeChoices({ intent: areaOptions("bengaluru", "page"), source: "page", market: "bengaluru", near: ["ka:bengaluru"], confident: true, state: "ka" }));
  assert.ok(!blr.includes(placeChoice("ka:bengaluru")), blr.join());
});

test("on a neutral form a guessed city replaces its market's answer; the holdout sees the markets only", () => {
  const intent = areaOptions(null);
  const list = values(rankHomeChoices({ intent, source: "ask", market: null, near: ["uk:roorkee"], confident: true, state: "uk" }));
  assert.equal(list[0], placeChoice("uk:roorkee"));
  assert.ok(!list.includes("market:haridwar"), "Roorkee stands for Haridwar / Roorkee");
  assert.ok(list.includes("market:uttarakhand"), "the rest of the state stays");
  const holdout = values(rankHomeChoices({ intent, source: "ask", market: null }));
  assert.equal(holdout.length, 7);
  assert.ok(holdout.every((v) => v.startsWith("market:") && v !== "market:other"));
  // The context's markets come first.
  assert.equal(values(rankHomeChoices({ intent, source: "ask", market: null, first: ["kapurthala"] }))[0], "market:kapurthala");
});

test("a phone language suggests a state when nothing else does", () => {
  const list = values(rankHomeChoices({ intent: areaOptions("haridwar", "page"), source: "page", market: "haridwar", languages: ["bn-IN", "en-IN"] }));
  assert.ok(list.includes(placeChoice("wb")));
});

test("search finds places by name, other spellings, state and the page's script", () => {
  assert.equal(india.searchPlaces("calcutta")[0], "wb:kolkata");
  assert.equal(india.searchPlaces("ludh")[0], "pb:ludhiana");
  assert.equal(india.searchPlaces("gurgaon")[0], "hr:gurugram");
  const bihar = india.searchPlaces("bihar");
  assert.equal(bihar[0], "br");
  assert.ok(bihar.includes("br:patna"));
  assert.equal(india.searchPlaces("हरिद्वार", placeNames("hi-IN"))[0], "uk:haridwar");
  assert.equal(india.searchPlaces("ਲੁਧਿ", placeNames("pa-IN"))[0], "pb:ludhiana");
  assert.deepEqual(india.searchPlaces("   "), []);
});

test("the IP guess: nearest places and state, India only, nothing else", () => {
  const h = (o) => new Headers(o);
  const kolkata = homeGuess(h({ "x-vercel-ip-country": "IN", "x-vercel-ip-country-region": "WB", "x-vercel-ip-city": "Kolkata", "x-vercel-ip-latitude": "22.57", "x-vercel-ip-longitude": "88.36" }));
  assert.deepEqual(Object.keys(kolkata).sort(), ["confident", "near", "state"]);
  assert.equal(kolkata.state, "wb");
  assert.equal(kolkata.near[0], "wb:kolkata");
  assert.equal(kolkata.confident, true);
  assert.deepEqual(homeGuess(h({ "x-vercel-ip-country": "US", "x-vercel-ip-latitude": "40", "x-vercel-ip-longitude": "-74" })), {});
  assert.equal(homeGuess(h({ "x-vercel-ip-country": "IN", "x-vercel-ip-country-region": "OR" })).state, "od");
  assert.equal(homeGuess(h({ "x-vercel-ip-country": "IN", "x-vercel-ip-country-region": "UT", "x-vercel-ip-latitude": "29.94", "x-vercel-ip-longitude": "78.1" })).state, "uk");
  // A city the IP names but a position far from it: the position wins, without confidence.
  const far = homeGuess(h({ "x-vercel-ip-country": "IN", "x-vercel-ip-city": "Mumbai", "x-vercel-ip-latitude": "28.64", "x-vercel-ip-longitude": "77.22" }));
  assert.equal(far.near[0], "dl");
  assert.equal(far.confident, undefined);
  assert.deepEqual(homeGuess(h({ "x-vercel-ip-country": "IN", "x-vercel-ip-latitude": "abc", "x-vercel-ip-longitude": "" })), {});
  // A city name only counts inside the IP's state: Bilaspur, Himachal is not Bilaspur, Chhattisgarh.
  assert.deepEqual(homeGuess(h({ "x-vercel-ip-country": "IN", "x-vercel-ip-country-region": "HP", "x-vercel-ip-city": "Bilaspur" })), { state: "hp" });
  assert.deepEqual(homeGuess(h({ "x-vercel-ip-country": "IN", "x-vercel-ip-country-region": "CT", "x-vercel-ip-city": "Bilaspur" })), { state: "cg", near: ["cg:bilaspur"], confident: true });
});
