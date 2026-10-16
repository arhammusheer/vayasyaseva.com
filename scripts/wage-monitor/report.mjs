// Turns monitor events into GitHub issues (one open issue per state,
// label `wage-monitor`) and a run summary. The GitHub client is passed in;
// with none (dry run) the planned issues are returned and nothing is sent.
import { fingerprint } from "./monitor.mjs";

export const LABEL = "wage-monitor";
export const issueTitle = (stateName) => `Wage monitor: ${stateName} sources changed`;

const MARKER = /<!-- wage-monitor:([0-9a-f]{16}) -->/g;
const marker = (fp) => `<!-- wage-monitor:${fp} -->`;

/** Text from a government page, made safe for Markdown: no markup, links, mentions or HTML. */
export function safe(text) {
  return String(text ?? "")
    .replace(/[\\`*_{}[\]()<>#|!~]/g, (c) => `\\${c}`)
    .replace(/@/g, "@​")
    .replace(/\s+/g, " ")
    .trim();
}
const href = (url) => {
  let clean = url;
  try {
    clean = encodeURI(decodeURI(url));
  } catch {
    // keep as given
  }
  return clean.replace(/\(/g, "%28").replace(/\)/g, "%29");
};
const link = (label, url) => `[${safe(label) || "document"}](${href(url)})`;
const kb = (bytes) => (bytes == null ? "?" : bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);
const shortSha = (sha) => (sha ? `\`${sha.slice(0, 12)}\`` : "?");
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const fence = (lines) => ["~~~text", ...lines.map((l) => l.replace(/~~~/g, "~ ~ ~").slice(0, 200)), "~~~"].join("\n");
const longDate = (iso) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/**
 * Markdown for one event. `shown` (url → listing name) is shared across one
 * issue or comment, so a file new on several listings is described once and
 * later only named.
 */
export function renderEvent(event, shown = new Map()) {
  const lines = [];
  if (event.type === "document-changed") {
    const ids = event.sourceIds?.length ? ` (cited as ${event.sourceIds.map((id) => `\`${id}\``).join(", ")})` : "";
    lines.push(`### A cited document changed`, ``, `${link(event.name, event.url)}${ids} is not the file the wage page was checked against.`, ``);
    const { before, after } = event;
    lines.push(`- File: ${shortSha(before.sha256)} → ${shortSha(after.sha256)}`);
    if (before.bytes != null) lines.push(`- Size: ${kb(before.bytes)} → ${kb(after.bytes)}`);
    else lines.push(`- Size now: ${kb(after.bytes)}`);
    if (after.pages != null) lines.push(`- Pages: ${before.pages ?? "?"} → ${after.pages}`);
    if (event.diff) {
      const added = event.diff.added.slice(0, 15);
      const removed = event.diff.removed.slice(0, 15);
      if (added.length) lines.push(``, `Text added (${plural(event.diff.added.length, "line")}${event.diff.added.length > 15 ? ", first 15" : ""}):`, ``, fence(added));
      if (removed.length) lines.push(``, `Text removed (${plural(event.diff.removed.length, "line")}${event.diff.removed.length > 15 ? ", first 15" : ""}):`, ``, fence(removed));
      if (!added.length && !removed.length) lines.push(``, `The text layer reads the same; the file itself changed (re-saved, re-signed or re-scanned). Open it to check.`);
    } else if (!event.hasText) {
      lines.push(``, `The file has no text layer (a scan), so there is no text to compare. Open it and read the figures.`);
    } else {
      lines.push(``, `No earlier text was stored for this file, so only the hashes are compared. Open it and read the figures.`);
    }
  } else if (event.type === "listing-changed") {
    lines.push(`### ${link(event.name, event.url)} changed`, ``);
    if (event.added.length) {
      lines.push(`New documents on the page:`, ``);
      const repeats = event.added.filter((l) => shown.has(l.url));
      const first = event.added.filter((l) => !shown.has(l.url));
      for (const l of repeats) lines.push(`- ${link(l.label || l.url.split("/").pop(), l.url)} (also new on ${safe(shown.get(l.url))}, described above)`);
      for (const l of first) shown.set(l.url, event.name);
      for (const l of first) {
        const meta = l.fetchError ? ` (could not load: ${safe(l.fetchError)})` : l.bytes != null ? ` (${kb(l.bytes)}${l.pages ? `, ${l.pages} pages` : ""})` : "";
        lines.push(`- ${link(l.label || l.url.split("/").pop(), l.url)}${meta}`);
      }
      const figures = first.filter((l) => l.figures?.length);
      for (const l of figures) lines.push(``, `Lines with figures in the text layer of ${safe(l.label || l.url.split("/").pop())} (a scan's text layer can read badly; the file is the source):`, ``, fence(l.figures));
      lines.push(``);
    }
    if (event.removed.length) {
      lines.push(`No longer on the page:`, ``);
      for (const l of event.removed) {
        const cited = l.citedAs?.length ? ` **cited by the wage page as ${l.citedAs.map((id) => `\`${id}\``).join(", ")}**` : "";
        lines.push(`- ${link(l.label || l.url.split("/").pop(), l.url)}${cited}`);
      }
    }
  } else if (event.type === "unreachable") {
    lines.push(`### A source has not loaded for ${event.days} days`, ``, `${link(event.name, event.url)} has failed every day since ${longDate(event.since)} (last: ${safe(event.error)}). The page may have moved; find where the department publishes it now and update the source in the dataset or \`scripts/wage-monitor/sources.json\`.`);
  } else if (event.type === "recovered") {
    lines.push(`### A source loads again`, ``, `${link(event.name, event.url)} loads again after failing since ${longDate(event.since)}.`);
  }
  return lines.join("\n");
}

