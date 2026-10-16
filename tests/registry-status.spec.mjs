// Page status rules (src/content/registry): which versions are built,
// indexed, listed, linked and redirected. Test pages are added to the
// registry before the modules that read it load.
import assert from "node:assert/strict";
import test from "node:test";
import { importTs } from "../scripts/lib/register-ts.mjs";

const { pageEntries, pathAliases } = await importTs("src/content/registry/pages.ts");
const page = (path, locales, extra = {}) => ({
  path, kind: "static", audience: "business", locales, parent: "/", updated: "2026-10-16", changeFrequency: "monthly", priority: 0.5, ...extra,
});
pageEntries.push(
  page("/test-review", { "en-IN": "review" }),
  page("/test-paused", { "en-IN": "paused" }),
  page("/test-draft", { "en-IN": "draft" }),
  page("/test-retired", { "en-IN": "retired" }, { retiredTo: "/about" }),
  page("/test-mixed", { "en-IN": "published", "hi-IN": "review", "hi-Latn-IN": "published" }),
  page("/jobs/test-hub", { "en-IN": "paused", "hi-IN": "paused" }, { kind: "jobs-city", audience: "jobs" }),
  page("/test-anchor", { "en-IN": "retired" }, { retiredTo: "/about#team" }),
  // Hinglish retired to a named target, Hindi retired with none (never public).
  page("/test-partly-retired", { "en-IN": "published", "hi-IN": "retired", "hi-Latn-IN": "retired" }, { retiredTo: { "hi-Latn-IN": "/test-mixed" } }),
  page("/test-noindex", { "en-IN": "published", "hi-IN": "published", "hi-Latn-IN": "published" }, { noindex: true }),
  page("/test-noindex/child", { "en-IN": "published" }, { parent: "/test-noindex" }),
);
pathAliases["/test-alias"] = "/test-mixed";

const registry = await importTs("src/content/registry/index.ts");
const { pageEntrySchema } = await importTs("src/content/registry/schema.ts");
const i18n = await importTs("src/lib/i18n.ts");
const { breadcrumbTrail, showsBreadcrumb, visibleTrail } = await importTs("src/lib/breadcrumbs.ts");
const { default: sitemap } = await importTs("src/app/sitemap.ts");
const urls = sitemap().map((e) => e.url.replace("https://www.vayasyaseva.com", ""));

test("draft and retired pages are not built; review and paused are", () => {
  assert.deepEqual(registry.builtLocales("/test-draft"), []);
  assert.deepEqual(registry.builtLocales("/test-retired"), []);
  assert.deepEqual(registry.builtLocales("/test-review"), ["en-IN"]);
  assert.deepEqual(registry.builtLocales("/test-paused"), ["en-IN"]);
  assert.ok(!("/test-draft" in i18n.pages) && "/test-review" in i18n.pages);
});

test("only published versions are indexable and in the sitemap", () => {
  for (const path of ["/test-review", "/test-paused", "/test-draft", "/test-retired"]) {
    assert.equal(i18n.isIndexable(path, "en-IN"), false, path);
    assert.ok(!urls.some((u) => u.endsWith(path)), `${path} is in the sitemap`);
  }
  assert.ok(urls.includes("/en-in/test-mixed") && urls.includes("/hi-latn-in/test-mixed"));
  assert.ok(!urls.includes("/hi-in/test-mixed"), "a review translation is in the sitemap");
});

test("hreflang lists published versions only", () => {
  assert.deepEqual(i18n.languageAlternates("/test-mixed"), {
    "en-IN": "/en-in/test-mixed",
    "hi-Latn-IN": "/hi-latn-in/test-mixed",
    "x-default": "/en-in/test-mixed",
  });
  assert.equal(i18n.languageAlternates("/test-review"), undefined);
});

test("links resolve to a published version; the switch hides review versions from published ones", () => {
  assert.equal(i18n.localizeHref("/test-mixed", "hi-IN"), "/en-in/test-mixed");
  assert.equal(i18n.localizeHref("/test-mixed", "hi-Latn-IN"), "/hi-latn-in/test-mixed");
  assert.deepEqual(i18n.languageLinks("/en-in/test-mixed").map((l) => l.lang), ["hi-Latn-IN"]);
  assert.deepEqual(i18n.languageLinks("/hi-in/test-mixed").map((l) => l.lang), ["en-IN", "hi-Latn-IN"]);
});

