// The wage source monitor (PLAN §5.5, §11): fetches every document and
// listing page cited in src/content/wages/<state>.json and reports what
// changed since the figures were entered.
//
//   - a document whose SHA-256 differs from the stored hash, or that no
//     longer loads, needs a human to re-read it;
//   - a listing page that no longer links a cited document (by file name),
//     or no longer loads, may have moved or replaced it.
//
// Read-only and host-neutral: it runs the same from a laptop, a CI schedule,
// n8n or a k8s CronJob. Exit code 0 means nothing changed, 1 means something
// needs a look, 2 means the script itself failed. `--json` prints a machine
// report for the scheduler that runs it.
import { createHash } from "node:crypto";
import { importTs } from "./lib/register-ts.mjs";

const { wageStates } = await importTs("src/content/wages/index.ts");
const json = process.argv.includes("--json");
const TIMEOUT = 60_000;

async function get(url) {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(TIMEOUT), headers: { "user-agent": "vayasyaseva.com wage source monitor" } });
    const body = Buffer.from(await res.arrayBuffer());
    return { ok: res.ok, status: res.status, body };
  } catch (error) {
    return { ok: false, status: 0, error: String(error?.cause?.code ?? error?.message ?? error) };
  }
}

const findings = [];
const fileName = (url) => decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");

for (const state of wageStates) {
  const seenUrls = new Map();
  for (const source of state.sources) {
    let result = seenUrls.get(source.url);
    if (!result) {
      result = await get(source.url);
      seenUrls.set(source.url, result);
    }
    const where = `${state.state} ${source.id}`;
    if (!result.ok) {
      findings.push({ state: state.state, source: source.id, kind: "document-unreachable", detail: `${source.url} returned ${result.status || result.error}` });
      continue;
    }
    const sha = createHash("sha256").update(result.body).digest("hex");
    if (sha !== source.sha256) {
      findings.push({ state: state.state, source: source.id, kind: "document-changed", detail: `${source.url}: sha256 ${sha} (stored ${source.sha256})` });
    }
    if (!json) console.log(`ok  ${where}  ${(result.body.length / 1024).toFixed(0)} KB`);
  }
  const listings = [...new Set(state.sources.map((s) => s.listing))];
  for (const listing of listings) {
    const result = await get(listing);
    if (!result.ok) {
      findings.push({ state: state.state, listing, kind: "listing-unreachable", detail: `${listing} returned ${result.status || result.error}` });
      continue;
    }
    const html = result.body.toString("utf8");
    for (const source of state.sources.filter((s) => s.listing === listing)) {
      if (!html.includes(fileName(source.url))) {
        findings.push({ state: state.state, source: source.id, listing, kind: "not-on-listing", detail: `${listing} no longer links ${fileName(source.url)}` });
      }
    }
  }
}

if (json) {
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), changed: findings.length > 0, findings }, null, 2));
} else if (findings.length) {
  console.log(`\nWage sources need a look (${findings.length}):\n- ${findings.map((f) => `${f.state}: ${f.kind}: ${f.detail}`).join("\n- ")}`);
} else {
  console.log("\nWage sources unchanged: every document matches its stored hash and every listing still links it.");
}
process.exit(findings.length ? 1 : 0);
