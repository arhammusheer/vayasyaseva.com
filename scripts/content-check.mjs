// Content checks that run before the build (pnpm content:check):
//   C1  the page and cluster registry (src/content/registry) is valid and
//       matches the app routes;
//   C2  nothing collides in the /jobs/<slug> namespace, and stored ids agree;
//   C8  every minimum wage file (src/content/wages) is valid: its shape, every
//       monthly rate is basic + VDA, daily rates follow the state's rule,
//       every rate cites a source, and every built wage page has a file.
//       A revision that is due or overdue is a warning: the page shows its
//       own notice and drops the year (PLAN §5.5), so CI never breaks on a date.
//   C10 guides: a published guide names its legal reviewer and carries a
//       publish date no earlier than the review; citations resolve;
//       contractor terms in titles, H1s, headings and metas; three agency
//       terms at most outside comparison tables.
//   C9  no file under src/ has an internal-only key (payrollEntity,
//       deliveryRoute, partner, internal, routingKey, fulfil*, sister*), and,
//       when the PUBLIC_DENYLIST secret is set, no denylisted name appears in
//       any tracked text file or the built output (.next HTML, RSC and client
//       chunks). The output names the file and line, never the term.
//   C12 after a build: no client chunk carries the wage datasets.
//   C13 translated wage copy (src/content/pages/minimum-wages.hi.ts) records
//       the sourceHash of each English block it translates; a changed English
//       block fails until the translation is updated (PLAN §6.6).
// Claim expiry is a warning, not a failure: an expired claim hides itself
// and the page stays live (PLAN §12), so CI never breaks on a date.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { execFileSync } from "node:child_process";
import { importTs, root } from "./lib/register-ts.mjs";

// --write-sitemap-snapshot: record the current sitemap as the expected one
// (tests/sitemap-snapshot.spec.mjs). Only for an intended sitemap change.
if (process.argv.includes("--write-sitemap-snapshot")) {
  const { writeFileSync } = await import("node:fs");
  const { default: sitemap } = await importTs("src/app/sitemap.ts");
  writeFileSync(join(root, "tests/fixtures/sitemap.snapshot.json"), `${JSON.stringify(sitemap(), null, 2)}\n`);
  console.log("Wrote tests/fixtures/sitemap.snapshot.json");
  process.exit(0);
}

const errors = [];
const fail = (message) => errors.push(message);
const warnings = [];
const warn = (message) => warnings.push(message);

const { pageEntries, pathAliases, clusters, builtLocales, publishedLocales, PAUSABLE_KINDS } = await importTs("src/content/registry/index.ts");
const { pageEntrySchema, clusterSchema } = await importTs("src/content/registry/schema.ts");
const { CLUSTER_IDS, HARIDWAR_AREA_IDS, LOCALE_TAGS } = await importTs("src/content/registry/identifiers.ts");
const { JOB_ROLE_SLUGS, JOB_HUB_SLUGS, QUICK_ANSWERS, INTAKE_LOCALES, INTAKE_CLUSTERS, AREA_CLUSTERS } = await importTs("src/lib/talent-intake/rules.ts");

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}
const rel = (path) => relative(root, path).split(sep).join("/");

