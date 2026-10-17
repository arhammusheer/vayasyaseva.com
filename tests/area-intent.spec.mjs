// The header's area intent model (src/lib/intent/model.ts, docs/area-intent.md).
import assert from "node:assert/strict";
import test from "node:test";
import { importTs } from "../scripts/lib/register-ts.mjs";

const { decideArea, clustersInUtm, scoreSignals, WEIGHTS } = await importTs("src/lib/intent/model.ts");

const surfaces = {
  haridwar: { business: "/locations/haridwar", jobs: "/jobs/haridwar" },
  bengaluru: { business: "/locations/bengaluru", jobs: "/jobs/bengaluru" },
  "delhi-ncr": { business: "/locations/delhi-ncr" },
};

test("no signal decides nothing: no market is the default", () => {
  const d = decideArea({}, surfaces);
  assert.deepEqual([d.mode, d.business, d.jobs], ["default", [], []]);
});

test("region alone decides when there is no intent", () => {
  const d = decideArea({ geo: "bengaluru" }, surfaces);
  assert.deepEqual([d.mode, d.business, d.jobs], ["single", ["bengaluru"], ["bengaluru"]]);
});

test("a Mumbai buyer who lands on the Haridwar page from an ad sees Haridwar", () => {
  const d = decideArea({ landing: "haridwar", page: "haridwar", param: "haridwar" }, surfaces);
  assert.deepEqual([d.mode, d.business], ["single", ["haridwar"]]);
});

test("strong intent beats a disagreeing region outright", () => {
  const d = decideArea({ landing: "haridwar", page: "haridwar", geo: "bengaluru" }, surfaces);
  assert.deepEqual([d.mode, d.business, d.jobs], ["single", ["haridwar"], ["haridwar"]]);
});

test("weak intent against a disagreeing region shows both, intent first", () => {
  const d = decideArea({ views: { haridwar: 1 }, utm: [], geo: "bengaluru" }, surfaces);
  assert.equal(d.mode, "both");
  assert.deepEqual(d.business, ["haridwar", "bengaluru"]);
  assert.deepEqual(d.jobs, ["haridwar", "bengaluru"]);
});

test("a pick is the strongest signal, but a weight: the page's own market leads its page, a fresh ad beats an old pick", () => {
  // Picked this session, on a neutral page: the pick wins over a link's ?cluster=.
  assert.deepEqual(decideArea({ chosen: "bengaluru", chosenFresh: true, param: "haridwar" }, surfaces).jobs, ["bengaluru"]);
  // On the Haridwar page, Haridwar leads; the pick still shows, second.
  assert.deepEqual(decideArea({ chosen: "bengaluru", chosenFresh: true, landing: "haridwar", page: "haridwar", geo: "haridwar" }, surfaces).business, ["haridwar", "bengaluru"]);
  // An old pick (an earlier session) loses to today's ad for another market.
  const all = { ...surfaces, jalandhar: { business: "/locations/jalandhar", jobs: "/jobs/jalandhar" } };
  const d = decideArea({ chosen: "haridwar", chosenFresh: false, param: "jalandhar", landing: "jalandhar", utm: ["jalandhar"], views: { jalandhar: 1 } }, all);
  assert.equal(d.jobs[0], "jalandhar");
  assert.equal(d.basis, "param");
  assert.equal(d.chosen, true);
});

test("a side shows only clusters with a page there; otherwise it is empty (every market shows)", () => {
  const d = decideArea({ chosen: "delhi-ncr" }, surfaces);
  assert.deepEqual(d.business, ["delhi-ncr"]);
  assert.deepEqual(d.jobs, [], "NCR has no jobs hub, and no market stands in for it");
  const both = decideArea({ views: { "delhi-ncr": 1 }, geo: "bengaluru" }, surfaces);
  assert.deepEqual(both.business, ["delhi-ncr", "bengaluru"]);
  assert.deepEqual(both.jobs, ["bengaluru"]);
});

test("UTM tags name clusters as whole words; views are capped", () => {
  assert.deepEqual(clustersInUtm(["search_jobs", null, "blr-peenya"]), ["bengaluru"]);
  assert.deepEqual(clustersInUtm(["punjabi_language", "sblrx"]), []);
  assert.deepEqual(clustersInUtm(["jobs_delhi_ncr"]), ["delhi-ncr"]);
  const { intent } = scoreSignals({ views: { haridwar: 10 } });
  assert.equal(intent.haridwar, WEIGHTS.viewCap * WEIGHTS.view);
});

