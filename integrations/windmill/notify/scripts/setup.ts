/**
 * f/notify/setup: applies the notify schema (notify/schema.sql) to the
 * `notify` database. Safe to re-run; deploy.mts runs it on every deploy,
 * before the schedules.
 */
import { notifySchemaStatements, withNotifyDb } from "../lib/db.ts";

export async function main() {
  await withNotifyDb((sql) => sql.unsafe(notifySchemaStatements(__NOTIFY_SCHEMA__)));
  return { ok: true };
}
