// Tells IndexNow engines (Bing, which feeds ChatGPT search and Copilot, plus
// Yandex, Seznam, Naver) that pages changed. Run after a deploy is live:
//   pnpm indexnow                         -> every URL in the live sitemap
//   pnpm indexnow /jobs /terms            -> only the given paths
//   pnpm indexnow --changed state.json    -> only URLs whose content changed since
//                                            the fingerprints in state.json (then updated)
// The IndexNow workflow (.github/workflows/indexnow.yml) runs --changed after
// every production deploy. The key file public/b49baea781d6499a83ac8a0c5641b558.txt
// must stay deployed.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const HOST = "www.vayasyaseva.com";
const KEY = "b49baea781d6499a83ac8a0c5641b558";

async function sitemapUrls() {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  return [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))];
}

// What a search engine indexes, without build-specific noise (chunk names,
// deployment ids, the RSC payload all live in <script> tags or attributes).
function fingerprint(html) {
  const pick = (re) => [...html.matchAll(re)].map((m) => m[1]).join("\n");
  const text = html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  const parts = [
    pick(/<title>([^<]*)<\/title>/g),
    pick(/<meta name="description" content="([^"]*)"/g),
    pick(/<link rel="canonical" href="([^"]*)"/g),
    pick(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
    text,
  ];
  return createHash("sha256").update(parts.join("\n\u0000")).digest("hex");
}

const args = process.argv.slice(2);
let urls;
let stateFile;
let state = {};

if (args[0] === "--changed") {
  stateFile = args[1] ?? ".indexnow-state.json";
  if (existsSync(stateFile)) state = JSON.parse(readFileSync(stateFile, "utf8"));
  const next = {};
  urls = [];
  for (const url of await sitemapUrls()) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: status ${res.status}`);
    next[url] = fingerprint(await res.text());
    if (state[url] !== next[url]) urls.push(url);
  }
  state = next;
} else if (args.length) {
  urls = args.map((p) => new URL(p, `https://${HOST}`).href);
} else {
  urls = await sitemapUrls();
}

if (urls.length === 0) {
  console.log("IndexNow: no changed URLs");
} else {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
    }),
  });

  console.log(`IndexNow: ${res.status} ${res.statusText} for ${urls.length} URLs`);
  for (const url of urls) console.log(`  ${url}`);
  if (!res.ok && res.status !== 202) {
    console.error(await res.text());
    process.exit(1);
  }
}

// Only record fingerprints once the submission succeeded, so a failure retries.
if (stateFile) writeFileSync(stateFile, JSON.stringify(state, null, 2) + "\n");
