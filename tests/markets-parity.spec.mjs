// Temporary (roadmap 1B): the tables in src/markets equal the scattered
// tables they replace. Removed once every consumer reads src/markets.
import assert from "node:assert/strict";
import test from "node:test";
import { importTs } from "../scripts/lib/register-ts.mjs";

const markets = await importTs("src/markets/index.ts");
const model = await importTs("src/lib/intent/model.ts");
const { clusters } = await importTs("src/content/registry/index.ts");
const { CLUSTER_IDS } = await importTs("src/content/registry/identifiers.ts");
const { KNOWN_PLACES } = await importTs("src/lib/crew-request.ts");
const { areaOptions } = await importTs("src/content/pages/quick-apply.ts");

const plainObject = (o) => JSON.parse(JSON.stringify(o));

test("region, site-state and state tables", () => {
  assert.deepEqual([...markets.MARKET_IDS], [...model.MARKET_ORDER]);
  assert.deepEqual(plainObject(markets.REGION_MARKETS), plainObject(model.REGION_CLUSTERS));
  assert.deepEqual(plainObject(markets.SITE_STATE_MARKETS), plainObject(model.SITE_STATE_CLUSTERS));
  assert.deepEqual(plainObject(markets.MARKET_STATES), plainObject(model.CLUSTER_STATES));
});

test("place groups, in order", () => {
  assert.deepEqual(
    markets.PLACE_GROUPS.map((g) => ({ words: [...g.words], region: [...g.region], cluster: g.market })),
    model.PLACES.map((p) => ({ words: [...p.words], region: [...p.region], cluster: p.cluster })),
  );
});

test("ad words decide as UTM_WORDS does", () => {
  const words = [...new Set([...model.PLACES.flatMap((p) => p.words), ...Object.values(markets.MARKETS).flatMap((m) => m.adWords)])];
  const tags = [...words, ...words.map((w) => `jobs_${w}`), ...words.map((w) => `x${w}`), "jobs_delhi_ncr", "blr-peenya", "punjabi", "kapurthala ludhiana", "roorkee dehradun ncr"];
  for (const t of tags) assert.deepEqual(markets.marketsInAdTags([t]), model.clustersInUtm([t]), t);
  assert.deepEqual(markets.marketsInAdTags(tags), model.clustersInUtm(tags));
});

test("language sets, quick switch and stand-ins", () => {
  const CLUSTER_SETS = { haridwar: "hindi", uttarakhand: "hindi", "delhi-ncr": "hindi", saharanpur: "hindi", jalandhar: "punjab", punjab: "punjab", bengaluru: "karnataka", other: undefined };
  for (const id of CLUSTER_IDS) assert.equal(markets.languageSetFor(id), CLUSTER_SETS[id], id);
  for (const c of clusters) assert.deepEqual([...markets.quickSwitchFor(c.id)], [...c.quickSwitch], c.id);
  for (const id of CLUSTER_IDS) for (const side of ["business", "jobs"]) {
    assert.equal(markets.standInFor(id, side), id === "punjab" && side === "business" ? "jalandhar" : undefined, `${id} ${side}`);
  }
});

test("place ids", () => {
  assert.deepEqual(
    plainObject(Object.fromEntries(Object.entries(markets.PLACES_BY_ID).map(([id, p]) => [id, { state: p.state, city: p.city, cluster: p.market }]))),
    plainObject(KNOWN_PLACES),
  );
});

test("form areas, and outside = files under no market", () => {
  assert.deepEqual([...markets.marketAreaAnswers()], [...areaOptions(null)]);
  for (const id of CLUSTER_IDS) {
    const own = areaOptions(id, "page");
    assert.deepEqual([...(markets.formAreas(id) ?? markets.marketAreaAnswers())], [...own], id);
    if (markets.formAreas(id)) own.forEach((a, i) => assert.equal(markets.areaFilesUnder(a) === null, i === own.length - 1, a));
  }
});
