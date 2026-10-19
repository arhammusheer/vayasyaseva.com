// Check C7 (PLAN §7.3): the business phone never reaches a job seeker.
//
//   pnpm phone:check                       -> http://localhost:3000 (after pnpm build && pnpm start)
//   pnpm phone:check https://www.vayasyaseva.com
//
// Also run by `pnpm seo:check`, which CI runs after the build.
//
// Fails when
// - a jobs or reference page (/jobs/** in every locale, the language picker
//   at its neutral URL, the privacy notice and terms that every jobs form and
//   footer links, and later /minimum-wages, /guides, /locations) has a tel:
//   link, the phone digits in any spacing, or a JSON-LD "telephone";
// - a script those pages load carries the phone digits;
// - llms.txt or llms-full.txt carries the phone (agents were handing it to
//   job seekers);
// - the jobs routes of the OpenAPI spec, or the schemas they use, carry it;
// - any page in the sitemap has JobPosting markup (not yet: PLAN §5.1);
// - the WhatsApp number shows at all (digits, tel: or wa.me): it sends the
//   acknowledgements and takes replies only (src/content/whatsapp-number.ts).
import { fileURLToPath } from "node:url";

const SITE = "https://www.vayasyaseva.com";
const LOCALE_SEGMENT = /^\/(en-in|hi-in|hi-latn-in|pa-in|kn-in)(?=\/|$)/;

/** Neutral paths whose pages are for job seekers, or for everyone (no phone). */
const PHONE_FREE = [
  /^\/jobs(\/|$)/,
  /^\/privacy$/,
  /^\/terms$/,
  /^\/minimum-wages(\/|$)/,
  /^\/guides(\/|$)/,
  /^\/locations(\/|$)/,
];
/** Neutral paths served by the language picker (their neutral URL is a page, not a redirect). */
const PICKER = /^\/jobs(\/|$)/;

const { businessPhone } = await import("../src/content/business-contact.ts");
const { WHATSAPP_NUMBER } = await import("../src/content/whatsapp-number.ts");

/** Ten digits with any spacing or punctuation between them: 72920 14101, 72920-14101, 7292014101. */
const spaced = (digits) => new RegExp(digits.split("").join("[\\s\\u00a0().\\-]*"));
const digitsPattern = spaced(businessPhone.digits);
/** The WhatsApp number, in any spacing (a wa.me link carries the digits too). */
const whatsappPattern = spaced(WHATSAPP_NUMBER.slice(-10));

const neutralPath = (path) => path.replace(LOCALE_SEGMENT, "") || "/";
export const isPhoneFree = (path) => PHONE_FREE.some((re) => re.test(neutralPath(path)));

function hasKey(value, key) {
  if (Array.isArray(value)) return value.some((v) => hasKey(v, key));
  if (value && typeof value === "object") {
    return Object.entries(value).some(([k, v]) => k === key || hasKey(v, key));
  }
  return false;
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(([, json]) => {
    try {
      return [JSON.parse(json)];
    } catch {
      return [];
    }
  });
}

