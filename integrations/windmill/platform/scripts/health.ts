/**
 * f/platform/health: counts of dead and stuck work in the talent database and
 * the lead inbox (platform/lib/run-health.ts). Run on demand (Windmill API
 * run_wait_result); it sends no notifications: the notification hub reads it.
 */
import { withDatabase, withTalentDb } from "../../talent/lib/db.ts";
import { runHealth } from "../lib/run-health.ts";

export async function main() {
  return runHealth({ talent: (fn) => withTalentDb(fn), leads: (fn) => withDatabase("leads_pg_url", fn) });
}
