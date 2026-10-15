// The sitemap comes from the page registry (src/content/registry/pages.ts).
// It must match the committed snapshot exactly. When a change to the sitemap
// is intended (a page published, a lastmod moved), update the snapshot in the
// same commit so the diff shows it:
//   node scripts/content-check.mjs --write-sitemap-snapshot
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { importTs, root } from "../scripts/lib/register-ts.mjs";

const { default: sitemap } = await importTs("src/app/sitemap.ts");

test("sitemap output matches the committed snapshot", () => {
  const snapshot = JSON.parse(readFileSync(`${root}/tests/fixtures/sitemap.snapshot.json`, "utf8"));
  assert.deepEqual(JSON.parse(JSON.stringify(sitemap())), snapshot);
});

test("lastmod is the page's registry date, never the build date", async () => {
  const { pageEntries } = await importTs("src/content/registry/index.ts");
  const updated = new Map(pageEntries.map((p) => [p.path, p.updated]));
  for (const entry of sitemap()) {
    const path = new URL(entry.url).pathname.replace(/^\/[^/]+/, "") || "/";
    assert.equal(entry.lastModified.toISOString().slice(0, 10), updated.get(path), entry.url);
  }
});