/** Where a phone shows up in a text, if anywhere. */
export function phoneIn(text, { tel = true } = {}) {
  const found = [];
  if (tel && /href=["']?tel:|\btel:\+?\d/i.test(text)) found.push("tel: link");
  if (digitsPattern.test(text)) found.push("phone digits");
  if (whatsappPattern.test(text)) found.push("WhatsApp number");
  return found;
}

/** Collect every $ref a JSON value points to (local refs only). */
function refsIn(value, out = new Set()) {
  if (Array.isArray(value)) value.forEach((v) => refsIn(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === "$ref" && typeof v === "string" && v.startsWith("#/")) out.add(v);
      else refsIn(v, out);
    }
  }
  return out;
}

/**
 * Run C7 against a running site.
 * @param {string} base  e.g. http://localhost:3000
 * @param {string[]} urls  absolute sitemap URLs (https://www.vayasyaseva.com/...)
 * @returns {Promise<string[]>} errors, as "path: message"
 */
export async function checkJobsPhone(base, urls) {
  const errors = [];
  const fail = (where, message) => errors.push(`${where}: ${message} (C7)`);
  const get = async (path) => {
    const res = await fetch(`${base}${path}`, { redirect: "manual" });
    return { status: res.status, body: await res.text() };
  };

  const paths = urls.filter((u) => u.startsWith(SITE)).map((u) => u.slice(SITE.length) || "/");
  // The language picker serves the neutral URL of each jobs page (/jobs, /jobs/apply…).
  const neutral = [...new Set(paths.filter(isPhoneFree).map(neutralPath))].filter((path) => PICKER.test(path));
  const phoneFreePages = [...paths.filter(isPhoneFree), ...neutral];
  if (!paths.some(isPhoneFree)) fail("/sitemap.xml", "no jobs pages found to check");

  const scripts = new Set();
  await Promise.all(
    phoneFreePages.map(async (path) => {
      const { status, body } = await get(path);
      if (status !== 200) return fail(path, `status ${status}`);
      for (const where of phoneIn(body)) fail(path, `${where} on a jobs/reference page`);
      if (jsonLdBlocks(body).some((block) => hasKey(block, "telephone"))) fail(path, 'JSON-LD "telephone" on a jobs/reference page');
      for (const [, src] of body.matchAll(/<script[^>]+src="(\/_next\/static\/[^"]+)"/g)) scripts.add(src);
    }),
  );

  // Code the jobs pages load: no phone digits ("tel:" can appear in generic link handling).
  await Promise.all(
    [...scripts].map(async (src) => {
      const { status, body } = await get(src);
      if (status === 200 && phoneIn(body, { tel: false }).length) fail(src, "phone digits in a script loaded by jobs pages");
    }),
  );

  // No page carries JobPosting markup yet.
  await Promise.all(
    paths.map(async (path) => {
      const { status, body } = await get(path);
      if (status === 200 && jsonLdBlocks(body).some((block) => JSON.stringify(block).includes('"JobPosting"'))) {
        fail(path, "JobPosting markup");
      }
    }),
  );

  for (const file of ["/llms.txt", "/llms-full.txt"]) {
    const { status, body } = await get(file);
    if (status !== 200) fail(file, `status ${status}`);
    for (const where of phoneIn(body)) fail(file, where);
  }

  const openapi = await get("/openapi/v1.json");
  if (openapi.status !== 200) fail("/openapi/v1.json", `status ${openapi.status}`);
  else {
    const spec = JSON.parse(openapi.body);
    const jobRoutes = Object.entries(spec.paths ?? {}).filter(([route]) => /\/jobs(\/|$)/.test(route));
    if (!jobRoutes.length) fail("/openapi/v1.json", "no jobs routes found to check");
    // The routes and every schema they reach.
    const seen = new Set();
    const queue = [...refsIn(Object.fromEntries(jobRoutes))];
    const parts = [JSON.stringify(Object.fromEntries(jobRoutes))];
    while (queue.length) {
      const ref = queue.pop();
      if (seen.has(ref)) continue;
      seen.add(ref);
      const target = ref
        .slice(2)
        .split("/")
        .reduce((node, key) => node?.[key.replace(/~1/g, "/").replace(/~0/g, "~")], spec);
      parts.push(JSON.stringify(target ?? null));
      queue.push(...refsIn(target));
    }
    for (const where of phoneIn(parts.join("\n"))) fail("/openapi/v1.json (jobs routes)", where);
  }

  return errors;
}

// Standalone: read the sitemap, then check.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
  const sitemap = await fetch(`${base}/sitemap.xml`);
  if (sitemap.status !== 200) {
    console.error(`sitemap.xml: status ${sitemap.status}`);
    process.exit(1);
  }
  const urls = [...new Set([...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))];
  const errors = await checkJobsPhone(base, urls);
  if (errors.length) {
    console.error(`Jobs phone check (C7) failed (${errors.length}):\n- ${errors.sort().join("\n- ")}`);
    process.exit(1);
  }
  console.log(`Jobs phone check (C7) passed: ${urls.filter((u) => isPhoneFree(u.slice(SITE.length))).length} jobs/reference URLs, llms.txt, llms-full.txt and the OpenAPI jobs routes on ${base}`);
}
