/**
 * The routing policy: which events push, which email, and how. It lives in
 * the Windmill variable f/notify/policy (JSON) so the owner can change it
 * without code; deploy.mts creates it from DEFAULT_POLICY once and leaves
 * edits alone (--reset-notify-policy puts the default back). An unreadable
 * policy falls back to DEFAULT_POLICY, so a typo never silences the hub.
 *
 * Also the two pure decisions dispatch makes with it: decide() for each new
 * event (dedupe, firing/resolved, collapsing) and sweepDecision() for the
 * reminders and collapsed summaries that are due without a new event.
 */
import { SEVERITIES, type EventStatus, type NotifyEvent, type Severity } from "./event.ts";

/**
 * instant          push every new event
 * one_line         push every new event, the summary's first line only
 * firing_daily     push when firing starts, then a reminder every reminderHours while it fires
 * collapsed_hourly push the first, then at most one summary per collapseMinutes for the same dedupeKey
 * none             never push
 */
export const PUSH_MODES = ["instant", "one_line", "firing_daily", "collapsed_hourly", "none"] as const;
export type PushMode = (typeof PUSH_MODES)[number];
/** instant: its own email now; digest: in the 08:00 IST digest; none. */
export const EMAIL_MODES = ["instant", "digest", "none"] as const;
export type EmailMode = (typeof EMAIL_MODES)[number];
/** What personal data a push may show: full (name, full phone, email, company), masked (name, company, masked phone) or none. */
export const PII_LEVELS = ["full", "masked", "none"] as const;
export type PiiLevel = (typeof PII_LEVELS)[number];

export interface PushRule {
  mode: PushMode;
  pii?: PiiLevel;
  /** A Call action (tel:) with the phone number. Needs pii full. */
  call?: boolean;
  /** ntfy topic; default policy.topic. */
  topic?: string;
  /** ntfy priority (1 min … 5 max) by severity; unset severities use DEFAULT_PRIORITY. */
  priority?: Partial<Record<Severity, number>>;
}

export interface Rule {
  /** For the person editing the policy. */
  name: string;
  match: {
    /** Exact (lead.received), a prefix glob (platform.*) or *; a list matches any. */
    type?: string | string[];
    source?: string;
    severity?: Severity[];
  };
  push: PushRule;
  email: EmailMode;
}

export interface Policy {
  v: 1;
  /** The default ntfy topic. */
  topic: string;
  /** Critical events always get an instant email, whatever their rule says. */
  criticalEmail: boolean;
  /** Severities whose push, once it has failed every try, is sent by email instead. */
  fallbackEmail: Severity[];
  reminderHours: number;
  collapseMinutes: number;
  /** First match wins; the last rule should match everything. */
  rules: Rule[];
}

export const DEFAULT_PRIORITY: Record<Severity, number> = { info: 3, notice: 3, warning: 4, critical: 5 };
export const RESOLVED_PRIORITY = 2;

