// Stored ids are append-only (scripts/lib/stored-ids.mjs, content check C2b).
import assert from "node:assert/strict";
import test from "node:test";
import { currentStoredIds, lockProblems, readLock } from "../scripts/lib/stored-ids.mjs";

test("the code's stored ids match the committed lock", async () => {
  assert.deepEqual(lockProblems(readLock(), await currentStoredIds()), []);
});

test("a removed or renamed id fails; a new one fails until it is locked; order is free", () => {
  const locked = { clusters: ["haridwar", "bengaluru"], areas: ["a"] };
  assert.deepEqual(lockProblems(locked, { clusters: ["bengaluru", "haridwar"], areas: ["a"] }), []);
  const [removed] = lockProblems(locked, { clusters: ["haridwar"], areas: ["a"] });
  assert.match(removed, /clusters: "bengaluru" was removed or renamed/);
  const [gone] = lockProblems(locked, { clusters: ["haridwar", "bengaluru"] });
  assert.match(gone, /areas is locked but no longer exists/);
  const [added] = lockProblems(locked, { clusters: ["haridwar", "bengaluru", "pune"], areas: ["a"] });
  assert.match(added, /clusters: new "pune" not in the lock/);
  const [newList] = lockProblems(locked, { ...locked, roles: ["packing"] });
  assert.match(newList, /roles: new "packing"/);
});

test("the lock covers the lists stored outside the code", async () => {
  const current = await currentStoredIds();
  for (const name of ["identifiers.CLUSTER_IDS", "identifiers.MARKET_AREA_IDS", "rules.QUICK_ANSWERS.area", "crm.ANSWER_OPTIONS.area", "crew-request.KNOWN_PLACES", "locations.placeId", "identifiers.LOCATION_ESTATES.bengaluru"]) {
    assert.ok(current[name]?.length, name);
  }
  // Every location page's #location= id is a place the crew form knows.
  for (const id of current["locations.placeId"]) assert.ok(current["crew-request.KNOWN_PLACES"].includes(id), `placeId ${id}`);
});