test("linkable() guard: published pages may not link to unpublished ones", () => {
  assert.equal(registry.linkable("/test-review"), false);
  assert.equal(registry.linkable("/test-mixed", "hi-IN"), false);
  assert.equal(registry.linkable("/about"), true);
  assert.match(i18n.linkProblem("/en-in/test-review", "/en-in/about"), /not a published page/);
  assert.match(i18n.linkProblem("/hi-in/test-mixed", "/en-in/about"), /not a published page/);
  assert.match(i18n.linkProblem("/en-in/no-such-page", "/en-in/about"), /not a published page/);
  assert.equal(i18n.linkProblem("/en-in/contact#form", "/en-in/about"), undefined);
  assert.equal(i18n.linkProblem("/hi-in/jobs/apply?role=packing", "/en-in/about"), undefined);
  assert.equal(i18n.linkProblem("/brand/downloads/kit.zip", "/en-in/about"), undefined);
  // A page in review may link to other pages in review.
  assert.equal(i18n.linkProblem("/en-in/test-paused", "/en-in/test-review"), undefined);
});

test("aliases and retired pages redirect once, to the target page", () => {
  assert.equal(pathAliases["/locations/haridwar"], "/haridwar-sidcul");
  assert.equal(registry.redirectTarget("/locations/haridwar"), "/haridwar-sidcul");
  assert.equal(registry.redirectTarget("/test-retired"), "/about");
  assert.equal(registry.redirectTarget("/about"), undefined);
  // The proxy keeps the language asked for only where the target is published.
  assert.equal(i18n.movedPathname("/test-alias", "hi-Latn-IN"), "/hi-latn-in/test-mixed");
  assert.equal(i18n.movedPathname("/test-alias", "hi-IN"), "/en-in/test-mixed");
  assert.equal(i18n.movedPathname("/locations/haridwar", "hi-IN"), "/hi-in/haridwar-sidcul");
  assert.equal(i18n.movedPathname("/test-retired", "en-IN"), "/en-in/about");
  assert.equal(i18n.movedPathname("/about", "en-IN"), undefined);
});

test("robots: a version is indexable only when its locale and status are both published", () => {
  // src/lib/metadata.ts sets noindex, follow wherever isIndexable is false.
  assert.equal(i18n.isIndexable("/test-mixed", "hi-Latn-IN"), true);
  assert.equal(i18n.isIndexable("/test-mixed", "hi-IN"), false);
  assert.equal(i18n.isIndexable("/no-such-page", "en-IN"), false);
  assert.equal(i18n.isIndexable("/about", "en-IN"), true);
});

test("paused hubs: built and noindex, out of the sitemap, but links to them keep working", () => {
  assert.deepEqual(registry.builtLocales("/jobs/test-hub"), ["en-IN", "hi-IN"]);
  assert.equal(registry.isPaused("/jobs/test-hub", "hi-IN"), true);
  assert.equal(i18n.isIndexable("/jobs/test-hub", "en-IN"), false);
  assert.ok(!urls.some((u) => u.endsWith("/jobs/test-hub")));
  assert.equal(i18n.linkProblem("/hi-in/jobs/test-hub", "/en-in/about"), undefined);
  assert.equal(i18n.localizeHref("/jobs/test-hub", "hi-IN"), "/hi-in/jobs/test-hub");
  // linkable() stays "published only", so lists of hubs can still filter on it.
  assert.equal(registry.linkable("/jobs/test-hub"), false);
});

test("only cluster hubs can be paused (they render the notice)", () => {
  assert.ok(registry.PAUSABLE_KINDS.has("jobs-city"));
  assert.ok(registry.PAUSABLE_KINDS.has("cluster-hub"));
  assert.ok(!registry.PAUSABLE_KINDS.has("static"));
  assert.ok(!registry.PAUSABLE_KINDS.has("job-role"));
});

test("per-language retirement: a named target 308s, a retired language without one 404s", () => {
  assert.deepEqual(registry.builtLocales("/test-partly-retired"), ["en-IN"]);
  assert.equal(registry.redirectTarget("/test-partly-retired", "hi-Latn-IN"), "/test-mixed");
  // The target keeps the language asked for where it is published in it.
  assert.equal(i18n.movedPathname("/test-partly-retired", "hi-Latn-IN"), "/hi-latn-in/test-mixed");
  // No target for Hindi and none for the live English or the neutral URL.
  assert.equal(i18n.movedPathname("/test-partly-retired", "hi-IN"), undefined);
  assert.equal(i18n.movedPathname("/test-partly-retired", "en-IN"), undefined);
  assert.equal(i18n.movedPathname("/test-partly-retired"), undefined);
  assert.equal(i18n.isGone("/test-partly-retired", "hi-IN"), true);
  assert.equal(i18n.isGone("/test-partly-retired", "en-IN"), false);
  assert.equal(i18n.isGone("/test-partly-retired"), false);
  // Pages with nothing built 404 at every URL and build no version.
  assert.equal(i18n.isGone("/test-draft", "en-IN"), true);
  assert.equal(i18n.isGone("/test-draft"), true);
  assert.deepEqual(i18n.localesOf("/test-draft"), []);
  assert.equal(i18n.isGone("/no-such-page"), false);
});

