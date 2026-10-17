/**
 * The website's events into the notification hub (docs/notification-hub.md):
 * POSTs one event to the hub's public ingest route with the shared secret.
 * Used from after() only, so it never delays or fails a request.
 *
 *   NOTIFY_URL             https://hooks.vayasyaseva.com/api/r/webhook/vspl-notify
 *   NOTIFY_INGEST_SECRET   the x-vspl-notify-secret header (growth/windmill-notify)
 *
 * With either unset it does nothing. The event never carries personal data:
 * no pii (the route would drop it anyway), and the title and summary name the
 * case ID, never the person.
 */

const TIMEOUT_MS = 5_000;

export interface WebsiteEvent {
  type: string;
  severity: "info" | "notice" | "warning" | "critical";
  dedupeKey: string;
  title: string;
  summary: string;
  body?: string;
  link?: { label: string; url: string };
}

export function notifyConfigured(): boolean {
  return Boolean(process.env.NOTIFY_URL?.trim() && process.env.NOTIFY_INGEST_SECRET?.trim());
}

/** True when the hub accepted it (202). Never throws; logs the status only. */
export async function notifyHub(event: WebsiteEvent, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const url = process.env.NOTIFY_URL?.trim();
  const secret = process.env.NOTIFY_INGEST_SECRET?.trim();
  if (!url || !secret) return false;
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-vspl-notify-secret": secret },
      body: JSON.stringify({ v: 1, source: "website", occurredAt: new Date().toISOString(), ...event }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 202) return true;
    console.error("[NOTIFY FAILED]", { type: event.type, status: res.status });
  } catch (error) {
    console.error("[NOTIFY FAILED]", { type: event.type, error: error instanceof Error ? error.name : "unknown" });
  }
  return false;
}