// ── C1: registry schema and integrity ───────────────────────────────────────
const byPath = new Map();
for (const entry of pageEntries) {
  const parsed = pageEntrySchema.safeParse(entry);
  if (!parsed.success) fail(`C1 page ${entry.path}: ${parsed.error.issues.map((i) => `${i.path.join(".") || "entry"} ${i.message}`).join("; ")}`);
  if (byPath.has(entry.path)) fail(`C1 page ${entry.path} is listed twice`);
  byPath.set(entry.path, entry);
}
const clusterIds = new Set();
for (const cluster of clusters) {
  const parsed = clusterSchema.safeParse(cluster);
  if (!parsed.success) fail(`C1 cluster ${cluster.id}: ${parsed.error.issues.map((i) => `${i.path.join(".") || "entry"} ${i.message}`).join("; ")}`);
  if (clusterIds.has(cluster.id)) fail(`C1 cluster ${cluster.id} is listed twice`);
  clusterIds.add(cluster.id);
  if (!publishedLocales(cluster.buyerHub).length) fail(`C1 cluster ${cluster.id}: buyer hub ${cluster.buyerHub} is not a published page`);
  const today = new Date().toISOString().slice(0, 10);
  const addMonths = (iso, n) => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + n);
    return d.toISOString().slice(0, 10);
  };
  for (const claim of cluster.claims) {
    const label = `C1 cluster ${cluster.id}: claim "${claim.text.slice(0, 40)}…"`;
    if (claim.expires <= claim.signedOffOn) fail(`${label} expires (${claim.expires}) on or before its sign-off (${claim.signedOffOn})`);
    else if (claim.expires > addMonths(claim.signedOffOn, 6)) fail(`${label} expires more than six months after its sign-off (${claim.signedOffOn})`);
    if (claim.expires < today) warn(`${label} expired on ${claim.expires}; it is hidden until it is signed off again`);
    else if (addMonths(claim.signedOffOn, 5) <= today) warn(`${label} expires on ${claim.expires}; ask for a fresh sign-off`);
  }
  for (const reg of cluster.registrations) {
    const label = `C1 cluster ${cluster.id}: registration "${reg.name["en-IN"]}"`;
    if (reg.expires > addMonths(reg.signedOffOn, 6)) fail(`${label} expires more than six months after its sign-off (${reg.signedOffOn})`);
    if (reg.expires < today) warn(`${label} expired on ${reg.expires}; "What we hold" hides it until it is signed off again`);
  }
}
const isPublished = (path) => publishedLocales(path).length > 0;
for (const entry of pageEntries) {
  if (entry.parent && !byPath.has(entry.parent)) fail(`C1 page ${entry.path}: parent ${entry.parent} is not in the registry`);
  else if (entry.parent && isPublished(entry.path) && !isPublished(entry.parent)) fail(`C1 page ${entry.path} is published but its parent ${entry.parent} is not`);
  if (entry.cluster && isPublished(entry.path) && !clusterIds.has(entry.cluster)) {
    fail(`C1 page ${entry.path} is published for cluster "${entry.cluster}", which is not in clusters.ts`);
  }
  if (entry.retiredTo && !isPublished(entry.retiredTo)) fail(`C1 page ${entry.path}: retiredTo ${entry.retiredTo} is not a published page`);
  // Only cluster hubs render the "not taking applications or new work" notice
  // (src/components/sections/paused-notice.tsx); anything else would still look open.
  if (Object.values(entry.locales).includes("paused") && !PAUSABLE_KINDS.has(entry.kind)) {
    fail(`C1 page ${entry.path} is paused, but a ${entry.kind} page cannot show the paused notice (only ${[...PAUSABLE_KINDS].join(", ")}); use review instead`);
  }
}
for (const [from, to] of Object.entries(pathAliases)) {
  if (byPath.has(from)) fail(`C1 alias ${from} is also a page`);
  if (!isPublished(to)) fail(`C1 alias ${from} points to ${to}, which is not a published page`);
}

