// Old URLs take one redirect to their final page (src/proxy.ts): the old
// locale prefixes (/hi, /hinglish) are mapped inside the proxy's locale
// routing, then routed like any URL, so a page that has since retired or
// lost a language is reached in one 308, never a chain.
//
// The IA restructure retires these pages. The business retirements are in
// src/content/registry/pages.ts; the ones still to land (PENDING) are set up
// here the same way. A setup line fails once pages.ts carries that
// retirement, so it moves to LANDED rather than masking the registry.
import assert from "node:assert/strict";
import test from "node:test";
import { importTs } from "../scripts/lib/register-ts.mjs";

const { pageEntries } = await importTs("src/content/registry/pages.ts");
const entry = (path) => pageEntries.find((e) => e.path === path) ?? assert.fail(`${path} is not in the registry`);

/** Retirements in pages.ts: [path, locale (all when undefined), target (404 when undefined)]. */
const LANDED = [
  ["/industries", undefined, "/services#sectors"],
  ["/how-we-operate", undefined, "/services"],
  ["/services/contract-labour", undefined, "/services"],
  ["/services/warehouse-labour", undefined, "/services/loading-unloading-labour"],
  ...["loading-unloading-labour", "factory-labour", "housekeeping"].map((slug) => [`/services/${slug}`, "hi-Latn-IN", `/services/${slug}`]),
  // hi-IN wage states were never public: retired with no target, so they 404.
  ...["uttarakhand", "uttar-pradesh", "delhi"].map((state) => [`/minimum-wages/${state}`, "hi-IN", undefined]),
  // Never public either: retired with no redirect.
  ["/guides/what-is-contract-labour", undefined, undefined],
];
/** Retirements the spec asks for that a later step lands in pages.ts. */
const PENDING = [];
const isRetired = (path, locale) => {
  const { locales } = entry(path);
  return locale ? locales[locale] === "retired" : Object.values(locales).every((s) => s === "retired");
};
const targetOf = (path, locale) => {
  const { retiredTo } = entry(path);
  return locale ? (typeof retiredTo === "object" ? retiredTo[locale] : undefined) : retiredTo;
};
// What the real registry does, before the setup below changes it.
const misses = (list) => list.filter(([path, locale, to]) => !isRetired(path, locale) || targetOf(path, locale) !== to).map(([path, locale]) => `${path}${locale ? ` (${locale})` : ""}`);
const landedMisses = misses(LANDED);
const pendingMisses = misses(PENDING);

const retired = (locales) => Object.fromEntries(Object.keys(locales).map((l) => [l, "retired"]));
for (const [path, locale, retiredTo] of PENDING) {
  if (isRetired(path, locale)) assert.fail(`${path}${locale ? ` (${locale})` : ""} is retired in pages.ts now: delete its setup line in this test`);
  const e = entry(path);
  if (locale) {
    Object.assign(e, { locales: { ...e.locales, [locale]: "retired" }, retiredTo: { ...(typeof e.retiredTo === "object" ? e.retiredTo : {}), [locale]: retiredTo } });
  } else {
    Object.assign(e, { locales: retired(e.locales), retiredTo });
  }
}
// A draft page whose route folder exists (built only for previews).
pageEntries.push({ path: "/minimum-wages/test-draft", kind: "static", audience: "mixed", locales: { "en-IN": "draft" }, updated: "2026-10-16", changeFrequency: "yearly", priority: 0.1 });

const { NextRequest } = await import("next/server.js");
const { proxy } = await importTs("src/proxy.ts");

const WWW = "https://www.vayasyaseva.com";
function request(url) {
  const { host } = new URL(url);
  return proxy(new NextRequest(url, { headers: { host } }));
}
/** Follows one redirect and asserts the target answers without another. */
function hop(url) {
  const res = request(url);
  const location = res.headers.get("location");
  assert.ok(location && [307, 308].includes(res.status), `${url} does not redirect (${res.status})`);
  const next = request(new URL(location, url).href);
  assert.ok(![301, 302, 307, 308].includes(next.status), `${url} -> ${location} -> ${next.headers.get("location")}: two hops`);
  return { status: res.status, location: location.startsWith(WWW) ? location.slice(WWW.length) : location };
}

test("old prefixes and retired pages reach their final page in one 308", () => {
  for (const [from, to] of [
    ["/hi/services/contract-labour", "/en-in/services"],
    ["/hinglish/services/warehouse-labour", "/en-in/services/loading-unloading-labour"],
    ["/hinglish/services/housekeeping", "/en-in/services/housekeeping"],
    ["/hinglish/services/loading-unloading-labour", "/en-in/services/loading-unloading-labour"],
    ["/industries", "/en-in/services#sectors"],
    ["/how-we-operate", "/en-in/services"],
    ["/en-in/industries", "/en-in/services#sectors"],
    ["/hi-latn-in/services/factory-labour", "/en-in/services/factory-labour"],
    ["/hinglish/jobs", "/hi-latn-in/jobs"],
    // No Hindi home or About yet: still permanent, as /hi never returns.
    ["/hi", "/en-in"],
    ["/hi/about", "/en-in/about"],
  ]) {
    const got = hop(`${WWW}${from}`);
    assert.deepEqual(got, { status: 308, location: to }, from);
  }
});

test("the apex host takes the same single hop, onto www", () => {
  assert.deepEqual(hop("https://vayasyaseva.com/hi/services/contract-labour"), { status: 308, location: "/en-in/services" });
  assert.deepEqual(hop("https://vayasyaseva.com/industries"), { status: 308, location: "/en-in/services#sectors" });
});

test("a retired language with no target, or a page not built, 404s with no hop", () => {
  const gone = (url) => {
    const res = request(url);
    assert.equal(res.headers.get("location"), null, url);
    return new URL(res.headers.get("x-middleware-rewrite") ?? "", WWW).pathname;
  };
  assert.equal(gone(`${WWW}/hi-in/minimum-wages/uttarakhand`), "/hi-in/_gone");
  assert.equal(gone(`${WWW}/hi-in/minimum-wages/delhi`), "/hi-in/_gone");
  assert.equal(gone(`${WWW}/en-in/guides/what-is-contract-labour`), "/en-in/_gone");
  // An old-prefix URL whose page 404s answers 404 itself, not a 308 to a 404.
  assert.equal(gone(`${WWW}/hi/minimum-wages/uttarakhand`), "/hi-in/_gone");
  assert.equal(gone(`${WWW}/hi/minimum-wages/test-draft`), "/hi-in/_gone");
  // A draft page 404s at both its URLs.
  assert.equal(gone(`${WWW}/en-in/minimum-wages/test-draft`), "/en-in/_gone");
  assert.equal(gone(`${WWW}/minimum-wages/test-draft`), "/en-in/_gone");
  // English stays live.
  assert.equal(request(`${WWW}/en-in/minimum-wages/uttarakhand`).headers.get("x-middleware-next"), "1");
});

test("the registry carries the landed retirements", () => {
  assert.deepEqual(landedMisses, []);
});

// A later retirement goes in PENDING (with its setup) until pages.ts lands it.
test("the registry carries every retirement the spec asks for", () => {
  assert.deepEqual(pendingMisses, []);
});
