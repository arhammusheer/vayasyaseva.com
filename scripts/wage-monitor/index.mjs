#!/usr/bin/env node
// The daily compliance source monitor (PLAN §11, owner decision 4): the
// minimum wage sources of every state with a wage page, and the EPF, ESIC,
// Professional Tax, Labour Welfare Fund, contract labour licence and labour
// code sources behind the employer dues. See docs/wage-monitor.md.
//
//   node scripts/wage-monitor/index.mjs --dry-run      fetch and compare, print what it would report
//   node scripts/wage-monitor/index.mjs                 also open or update GitHub issues and save the snapshot
//
// Options:
//   --state <file>   the snapshot to compare against (default .wage-monitor/state.json)
//   --only <slug>    one state, e.g. --only delhi
//   --json           print the result as JSON instead of Markdown
//   --save-state     with --dry-run, still save the snapshot (to try changes locally)
//   --notify <to>    github | hub, or github,hub
//                    (default: hub when NOTIFY_URL is set, else github)
//
// Host-neutral: a Kubernetes CronJob runs it daily and posts to the
// notification hub (vayasya-infra apps/compliance-monitor; NOTIFY_URL,
// NOTIFY_INGEST_SECRET; docs/notification-hub.md), and the same command runs
// from a laptop or GitHub Actions with GitHub issues (GITHUB_TOKEN and
// GITHUB_REPOSITORY). The hub goes first: its dedupeKey makes a retried run
// one notification, so a later destination's failure never doubles it.
// Exit 0 when the run completed, 2 when the monitor itself failed (it then
// tells the hub too, when it can); the snapshot is saved only
// after every alert was sent, so a failed run reports again next time.
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import tls from "node:tls";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { importTs, root } from "../lib/register-ts.mjs";
import { archiveNote, archivingFetcher } from "./archive.mjs";
import { CHECKS_KEY, checksDocument, checksNote, listingChecks } from "./checks.mjs";
import { LOCATION_CHECK_DAYS, buildTargets, fetchSource, istDate, legacyTlsFetch, locationTargets, registryProblems, relayFetch, runMonitor } from "./monitor.mjs";
import { r2FromEnv } from "./r2.mjs";
import { githubClient, monitorFailedEvent, renderSummary, reportEvents, reportToHub } from "./report.mjs";
import { hubFromEnv, parseNotify } from "../lib/notify-hub.mjs";

const DESTINATIONS = ["github", "hub"];
import { coverageProblems } from "./monitor.mjs";

