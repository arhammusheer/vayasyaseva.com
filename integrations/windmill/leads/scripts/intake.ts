/**
 * f/leads/intake: the website's business enquiries (src/lib/lead-forward.ts,
 * after /api/contact or /api/agent/contact), through the HTTP route
 * `webhook/vspl-lead`. Checks the shared secret, validates (business_enquiry.v1),
 * saves the lead in the inbox (leads database) and answers 202; then starts
 * f/leads/sync_crm for it, which files it in Twenty. If Twenty is down the
 * lead waits in the inbox and is retried with backoff.
 *
 * The preprocessor reads the request: only the outcome of the secret check
 * and the body reach main, so the secret never appears in the job's args.
 * Errors never reach the answer (they would carry the lead's details).
 */
import { timingSafeEqual } from "node:crypto";
import * as wmill from "windmill-client";
import { config } from "../../talent/lib/config.ts";
import { withDatabase } from "../../talent/lib/db.ts";
import { respond } from "../../talent/lib/response.ts";
import { checkLead } from "../lib/lead.ts";
import { saveLead } from "../lib/run-leads.ts";

export const SECRET_HEADER = "x-vspl-lead-secret";

export function secretMatches(given: string | undefined, expected: string): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface HttpEvent {
  headers?: Record<string, string>;
  body?: unknown;
}

export async function preprocessor(event: HttpEvent) {
  const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  const authorized = secretMatches(headers[SECRET_HEADER], await config("lead_webhook_secret"));
  return { authorized, body: authorized ? (event.body ?? null) : null };
}

export async function main(authorized: boolean, body: unknown) {
  if (!authorized) return respond(403, { ok: false, error: "Forbidden" });
  const checked = checkLead(body);
  if (!checked.ok) return respond(400, { ok: false, error: `Invalid lead: ${checked.errors.join(", ")}` });
  try {
    const saved = await withDatabase("leads_pg_url", (query) => saveLead(query, checked.lead));
    if (saved.leadId) {
      // Into Twenty now; the every-minute sync covers a failure here.
      await wmill.runScriptByPathAsync("f/leads/sync_crm", { lead_id: saved.leadId }).catch(() => {});
    }
    return respond(202, { ok: true, caseId: checked.lead.caseId, created: saved.created });
  } catch (err) {
    console.error("lead intake failed:", checked.lead.caseId, err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
    return respond(500, { ok: false, error: "Internal error" });
  }
}
