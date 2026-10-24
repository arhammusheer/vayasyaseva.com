/**
 * What a push, an email and the digest say. Personal data appears in one
 * place only: the message of a push whose rule allows it (pii full: name and
 * the full phone number, with a Call action; masked: name, company and a
 * masked phone). Titles, emails, reminders, resolutions and the digest are
 * built from title and summary, which validateEvent has already scrubbed.
 */
import { maskPhone, telUrl, type NotifyEvent, type Severity } from "./event.ts";
import { RESOLVED_PRIORITY, type DeliveryKind, type Route } from "./policy.ts";

export interface NtfyAction {
  action: "view";
  label: string;
  url: string;
  clear?: boolean;
}

/** ntfy's JSON publish body (POST / with the topic inside). */
export interface NtfyMessage {
  topic: string;
  title: string;
  message: string;
  priority: number;
  tags: string[];
  click?: string;
  actions?: NtfyAction[];
}

export interface EmailMessage {
  subject: string;
  text: string;
}

const SEVERITY_TAG: Record<Severity, string> = { info: "information_source", notice: "bell", warning: "warning", critical: "rotating_light" };

const clip = (value: string, max: number) => (value.length <= max ? value : `${value.slice(0, max - 1)}…`);
const firstLine = (value: string) => value.split("\n").map((l) => l.trim()).find(Boolean) ?? "";

export const IST = "Asia/Kolkata";
export function istTime(iso: string, withDate = true): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-IN", { timeZone: IST, hour: "2-digit", minute: "2-digit", hour12: false });
  if (!withDate) return time;
  return `${d.toLocaleDateString("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric" })} ${time} IST`;
}

/**
 * A resolution's text: when it cleared, then what had fired. Alertmanager
 * sends the firing's annotations again with the resolution, so its summary
 * still describes the problem; "Was:" keeps it from reading as a new one.
 */
const resolvedText = (event: NotifyEvent) => `Cleared at ${istTime(event.occurredAt)}. Was: ${firstLine(event.summary) || event.title}`;

/** The lines a push may show about the person, by the rule's pii level. */
export function piiLines(event: NotifyEvent, route: Route): string[] {
  const pii = event.pii;
  if (!pii || route.pii === "none") return [];
  if (route.pii === "full") {
    return [[pii.name, pii.phone].filter(Boolean).join(" · "), [pii.company, pii.email].filter(Boolean).join(" · ")].filter(Boolean);
  }
  return [[pii.name, pii.company, pii.phone ? maskPhone(pii.phone) : undefined].filter(Boolean).join(" · ")].filter(Boolean);
}

export function renderPush(event: NotifyEvent, route: Route, delivery: { kind: DeliveryKind; count: number }): NtfyMessage {
  const tags = [delivery.kind === "resolved" ? "white_check_mark" : SEVERITY_TAG[event.severity], event.source];
  const base = { topic: route.topic, tags, ...(event.link ? { click: event.link.url } : {}) };
  const linkAction: NtfyAction[] = event.link ? [{ action: "view", label: event.link.label, url: event.link.url }] : [];

  if (delivery.kind === "resolved") {
    return { ...base, title: clip(`Resolved: ${event.title}`, 100), message: clip(resolvedText(event), 300), priority: RESOLVED_PRIORITY, actions: linkAction };
  }
  if (delivery.kind === "reminder") {
    return {
      ...base,
      title: clip(`Still firing: ${event.title}`, 100),
      message: clip(`Firing since ${istTime(event.occurredAt)}. ${firstLine(event.summary)}`.trim(), 300),
      priority: Math.min(route.priority, 3),
      actions: linkAction,
    };
  }
  if (delivery.kind === "collapsed") {
    return {
      ...base,
      title: clip(`${event.title} (${delivery.count} times)`, 100),
      message: clip(`${delivery.count} times since the last notice; latest ${istTime(event.occurredAt, false)}. ${firstLine(event.summary)}`.trim(), 300),
      priority: route.priority,
      actions: linkAction,
    };
  }

  if (route.push === "one_line") {
    return { ...base, title: event.title, message: clip(firstLine(event.summary) || event.title, 140), priority: route.priority, actions: linkAction };
  }
  const people = piiLines(event, route);
  const actions: NtfyAction[] = [];
  const tel = route.call && route.pii === "full" && event.pii?.phone ? telUrl(event.pii.phone) : null;
  if (tel) actions.push({ action: "view", label: "Call", url: tel, clear: false });
  actions.push(...linkAction);
  const message = [...people, event.summary.trim()].filter(Boolean).join("\n") || event.title;
  return { ...base, title: event.title, message: clip(message, 1000), priority: route.priority, actions: actions.slice(0, 3) };
}

