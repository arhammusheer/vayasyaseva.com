// What the market tables decide (scripts/lib/market-behaviour.mjs), pinned
// so the market module refactor (roadmap 1B) changes no decision. An
// intended change rewrites the fixture: node scripts/write-behaviour-snapshots.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { MARKET_BEHAVIOUR_PATH, marketBehaviour } from "../scripts/lib/market-behaviour.mjs";

/** "section key: expected → actual" for each difference, so a failure names the decisions that moved. */
function differences(expected, actual, path = "") {
  if (JSON.stringify(expected) === JSON.stringify(actual)) return [];
  const isObject = (x) => x && typeof x === "object" && !Array.isArray(x);
  if (!isObject(expected) || !isObject(actual)) return [`${path}: ${JSON.stringify(expected)} → ${JSON.stringify(actual)}`];
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  return [...keys].flatMap((k) => differences(expected[k], actual[k], path ? `${path} ${k}` : k));
}

test("market decisions match the committed behaviour snapshot", async () => {
  const expected = JSON.parse(readFileSync(MARKET_BEHAVIOUR_PATH, "utf8"));
  const moved = differences(expected, await marketBehaviour());
  assert.deepEqual(moved.slice(0, 20), [], `${moved.length} market decision(s) moved`);
});
