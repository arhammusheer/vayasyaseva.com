// The compliance source monitor's core (PLAN §11, owner decision 4): what to watch,
// how to compare today's fetch with the stored snapshot, and which events
// deserve an alert. runMonitor takes its fetcher as an argument, so the
// tests run it against fixtures; fetchSource is the real one. No GitHub here.
import https from "node:https";
import { constants as cryptoConstants } from "node:crypto";
import { clipText, describeDocument, diffLines, documentLinks, htmlText, sha256, spaBundleLinks, spaScript, withFigures, wpDocumentLinks } from "./extract.mjs";

export const STATE_VERSION = 1;
/** A source that fails on this many consecutive days is an alert. */
export const FAIL_DAYS = 3;
/** New documents fetched per run to describe them in the alert. */
export const MAX_NEW_DOCS = 6;

/**
 * What each source is about. Wages are per state; EPF, ESIC and the labour
 * codes are national; PT, LWF and the contract labour licence are per state.
 */
export const TOPICS = {
  wages: "Minimum wages",
  epf: "EPF",
  esic: "ESIC",
  pt: "Professional Tax",
  lwf: "Labour Welfare Fund",
  licence: "Contract labour licence",
  codes: "Labour codes",
  locations: "Location page sources",
};
/** Topics every published state must have at least one source for, and the national ones. */
export const STATE_TOPICS = ["wages", "pt", "lwf", "licence"];
export const NATIONAL_TOPICS = ["epf", "esic", "codes"];
export const NATIONAL = { state: "national", stateName: "All states" };

/**
 * The snapshot key for a target. Wage sources keep their plain URL (the
 * snapshot format before topics); other topics prefix it, so one page
 * watched for two topics with two patterns has two entries.
 */
export const targetKey = (t) => {
  // A shared lead page (one compliance firm's post list, watched for each state's lines) is one target per state.
  const url = t.allowEmpty ? `${t.state}:${t.url}` : t.url;
  return !t.topic || t.topic === "wages" ? url : `${t.topic}:${url}`;
};

/**
 * The lines of a page's text that match its pattern and not its ignore pattern, de-duplicated and
 * sorted (pages that reorder their text are stable). `ignore` drops lines that match but are not
 * news, such as a lead page's state menu and category tags.
 */
export const pageLines = (html, match, ignore = null) =>
  [...new Set(htmlText(html).split("\n").map((l) => l.trim()).filter((l) => l && match.test(l) && !ignore?.test(l)))].sort();

const USER_AGENT = "vayasyaseva.com wage source monitor (+https://vayasyaseva.com/minimum-wages)";
/** Per request, body included. A host that hangs costs this once per run (see fetchAll). */
export const TIMEOUT_MS = 45_000;

/** GET with one retry on a network error or 5xx/429; never throws. */
export async function fetchSource(url, { attempts = 2, retryDelayMs = 5_000, fetchImpl = fetch, userAgent = USER_AGENT } = {}) {
  let last = { ok: false, status: 0, error: "not tried" };
  for (let i = 0; i < attempts; i++) {
    if (i) await new Promise((r) => setTimeout(r, retryDelayMs));
    try {
      const res = await fetchImpl(url, { redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": userAgent, accept: "*/*" } });
      const body = Buffer.from(await res.arrayBuffer());
      last = { ok: res.ok, status: res.status, contentType: res.headers?.get?.("content-type") ?? "", body };
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) return last;
    } catch (error) {
      last = { ok: false, status: 0, error: String(error?.cause?.code ?? error?.name ?? error?.message ?? error) };
    }
  }
  return last;
}

/**
 * A fetch for hosts whose TLS needs legacy renegotiation (siidcul.com,
 * punjabassembly.gov.in): browsers and curl allow it, Node's fetch refuses
 * with ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED. Only the hosts listed in
 * sources.json `legacyTlsHosts` use it. Follows up to five redirects; the
 * response has the fields fetchSource reads.
 */
export function legacyTlsFetch(url, { headers = {}, signal } = {}, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, signal, secureOptions: cryptoConstants.SSL_OP_LEGACY_SERVER_CONNECT }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        resolve(legacyTlsFetch(new URL(res.headers.location, url).href, { headers, signal }, redirects - 1));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks);
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, headers: { get: (k) => res.headers[k.toLowerCase()] ?? null }, arrayBuffer: async () => body });
      });
      res.on("error", reject);
    });
    req.on("error", (error) => reject(Object.assign(new Error(error.message), { cause: { code: error.code } })));
  });
}