export function renderEmail(event: NotifyEvent, kind: DeliveryKind): EmailMessage {
  const label = kind === "resolved" ? "Resolved: " : kind === "fallback" ? "Push failed, by email: " : event.severity === "critical" ? "[critical] " : event.severity === "warning" ? "[warning] " : "";
  const lines = [
    kind === "resolved" ? resolvedText(event) : event.summary.trim(),
    kind !== "resolved" && event.body ? `\n${event.body.trim()}` : "",
    event.link ? `\n${event.link.label}: ${event.link.url}` : "",
    `\n${event.source} · ${event.type}${event.status ? ` · ${kind === "resolved" ? "resolved" : event.status}` : ""} · ${istTime(event.occurredAt)}`,
    kind === "fallback" ? "\nThis was meant to be a push notification; ntfy did not accept it after every try. Check ntfy (apps/ntfy)." : "",
  ];
  return { subject: clip(`${label}${event.title}`, 150), text: `${lines.filter(Boolean).join("\n")}\n` };
}

// --- Digest ---------------------------------------------------------------------------

export interface DigestItem {
  source: string;
  type: string;
  severity: Severity;
  status?: string;
  title: string;
  occurredAt: string;
  link?: { label: string; url: string };
}

export interface DigestGroup {
  source: string;
  count: number;
  types: { type: string; count: number; items: DigestItem[] }[];
}

const SEVERITY_RANK: Record<Severity, number> = { critical: 3, warning: 2, notice: 1, info: 0 };
export const DIGEST_ITEMS_PER_TYPE = 10;

/** By source, then type; the most severe source first, then the busiest. Items oldest first. */
export function groupDigest(items: DigestItem[]): DigestGroup[] {
  const bySource = new Map<string, Map<string, DigestItem[]>>();
  for (const item of items) {
    const types = bySource.get(item.source) ?? new Map<string, DigestItem[]>();
    bySource.set(item.source, types);
    const list = types.get(item.type) ?? [];
    types.set(item.type, list);
    list.push(item);
  }
  const worst = (list: DigestItem[]) => Math.max(...list.map((i) => SEVERITY_RANK[i.severity]));
  return [...bySource.entries()]
    .map(([source, types]) => {
      const all = [...types.values()].flat();
      return {
        source,
        count: all.length,
        worst: worst(all),
        types: [...types.entries()]
          .map(([type, list]) => ({ type, count: list.length, items: [...list].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)) }))
          .sort((a, b) => worst(b.items) - worst(a.items) || b.count - a.count || a.type.localeCompare(b.type)),
      };
    })
    .sort((a, b) => b.worst - a.worst || b.count - a.count || a.source.localeCompare(b.source))
    .map((g) => ({ source: g.source, count: g.count, types: g.types }));
}

export function renderDigest(items: DigestItem[], since: Date, now: Date): EmailMessage & { groups: DigestGroup[] } {
  const groups = groupDigest(items);
  const day = now.toLocaleDateString("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric" });
  const out = [`${items.length} ${items.length === 1 ? "event" : "events"} since ${istTime(since.toISOString())}.`, ""];
  for (const g of groups) {
    out.push(`${g.source} (${g.count})`);
    for (const t of g.types) {
      out.push(`  ${t.type} × ${t.count}`);
      for (const i of t.items.slice(-DIGEST_ITEMS_PER_TYPE)) {
        const mark = i.severity === "critical" || i.severity === "warning" ? ` [${i.severity}]` : "";
        out.push(`    · ${istTime(i.occurredAt, false)}${mark}${i.status === "resolved" ? " resolved:" : ""} ${i.title}${i.link ? ` <${i.link.url}>` : ""}`);
      }
      if (t.items.length > DIGEST_ITEMS_PER_TYPE) out.push(`    · and ${t.items.length - DIGEST_ITEMS_PER_TYPE} earlier`);
    }
    out.push("");
  }
  out.push("Events that had their own email are not repeated here. Routing: Windmill variable f/notify/policy.");
  return { subject: `VSPL daily digest · ${day} · ${items.length} ${items.length === 1 ? "event" : "events"}`, text: `${out.join("\n")}\n`, groups };
}
