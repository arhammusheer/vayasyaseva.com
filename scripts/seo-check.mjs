// Crawls every sitemap URL on a running site and fails on SEO regressions.
//   pnpm seo:check                           -> http://localhost:3000 (after pnpm build && pnpm start)
//   pnpm seo:check https://www.vayasyaseva.com
// Sitemap URLs are absolute (www); they are fetched from the given base instead.
// Also runs check C7 (no business phone on jobs pages): scripts/check-jobs-phone.mjs,
// and C11 (no published page links to a page outside the sitemap, i.e. a
// review, paused, draft or missing page; see src/content/registry).
// Also checks the language picker at prompt pages' neutral URLs (one stable
// snippet per canonical, no shared caching of a visitor's order) and the
// proxy's redirects: the apex host in one hop, and /select-language/... back
// to the neutral URL.
import http from "node:http";
import https from "node:https";
import { checkJobsPhone } from "./check-jobs-phone.mjs";

const SITE = "https://www.vayasyaseva.com";
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

// The registered office is a home address: legal pages only (see privacy/terms).
const HOME_ADDRESS_MARKER = "Deep Ganga";
const HOME_ADDRESS_PAGES = new Set(["/en-in/privacy", "/en-in/terms"]);

const errors = [];
const checkedImages = new Map();
const fail = (path, message) => errors.push(`${path || "/"}: ${message}`);
const local = (url) => base + url.slice(SITE.length);
const trim = (url) => url.replace(/\/$/, "");

async function get(url, headers = {}) {
  const res = await fetch(url, { redirect: "manual", headers });
  return { status: res.status, body: await res.text(), headers: res.headers };
}

/** One request with a chosen Host header (fetch cannot set it); no redirects followed. */
function rawGet(path, host) {
  const target = new URL(path, base);
  const client = target.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(target, { method: "GET", headers: { host } }, (res) => {
      res.resume();
      res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location }));
    });
    req.on("error", reject);
    req.end();
  });
}

const decode = (text) =>
  text.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
const TITLE_SUFFIX = " | Vayasya Seva";
/** Visible in a mobile result: about 55 characters of title, 160 of description. */
const PICKER_TITLE_MAX = 55;
const PICKER_DESCRIPTION_MAX = 160;
const metaDescription = (body) => body.match(/<meta name="description" content="([^"]*)"/)?.[1];
/** Request headers that change the picker's order (src/lib/language-rank.ts). */
const VISITORS = [
  { "x-vercel-ip-country": "IN", "x-vercel-ip-country-region": "UP" },
  { "x-vercel-ip-country": "IN", "x-vercel-ip-country-region": "KA" },
  { "x-vercel-ip-country": "US" },
  { "accept-language": "hi-IN,hi;q=0.9" },
];

const robots = await get(`${base}/robots.txt`);
if (robots.status !== 200) fail("/robots.txt", `status ${robots.status}`);
if (!/Allow: \/\s/.test(robots.body)) fail("/robots.txt", "missing blanket Allow: /");
if (!/Disallow: \/api\/\s/.test(robots.body)) fail("/robots.txt", "missing Disallow: /api/");

const sitemap = await get(`${base}/sitemap.xml`);
if (sitemap.status !== 200) {
  console.error(`sitemap.xml: status ${sitemap.status}`);
  process.exit(1);
}
const urls = [...new Set([...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))];
const sitemapPaths = new Set(urls.map((url) => trim(url.slice(SITE.length)) || "/"));
const LOCALE_LINK = /href="(\/(?:en-in|hi-in|hi-latn-in)(?:\/[^"?#]*)?)(?:[?#][^"]*)?"/g;

await Promise.all(
  urls.map(async (url) => {
    const path = url.slice(SITE.length);
    if (!url.startsWith(SITE)) return fail(url, "sitemap URL is not on the canonical host");

    const { status, body } = await get(local(url));
    if (status !== 200) return fail(path, `status ${status}`);

    const h1s = body.match(/<h1[\s>]/g)?.length ?? 0;
    if (h1s !== 1) fail(path, `${h1s} <h1> elements (want 1)`);

    const title = body.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
    if (!title) fail(path, "empty <title>");

    const canonical = body.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (!canonical) fail(path, "no canonical link");
    else if (trim(canonical) !== trim(url)) fail(path, `canonical is ${canonical}`);

    const image = body.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    if (!image?.startsWith(`${SITE}/share/`)) fail(path, "missing page-specific branded share image");
    else {
      const check = checkedImages.get(image) ?? (async () => {
        const response = await fetch(local(image));
        const data = Buffer.from(await response.arrayBuffer());
        return response.status === 200 && response.headers.get("content-type")?.includes("image/png")
          && data.length >= 24 && data.subarray(1, 4).toString() === "PNG"
          && data.readUInt32BE(16) === 1200 && data.readUInt32BE(20) === 630;
      })();
      checkedImages.set(image, check);
      if (!(await check)) fail(path, "share image is unavailable or has wrong dimensions");
    }

    if (/<meta name="robots" content="[^"]*noindex/.test(body)) fail(path, "noindex");

    for (const [, json] of body.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      try {
        JSON.parse(json);
      } catch {
        fail(path, "JSON-LD does not parse");
      }
    }

    // C11: links to other language-prefixed pages must be published pages.
    for (const [, href] of body.matchAll(LOCALE_LINK)) {
      const target = trim(href.replaceAll("&amp;", "&"));
      if (!sitemapPaths.has(target)) fail(path, `links to ${target}, which is not a published page (C11)`);
    }

    if (body.includes(HOME_ADDRESS_MARKER) && !HOME_ADDRESS_PAGES.has(path)) {
      fail(path, "registered (home) address outside Privacy/Terms");
    }
  }),
);

