/**
 * What f/talent/sync_crm does, with Twenty and the database injected so the
 * tests can drive every path. Each new submission becomes, in Twenty, its
 * person (found by phone), its application and its SMS acknowledgement; a
 * synced submission whose acknowledgement or its delivery changed only has
 * that updated.
 * One failing submission is logged and left for the next run; the rest go on.
 */
import { ackSyncState, ensureApplication, upsertAcknowledgement, upsertPerson, type SyncCandidate } from "./crm.ts";
import { CRM_SYNC_LOCK, RECORD_CRM_SYNC, SYNC_CANDIDATES } from "./sql.ts";
import type { Twenty } from "./twenty.ts";
import type { Query } from "./db.ts";

export interface SyncCrmDeps {
  query: Query;
  crm: Twenty;
  /** Defaults to console.error; tests capture it. */
  log?: (message: string) => void;
}

export interface SyncCrmResult {
  skipped?: "another sync is running";
  /** Twenty answered 429: the run stopped; the rest go next minute. */
  rateLimited?: true;
  created: number;
  updated: number;
  failed: number;
}

/**
 * Twenty allows an API key 100 requests a minute (the leads route shares
 * it). A new submission takes about six; ten a run leaves room.
 */
export const SYNC_BATCH = 10;

/**
 * One submission into Twenty: its person and application unless already
 * there, then the acknowledgement; records what it wrote (crm_sync). Each
 * write finds before it creates, so a retry after a failure adds nothing twice.
 */
export async function syncOne(deps: Pick<SyncCrmDeps, "query" | "crm">, c: SyncCandidate): Promise<void> {
  let personId = c.person_id;
  let applicationId = c.application_id;
  if (!c.synced || !personId || !applicationId) {
    personId = await upsertPerson(deps.crm, c);
    applicationId = await ensureApplication(deps.crm, c, personId);
  }
  if (c.ack_status) await upsertAcknowledgement(deps.crm, c, personId, applicationId);
  await deps.query(RECORD_CRM_SYNC, [c.id, personId, applicationId, ackSyncState(c)]);
}

export async function runSyncCrm(deps: SyncCrmDeps, batch = SYNC_BATCH): Promise<SyncCrmResult> {
  const log = deps.log ?? ((m: string) => console.error(m));
  const result: SyncCrmResult = { created: 0, updated: 0, failed: 0 };
  const [lock] = await deps.query<{ locked: boolean }>(CRM_SYNC_LOCK);
  if (!lock?.locked) return { ...result, skipped: "another sync is running" };
  const candidates = await deps.query<SyncCandidate>(SYNC_CANDIDATES, [batch]);
  for (const c of candidates) {
    try {
      await syncOne(deps, c);
      if (c.synced) result.updated++;
      else result.created++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      if (/HTTP 429/.test(message)) {
        result.rateLimited = true;
        break;
      }
      // The reference, not the person: the job log is read by staff.
      log(`sync ${c.ref} failed: ${message}`);
      result.failed++;
    }
  }
  return result;
}