/**
 * A fetch through the monitor's relay (relay/worker.mjs, a Cloudflare
 * Worker) for hosts that drop the cluster's connections (sources.json
 * `relayHosts`; Punjab's data centre since October 2026). Same interface as
 * fetch; the relay follows redirects itself.
 */
export const relayFetch = ({ url: relayUrl, secret, fetchImpl = fetch }) => (url, { headers = {}, signal } = {}) => {
  const target = new URL(relayUrl);
  target.searchParams.set("url", url);
  return fetchImpl(target.href, { signal, headers: { ...headers, "x-relay-secret": secret } });
};

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

/** The extra sources of one registry entry (a state or "national"): documents, listings and pages, each with its topic. */
function registryTargets(entry, scope) {
  const out = [];
  for (const d of entry?.documents ?? []) out.push({ ...scope, kind: "document", url: d.url, name: d.name, topic: d.topic ?? "wages", sourceIds: d.sourceIds ?? [], listings: [] });
  for (const l of entry?.listings ?? []) out.push({ ...scope, kind: "listing", url: l.url, name: l.name, match: l.match, topic: l.topic ?? "wages", ...(l.format && { format: l.format, publicBase: l.publicBase }) });
  for (const pg of entry?.pages ?? []) out.push({ ...scope, kind: "page", url: pg.url, name: pg.name, match: pg.match, topic: pg.topic ?? "wages", allowEmpty: Boolean(pg.allowEmpty), ...(pg.ignore && { ignore: pg.ignore }) });
  return out;
}

/** A fixed Internet Archive capture of a file: `https://web.archive.org/web/<14-digit timestamp>id_/<original>`. */
export const ARCHIVED = /^https:\/\/web\.archive\.org\/web\/\d{14}id_\//;

/**
 * Everything to fetch: per state, each document the wage page cites (once
 * per URL, with every source id that points at it and the SHA-256 recorded
 * in the dataset) and each listing page, from the dataset and the registry;
 * then the registry's other topics for that state (PT, LWF, licence); then
 * the national sources (EPF, ESIC, the labour codes).
 */
export function buildTargets(wageStates, registry) {
  const targets = [];
  const seen = new Set();
  const add = (t) => {
    const key = targetKey(t);
    if (seen.has(key)) return;
    seen.add(key);
    targets.push(t);
  };
  for (const state of wageStates) {
    const scope = { state: state.state, stateName: state.name };
    const docs = new Map();
    // An Internet Archive capture (web.archive.org/web/<timestamp>id_/…) cannot change, so there is nothing to watch:
    // Andhra Pradesh's older notifications survive only there. Our hosted copy keeps it either way.
    for (const source of state.sources.filter((s) => !ARCHIVED.test(s.url))) {
      const doc = docs.get(source.url) ?? { ...scope, kind: "document", topic: "wages", url: source.url, name: source.title, sourceIds: [], expectedSha256: source.sha256, listings: [] };
      doc.sourceIds.push(source.id);
      if (!doc.listings.includes(source.listing)) doc.listings.push(source.listing);
      docs.set(source.url, doc);
    }
    docs.forEach(add);
    const extra = registryTargets(registry.states?.[state.state], scope);
    extra.filter((t) => t.kind === "document").forEach(add);
    extra.filter((t) => t.kind !== "document" && t.topic === "wages").forEach(add);
    // A copy found on a third party's site (source.via): its file is watched, not the page around it.
    for (const source of state.sources.filter((x) => !x.via)) add({ ...scope, kind: "listing", topic: "wages", url: source.listing, name: `Listing for ${source.title}` });
    extra.filter((t) => t.kind !== "document" && t.topic !== "wages").forEach(add);
  }
  if (registry.national) registryTargets(registry.national, NATIONAL).forEach(add);
  return targets;
}

/**
 * Coverage: every state with a wage page has at least one source for each
 * state topic, the national entry covers EPF, ESIC and the labour codes,
 * and every document the employer dues cite (src/content/statutory.ts) is
 * watched somewhere.
 */
