// The bundles in f/ (build.mts) must keep every template string exactly as
// written: the SQL in them is matched and rewritten (SYNC_CANDIDATE_FOR), and
// a re-indented bundle once left the per-submission CRM query with LIMIT $1
// bound to a uuid, so every CRM delivery from the dispatcher failed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SYNC_CANDIDATES } from "./talent/lib/sql.ts";

const bundle = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("bundles keep multi-line SQL as written", () => {
  for (const path of ["f/talent/dispatch.ts", "f/talent/sync_crm.ts"]) {
    assert.ok(bundle(path).includes(SYNC_CANDIDATES), `${path}: SYNC_CANDIDATES changed in the bundle`);
  }
});

test("the dispatcher's per-submission CRM query selects by id, with no LIMIT", () => {
  const code = bundle("f/talent/dispatch.ts");
  assert.ok(code.includes("SYNC_CANDIDATE_FOR"));
  assert.match(code, /if \(SYNC_CANDIDATE_FOR === SYNC_CANDIDATES\)\s*throw/, "the load-time guard is bundled");
});
