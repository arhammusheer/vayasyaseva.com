/**
 * What the retention script does, step by step, with its outside world injected so the tests can
 * run every path. The order of steps is the retired n8n workflow's (removed 17 Oct 2026; in git history).
 */
import { contactsToDelete, filesToDelete } from "./erasure.ts";
import { CLAIM_ERASURE, DELETE_ROWS, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, QUEUE_EXPIRED_AND_RECOVER } from "./sql.ts";
import type { ClaimedErasure } from "./types.ts";
import type { Query } from "./db.ts";
import type { ErasedCrm } from "./crm.ts";

// --- retention ------------------------------------------------------------------

export interface RetentionDeps {
  query: Query;
  deleteFile: (key: string) => Promise<void>;
  deleteContact: (contactId: number) => Promise<void>;
  /** Removes the person and their applications, attachments and communications from Twenty. */
  eraseCrmPerson: (phone: string) => Promise<ErasedCrm>;
  /** Waits between tries for the dispatcher's lock (tests pass a no-op). */
  sleep?: (ms: number) => Promise<void>;
}

export interface RetentionResult {
  recovered: number;
  queued: number;
  erased: { requestId: string; files: number; contacts: number; crmPeople: number; crmFiles: number } | null;
}

/** How long erasure waits for a running dispatcher before giving up for this run (the request is retried). */
export const DISPATCH_LOCK_TRIES = 60;
const DISPATCH_LOCK_WAIT_MS = 2_000;

/**
 * Takes the dispatcher's lock, so no dispatch run (which would skip while
 * erasure holds it) adds a Twenty attachment between the Twenty step and
 * the row delete.
 */
async function lockDispatch(deps: RetentionDeps): Promise<void> {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  for (let i = 0; i < DISPATCH_LOCK_TRIES; i++) {
    const [lock] = await deps.query<{ locked: boolean }>(ERASURE_DISPATCH_LOCK);
    if (lock?.locked) return;
    await sleep(DISPATCH_LOCK_WAIT_MS);
  }
  throw new Error("The dispatcher kept running; erasure retried later");
}

/**
 * Queues everyone past the 12-month rule, then erases one queued person:
 * R2 files, then Chatwoot contacts, then their Twenty CRM records (under the
 * dispatcher's lock), then their rows. Any R2, Chatwoot or Twenty failure
 * throws before a row is deleted; the request goes back to pending after an
 * hour and fails after three attempts.
 */
export async function runRetention(deps: RetentionDeps): Promise<RetentionResult> {
  const [counts] = await deps.query<{ recovered: string | number; queued: string | number }>(QUEUE_EXPIRED_AND_RECOVER);
  const result: RetentionResult = { recovered: Number(counts?.recovered ?? 0), queued: Number(counts?.queued ?? 0), erased: null };
  const [claimed] = await deps.query<ClaimedErasure>(CLAIM_ERASURE);
  if (!claimed?.id) return result;
  for (const key of filesToDelete(claimed)) await deps.deleteFile(key);
  for (const id of contactsToDelete(claimed)) await deps.deleteContact(id);
  await lockDispatch(deps);
  try {
    const crm = await deps.eraseCrmPerson(claimed.phone);
    await deps.query(DELETE_ROWS, [claimed.id, claimed.phone, claimed.files.length, claimed.contacts.length, crm.files]);
    result.erased = { requestId: claimed.id, files: claimed.files.length, contacts: claimed.contacts.length, crmPeople: crm.people, crmFiles: crm.files };
  } finally {
    await deps.query(ERASURE_DISPATCH_UNLOCK);
  }
  return result;
}
