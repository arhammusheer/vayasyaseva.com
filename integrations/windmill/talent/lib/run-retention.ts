/**
 * What the retention script does, step by step, with its outside world injected so the tests can
 * run every path. The order of steps is the retired n8n workflow's (removed 17 Oct 2026; in git history).
 */
import { contactsToDelete, filesToDelete } from "./erasure.ts";
import { CLAIM_ERASURE, DELETE_ROWS, QUEUE_EXPIRED_AND_RECOVER } from "./sql.ts";
import type { ClaimedErasure } from "./types.ts";
import type { Query } from "./db.ts";

// --- retention ------------------------------------------------------------------

export interface RetentionDeps {
  query: Query;
  deleteFile: (key: string) => Promise<void>;
  deleteContact: (contactId: number) => Promise<void>;
  /** Removes the person and their applications and communications from Twenty; returns how many people. */
  eraseCrmPerson: (phone: string) => Promise<number>;
}

export interface RetentionResult {
  recovered: number;
  queued: number;
  erased: { requestId: string; files: number; contacts: number; crmPeople: number } | null;
}

/**
 * Queues everyone past the 12-month rule, then erases one queued person:
 * R2 files, then Chatwoot contacts, then their Twenty CRM records, then
 * their rows. Any R2, Chatwoot or Twenty failure throws before a row is
 * deleted; the request goes back to pending after an hour and fails after
 * three attempts.
 */
export async function runRetention(deps: RetentionDeps): Promise<RetentionResult> {
  const [counts] = await deps.query<{ recovered: string | number; queued: string | number }>(QUEUE_EXPIRED_AND_RECOVER);
  const result: RetentionResult = { recovered: Number(counts?.recovered ?? 0), queued: Number(counts?.queued ?? 0), erased: null };
  const [claimed] = await deps.query<ClaimedErasure>(CLAIM_ERASURE);
  if (!claimed?.id) return result;
  for (const key of filesToDelete(claimed)) await deps.deleteFile(key);
  for (const id of contactsToDelete(claimed)) await deps.deleteContact(id);
  const crmPeople = await deps.eraseCrmPerson(claimed.phone);
  await deps.query(DELETE_ROWS, [claimed.id, claimed.phone, claimed.files.length, claimed.contacts.length]);
  result.erased = { requestId: claimed.id, files: claimed.files.length, contacts: claimed.contacts.length, crmPeople };
  return result;
}
