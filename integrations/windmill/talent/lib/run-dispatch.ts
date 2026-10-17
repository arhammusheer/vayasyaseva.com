/**
 * What f/talent/dispatch does (roadmap 1F): the one worker for every
 * application's deliveries, on one connection, so the talent role's
 * five-connection cap holds. Every minute, and right after intake for that
 * application's SMS. It replaces the acknowledge, deliver, sync_crm and
 * delivery_check schedules; each step is the code those scripts ran.
 *
 *   sms       the Fast2SMS acknowledgement (runAcknowledge): accepted → done;
 *             a rejection → dead; a rate limit → retry; an ambiguous or
 *             interrupted send → unknown, never sent again automatically
 *   chatwoot  the conversation, note and files (runDeliver)
 *   crm       the person, application and acknowledgement in Twenty (syncOne);
 *             runs again when the acknowledgement's status changes (trigger)
 *
 * A retry waits 1, 2, 4… minutes (at most an hour); at a target's attempt cap
 * the row is dead and waits for a person (f/platform/health counts it).
 */
import { ackSyncState, type SyncCandidate } from "./crm.ts";
import { runDeliveryCheck, type CheckResult, type DeliveryReport } from "./delivery.ts";
import type { DeliverDeps } from "./run-deliver.ts";
import { runDeliver } from "./run-deliver.ts";
import { runAcknowledge } from "./run-acknowledge.ts";
import { syncOne } from "./run-sync-crm.ts";
import {
  CLAIM_DELIVERY,
  DISPATCH_LOCK,
  FINISH_DELIVERY,
  LEGACY_STATUS,
  RECOVER_INTERRUPTED_SENDS,
  RECOVER_STUCK_DISPATCH,
  RELEASE_SUBMISSION,
  SYNC_CANDIDATE_FOR,
} from "./sql.ts";
import type { ClaimedAcknowledgement, Fast2SmsResponse } from "./types.ts";
import type { Twenty } from "./twenty.ts";
import type { Query } from "./db.ts";
import type { Notify } from "../../notify/lib/emit.ts";

export type Target = "sms" | "chatwoot" | "crm";
export type Outcome = { kind: "done" | "retry" | "unknown" | "dead"; error?: string | null };

export interface DispatchDeps {
  query: Query;
  sendSms: (claim: ClaimedAcknowledgement) => Promise<Fast2SmsResponse>;
  chatwoot: Omit<DeliverDeps, "query">;
  /** Twenty; null when it is not configured (the CRM deliveries wait). */
  crm: Twenty | null;
  lookupReport: (requestId: string) => Promise<DeliveryReport | null>;
  log?: (message: string) => void;
  /** The notification hub: application.received from the CRM step (syncOne). */
  notify?: Notify;
}

export interface DispatchOptions {
  /** Right after intake: only this application's SMS. */
  submissionId?: string | null;
  /** Look up missing SMS delivery reports this run (the schedule does it every 15 minutes). */
  deliveryCheck?: boolean;
}

export interface DispatchResult {
  skipped?: "another dispatcher is running";
  recovered: number;
  done: Record<Target, number>;
  retried: Record<Target, number>;
  failed: Record<Target, number>;
  deliveryCheck?: CheckResult;
}

/** How many of each a run may work (Twenty allows the API key 100 requests a minute; one note per run, as deliver did). */
export const BUDGET: Record<Target, number> = { sms: 5, chatwoot: 1, crm: 10 };

/** Seconds before retry number `attempts` + 1: 1, 2, 4… minutes, at most an hour. */
export const backoffSeconds = (attempts: number) => Math.min(60 * 2 ** Math.max(0, attempts - 1), 3600);

const message = (err: unknown) => (err instanceof Error ? err.message : "unknown error").slice(0, 500);

interface Legacy {
  chatwoot: string | null;
  sms: string | null;
  sms_attempts: number | null;
  crm_synced: boolean;
}

async function legacy(query: Query, submissionId: string): Promise<Legacy | undefined> {
  return (await query<Legacy>(LEGACY_STATUS, [submissionId]))[0];
}

// --- Steps --------------------------------------------------------------------

async function sms(deps: DispatchDeps, submissionId: string): Promise<Outcome> {
  const result = await runAcknowledge(submissionId, { query: deps.query, send: deps.sendSms });
  if (result) {
    if (result.status === "accepted") return { kind: "done" };
    if (result.status === "failed") return { kind: "dead", error: result.error };
    if (result.status === "unknown") return { kind: "unknown", error: result.error };
    return { kind: "retry", error: result.error };
  }
  // Nothing to claim: the acknowledgement already moved (an older run, or not due yet).
  const now = await legacy(deps.query, submissionId);
  if (now?.sms === "accepted") return { kind: "done" };
  if (now?.sms === "failed") return { kind: "dead", error: "Rejected by Fast2SMS" };
  if (now?.sms === "unknown") return { kind: "unknown", error: "Interrupted send; check Fast2SMS delivery history before retrying" };
  if (now?.sms === "pending" && (now.sms_attempts ?? 0) >= 3) return { kind: "dead", error: "Three attempts" };
  return { kind: "retry", error: now ? `Acknowledgement is ${now.sms}` : "No acknowledgement row" };
}