test("region and city: a state's market unless the city is inside a narrower one", async () => {
  const { geoCluster, REGION_CLUSTERS } = await importTs("src/lib/intent/model.ts");
  assert.equal(REGION_CLUSTERS.PB, "punjab");
  assert.equal(REGION_CLUSTERS.UK, "uttarakhand");
  assert.equal(geoCluster("PB", "Kapurthala"), "jalandhar");
  assert.equal(geoCluster("PB", "Jalandhar"), "jalandhar");
  assert.equal(geoCluster("PB", "Ludhiana"), "punjab");
  assert.equal(geoCluster("PB", null), "punjab");
  assert.equal(geoCluster("UK", "Roorkee"), "haridwar");
  assert.equal(geoCluster("UT", "Haridwar"), "haridwar");
  assert.equal(geoCluster("UK", "Dehradun"), "uttarakhand");
  // A city only narrows inside its own state.
  assert.equal(geoCluster("UP", "Haridwar"), undefined);
  assert.equal(geoCluster("HR", "Jalandhar"), "delhi-ncr");
  assert.equal(geoCluster(undefined, "Haridwar"), undefined);
});

test("UTM place words name each market; a generic campaign name (search_jobs) names none", () => {
  assert.deepEqual(clustersInUtm(["jobs_jalandhar", "kapurthala job", "phagwara vacancy"]), ["jalandhar"]);
  assert.deepEqual(clustersInUtm(["ludhiana job"]), ["punjab"]);
  assert.deepEqual(clustersInUtm(["rudrapur factory job"]), ["uttarakhand"]);
  assert.deepEqual(clustersInUtm(["search_jobs"]), []);
  const all = { ...surfaces, jalandhar: { business: "/locations/jalandhar", jobs: "/jobs/jalandhar" }, punjab: { jobs: "/jobs/punjab" } };
  // Punjab has no buyer page: Jalandhar's stands in on the business side.
  assert.deepEqual([decideArea({ geo: "jalandhar" }, all).jobs, decideArea({ geo: "punjab" }, all).business], [["jalandhar"], ["jalandhar"]]);
});

test("MARKET_ORDER is alphabetical: no market first by default", async () => {
  const { MARKET_ORDER } = await importTs("src/lib/intent/model.ts");
  assert.deepEqual([...MARKET_ORDER], [...MARKET_ORDER].sort());
});

test("geo spellings: accents, old names and NCR cities in UP", async () => {
  const { geoCluster } = await importTs("src/lib/intent/model.ts");
  assert.equal(geoCluster("UK", "Haridwār"), "haridwar");
  assert.equal(geoCluster("UK", "Hardwar"), "haridwar");
  assert.equal(geoCluster("PB", "Jullundur"), "jalandhar");
  assert.equal(geoCluster("UP", "Noida"), "delhi-ncr");
  assert.equal(geoCluster("UP", "Saharanpur"), undefined);
});

test("a business site's market: a named place, else the sending page when it covers the state, else the state's", async () => {
  const { siteCluster } = await importTs("src/lib/intent/model.ts");
  assert.equal(siteCluster("UK", "SIDCUL Haridwar", null), "haridwar");
  assert.equal(siteCluster("UK", "Plot 12, Sector 4", "haridwar"), "haridwar");
  assert.equal(siteCluster("UK", "Selaqui, Dehradun", "haridwar"), "uttarakhand");
  assert.equal(siteCluster("UK", "", null), "uttarakhand");
  assert.equal(siteCluster("PB", "Focal Point, Ludhiana", "jalandhar"), "punjab");
  assert.equal(siteCluster("PB", "Kapurthala", null), "jalandhar");
  assert.equal(siteCluster("UP", "Greater Noida", null), "delhi-ncr");
  assert.equal(siteCluster("UP", "Saharanpur", "haridwar"), null);
  assert.equal(siteCluster(undefined, "", "bengaluru"), "bengaluru");
});

test("Delhi and Haryana towns narrow to Delhi NCR, as their region alone already did", async () => {
  const { geoCluster, siteCluster } = await importTs("src/lib/intent/model.ts");
  for (const [region, city] of [["HR", "Gurugram"], ["HR", "Manesar"], ["DL", "New Delhi"], ["DL", "Okhla"]]) {
    assert.equal(geoCluster(region, city), "delhi-ncr");
    assert.equal(geoCluster(region, city), geoCluster(region));
    assert.equal(siteCluster(region, city), siteCluster(region, null));
  }
  // A Delhi town typed with another state is not that state's market by accident.
  assert.equal(siteCluster("UK", "Delhi Road, Roorkee"), "haridwar");
});
