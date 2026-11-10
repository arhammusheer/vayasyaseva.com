/**
 * f/leads/alerts_send: one state's new minimum wage rates to its confirmed
 * followers, each once per revision. Run by hand after a wage update is
 * live (`pnpm alerts:send <state>`, scripts/alerts-send.mjs, which builds
 * the subject and lines from the wage dataset): nothing sends on its own
 * (owner decision, 10 Nov 2026). `dry_run` counts only. Safe to run again:
 * whoever already had this revision is skipped. See leads/lib/run-alerts.ts.
 */
import { config } from "../../talent/lib/config.ts";
import { withDatabase } from "../../talent/lib/db.ts";
import { notifyConfig } from "../../notify/lib/config.ts";
import { alertMailer } from "../lib/alert-mail.ts";
import { runAlertSend } from "../lib/run-alerts.ts";

export async function main(state: string, revision: string, subject: string, lines: string[], dry_run: boolean = true, limit?: number | null) {
  if (!/^[a-z][a-z-]{1,31}$/.test(state)) throw new Error("state must be a wage page slug");
  if (!/^[\w.:-]{1,40}$/.test(revision)) throw new Error("revision must be a short id, e.g. the in-force date 2026-10-01");
  if (!subject?.trim() || subject.length > 150) throw new Error("subject is required (150 characters at most)");
  if (!Array.isArray(lines) || !lines.length || lines.some((line) => typeof line !== "string" || !line.trim() || line.length > 600)) {
    throw new Error("lines must be one or more short paragraphs");
  }
  const mail = alertMailer(await notifyConfig("resend_api_key").catch(() => ""), await config("alerts_email_from"), await config("alerts_reply_to"));
  return withDatabase("leads_pg_url", (query) =>
    runAlertSend({ state, revision, subject: subject.trim(), lines: lines.map((line) => line.trim()), dryRun: dry_run, limit: limit ?? undefined }, { query, mail }),
  );
}
