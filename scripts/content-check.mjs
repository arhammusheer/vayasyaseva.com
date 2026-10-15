// Content checks that run before the build (pnpm content:check):
//   C1  the page and cluster registry (src/content/registry) is valid and
//       matches the app routes;
//   C2  nothing collides in the /jobs/<slug> namespace, and stored ids agree;
//   C9  no file under src/ has an internal-only key (payrollEntity,
//       deliveryRoute, partner, internal, routingKey, fulfil*, sister*), and,
//       when the PUBLIC_DENYLIST secret is set, no denylisted name appears in
//       any tracked text file or the built output (.next HTML, RSC and client
//       chunks). The output names the file and line, never the term.
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

const { pageEntries, pathAliases, clusters, builtLocales, publishedLocales } = await importTs("src/content/registry/index.ts");
const { pageEntrySchema, clusterSchema } = await importTs("src/content/registry/schema.ts");
const { CLUSTER_IDS, HARIDWAR_AREA_IDS } = await importTs("src/content/registry/identifiers.ts");
const { JOB_ROLE_SLUGS, JOB_HUB_SLUGS, QUICK_ANSWERS } = await importTs("src/lib/talent-intake/rules.ts");

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
}
const isPublished = (path) => publishedLocales(path).length > 0;
for (const entry of pageEntries) {
  if (entry.parent && !byPath.has(entry.parent)) fail(`C1 page ${entry.path}: parent ${entry.parent} is not in the registry`);
  else if (entry.parent && isPublished(entry.path) && !isPublished(entry.parent)) fail(`C1 page ${entry.path} is published but its parent ${entry.parent} is not`);
  if (entry.cluster && isPublished(entry.path) && !clusterIds.has(entry.cluster)) {
    fail(`C1 page ${entry.path} is published for cluster "${entry.cluster}", which is not in clusters.ts`);
  }
  if (entry.retiredTo && !isPublished(entry.retiredTo)) fail(`C1 page ${entry.path}: retiredTo ${entry.retiredTo} is not a published page`);
  // Pages do not yet render the "not taking applications or new work" notice
  // or turn their forms off, so a paused page would still look open. Remove
  // this once the paused rendering lands.
  if (Object.values(entry.locales).includes("paused")) fail(`C1 page ${entry.path} is paused, but pages cannot show the paused notice yet; use review instead`);
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
    const segments = relative(appDir, file).split(sep).slice(0, -1).filter((s) => !/^\(.+\)$/.test(s));
    const path = `/${segments.join("/")}`;
    const pattern = new RegExp(`^${path.replace(/\[[^\]]+\]/g, "[^/]+")}$`);
    return { path, pattern, dynamic: /\[/.test(path) };
  });
for (const entry of pageEntries) {
  if (builtLocales(entry.path).length && !routes.some((r) => r.pattern.test(entry.path))) fail(`C1 page ${entry.path} has no route under src/app/[locale]`);
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

if (warnings.length) console.warn(`Content check warnings (${warnings.length}):\n- ${warnings.join("\n- ")}`);
if (errors.length) {
  console.error(`Content check failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Content check passed: ${pageEntries.length} pages, ${clusters.length} cluster(s), /jobs namespace clear, no internal-only keys`);
