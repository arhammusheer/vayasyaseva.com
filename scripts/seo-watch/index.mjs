#!/usr/bin/env node
// The weekly SEO watch (PLAN §9.5; docs/seo-watch.md): a Search Console
// report to the owner in Chatwoot every Monday, with the home retitle's
// rollback rule checked against the 13 weeks before it went live.
//
//   GOOGLE_ACCESS_TOKEN=... node scripts/seo-watch/index.mjs --dry-run     print the message
//   node scripts/seo-watch/index.mjs                                       in the cluster: send it
//
// In the cluster (vayasya-infra apps/seo-watch) Google access is keyless: the
// pod's projected service account token is exchanged through workload
// identity federation (GOOGLE_WIF_AUDIENCE) for an access token of
// GOOGLE_SERVICE_ACCOUNT. Chatwoot as for the compliance monitor
// (CHATWOOT_BASE_URL, CHATWOOT_INBOX_IDENTIFIER).
//
//   --notify <to>   chatwoot | hub, or chatwoot,hub (default chatwoot). hub
//                   posts to the notification hub (NOTIFY_URL,
//                   NOTIFY_INGEST_SECRET): the weekly report by email only, a
//                   tripped rule as a push too (scripts/seo-watch/hub.mjs). The
//                   hub goes first; its per-week dedupeKey keeps a rerun to one.
//
// Search data goes to Chatwoot and the hub's email body only, never to logs
// or a push: the repository and its CI are public.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { chatwootClient } from "../wage-monitor/report.mjs";
import { hubFromEnv, parseNotify } from "../lib/notify-hub.mjs";
import { seoEvents, seoFailedEvent } from "./hub.mjs";

const SITE = "sc-domain:vayasyaseva.com";
/** The home page was retitled to national terms on 16 October 2026 (PLAN §5.2, decision 7). */
const RETITLE = { page: "home", liveOn: "2026-10-16", baseline: { start: "2026-07-15", end: "2026-10-13" } };
/** Haridwar job and buyer queries: the place names, in Latin and Devanagari. */
const HARIDWAR = "haridwar|hardwar|sidcul|sidkul|roorkee|rurki|bhagwanpur|bahadrabad|ranipur|हरिद्वार|सिडकुल|रुड़की|भगवानपुर|बहादराबाद";
const BRAND = "vayasya|vayasa|vaysya|वयस्य";
/** Below this many Haridwar impressions a week before the retitle, a 30% fall is noise, not a signal. */
const MIN_BASELINE_PER_WEEK = 20;
/** PLAN §9.5 KPIs at month 3. */
const KPI_M3 = { nonBrandImpressionsPerMonth: 2000, organicClicksPerMonth: 60, sidculHaridwarPosition: 10 };

const { values } = parseArgs({
  options: { "dry-run": { type: "boolean", default: false }, state: { type: "string", default: ".seo-watch/state.json" }, today: { type: "string" }, notify: { type: "string", default: "chatwoot" } },
});
const NOTIFY = parseNotify(values.notify, ["chatwoot", "hub"]);
const day = (d) => d.toISOString().slice(0, 10);
const addDays = (iso, n) => day(new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5));

// ── Google access ────────────────────────────────────────────────────────────

async function googleToken(env = process.env) {
  if (env.GOOGLE_ACCESS_TOKEN) return env.GOOGLE_ACCESS_TOKEN;
  const subject = readFileSync(env.GOOGLE_WIF_TOKEN_FILE ?? "/var/run/secrets/google/token", "utf8").trim();
  const sts = await fetch("https://sts.googleapis.com/v1/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
      audience: env.GOOGLE_WIF_AUDIENCE,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      requestedTokenType: "urn:ietf:params:oauth:token-type:access_token",
      subjectTokenType: "urn:ietf:params:oauth:token-type:jwt",
      subjectToken: subject,
    }),
  });
  if (!sts.ok) throw new Error(`STS token exchange: HTTP ${sts.status} ${(await sts.text()).slice(0, 200)}`);
  const federated = (await sts.json()).access_token;
  const res = await fetch(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${env.GOOGLE_SERVICE_ACCOUNT}:generateAccessToken`, {
    method: "POST",
    headers: { authorization: `Bearer ${federated}`, "content-type": "application/json" },
    body: JSON.stringify({ scope: ["https://www.googleapis.com/auth/webmasters.readonly"], lifetime: "900s" }),
  });
  if (!res.ok) throw new Error(`generateAccessToken: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).accessToken;
}

