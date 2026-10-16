/**
 * f/talent/retention: hourly. The 12-month rule and erasure requests
 * (privacy notice §10): queues expired people, then erases one queued
 * person per run: R2 files, Chatwoot contacts, then their rows.
 */
import { deleteContact } from "../lib/chatwoot.ts";
import { withTalentDb } from "../lib/db.ts";
import { deleteObject } from "../lib/r2.ts";
import { runRetention } from "../lib/run-retention.ts";

export async function main() {
  return withTalentDb((query) => runRetention({ query, deleteFile: deleteObject, deleteContact }));
}
