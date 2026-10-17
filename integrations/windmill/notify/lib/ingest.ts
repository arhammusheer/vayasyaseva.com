/**
 * What the webhook routes accept. f/notify/ingest takes one event or
 * { events: [...] } (at most 50) from CronJobs, GitHub Actions and the
 * website. A webhook body becomes a Windmill job argument, so `pii` is
 * refused there: it is dropped in the preprocessor and counted, and only
 * emit() from inside a script may carry personal data.
 */
import { validateEvent, type NotifyEvent } from "./event.ts";

export const INGEST_MAX = 50;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** The body's events as a list, with any pii removed (and how many carried one). */
export function withoutPii(body: unknown): { events: unknown[]; piiDropped: number } {
  const list = isRecord(body) && Array.isArray(body.events) ? body.events : Array.isArray(body) ? body : body === null || body === undefined ? [] : [body];
  let piiDropped = 0;
  const events = list.map((e) => {
    if (!isRecord(e) || !("pii" in e)) return e;
    const { pii, ...rest } = e;
    if (pii !== undefined && pii !== null) piiDropped++;
    return rest;
  });
  return { events, piiDropped };
}

export interface IngestCheck {
  events: NotifyEvent[];
  rejected: { index: number; errors: string[] }[];
}

export function checkIngest(events: unknown[], now: Date = new Date()): IngestCheck {
  if (events.length > INGEST_MAX) return { events: [], rejected: [{ index: -1, errors: [`at most ${INGEST_MAX} events per request`] }] };
  const out: IngestCheck = { events: [], rejected: [] };
  events.forEach((e, index) => {
    const checked = validateEvent(isRecord(e) ? { v: 1, ...e } : e, now);
    if (checked.ok) {
      const event = { ...checked.event };
      delete event.pii;
      out.events.push(event);
    } else out.rejected.push({ index, errors: checked.errors });
  });
  return out;
}
