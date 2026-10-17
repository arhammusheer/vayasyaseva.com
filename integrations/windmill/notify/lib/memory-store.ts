/**
 * NotifyStore in memory, with the same rules as db.ts's SQL (claims,
 * attempts, recovery, pii release). For the tests, and to try a policy
 * against a list of events without a database.
 */
import type { NotifyEvent } from "./event.ts";
import type { DeliveryKind, KeyState } from "./policy.ts";
import type { Channel, ClaimedDelivery, DeliveryOutcome, NotifyStore, NotifyTx, StoredEvent } from "./store.ts";

export interface MemoryEvent extends StoredEvent {
  routedAt: string | null;
  rule: string | null;
  duplicate: boolean;
  digest: boolean;
  digestedAt: string | null;
}

export interface MemoryDelivery {
  id: string;
  eventId: string;
  channel: Channel;
  kind: DeliveryKind;
  count: number;
  status: "pending" | "sending" | "sent" | "failed";
  attempts: number;
  nextAttemptAt: number;
  lastError: string | null;
  updatedAt: number;
}

export interface MemoryKey {
  state: KeyState;
  lastEventId: string | null;
}

/** A sending row older than this is an interrupted run (dispatch's budget is 40 s). */
export const STUCK_SENDING_MS = 10 * 60_000;

export function memoryStore() {
  const events: MemoryEvent[] = [];
  const deliveries: MemoryDelivery[] = [];
  const keys = new Map<string, MemoryKey>();
  let seq = 0;
  const event = (id: string) => events.find((e) => e.id === id)!;
  const stored = (e: MemoryEvent): StoredEvent => {
    const copy: Partial<MemoryEvent> = structuredClone(e);
    for (const key of ["routedAt", "rule", "duplicate", "digest", "digestedAt"] as const) delete copy[key];
    return copy as StoredEvent;
  };
  const add = (eventId: string, channel: Channel, kind: DeliveryKind, count: number, now: Date) => {
    deliveries.push({ id: String(++seq), eventId, channel, kind, count, status: "pending", attempts: 0, nextAttemptAt: now.getTime(), lastError: null, updatedAt: now.getTime() });
  };

  const tx: NotifyTx = {
    async claimUnrouted(limit) {
      return events.filter((e) => !e.routedAt).slice(0, limit).map(stored);
    },
    async lockKey(key) {
      const k = keys.get(key);
      return k ? { ...k.state } : null;
    },
    async saveKey(key, state, lastEventId) {
      const k = keys.get(key);
      keys.set(key, { state: { ...state }, lastEventId: lastEventId ?? k?.lastEventId ?? null });
    },
    async markRouted(eventId, o, now) {
      const e = event(eventId);
      Object.assign(e, { routedAt: now.toISOString(), rule: o.rule, duplicate: o.duplicate, digest: o.digest });
      if (!o.keepPii) delete e.pii;
    },
    async addDelivery(eventId, channel, kind, count, now) {
      add(eventId, channel, kind, count, now);
    },
    async claimSweepKeys(now, reminderMinutes, collapseMinutes, limit) {
      const t = now.getTime();
      const due = [...keys.entries()].filter(([, k]) => {
        if (!k.lastEventId || !k.state.lastPushAt) return false;
        const since = t - Date.parse(k.state.lastPushAt);
        return (k.state.status === "firing" && k.state.firingPushed && since >= reminderMinutes * 60_000) || (k.state.pendingCount > 0 && since >= collapseMinutes * 60_000);
      });
      return due.slice(0, limit).map(([key, k]) => ({ key, state: { ...k.state }, event: stored(event(k.lastEventId!)) }));
    },
    async claimDigest(limit) {
      return events.filter((e) => e.digest && !e.digestedAt && e.routedAt).slice(0, limit).map(stored);
    },
    async markDigested(ids, now) {
      for (const id of ids) event(id).digestedAt = now.toISOString();
    },
  };

  const store: NotifyStore = {
    async transaction(fn) {
      // All or nothing, as a database transaction would be.
      const snapshot = structuredClone({ events, deliveries, keys: [...keys.entries()], seq });
      try {
        return await fn(tx);
      } catch (err) {
        events.splice(0, events.length, ...snapshot.events);
        deliveries.splice(0, deliveries.length, ...snapshot.deliveries);
        keys.clear();
        for (const [k, v] of snapshot.keys) keys.set(k, v);
        seq = snapshot.seq;
        throw err;
      }
    },
    async insertEvent(e: NotifyEvent, now) {
      const id = String(++seq);
      events.push({ ...structuredClone(e), id, receivedAt: now.toISOString(), routedAt: null, rule: null, duplicate: false, digest: false, digestedAt: null });
      return id;
    },
    async keyStatuses(prefix) {
      const out: Record<string, "firing" | "resolved"> = {};
      for (const [key, k] of keys) if (key.startsWith(prefix) && k.state.status) out[key] = k.state.status;
      for (const e of events) if (!e.routedAt && e.status && e.dedupeKey.startsWith(prefix)) out[e.dedupeKey] = e.status;
      return out;
    },
    async recoverStuck(now, maxAttempts) {
      let n = 0;
      for (const d of deliveries) {
        if (d.status === "sending" && now.getTime() - d.updatedAt >= STUCK_SENDING_MS) {
          d.status = d.attempts >= maxAttempts ? "failed" : "pending";
          d.lastError = "interrupted";
          d.updatedAt = now.getTime();
          n++;
        }
      }
      return n;
    },
    async claimDeliveries(now, limit, maxAttempts) {
      const due = deliveries.filter((d) => d.status === "pending" && d.nextAttemptAt <= now.getTime() && d.attempts < maxAttempts).slice(0, limit);
      return due.map((d): ClaimedDelivery => {
        d.status = "sending";
        d.attempts += 1;
        d.updatedAt = now.getTime();
        return { id: d.id, channel: d.channel, kind: d.kind, count: d.count, attempts: d.attempts, event: stored(event(d.eventId)) };
      });
    },
    async finishDelivery(id, outcome: DeliveryOutcome, now) {
      const d = deliveries.find((x) => x.id === id)!;
      d.status = outcome.status;
      d.updatedAt = now.getTime();
      if (outcome.status !== "sent") d.lastError = outcome.error;
      if (outcome.status === "pending") d.nextAttemptAt = outcome.retryAt.getTime();
    },
    async addDelivery(eventId, channel, kind, count, now) {
      add(eventId, channel, kind, count, now);
    },
    async releasePii(eventId) {
      const open = deliveries.some((d) => d.eventId === eventId && d.channel === "push" && (d.status === "pending" || d.status === "sending"));
      if (!open) delete event(eventId).pii;
    },
    async clearPiiBefore(before) {
      let n = 0;
      for (const e of events) {
        if (e.pii && Date.parse(e.receivedAt) < before.getTime()) {
          delete e.pii;
          n++;
        }
      }
      return n;
    },
    async purgeBefore(before) {
      const gone = new Set(events.filter((e) => Date.parse(e.receivedAt) < before.getTime()).map((e) => e.id));
      events.splice(0, events.length, ...events.filter((e) => !gone.has(e.id)));
      deliveries.splice(0, deliveries.length, ...deliveries.filter((d) => !gone.has(d.eventId)));
      for (const k of keys.values()) if (k.lastEventId && gone.has(k.lastEventId)) k.lastEventId = null;
      return gone.size;
    },
  };

  return { store, events, deliveries, keys };
}
