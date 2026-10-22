// Keeps the original bytes of every PDF the monitor fetches (the documents
// the pages cite and any new ones on the listings), so a record survives a
// portal dropping or replacing a file. Stored once per content hash, beside
// the hosted copies: sources/original/<sha256>.pdf on cdn.vayasyaseva.com
// (see host-copies.mjs). Archiving never fails the run; problems are noted.
import { createHash } from "node:crypto";

/** Where hosted copies live: the cdn-vspl bucket, served at cdn.vayasyaseva.com. */
export const BUCKET = "cdn-vspl";
export const CDN = "https://cdn.vayasyaseva.com";
/** The bytes as retrieved, one object per content hash. */
export const originalKey = (sha256, ext = "pdf") => `sources/original/${sha256}.${ext}`;
/**
 * A source's file type by its URL: "xls" or "xlsx" for the spreadsheets
 * Andhra Pradesh publishes its wage tables as, else "pdf".
 */
export const sourceExt = (url) => /\.(xlsx?)(?:$|[?#])/i.exec(url)?.[1].toLowerCase() ?? "pdf";
/** The compressed copy the pages link; the hash in the name keeps a revised file from overwriting an earlier one. */
export const copyKey = (state, source) => `sources/${state}/${source.id}-${source.sha256.slice(0, 8)}.${sourceExt(source.url)}`;

const isPdf = (body) => body.subarray(0, 1024).includes("%PDF-");

/**
 * Wraps the monitor's fetcher: each successful PDF response is archived
 * (HEAD first, so an existing original is not sent again). Returns the
 * fetcher and the run's log of what was archived or failed.
 */
export function archivingFetcher(fetcher, client, now = new Date()) {
  const log = { archived: [], failed: [], seen: new Set() };
  const wrapped = async (url) => {
    const res = await fetcher(url);
    if (!res.ok || !res.body || !isPdf(res.body)) return res;
    const sha256 = createHash("sha256").update(res.body).digest("hex");
    if (log.seen.has(sha256)) return res;
    log.seen.add(sha256);
    try {
      const key = originalKey(sha256);
      if (!(await client.exists(key))) {
        // Metadata travels as headers: ASCII only.
        await client.put(key, res.body, { contentType: "application/pdf", metadata: { "source-url": encodeURIComponent(url).slice(0, 1500), retrieved: now.toISOString() } });
        log.archived.push({ url, sha256 });
      }
    } catch (error) {
      log.failed.push({ url, error: String(error?.message ?? error) });
    }
    return res;
  };
  return { fetcher: wrapped, log };
}

/** One line for the run summary. */
export function archiveNote(log) {
  const parts = [`${log.seen.size} PDF${log.seen.size === 1 ? "" : "s"} checked against the archive`];
  if (log.archived.length) parts.push(`${log.archived.length} new original${log.archived.length === 1 ? "" : "s"} stored`);
  if (log.failed.length) parts.push(`${log.failed.length} could not be stored (first: ${log.failed[0].error})`);
  return `Archive: ${parts.join("; ")}.`;
}
