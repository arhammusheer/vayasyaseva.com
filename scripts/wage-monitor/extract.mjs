// Text and link extraction for the wage monitor: what a listing page links
// to, what a document says, and how two versions differ.
import { createHash } from "node:crypto";
import { extractPdfText, normaliseLines } from "./pdf-text.mjs";

export const sha256 = (data) => createHash("sha256").update(data).digest("hex");

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘" };
export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

// Icon fonts put private-use characters inside links; they are not text.
const stripTags = (html) =>
  normaliseLines(decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/[\ue000-\uf8ff]/g, " ")).replace(/\n/g, " ");

/** Visible text of an HTML page, one line per block, scripts and styles removed. */
export function htmlText(html) {
  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h[1-6]|td|th|section|article|header|footer|nav|ul|ol|table)>/gi, "\n");
  return normaliseLines(decodeEntities(body.replace(/<[^>]+>/g, " ")));
}

const DOCUMENT = /\.(pdf|docx?|xlsx?|odt|ods|zip)(?:$|[?#])/i;
// Link text that says nothing about the document: use its row instead.
const GENERIC = /^(view|download|click here|here|open|pdf|link|read more|new|देखें|डाउनलोड)?\s*(\(.*\))?$/i;
const NEW_BADGE = /\s*\b(new)\s*$/i;
// "Accessible Version : (2 MB)" on s3waas state sites.
const ACCESSIBLE = /\s*Accessible Version\s*:?\s*(\([^)]*\))?/gi;

/**
 * The documents a listing page links to: [{ url, label }], absolute URLs,
 * sorted and unique. The label is the link text, or its title attribute,
 * or the text of the table row or list item around it when the link only
 * says "View" or "Download". `match`, a RegExp, keeps only the links whose
 * label or URL matches (for home pages that link everything).
 */
/**
 * A WordPress documents API listing (the Ministry of Labour's site renders
 * in the browser from wp-json, so its HTML has no links). One entry per
 * post: its public page under `publicBase` and "date: title" as the label.
 * `page: true` marks them as pages, not files, so they are not fetched and
 * described like a new PDF.
 */
export function wpDocumentLinks(body, publicBase, match) {
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return [];
  }
  const found = new Map();
  for (const post of Array.isArray(data?.posts) ? data.posts : []) {
    const slug = post?.post_slug || post?.post_name;
    if (!slug || !post?.post_title) continue;
    const url = new URL(encodeURIComponent(slug), publicBase).href;
    const date = post.acf_data?.date || String(post.post_date ?? "").slice(0, 10);
    const label = `${date ? `${date}: ` : ""}${decodeEntities(String(post.post_title)).replace(/\s+/g, " ").trim()}`.slice(0, 300);
    if (match && !match.test(label)) continue;
    found.set(url, { url, label, page: true });
  }
  return [...found.values()].sort((a, b) => a.url.localeCompare(b.url));
}

/** The single-page app's main script, from its HTML shell: `<script src="/static/js/main.<hash>.js">`. */
export function spaScript(html, baseUrl) {
  const m = /<script\b[^>]*\bsrc\s*=\s*["']([^"']*\/static\/js\/main\.[0-9a-f]+\.js)["']/i.exec(html);
  if (!m) return null;
  try {
    return new URL(m[1], baseUrl).href;
  } catch {
    return null;
  }
}

const jsString = (s) => {
  try {
    return JSON.parse(`"${s}"`);
  } catch {
    return s;
  }
};

/**
 * The documents a single-page app's bundle links (Andhra Pradesh's labour
 * site renders in the browser, so its HTML has no links; its notices and
 * acts are object literals in the main script, such as
 * `{text:"VDA Gazette as on 01.10.2026",link:DU+"labour/1790751054626_VDA….pdf"}`).
 * Each path under `labour/` becomes `publicBase` + path, labelled by the
 * object's text or name, else by its file name. Sorted and unique, like
 * documentLinks.
 */
export function spaBundleLinks(js, publicBase, match) {
  const found = new Map();
  const urlOf = (path) => new URL(path.replace(/^\/+/, ""), publicBase).href;
  const add = (path, label) => {
    const url = urlOf(path);
    const text = decodeEntities(jsString(label ?? path.split("/").pop())).replace(/\s+/g, " ").trim().slice(0, 300);
    if (match && !match.test(text) && !match.test(path)) return;
    if (!found.has(url) || text.length > found.get(url).label.length) found.set(url, { url, label: text });
  };
  for (const m of js.matchAll(/\{\s*(?:text|name)\s*:\s*"((?:[^"\\]|\\.){1,300})"\s*,\s*(?:link|url)\s*:\s*(?:[A-Za-z_$][\w$]*\s*\+\s*)?"((?:labour\/)[^"]+\.(?:pdf|xlsx?))"/g)) add(m[2], m[1]);
  // Paths in other shapes (the acts tree, menus) that no labelled literal covered: labelled by file name.
  for (const m of js.matchAll(/"(labour\/\d{10,}_[^"]+\.(?:pdf|xlsx?))"/g)) if (!found.has(urlOf(m[1]))) add(m[1]);
  return [...found.values()].sort((a, b) => a.url.localeCompare(b.url));
}