let TOKEN;
async function gsc(start, end, dimensions = [], filters = []) {
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ startDate: start, endDate: end, dimensions, rowLimit: 25000, dataState: "final", ...(filters.length ? { dimensionFilterGroups: [{ filters }] } : {}) }),
  });
  if (!res.ok) throw new Error(`Search Console query: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).rows ?? [];
}
const total = (rows) => rows.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 });
const haridwarFilter = [{ dimension: "query", operator: "includingRegex", expression: HARIDWAR }];
const brandFilter = [{ dimension: "query", operator: "includingRegex", expression: BRAND }];
/**
 * Non-brand = all impressions minus branded queries. Filtering on "not
 * brand" would also drop every anonymised query, which is most of them.
 */
async function nonBrand(start, end) {
  const all = total(await gsc(start, end));
  const brand = total(await gsc(start, end, [], brandFilter));
  return { clicks: all.clicks - brand.clicks, impressions: all.impressions - brand.impressions };
}

/** Which part of the site a URL is, for the retitle rule. */
function pageGroup(url) {
  const path = url.replace(/^https:\/\/www\.vayasyaseva\.com/, "").replace(/^\/(en-in|hi-in|hi-latn-in|pa-in|kn-in)(?=\/|$)/, "") || "/";
  if (path === "/") return "home";
  if (path.startsWith("/jobs/haridwar")) return "jobsHaridwar";
  if (path.startsWith("/haridwar-sidcul") || path.startsWith("/locations/haridwar")) return "haridwarHub";
  return "other";
}

// ── Location pages ───────────────────────────────────────────────────────────

/** The location pages went live on 17 October 2026 (/locations, three hubs, nine areas). */
const LOCATIONS_LIVE = "2026-10-17";
const REGION_NAMES = { haridwar: "Haridwar", uttarakhand: "Uttarakhand", bengaluru: "Bengaluru", "delhi-ncr": "Delhi NCR", jalandhar: "Jalandhar–Kapurthala" };
const regionOf = (url) => url.match(/\/locations\/([a-z-]+)/)?.[1] ?? "index";

/** The location URLs in the live sitemap (the job downloads only scripts/, not the registry). */
async function locationUrls() {
  const res = await fetch("https://www.vayasyaseva.com/sitemap.xml");
  if (!res.ok) return [];
  return [...(await res.text()).matchAll(/<loc>([^<]*\/locations[^<]*)<\/loc>/g)].map((m) => m[1]);
}

/** Google's index verdict for one URL (URL Inspection API, read-only). */
async function indexed(url) {
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE }),
  });
  if (!res.ok) return { url, verdict: "UNKNOWN", state: `HTTP ${res.status}` };
  const r = (await res.json()).inspectionResult?.indexStatusResult ?? {};
  return { url, verdict: r.verdict ?? "UNKNOWN", state: r.coverageState ?? "" };
}

/** Last week's impressions and clicks per region, the top queries reaching them, and index coverage. */
async function locationReport(week) {
  const urls = await locationUrls();
  if (!urls.length) return null;
  const pageFilter = [{ dimension: "page", operator: "contains", expression: "/locations" }];
  const byPage = await gsc(week.start, week.end, ["page"], pageFilter);
  const queries = (await gsc(week.start, week.end, ["query"], pageFilter)).sort((a, b) => b.impressions - a.impressions).slice(0, 5);
  const status = [];
  for (const url of urls) status.push(await indexed(url));
  const regions = {};
  for (const url of urls) {
    const id = regionOf(url);
    regions[id] ??= { impressions: 0, clicks: 0, pages: 0, indexed: 0 };
    regions[id].pages += 1;
  }
  for (const r of byPage) {
    const id = regionOf(r.keys[0]);
    regions[id] ??= { impressions: 0, clicks: 0, pages: 0, indexed: 0 };
    regions[id].impressions += r.impressions;
    regions[id].clicks += r.clicks;
  }
  for (const st of status) if (st.verdict === "PASS") regions[regionOf(st.url)].indexed += 1;
  return { regions, queries, notIndexed: status.filter((st) => st.verdict !== "PASS") };
}

// ── The report ───────────────────────────────────────────────────────────────

/** The last four full weeks (Monday to Sunday) with final data (Search Console lags about 3 days). */
function lastWeeks(today, n = 4) {
  const lastData = addDays(today, -3);
  const d = new Date(`${lastData}T00:00:00Z`);
  const back = (d.getUTCDay() + 7) % 7; // days since Sunday
  const sunday = addDays(lastData, -back);
  return Array.from({ length: n }, (_, i) => ({ start: addDays(sunday, -6 - 7 * (n - 1 - i)), end: addDays(sunday, -7 * (n - 1 - i)) }));
}

async function buildReport(today) {
  const weeks = lastWeeks(today);
  const last = weeks.at(-1);
  const b = RETITLE.baseline;
  const baselineWeeks = (Date.parse(b.end) - Date.parse(b.start)) / 864e5 / 7 + 1 / 7;
  const perWeek = (t) => ({ clicks: t.clicks / baselineWeeks, impressions: t.impressions / baselineWeeks });

  const base = {
    site: perWeek(total(await gsc(b.start, b.end))),
    nonBrand: perWeek(await nonBrand(b.start, b.end)),
    haridwar: perWeek(total(await gsc(b.start, b.end, [], haridwarFilter))),
  };
  const weekly = [];
  for (const w of weeks) {
    const byPage = await gsc(w.start, w.end, ["page"], haridwarFilter);
    const groups = { home: 0, jobsHaridwar: 0, haridwarHub: 0, other: 0 };
    for (const r of byPage) groups[pageGroup(r.keys[0])] += r.impressions;
    weekly.push({ ...w, site: total(await gsc(w.start, w.end)), nonBrand: await nonBrand(w.start, w.end), haridwar: total(byPage), groups });
  }
  const m28 = { start: addDays(last.end, -27), end: last.end };
  const nonBrand28 = await nonBrand(m28.start, m28.end);
  const sidcul = (await gsc(m28.start, m28.end, ["query"], [{ dimension: "query", operator: "equals", expression: "sidcul haridwar" }]))[0];
  const topQueries = (await gsc(last.start, last.end, ["query"])).sort((x, y) => y.impressions - x.impressions).slice(0, 10);

  // The rollback rule (PLAN §9.5), judged only on enough data.
  const enough = base.haridwar.impressions >= MIN_BASELINE_PER_WEEK;
  const after = weekly.filter((w) => w.start >= RETITLE.liveOn);
  const allBelow = after.length === 4 && after.every((w) => w.haridwar.impressions < 0.7 * base.haridwar.impressions);
  const hubsPickedUp = after.length && after.at(-1).groups.jobsHaridwar + after.at(-1).groups.haridwarHub >= 0.7 * base.haridwar.impressions;
  const rule = !enough
    ? { status: "too-little-data", text: `Not judged: before the retitle Haridwar queries brought ${base.haridwar.impressions.toFixed(1)} impressions a week, below the ${MIN_BASELINE_PER_WEEK} a week where a 30% fall means anything. Reported weekly; the rule starts counting once there is enough data.` }
    : after.length < 4
      ? { status: "counting", text: `${after.length} of 4 full weeks since the retitle so far.` }
      : allBelow && !hubsPickedUp
        ? { status: "tripped", text: `Haridwar impressions have been more than 30% below the pre-retitle ${base.haridwar.impressions.toFixed(0)} a week for 4 weeks, and /jobs/haridwar and /locations/haridwar have not picked them up. PLAN §9.5: restore "Haridwar" in the home title.` }
        : { status: "ok", text: "Haridwar impressions are within 30% of before the retitle, or the Haridwar pages carry them." };

  const locations = await locationReport(last);
  return { today, weeks: weekly, base, m28, nonBrand28, sidcul, topQueries, rule, locations };
}

const n = (x) => Math.round(x).toLocaleString("en-IN");
const pct = (now, before) => (before ? `${now >= before ? "+" : ""}${Math.round(((now - before) / before) * 100)}%` : "n/a");

function renderLocations(loc, week) {
  if (!loc) return [];
  const order = ["index", "uttarakhand", "bengaluru", "delhi-ncr", ...Object.keys(loc.regions).filter((k) => !["index", "uttarakhand", "bengaluru", "delhi-ncr"].includes(k))];
  const rows = order
    .filter((k) => loc.regions[k])
    .map((k) => {
      const g = loc.regions[k];
      return `| ${k === "index" ? "/locations" : (REGION_NAMES[k] ?? k)} | ${n(g.impressions)} | ${g.clicks} | ${g.indexed} of ${g.pages} |`;
    });
  const total = Object.values(loc.regions).reduce((a, g) => ({ i: a.i + g.indexed, p: a.p + g.pages }), { i: 0, p: 0 });
  const early = week.end < addDays(LOCATIONS_LIVE, 28) ? ` Live since ${LOCATIONS_LIVE}; expect little before Google indexes them.` : "";
  const out = [
    `**Location pages, last week:** ${total.i} of ${total.p} indexed.${early}`,
    "",
    "| Region | Impressions | Clicks | Indexed |",
    "|---|---|---|---|",
    ...rows,
    "",
  ];
  if (loc.queries.length) out.push("Top queries reaching them:", "", ...loc.queries.map((q) => `- ${q.keys[0]}: ${q.impressions} impressions, ${q.clicks} clicks, position ${q.position.toFixed(1)}`), "");
  if (loc.notIndexed.length) {
    out.push(`Not indexed yet (request indexing in Search Console, about 10 a day):`, "", ...loc.notIndexed.map((st) => `- ${st.url.replace("https://www.vayasyaseva.com", "")}: ${st.state || st.verdict}`), "");
  }
  return out;
}

function renderReport(r) {
  const last = r.weeks.at(-1);
  const lines = [
    `**SEO weekly · vayasyaseva.com** (week ${last.start} to ${last.end})`,
    "",
    r.rule.status === "tripped" ? `**Home retitle rule: TRIPPED.** ${r.rule.text}` : `**Home retitle rule:** ${r.rule.text}`,
    "",
    "**Last 4 weeks vs the 13 weeks before the retitle (weekly average):**",
    "",
    "| Week | Impressions | Clicks | Non-brand impr. | Haridwar impr. (home / jobs hub / SIDCUL hub / other) |",
    "|---|---|---|---|---|",
    `| Before (avg) | ${n(r.base.site.impressions)} | ${r.base.site.clicks.toFixed(1)} | ${n(r.base.nonBrand.impressions)} | ${r.base.haridwar.impressions.toFixed(1)} |`,
    ...r.weeks.map((w) => `| ${w.start} | ${n(w.site.impressions)} (${pct(w.site.impressions, r.base.site.impressions)}) | ${w.site.clicks} | ${n(w.nonBrand.impressions)} | ${w.haridwar.impressions} (${w.groups.home} / ${w.groups.jobsHaridwar} / ${w.groups.haridwarHub} / ${w.groups.other}) |`),
    "",
    `**Month-3 targets (PLAN §9.5), last 28 days:** non-brand impressions ${n(r.nonBrand28.impressions)} of ${n(KPI_M3.nonBrandImpressionsPerMonth)}; non-brand clicks ${r.nonBrand28.clicks} of ${KPI_M3.organicClicksPerMonth}; "sidcul haridwar" ${r.sidcul ? `position ${r.sidcul.position.toFixed(1)} (${r.sidcul.impressions} impressions)` : "no impressions"}, target top ${KPI_M3.sidculHaridwarPosition}.`,
    "",
    ...renderLocations(r.locations, last),
    "**Top queries last week** (Search Console hides rare queries):",
    "",
    ...(r.topQueries.length ? r.topQueries.map((q) => `- ${q.keys[0]}: ${q.impressions} impressions, ${q.clicks} clicks, position ${q.position.toFixed(1)}`) : ["- none shown"]),
  ];
  return lines.join("\n");
}

// ── Run ──────────────────────────────────────────────────────────────────────

function readState(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  TOKEN = await googleToken();
  const today = values.today ?? day(new Date(Date.now() + 5.5 * 36e5));
  const report = await buildReport(today);
  const message = renderReport(report);
  if (values["dry-run"]) {
    console.log(message);
    return;
  }
  const env = process.env;
  if (NOTIFY.includes("hub")) await hubFromEnv(env).send(seoEvents({ weekEnd: report.weeks.at(-1).end, ruleStatus: report.rule.status, message }));
  if (!NOTIFY.includes("chatwoot")) {
    console.log(`seo watch: sent to the hub (${report.rule.status}) for the week ending ${report.weeks.at(-1).end}`);
    return;
  }
  const chatwoot = chatwootClient({ baseUrl: env.CHATWOOT_BASE_URL, inboxIdentifier: env.CHATWOOT_INBOX_IDENTIFIER });
  const state = readState(values.state);
  state.contact ??= (await chatwoot.createContact()).source_id;
  const key = report.rule.status === "tripped" ? "alert" : "weekly";
  state.conversations ??= {};
  for (let attempt = 0; attempt < 2; attempt++) {
    state.conversations[key] ??= (await chatwoot.createConversation(state.contact, { title: key === "alert" ? "SEO · home retitle rule tripped" : "SEO · weekly report" })).id;
    try {
      await chatwoot.message(state.contact, state.conversations[key], message);
      break;
    } catch (error) {
      if (attempt || !/HTTP 404/.test(String(error))) throw error;
      delete state.conversations[key];
    }
  }
  mkdirSync(dirname(values.state), { recursive: true });
  writeFileSync(`${values.state}.tmp`, JSON.stringify(state));
  renameSync(`${values.state}.tmp`, values.state);
  // Logs carry no search data (public CI, shared cluster logs): only the outcome.
  console.log(`seo watch: sent (${report.rule.status}) for the week ending ${report.weeks.at(-1).end}`);
}

main().catch(async (error) => {
  console.error(`seo watch failed: ${error?.message ?? error}`);
  if (NOTIFY.includes("hub") && !values["dry-run"] && process.env.NOTIFY_URL && process.env.NOTIFY_INGEST_SECRET) {
    try {
      await hubFromEnv().send([seoFailedEvent(error, day(new Date(Date.now() + 5.5 * 36e5)))]);
    } catch (notifyError) {
      console.error(`could not tell the notification hub: ${notifyError?.message ?? notifyError}`);
    }
  }
  process.exit(2);
});
