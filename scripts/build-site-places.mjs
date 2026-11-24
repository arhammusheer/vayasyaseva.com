// Builds src/markets/site-places.json, the list behind the contact form's
// "City or industrial area" suggestions (src/markets/site-suggest.ts), from
// the regional source lists in src/markets/site-places/*.json and the
// jobs form's places (src/markets/india.ts CITY_ROWS). Each place gets the
// market we supply it from, where there is one (business side only).
//
//   node scripts/build-site-places.mjs          write the file
//   node scripts/build-site-places.mjs --check  fail if it is stale or a source is invalid
import { importTs, root } from "./lib/register-ts.mjs";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const { CITY_ROWS, englishName } = await importTs("src/markets/india.ts");
const { hasSide, marketForPlace } = await importTs("src/markets/index.ts");
const { STATE_OPTIONS } = await importTs("src/lib/contact-contract.ts");

const SRC = resolve(root, "src/markets/site-places");
const OUT = resolve(root, "src/markets/site-places.json");
const KINDS = new Set(["estate", "cluster", "city"]);
const SECTORS = new Set("pharma fmcg food auto engineering electronics textile garments leather chemical plastics steel metal paper ceramics cement logistics it-campus sez mixed".split(" "));
const problems = [];
const fail = (msg) => problems.push(msg);

const sources = existsSync(SRC) ? readdirSync(SRC).filter((f) => f.endsWith(".json")).sort() : [];
const rows = [];
for (const file of sources) {
  let list;
  try {
    list = JSON.parse(readFileSync(resolve(SRC, file), "utf8"));
  } catch (e) {
    fail(`${file}: not valid JSON (${e.message})`);
    continue;
  }
  if (!Array.isArray(list)) fail(`${file}: not an array`);
  else for (const r of list) rows.push({ ...r, file });
}

const byId = new Map();
for (const r of rows) {
  const where = `${r.file} ${r.id ?? "(no id)"}`;
  if (typeof r.id !== "string" || !/^[a-z]{2}:[a-z0-9-]+$/.test(r.id)) { fail(`${where}: bad id`); continue; }
  if (!(r.state in STATE_OPTIONS)) { fail(`${where}: unknown state ${r.state}`); continue; }
  if (r.id.slice(0, 2).toUpperCase() !== r.state) fail(`${where}: id prefix does not match state ${r.state}`);
  if (typeof r.name !== "string" || !r.name.trim() || /\u2014/.test(r.name)) { fail(`${where}: bad name`); continue; }
  if (!KINDS.has(r.kind)) { fail(`${where}: bad kind ${r.kind}`); continue; }
  if (![1, 2, 3].includes(r.scale)) fail(`${where}: bad scale ${r.scale}`);
  for (const s of r.sectors ?? []) if (!SECTORS.has(s)) fail(`${where}: unknown sector ${s}`);
  if (byId.has(r.id)) { fail(`${where}: duplicate id (also in ${byId.get(r.id).file})`); continue; }
  byId.set(r.id, r);
}

// The jobs form's places (src/markets/india.ts). One the regional lists
// already name ("Rishikesh / Doiwala" and the list's "Rishikesh") is not
// added again: the list's entry takes its market and other spellings.
const key = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const named = new Map();
for (const r of byId.values()) for (const n of [r.name, ...(r.aka ?? [])]) {
  const k = `${r.state}:${key(n)}`;
  if (!named.has(k) || named.get(k).kind !== "city") named.set(k, r);
}
const marketFrom = new Map();
for (const [id, row] of Object.entries(CITY_ROWS)) {
  if (byId.has(id)) continue;
  const state = id.slice(0, 2).toUpperCase();
  if (!(state in STATE_OPTIONS)) continue;
  const name = englishName(id) ?? id.slice(3).split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  const parts = name.split(/\s*\/\s*/);
  const match = parts.map((p) => named.get(`${state}:${key(p)}`)).find(Boolean);
  if (match) {
    match.aka = [...new Set([...(match.aka ?? []), ...(row.aka ?? []), ...parts.filter((p) => key(p) !== key(match.name)).map(key)])];
    if (row.market && !marketFrom.has(match.id)) marketFrom.set(match.id, row.market);
    continue;
  }
  byId.set(id, { id, name, state, kind: "city", scale: row.w, aka: row.aka ?? [], file: "india.ts" });
}

const served = (m) => (m && hasSide(m, "business") ? m : undefined);
// The nearest city decides before a name does: "SIDCUL Pantnagar" names
// SIDCUL, which is Haridwar's word, but lies by Rudrapur.
function marketOf(r, depth = 0) {
  const own = served(CITY_ROWS[r.id]?.market ?? marketFrom.get(r.id));
  if (own) return own;
  if (r.near && r.near !== r.id && depth < 3) {
    const parent = byId.get(r.near);
    const viaNear = parent ? marketOf(parent, depth + 1) : served(CITY_ROWS[r.near]?.market);
    return viaNear;
  }
  return served(marketForPlace(r.name, { region: r.state, match: "word" })) ?? served(r.district ? marketForPlace(r.district, { region: r.state, match: "word" }) : undefined);
}

const plainName = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const out = [...byId.values()]
  .map((r) => {
    const aka = [...new Set((r.aka ?? []).map((a) => String(a).toLowerCase().trim()).filter((a) => a && a !== plainName(r.name)))];
    const market = marketOf(r);
    return {
      id: r.id,
      name: r.name.trim(),
      state: r.state,
      kind: r.kind,
      ...(r.district ? { district: r.district } : {}),
      scale: r.scale,
      ...(r.sectors?.length ? { sectors: r.sectors } : {}),
      ...(aka.length ? { aka } : {}),
      ...(market ? { market } : {}),
    };
  })
  .sort((a, b) => a.state.localeCompare(b.state) || a.id.localeCompare(b.id));

const json = `${JSON.stringify(out)}\n`;
if (problems.length) {
  console.error(`site places: ${problems.length} problem(s)\n- ${problems.slice(0, 40).join("\n- ")}`);
  process.exit(1);
}
if (process.argv.includes("--check")) {
  if (!existsSync(OUT) || readFileSync(OUT, "utf8") !== json) {
    console.error("src/markets/site-places.json is stale: run node scripts/build-site-places.mjs");
    process.exit(1);
  }
  console.log(`Site places: ${out.length} up to date.`);
} else {
  writeFileSync(OUT, json);
  const states = new Set(out.map((p) => p.state)).size;
  console.log(`Wrote ${out.length} site places in ${states} states (${out.filter((p) => p.market).length} in our markets).`);
}
