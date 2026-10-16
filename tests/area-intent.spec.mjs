// The header's area intent model (src/lib/intent/model.ts, docs/area-intent.md).
import assert from "node:assert/strict";
import test from "node:test";
import { importTs } from "../scripts/lib/register-ts.mjs";

const { decideArea, clustersInUtm, scoreSignals, WEIGHTS } = await importTs("src/lib/intent/model.ts");

const surfaces = {
  haridwar: { business: "/haridwar-sidcul", jobs: "/jobs/haridwar" },
  bengaluru: { business: "/locations/bengaluru", jobs: "/jobs/bengaluru" },
  "delhi-ncr": { business: "/locations/delhi-ncr" },
};

test("no signal shows the default, Haridwar", () => {
  const d = decideArea({}, surfaces);
  assert.deepEqual([d.mode, d.business, d.jobs], ["default", ["haridwar"], ["haridwar"]]);
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

test("an explicit pick wins over everything", () => {
  const d = decideArea({ chosen: "bengaluru", landing: "haridwar", page: "haridwar", geo: "haridwar" }, surfaces);
  assert.deepEqual(d.business, ["bengaluru"]);
});

test("a side shows only clusters with a page there; otherwise it falls back", () => {
  const d = decideArea({ chosen: "delhi-ncr" }, surfaces);
  assert.deepEqual(d.business, ["delhi-ncr"]);
  assert.deepEqual(d.jobs, ["haridwar"], "NCR has no jobs hub");
  const both = decideArea({ views: { "delhi-ncr": 1 }, geo: "bengaluru" }, surfaces);
  assert.deepEqual(both.business, ["delhi-ncr", "bengaluru"]);
  assert.deepEqual(both.jobs, ["bengaluru"]);
});

test("UTM tags name clusters; views are capped", () => {
  assert.deepEqual(clustersInUtm(["search_jobs", null, "blr-peenya"]), ["haridwar", "bengaluru"]);
  const { intent } = scoreSignals({ views: { haridwar: 10 } });
  assert.equal(intent.haridwar, WEIGHTS.viewCap * WEIGHTS.view);
});
