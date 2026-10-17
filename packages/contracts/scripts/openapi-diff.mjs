/**
 * Semantic diff of two OpenAPI (or any JSON) documents: key order is
 * ignored, array order is not. Prints every differing path; exits 1 if any.
 *
 *   node packages/contracts/scripts/openapi-diff.mjs <old.json> <new.json>
 *   node packages/contracts/scripts/openapi-diff.mjs --git <rev> src/openapi/v1.json
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const [before, after] =
  args[0] === "--git"
    ? [JSON.parse(execFileSync("git", ["show", `${args[1]}:${args[2]}`], { encoding: "utf8" })), JSON.parse(readFileSync(args[2], "utf8"))]
    : args.map((file) => JSON.parse(readFileSync(file, "utf8")));

const diffs = [];
function walk(a, b, path) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) diffs.push([path, a, b]);
    else a.forEach((x, i) => walk(x, b[i], `${path}[${i}]`));
    return;
  }
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[key], b[key], `${path}.${key}`);
    return;
  }
  if (a !== b) diffs.push([path, a, b]);
}
walk(before, after, "$");
for (const [path, a, b] of diffs) console.log(`${path}\n  - ${JSON.stringify(a)}\n  + ${JSON.stringify(b)}`);
console.log(diffs.length ? `${diffs.length} semantic difference(s)` : "semantically identical (key order aside)");
process.exit(diffs.length ? 1 : 0);