export const DEFAULT_POLICY: Policy = {
  v: 1,
  topic: "vspl-ops",
  criticalEmail: true,
  fallbackEmail: ["critical"],
  reminderHours: 24,
  collapseMinutes: 60,
  rules: [
    {
      name: "New job application: instant, name and full phone, Call",
      match: { type: "application.received" },
      push: { mode: "instant", pii: "full", call: true, topic: "vspl-jobs", priority: { info: 4, notice: 4 } },
      email: "digest",
    },
    {
      name: "Business lead: instant, masked phone; qualified (notice) higher",
      match: { type: "lead.received" },
      push: { mode: "instant", pii: "masked", topic: "vspl-leads", priority: { info: 3, notice: 4 } },
      email: "none",
    },
    {
      name: "Lead not filed or not emailed",
      match: { type: ["lead.forward_failed", "lead.email_failed"] },
      push: { mode: "instant", topic: "vspl-leads", priority: { info: 4, notice: 4, warning: 4 } },
      email: "instant",
    },
    // NFSS's website (nevaehfirstsource.com lib/notify.ts) posts one event per
    // enquiry through the ingest route, as source "website".
    {
      name: "NFSS enquiry not recorded (emailed to company@ only)",
      match: { type: "nfss.enquiry_not_recorded" },
      push: { mode: "instant", topic: "vspl-leads", priority: { info: 4, notice: 4, warning: 5 } },
      email: "instant",
    },
    {
      name: "NFSS enquiry: instant, leads topic",
      match: { type: "nfss.*" },
      push: { mode: "instant", topic: "vspl-leads", priority: { info: 4, notice: 4, warning: 4 } },
      email: "none",
    },
    { name: "SEO weekly report: email only (search data stays off the lock screen)", match: { type: "seo.weekly_report" }, push: { mode: "none" }, email: "instant" },
    { name: "SEO rule tripped", match: { type: "seo.rule_tripped" }, push: { mode: "instant" }, email: "instant" },
    { name: "Compliance source changed (GitHub issue)", match: { type: "compliance.source_changed" }, push: { mode: "instant" }, email: "instant" },
    {
      name: "A monitor did not run",
      match: { type: ["compliance.monitor_failed", "seo.watch_failed"] },
      push: { mode: "instant", priority: { info: 4, notice: 4 } },
      email: "instant",
    },
    { name: "Platform: when firing starts, then daily", match: { type: "platform.*" }, push: { mode: "firing_daily" }, email: "digest" },
    { name: "Windmill job failures, per script, hourly", match: { type: "windmill.job_failed" }, push: { mode: "collapsed_hourly" }, email: "digest" },
    { name: "Alertmanager critical", match: { source: "alertmanager", severity: ["critical"] }, push: { mode: "instant" }, email: "instant" },
    { name: "Alertmanager warning and below", match: { source: "alertmanager" }, push: { mode: "instant" }, email: "digest" },
    { name: "Search pipeline failed", match: { type: "search.pipeline_failed" }, push: { mode: "instant", priority: { info: 4, notice: 4 } }, email: "none" },
    { name: "Everything else: digest only", match: { type: "*" }, push: { mode: "none" }, email: "digest" },
  ],
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Problems with a policy, empty when it is usable. */
export function policyErrors(input: unknown): string[] {
  if (!isRecord(input)) return ["policy must be a JSON object"];
  const errors: string[] = [];
  if (input.v !== 1) errors.push("v must be 1");
  if (typeof input.topic !== "string" || !/^[\w-]{1,64}$/.test(input.topic)) errors.push("topic must be a ntfy topic name");
  if (!Array.isArray(input.rules) || input.rules.length === 0) return [...errors, "rules must be a non-empty list"];
  input.rules.forEach((rule, i) => {
    const at = `rules[${i}]`;
    if (!isRecord(rule) || !isRecord(rule.match) || !isRecord(rule.push)) return void errors.push(`${at} needs match and push`);
    if (!(PUSH_MODES as readonly unknown[]).includes(rule.push.mode)) errors.push(`${at}.push.mode must be one of ${PUSH_MODES.join(", ")}`);
    if (rule.push.pii !== undefined && !(PII_LEVELS as readonly unknown[]).includes(rule.push.pii)) errors.push(`${at}.push.pii must be one of ${PII_LEVELS.join(", ")}`);
    if (rule.push.call && rule.push.pii !== "full") errors.push(`${at}.push.call needs pii full`);
    if (rule.push.topic !== undefined && (typeof rule.push.topic !== "string" || !/^[\w-]{1,64}$/.test(rule.push.topic))) errors.push(`${at}.push.topic must be a ntfy topic name`);
    if (!(EMAIL_MODES as readonly unknown[]).includes(rule.email)) errors.push(`${at}.email must be one of ${EMAIL_MODES.join(", ")}`);
    const sev = rule.match.severity;
    if (sev !== undefined && (!Array.isArray(sev) || sev.some((s) => !(SEVERITIES as readonly unknown[]).includes(s)))) errors.push(`${at}.match.severity must list severities`);
  });
  for (const key of ["reminderHours", "collapseMinutes"] as const) {
    if (typeof input[key] !== "number" || !(input[key] > 0)) errors.push(`${key} must be a positive number`);
  }
  return errors;
}

/** The policy from the variable's text; DEFAULT_POLICY (and the reason) when it does not parse or check. */
export function parsePolicy(text: string | null | undefined): { policy: Policy; problem: string | null } {
  if (!text?.trim()) return { policy: DEFAULT_POLICY, problem: "f/notify/policy is empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { policy: DEFAULT_POLICY, problem: "f/notify/policy is not valid JSON" };
  }
  const errors = policyErrors(parsed);
  if (errors.length) return { policy: DEFAULT_POLICY, problem: `f/notify/policy: ${errors.join("; ")}` };
  const p = parsed as Policy;
  return { policy: { ...p, criticalEmail: p.criticalEmail !== false, fallbackEmail: Array.isArray(p.fallbackEmail) ? p.fallbackEmail : ["critical"] }, problem: null };
}

function typeMatches(pattern: string, type: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith(".*")) return type.startsWith(pattern.slice(0, -1));
  return pattern === type;
}

export type RoutedEvent = Pick<NotifyEvent, "source" | "type" | "severity">;

export interface Route {
  rule: string;
  push: PushMode;
  pii: PiiLevel;
  call: boolean;
  topic: string;
  priority: number;
  email: EmailMode;
}

const NO_RULE: Rule = { name: "(no rule matched)", match: {}, push: { mode: "none" }, email: "digest" };

export function resolveRoute(policy: Policy, event: RoutedEvent): Route {
  const rule =
    policy.rules.find((r) => {
      const types = r.match.type === undefined ? null : Array.isArray(r.match.type) ? r.match.type : [r.match.type];
      if (types && !types.some((t) => typeMatches(t, event.type))) return false;
      if (r.match.source !== undefined && r.match.source !== event.source) return false;
      if (r.match.severity && !r.match.severity.includes(event.severity)) return false;
      return true;
    }) ?? NO_RULE;
  const pii = rule.push.pii ?? "none";
  const email = event.severity === "critical" && policy.criticalEmail ? "instant" : rule.email;
  return {
    rule: rule.name,
    push: rule.push.mode,
    pii,
    call: Boolean(rule.push.call) && pii === "full",
    topic: rule.push.topic ?? policy.topic,
    priority: clampPriority(rule.push.priority?.[event.severity] ?? DEFAULT_PRIORITY[event.severity]),
    email,
  };
}

