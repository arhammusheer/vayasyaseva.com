/**
 * f/platform/health: counts of dead and stuck work in the talent database and
 * the lead inbox (platform/lib/run-health.ts). Every 15 minutes (the schedule
 * is turned on with --enable-notify), and on demand (Windmill API
 * run_wait_result). Each condition goes to the notification hub as a
 * platform.* event when it starts and when it clears, not at every check
 * (platform/lib/health-notify.ts).
 */
import { withDatabase, withTalentDb } from "../../talent/lib/db.ts";
import { pgNotifyStore, withNotifyDb } from "../../notify/lib/db.ts";
import { notifyHealth } from "../lib/health-notify.ts";
import { runHealth } from "../lib/run-health.ts";

export async function main() {
  const health = await runHealth({ talent: (fn) => withTalentDb(fn), leads: (fn) => withDatabase("leads_pg_url", fn) });
  try {
    const notified = await withNotifyDb((sql) => notifyHealth(health, pgNotifyStore(sql)));
    return { ...health, notified };
  } catch (err) {
    // The counts are still the answer; the next check tells the hub.
    console.error("health: notify failed:", err instanceof Error ? err.name : "unknown error");
    return { ...health, notified: null };
  }
}
