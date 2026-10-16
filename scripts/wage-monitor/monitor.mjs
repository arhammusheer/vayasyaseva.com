// The wage monitor's core (PLAN §11, owner decision 4): what to watch,
// how to compare today's fetch with the stored snapshot, and which events
// deserve an alert. runMonitor takes its fetcher as an argument, so the
// tests run it against fixtures; fetchSource is the real one. No GitHub here.
import { clipText, describeDocument, diffLines, documentLinks, htmlText, sha256, withFigures } from "./extract.mjs";

export const STATE_VERSION = 1;
/** A source that fails on this many consecutive days is an alert. */
export const FAIL_DAYS = 3;
/** New documents fetched per run to describe them in the alert. */
export const MAX_NEW_DOCS = 6;

const USER_AGENT = "vayasyaseva.com wage source monitor (+https://vayasyaseva.com/minimum-wages)";
/** Per request, body included. A host that hangs costs this once per run (see fetchAll). */
export const TIMEOUT_MS = 45_000;

/** GET with one retry on a network error or 5xx/429; never throws. */
export async function fetchSource(url, { attempts = 2, retryDelayMs = 5_000, fetchImpl = fetch } = {}) {
  let last = { ok: false, status: 0, error: "not tried" };
  for (let i = 0; i < attempts; i++) {
    if (i) await new Promise((r) => setTimeout(r, retryDelayMs));
    try {
      const res = await fetchImpl(url, { redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": USER_AGENT, accept: "*/*" } });
      const body = Buffer.from(await res.arrayBuffer());
      last = { ok: res.ok, status: res.status, contentType: res.headers?.get?.("content-type") ?? "", body };
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) return last;
    } catch (error) {
      last = { ok: false, status: 0, error: String(error?.cause?.code ?? error?.name ?? error?.message ?? error) };
    }
  }
  return last;
}

/** The calendar date in India, so "a day" matches the owner's day. */
export const istDate = (now = new Date()) => new Date(now.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);

const hostOf = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

/**
 * A per-host circuit breaker around the fetcher: once a host fails without
 * any HTTP response (timeout, refused, DNS), its remaining URLs in this run
 * fail at once instead of each waiting out the timeout. Different hosts are
 * fetched concurrently by fetchAll; one host's URLs go one after another.
 */
export function hostBreaker(fetcher) {
  const down = new Map();
  return async (url) => {
    const host = hostOf(url);
    if (down.has(host)) return { ok: false, status: 0, error: `skipped: ${host} did not respond earlier in this run (${down.get(host)})` };
    const res = await fetcher(url);
    if (!res.ok && !res.status) down.set(host, res.error || "no response");
    return res;
  };
}

/** Fetches each URL once: hosts in parallel, each host's URLs in order. */
export async function fetchAll(urls, fetcher) {
  const byHost = new Map();
  for (const url of urls) byHost.set(hostOf(url), [...(byHost.get(hostOf(url)) ?? []), url]);
  const out = new Map();
  await Promise.all(
    [...byHost.values()].map(async (list) => {
      for (const url of list) out.set(url, await fetcher(url));
    }),
  );
  return out;
}

const PDF_URL = /\.pdf(?:$|[?#])/i;

/**
 * A 200 response that is not the source: a firewall, captcha or maintenance
 * page. It counts as a failed fetch (towards the 3-day alert), not a change,
 * so a bad day does not report every document as removed and then as new.
 */
function implausible(target, res, prev, links, allCount) {
  if (target.kind === "document") {
    const wasPdf = prev?.sha256 ? (prev.pdf ?? prev.pages != null) : PDF_URL.test(target.url);
    const isPdf = res.body.subarray(0, 1024).includes("%PDF-");
    if (wasPdf && !isPdf) return /text\/html/i.test(res.contentType ?? "") ? "an HTML page instead of the PDF" : "not a PDF any more";
    return null;
  }
  const before = prev?.allCount ?? (prev?.links && !target.match ? prev.links.length : null);
  if (allCount === 0) return "listing looks empty (no document links)";
  if (before != null && before >= 4 && allCount < before / 2) return `listing lost most of its links (${allCount} of ${before})`;
  return null;
}

/**
 * Everything to fetch, per state: each document the wage page cites (once
 * per URL, with every source id that points at it and the SHA-256 recorded
 * in the dataset) and each listing page, from the dataset and the registry.
 */
export function buildTargets(wageStates, registry) {
  const targets = [];
  for (const state of wageStates) {
    const extra = registry.states?.[state.state] ?? {};
    const docs = new Map();
    for (const source of state.sources) {
      const doc = docs.get(source.url) ?? { state: state.state, stateName: state.name, kind: "document", url: source.url, name: source.title, sourceIds: [], expectedSha256: source.sha256, listings: [] };
      doc.sourceIds.push(source.id);
      if (!doc.listings.includes(source.listing)) doc.listings.push(source.listing);
      docs.set(source.url, doc);
    }
    for (const d of extra.documents ?? []) {
      if (!docs.has(d.url)) docs.set(d.url, { state: state.state, stateName: state.name, kind: "document", url: d.url, name: d.name, sourceIds: [], listings: [] });
    }
    targets.push(...docs.values());
    const listings = new Map();
    for (const l of extra.listings ?? []) listings.set(l.url, { state: state.state, stateName: state.name, kind: "listing", url: l.url, name: l.name, match: l.match });
    for (const source of state.sources) {
      if (!listings.has(source.listing)) listings.set(source.listing, { state: state.state, stateName: state.name, kind: "listing", url: source.listing, name: `Listing for ${source.title}` });
    }
    targets.push(...listings.values());
  }
  return targets;
}

/** Problems with the registry itself, for the unit tests and a pre-flight check. */
export function registryProblems(wageStates, registry) {
  const problems = [];
  const slugs = new Set(wageStates.map((s) => s.state));
  for (const slug of Object.keys(registry.states ?? {})) if (!slugs.has(slug)) problems.push(`${slug}: in the registry but has no wage dataset`);
  for (const state of wageStates) {
    // One file cited by two source ids must carry one hash; the monitor reads the first.
    const hashes = new Map();
    for (const source of state.sources) {
      const seen = hashes.get(source.url);
      if (seen && seen.sha256 !== source.sha256) problems.push(`${state.state}: ${source.id} and ${seen.id} cite ${source.url} with different sha256 values`);
      else if (!seen) hashes.set(source.url, source);
    }
    const entry = registry.states?.[state.state];
    if (!entry?.listings?.length) {
      problems.push(`${state.state}: no listing pages in the registry`);
      continue;
    }
    const urls = new Set(entry.listings.map((l) => l.url));
    for (const source of state.sources) if (!urls.has(source.listing)) problems.push(`${state.state}: listing ${source.listing} (cited by ${source.id}) is missing from the registry`);
    for (const l of entry.listings) {
      if (!/^https:\/\//.test(l.url)) problems.push(`${state.state}: ${l.url} is not https`);
      if (!l.name) problems.push(`${state.state}: ${l.url} has no name`);
      if (l.match) {
        try {
          new RegExp(l.match, "i");
        } catch {
          problems.push(`${state.state}: ${l.url} has an invalid match pattern`);
        }
      }
    }
  }
  return problems;
}

/**
 * Fetches every target, compares it with the previous snapshot and returns
 * the next snapshot, the events to alert on and a per-target result line.
 *
 * Events: document-changed, listing-changed, unreachable (failing on 3 IST
 * days with no successful load in between),
 * recovered (loads again after an unreachable alert). A first sighting with
 * nothing to compare against records a baseline and is not an event, except
 * that a cited document is compared with the hash in the dataset.
 */
export async function runMonitor({ targets, previous, fetcher, now = new Date(), describeNew = true }) {
  const today = istDate(now);
  const prevSources = previous?.version === STATE_VERSION ? (previous.sources ?? {}) : {};
  const sources = {};
  const events = [];
  const results = [];
  const citedUrls = new Map(targets.filter((t) => t.kind === "document").map((t) => [t.url, t]));
  const newDocs = [];
  const guarded = hostBreaker(fetcher);
  const fetched = await fetchAll(
    targets.map((t) => t.url),
    guarded,
  );

  for (const target of targets) {
    const prev = prevSources[target.url];
    const res = fetched.get(target.url);
    let html = null;
    let links = null;
    let allCount = null;
    let bogus = null;
    if (res.ok) {
      if (target.kind === "listing") {
        html = res.body.toString("utf8");
        const all = documentLinks(html, target.url);
        allCount = all.length;
        links = target.match ? documentLinks(html, target.url, new RegExp(target.match, "i")) : all;
      }
      bogus = implausible(target, res, prev, links, allCount);
    }
    if (!res.ok || bogus) {
      const error = bogus ?? (res.status ? `HTTP ${res.status}` : res.error || "no response");
      // Counts distinct IST days without a successful load; only a load resets it.
      const failing = { since: today, days: 0, lastDay: null, alerted: false, ...prev?.failing, lastError: error };
      if (failing.lastDay !== today) {
        failing.days += 1;
        failing.lastDay = today;
      }
      sources[target.url] = { ...prev, kind: target.kind, state: target.state, failing };
      if (failing.days >= FAIL_DAYS && !failing.alerted) {
        failing.alerted = true;
        events.push({ type: "unreachable", state: target.state, stateName: target.stateName, url: target.url, name: target.name, kind: target.kind, since: failing.since, days: failing.days, error });
      }
      results.push({ target, outcome: "failed", detail: `${error} (day ${failing.days} of ${FAIL_DAYS})` });
      continue;
    }

    if (prev?.failing?.alerted) {
      events.push({ type: "recovered", state: target.state, stateName: target.stateName, url: target.url, name: target.name, kind: target.kind, since: prev.failing.since });
    }
    const base = { kind: target.kind, state: target.state, lastOk: today };

    if (target.kind === "document") {
      const doc = describeDocument(res.body);
      const baseline = prev?.sha256 ?? target.expectedSha256;
      const next = { ...base, sha256: doc.sha256, pdf: doc.isPdf, bytes: doc.bytes, pages: doc.pages, textSha256: doc.textSha256, text: clipText(doc.text) };
      sources[target.url] = next;
      if (baseline && doc.sha256 !== baseline) {
        events.push({
          type: "document-changed",
          state: target.state,
          stateName: target.stateName,
          url: target.url,
          name: target.name,
          sourceIds: target.sourceIds,
          before: prev?.sha256 ? { sha256: prev.sha256, bytes: prev.bytes, pages: prev.pages } : { sha256: baseline },
          after: { sha256: doc.sha256, bytes: doc.bytes, pages: doc.pages },
          diff: prev?.sha256 && (prev.text || doc.text) ? diffLines(prev.text ?? "", clipText(doc.text)) : null,
          hasText: Boolean(doc.text),
        });
      }
      const matchesDataset = !target.expectedSha256 || doc.sha256 === target.expectedSha256;
      results.push({ target, outcome: !baseline ? "baseline" : doc.sha256 !== baseline ? "changed" : matchesDataset ? "unchanged" : "differs-from-dataset", detail: `${Math.round(doc.bytes / 1024)} KB${doc.pages ? `, ${doc.pages} pages` : ""}${doc.text ? "" : ", no text layer"}` });
      continue;
    }

    sources[target.url] = { ...base, links, allCount, textSha256: sha256(htmlText(html)) };
    const cited = target.state ? [...citedUrls.values()].filter((d) => d.state === target.state && d.listings.includes(target.url)) : [];
    const missingCited = cited.filter((d) => !links.some((l) => l.url === d.url));
    if (!prev?.links) {
      results.push({ target, outcome: "baseline", detail: `${links.length} documents linked${missingCited.length ? `; ${missingCited.length} cited not linked` : ""}` });
      continue;
    }
    const before = new Map(prev.links.map((l) => [l.url, l]));
    const after = new Map(links.map((l) => [l.url, l]));
    const added = links.filter((l) => !before.has(l.url));
    const removed = prev.links.filter((l) => !after.has(l.url)).map((l) => ({ ...l, citedAs: citedUrls.get(l.url)?.sourceIds ?? [] }));
    if (added.length || removed.length) {
      const event = { type: "listing-changed", state: target.state, stateName: target.stateName, url: target.url, name: target.name, added: added.map((l) => ({ ...l })), removed };
      events.push(event);
      newDocs.push(...event.added);
    }
    results.push({
      target,
      outcome: added.length || removed.length ? "changed" : "unchanged",
      detail: `${links.length} documents linked${added.length ? `, ${added.length} new` : ""}${removed.length ? `, ${removed.length} gone` : ""}${missingCited.length ? `; ${missingCited.length} cited not linked` : ""}`,
    });
  }

  // Describe a few of the new documents so the alert says what they are.
  // A file new on two listings (an order on the wage page and the home page)
  // is fetched once and its description shared.
  if (describeNew) {
    const unique = [...new Set(newDocs.map((l) => l.url))].slice(0, MAX_NEW_DOCS);
    const described = await fetchAll(unique, guarded);
    for (const link of newDocs) {
      const res = described.get(link.url);
      if (!res) continue;
      if (!res.ok) {
        link.fetchError = res.status ? `HTTP ${res.status}` : res.error || "no response";
        continue;
      }
      const doc = describeDocument(res.body);
      Object.assign(link, { bytes: doc.bytes, pages: doc.pages, sha256: doc.sha256, figures: withFigures(doc.text.split("\n")).slice(0, 12) });
    }
  }

  return { state: { version: STATE_VERSION, updatedAt: now.toISOString(), sources }, events, results };
}

/**
 * A stable fingerprint for an event, so the same change is never reported
 * twice on an issue (for example after the stored snapshot was lost).
 */
export function fingerprint(event) {
  const key =
    event.type === "document-changed"
      ? [event.type, event.url, event.after.sha256]
      : event.type === "listing-changed"
        ? [event.type, event.url, ...event.added.map((l) => `+${l.url}`).sort(), ...event.removed.map((l) => `-${l.url}`).sort()]
        : [event.type, event.url, event.since];
  return sha256(key.join("\n")).slice(0, 16);
}
