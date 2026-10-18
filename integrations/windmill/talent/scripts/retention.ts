/**
 * f/talent/retention: hourly. The 12-month rule and erasure requests
 * (privacy notice §10): queues expired people, then erases one queued
 * person per run: R2 files, Chatwoot contacts, Twenty CRM records (with
 * their attachments, under the dispatcher's lock), then
 * their rows. Also clears old WhatsApp apply chats (sql.ts PURGE_WHATSAPP).
 */
import { deleteContact } from "../lib/chatwoot.ts";
import { withTalentDb } from "../lib/db.ts";
import { deleteObject } from "../lib/r2.ts";
import { runRetention } from "../lib/run-retention.ts";
import { PURGE_WHATSAPP } from "../lib/sql.ts";
import { erasePerson } from "../lib/crm.ts";
import { twentyFromConfig } from "../lib/twenty.ts";

export async function main() {
  const crm = await twentyFromConfig();
  return withTalentDb(async (query) => {
    const [whatsapp] = await query<{ chats: string | number; messages: string | number }>(PURGE_WHATSAPP);
    const result = await runRetention({ query, deleteFile: deleteObject, deleteContact, eraseCrmPerson: (phone) => erasePerson(crm, phone) });
    return { ...result, whatsapp: { chats: Number(whatsapp?.chats ?? 0), messages: Number(whatsapp?.messages ?? 0) } };
  });
}
