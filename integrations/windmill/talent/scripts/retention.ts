/**
 * f/talent/retention: hourly. The 12-month rule and erasure requests
 * (privacy notice §10): queues expired people, then erases one queued
 * person per run: R2 files, Chatwoot contacts, Twenty CRM records (with
 * their attachments, under the dispatcher's lock), then
 * their rows.
 */
import { deleteContact } from "../lib/chatwoot.ts";
import { withTalentDb } from "../lib/db.ts";
import { deleteObject } from "../lib/r2.ts";
import { runRetention } from "../lib/run-retention.ts";
import { erasePerson } from "../lib/crm.ts";
import { twentyFromConfig } from "../lib/twenty.ts";

export async function main() {
  const crm = await twentyFromConfig();
  return withTalentDb((query) =>
    runRetention({ query, deleteFile: deleteObject, deleteContact, eraseCrmPerson: (phone) => erasePerson(crm, phone) }),
  );
}
