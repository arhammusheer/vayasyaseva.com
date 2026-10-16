#!/usr/bin/env node
// The daily wage source monitor (PLAN §11, owner decision 4). See
// docs/wage-monitor.md.
//
//   node scripts/wage-monitor/index.mjs --dry-run      fetch and compare, print what it would report
//   node scripts/wage-monitor/index.mjs                 also open or update GitHub issues and save the snapshot
//
// Options:
//   --state <file>   the snapshot to compare against (default .wage-monitor/state.json)
//   --only <slug>    one state, e.g. --only delhi
//   --json           print the result as JSON instead of Markdown
//   --save-state     with --dry-run, still save the snapshot (to try changes locally)
//
// Host-neutral: GitHub Actions runs it daily, and the same command runs
// from a laptop, n8n or a Kubernetes CronJob. Needs GITHUB_TOKEN and
// GITHUB_REPOSITORY unless --dry-run. Exit 0 when the run completed (alerts
// go to issues), 2 when the monitor itself failed; the snapshot is saved only
// after every alert was sent, so a failed run reports again next time.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { importTs, root } from "../lib/register-ts.mjs";
import { buildTargets, fetchSource, istDate, registryProblems, runMonitor } from "./monitor.mjs";
import { githubClient, renderSummary, reportEvents } from "./report.mjs";

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

async function main() {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      state: { type: "string", default: ".wage-monitor/state.json" },
      only: { type: "string" },
      json: { type: "boolean", default: false },
      "save-state": { type: "boolean", default: false },
    },
  });
  const dryRun = values["dry-run"];
  const statePath = resolve(root, values.state);
  const { wageStates } = await importTs("src/content/wages/index.ts");
  const registry = JSON.parse(readFileSync(resolve(root, "scripts/wage-monitor/sources.json"), "utf8"));

  const problems = registryProblems(wageStates, registry);
  if (problems.length) throw new Error(`Source registry problems:\n- ${problems.join("\n- ")}`);

  const states = values.only ? wageStates.filter((s) => s.state === values.only) : wageStates;
  if (!states.length) throw new Error(`No wage dataset for ${values.only}`);

  const env = process.env;
  const github = dryRun ? null : env.GITHUB_TOKEN && env.GITHUB_REPOSITORY ? githubClient({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPOSITORY }) : undefined;
  if (github === undefined) throw new Error("Set GITHUB_TOKEN and GITHUB_REPOSITORY to report to GitHub, or pass --dry-run.");

  const previous = readState(statePath);
  const notes = [];
  if (!previous) notes.push(`No stored snapshot at ${values.state}: listing pages were recorded as a baseline; cited documents were compared with the hashes in the wage dataset.`);
  else if (values.only) notes.push(`Only ${values.only} was checked.`);

  const now = new Date();
  const today = istDate(now);
  const targets = buildTargets(states, registry);
  const run = await runMonitor({ targets, previous, fetcher: (url) => fetchSource(url), now });
  const actions = await reportEvents(run.events, { github, today });

  // Keep other states' snapshots when only one was checked.
  const nextState = values.only && previous ? { ...run.state, sources: { ...previous.sources, ...run.state.sources } } : run.state;
  const save = !dryRun || values["save-state"];
  if (save) writeState(statePath, nextState);
  if (dryRun) notes.push(`Dry run: no issues were opened${save ? "" : " and the snapshot was not saved"}.`);

  if (values.json) {
    console.log(JSON.stringify({ today, dryRun, events: run.events, actions, results: run.results.map((r) => ({ state: r.target.state, url: r.target.url, kind: r.target.kind, outcome: r.outcome, detail: r.detail })) }, null, 2));
  } else {
    console.log(renderSummary({ results: run.results, events: run.events, actions, today, dryRun, notes }));
    if (dryRun) for (const a of actions.filter((x) => x.body)) console.log(`\n---\n\n**Would ${a.action.replace(" (dry run)", "")}: ${a.title}**\n\n${a.body}`);
  }
}

main().catch((error) => {
  console.error(`wage monitor failed: ${error?.stack ?? error}`);
  process.exit(2);
});
