/**
 * The lead inbox, step by step, with the database and Twenty injected so the
 * tests can drive every path (roadmap 1F).
 *
 *   saveLead      intake: the lead and its CRM delivery, in one statement,
 *                 before the route answers 202; a replayed case ID saves nothing
 *   runLeadsSync  f/leads/sync_crm: due CRM deliveries into Twenty (recordLead,
 *                 where each record is found before it is created, so a retry
 *                 never files twice), with backoff and a cap; raises
 *                 lead.received once the crew request is in Twenty and
 *                 lead.forward_failed when a lead hits the cap (lead-notify.ts)
 */
import { recordLead, type Lead, type LeadResult } from "./lead.ts";
import { leadForwardFailedEvent, leadReceivedEvent } from "./lead-notify.ts";
import type { Notify } from "../../notify/lib/emit.ts";
import { LEADS_CLAIM, LEADS_FINISH, LEADS_RECOVER_STUCK, LEADS_SAVE, LEADS_SYNC_LOCK } from "./sql.ts";
import type { Twenty } from "../../talent/lib/twenty.ts";
import type { Query } from "../../talent/lib/db.ts";

export interface SavedLead {
  leadId: string | null;
  created: boolean;
}

export async function saveLead(query: Query, lead: Lead, idempotencyKey: string | null = null): Promise<SavedLead> {
  const type = lead.requestType === "compliance-help" ? "compliance_help.v1" : "business_enquiry.v1";
  const [row] = await query<{ lead_id: string | null }>(LEADS_SAVE, [
    lead.caseId,
    type,
    lead.channel,
    JSON.stringify(lead),
    idempotencyKey,
    lead.receivedAt,
  ]);
  return { leadId: row?.lead_id ?? null, created: Boolean(row?.lead_id) };
}

export interface LeadsSyncDeps {
  query: Query;
  crm: Twenty;
  log?: (message: string) => void;
  /** The notification hub (tryEmit in the script). Unset: no notifications. */
  notify?: Notify;
}

export interface LeadsSyncResult {
  skipped?: "another sync is running";
  rateLimited?: true;
  recovered: number;
  done: number;
  retried: number;
  dead: number;
}

/** Twenty allows the API key 100 requests a minute, shared with the talent sync; a lead takes about eight. */
export const LEADS_BATCH = 5;

export const leadBackoffSeconds = (attempts: number) => Math.min(60 * 2 ** Math.max(0, attempts - 1), 3600);

export async function runLeadsSync(deps: LeadsSyncDeps, options: { leadId?: string | null; batch?: number } = {}): Promise<LeadsSyncResult> {
  const log = deps.log ?? ((m: string) => console.error(m));
  const result: LeadsSyncResult = { recovered: 0, done: 0, retried: 0, dead: 0 };
  const [lock] = await deps.query<{ locked: boolean }>(LEADS_SYNC_LOCK);
  if (!lock?.locked) return { ...result, skipped: "another sync is running" };
  result.recovered = (await deps.query(LEADS_RECOVER_STUCK)).length;
  const batch = options.leadId ? 1 : (options.batch ?? LEADS_BATCH);
  for (let n = 0; n < batch; n++) {
    const [claim] = await deps.query<{ lead_id: string; attempts: number; case_id: string; payload: Lead }>(LEADS_CLAIM, [options.leadId ?? null]);
    if (!claim) break;
    let outcome: "done" | "retry" = "done";
    let error: string | null = null;
    let written: LeadResult | null = null;
    try {
      written = await recordLead(deps.crm, claim.payload);
    } catch (err) {
      outcome = "retry";
      error = (err instanceof Error ? err.message : "unknown error").slice(0, 500);
    }
    const [finished] = await deps.query<{ status: string }>(LEADS_FINISH, [
      claim.lead_id,
      outcome,
      error,
      leadBackoffSeconds(claim.attempts),
      written === null ? null : JSON.stringify(written),
    ]);
    if (finished?.status === "done") result.done++;
    else if (finished?.status === "dead") result.dead++;
    else result.retried++;
    // After the outcome is saved: the hub's dedupeKey (lead:<caseId>) sends it once, even when a
    // replay finds the opportunity already there. tryEmit never throws.
    if (deps.notify && written) await deps.notify(leadReceivedEvent(claim.payload, written.opportunityId));
    if (deps.notify && finished?.status === "dead") await deps.notify(leadForwardFailedEvent(claim.case_id, claim.attempts, error));
    if (error && /HTTP 429/.test(error)) {
      result.rateLimited = true;
      break;
    }
    // The case ID, not the person: the job log is read by staff.
    if (error) log(`lead ${claim.case_id} not in Twenty yet: ${error}`);
  }
  return result;
}