const clampPriority = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

// --- Decisions ------------------------------------------------------------------------

/** What a delivery says: the event itself, its resolution, a reminder, a collapsed count, or a failed push sent by email. */
export type DeliveryKind = "event" | "resolved" | "reminder" | "collapsed" | "fallback";

/** What the hub remembers per dedupeKey (table notify_keys). */
export interface KeyState {
  status: EventStatus | null;
  /** A push / an instant email was queued for the current firing: its resolution may follow. */
  firingPushed: boolean;
  firingEmailed: boolean;
  lastPushAt: string | null;
  /** collapsed_hourly occurrences not pushed yet. */
  pendingCount: number;
  seenCount: number;
}

export const freshState = (): KeyState => ({ status: null, firingPushed: false, firingEmailed: false, lastPushAt: null, pendingCount: 0, seenCount: 0 });

export interface Decision {
  push: { kind: DeliveryKind; count: number } | null;
  email: { kind: DeliveryKind } | null;
  /** In the next daily digest. */
  digest: boolean;
  /** A repeat (or a resolution of nothing sent): nothing goes out. */
  duplicate: boolean;
  state: KeyState;
}

const minutesSince = (iso: string | null, now: Date) => (iso ? (now.getTime() - Date.parse(iso)) / 60_000 : Infinity);

/**
 * One new event, given what the hub knows about its dedupeKey (null: first
 * time). Pure: dispatch stores the returned state and queues the deliveries.
 */
export function decide(event: Pick<NotifyEvent, "status">, route: Route, prev: KeyState | null, now: Date, policy: Policy = DEFAULT_POLICY): Decision {
  const state: KeyState = { ...(prev ?? freshState()), seenCount: (prev?.seenCount ?? 0) + 1 };
  const pushes = route.push !== "none";
  const emailNow = route.email === "instant" ? { kind: "event" as const } : null;
  const digest = route.email === "digest";
  const nothing = (s: KeyState): Decision => ({ push: null, email: null, digest: false, duplicate: true, state: s });
  const nowIso = now.toISOString();

  if (route.push === "collapsed_hourly" && !event.status) {
    let push: Decision["push"] = null;
    if (minutesSince(state.lastPushAt, now) >= policy.collapseMinutes) {
      push = { kind: state.pendingCount > 0 ? "collapsed" : "event", count: state.pendingCount + 1 };
      state.pendingCount = 0;
      state.lastPushAt = nowIso;
    } else {
      state.pendingCount += 1;
    }
    return { push, email: emailNow, digest, duplicate: false, state };
  }

  if (!event.status) {
    if (prev) return nothing(state);
    if (pushes) state.lastPushAt = nowIso;
    return { push: pushes ? { kind: "event", count: 1 } : null, email: emailNow, digest, duplicate: false, state };
  }

  if (event.status === "firing") {
    if (prev?.status === "firing") return nothing(state);
    state.status = "firing";
    state.firingPushed = pushes;
    state.firingEmailed = emailNow !== null;
    state.pendingCount = 0;
    if (pushes) state.lastPushAt = nowIso;
    return { push: pushes ? { kind: "event", count: 1 } : null, email: emailNow, digest, duplicate: false, state };
  }

  // resolved: only what was sent for the firing is resolved, on the same channel.
  if (prev?.status !== "firing") return nothing({ ...state, status: prev?.status ?? "resolved" });
  const push = prev.firingPushed ? { kind: "resolved" as const, count: 1 } : null;
  const email = prev.firingEmailed ? { kind: "resolved" as const } : null;
  state.status = "resolved";
  state.firingPushed = false;
  state.firingEmailed = false;
  if (push) state.lastPushAt = nowIso;
  return { push, email, digest, duplicate: false, state };
}

/** A reminder or collapsed summary due for a key with no new event, or null. */
export function sweepDecision(state: KeyState, route: Route, now: Date, policy: Policy = DEFAULT_POLICY): { push: { kind: DeliveryKind; count: number }; state: KeyState } | null {
  if (route.push === "firing_daily" && state.status === "firing" && state.firingPushed && minutesSince(state.lastPushAt, now) >= policy.reminderHours * 60) {
    return { push: { kind: "reminder", count: 1 }, state: { ...state, lastPushAt: now.toISOString() } };
  }
  if (route.push === "collapsed_hourly" && state.pendingCount > 0 && minutesSince(state.lastPushAt, now) >= policy.collapseMinutes) {
    return { push: { kind: "collapsed", count: state.pendingCount }, state: { ...state, pendingCount: 0, lastPushAt: now.toISOString() } };
  }
  return null;
}
