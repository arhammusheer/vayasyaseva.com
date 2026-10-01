// Crawls every sitemap URL on a running site and fails on SEO regressions.
//   pnpm seo:check                           -> http://localhost:3000 (after pnpm build && pnpm start)
//   pnpm seo:check https://www.vayasyaseva.com
// Sitemap URLs are absolute (www); they are fetched from the given base instead.
const SITE = "https://www.vayasyaseva.com";
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

// The registered office is a home address: legal pages only (see privacy/terms).
const HOME_ADDRESS_MARKER = "Deep Ganga";
const HOME_ADDRESS_PAGES = new Set(["/en-in/privacy", "/en-in/terms"]);

const errors = [];
const fail = (path, message) => errors.push(`${path || "/"}: ${message}`);
const local = (url) => base + url.slice(SITE.length);
const trim = (url) => url.replace(/\/$/, "");

async function get(url) {
  const res = await fetch(url, { redirect: "manual" });
  return { status: res.status, body: await res.text() };
}

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

    if (/<meta name="robots" content="[^"]*noindex/.test(body)) fail(path, "noindex");

    for (const [, json] of body.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      try {
        JSON.parse(json);
      } catch {
        fail(path, "JSON-LD does not parse");
      }
    }

    if (body.includes(HOME_ADDRESS_MARKER) && !HOME_ADDRESS_PAGES.has(path)) {
      fail(path, "registered (home) address outside Privacy/Terms");
    }
  }),
);

if (errors.length) {
  console.error(`SEO check failed (${errors.length}):\n- ${errors.sort().join("\n- ")}`);
  process.exit(1);
}
console.log(`SEO check passed: ${urls.length} URLs on ${base}`);
