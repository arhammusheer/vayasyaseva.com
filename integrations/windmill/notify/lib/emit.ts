/**
 * emit(): how a Windmill script raises a notification. It validates the
 * event (lib/event.ts: title and summary scrubbed of personal data) and
 * inserts it straight into the hub's outbox from the calling script, so
 * personal data in `pii` never becomes a Windmill job argument or log line.
 * f/notify/dispatch sends it within a minute.
 *
 *   import { tryEmit } from "../../notify/lib/emit.ts";
 *   await tryEmit({
 *     source: "talent", type: "application.received", severity: "info",
 *     dedupeKey: `application:${ref}`,
 *     title: "New job application: packer, Haridwar",
 *     summary: `${ref} · quick form · Hindi`,
 *     link: { label: "View in Twenty", url: twentyUrl },
 *     pii: { name, phone },
 *   });
 *
 * emit() throws on an invalid event or a database error; tryEmit() never
 * throws (it logs the error's kind only) and returns whether it was queued,
 * for callers whose own work must not fail because a notification did.
 */
import { pgNotifyStore, withNotifyDb } from "./db.ts";
import { validateEvent, type NotifyEvent } from "./event.ts";
import type { NotifyStore } from "./store.ts";

export type EmitInput = Omit<NotifyEvent, "v" | "occurredAt"> & { v?: 1; occurredAt?: string };

export interface EmitOptions {
  /** Another store (tests, or a script that already holds a notify connection). */
  store?: NotifyStore;
  now?: Date;
}

export class InvalidEventError extends Error {
  readonly errors: string[];
  constructor(errors: string[]) {
    super(`invalid notification event: ${errors.join("; ")}`);
    this.name = "InvalidEventError";
    this.errors = errors;
  }
}

/**
 * How a producer is handed the hub: tryEmit in a Windmill script, a capture
 * in tests. Producers take it as a dependency so their own tests need no
 * notify database.
 */
export type Notify = (input: EmitInput) => Promise<boolean>;

/** Queues one event; returns its id. */
export async function emit(input: EmitInput, options: EmitOptions = {}): Promise<string> {
  const now = options.now ?? new Date();
  const checked = validateEvent({ v: 1, ...input }, now);
  if (!checked.ok) throw new InvalidEventError(checked.errors);
  if (options.store) return options.store.insertEvent(checked.event, now);
  return withNotifyDb((sql) => pgNotifyStore(sql).insertEvent(checked.event, now));
}

/** emit() that never throws: true when queued. */
export async function tryEmit(input: EmitInput, options: EmitOptions = {}): Promise<boolean> {
  try {
    await emit(input, options);
    return true;
  } catch (err) {
    console.error("notify: emit failed:", err instanceof InvalidEventError ? err.message : err instanceof Error ? err.name : "unknown error");
    return false;
  }
}
