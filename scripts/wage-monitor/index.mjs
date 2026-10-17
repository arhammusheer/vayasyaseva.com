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
//   --notify <to>    chatwoot | github (default: chatwoot when CHATWOOT_BASE_URL is set, else github)
//
// Host-neutral: a Kubernetes CronJob runs it daily and notifies Chatwoot
// (vayasya-infra apps/compliance-monitor; CHATWOOT_BASE_URL and
// CHATWOOT_INBOX_IDENTIFIER), and the same command runs from a laptop or
// GitHub Actions with GitHub issues (GITHUB_TOKEN and GITHUB_REPOSITORY).
// Exit 0 when the run completed, 2 when the monitor itself failed (it then
// tells Chatwoot too, when it can); the snapshot is saved only after every
// alert was sent, so a failed run reports again next time.
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import tls from "node:tls";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { importTs, root } from "../lib/register-ts.mjs";
import { archiveNote, archivingFetcher } from "./archive.mjs";
import { buildTargets, fetchSource, istDate, registryProblems, runMonitor } from "./monitor.mjs";
import { r2FromEnv } from "./r2.mjs";
import { chatwootClient, githubClient, renderSummary, reportEvents, reportToChatwoot } from "./report.mjs";
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
    },
  });
  const env = process.env;
  const notify = values.notify ?? (env.CHATWOOT_BASE_URL ? "chatwoot" : "github");
  if (!["chatwoot", "github"].includes(notify)) throw new Error(`--notify must be chatwoot or github, not ${notify}`);
  const dryRun = values["dry-run"];
  const statePath = resolve(root, values.state);
  const { wageStates } = await importTs("src/content/wages/index.ts");
  const registry = JSON.parse(readFileSync(resolve(root, "scripts/wage-monitor/sources.json"), "utf8"));

  const { statutorySources } = await importTs("src/content/statutory.ts");
  const problems = [...registryProblems(wageStates, registry), ...coverageProblems(wageStates, registry, statutorySources.map((s) => s.url))];
  if (problems.length) throw new Error(`Source registry problems:\n- ${problems.join("\n- ")}`);

  const states = values.only ? wageStates.filter((s) => s.state === values.only) : wageStates;
  if (!states.length) throw new Error(`No wage dataset for ${values.only}`);

  const github = notify !== "github" || dryRun ? null : env.GITHUB_TOKEN && env.GITHUB_REPOSITORY ? githubClient({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPOSITORY }) : undefined;
  if (github === undefined) throw new Error("Set GITHUB_TOKEN and GITHUB_REPOSITORY to report to GitHub, or pass --dry-run.");
  const chatwoot = notify !== "chatwoot" || dryRun ? null : chatwootFromEnv(env);

  const previous = readState(statePath);
  const notes = [];
  if (!previous) notes.push(`No stored snapshot at ${values.state}: listing pages were recorded as a baseline; cited documents were compared with the hashes in the wage dataset.`);
  else if (values.only) notes.push(`Only ${values.only} was checked.`);

  const now = new Date();
  const today = istDate(now);
  const targets = buildTargets(states, registry);
  // Hosts whose firewall refuses a descriptive user agent get a plain one (sources.json plainUserAgentHosts).
  const plain = new Set(registry.plainUserAgentHosts ?? []);
  const plainFetcher = (url) => fetchSource(url, plain.has(new URL(url).host) ? { userAgent: "Mozilla/5.0" } : {});
  // With R2_ARCHIVE_* set, every PDF fetched is also kept in the archive (archive.mjs).
  const r2 = r2FromEnv(env);
  const archive = r2 ? archivingFetcher(plainFetcher, r2, now) : null;
  const run = await runMonitor({ targets, previous, fetcher: archive?.fetcher ?? plainFetcher, now });
  notes.push(archive ? archiveNote(archive.log) : "Archive: not configured (R2_ARCHIVE_* unset); originals were not stored.");
  // Keep other states' snapshots when only one was checked.
  const nextState = values.only && previous ? { ...run.state, sources: { ...previous.sources, ...run.state.sources } } : run.state;
  const actions = notify === "chatwoot" ? await reportToChatwoot(run.events, { chatwoot, state: nextState, today }) : await reportEvents(run.events, { github, today });
  const save = !dryRun || values["save-state"];
  if (save) writeState(statePath, nextState);
  if (dryRun) notes.push(`Dry run: nothing was sent to ${notify === "chatwoot" ? "Chatwoot" : "GitHub"}${save ? "" : " and the snapshot was not saved"}.`);

  if (values.json) {
    console.log(JSON.stringify({ today, dryRun, events: run.events, actions, results: run.results.map((r) => ({ state: r.target.state, url: r.target.url, kind: r.target.kind, outcome: r.outcome, detail: r.detail })) }, null, 2));
  } else {
    console.log(renderSummary({ results: run.results, events: run.events, actions, today, dryRun, notes }));
    if (dryRun) for (const a of actions.filter((x) => x.body)) console.log(`\n---\n\n**Would ${a.action.replace(" (dry run)", "")}: ${a.title}**\n\n${a.body}`);
  }
}

function chatwootFromEnv(env) {
  if (!env.CHATWOOT_BASE_URL || !env.CHATWOOT_INBOX_IDENTIFIER) throw new Error("Set CHATWOOT_BASE_URL and CHATWOOT_INBOX_IDENTIFIER to report to Chatwoot, or pass --dry-run.");
  return chatwootClient({ baseUrl: env.CHATWOOT_BASE_URL, inboxIdentifier: env.CHATWOOT_INBOX_IDENTIFIER });
}

/** A run that fails tells Chatwoot, in its own conversation, so a broken monitor is not silent. */
async function reportFailure(error) {
  const env = process.env;
  if (process.argv.includes("--dry-run") || !env.CHATWOOT_BASE_URL || !env.CHATWOOT_INBOX_IDENTIFIER) return;
  try {
    const chatwoot = chatwootFromEnv(env);
    const contact = (await chatwoot.createContact()).source_id;
    const conversation = (await chatwoot.createConversation(contact, { title: "Compliance monitor failed" })).id;
    const first = String(error?.message ?? error).split("\n").slice(0, 12).join("\n");
    await chatwoot.message(contact, conversation, `**The compliance monitor failed** (${istDate()})\n\n~~~text\n${first}\n~~~\n\nNo sources were checked or no alerts were sent today. Check the CronJob's logs: \`kubectl -n growth logs job/<latest compliance-monitor job>\`.`);
  } catch (notifyError) {
    console.error(`could not tell Chatwoot: ${notifyError?.message ?? notifyError}`);
  }
}

main().catch(async (error) => {
  console.error(`compliance monitor failed: ${error?.stack ?? error}`);
  await reportFailure(error);
  process.exit(2);
});
