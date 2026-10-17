/**
 * f/platform/health's report to the notification hub: every 15 minutes, each
 * condition that needs a person is a `platform.*` event with a stable
 * dedupeKey (platform:health:<database>:<reason>[:<target>]). It is sent
 * when it starts firing and when it clears, not at every check: the hub's
 * key states (NotifyStore.keyStatuses) say what is already firing, and the
 * routing table's firing_daily rule adds the daily reminder while it fires.
 * The hub's own dedupe (a second firing is a duplicate) backs this up.
 *
 * Counts and references only: health never reads a person's details.
 */
import type { EventStatus, Severity } from "../../notify/lib/event.ts";
import { emit, type EmitInput } from "../../notify/lib/emit.ts";
import type { NotifyStore } from "../../notify/lib/store.ts";
import type { Counts, Health } from "./run-health.ts";

export const HEALTH_KEY_PREFIX = "platform:health:";
const OPERATIONS = "https://github.com/arhammusheer/vayasyaseva.com/blob/main/integrations/windmill/OPERATIONS.md";

type Reason = "dead" | "unknown" | "stuck" | "overdue";
const REASONS: Record<Reason, { type: string; severity: Severity; what: (target: string) => string; next: string }> = {
  dead: {
    type: "platform.deliveries_dead",
    severity: "warning",
    what: (t) => `${t} deliveries stopped (attempt cap)`,
    next: "Fix the cause, then reset the rows (OPERATIONS.md, stuck and dead work).",
  },
  unknown: {
    type: "platform.sms_unknown",
    severity: "notice",
    what: () => "SMS sends interrupted (unknown)",
    next: "Check Fast2SMS's delivery history, then retry or settle each by hand (OPERATIONS.md). Never resent automatically.",
  },
  stuck: {
    type: "platform.deliveries_stuck",
    severity: "warning",
    what: (t) => `${t} deliveries running for over 15 minutes`,
    next: "A run may have crashed; the dispatcher recovers them. If this stays, check the Windmill runs.",
  },
  overdue: {
    type: "platform.deliveries_overdue",
    severity: "critical",
    what: (t) => `${t} deliveries overdue by an hour`,
    next: "The dispatcher or the lead sync is not running: check its schedule and the Windmill workers.",
  },
};

const DATABASES = { talent: "Job applications", leads: "Lead inbox" } as const;
type Database = keyof typeof DATABASES;
const TARGETS: Record<string, string> = { sms: "SMS", chatwoot: "Chatwoot", crm: "Twenty" };

export interface Condition {
  key: string;
  type: string;
  severity: Severity;
  title: string;
  summary: string;
}

/** The type, severity and title of a health key (the same for its firing and its resolution). */
export function describeKey(key: string): Omit<Condition, "summary"> {
  const [db, reason, target = ""] = key.slice(HEALTH_KEY_PREFIX.length).split(":");
  const where = DATABASES[db as Database] ?? db;
  if (reason === "unreadable") return { key, type: "platform.db_unreadable", severity: "critical", title: `${where}: health check cannot read the database` };
  if (reason === "erasure_failed") return { key, type: "platform.erasure_failed", severity: "warning", title: `${where}: erasure requests failed` };
  const r = REASONS[reason as Reason];
  if (!r) return { key, type: "platform.health", severity: "warning", title: `${where}: ${reason}` };
  return { key, type: r.type, severity: r.severity, title: `${where}: ${r.what(TARGETS[target] ?? target)}` };
}

/** What is wrong now, and which databases could be read (a key of an unread one is never resolved). */
export function healthConditions(health: Health): { firing: Condition[]; checked: Database[] } {
  const firing: Condition[] = [];
  const checked: Database[] = [];
  for (const db of Object.keys(DATABASES) as Database[]) {
    const counts: Counts | null = health[db];
    if (!counts) {
      firing.push({
        ...describeKey(`${HEALTH_KEY_PREFIX}${db}:unreadable`),
        summary: "f/platform/health could not read it, so dead or stuck work there would go unseen. Check pg-main and the Windmill variable.",
      });
      continue;
    }
    checked.push(db);
    for (const reason of Object.keys(REASONS) as Reason[]) {
      for (const [target, count] of Object.entries(counts[reason])) {
        if (!count) continue;
        firing.push({
          ...describeKey(`${HEALTH_KEY_PREFIX}${db}:${reason}:${target}`),
          summary: `${count} now${counts.oldest ? `; the oldest open item in this database dates from ${counts.oldest.slice(0, 16).replace("T", " ")} UTC` : ""}. ${REASONS[reason].next}`,
        });
      }
    }
  }
  const erasure = health.talent?.erasureFailed ?? 0;
  if (erasure) {
    firing.push({
      ...describeKey(`${HEALTH_KEY_PREFIX}talent:erasure_failed`),
      summary: `${erasure} failed after three attempts. The person's data is still held: fix the cause and requeue (OPERATIONS.md, retention and erasure).`,
    });
  }
  return { firing, checked };
}

const event = (c: Pick<Condition, "key" | "type" | "severity" | "title" | "summary">, status: EventStatus): EmitInput => ({
  source: "platform",
  type: c.type,
  severity: c.severity,
  dedupeKey: c.key,
  status,
  title: c.title,
  summary: c.summary,
  link: { label: "Operations", url: OPERATIONS },
});

export interface HealthNotifyResult {
  fired: string[];
  resolved: string[];
  unchanged: number;
}

/**
 * The events to send for this check: a firing for each condition the hub
 * does not already have firing, a resolution for each firing key that is
 * clear now (only for databases this check could read).
 */
export async function healthEvents(health: Health, store: Pick<NotifyStore, "keyStatuses">): Promise<{ events: EmitInput[]; result: HealthNotifyResult }> {
  const { firing, checked } = healthConditions(health);
  const known = await store.keyStatuses(HEALTH_KEY_PREFIX);
  const events: EmitInput[] = [];
  const result: HealthNotifyResult = { fired: [], resolved: [], unchanged: 0 };
  const now = new Set(firing.map((c) => c.key));
  for (const c of firing) {
    if (known[c.key] === "firing") result.unchanged++;
    else {
      events.push(event(c, "firing"));
      result.fired.push(c.key);
    }
  }
  for (const [key, status] of Object.entries(known)) {
    if (status !== "firing" || now.has(key)) continue;
    const [db, reason] = key.slice(HEALTH_KEY_PREFIX.length).split(":");
    // A database this check could not read: its counts are unknown, so nothing there is resolved.
    if (reason !== "unreadable" && !checked.includes(db as Database)) continue;
    events.push(event({ ...describeKey(key), summary: "Clear at the latest health check." }, "resolved"));
    result.resolved.push(key);
  }
  return { events, result };
}

/** Sends this check's changes through the hub's store (one notify connection for the run). */
export async function notifyHealth(health: Health, store: NotifyStore, now = new Date()): Promise<HealthNotifyResult> {
  const { events, result } = await healthEvents(health, store);
  for (const e of events) await emit(e, { store, now });
  return result;
}
