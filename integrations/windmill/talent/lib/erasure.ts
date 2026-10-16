/**
 * What one erasure removes outside the database, deduplicated: every R2
 * file stored for the person, then every Chatwoot contact linked to their
 * submissions (deleting a contact deletes its conversations). Ported from
 * the n8n "Files to delete" and "Contacts to delete" nodes; an empty list
 * here is what their single null item meant there.
 */
import type { ClaimedErasure } from "./types.ts";

export function filesToDelete(claimed: Pick<ClaimedErasure, "files">): string[] {
  return [...new Set(claimed.files.filter((key) => typeof key === "string" && key.length > 0))];
}

export function contactsToDelete(claimed: Pick<ClaimedErasure, "contacts">): number[] {
  return [...new Set(claimed.contacts.filter((id) => Number.isInteger(id) && id > 0))];
}
