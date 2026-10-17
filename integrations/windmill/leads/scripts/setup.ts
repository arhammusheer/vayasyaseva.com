/**
 * f/leads/setup: applies the lead inbox schema (leads/schema.sql). Safe to
 * re-run; deploy.mts runs it on every deploy, before the schedules.
 */
import { withDatabase } from "../../talent/lib/db.ts";
import { schemaStatements } from "../../talent/lib/sql.ts";

export async function main() {
  await withDatabase("leads_pg_url", (query) => query(schemaStatements(__LEADS_SCHEMA__)));
  return { ok: true };
}
