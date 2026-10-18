// Replays real sessions through the visitor context engine under candidate
// weights and scores each against what visitors then did
// (docs/visitor-context.md, "Tuning"; the logic is scripts/lib/context-replay.mjs).
//
//   node scripts/context-replay.mjs                          last 28 days from Umami, current weights
//   node scripts/context-replay.mjs --save ~/vspl-replay.json   ...and keep the sessions for reruns
//   node scripts/context-replay.mjs --from ~/vspl-replay.json --candidate try.json --set jobs.ipCity=4
//
// A candidate file names only the weights it changes:
//   { "name": "IP city 4", "jobs": { "ipCity": 4 }, "bands": { "confidentPoints": 7 } }
// Groups: jobs, business (src/context/weights.ts RegionWeights), audience, bands, days.
//
// Umami goes through ~/.config/umami/api.sh (port-forward and Keychain key;
// UMAMI_API overrides the path). The dump holds pseudonymous Umami session
// ids, paths, queries and event props: keep it out of the repo, and delete it
// when tuning is done (the 30-day purge of form drafts doesn't reach copies).
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename } from "node:path";
import { parseArgs, promisify } from "node:util";
import {
  DUMP_VERSION,
  NEEDS_DATA,
  SMALL,
  TARGETS,
  checkCandidate,
  diffs,
  eventProps,
  fidelitySummary,
  loadEngine,
  prepareSession,
  score,
  toDumpSession,
  wilson,
  withWeights,
} from "./lib/context-replay.mjs";

const WEBSITE = "1d8f6454-c0ac-4b8c-b00e-970d61a90717";
const API = process.env.UMAMI_API ?? `${homedir()}/.config/umami/api.sh`;
const DAY = 864e5;

const { values: args } = parseArgs({
  options: {
    days: { type: "string", default: "28" },
    since: { type: "string" },
    until: { type: "string" },
    from: { type: "string" },
    save: { type: "string" },
    candidate: { type: "string", multiple: true, default: [] },
    set: { type: "string", multiple: true, default: [] },
    json: { type: "string" },
    top: { type: "string", default: "12" },
    concurrency: { type: "string", default: "6" },
  },
});

/** A mistake in the arguments: say what, without a stack trace. */
function fail(message) {
  console.error(message);
  process.exit(1);
}

const run = promisify(execFile);
async function api(path) {
  // stderr dropped: api.sh's port-forward noise, never the key (it reads it from the Keychain).
  const { stdout } = await run("sh", [API, "GET", path], { maxBuffer: 64 << 20 });
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`Umami ${path.split("?")[0]}: not JSON (is the port-forward up?)`);
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

async function fetchSessions(startAt, endAt, concurrency) {
  const q = `startAt=${startAt}&endAt=${endAt}`;
  const listed = [];
  for (let page = 1; ; page++) {
    const r = await api(`/api/websites/${WEBSITE}/sessions?${q}&page=${page}&pageSize=200`);
    listed.push(...(r.data ?? []));
    if (!r.data?.length || listed.length >= r.count) break;
  }
  process.stderr.write(`${listed.length} Umami sessions; reading their activity…\n`);
  let done = 0;
  const sessions = await pool(listed, concurrency, async (s) => {
    const activity = await api(`/api/websites/${WEBSITE}/sessions/${s.id}/activity?${q}`);
    if (++done % 50 === 0) process.stderr.write(`  ${done}/${listed.length}\n`);
    if (!Array.isArray(activity) || !activity.some((a) => a.eventName === "area_intent")) return null;
    const data = {};
    for (const a of activity) if (a.hasData && NEEDS_DATA(a.eventName)) data[a.eventId] = eventProps(await api(`/api/websites/${WEBSITE}/event-data/${a.eventId}`));
    const props = await api(`/api/websites/${WEBSITE}/sessions/${s.id}/properties`);
    const holdout = Array.isArray(props) ? props.find((p) => p.dataKey === "holdout")?.stringValue : undefined;
    return toDumpSession({ ...s, holdout }, activity, data);
  });
  return sessions.filter(Boolean);
}

function candidates(base) {
  const list = [];
  for (const file of args.candidate) {
    const over = JSON.parse(readFileSync(file, "utf8"));
    list.push({ name: over.name ?? basename(file, ".json"), over });
  }
  if (args.set.length) {
    const over = {};
    for (const item of args.set) {
      const m = /^(\w+)\.(\w+)=(-?[\d.]+)$/.exec(item);
      if (!m) fail(`--set ${item}: expected group.weight=number`);
      (over[m[1]] ??= {})[m[2]] = Number(m[3]);
    }
    list.push({ name: args.set.join(" "), over });
  }
  for (const c of list) {
    const errors = checkCandidate(base, c.over);
    if (errors.length) fail(`${c.name}: ${errors.join("; ")}`);
  }
  return list;
}

const pct = (r) => (r.rate === null ? "–" : `${Math.round(r.rate * 100)}%`);
const cell = (r) => {
  if (!r.n) return "–";
  const ci = wilson(r);
  return `${pct(r)} (${r.hit}/${r.n}${r.n < SMALL ? ", few" : ""}) ±${Math.round(((ci[1] - ci[0]) / 2) * 100)}`;
};