// The language picker at a prompt page's neutral URL (/jobs). The sitemap
// lists the locale URLs; the neutral one is each of them without its locale.
// Its title and description are what the search result shows, so they must
// fit and must not change with the visitor's language order; and no shared
// cache may keep one visitor's order.
const neutralPaths = [...new Set([...sitemapPaths].map((p) => p.replace(/^\/(?:en-in|hi-in|hi-latn-in)(?=\/|$)/, "") || "/"))];
let pickers = 0;
await Promise.all(
  neutralPaths.map(async (path) => {
    const { status, body, headers } = await get(base + path);
    if (status !== 200 || !body.includes('class="language-picker"')) return;
    pickers++;
    const title = decode(body.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? "").replace(TITLE_SUFFIX, "");
    if (title.length > PICKER_TITLE_MAX) fail(path, `picker title is ${title.length} characters (max ${PICKER_TITLE_MAX}): ${title}`);
    const description = decode(metaDescription(body) ?? "");
    if (!description) fail(path, "picker has no meta description");
    else if (description.length > PICKER_DESCRIPTION_MAX) {
      fail(path, `picker description is ${description.length} characters (max ${PICKER_DESCRIPTION_MAX})`);
    }
    for (const name of ["cdn-cache-control", "cloudflare-cdn-cache-control"]) {
      if (headers.get(name) !== "no-store") fail(path, `picker response lacks ${name}: no-store (per-visitor order)`);
    }
    for (const visitor of VISITORS) {
      const other = await get(base + path, visitor);
      if (decode(metaDescription(other.body) ?? "") !== description) fail(path, `picker description changes for ${JSON.stringify(visitor)}`);
    }
  }),
);
if (pickers === 0) fail("/jobs", "no language picker found at any neutral URL");

// Redirects handled by the proxy and next.config.ts: each must be one hop.
const REDIRECTS = [
  // The apex host: the locale routing's own redirect, on www, in one hop.
  { path: "/about", host: "vayasyaseva.com", status: 308, location: `${SITE}/en-in/about` },
  { path: "/hi-in/about", host: "vayasyaseva.com", status: 307, location: `${SITE}/en-in/about` },
  { path: "/hi/jobs", host: "vayasyaseva.com", status: 308, location: `${SITE}/hi-in/jobs` },
  { path: "/jobs", host: "vayasyaseva.com", status: 308, location: `${SITE}/jobs` },
  { path: "/api/contact", host: "vayasyaseva.com", status: 308, location: `${SITE}/api/contact` },
  { path: "/robots.txt", host: "vayasyaseva.com", status: 308, location: `${SITE}/robots.txt` },
  // The picker's internal route is never a URL of its own.
  { path: "/select-language/hi-hl-en/jobs", status: 308, location: "/jobs" },
  { path: "/select-language/jobs", status: 308, location: "/jobs" },
  { path: "/select-language/hi", status: 308, location: "/hi" },
];
for (const { path, host = new URL(base).host, status, location } of REDIRECTS) {
  const res = await rawGet(path, host);
  // A relative expectation is a path on the same host; an absolute one must match exactly.
  const got = res.location && location.startsWith("/") ? new URL(res.location, base).pathname : res.location;
  if (res.status !== status || got !== location) {
    fail(`${host}${path}`, `redirect is ${res.status} ${res.location ?? "(none)"}, want ${status} ${location}`);
  }
}

errors.push(...(await checkJobsPhone(base, urls)));

if (errors.length) {
  console.error(`SEO check failed (${errors.length}):\n- ${errors.sort().join("\n- ")}`);
  process.exit(1);
}
console.log(`SEO check passed: ${urls.length} URLs and ${pickers} language pickers on ${base}, including the jobs phone check (C7) and link leaks (C11)`);