const intro = (stateName, slug, date) =>
  [
    `The daily wage monitor found a change in ${stateName}'s primary sources on ${longDate(date)}.`,
    ``,
    `What to do: open the documents below. If the rates, dates or zones changed, update \`src/content/wages/${slug}.json\` (figures, \`sources[].sha256\`, \`sizeKb\`, \`retrievedOn\` and \`checked.on\`), run \`pnpm content:check\` and link the pull request here. Claude can draft that pull request from the new document. Close this issue when the wage page matches the state's sources again.`,
  ].join("\n");

const runLink = (env) => (env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID ? `\n\n[Monitor run](${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID})` : "");

/**
 * Plans and (unless github is null) sends the alerts: per state, a new issue
 * or a comment on the open one, skipping events already reported there.
 * A recovery alone never opens an issue.
 */
export async function reportEvents(events, { github, today, env = process.env }) {
  const byState = new Map();
  for (const e of events) byState.set(e.state, [...(byState.get(e.state) ?? []), e]);
  const actions = [];
  if (github && byState.size) await github.ensureLabel();
  for (const [slug, stateEvents] of byState) {
    const stateName = stateEvents[0].stateName;
    const title = issueTitle(stateName);
    const issue = github ? await github.findOpenIssue(title) : null;
    const reported = new Set();
    if (issue) {
      for (const text of [issue.body ?? "", ...(await github.listCommentBodies(issue.number))]) for (const m of text.matchAll(MARKER)) reported.add(m[1]);
    }
    const fresh = stateEvents.filter((e) => !reported.has(fingerprint(e)));
    if (!fresh.length) {
      actions.push({ state: slug, stateName, action: "skip", title, reason: "already reported", issue: issue?.number });
      continue;
    }
    if (!issue && fresh.every((e) => e.type === "recovered")) {
      actions.push({ state: slug, stateName, action: "skip", title, reason: "recovery with no open issue" });
      continue;
    }
    const shown = new Map();
    const sections = fresh.map((e) => `${renderEvent(e, shown)}\n${marker(fingerprint(e))}`).join("\n\n");
    if (issue) {
      const body = `New on ${longDate(today)}:\n\n${sections}${runLink(env)}`;
      await github.comment(issue.number, body);
      actions.push({ state: slug, stateName, action: "comment", title, issue: issue.number, body });
    } else {
      const body = `${intro(stateName, slug, today)}\n\n${sections}${runLink(env)}`;
      const created = github ? await github.createIssue(title, body) : null;
      actions.push({ state: slug, stateName, action: github ? "create" : "create (dry run)", title, issue: created?.number, body });
    }
  }
  return actions;
}

/** A Markdown run summary for the Actions step summary and the terminal. */
export function renderSummary({ results, events, actions, today, dryRun, notes = [] }) {
  const out = [`## Wage monitor, ${longDate(today)}${dryRun ? " (dry run)" : ""}`, ""];
  out.push(`| State | Source | Result | Detail |`, `|---|---|---|---|`);
  for (const r of results) out.push(`| ${r.target.stateName} | ${link(r.target.name, r.target.url)} | ${r.outcome} | ${safe(r.detail)} |`);
  out.push("", events.length ? `${events.length} event${events.length === 1 ? "" : "s"}: ${events.map((e) => `${e.type} (${e.stateName})`).join(", ")}.` : "No changes to report.");
  for (const a of actions) out.push(`- ${a.stateName ?? a.state}: ${a.action}${a.issue ? ` #${a.issue}` : ""}${a.reason ? ` (${a.reason})` : ""}`);
  for (const n of notes) out.push(`- ${n}`);
  return out.join("\n");
}

/** A minimal GitHub REST client for issues, using the workflow's GITHUB_TOKEN. */
export function githubClient({ token, repo, fetchImpl = fetch, api = "https://api.github.com" }) {
  const call = async (method, path, body) => {
    const res = await fetchImpl(`${api}/repos/${repo}${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "vayasyaseva-wage-monitor", ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 404 && method === "GET") return null;
    if (!res.ok) throw new Error(`GitHub ${method} ${path}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    return res.status === 204 ? null : res.json();
  };
  return {
    async ensureLabel() {
      if (await call("GET", `/labels/${LABEL}`)) return;
      await call("POST", "/labels", { name: LABEL, color: "8f6818", description: "A minimum wage source changed or stopped loading" });
    },
    async findOpenIssue(title) {
      const issues = (await call("GET", `/issues?labels=${LABEL}&state=open&per_page=100`)) ?? [];
      return issues.find((i) => !i.pull_request && i.title === title) ?? null;
    },
    async listCommentBodies(number) {
      const bodies = [];
      for (let page = 1; page <= 10; page++) {
        const batch = (await call("GET", `/issues/${number}/comments?per_page=100&page=${page}`)) ?? [];
        bodies.push(...batch.map((c) => c.body ?? ""));
        if (batch.length < 100) break;
      }
      return bodies;
    },
    createIssue: (title, body) => call("POST", "/issues", { title, body, labels: [LABEL] }),
    comment: (number, body) => call("POST", `/issues/${number}/comments`, { body }),
  };
}