test("a retired page can redirect to an anchor on its target", () => {
  assert.equal(i18n.movedPathname("/test-anchor", "hi-IN"), "/en-in/about#team");
});

test("the schema keeps whole and partial retirement apart", () => {
  const ok = (extra) => pageEntrySchema.safeParse(page("/x", { "en-IN": "published", "hi-IN": "retired" }, extra)).success;
  assert.equal(ok({ retiredTo: { "hi-IN": "/about" } }), true);
  assert.equal(ok({ retiredTo: "/about" }), false, "a single path needs every language retired");
  assert.equal(ok({ retiredTo: { "en-IN": "/about" } }), false, "a target for a live language");
  assert.equal(ok({ retiredTo: { "hi-IN": "/about#team" } }), true);
  const allRetired = page("/x", { "en-IN": "retired" }, { retiredTo: { "en-IN": "/about" } });
  assert.equal(pageEntrySchema.safeParse(allRetired).success, false, "every language retired takes a single path");
  assert.equal(pageEntrySchema.safeParse(page("/x", { "en-IN": "review" }, { noindex: true })).success, false);
});

test("noindex pages: public and linkable, but out of search", () => {
  for (const locale of ["en-IN", "hi-IN", "hi-Latn-IN"]) {
    assert.equal(i18n.isPublic("/test-noindex", locale), true);
    assert.equal(i18n.isIndexable("/test-noindex", locale), false);
  }
  assert.ok(!urls.some((u) => u.endsWith("/test-noindex")), "a noindex page is in the sitemap");
  assert.equal(i18n.languageAlternates("/test-noindex"), undefined);
  assert.equal(registry.linkable("/test-noindex", "hi-IN"), true);
  assert.equal(i18n.linkProblem("/hi-in/test-noindex", "/en-in/about"), undefined);
  assert.equal(i18n.localizeHref("/test-noindex", "hi-IN"), "/hi-in/test-noindex");
  assert.deepEqual(i18n.languageLinks("/en-in/test-noindex").map((l) => l.lang), ["hi-IN", "hi-Latn-IN"]);
  // A noindex page is still checked for links like any public page.
  assert.match(i18n.linkProblem("/en-in/test-review", "/en-in/test-noindex"), /not a published page/);
});

test("the real noindex pages: the application form and the brand kit", () => {
  for (const locale of ["en-IN", "hi-IN", "hi-Latn-IN"]) assert.equal(i18n.isIndexable("/jobs/apply", locale), false);
  assert.equal(i18n.isIndexable("/brand", "en-IN"), false);
  assert.ok(registry.linkable("/jobs/apply", "hi-IN") && registry.linkable("/brand", "en-IN"));
  assert.ok(!urls.some((u) => u.endsWith("/jobs/apply") || u.endsWith("/brand")));
});

test("breadcrumbs follow the registry parent chain, home first; visible two levels down only", () => {
  const names = (path, locale, name) => breadcrumbTrail(path, locale, name).map((c) => c.name);
  assert.deepEqual(names("/brand", "en-IN", "Brand"), ["Home", "About", "Brand"]);
  assert.deepEqual(names("/vayasya-setu", "en-IN", "Vayasya Setu"), ["Home", "About", "Vayasya Setu"]);
  // Guides sit in the reference section, under the wage hub (its header).
  assert.deepEqual(names("/guides/new-labour-codes", "en-IN", "New labour codes"), ["Home", "Minimum wages", "New labour codes"]);
  assert.deepEqual(names("/minimum-wages/how-we-check", "en-IN", "How we check"), ["Home", "Minimum wages", "How we check"]);
  // Home opens the English home, so it keeps its English name.
  const jobs = breadcrumbTrail("/jobs/packing", "hi-IN", "पैकिंग");
  assert.deepEqual(jobs, [
    { name: "Home", href: "/en-in" },
    { name: "नौकरी", href: "/hi-in/jobs" },
    { name: "पैकिंग", href: "/hi-in/jobs/packing" },
  ]);
  // On jobs pages the visible trail starts at Jobs; other pages keep Home.
  assert.deepEqual(visibleTrail("/jobs/packing", jobs), jobs.slice(1));
  const service = breadcrumbTrail("/services/housekeeping", "en-IN", "Housekeeping");
  assert.deepEqual(visibleTrail("/services/housekeeping", service), service);
  assert.equal(showsBreadcrumb(breadcrumbTrail("/services/housekeeping", "en-IN", "Housekeeping")), true);
  assert.equal(showsBreadcrumb(breadcrumbTrail("/about", "en-IN", "About")), false);
  assert.equal(showsBreadcrumb(breadcrumbTrail("/", "en-IN", "Home")), false);
  // An ancestor without a breadcrumb name fails the build.
  assert.throws(() => breadcrumbTrail("/test-noindex/child", "en-IN", "Child"), /No breadcrumb name/);
});
