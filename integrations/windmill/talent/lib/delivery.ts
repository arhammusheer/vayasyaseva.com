/**
 * Fast2SMS handset delivery of the acknowledgement. Acceptance (sms.ts) only
 * means Fast2SMS took the message; its delivery report says whether the
 * phone got it. Reports arrive at f/talent/delivery_report (the webhook
 * fast2sms-webhook.mts registers); f/talent/delivery_check looks up any
 * that never came with Fast2SMS's DLR API (GET /dev/dlr/{request_id}).
 */
import { DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, SAVE_DELIVERY_REPORT } from "./sql.ts";
import type { Query } from "./db.ts";

export const DLR_URL = "https://www.fast2sms.com/dev/dlr/";
export const DLR_TIMEOUT_MS = 15_000;
/** Lookups a delivery_check run makes. */
export const CHECK_BATCH = 20;

export type DeliveryOutcome = "delivered" | "failed" | "pending";

export interface DeliveryReport {
  requestId: string;
  outcome: DeliveryOutcome;
  /** Fast2SMS's own status and text: "Delivered: Delivered successfully". */
  detail: string;
  deliveredAt: string | null;
}

/** Fast2SMS writes "Delivered", "delivered", "Failed", "Undelivered", "DND"…; unrecognised ones stay pending. */
export function outcomeOf(status: string): DeliveryOutcome {
  const s = status.trim().toLowerCase();
  if (s === "delivered") return "delivered";
  if (/fail|undeliv|reject|expire|dnd|block|invalid|error/.test(s)) return "failed";
  return "pending";
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

/** A Unix timestamp in seconds (number or digits) as ISO, else null. */
export function unixToIso(v: unknown): string | null {
  const n = typeof v === "number" ? v : /^\d+$/.test(text(v)) ? Number(text(v)) : NaN;
  return Number.isFinite(n) && n > 1_000_000_000 ? new Date(n * 1000).toISOString() : null;
}

/** One report: the webhook's body, or one delivery_status entry of a DLR lookup (with its request id). */
export function parseReport(raw: unknown, requestId?: string): DeliveryReport | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = requestId ?? text(r.request_id);
  const status = text(r.status);
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(id) || !status) return null;
  const outcome = outcomeOf(status);
  const description = text(r.status_description) || text(r.failure_reason) || text(r.description);
  return {
    requestId: id,
    outcome,
    detail: (description && description.toLowerCase() !== status.toLowerCase() ? `${status}: ${description}` : status).slice(0, 300),
    deliveredAt: outcome === "delivered" ? unixToIso(r.delivery_timestamp) : null,
  };
}

/** Saves a report against its acknowledgement. Returns how many matched (0: not one of ours). */
export async function saveReport(query: Query, report: DeliveryReport): Promise<number> {
  const rows = await query(SAVE_DELIVERY_REPORT, [report.requestId, report.outcome, report.detail, report.deliveredAt]);
  return rows.length;
}

/** Looks up a request with the DLR API. Null when Fast2SMS has nothing (yet) or the lookup failed. */
export async function lookupReport(requestId: string, apiKey: string, fetchImpl: typeof fetch = fetch): Promise<DeliveryReport | null> {
  try {
    const res = await fetchImpl(DLR_URL + encodeURIComponent(requestId), {
      headers: { authorization: apiKey },
      signal: AbortSignal.timeout(DLR_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { success?: boolean; data?: { request_id?: string; delivery_status?: unknown[] }[] };
    const entry = body?.data?.find((d) => d?.request_id === requestId)?.delivery_status?.[0];
    return body?.success ? parseReport(entry, requestId) : null;
  } catch {
    return null;
  }
}

export interface CheckResult {
  checked: number;
  delivered: number;
  failed: number;
  pending: number;
}

/** delivery_check: looks up acknowledgements whose report has not come. */
export async function runDeliveryCheck(
  deps: { query: Query; lookup: (requestId: string) => Promise<DeliveryReport | null> },
  batch = CHECK_BATCH,
): Promise<CheckResult> {
  const result: CheckResult = { checked: 0, delivered: 0, failed: 0, pending: 0 };
  const due = await deps.query<{ submission_id: string; request_id: string }>(DELIVERY_CHECK_DUE, [batch]);
  for (const row of due) {
    result.checked++;
    const report = await deps.lookup(row.request_id);
    if (report && (await saveReport(deps.query, report))) result[report.outcome]++;
    else {
      await deps.query(MARK_DELIVERY_CHECKED, [row.submission_id]);
      result.pending++;
    }
  }
  return result;
}
