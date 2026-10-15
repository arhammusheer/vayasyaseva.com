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
);
pathAliases["/test-alias"] = "/test-mixed";

const registry = await importTs("src/content/registry/index.ts");
const i18n = await importTs("src/lib/i18n.ts");
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
