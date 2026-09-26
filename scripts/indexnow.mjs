// Tells IndexNow engines (Bing, which feeds ChatGPT search and Copilot, plus
// Yandex, Seznam, Naver) that pages changed. Run after a deploy is live:
//   npm run indexnow            -> every URL in the live sitemap
//   npm run indexnow -- /jobs   -> only the given paths
// The key file public/b49baea781d6499a83ac8a0c5641b558.txt must stay deployed.
const HOST = "www.vayasyaseva.com";
const KEY = "b49baea781d6499a83ac8a0c5641b558";

const paths = process.argv.slice(2);
let urls;
if (paths.length) {
  urls = paths.map((p) => new URL(p, `https://${HOST}`).href);
} else {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

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
if (!res.ok && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
