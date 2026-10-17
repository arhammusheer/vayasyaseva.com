/**
 * What f/notify/dispatch (every minute) and f/notify/digest (08:00 IST) do,
 * step by step, with the store and the two senders injected (the tests
 * drive these with memory-store.ts and a mocked fetch).
 *
 * dispatch: 1. sends interrupted by a crash go back to pending; 2. new
 * events are routed (dedupe, firing/resolved, collapsing) into the outbox in
 * one transaction; 3. reminders and collapsed summaries that are due join
 * it; 4. due deliveries are claimed (SKIP LOCKED) and sent, each up to four
 * tries; a push that fails every try is emailed when its severity is in
 * policy.fallbackEmail (critical); 5. personal data older than a day is
 * cleared whatever happened.
 */
import { decide, resolveRoute, sweepDecision, type Policy } from "./policy.ts";
import { renderDigest, renderEmail, renderPush } from "./render.ts";
import type { NtfyClient } from "./ntfy.ts";
import type { ResendClient } from "./resend.ts";
import type { ClaimedDelivery, NotifyStore } from "./store.ts";

/** The first try and three retries. */
export const MAX_ATTEMPTS = 4;
/** Wait before retry n (after try n). */
export const RETRY_DELAYS_MS = [60_000, 2 * 60_000, 5 * 60_000];
export const ROUTE_BATCH = 100;
export const SEND_BATCH = 10;
/** Personal data is never kept longer than this, sent or not. */
export const PII_MAX_HOURS = 24;
/** Events (titles and summaries only by then) are deleted after this. */
export const EVENT_RETENTION_DAYS = 90;

export interface DispatchDeps {
  store: NotifyStore;
  policy: Policy;
  ntfy: NtfyClient;
  resend: ResendClient;
  now?: () => Date;
  /** Stop claiming more deliveries after this long (the schedule runs every minute). */
  budgetMs?: number;
}

export interface DispatchResult {
  recovered: number;
  routed: number;
  duplicates: number;
  swept: number;
  sent: number;
  retrying: number;
  failed: number;
  fallbacks: number;
  piiCleared: number;
}

export async function runDispatch(deps: DispatchDeps): Promise<DispatchResult> {
  const clock = deps.now ?? (() => new Date());
  const { store, policy } = deps;
  const started = clock();
  const result: DispatchResult = { recovered: 0, routed: 0, duplicates: 0, swept: 0, sent: 0, retrying: 0, failed: 0, fallbacks: 0, piiCleared: 0 };

  result.recovered = await store.recoverStuck(started, MAX_ATTEMPTS);

  await store.transaction(async (tx) => {
    for (const event of await tx.claimUnrouted(ROUTE_BATCH)) {
      const route = resolveRoute(policy, event);
      const prev = await tx.lockKey(event.dedupeKey);
      const d = decide(event, route, prev, started, policy);
      await tx.saveKey(event.dedupeKey, d.state, d.duplicate ? null : event.id, started);
      if (d.push) await tx.addDelivery(event.id, "push", d.push.kind, d.push.count, started);
      if (d.email) await tx.addDelivery(event.id, "email", d.email.kind, 1, started);
      const keepPii = Boolean(event.pii) && d.push?.kind === "event" && route.pii !== "none";
      await tx.markRouted(event.id, { rule: route.rule, duplicate: d.duplicate, digest: d.digest, keepPii }, started);
      result.routed++;
      if (d.duplicate) result.duplicates++;
    }
  });

  await store.transaction(async (tx) => {
    for (const c of await tx.claimSweepKeys(started, policy.reminderHours * 60, policy.collapseMinutes, ROUTE_BATCH)) {
      const due = sweepDecision(c.state, resolveRoute(policy, c.event), started, policy);
      if (!due) continue;
      await tx.saveKey(c.key, due.state, null, started);
      await tx.addDelivery(c.event.id, "push", due.push.kind, due.push.count, started);
      result.swept++;
    }
  });

  const budget = deps.budgetMs ?? 40_000;
  while (clock().getTime() - started.getTime() < budget) {
    const batch = await store.claimDeliveries(clock(), SEND_BATCH, MAX_ATTEMPTS);
    if (batch.length === 0) break;
    for (const delivery of batch) await send(deps, delivery, clock(), result);
  }

  result.piiCleared = await store.clearPiiBefore(new Date(clock().getTime() - PII_MAX_HOURS * 3_600_000));
  return result;
}

async function send(deps: DispatchDeps, d: ClaimedDelivery, now: Date, result: DispatchResult) {
  const { store, policy } = deps;
  const route = resolveRoute(policy, d.event);
  const outcome =
    d.channel === "push"
      ? await deps.ntfy.publish(renderPush(d.event, route, d))
      : await deps.resend.send(renderEmail(d.event, d.kind), `vspl-notify-delivery-${d.id}`);

  if (outcome.ok) {
    await store.finishDelivery(d.id, { status: "sent" }, now);
    if (d.channel === "push") await store.releasePii(d.event.id);
    result.sent++;
    return;
  }
  const error = outcome.error ?? "send failed";
  if (outcome.retryable && d.attempts < MAX_ATTEMPTS) {
    const delay = RETRY_DELAYS_MS[Math.min(d.attempts, RETRY_DELAYS_MS.length) - 1];
    await store.finishDelivery(d.id, { status: "pending", error, retryAt: new Date(now.getTime() + delay) }, now);
    result.retrying++;
    return;
  }
  await store.finishDelivery(d.id, { status: "failed", error }, now);
  result.failed++;
  // Logs carry the delivery and event ids and the service's answer only.
  console.error(`notify: delivery ${d.id} (${d.channel}, event ${d.event.id}, ${d.event.type}) failed after ${d.attempts} tries: ${error}`);
  if (d.channel !== "push") return;
  await store.releasePii(d.event.id);
  const alreadyEmailed = route.email === "instant" && (d.kind === "event" || d.kind === "resolved");
  if (policy.fallbackEmail.includes(d.event.severity) && !alreadyEmailed) {
    await store.addDelivery(d.event.id, "email", "fallback", d.count, now);
    result.fallbacks++;
  }
}

// --- Digest -----------------------------------------------------------------------------

export interface DigestDeps {
  store: NotifyStore;
  resend: ResendClient;
  now?: () => Date;
}

export const DIGEST_LIMIT = 2000;

/** One email with every digest event not yet sent, grouped; nothing to send, no email. Throws when Resend refuses, so the next run retries. */
export async function runDigest(deps: DigestDeps): Promise<{ sent: boolean; events: number; purged: number }> {
  const clock = deps.now ?? (() => new Date());
  const now = clock();
  const { sent, events } = await deps.store.transaction(async (tx) => {
    const items = await tx.claimDigest(DIGEST_LIMIT);
    if (items.length === 0) return { sent: false, events: 0 };
    const dayAgo = new Date(now.getTime() - 24 * 3_600_000);
    const earliest = new Date(Math.min(dayAgo.getTime(), ...items.map((i) => Date.parse(i.receivedAt))));
    const email = renderDigest(items, earliest, now);
    const last = items[items.length - 1].id;
    const outcome = await deps.resend.send(email, `vspl-notify-digest-${now.toISOString().slice(0, 10)}-${last}`);
    if (!outcome.ok) throw new Error(`digest not sent: ${outcome.error ?? "unknown"}`);
    await tx.markDigested(items.map((i) => i.id), now);
    return { sent: true, events: items.length };
  });
  const purged = await deps.store.purgeBefore(new Date(now.getTime() - EVENT_RETENTION_DAYS * 86_400_000));
  return { sent, events, purged };
}
