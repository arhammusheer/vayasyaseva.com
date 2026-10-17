/**
 * f/leads/sync_crm: every minute, and started by intake for a new lead. Files
 * the inbox's due leads in Twenty CRM (company, contact, crew request,
 * enquiry), each step found before it is created, with backoff and a cap.
 * See leads/lib/run-leads.ts.
 */
import { withDatabase } from "../../talent/lib/db.ts";
import { twentyFromConfig } from "../../talent/lib/twenty.ts";
import { runLeadsSync } from "../lib/run-leads.ts";
import { tryEmit } from "../../notify/lib/emit.ts";

export async function main(lead_id?: string | null) {
  const crm = await twentyFromConfig();
  return withDatabase("leads_pg_url", (query) => runLeadsSync({ query, crm, notify: tryEmit }, { leadId: lead_id || null }));
}
