/**
 * f/leads/erase: hourly, and by hand. Erases one queued enquiry erasure
 * request (by case ID or phone) from Twenty CRM and the lead inbox. See
 * leads/lib/erase.ts and OPERATIONS.md.
 */
import { withDatabase } from "../../talent/lib/db.ts";
import { twentyFromConfig } from "../../talent/lib/twenty.ts";
import { runLeadErasure } from "../lib/erase.ts";

export async function main() {
  const crm = await twentyFromConfig();
  return withDatabase("leads_pg_url", (query) => runLeadErasure({ query, crm }));
}
