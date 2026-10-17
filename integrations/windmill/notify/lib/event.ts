/**
 * The notification event, schema v1 (docs/notification-hub.md "Event
 * schema"). Every producer (Windmill scripts through emit(), CronJobs and
 * the website through f/notify/ingest, Alertmanager through
 * f/notify/alertmanager) sends this shape; the hub stores it in the
 * `notify` database and f/notify/dispatch routes it by f/notify/policy.
 *
 * title and summary are shown on a phone's lock screen and kept for the
 * digest, so they must never carry personal data: validateEvent scrubs
 * Aadhaar, PAN, phone numbers and email addresses out of them whatever the
 * producer sent. Personal data goes in `pii` only, which the policy renders
 * where it allows and the hub clears once the push is sent.
 */
import { maskIds } from "../../talent/lib/mask.ts";

export const EVENT_SOURCES = ["talent", "leads", "seo-watch", "compliance", "platform", "alertmanager", "github", "website"] as const;
export const SEVERITIES = ["info", "notice", "warning", "critical"] as const;
export const STATUSES = ["firing", "resolved"] as const;

export type EventSource = (typeof EVENT_SOURCES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type EventStatus = (typeof STATUSES)[number];

export interface EventPii {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
}

export interface NotifyEvent {
  v: 1;
  source: EventSource;
  /** Dotted, e.g. application.received, lead.forward_failed, platform.db_down. */
  type: string;
  severity: Severity;
  /** Same key, same thing: a repeat is a duplicate, and firing/resolved pair on it. */
  dedupeKey: string;
  status?: EventStatus;
  /** ISO 8601. */
  occurredAt: string;
  /** ≤ 80 characters, no personal data. */
  title: string;
  /** ≤ 500 characters, no personal data. */
  summary: string;
  /** Email only (instant emails and nothing else); ≤ 20 000 characters. */
  body?: string;
  link?: { label: string; url: string };
  pii?: EventPii;
}

export const TITLE_MAX = 80;
export const SUMMARY_MAX = 500;
export const BODY_MAX = 20_000;
const PII_MAX = 200;

/** Ten or more digits, optionally with +, spaces, dots or dashes between them: a phone number. */
const PHONE_LIKE = /(?<![\w/=-])\+?\d(?:[\s.-]?\d){9,14}(?![\w/-])/g;
const EMAIL_LIKE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

/** No Aadhaar, PAN, phone number or email address: for text that is shown or kept without the policy's say. */
export function scrubText(value: string): string {
  return maskIds(value).replace(EMAIL_LIKE, "[email removed]").replace(PHONE_LIKE, "[phone removed]");
}

const clip = (value: string, max: number) => (value.length <= max ? value : `${value.slice(0, max - 1)}…`);
const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

export type ValidatedEvent = { ok: true; event: NotifyEvent } | { ok: false; errors: string[] };

/**
 * Checks an event from any producer and returns the version the hub stores:
 * title and summary scrubbed and clipped to their limits, the body with IDs
 * masked, pii limited to its four fields (each trimmed, IDs masked).
 */
export function validateEvent(input: unknown, now: Date = new Date()): ValidatedEvent {
  if (!isRecord(input)) return { ok: false, errors: ["event must be an object"] };
  const errors: string[] = [];
  if (input.v !== 1) errors.push("v must be 1");
  const source = str(input.source);
  if (!source || !(EVENT_SOURCES as readonly string[]).includes(source)) errors.push(`source must be one of ${EVENT_SOURCES.join(", ")}`);
  const type = str(input.type);
  if (!type || !/^[a-z][a-z0-9_]*(\.[a-zA-Z0-9_-]+)+$/.test(type) || type.length > 100) errors.push("type must be dotted, e.g. lead.received");
  const severity = str(input.severity);
  if (!severity || !(SEVERITIES as readonly string[]).includes(severity)) errors.push(`severity must be one of ${SEVERITIES.join(", ")}`);
  const dedupeKey = str(input.dedupeKey);
  if (!dedupeKey || dedupeKey.length > 200) errors.push("dedupeKey is required (≤ 200 characters)");
  const status = input.status === undefined || input.status === null ? undefined : str(input.status);
  if (status !== undefined && !(STATUSES as readonly string[]).includes(status)) errors.push("status must be firing or resolved");
  const occurred = str(input.occurredAt);
  const occurredAt = occurred && !Number.isNaN(Date.parse(occurred)) ? new Date(occurred) : null;
  if (occurred !== undefined && !occurredAt) errors.push("occurredAt must be an ISO 8601 time");
  const title = str(input.title);
  if (!title?.trim()) errors.push("title is required");
  const summary = str(input.summary);
  if (summary === undefined) errors.push("summary is required");
  if (input.body !== undefined && input.body !== null && typeof input.body !== "string") errors.push("body must be text");
  let link: NotifyEvent["link"];
  if (input.link !== undefined && input.link !== null) {
    const l = isRecord(input.link) ? input.link : {};
    const url = str(l.url);
    if (!url || !/^https?:\/\//.test(url) || url.length > 2000) errors.push("link.url must be an http(s) URL");
    else link = { label: clip(oneLine(scrubText(str(l.label) ?? "Open")), 40), url };
  }
  let pii: EventPii | undefined;
  if (input.pii !== undefined && input.pii !== null) {
    if (!isRecord(input.pii)) errors.push("pii must be an object");
    else {
      pii = {};
      for (const key of ["name", "phone", "email", "company"] as const) {
        const value = input.pii[key];
        if (value === undefined || value === null || value === "") continue;
        if (typeof value !== "string") errors.push(`pii.${key} must be text`);
        // A phone is digits, + and separators only (maskIds would read +91 and ten digits as an Aadhaar number).
        else if (key === "phone") {
          const phone = value.replace(/[^\d+]/g, "");
          if (!/^\+?\d{6,15}$/.test(phone)) errors.push("pii.phone must be a phone number");
          else pii.phone = phone;
        } else pii[key] = clip(oneLine(maskIds(value)), PII_MAX);
      }
      if (Object.keys(pii).length === 0) pii = undefined;
    }
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    event: {
      v: 1,
      source: source as EventSource,
      type: type!,
      severity: severity as Severity,
      dedupeKey: dedupeKey!,
      ...(status ? { status: status as EventStatus } : {}),
      occurredAt: (occurredAt ?? now).toISOString(),
      title: clip(oneLine(scrubText(title!)), TITLE_MAX),
      summary: clip(scrubText(summary!).trim(), SUMMARY_MAX),
      ...(typeof input.body === "string" && input.body.trim() ? { body: clip(maskIds(input.body), BODY_MAX) } : {}),
      ...(link ? { link } : {}),
      ...(pii ? { pii } : {}),
    },
  };
}

/** India mobile numbers keep the country code and the last four digits: +91 XXXXXX3210. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX";
  const last = digits.slice(-4);
  if (digits.length === 12 && digits.startsWith("91")) return `+91 XXXXXX${last}`;
  return `${"X".repeat(Math.max(2, digits.length - 4))}${last}`;
}

/** A tel: link for the Call action: E.164 for an Indian mobile number, else the digits as given. */
export function telUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return null;
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `tel:+91${digits}`;
  if (digits.length === 12 && /^91[6-9]/.test(digits)) return `tel:+${digits}`;
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits}`;
}
