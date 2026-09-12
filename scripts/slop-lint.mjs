#!/usr/bin/env node
/**
 * Slop lint -- smoke test for the patterns in docs/ai-slop-registry.md.
 *
 * Scans user-facing copy in content files, marketing pages, and section
 * components. Extracts string literals and JSX text, then checks them
 * against the registry. Prints counts and offending lines. Non-zero exit
 * only on Tier 1 words or prohibited words from docs/claim-policy.md.
 *
 *   node scripts/slop-lint.mjs
 *   node scripts/slop-lint.mjs --all   # include Tier 3 and Tier V
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN = [
  "src/content",
  "src/app/(marketing)",
  "src/components/sections",
  "src/components/layout",
  "src/app/opengraph-image.tsx",
];
const SKIP = /privacy\.ts|terms\.ts|\.contract\.json|types\.ts/;
const showAll = process.argv.includes("--all");

const TIER1 = [
  "delve", "tapestry", "testament", "underscore", "elucidate", "embark",
  "endeavor", "encompass", "multifaceted", "paradigm", "synergy", "holistic",
  "catalyze", "realm", "myriad", "plethora", "galvanize", "epitomize",
  "unravel", "supercharge", "spearhead", "catapult", "utilize", "leverage",
  "facilitate",
];
const PROHIBITED = [
  "world-class", "seamless", "revolutionary", "guaranteed", "100%",
  "leading", "no. 1", "hassle-free", "one-stop", "best",
];
const TIER2 = [
  "robust", "comprehensive", "cutting-edge", "innovative", "streamline",
  "empower", "foster", "enhance", "elevate", "optimize", "scalable", "pivotal",
  "intricate", "profound", "resonate", "harness", "navigate", "cultivate",
  "bolster", "cornerstone", "game-changer", "groundbreaking", "transformative",
  "unprecedented", "compelling", "ever-evolving", "meticulous", "versatile",
  "bespoke", "unwavering", "vibrant", "unleash", "unlock", "unveil", "crafted",
  "hone", "tailored", "captivate", "revolutionize", "amplify", "illuminate",
  "best-in-class", "end-to-end",
];
const TIER3 = [
  "crucial", "essential", "vital", "significant", "remarkable", "exceptional",
  "furthermore", "moreover", "additionally", "consequently", "nevertheless",
  "ultimately", "arguably", "indeed", "notably", "paramount", "pragmatic",
  "foundational", "strategic",
];
const TIERV = [
  "structured", "defined", "discipline", "disciplined", "aligned", "alignment",
  "integrated", "framework", "layer", "plane", "rhythm", "integrity",
  "visibility", "accountability", "governance", "posture", "cadence",
  "protocol", "engine", "operating model", "control layer",
];

const CONSTRUCTIONS = [
  { id: "A2.1 negative parallelism", re: /\bnot (just|only|merely)\b[^.]{0,80}\b(but|it'?s)\b|\b[^.]{0,60}\s[-—]\s*not\b|\brather than\b/i },
  { id: "A2.3 list-dash-participle", re: /,\s(and|or)\s[^.—]{2,40}\s—\s[^.]{0,40}\b(delivered|executed|deployed|managed|maintained|backed|supported|built)\b/i },
  { id: "A2.4 participle tail", re: /\s—\s(supporting|ensuring|providing|enabling|delivering|highlighting|underscoring|keeping|allowing)\b/i },
  { id: "A2.5 copulative avoidance", re: /\b(serves|acts|stands|functions) as\b|\boperates (through|as)\b/i },
  { id: "A2.7 hedge stack", re: /\b(where (this|the) capability|designed to|scope and enablement|vary by engagement|progressively enabled)\b/i },
  { id: "A2.8 fake suspense", re: /\b(the result\?|here'?s the thing|the answer\?)/i },
  { id: "A2.9 manufactured opener", re: /\b(in today'?s|when it comes to|whether you'?re|look no further|picture this)\b/i },
  { id: "A2.10 vague attribution", re: /\b(industry reports|experts (agree|argue|say)|studies (show|suggest)|observers note)\b/i },
  { id: "A2.14 puffery", re: /\b(one of (the|india'?s) most|enduring|pivotal moment|indelible)\b/i },
  { id: "A2.15 impact footer", re: /^\s*(impact|outcome|result):/i },
  { id: "A3.1 dash in heading/button", re: /(title|label|question|headline)\s*[:=]\s*["'`][^"'`]*—/i },
  { id: "B6.2 generic button", re: /["'`](learn more|get started|discover|explore)["'`]/i },
];

function walk(p, out) {
  const st = statSync(p);
  if (st.isDirectory()) {
    for (const f of readdirSync(p)) walk(join(p, f), out);
  } else if (/\.(tsx?|mjs|json)$/.test(p) && !SKIP.test(p)) {
    out.push(p);
  }
}

const files = [];
for (const s of SCAN) walk(join(ROOT, s), files);

const hits = { tier1: [], prohibited: [], tier2: [], tier3: [], tierV: [], constructions: [], dashes: [] };
let totalDashes = 0;
let totalChars = 0;
const wordCounts = new Map();

function wordRe(w) {
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // (?![-\\w]) keeps utility classes like leading-relaxed out of the count.
  return new RegExp(`(?<![-\\w])${esc}(s|es|d|ed|ing)?(?![-\\w])`, "gi");
}

for (const file of files) {
  const rel = relative(ROOT, file);
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    // Only consider lines that carry copy: string literals or JSX text.
    const isCopy = /["'`]/.test(line) || />[^<{]*[a-z]{3,}[^<{]*</i.test(line) || /^\s*[A-Za-z][^<>{}=;]*$/.test(line);
    if (!isCopy) return;
    if (/^\s*(import|export (?!const \w+ = ["'`])|const \w+ = \(|className=|from ")/.test(line)) return;
    if (/className=/.test(line) && !/>[^<]*[a-z]{3,}/i.test(line)) return;
    if (/(useState|headers\[|style\.|gradient\(|width:|height:|\.test\(|console\.)/.test(line)) return;

    const loc = `${rel}:${i + 1}`;
    const text = line.trim();
    totalChars += text.length;
    const d = (text.match(/—/g) || []).length;
    totalDashes += d;
    if (d >= 2) hits.dashes.push({ loc, text });

    const check = (list, bucket) => {
      for (const w of list) {
        const m = text.match(wordRe(w));
        if (m) {
          wordCounts.set(w, (wordCounts.get(w) || 0) + m.length);
          hits[bucket].push({ loc, word: w, text });
        }
      }
    };
    check(TIER1, "tier1");
    check(PROHIBITED, "prohibited");
    check(TIER2, "tier2");
    if (showAll) {
      check(TIER3, "tier3");
      check(TIERV, "tierV");
    }
    for (const c of CONSTRUCTIONS) {
      if (c.re.test(text)) hits.constructions.push({ loc, id: c.id, text });
    }
  });
}

function section(title, items, fmt) {
  console.log(`\n== ${title} (${items.length}) ==`);
  for (const it of items.slice(0, 60)) console.log("  " + fmt(it));
  if (items.length > 60) console.log(`  ... ${items.length - 60} more`);
}

const trunc = (s, n = 110) => (s.length > n ? s.slice(0, n) + "…" : s);

console.log(`Scanned ${files.length} files.`);
console.log(`Em dashes: ${totalDashes} (1 per ${totalDashes ? Math.round(totalChars / totalDashes) : "∞"} chars of copy; registry threshold 1 per 220)`);

section("Tier 1 / prohibited (fail)", [...hits.tier1, ...hits.prohibited], (h) => `${h.loc}  [${h.word}]  ${trunc(h.text)}`);
section("Tier 2 (review)", hits.tier2, (h) => `${h.loc}  [${h.word}]  ${trunc(h.text)}`);
section("Constructions (review)", hits.constructions, (h) => `${h.loc}  [${h.id}]  ${trunc(h.text)}`);
section("Lines with 2+ em dashes", hits.dashes, (h) => `${h.loc}  ${trunc(h.text)}`);
if (showAll) {
  section("Tier 3 (density)", hits.tier3, (h) => `${h.loc}  [${h.word}]  ${trunc(h.text)}`);
  section("Tier V — site flavour (density)", hits.tierV, (h) => `${h.loc}  [${h.word}]  ${trunc(h.text)}`);
}

const top = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
if (top.length) {
  console.log("\n== Word density ==");
  for (const [w, n] of top) console.log(`  ${String(n).padStart(4)}  ${w}`);
}

const fail = hits.tier1.length + hits.prohibited.length;
console.log(fail ? `\n${fail} hard failure(s).` : "\nNo hard failures.");
process.exit(fail ? 1 : 0);
