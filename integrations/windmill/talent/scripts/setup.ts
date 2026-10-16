/**
 * f/talent/setup: applies the talent schema (talent/schema.sql). Safe to
 * re-run; deploy.mts runs it on every deploy, before the schedules.
 */
import { withTalentDb } from "../lib/db.ts";
import { schemaStatements } from "../lib/sql.ts";

export async function main() {
  await withTalentDb((query) => query(schemaStatements(__TALENT_SCHEMA__)));
  return { ok: true };
}