const ROWS = [
  ["confident", "Confident: pick = first market", TARGETS.confident],
  ["leaning", "Leaning: pick among those shown", TARGETS.leaning],
  ["missed", "Nothing decided before a pick", null],
  ["restated", "Already picked: same market again", null],
  ["formCorrection", "Form area answer corrects a decision", TARGETS.formCorrection],
  ["audienceDecided", "Audience decided at form start", null],
  ["audience", "Audience right (when decided)", TARGETS.audience],
  ["askRate", "Ask rate, Indian job seekers (first page)", TARGETS.askRate],
  ["holdoutRegion", "Holdout only: pick among those shown", null],
];

const target = (t) => (!t ? "" : "min" in t ? `≥ ${t.min * 100}%` : `≤ ${t.max * 100}%`);

function table(header, rows) {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (r) => r.map((c, i) => String(c).padEnd(widths[i])).join("  ").trimEnd();
  return [line(header), line(widths.map((w) => "-".repeat(w))), ...rows.map(line)].join("\n");
}

const engine = await loadEngine();
const cands = candidates(engine.tables);

let dump;
if (args.from) {
  dump = JSON.parse(readFileSync(args.from, "utf8"));
  if (dump.v !== DUMP_VERSION) fail(`${args.from}: dump v${dump.v}, this script reads v${DUMP_VERSION}; fetch again`);
} else {
  const until = args.until ? Date.parse(args.until) : Date.now();
  const since = args.since ? Date.parse(args.since) : until - Number(args.days) * DAY;
  const sessions = await fetchSessions(since, until, Number(args.concurrency));
  dump = { v: DUMP_VERSION, since: new Date(since).toISOString(), until: new Date(until).toISOString(), fetchedAt: new Date().toISOString(), sessions };
  if (args.save) {
    writeFileSync(args.save, JSON.stringify(dump));
    process.stderr.write(`Saved ${sessions.length} sessions to ${args.save}\n`);
  }
}

// Only sessions the current model decided: earlier models' events mean something else.
const prepared = dump.sessions
  .filter((s) => s.events.some((e) => e.name === "area_intent" && Number(e.data?.v) === engine.version))
  .map((s) => prepareSession(s, engine));
const fid = fidelitySummary(prepared);
const base = score(prepared, engine, engine.tables);
const results = cands.map((c) => ({ ...c, result: score(prepared, engine, withWeights(engine.tables, c.over)) }));

if (args.json) {
  const strip = (r) => r.metrics;
  writeFileSync(
    args.json,
    JSON.stringify(
      {
        window: { since: dump.since, until: dump.until },
        version: engine.version,
        sessions: prepared.length,
        fidelity: { ...fid, misses: fid.misses.slice(0, 20) },
        baseline: strip(base),
        candidates: results.map((c) => ({ name: c.name, over: c.over, metrics: strip(c.result), changed: diffs(base, c.result).slice(0, 50) })),
      },
      null,
      2,
    ),
  );
}

const truths = prepared.reduce((n, s) => n + s.truths.length, 0);
console.log(`Context replay, model ${engine.version} · ${dump.since.slice(0, 10)} to ${dump.until.slice(0, 10)}`);
console.log(`${prepared.length} sessions with v${engine.version} decisions (${prepared.filter((s) => s.holdout).length} in the holdout), ${truths} picks and form starts to score against.\n`);
console.log(`Rebuild check: ${pct(fid)} of ${fid.n} logged decisions reproduced with the current weights.`);
if (fid.n && fid.rate < 0.9) console.log("  Below 90%: read the misses before trusting the scores below.");
for (const [what, n] of fid.misses.slice(0, 5)) console.log(`  ${n}× ${what}`);
console.log("");

const header = ["", "Target", "Current weights", ...results.map((c) => c.name)];
console.log(table(header, ROWS.map(([k, label, t]) => [label, target(t), cell(base.metrics[k]), ...results.map((c) => cell(c.result.metrics[k]))])));
console.log(`\n±: half the 95% interval, in points. "few": under ${SMALL} cases. The plan reviews weights after about 500 decided sessions per audience.`);

const top = Number(args.top);
for (const c of results) {
  const changed = diffs(base, c.result);
  const moved = changed.reduce((n, g) => n + g.n, 0);
  const gained = changed.reduce((n, g) => n + g.rightAfter - g.rightBefore, 0);
  console.log(`\n${c.name}: ${moved} of ${truths} decisions change, ${gained >= 0 ? "+" : ""}${gained} right.`);
  for (const g of changed.slice(0, top)) {
    const picked = Object.entries(g.truths).map(([m, n]) => `${m}×${n}`).join(" ");
    console.log(`  ${g.n}× [${g.kind}] ${g.scenario}\n      ${g.before} → ${g.after}; visitor chose ${picked}; right ${g.rightBefore} → ${g.rightAfter}`);
  }
  if (changed.length > top) console.log(`  … ${changed.length - top} more scenarios (--top, --json)`);
}
