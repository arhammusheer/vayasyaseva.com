/**
 * f/talent/sync_crm: every minute (and once by hand as the backfill).
 * Writes new applications into Twenty CRM (crm.vayasyaseva.com) as people,
 * applications and SMS acknowledgements, and updates acknowledgements whose
 * status changed. Tracks what it wrote in the talent database's crm_sync.
 */
import { withTalentDb } from "../lib/db.ts";
import { runSyncCrm } from "../lib/run-sync-crm.ts";
import { twentyFromConfig } from "../lib/twenty.ts";

export async function main() {
  const crm = await twentyFromConfig();
  return withTalentDb((query) => runSyncCrm({ query, crm }));
}
