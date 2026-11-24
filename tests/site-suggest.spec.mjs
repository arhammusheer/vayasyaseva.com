// "City or industrial area" suggestions on Request a crew
// (src/markets/site-suggest.ts, src/markets/site-places.json).
import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { importTs, root } from "../scripts/lib/register-ts.mjs";

const { suggestSites, textScore, SUGGEST_LIMIT, norm: plain } = await importTs("src/markets/site-suggest.ts");
const { STATE_OPTIONS } = await importTs("src/lib/contact-contract.ts");

const P = (id, name, state, kind, scale, more = {}) => ({ id, name, state, kind, scale, ...more });
const FIX = [
  P("uk:sidcul-haridwar", "SIDCUL Haridwar", "UK", "estate", 3, { sectors: ["pharma", "fmcg"], aka: ["sidcul", "bahadrabad"], market: "haridwar" }),
  P("uk:selaqui", "Selaqui", "UK", "estate", 2, { sectors: ["pharma"], aka: ["selakui"], market: "dehradun" }),
  P("uk:haridwar", "Haridwar", "UK", "city", 2, { market: "haridwar" }),
  P("uk:sitarganj", "SIDCUL Sitarganj", "UK", "estate", 2, { sectors: ["auto", "engineering"], aka: ["sitarganj"] }),
  P("uk:pantnagar", "SIDCUL Pantnagar", "UK", "estate", 3, { sectors: ["auto", "engineering", "fmcg"], aka: ["rudrapur", "pantnagar"] }),
  P("uk:roorkee", "Roorkee", "UK", "city", 2, { market: "haridwar" }),
  P("pb:ludhiana", "Ludhiana", "PB", "city", 3, { sectors: ["engineering", "textile"] }),
  P("pb:focal-point-jalandhar", "Focal Point Jalandhar", "PB", "estate", 2, { sectors: ["engineering"], market: "jalandhar" }),
  P("mp:pithampur", "Pithampur", "MP", "estate", 3, { sectors: ["auto", "pharma"] }),
];
const names = (list) => list.map((p) => p.name);

test("a state filters; idle shows three, typing up to five", () => {
  const idle = suggestSites(FIX, { query: "", state: "UK" });
  assert.equal(idle.length, SUGGEST_LIMIT.idle);
  assert.ok(idle.every((p) => p.state === "UK"));
  const typed = suggestSites(FIX, { query: "s", state: "UK" });
  assert.ok(typed.length <= SUGGEST_LIMIT.typing && typed.length >= 3);
  assert.ok(typed.every((p) => p.state === "UK"));
});

test("nothing while idle with no state and nothing to go on", () => {
  assert.deepEqual(suggestSites(FIX, { query: "" }), []);
  // A market to go on: the visitor's.
  assert.ok(suggestSites(FIX, { query: "", visitorMarkets: ["jalandhar"] }).some((p) => p.market === "jalandhar"));
});

test("typed text: start of the name, other spellings, word starts, one-letter slips", () => {
  const q = (s) => plain(s);
  assert.ok(textScore(FIX[0], q("sid")) > textScore(FIX[0], q("har")));
  assert.ok(textScore(FIX[1], q("selakui")) > 0);
  assert.ok(textScore(FIX[0], q("bahad")) > 0);
  assert.ok(textScore(FIX[8], q("pitampur")) > 0);
  assert.equal(textScore(FIX[6], q("xyz")), 0);
  assert.equal(names(suggestSites(FIX, { query: "rudr", state: "UK" }))[0], "SIDCUL Pantnagar");
});

test("the market the request came from leads", () => {
  const top = suggestSites(FIX, { query: "", state: "UK", originMarket: "dehradun" })[0];
  assert.equal(top.name, "Selaqui");
});

test("the work picked lifts places known for it", () => {
  const pharma = suggestSites(FIX, { query: "", state: "UK", roles: ["packing"] });
  const auto = suggestSites(FIX, { query: "", state: "UK", roles: ["iti-trades", "machine-operators"] });
  // An exact other spelling still wins over the work: "sidcul" is SIDCUL Haridwar.
  assert.equal(suggestSites(FIX, { query: "sidcul", state: "UK", roles: ["iti-trades"] })[0].name, "SIDCUL Haridwar");
  assert.equal(pharma[0].name, "SIDCUL Haridwar");
  assert.equal(auto[0].name, "SIDCUL Pantnagar");
});

test("a large crew leans to estates, a small one to towns", () => {
  const big = suggestSites(FIX, { query: "", state: "UK", headcountBand: "250+" });
  assert.equal(big[0].kind, "estate");
  const small = suggestSites(FIX, { query: "h", state: "UK", headcountBand: "1-9" });
  assert.equal(small[0].name, "Haridwar");
});

test("with no state, typing searches every state, and the visitor's state breaks ties", () => {
  const all = suggestSites(FIX, { query: "pith" });
  assert.equal(all[0].name, "Pithampur");
  const tie = suggestSites(FIX, { query: "l", visitorState: "PB" });
  assert.equal(tie[0].state, "PB");
});

test("no list when the only match is what was typed", () => {
  assert.deepEqual(suggestSites(FIX, { query: "Focal Point Jalandhar", state: "PB" }), []);
});

test("the shipped list is built from its sources and valid", () => {
  execFileSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "scripts/build-site-places.mjs", "--check"], { cwd: root, stdio: "pipe" });
  const list = JSON.parse(readFileSync(`${root}/src/markets/site-places.json`, "utf8"));
  assert.ok(list.length > 150);
  const ids = new Set();
  for (const p of list) {
    assert.ok(!ids.has(p.id), `duplicate ${p.id}`);
    ids.add(p.id);
    assert.ok(p.state in STATE_OPTIONS, `${p.id} state`);
    assert.ok(!/\u2014/.test(p.name), `${p.id} has an em dash`);
  }
  // Every state with places has at least three to suggest while idle.
  const byState = Object.groupBy(list, (p) => p.state);
  for (const [state, places] of Object.entries(byState)) assert.ok(suggestSites(list, { query: "", state }).length === Math.min(3, places.length), state);
});