export function documentLinks(html, baseUrl, match) {
  const clean = html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ");
  const found = new Map();
  for (const m of clean.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = m[1];
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
    let raw = href && decodeEntities((href[1] ?? href[2] ?? href[3] ?? "").trim());
    // Telangana's Labour Department links files through a script:
    // href="javascript:void(0)" onclick="javascript:forceDownload('https://…:443/content/….pdf','name.pdf')".
    if (!raw || /^javascript:/i.test(raw)) {
      const onclick = /\bonclick\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
      const call = onclick && /\bforceDownload\(\s*['"]([^'"]+)['"]/i.exec(decodeEntities(onclick[1] ?? onclick[2]));
      if (call) raw = call[1].trim();
    }
    if (!raw || raw.startsWith("#") || /^(mailto|tel|javascript):/i.test(raw)) continue;
    let url;
    try {
      url = new URL(raw, baseUrl);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol) || !DOCUMENT.test(url.pathname)) continue;
    url.hash = "";
    let label = stripTags(m[2]);
    if (GENERIC.test(label)) {
      const title = /\btitle\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
      const titleText = title ? decodeEntities(title[1] ?? title[2]).trim() : "";
      label = titleText && !GENERIC.test(titleText) && !/^(new icon|click here to view details)$/i.test(titleText) ? titleText : rowText(clean, m.index) || label;
    }
    label = label.replace(ACCESSIBLE, "").replace(NEW_BADGE, "").trim().slice(0, 300);
    const key = url.href;
    if (match && !match.test(label) && !match.test(decodeURIComponent(url.pathname))) continue;
    // Keep the most informative label when a page links one file twice.
    if (!found.has(key) || label.length > found.get(key).label.length) found.set(key, { url: key, label });
  }
  return [...found.values()].sort((a, b) => a.url.localeCompare(b.url));
}

/** Text of the table row or list item that contains position `at`, if any. */
function rowText(html, at) {
  const before = html.slice(Math.max(0, at - 6000), at);
  const open = Math.max(before.search(/<tr\b(?![\s\S]*<tr\b)/i), before.search(/<li\b(?![\s\S]*<li\b)/i));
  if (open === -1) return "";
  const tag = /^<(tr|li)/i.exec(before.slice(open))[1].toLowerCase();
  const start = at - before.length + open;
  const close = html.slice(at).search(new RegExp(`</${tag}>`, "i"));
  if (close === -1 || close > 6000) return "";
  return stripTags(html.slice(start, at + close)).replace(/\b(view|download)\b/gi, " ").replace(/\s+/g, " ").trim();
}

/**
 * What a fetched file holds, for comparison and for the issue: its hash,
 * size and, for a PDF, page count and text (one string, lines joined by \n).
 */
export function describeDocument(body) {
  const isPdf = body.subarray(0, 1024).includes("%PDF-");
  let pages = null;
  let text = "";
  if (isPdf) {
    try {
      ({ pages, text } = extractPdfText(body));
    } catch {
      // keep the hash; the text layer is a bonus
    }
  }
  return { sha256: sha256(body), isPdf, bytes: body.length, pages, text, textSha256: text ? sha256(text) : null };
}

/**
 * Lines that appear in one text and not the other (multiset difference, so
 * a repeated line counts). Order follows each text.
 */
export function diffLines(before, after) {
  const count = (lines) => lines.reduce((m, l) => m.set(l, (m.get(l) ?? 0) + 1), new Map());
  const a = before ? before.split("\n") : [];
  const b = after ? after.split("\n") : [];
  const left = count(b);
  const removed = a.filter((l) => {
    const n = left.get(l) ?? 0;
    if (n > 0) {
      left.set(l, n - 1);
      return false;
    }
    return true;
  });
  const right = count(a);
  const added = b.filter((l) => {
    const n = right.get(l) ?? 0;
    if (n > 0) {
      right.set(l, n - 1);
      return false;
    }
    return true;
  });
  return { added, removed };
}

/** Lines with a figure in them: the ones a wage change shows up in. */
export const withFigures = (lines) => lines.filter((l) => /\d/.test(l));

/** Keeps stored text small: at most `maxLines` lines of at most 300 characters. */
export const clipText = (text, maxLines = 600) =>
  text
    .split("\n")
    .slice(0, maxLines)
    .map((l) => l.slice(0, 300))
    .join("\n");