function readState(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function writeState(path, state) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 1)}\n`);
  renameSync(tmp, path);
}

/**
 * Some government hosts serve an incomplete certificate chain (egazette.gov.in
 * sends its leaf without Let's Encrypt's YR1 intermediate, which chains to
 * the new ISRG Root YR). Browsers fetch the missing certificates; Node does
 * not, so the monitor trusts the PEMs in ./certs as extra certificates:
 * the YR1 intermediate and Root YR cross-signed by ISRG Root X1.
 */
function trustExtraCertificates() {
  const dir = resolve(root, "scripts/wage-monitor/certs");
  const extra = readdirSync(dir).filter((f) => f.endsWith(".pem")).map((f) => readFileSync(resolve(dir, f), "utf8"));
  tls.setDefaultCACertificates([...tls.getCACertificates("default"), ...extra]);
}

async function main() {
  trustExtraCertificates();
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      state: { type: "string", default: ".wage-monitor/state.json" },
      only: { type: "string" },
      json: { type: "boolean", default: false },
      "save-state": { type: "boolean", default: false },
      notify: { type: "string" },
      locations: { type: "boolean", default: false },
    },
  });
  const env = process.env;
  const notify = parseNotify(values.notify ?? defaultNotify(env), DESTINATIONS);
  const dryRun = values["dry-run"];
  const statePath = resolve(root, values.state);
  const { wageStates } = await importTs("src/content/wages/index.ts");
  const registry = JSON.parse(readFileSync(resolve(root, "scripts/wage-monitor/sources.json"), "utf8"));

  const { statutorySources } = await importTs("src/content/statutory.ts");
  const { guideSources } = await importTs("src/content/guides/sources.ts");
  const cited = [...statutorySources.map((s) => s.url), ...guideSources.map((s) => s.watchedAs ?? s.url).filter(Boolean)];
  const problems = [...registryProblems(wageStates, registry), ...coverageProblems(wageStates, registry, cited)];
  if (problems.length) throw new Error(`Source registry problems:\n- ${problems.join("\n- ")}`);

  const states = values.only ? wageStates.filter((s) => s.state === values.only) : wageStates;
  if (!states.length) throw new Error(`No wage dataset for ${values.only}`);

  const github = !notify.includes("github") || dryRun ? null : env.GITHUB_TOKEN && env.GITHUB_REPOSITORY ? githubClient({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPOSITORY }) : undefined;
  if (github === undefined) throw new Error("Set GITHUB_TOKEN and GITHUB_REPOSITORY to report to GitHub, or pass --dry-run.");
  const hub = !notify.includes("hub") || dryRun ? null : hubFromEnv(env);

  const previous = readState(statePath);
  const notes = [];
  if (!previous) notes.push(`No stored snapshot at ${values.state}: listing pages were recorded as a baseline; cited documents were compared with the hashes in the wage dataset.`);
  else if (values.only) notes.push(`Only ${values.only} was checked.`);

  const now = new Date();
  const today = istDate(now);
  const targets = buildTargets(states, registry);
  // Location page sources: a monthly load check (the first three days, or --locations).
  if (!values.only && (values.locations || LOCATION_CHECK_DAYS.includes(today.slice(8, 10)))) {
    const { locationPages } = await importTs("src/content/locations/index.ts");
    targets.push(...locationTargets([...locationPages.values()]));
  }
  // Hosts whose firewall refuses a descriptive user agent get a plain one (sources.json plainUserAgentHosts).
  const plain = new Set(registry.plainUserAgentHosts ?? []);
  const legacy = new Set(registry.legacyTlsHosts ?? []);
  // Hosts that drop the cluster's connections go through the relay Worker when it is configured (sources.json relayHosts).
  const relayed = env.FETCH_RELAY_URL && env.FETCH_RELAY_SECRET ? new Set(registry.relayHosts ?? []) : new Set();
  const viaRelay = relayed.size ? relayFetch({ url: env.FETCH_RELAY_URL, secret: env.FETCH_RELAY_SECRET }) : null;
  const plainFetcher = (url) => {
    const host = new URL(url).host;
    return fetchSource(url, {
      ...(plain.has(host) && { userAgent: "Mozilla/5.0" }),
      ...(legacy.has(host) && { fetchImpl: legacyTlsFetch }),
      ...(relayed.has(host) && { fetchImpl: viaRelay }),
    });
  };
  // With R2_ARCHIVE_* set, every PDF fetched is also kept in the archive (archive.mjs).
  const r2 = r2FromEnv(env);
  const archive = r2 ? archivingFetcher(plainFetcher, r2, now) : null;
  const run = await runMonitor({ targets, previous, fetcher: archive?.fetcher ?? plainFetcher, now });
  notes.push(archive ? archiveNote(archive.log) : "Archive: not configured (R2_ARCHIVE_* unset); originals were not stored.");
  // Keep other states' snapshots when only one was checked.
  const nextState = values.only && previous ? { ...run.state, sources: { ...previous.sources, ...run.state.sources } } : run.state;
  // The listing checks (checks.mjs): kept in the snapshot, published to the CDN for the wage pages.
  nextState.checks = listingChecks({ wageStates: states, targets, snapshot: nextState, today, previous: previous?.checks ?? {} });
  const actions = [];
  if (notify.includes("hub")) actions.push(...(await reportToHub(run.events, { hub, state: nextState, today })));
  if (notify.includes("github")) actions.push(...(await reportEvents(run.events, { github, today })));
  const save = !dryRun || values["save-state"];
  if (save) writeState(statePath, nextState);
  notes.push(checksNote(nextState.checks, today, await publishChecks(nextState.checks, { r2: dryRun ? null : r2, now })));
  const names = { github: "GitHub", hub: "the notification hub" };
  if (dryRun) notes.push(`Dry run: nothing was sent to ${notify.map((d) => names[d]).join(" or ")}${save ? "" : " and the snapshot was not saved"}.`);

  if (values.json) {
    console.log(JSON.stringify({ today, dryRun, events: run.events, actions, results: run.results.map((r) => ({ state: r.target.state, url: r.target.url, kind: r.target.kind, outcome: r.outcome, detail: r.detail })) }, null, 2));
  } else {
    console.log(renderSummary({ results: run.results, events: run.events, actions, today, dryRun, notes }));
    if (dryRun) for (const a of actions.filter((x) => x.body)) console.log(`\n---\n\n**Would ${a.action.replace(" (dry run)", "")}: ${a.title}**\n\n${a.body}`);
  }
}

/**
 * Publishes the listing checks to cdn.vayasyaseva.com (five minutes at the
 * edge; the pages cache it for a day). Like the archive, a failure is noted
 * and never fails the run: the pages then keep the last published record.
 */
async function publishChecks(checks, { r2, now }) {
  if (!r2) return "Not published (dry run, or R2_ARCHIVE_* unset).";
  try {
    await r2.put(CHECKS_KEY, Buffer.from(`${JSON.stringify(checksDocument(checks, now), null, 1)}\n`), { contentType: "application/json", cacheControl: "public, max-age=300" });
    return `Published to ${CHECKS_KEY}.`;
  } catch (error) {
    return `Could not publish: ${error?.message ?? error}.`;
  }
}

const defaultNotify = (env) => (env.NOTIFY_URL ? "hub" : "github");

/** The --notify list as given (or the default), for the failure path; a bad list reports nowhere. */
function notifyArg(argv = process.argv) {
  const at = argv.findIndex((a) => a === "--notify" || a.startsWith("--notify="));
  const raw = at < 0 ? defaultNotify(process.env) : argv[at].includes("=") ? argv[at].split("=")[1] : argv[at + 1];
  try {
    return parseNotify(raw, DESTINATIONS);
  } catch {
    return [];
  }
}

/** A run that fails tells the hub (compliance.monitor_failed), so a broken monitor is not silent. */
async function reportFailure(error) {
  const env = process.env;
  if (process.argv.includes("--dry-run")) return;
  const notify = notifyArg();
  if (notify.includes("hub") && env.NOTIFY_URL && env.NOTIFY_INGEST_SECRET) {
    try {
      await hubFromEnv(env).send([monitorFailedEvent(error, istDate())]);
    } catch (notifyError) {
      console.error(`could not tell the notification hub: ${notifyError?.message ?? notifyError}`);
    }
  }
}

main().catch(async (error) => {
  console.error(`compliance monitor failed: ${error?.stack ?? error}`);
  await reportFailure(error);
  process.exit(2);
});
