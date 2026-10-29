// The listing check (owner, 29 Oct 2026): a morning on which the monitor
// read every wage listing of a state and found nothing added since the hand
// check counts as a check of that state's sources, so a revision the state
// has not published does not make the page stale 14 days after the last
// hand check (src/content/wages/index.ts, wageStatus). Only a fetch that
// actually read the department's listing counts: a listing that failed to
// load, a link first seen after the hand check, or a cited document that no
// longer matches the dataset blocks the check until someone looks and
// records a new `checked.on`. The record goes to cdn.vayasyaseva.com, where
// the pages read it when they regenerate.
import { targetKey } from "./monitor.mjs";
import { CDN } from "./archive.mjs";

/** Where the record is published, in the cdn-vspl bucket. */
export const CHECKS_KEY = "monitor/wage-listing-checks.json";
export const CHECKS_URL = `${CDN}/${CHECKS_KEY}`;
export const CHECKS_VERSION = 1;

/**
 * Why a state's listings do not count as checked today, or [] when they do.
 * `snapshot` is the run's next snapshot (runMonitor's `state`): every
 * listing entry carries `lastOk` and, per link, `firstSeen`.
 */
export function checkProblems(state, targets, snapshot, today) {
  const mine = targets.filter((t) => t.state === state.state && t.topic === "wages");
  const listings = mine.filter((t) => t.kind === "listing");
  if (!listings.length) return ["no wage listing is watched"];
  const problems = [];
  for (const t of listings) {
    const entry = snapshot.sources[targetKey(t)];
    if (entry?.lastOk !== today || !entry.links) {
      problems.push(`${t.name}: not read today`);
      continue;
    }
    const added = entry.links.filter((l) => (entry.firstSeen?.[l.url] ?? today) > state.checked.on);
    if (added.length) problems.push(`${t.name}: ${added.length} document${added.length === 1 ? "" : "s"} first seen after the hand check of ${state.checked.on}`);
  }
  // A cited file replaced at the same URL is a change too, until the dataset records its new hash.
  for (const t of mine.filter((x) => x.kind === "document" && x.expectedSha256)) {
    const seen = snapshot.sources[targetKey(t)]?.sha256;
    if (seen && seen !== t.expectedSha256) problems.push(`${t.name}: the file differs from the one the dataset cites`);
  }
  return problems;
}

/**
 * The next record for the states checked this run: a clean state gets
 * today; a blocked one keeps its last clean day (true when it was read)
 * as long as the dataset's hand check is the one it was compared against,
 * and says why it is blocked. States not checked this run (--only) keep
 * their entries.
 */
export function listingChecks({ wageStates, targets, snapshot, today, previous = {} }) {
  const next = { ...previous };
  for (const state of wageStates) {
    if (!targets.some((t) => t.state === state.state)) continue;
    const problems = checkProblems(state, targets, snapshot, today);
    const before = previous[state.state]?.datasetCheckedOn === state.checked.on ? previous[state.state] : null;
    next[state.state] = problems.length
      ? { ...(before?.on && { on: before.on }), datasetCheckedOn: state.checked.on, blocked: { since: before?.blocked?.since ?? today, problems } }
      : { on: today, datasetCheckedOn: state.checked.on };
  }
  return next;
}

/** The published file: the clean days only, plus why a state is blocked, for anyone reading it. */
export function checksDocument(checks, now = new Date()) {
  return {
    version: CHECKS_VERSION,
    updatedAt: now.toISOString(),
    about: "Per state: the last day the vayasyaseva.com compliance monitor read every minimum wage listing of the state and found no document added since the hand check recorded on that date (datasetCheckedOn).",
    states: checks,
  };
}

/** One line for the run summary. */
export function checksNote(checks, today, published) {
  const clean = Object.entries(checks).filter(([, c]) => c.on === today && !c.blocked).map(([s]) => s);
  const blocked = Object.entries(checks).filter(([, c]) => c.blocked);
  const parts = [`${clean.length} state${clean.length === 1 ? "" : "s"} checked clean`];
  for (const [slug, c] of blocked) parts.push(`${slug} not counted (${c.blocked.problems[0]}${c.blocked.problems.length > 1 ? `, and ${c.blocked.problems.length - 1} more` : ""})`);
  return `Listing checks: ${parts.join("; ")}. ${published}`;
}