// Every built page has a route under app/[locale], and every static route has a page entry.
const appDir = join(root, "src", "app", "[locale]");
const routes = walk(appDir)
  .filter((file) => file.endsWith(`${sep}page.tsx`))
  .map((file) => {
    const all = relative(appDir, file).split(sep).slice(0, -1);
    const group = all.find((s) => /^\(.+\)$/.test(s))?.slice(1, -1);
    const segments = all.filter((s) => !/^\(.+\)$/.test(s));
    const path = `/${segments.join("/")}`;
    const pattern = new RegExp(`^${path.replace(/\[[^\]]+\]/g, "[^/]+")}$`);
    return { path, pattern, group, dynamic: /\[/.test(path) };
  });
// The audience flag decides the layout (PLAN §1a, §7.3): business pages live
// in (marketing) with the phone, jobs pages in (jobs), mixed pages in the
// phone-free (reference) group. The home page sits in (marketing).
const GROUP_OF_AUDIENCE = { business: "marketing", jobs: "jobs", mixed: "reference" };
for (const entry of pageEntries) {
  if (!builtLocales(entry.path).length) continue;
  const route = routes.find((r) => r.path === entry.path) ?? routes.find((r) => r.pattern.test(entry.path));
  if (!route) fail(`C1 page ${entry.path} has no route under src/app/[locale]`);
  else if (route.group !== GROUP_OF_AUDIENCE[entry.audience]) {
    fail(`C1 page ${entry.path} has audience "${entry.audience}" but its route is in (${route.group ?? "no group"}); move it to (${GROUP_OF_AUDIENCE[entry.audience]}) or change the audience`);
  }
}
for (const route of routes) {
  if (!route.dynamic && !byPath.has(route.path)) fail(`C1 route ${route.path} (src/app/[locale]) has no entry in src/content/registry/pages.ts`);
}

// ── C2: namespaces and stored ids ───────────────────────────────────────────
const SLUG_KINDS = { "job-role": "JOB_ROLES", "job-hub": "JOB_HUBS", "jobs-city": "cluster id (/jobs/<cluster>)" };
const fixedJobSlugs = pageEntries
  .filter((p) => /^\/jobs\/[^/]+$/.test(p.path) && !(p.kind in SLUG_KINDS))
  .map((p) => p.path.slice("/jobs/".length));
const jobSlugs = [
  ["fixed page", fixedJobSlugs],
  ["JOB_ROLES", JOB_ROLE_SLUGS],
  ["JOB_HUBS", JOB_HUB_SLUGS],
  ["cluster id (/jobs/<cluster>)", CLUSTER_IDS.filter((id) => id !== "other")],
];
const seenSlug = new Map();
for (const [source, slugs] of jobSlugs) {
  for (const slug of slugs) {
    if (seenSlug.has(slug)) fail(`C2 /jobs/${slug} is claimed by both ${seenSlug.get(slug)} and ${source}`);
    else seenSlug.set(slug, source);
  }
}
for (const entry of pageEntries) {
  const slug = /^\/jobs\/([^/]+)$/.exec(entry.path)?.[1];
  if (!slug) continue;
  const owner = seenSlug.get(slug);
  const expected = SLUG_KINDS[entry.kind];
  if (expected && owner !== expected) fail(`C2 page ${entry.path} is a ${entry.kind} but /jobs/${slug} belongs to ${owner ?? "nothing"}`);
}
for (const [kind, slugs] of [["job-role", JOB_ROLE_SLUGS], ["job-hub", JOB_HUB_SLUGS]]) {
  for (const slug of slugs) {
    if (byPath.get(`/jobs/${slug}`)?.kind !== kind) fail(`C2 /jobs/${slug} has no ${kind} entry in the registry`);
  }
}
const areaIds = Object.keys(QUICK_ANSWERS.area);
if (areaIds.join() !== HARIDWAR_AREA_IDS.join()) fail(`C2 QUICK_ANSWERS.area (${areaIds.join(", ")}) differs from HARIDWAR_AREA_IDS; stored ids are append-only`);
// rules.ts must stay import-free (n8n inlines it), so it repeats these lists.
if (INTAKE_LOCALES.join() !== LOCALE_TAGS.join()) fail(`C2 INTAKE_LOCALES in rules.ts (${INTAKE_LOCALES.join(", ")}) differs from LOCALE_TAGS`);
if (INTAKE_CLUSTERS.join() !== CLUSTER_IDS.join()) fail(`C2 INTAKE_CLUSTERS in rules.ts (${INTAKE_CLUSTERS.join(", ")}) differs from CLUSTER_IDS`);
if (Object.keys(AREA_CLUSTERS).join() !== areaIds.join()) fail("C2 AREA_CLUSTERS in rules.ts must give a cluster (or null) for every area answer");

// ── C8: the minimum wage dataset ───────────────────────────────────────────
const { wageStates, wageStatus } = await importTs("src/content/wages/index.ts");
const { wageStateSchema, wageIntegrityProblems } = await importTs("src/content/wages/schema.ts");
const { WAGE_STATE_SLUGS, wageStatePath } = await importTs("src/content/registry/identifiers.ts");
for (const state of wageStates) {
  const parsed = wageStateSchema.safeParse(state);
  if (!parsed.success) fail(`C8 wages ${state.state}: ${parsed.error.issues.map((i) => `${i.path.join(".") || "file"} ${i.message}`).join("; ")}`);
  for (const problem of wageIntegrityProblems(state)) fail(`C8 wages ${state.state}: ${problem}`);
  if (!state.checked.by) warn(`C8 wages ${state.state}: no sign-off yet (checked.by); the page says the figures were entered from the state's documents, not that anyone checked them`);
  const status = wageStatus(state);
  if (status.stale) warn(`C8 wages ${state.state}: stale since ${status.staleFrom} (revision expected ${state.nextRevision.expected}, last check ${state.checked.on}); the page shows the "may have been revised" notice until it is re-checked`);
  else if (status.revisionDue) warn(`C8 wages ${state.state}: revision was due on ${state.nextRevision.expected}; re-check the state's sources before ${status.staleFrom}`);
}
for (const slug of WAGE_STATE_SLUGS) {
  if (builtLocales(wageStatePath(slug)).length && !wageStates.some((s) => s.state === slug)) fail(`C8 ${wageStatePath(slug)} is built but src/content/wages/${slug}.json does not exist`);
}

// ── C13: translation sourceHash (PLAN §6.6) ────────────────────────────────
// Each translated block records the hash of the English it was made from.
// When the English changes, the Hindi must be checked and its hash updated.
{
  const { createHash } = await import("node:crypto");
  const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 12);
  const english = readFileSync(join(root, "src/content/pages/minimum-wages.ts"), "utf8");
  const current = {};
  for (const [, key, body] of english.matchAll(/^[ \t]*\/\/ @hi-source (\S+)\n([\s\S]*?)^[ \t]*\/\/ @hi-source-end$/gm)) current[key] = hash(body);
  for (const state of wageStates) {
    current[`data:${state.state}`] = hash(
      JSON.stringify({
        tables: state.tables.map(({ id, title, appliesTo, dailyRule, basicLabel, vdaLabel, vdaNote, zones }) => ({ id, title, appliesTo, dailyRule, basicLabel, vdaLabel, vdaNote, zones })),
        notes: state.history.map((h) => [h.table, h.effectiveFrom, h.note ?? null]),
      }),
    );
  }
  const { HI_SOURCE_HASH } = await importTs("src/content/pages/minimum-wages.hi.ts");
  for (const [key, value] of Object.entries(current)) {
    if (HI_SOURCE_HASH[key] !== value) {
      fail(`C13 the English for "${key}" changed since its Hindi translation (src/content/pages/minimum-wages.hi.ts). Update the Hindi, then set HI_SOURCE_HASH["${key}"] to "${value}"`);
    }
  }
  for (const key of Object.keys(HI_SOURCE_HASH)) if (!(key in current)) fail(`C13 HI_SOURCE_HASH has "${key}", which no English block carries`);
}

