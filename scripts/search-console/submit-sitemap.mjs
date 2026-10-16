#!/usr/bin/env node
// Submits the sitemap to Google Search Console and reports what Google last
// read from it (docs/search-pipeline.md). The Search workflow runs it after
// each production deploy, with a short-lived access token from workload
// identity federation (scope webmasters) in GOOGLE_ACCESS_TOKEN.
//
//   GOOGLE_ACCESS_TOKEN=... node scripts/search-console/submit-sitemap.mjs [--site sc-domain:vayasyaseva.com] [--sitemap https://www.vayasyaseva.com/sitemap.xml]
//
// Exit 1 if the sitemap does not load, Google refuses the submission, or the
// last read reported errors. Prints Markdown (the workflow's step summary).
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    site: { type: "string", default: "sc-domain:vayasyaseva.com" },
    sitemap: { type: "string", default: "https://www.vayasyaseva.com/sitemap.xml" },
  },
});
const token = process.env.GOOGLE_ACCESS_TOKEN;
if (!token) {
  console.error("Set GOOGLE_ACCESS_TOKEN (scope https://www.googleapis.com/auth/webmasters).");
  process.exit(2);
}
const API = "https://www.googleapis.com/webmasters/v3";
const path = `${API}/sites/${encodeURIComponent(values.site)}/sitemaps/${encodeURIComponent(values.sitemap)}`;
const out = [`## Search Console: ${values.sitemap}`, ""];
let failed = false;

// 1. The sitemap itself loads and lists pages.
const res = await fetch(values.sitemap, { headers: { "user-agent": "vayasyaseva-search-pipeline" } });
const xml = res.ok ? await res.text() : "";
const urls = (xml.match(/<loc>/g) ?? []).length;
if (!res.ok || !urls) {
  out.push(`- The sitemap did not load (HTTP ${res.status}, ${urls} URLs). Nothing submitted.`);
  console.log(out.join("\n"));
  process.exit(1);
}
out.push(`- Sitemap loads: ${urls} URLs.`);

// 2. Submit.
const put = await fetch(path, { method: "PUT", headers: { authorization: `Bearer ${token}` } });
if (!put.ok) {
  const text = (await put.text()).slice(0, 300);
  out.push(`- Submit refused: HTTP ${put.status} ${text}`);
  if (put.status === 403) out.push(`- The service account needs Full access to ${values.site}: Search Console -> Settings -> Users and permissions -> Add user.`);
  console.log(out.join("\n"));
  process.exit(1);
}
out.push(`- Submitted to ${values.site}.`);

// 3. What Google last read (it fetches the sitemap later; these are from its previous read).
const info = await fetch(path, { headers: { authorization: `Bearer ${token}` } });
if (info.ok) {
  const s = await info.json();
  const submitted = (s.contents ?? []).reduce((n, c) => n + Number(c.submitted ?? 0), 0);
  out.push(`- Last submitted ${s.lastSubmitted ?? "?"}; last downloaded ${s.lastDownloaded ?? "not yet"}; ${submitted} URLs seen; errors ${s.errors ?? 0}, warnings ${s.warnings ?? 0}${s.isPending ? " (processing)" : ""}.`);
  if (Number(s.errors ?? 0) > 0) {
    failed = true;
    out.push(`- Google reported errors in its last read of the sitemap. Open Search Console -> Sitemaps for the details.`);
  }
} else out.push(`- Could not read the sitemap status (HTTP ${info.status}).`);

console.log(out.join("\n"));
process.exit(failed ? 1 : 0);