export function coverageProblems(wageStates, registry, citedUrls = []) {
  const problems = [];
  const topicsOf = (entry) => new Set([...(entry?.documents ?? []), ...(entry?.listings ?? []), ...(entry?.pages ?? [])].map((x) => x.topic ?? "wages"));
  for (const state of wageStates) {
    const have = topicsOf(registry.states?.[state.state]);
    have.add("wages");
    for (const topic of STATE_TOPICS) if (!have.has(topic)) problems.push(`${state.state}: no source watched for ${TOPICS[topic]} (add one to scripts/wage-monitor/sources.json)`);
  }
  const national = topicsOf(registry.national);
  for (const topic of NATIONAL_TOPICS) if (!national.has(topic)) problems.push(`national: no source watched for ${TOPICS[topic]}`);
  const watched = new Set(buildTargets(wageStates, registry).map((t) => t.url));
  // An Internet Archive capture cannot change (ARCHIVED), so it needs no watching.
  for (const url of citedUrls) if (!watched.has(url) && !ARCHIVED.test(url)) problems.push(`${url} is cited on the site but not watched`);
  for (const t of buildTargets(wageStates, registry)) {
    if (!TOPICS[t.topic]) problems.push(`${t.url}: unknown topic "${t.topic}"`);
    if (t.kind === "page" && !t.match) problems.push(`${t.url}: a page needs a match pattern (the lines to compare)`);
  }
  return problems;
}

/**
 * The location pages' sources (src/content/locations: estate profiles,
 * district sites, SIIDCUL pages), checked on the first three days of each
 * month for whether they still load: slow-changing facts, not circulars, so
 * no daily line diff (owner, 18 Oct 2026). A source that fails all three
 * days raises the usual "not loaded for 3 days" alert. The match never
 * matches, so a page's content is never compared; an empty page still
 * counts as a failed load.
 */