async function chatwoot(deps: DispatchDeps, submissionId: string): Promise<Outcome> {
  try {
    const result = await runDeliver({ query: deps.query, ...deps.chatwoot }, submissionId);
    if (result) return { kind: "done" };
  } catch (err) {
    // Delivered before the failure (a file download): done; the note is there and is never posted twice.
    const now = await legacy(deps.query, submissionId);
    if (now?.chatwoot === "delivered") return { kind: "done", error: message(err) };
    const [released] = await deps.query<{ status: string }>(RELEASE_SUBMISSION, [submissionId, message(err)]);
    return released?.status === "failed" ? { kind: "dead", error: message(err) } : { kind: "retry", error: message(err) };
  }
  const now = await legacy(deps.query, submissionId);
  if (now?.chatwoot === "delivered") return { kind: "done" };
  if (now?.chatwoot === "failed") return { kind: "dead", error: "Failed three times" };
  // Received but not claimable yet (a voice note still transcribing), or another run has it.
  return { kind: "retry", error: now ? `Submission is ${now.chatwoot}` : "No submission" };
}

class RateLimited extends Error {}

async function crm(deps: DispatchDeps, submissionId: string): Promise<Outcome> {
  if (!deps.crm) return { kind: "retry", error: "Twenty is not configured" };
  const [c] = await deps.query<SyncCandidate>(SYNC_CANDIDATE_FOR, [submissionId]);
  if (!c) return { kind: "dead", error: "No submission" };
  // Already there, with this acknowledgement state: nothing to write.
  if (c.synced && c.person_id && c.application_id && c.synced_ack_status === ackSyncState(c)) return { kind: "done" };
  try {
    await syncOne({ query: deps.query, crm: deps.crm, notify: deps.notify }, c);
    return { kind: "done" };
  } catch (err) {
    if (/HTTP 429/.test(message(err))) throw new RateLimited(message(err));
    return { kind: "retry", error: message(err) };
  }
}

const STEPS: Record<Target, (deps: DispatchDeps, submissionId: string) => Promise<Outcome>> = { sms, chatwoot, crm };

// --- The run ----------------------------------------------------------------------

export async function runDispatch(deps: DispatchDeps, options: DispatchOptions = {}): Promise<DispatchResult> {
  const log = deps.log ?? ((m: string) => console.error(m));
  const zero = () => ({ sms: 0, chatwoot: 0, crm: 0 });
  const result: DispatchResult = { recovered: 0, done: zero(), retried: zero(), failed: zero() };
  const [lock] = await deps.query<{ locked: boolean }>(DISPATCH_LOCK);
  // The running dispatcher picks up whatever this run would have done.
  if (!lock?.locked) return { ...result, skipped: "another dispatcher is running" };

  if (!options.submissionId) {
    await deps.query(RECOVER_INTERRUPTED_SENDS);
    result.recovered = (await deps.query(RECOVER_STUCK_DISPATCH)).length;
  }

  const targets: Target[] = options.submissionId ? ["sms"] : ["sms", "chatwoot", "crm"];
  for (const target of targets) {
    for (let n = 0; n < (options.submissionId ? 1 : BUDGET[target]); n++) {
      const [claim] = await deps.query<{ submission_id: string; attempts: number; max_attempts: number }>(CLAIM_DELIVERY, [
        target,
        options.submissionId ?? null,
      ]);
      if (!claim) break;
      let outcome: Outcome;
      let stop = false;
      try {
        outcome = await STEPS[target](deps, claim.submission_id);
      } catch (err) {
        // Twenty's rate limit: retry later, and leave the rest of the CRM work for the next run.
        stop = err instanceof RateLimited;
        outcome = { kind: "retry", error: message(err) };
        if (!stop) log(`${target} ${claim.submission_id} failed: ${message(err)}`);
      }
      const [finished] = await deps.query<{ status: string }>(FINISH_DELIVERY, [
        claim.submission_id,
        target,
        outcome.kind,
        outcome.error ?? null,
        backoffSeconds(claim.attempts),
      ]);
      if (finished?.status === "done") result.done[target]++;
      else if (finished?.status === "pending") result.retried[target]++;
      else result.failed[target]++;
      if (stop) break;
    }
  }

  if (options.deliveryCheck && !options.submissionId) {
    result.deliveryCheck = await runDeliveryCheck({ query: deps.query, lookup: deps.lookupReport });
  }
  return result;
}
