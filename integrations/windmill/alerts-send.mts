/**
 * Sends one state's minimum wage rate alert (docs/rate-alerts.md): run by
 * hand after the wage update is live. A dry run unless --send is given.
 *
 *   node integrations/windmill/alerts-send.mts <state> [--send] [--subject "..."] [--line "..."]... [--limit N]
 *   pnpm alerts:send <state> [--send]
 *
 * The state's name and the date its headline rates are in force from come
 * from src/content/wages/<state>.json; that date is the revision, so each
 * subscriber gets one email per state and revision. The email's line is the
 * live page's opening sentence unless --line replaces it. Runs
 * f/leads/alerts_send through a kubectl port-forward (WARP on), as deploy.mts
 * does; the API token is read from the cluster and never printed.
 */
import { execFileSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";

const SITE = "https://www.vayasyaseva.com";

export interface WageFile {
  state: string;
  name: string;
  tables: { headline?: boolean; effectiveFrom: string }[];
}

/** "2026-10-01" as "1 October 2026". */
export const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** The revision (the headline table's in-force date) and the default subject. */
export function alertOf(wages: WageFile) {
  const headline = wages.tables.find((t) => t.headline) ?? wages.tables[0];
  if (!headline) throw new Error(`${wages.state}: no rate table`);
  return {
    state: wages.state,
    revision: headline.effectiveFrom,
    subject: `${wages.name} minimum wages changed: in force from ${longDate(headline.effectiveFrom)}`,
  };
}

/** The opening sentence under the page's H1 (the answer the page gives), as text. */
export function ledeOf(html: string): string | null {
  const m = /<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/.exec(html);
  if (!m) return null;
  const text = m[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&rsquo;/g, "\u2019")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z#0-9]+;/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length >= 20 && text.length <= 600 ? text : null;
}

function option(args: string[], name: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) if (args[i] === name && args[i + 1]) out.push(args[++i]);
  return out;
}

async function freePort(): Promise<number> {
  return new Promise((ok, fail) => {
    const s = createServer();
    s.listen(0, () => {
      const { port } = s.address() as { port: number };
      s.close(() => ok(port));
    });
    s.on("error", fail);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const state = args.find((a) => /^[a-z][a-z-]+$/.test(a));
  if (!state) throw new Error("usage: pnpm alerts:send <state> [--send] [--subject \"...\"] [--line \"...\"]... [--limit N]");
  const send = args.includes("--send");
  const wages = JSON.parse(readFileSync(new URL(`../../src/content/wages/${state}.json`, import.meta.url), "utf8")) as WageFile;
  const alert = alertOf(wages);
  const subject = option(args, "--subject")[0] ?? alert.subject;
  let lines = option(args, "--line");
  if (!lines.length) {
    const page = await fetch(`${SITE}/en-in/minimum-wages/${state}`);
    const lede = page.ok ? ledeOf(await page.text()) : null;
    if (!lede) throw new Error(`could not read the opening sentence of ${SITE}/en-in/minimum-wages/${state}; pass --line "..."`);
    lines = [lede];
  }
  const limit = Number(option(args, "--limit")[0]) || undefined;

  console.log(`State     ${wages.name} (${state})`);
  console.log(`Revision  ${alert.revision}  (each subscriber gets one email per state and revision)`);
  console.log(`Subject   ${subject}`);
  for (const line of lines) console.log(`Line      ${line}`);
  console.log(send ? "\nSending..." : "\nDry run (add --send to send).");

  const token = Buffer.from(execFileSync("kubectl", ["-n", "growth", "get", "secret", "windmill-env", "-o", "jsonpath={.data.SUPERADMIN_SECRET}"], { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }), "base64").toString("utf8");
  const port = await freePort();
  const forward = spawn("kubectl", ["-n", "growth", "port-forward", "svc/windmill", `${port}:8000`], { stdio: "ignore" });
  try {
    const base = `http://127.0.0.1:${port}`;
    let up = false;
    for (let i = 0; i < 60 && !up; i++) {
      up = await fetch(`${base}/api/version`).then((r) => r.ok, () => false);
      if (!up) await new Promise((r) => setTimeout(r, 500));
    }
    if (!up) throw new Error("could not reach Windmill through kubectl port-forward");
    const res = await fetch(`${base}/api/w/vspl/jobs/run_wait_result/p/f/leads/alerts_send`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ state, revision: alert.revision, subject, lines, dry_run: !send, ...(limit ? { limit } : {}) }),
      signal: AbortSignal.timeout(15 * 60_000),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`f/leads/alerts_send: HTTP ${res.status} ${text.slice(0, 300)}`);
    const result = JSON.parse(text) as { due: number; sent: number; failed: number; subscribers: Record<string, number> };
    console.log(`\nConfirmed subscribers by state: ${Object.entries(result.subscribers).map(([s, n]) => `${s} ${n}`).join(", ") || "none"}`);
    console.log(send ? `Sent ${result.sent} of ${result.due} due${result.failed ? `; ${result.failed} failed (run again for the rest)` : ""}.` : `${result.due} would get this alert.`);
    if (result.failed) process.exitCode = 1;
  } finally {
    forward.kill();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
