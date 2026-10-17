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

/* ---------- Model v3 (owner direction, 17 Oct 2026) ---------- */

test("model v3: the version on area-intent events", async () => {
  const { MODEL_VERSION } = await importTs("src/lib/intent/model.ts");
  assert.equal(MODEL_VERSION, 3);
});

test("one vocabulary: place words name markets in ad tags, ad words name places", async () => {
  const { geoCluster, siteCluster, placeState } = await importTs("src/lib/intent/model.ts");
  const markets = await importTs("src/markets/index.ts");
  // The data has one word list per market: no second list of ad words.
  for (const id of markets.MARKET_IDS) assert.equal("adWords" in markets.MARKETS[id], false, id);
  // Place words that were never ad words now name their market in tags…
  assert.deepEqual(clustersInUtm(["jobs_okhla"]), ["delhi-ncr"]);
  assert.deepEqual(clustersInUtm(["rurki vacancy"]), ["haridwar"]);
  assert.deepEqual(clustersInUtm(["hoskote_jobs"]), ["bengaluru"]);
  assert.deepEqual(clustersInUtm(["jobs_jullundur"]), ["jalandhar"]);
  // …and the campaigns' short forms are places too, each in its own state.
  assert.equal(geoCluster("KA", "BLR"), "bengaluru");
  assert.equal(placeState("blr"), "KA");
  assert.equal(placeState("gurgaon"), "HR");
  assert.equal(placeState("delhi"), "DL");
  // Every word with one region names that state; "ncr" spans three and names none.
  for (const g of markets.PLACE_GROUPS) for (const w of g.words) assert.equal(placeState(w), g.region.length === 1 ? g.region[0] : undefined, w);
  assert.equal(siteCluster("UP", "NCR", null), "delhi-ncr");
  assert.equal(siteCluster("HR", "Gurgaon NCR", null), "delhi-ncr");
  // Exact match for an IP city, whole words for typed text, as before.
  assert.equal(geoCluster("UK", "SIDCUL Haridwar"), "uttarakhand");
  assert.equal(siteCluster("UK", "SIDCUL Haridwar", null), "haridwar");
});

test("state names name the state's market in ad tags, but never narrow a site away from its page", async () => {
  const { siteCluster, placeState, geoCluster } = await importTs("src/lib/intent/model.ts");
  assert.deepEqual(clustersInUtm(["jobs_uttarakhand"]), ["uttarakhand"]);
  assert.deepEqual(clustersInUtm(["jobs_punjab"]), ["punjab"]);
  assert.deepEqual(clustersInUtm(["jobs_delhi"]), ["delhi-ncr"]);
  assert.deepEqual(clustersInUtm(["jobs_ncr"]), ["delhi-ncr"]);
  assert.deepEqual(clustersInUtm(["punjabi_jobs", "uttarakhandi"]), []);
  assert.deepEqual(clustersInUtm(["uttarakhand_haridwar_jobs"]), ["haridwar", "uttarakhand"]);
  assert.equal(placeState("Uttarakhand"), "UK");
  assert.equal(placeState("Punjab"), "PB");
  // A Haridwar enquiry from /locations/haridwar stays Haridwar's when the city just names the state.
  assert.equal(siteCluster("UK", "Plot 12, Uttarakhand", "haridwar"), "haridwar");
  assert.equal(siteCluster("PB", "Focal Point, Punjab", "jalandhar"), "jalandhar");
  assert.equal(siteCluster("UK", "Uttarakhand", null), "uttarakhand");
  // A place still beats the state name.
  assert.equal(siteCluster("UK", "Roorkee, Uttarakhand", null), "haridwar");
  assert.equal(siteCluster("PB", "Kapurthala, Punjab", "punjab"), "jalandhar");
  assert.equal(geoCluster("PB", "Punjab"), "punjab");
});

test("UT is Uttarakhand's old code: read as UK everywhere", async () => {
  const { geoCluster, siteCluster, REGION_CLUSTERS, SITE_STATE_CLUSTERS, CLUSTER_STATES } = await importTs("src/lib/intent/model.ts");
  const markets = await importTs("src/markets/index.ts");
  assert.equal(markets.canonicalRegion("UT"), "UK");
  assert.equal(markets.canonicalRegion("PB"), "PB");
  // The tables hold current codes only.
  assert.equal("UT" in REGION_CLUSTERS, false);
  assert.equal("UT" in SITE_STATE_CLUSTERS, false);
  assert.deepEqual(Object.values(CLUSTER_STATES).flat().includes("UT"), false);
  assert.equal(markets.marketForRegion("UT"), "uttarakhand");
  assert.equal(geoCluster("UT", null), "uttarakhand");
  assert.equal(geoCluster("UT", "Roorkee"), "haridwar");
  // A site state of UT was no market before; now it is Uttarakhand's, like UK.
  assert.equal(siteCluster("UT", "", null), "uttarakhand");
  assert.equal(siteCluster("UT", "Plot 4", "haridwar"), "haridwar");
  assert.equal(siteCluster("UT", "SIDCUL Haridwar", null), "haridwar");
  assert.deepEqual(markets.marketsForState("UT"), markets.marketsForState("UK"));
  assert.equal(markets.marketCoversState("haridwar", "UT"), true);
});

test("Saharanpur is a stored cluster id, not a market: no intent, no language order", async () => {
  const markets = await importTs("src/markets/index.ts");
  const { CLUSTER_IDS } = await importTs("src/content/registry/identifiers.ts");
  assert.ok(CLUSTER_IDS.includes("saharanpur"), "the stored id stays");
  assert.equal(markets.isMarketId("saharanpur"), false);
  assert.equal(markets.languageSetFor("saharanpur"), undefined);
  assert.deepEqual(clustersInUtm(["jobs_saharanpur"]), []);
});

test("multi-word ad tags: _ and - read as spaces", () => {
  for (const tag of ["jobs_electronic_city", "electronic-city", "Jobs-Electronic-City-2026"]) assert.deepEqual(clustersInUtm([tag]), ["bengaluru"], tag);
  for (const tag of ["greater_noida", "jobs-gautam-buddha-nagar", "new_delhi"]) assert.deepEqual(clustersInUtm([tag]), ["delhi-ncr"], tag);
  assert.deepEqual(clustersInUtm(["dera_bassi_jobs"]), ["punjab"]);
  assert.deepEqual(clustersInUtm(["sultanpur-lodhi"]), ["jalandhar"]);
  // Still whole words: letters run on don't match.
  assert.deepEqual(clustersInUtm(["electroniccity", "xelectronic_city"]), []);
});
