/**
 * Retention · "Contacts to delete" (run once, after the files). One item per
 * Chatwoot contact linked to the person's submissions; deleting a contact
 * deletes its conversations. With none it returns one item with contactId
 * null, so the run still reaches "Delete rows".
 */
import type { ContactToDelete } from "../types.ts";

export default async function main(): Promise<N8nItem<ContactToDelete>[]> {
  const claimed = $("Claim erasure").first().json;
  const ids = [...new Set(claimed.contacts.filter((id) => Number.isInteger(id) && id > 0))];
  if (!ids.length) return [{ json: { requestId: claimed.id, contactId: null } }];
  return ids.map((contactId) => ({ json: { requestId: claimed.id, contactId } }));
}
