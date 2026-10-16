#!/usr/bin/env node
// Submits the sitemap to Bing Webmaster Tools and reports Bing's view of it
// and of the site's crawl (docs/search-pipeline.md). Bing's index feeds
// ChatGPT search, Microsoft Copilot and DuckDuckGo, so this is the main way
// into them. The Search workflow runs it after each production deploy.
//
//   BING_WEBMASTER_API_KEY=... node scripts/search-console/bing-submit.mjs [--sitemap URL]
//
// Prints Markdown with counts only (no queries): the workflow's logs are public.
// Exit 1 if the sitemap does not load, Bing refuses it, or the site is not in
// the account.
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { sitemap: { type: "string", default: "https://www.vayasyaseva.com/sitemap.xml" } } });
const key = process.env.BING_WEBMASTER_API_KEY;
if (!key) {
  console.log("## Bing Webmaster Tools\n\n- Skipped: no BING_WEBMASTER_API_KEY secret.");
  process.exit(0);
}
const API = "https://ssl.bing.com/webmaster/api.svc/json";
async function bing(method, params = {}, body) {
  const qs = new URLSearchParams({ ...params, apikey: key });
  const res = await fetch(`${API}/${method}?${qs}`, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method}: HTTP ${res.status} ${text.slice(0, 200).replaceAll(key, "***")}`);
  return text ? JSON.parse(text).d : null;
}
const msDate = (v) => (typeof v === "string" && /\/Date\((\d+)/.test(v) ? new Date(Number(v.match(/\/Date\((\d+)/)[1])).toISOString().slice(0, 10) : v ?? "?");

const out = ["## Bing Webmaster Tools", ""];
try {
  const res = await fetch(values.sitemap);
  const urls = res.ok ? ((await res.text()).match(/<loc>/g) ?? []).length : 0;
  if (!urls) throw new Error(`the sitemap did not load (HTTP ${res.status})`);

  const sites = (await bing("GetUserSites")) ?? [];
  const host = new URL(values.sitemap).host;
  const site = sites.find((s) => new URL(s.Url).host === host) ?? sites.find((s) => new URL(s.Url).host.endsWith(host.replace(/^www\./, "")));
  if (!site) throw new Error(`${host} is not in this Bing Webmaster Tools account (sites: ${sites.length})`);
  out.push(`- Site: ${site.Url} (${site.IsVerified ? "verified" : "NOT verified"}).`);

  await bing("SubmitFeed", {}, { siteUrl: site.Url, feedUrl: values.sitemap });
  out.push(`- Submitted ${values.sitemap} (${urls} URLs).`);

  const feed = ((await bing("GetFeeds", { siteUrl: site.Url })) ?? []).find((f) => f.Url === values.sitemap);
  if (feed) out.push(`- Bing's last read: ${msDate(feed.LastCrawled)}, status ${feed.Status ?? "?"}, ${feed.UrlCount ?? "?"} URLs.`);

  const crawl = ((await bing("GetCrawlStats", { siteUrl: site.Url })) ?? []).at(-1);
  if (crawl) out.push(`- Crawl on ${msDate(crawl.Date)}: ${crawl.CrawledPages ?? 0} pages crawled, ${crawl.InIndex ?? "?"} in index, errors ${crawl.CrawlErrors ?? 0} (5xx ${crawl.Code5xx ?? 0}, 4xx ${crawl.Code4xx ?? 0}), blocked by robots ${crawl.BlockedByRobotsTxt ?? 0}.`);
  console.log(out.join("\n"));
} catch (error) {
  out.push(`- Failed: ${String(error.message ?? error).replaceAll(key, "***")}`);
  console.log(out.join("\n"));
  process.exit(1);
}
