// No market is named first (owner direction, 17 Oct 2026; docs/area-intent.md):
// role and qualification pages name the work in their titles and headings,
// and list every job market, in MARKET_ORDER, in their descriptions.
import assert from "node:assert/strict";
import test from "node:test";
import { importTs } from "../scripts/lib/register-ts.mjs";

const { jobRoles } = await importTs("src/content/pages/job-roles.ts");
const { jobHubs } = await importTs("src/content/pages/job-hubs.ts");
const { jobsCopy } = await importTs("src/content/pages/jobs.ts");

const PLACES = /sidcul|haridwar|roorkee|bengaluru|punjab|jalandhar|kapurthala|uttarakhand|सिडकुल|हरिद्वार|बेंगलुरु|पंजाब|उत्तराखंड|ਹਰਿਦੁਆਰ|ਪੰਜਾਬ/i;
const pages = (copy) => Object.entries(copy).flatMap(([locale, list]) => (Array.isArray(list) ? list : [list]).map((p) => ({ locale, ...p })));

test("role, qualification and /jobs titles and headings name no market", () => {
  for (const p of [...pages(jobRoles), ...pages(jobHubs)]) {
    for (const field of ["metaTitle", "heading", "lede"]) assert.doesNotMatch(p[field], PLACES, `${p.locale} ${p.slug} ${field}: ${p[field]}`);
  }
  for (const [locale, t] of Object.entries(jobsCopy)) {
    for (const field of ["title", "heading", "lede", "eyebrow"]) assert.doesNotMatch(t[field], PLACES, `${locale} /jobs ${field}`);
  }
});

test("their descriptions list every job market, alphabetically, or none", () => {
  const ORDER = { "en-IN": ["Bengaluru", "Haridwar", "Punjab", "Uttarakhand"], "hi-IN": ["बेंगलुरु", "हरिद्वार", "पंजाब", "उत्तराखंड"], "hi-Latn-IN": ["Bengaluru", "Haridwar", "Punjab", "Uttarakhand"] };
  for (const p of [...pages(jobRoles), ...pages(jobHubs)]) {
    const at = ORDER[p.locale].map((name) => p.description.indexOf(name));
    if (at.every((i) => i < 0)) continue;
    assert.ok(at.every((i) => i >= 0), `${p.locale} ${p.slug}: every market or none`);
    assert.deepEqual([...at].sort((a, b) => a - b), at, `${p.locale} ${p.slug}: markets in order`);
  }
});
