#!/usr/bin/env node
// Hosts our own copy of every document a wage page cites, so the pages and
// our records do not depend on government portals that move or drop files.
//
// For each source in src/content/wages/*.json without a `copy` (or every
// source, with --all): take the file (from --from <dir> by SHA-256, else
// from its URL), check it against the dataset's sha256, compress a PDF with
// Ghostscript (grayscale, 120 dpi, JPEG quality 60: small Hindi print stays
// comfortably readable at about a tenth of a scan's size) and upload to the
// cdn-vspl bucket (cdn.vayasyaseva.com):
//
//   sources/original/<sha256>.pdf            the bytes as retrieved, for the record
//   sources/<state>/<id>-<sha256:8>.pdf      the compressed copy the pages link
//
// Keys carry the hash, so a revised file never overwrites an earlier one.
// Then it writes `copy` and `copyKb` into the dataset.
//
//   vayasya-infra/cloudflare/run env CLOUDFLARE_ACCOUNT_ID=<id> \
//     node scripts/wage-monitor/host-copies.mjs [--from <dir>] [--only <state>] [--all] [--dry-run]
//
// Uploads go through wrangler with the infra Cloudflare token (R2 edit).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import tls from "node:tls";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { root } from "../lib/register-ts.mjs";
import { BUCKET, CDN, copyKey, originalKey } from "./archive.mjs";
import { fetchSource } from "./monitor.mjs";

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const kb = (bytes) => Math.round(bytes / 1024);

/** Ghostscript settings: grayscale, images to 120 dpi, JPEG quality 60; text layers are kept. */
const GS_ARGS = [
  "-q", "-dNOPAUSE", "-dBATCH", "-dSAFER", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.5",
  "-sColorConversionStrategy=Gray", "-dProcessColorModel=/DeviceGray",
  "-dDownsampleColorImages=true", "-dDownsampleGrayImages=true", "-dDownsampleMonoImages=false",
  "-dColorImageResolution=120", "-dGrayImageResolution=120",
  "-dColorImageDownsampleType=/Bicubic", "-dGrayImageDownsampleType=/Bicubic",
  "-dAutoFilterColorImages=false", "-dAutoFilterGrayImages=false",
  "-dColorImageFilter=/DCTEncode", "-dGrayImageFilter=/DCTEncode", "-dJPEGQ=60",
];

function compress(original, dir) {
  const input = join(dir, "in.pdf");
  const output = join(dir, "out.pdf");
  writeFileSync(input, original);
  execFileSync("gs", [...GS_ARGS, `-sOutputFile=${output}`, input], { stdio: ["ignore", "ignore", "pipe"] });
  const out = readFileSync(output);
  // Not worth it under 10%: a born-digital PDF is often smallest as it is.
  return out.length < original.length * 0.9 ? out : original;
}

function put(key, file, contentType) {
  execFileSync("npx", ["-y", "wrangler", "r2", "object", "put", `${BUCKET}/${key}`, "--file", file, "--content-type", contentType, "--cache-control", "public, max-age=31536000, immutable", "--remote"], { stdio: ["ignore", "ignore", "pipe"] });
}

/** Every file under dir, by SHA-256, so documents already downloaded need not be fetched again. */
function indexDir(dir) {
  const out = new Map();
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (st.size > 0 && st.size < 64 * 1024 * 1024) out.set(sha(readFileSync(p)), p);
    }
  };
  walk(dir);
  return out;
}

async function main() {
  const { values } = parseArgs({ options: { from: { type: "string" }, only: { type: "string" }, all: { type: "boolean", default: false }, "dry-run": { type: "boolean", default: false } } });
  if (!values["dry-run"] && !(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID)) throw new Error("Run through vayasya-infra's cloudflare/run with CLOUDFLARE_ACCOUNT_ID set, or pass --dry-run.");
  // The same extra certificates the monitor trusts (pblabour.gov.in, egazette.gov.in serve incomplete chains).
  const certs = resolve(root, "scripts/wage-monitor/certs");
  tls.setDefaultCACertificates([...tls.getCACertificates("default"), ...readdirSync(certs).filter((f) => f.endsWith(".pem")).map((f) => readFileSync(join(certs, f), "utf8"))]);
  const local = values.from ? indexDir(resolve(values.from)) : new Map();
  // One file cited by two sources (an order and its amendment in one PDF) is hosted once.
  const hosted = new Map();
  const dir = mkdtempSync(join(tmpdir(), "host-copies-"));
  const wagesDir = resolve(root, "src/content/wages");
  const problems = [];
  let before = 0;
  let after = 0;
  for (const file of readdirSync(wagesDir).filter((f) => f.endsWith(".json"))) {
    const path = join(wagesDir, file);
    const data = JSON.parse(readFileSync(path, "utf8"));
    if (values.only && data.state !== values.only) continue;
    let changed = false;
    for (const source of data.sources) if (source.copy) hosted.set(source.sha256, { copy: source.copy, copyKb: source.copyKb });
    for (const source of data.sources) {
      if (source.copy && !values.all) continue;
      if (hosted.has(source.sha256) && !values.all) {
        Object.assign(source, hosted.get(source.sha256));
        changed = true;
        continue;
      }
      let body = local.has(source.sha256) ? readFileSync(local.get(source.sha256)) : null;
      if (!body) {
        let res = await fetchSource(source.url);
        if (!res.ok || sha(res.body) !== source.sha256) res = await fetchSource(source.url, { userAgent: "Mozilla/5.0" });
        body = res.ok ? res.body : null;
        if (!body) {
          problems.push(`${data.state} ${source.id}: could not fetch (${res.status ? `HTTP ${res.status}` : res.error})`);
          continue;
        }
      }
      if (sha(body) !== source.sha256) {
        problems.push(`${data.state} ${source.id}: the file now differs from the dataset's sha256; re-check it before hosting`);
        continue;
      }
      if (!body.subarray(0, 1024).includes("%PDF-")) {
        problems.push(`${data.state} ${source.id}: not a PDF; not hosted`);
        continue;
      }
      const small = compress(body, dir);
      before += body.length;
      after += small.length;
      console.log(`${data.state} ${source.id}: ${kb(body.length)} KB -> ${kb(small.length)} KB`);
      if (!values["dry-run"]) {
        const orig = join(dir, "original.pdf");
        const copy = join(dir, "copy.pdf");
        writeFileSync(orig, body);
        writeFileSync(copy, small);
        put(originalKey(source.sha256), orig, "application/pdf");
        put(copyKey(data.state, source), copy, "application/pdf");
        source.copy = `${CDN}/${copyKey(data.state, source)}`;
        source.copyKb = Math.max(1, kb(small.length));
        hosted.set(source.sha256, { copy: source.copy, copyKb: source.copyKb });
        changed = true;
      }
    }
    if (changed) writeFileSync(path, `${JSON.stringify(data, null, 1)}\n`);
  }
  console.log(`\nTotal ${kb(before)} KB -> ${kb(after)} KB${values["dry-run"] ? " (dry run: nothing uploaded or written)" : ""}`);
  if (problems.length) {
    console.log(`\nNot hosted:\n- ${problems.join("\n- ")}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error?.stack ?? error);
  process.exit(2);
});
