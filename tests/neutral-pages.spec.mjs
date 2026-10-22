// No market is named first (owner direction, 17 Oct 2026; docs/visitor-context.md):
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

test("the jobs form's area answers: markets alphabetically when asking; another market, never 'other', after a decision", async () => {
  const { areaOptions } = await importTs("src/content/pages/quick-apply.ts");
  const { AREA_CLUSTERS } = await importTs("src/lib/talent-intake/rules.ts");
  assert.deepEqual(areaOptions(null), ["market:andhra-pradesh", "market:bengaluru", "market:dehradun", "market:haridwar", "market:jalandhar", "market:kapurthala", "market:punjab", "market:uttarakhand", "market:visakhapatnam", "market:other"]);
  // Decided Haridwar on a neutral page: Haridwar's areas, then every other market; no "Outside Haridwar".
  const decided = areaOptions("haridwar", "decision");
  assert.ok(!decided.includes("outside"));
  assert.ok(decided.includes("haridwar:rest-of-uttarakhand") && !decided.includes("market:uttarakhand"));
  assert.ok(["market:bengaluru", "market:jalandhar", "market:punjab", "market:other"].every((id) => decided.includes(id)));
  // On a market's own page every answer that names a market files there, and the rest of the state files under the state.
  assert.equal(AREA_CLUSTERS["haridwar:rest-of-uttarakhand"], "uttarakhand");
  assert.equal(AREA_CLUSTERS["jalandhar:rest-of-punjab"], "punjab");
  assert.equal(AREA_CLUSTERS["dehradun:rest-of-uttarakhand"], "uttarakhand");
  // Dehradun's own answer on the Uttarakhand form files under Dehradun, like Haridwar's.
  assert.equal(AREA_CLUSTERS["uttarakhand:dehradun-selaqui"], "dehradun");
  // Kapurthala's answers on the Jalandhar and Punjab forms file under Kapurthala (20 Oct 2026),
  // and the answers taken off the forms are offered nowhere.
  assert.equal(AREA_CLUSTERS["jalandhar:kapurthala"], "kapurthala");
  assert.equal(AREA_CLUSTERS["punjab:kapurthala"], "kapurthala");
  assert.equal(AREA_CLUSTERS["kapurthala:rest-of-punjab"], "punjab");
  assert.deepEqual(areaOptions("kapurthala"), ["kapurthala:city", "kapurthala:phagwara", "kapurthala:sultanpur-lodhi", "kapurthala:jalandhar", "kapurthala:rest-of-punjab", "kapurthala:outside"]);
  for (const market of [null, "jalandhar", "punjab", "kapurthala"]) {
    for (const source of ["page", "decision", "ask"]) {
      const offered = areaOptions(market, source);
      assert.ok(!offered.includes("jalandhar:phagwara-goraya") && !offered.includes("punjab:jalandhar-kapurthala"), `${market} ${source}`);
    }
  }
  // Visakhapatnam's answer on the Andhra Pradesh form files under Visakhapatnam (22 Oct 2026),
  // and the rest of the state on Visakhapatnam's form under Andhra Pradesh.
  assert.equal(AREA_CLUSTERS["andhra-pradesh:visakhapatnam"], "visakhapatnam");
  assert.equal(AREA_CLUSTERS["visakhapatnam:rest-of-andhra-pradesh"], "andhra-pradesh");
  assert.deepEqual(areaOptions("visakhapatnam"), ["visakhapatnam:city", "visakhapatnam:gajuwaka", "visakhapatnam:pendurthi", "visakhapatnam:anakapalli", "visakhapatnam:rest-of-andhra-pradesh", "visakhapatnam:outside"]);
  for (const market of ["haridwar", "uttarakhand", "jalandhar", "punjab", "bengaluru", "dehradun", "kapurthala", "visakhapatnam", "andhra-pradesh"]) {
    for (const id of areaOptions(market, "decision")) assert.ok(Object.hasOwn(AREA_CLUSTERS, id), id);
  }
});