// ── C10: guides (PLAN §5.6, §10.1) ─────────────────────────────────────────
// A guide is published only with a named legal reviewer, re-reviewed within
// six months; every citation resolves to a listed source; titles, H1s,
// headings and metas use contractor terms only (docs/brand-rules.md).
{
  const { guides, citedSources } = await importTs("src/content/guides/index.ts");
  const { guideSources } = await importTs("src/content/guides/sources.ts");
  const { GUIDE_SLUGS, guidePath } = await importTs("src/content/registry/identifiers.ts");
  const AGENCY = /\b(agency|agencies|consultancy|consultant|placement|staffing)\b/i;
  const AGENCY_TERMS = /\b(?:manpower agenc(?:y|ies)|manpower consultanc(?:y|ies)|staffing (?:agenc(?:y|ies)|compan(?:y|ies))|placement agenc(?:y|ies)|job consultanc(?:y|ies)|staff agenc(?:y|ies))\b/gi;
  const sourceIds = new Set(guideSources.map((s) => s.id));
  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(Date.now() - 182 * 864e5).toISOString().slice(0, 10);
  for (const slug of GUIDE_SLUGS) {
    const path = guidePath(slug);
    const guide = guides[slug];
    const built = builtLocales(path).length > 0;
    if (built && !guide) fail(`C10 ${path} is built but has no content in src/content/guides`);
    if (!guide) continue;
    if (guide.slug !== slug) fail(`C10 ${path}: content slug is ${guide.slug}`);
    if (byPath.get(path)?.audience && byPath.get(path).audience !== guide.audience) fail(`C10 ${path}: registry audience ${byPath.get(path).audience} differs from the guide's ${guide.audience}`);
    if (isPublished(path)) {
      if (!guide.review) fail(`C10 ${path} is published without a named legal reviewer (src/content/guides/${slug}.ts, review)`);
      else if (guide.review.on < sixMonthsAgo) warn(`C10 ${path}: last legal review ${guide.review.on} is more than six months old; ask for a re-review`);
      if (!guide.published) fail(`C10 ${path} is published but has no publish date (src/content/guides/${slug}.ts, published)`);
      else if (guide.review && guide.published < guide.review.on) fail(`C10 ${path}: publish date ${guide.published} is before the legal review (${guide.review.on})`);
    } else if (guide.published) {
      fail(`C10 ${path} is in review but has a publish date (${guide.published}); set published when it goes live`);
    }
    // PLAN §6.1: agency terms in the difference paragraph and FAQs only, three
    // at most per page. Comparison tables are exempt (§5.2).
    const prose = [
      ...guide.sections.flatMap((s) =>
        s.blocks.flatMap((b) => (b.type === "p" || b.type === "vspl" ? [b.text] : b.type === "rows" ? b.items.flatMap((i) => [i.title, i.text]) : b.type === "h3" ? [b.text] : [])),
      ),
      ...guide.faqs.flatMap((f) => [f.question, f.answer]),
    ].join("\n");
    const agencyTerms = prose.match(AGENCY_TERMS) ?? [];
    if (agencyTerms.length > 3) fail(`C10 ${path}: ${agencyTerms.length} agency terms outside tables (max 3): ${agencyTerms.join(", ")}`);
    if (guide.review && guide.review.on > today) fail(`C10 ${path}: review date ${guide.review.on} is in the future`);
    if (guide.title.length > 55) fail(`C10 ${path}: title is ${guide.title.length} characters (max 55)`);
    if (guide.description.length < 140 || guide.description.length > 160) fail(`C10 ${path}: meta description is ${guide.description.length} characters (140 to 160)`);
    for (const [label, text] of [["title", guide.title], ["H1", guide.h1], ["meta description", guide.description], ...guide.sections.map((s) => ["heading", s.heading])]) {
      if (AGENCY.test(text)) fail(`C10 ${path}: agency word in the ${label} "${text}" (contractor terms only)`);
    }
    const cited = citedSources(guide);
    for (const id of cited) {
      if (!sourceIds.has(id)) fail(`C10 ${path}: cites unknown source "${id}"`);
      if (!guide.sources.includes(id)) fail(`C10 ${path}: cites "${id}" but does not list it in sources`);
    }
    for (const id of guide.sources) if (!cited.includes(id)) fail(`C10 ${path}: lists source "${id}" but never cites it`);
  }
  for (const s of guideSources) {
    if (!s.url && s.kind !== "rules" && s.kind !== "notification") fail(`C10 guide source ${s.id} has no URL; only gazette notifications and rules may be cited by number alone`);
    if (s.url && !/^https:\/\//.test(s.url)) fail(`C10 guide source ${s.id}: URL must be https`);
  }
}

// ── C9: internal-only keys and the public denylist ─────────────────────────
const TEXT = /\.(ts|tsx|js|mjs|cjs|json|md|mdx|txt|css|html|svg|xml|yml|yaml|csv|tsv|webmanifest|body|rsc|sh|py|toml|example)$/i;
const FORBIDDEN_KEY =
  /(^|[{,;(]|\s)(?:readonly\s+)?(["'`]?)(payrollEntity|deliveryRoute|partners?|internal|routingKey|fulfil\w*|sister\w*)\2\s*\??\s*:(?!:)/g;
for (const file of walk(join(root, "src")).filter((f) => /\.(ts|tsx|js|mjs|json)$/.test(f))) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      for (const match of line.matchAll(FORBIDDEN_KEY)) {
        // A ternary branch (a ? internal : b) is not a key.
        if (line.slice(0, match.index + match[1].length).trimEnd().endsWith("?")) continue;
        fail(`C9 ${rel(file)}:${i + 1} has an internal-only key "${match[3]}"; the repo is public`);
      }
    });
}

const denylist = (process.env.PUBLIC_DENYLIST ?? "")
  .split(",")
  .map((term) => term.trim().toLowerCase())
  .filter((term) => term.length >= 3);
if (denylist.length) {
  // Every tracked text file in this public repo, plus the built output.
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean)
    .map((file) => join(root, file));
  const scanned = [
    ...tracked.filter((file) => TEXT.test(file) || /(^|\/)[^./]+$/.test(file)),
    ...walk(join(root, ".next", "server", "app")).filter((f) => /\.(html|body|rsc)$/.test(f)),
    ...walk(join(root, ".next", "static", "chunks")).filter((f) => /\.js$/.test(f)),
  ].filter((file) => existsSync(file) && statSync(file).isFile());
  let found = 0;
  for (const file of scanned) {
    const lines = readFileSync(file, "utf8").toLowerCase().split("\n");
    lines.forEach((line, i) => {
      if (denylist.some((term) => line.includes(term))) {
        found++;
        fail(`C9 denylisted term found in ${rel(file)}:${i + 1}`);
      }
    });
  }
  console.log(`Public denylist: ${denylist.length} term(s) checked in ${scanned.length} files${found ? `, ${found} hit(s)` : ""}`);
} else {
  console.log("Public denylist: PUBLIC_DENYLIST not set, skipped");
}

// ── C12: no wage dataset in the browser's JS ───────────────────────────────
// The registry is imported by the client Link (through src/lib/i18n.ts), so
// it must never import src/content/wages: every page would ship the state
// datasets to job seekers on patchy 4G. Runs once a build exists.
{
  const chunks = walk(join(root, ".next", "static", "chunks")).filter((f) => f.endsWith(".js"));
  const WAGE_DATA = /Shram Anubhag|"?sha256"?\s*:\s*"[0-9a-f]{64}"|legalBasis/;
  for (const file of chunks) {
    if (WAGE_DATA.test(readFileSync(file, "utf8"))) fail(`C12 ${rel(file)} carries wage dataset content; keep src/content/wages out of client imports (WAGE_STATE_UPDATED in src/content/registry/pages.ts)`);
  }
  if (chunks.length) console.log(`Client chunks: ${chunks.length} checked for wage data`);
}

if (warnings.length) console.warn(`Content check warnings (${warnings.length}):\n- ${warnings.join("\n- ")}`);
if (errors.length) {
  console.error(`Content check failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Content check passed: ${pageEntries.length} pages, ${clusters.length} cluster(s), ${wageStates.length} wage state(s), /jobs namespace clear, no internal-only keys`);
