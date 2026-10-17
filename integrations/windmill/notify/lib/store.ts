/**
 * The hub's storage, as dispatch and digest use it. db.ts implements it on
 * the `notify` database (schema.sql); memory-store.ts in memory, for tests
 * and for trying a policy. Every method that depends on the time takes it,
 * so a test can move the clock.
 */
import type { EventStatus, NotifyEvent } from "./event.ts";
import type { DeliveryKind, KeyState } from "./policy.ts";

export interface StoredEvent extends NotifyEvent {
  /** bigserial, as text. */
  id: string;
  receivedAt: string;
}

export type Channel = "push" | "email";

export interface ClaimedDelivery {
  id: string;
  channel: Channel;
  kind: DeliveryKind;
  count: number;
  /** Including this one. */
  attempts: number;
  event: StoredEvent;
}

export type DeliveryOutcome =
  | { status: "sent" }
  | { status: "pending"; error: string; retryAt: Date }
  | { status: "failed"; error: string };

export interface SweepCandidate {
  key: string;
  state: KeyState;
  event: StoredEvent;
}

/** Inside one transaction: rows claimed here stay locked until it ends. */
export interface NotifyTx {
  /** Unrouted events, oldest first, FOR UPDATE SKIP LOCKED. */
  claimUnrouted(limit: number): Promise<StoredEvent[]>;
  /** The key's state, locked (null: never seen). */
  lockKey(key: string): Promise<KeyState | null>;
  /** lastEventId null keeps the current one. */
  saveKey(key: string, state: KeyState, lastEventId: string | null, now: Date): Promise<void>;
  markRouted(eventId: string, outcome: { rule: string; duplicate: boolean; digest: boolean; keepPii: boolean }, now: Date): Promise<void>;
  addDelivery(eventId: string, channel: Channel, kind: DeliveryKind, count: number, now: Date): Promise<void>;
  /** Keys that may owe a reminder or a collapsed summary, with the event to render it from; locked. */
  claimSweepKeys(now: Date, reminderMinutes: number, collapseMinutes: number, limit: number): Promise<SweepCandidate[]>;
  /** Digest events not yet sent in a digest, oldest first; locked. */
  claimDigest(limit: number): Promise<StoredEvent[]>;
  markDigested(ids: string[], now: Date): Promise<void>;
}

export interface NotifyStore {
  transaction<T>(fn: (tx: NotifyTx) => Promise<T>): Promise<T>;
  insertEvent(event: NotifyEvent, now: Date): Promise<string>;
  /**
   * firing or resolved, per dedupeKey starting with `prefix`, as the hub will
   * see it: the latest event not routed yet, else the key's state. For
   * producers that report a condition on a schedule (f/platform/health), so
   * they send a change, not every check.
   */
  keyStatuses(prefix: string): Promise<Record<string, EventStatus>>;
  /** Sends interrupted mid-way (a crashed run) go back to pending, or fail once out of tries. */
  recoverStuck(now: Date, maxAttempts: number): Promise<number>;
  /** Due pending deliveries, marked sending with attempts + 1 (FOR UPDATE SKIP LOCKED, committed). */
  claimDeliveries(now: Date, limit: number, maxAttempts: number): Promise<ClaimedDelivery[]>;
  finishDelivery(id: string, outcome: DeliveryOutcome, now: Date): Promise<void>;
  addDelivery(eventId: string, channel: Channel, kind: DeliveryKind, count: number, now: Date): Promise<void>;
  /** Clears the event's pii once no push that may show it is still to send. */
  releasePii(eventId: string): Promise<void>;
  /** Clears pii on events received before this time, whatever their deliveries. */
  clearPiiBefore(before: Date): Promise<number>;
  /** Deletes events (and their deliveries) received before this time; keys whose event is gone keep their state. */
  purgeBefore(before: Date): Promise<number>;
}