export const LOCATION_CHECK_DAYS = ["01", "02", "03"];
export function locationTargets(locationPages) {
  const seen = new Map();
  for (const page of locationPages) {
    for (const s of page.sources ?? []) if (/^https:\/\//.test(s.url) && !seen.has(s.url)) seen.set(s.url, s.label);
  }
  return [...seen].map(([url, label]) => ({ ...NATIONAL, kind: "page", url, name: `Location page source: ${label}`, match: "(?!)", topic: "locations", allowEmpty: true }));
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
    const urls = new Set(entry.listings.filter((l) => !l.topic || l.topic === "wages").map((l) => l.url));
    for (const source of state.sources.filter((x) => !x.via)) if (!urls.has(source.listing)) problems.push(`${state.state}: listing ${source.listing} (cited by ${source.id}) is missing from the registry`);
    for (const l of [...entry.listings, ...(entry.pages ?? []), ...(entry.documents ?? [])]) {
      if (!/^https:\/\//.test(l.url)) problems.push(`${state.state}: ${l.url} is not https`);
      if (!l.name) problems.push(`${state.state}: ${l.url} has no name`);
      for (const key of ["match", "ignore"]) {
        if (!l[key]) continue;
        try {
          new RegExp(l[key], "i");
        } catch {
          problems.push(`${state.state}: ${l.url} has an invalid ${key} pattern`);
        }
      }
    }
  }
  for (const l of [...(registry.national?.listings ?? []), ...(registry.national?.pages ?? []), ...(registry.national?.documents ?? [])]) {
    if (!/^https:\/\//.test(l.url)) problems.push(`national: ${l.url} is not https`);
    if (!l.name) problems.push(`national: ${l.url} has no name`);
    for (const key of ["match", "ignore"]) {
      if (!l[key]) continue;
      try {
        new RegExp(l[key], "i");
      } catch {
        problems.push(`national: ${l.url} has an invalid ${key} pattern`);
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
  const bundles = new Map();
  const fetched = await fetchAll(
    [...new Set(targets.map((t) => t.url))],
    guarded,
  );

  for (const target of targets) {
    const key = targetKey(target);
    const prev = prevSources[key];
    const res = fetched.get(target.url);
    let html = null;
    let links = null;
    let allCount = null;
    let bogus = null;
    let lines = null;
    if (res.ok) {
      if (target.kind === "page") {
        const body = res.body.toString("utf8");
        lines = pageLines(body, new RegExp(target.match, "i"), target.ignore ? new RegExp(target.ignore, "i") : null);
        // A lead page (allowEmpty: a compliance firm's latest posts) may have nothing on a state this week,
        // but a page with no text at all is a refused request (AscentHR sends an empty 200), not a quiet week.
        if (!htmlText(body).trim()) bogus = "the page came back empty";
        else if (!lines.length && !target.allowEmpty) bogus = prev?.lines?.length ? "none of the watched lines are on the page any more" : "no lines match the pattern";
      }
      if (target.kind === "listing") {
        html = res.body.toString("utf8");
        if (target.format === "spa-bundle") {
          // The page is an empty shell; its documents are in the main script, fetched through the same breaker.
          const script = spaScript(html, target.url);
          // One bundle (about 10 MB) serves every topic watched on the site: fetch it once a run.
          if (script && !bundles.has(script)) bundles.set(script, await guarded(script));
          const js = script ? bundles.get(script) : null;
          html = js?.ok ? js.body.toString("utf8") : "";
        }
        const parse =
          target.format === "wp-documents"
            ? (m) => wpDocumentLinks(html, target.publicBase, m)
            : target.format === "spa-bundle"
              ? (m) => spaBundleLinks(html, target.publicBase, m)
              : (m) => documentLinks(html, target.url, m);
        const all = parse();
        allCount = all.length;
        links = target.match ? parse(new RegExp(target.match, "i")) : all;
      }
      if (target.kind !== "page") bogus = implausible(target, res, prev, links, allCount);
    }
    if (!res.ok || bogus) {
      const error = bogus ?? (res.status ? `HTTP ${res.status}` : res.error || "no response");
      // Counts distinct IST days without a successful load; only a load resets it.
      const failing = { since: today, days: 0, lastDay: null, alerted: false, ...prev?.failing, lastError: error };
      if (failing.lastDay !== today) {
        failing.days += 1;
        failing.lastDay = today;
      }
      sources[key] = { ...prev, kind: target.kind, state: target.state, failing };
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

    if (target.kind === "page") {
      sources[key] = { ...base, lines };
      if (!prev?.lines) {
        results.push({ target, outcome: "baseline", detail: `${lines.length} lines watched` });
        continue;
      }
      const before = new Set(prev.lines);
      const after = new Set(lines);
      const added = lines.filter((l) => !before.has(l));
      const removed = prev.lines.filter((l) => !after.has(l));
      // A lead page is a rolling feed: posts age off it every week, so only a new line is news
      // (18 Oct 2026: AscentHR's feed raised six "page changed" alerts for lines that had scrolled off).
      const alerts = target.allowEmpty ? added.length > 0 : added.length || removed.length;
      if (alerts) events.push({ type: "page-changed", state: target.state, stateName: target.stateName, url: target.url, name: target.name, added, removed: target.allowEmpty ? [] : removed });
      results.push({ target, outcome: alerts ? "changed" : "unchanged", detail: `${lines.length} lines watched${added.length ? `, ${added.length} new` : ""}${removed.length ? `, ${removed.length} gone` : ""}` });
      continue;
    }

    if (target.kind === "document") {
      const doc = describeDocument(res.body);
      const baseline = prev?.sha256 ?? target.expectedSha256;
      const next = { ...base, sha256: doc.sha256, pdf: doc.isPdf, bytes: doc.bytes, pages: doc.pages, textSha256: doc.textSha256, text: clipText(doc.text) };
      sources[key] = next;
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

    sources[key] = { ...base, links, allCount, textSha256: sha256(htmlText(html)) };
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
    const unique = [...new Set(newDocs.filter((l) => !l.page).map((l) => l.url))].slice(0, MAX_NEW_DOCS);
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

  // Every event carries its target's topic (wages, epf, esic, pt, lwf, licence, codes).
  const topicOf = new Map(targets.map((t) => [`${t.state}|${t.url}`, t.topic ?? "wages"]));
  for (const e of events) e.topic ??= topicOf.get(`${e.state}|${e.url}`) ?? "wages";
  return { state: { version: STATE_VERSION, updatedAt: now.toISOString(), sources, reported: previous?.reported ?? {}, chatwoot: previous?.chatwoot ?? {} }, events, results };
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
        : event.type === "page-changed"
          ? [event.type, event.topic ?? "", event.url, ...event.added.map((l) => `+${l}`), ...event.removed.map((l) => `-${l}`)]
        : [event.type, event.url, event.since];
  return sha256(key.join("\n")).slice(0, 16);
}
