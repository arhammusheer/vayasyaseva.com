/**
 * The WhatsApp acknowledgement (20 Oct 2026). The reference goes out first as
 * an approved WhatsApp template from the Business number (+91 78958 50598,
 * Fast2SMS, co-existence with the Business app), so an applicant who replies
 * opens a chat the team answers in the app. The SMS (sms.ts) is the fallback:
 * sent at once when WhatsApp refuses the send or reports a failure, and when
 * the message shows neither delivered nor read within 10 minutes. A delivered
 * WhatsApp message marks the SMS "skipped".
 *
 * Fast2SMS's simple template API (docs.fast2sms.com "Send Template Message
 * (Simple)", GET /dev/whatsapp) and its report lookup (GET /dev/whatsapp/{request_id}).
 * There is no WhatsApp webhook: the dispatcher looks the report up each minute.
 */
import {
  CLAIM_WHATSAPP_ACK,
  GET_ACKNOWLEDGEMENT,
  RECOVER_WHATSAPP_SEND,
  SAVE_WHATSAPP_REPORT,
  SAVE_WHATSAPP_RESULT,
  SKIP_SMS,
  SKIP_WHATSAPP,
} from "./sql.ts";
import type { Query } from "./db.ts";

export const WA_SEND_URL = "https://www.fast2sms.com/dev/whatsapp";
export const WA_REPORT_URL = "https://www.fast2sms.com/dev/whatsapp/";
export const WA_TIMEOUT_MS = 15_000;
/** The Business number's id at Fast2SMS (GET /dev/dlt_manager/whatsapp?type=number). */
export const WA_PHONE_NUMBER_ID = "1426644927192285";
/** Without "delivered" or "read" by then, the SMS goes. */
export const WA_FALLBACK_MS = 10 * 60 * 1000;
/** How long the dispatcher waits between report lookups. */
export const WA_CHECK_SECONDS = 60;

/**
 * Fast2SMS message ids of the approved "application received" templates
 * (the Utility template vspl_application_received), by the submission's
 * language. A language without an approved template gets the SMS straight
 * away, so the code can ship before Meta approves them.
 */
export const WA_TEMPLATES: Partial<Record<string, number>> = {
  "en-IN": 38422,
  "hi-IN": 38423,
  "hi-Latn-IN": 38424,
  "pa-IN": 38425,
  "kn-IN": 38426,
};

/** Stored locales: the BCP 47 tag, or the legacy short code on older rows. */
const LOCALE_ALIASES: Record<string, string> = { en: "en-IN", hi: "hi-IN", hinglish: "hi-Latn-IN" };
export const templateFor = (locale: string | null, templates = WA_TEMPLATES): number | null =>
  templates[LOCALE_ALIASES[locale ?? ""] ?? locale ?? "en-IN"] ?? null;

// --- Sending ------------------------------------------------------------------------

export interface WhatsAppResponse {
  statusCode?: number;
  body?: { status?: unknown; return?: unknown; request_id?: unknown; message?: unknown };
  error?: string;
}

export interface WhatsAppResult {
  status: "accepted" | "failed" | "unknown";
  requestId: string | null;
  error: string | null;
}

export function whatsAppRequestUrl(claim: { ref: string; phone: string }, messageId: number): string {
  const params = new URLSearchParams({
    message_id: String(messageId),
    phone_number_id: WA_PHONE_NUMBER_ID,
    numbers: claim.phone.slice(-10),
    variables_values: claim.ref,
    udf1: claim.ref,
  });
  return `${WA_SEND_URL}?${params}`;
}

/** Like the SMS: only an explicit rejection is a failure; anything unclear is "unknown" (the SMS then goes). */
export function classifyWhatsApp(response: WhatsAppResponse): WhatsAppResult {
  const body = response.body;
  const ok = body?.status === true || body?.return === true;
  const requestId = typeof body?.request_id === "string" && body.request_id ? body.request_id : null;
  if (response.statusCode === 200 && ok && requestId) return { status: "accepted", requestId, error: null };
  const refused = body?.status === false || body?.return === false;
  if (response.statusCode && response.statusCode >= 400 && response.statusCode < 500 && refused) {
    const why = typeof body?.message === "string" ? `: ${body.message.slice(0, 200)}` : "";
    return { status: "failed", requestId: null, error: `Fast2SMS refused the WhatsApp message (HTTP ${response.statusCode})${why}` };
  }
  return { status: "unknown", requestId: null, error: "WhatsApp send outcome uncertain; the SMS goes instead" };
}

/** Never throws: a network error or unreadable body classifies as "unknown". */
export async function sendWhatsAppAck(
  claim: { ref: string; phone: string },
  messageId: number,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<WhatsAppResponse> {
  try {
    const res = await fetchImpl(whatsAppRequestUrl(claim, messageId), {
      headers: { authorization: apiKey },
      signal: AbortSignal.timeout(WA_TIMEOUT_MS),
    });
    let body: WhatsAppResponse["body"];
    try {
      body = (await res.json()) as WhatsAppResponse["body"];
    } catch {
      body = undefined;
    }
    return { statusCode: res.status, body };
  } catch {
    return { error: "request failed" };
  }
}

// --- Reports ------------------------------------------------------------------------

export type WhatsAppDelivery = "read" | "delivered" | "failed" | "pending";

export interface WhatsAppReport {
  outcome: WhatsAppDelivery;
  /** Fast2SMS's status, and its error text on a failure. */
  detail: string;
  at: string | null;
}

const RANK: Record<WhatsAppDelivery, number> = { pending: 0, delivered: 1, read: 2, failed: 3 };

const text = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

/** Fast2SMS's events for one message (sent, delivered, read, failed): the furthest one. */
export function parseWhatsAppReport(raw: unknown): WhatsAppReport | null {
  const entries = (raw as { data?: unknown })?.data;
  if (!Array.isArray(entries) || entries.length === 0) return null;
  let best: WhatsAppReport | null = null;
  for (const e of entries as Record<string, unknown>[]) {
    const status = text(e?.status).toLowerCase();
    if (!status) continue;
    const outcome: WhatsAppDelivery = status === "read" ? "read" : status === "delivered" ? "delivered"
      : /fail|undeliv|reject|error/.test(status) ? "failed" : "pending";
    const errors = text(e.errors);
    const ts = /^\d+$/.test(text(e.timestamp)) ? new Date(Number(text(e.timestamp)) * 1000).toISOString() : null;
    const report = { outcome, detail: (errors && errors !== "null" && errors !== "[]" ? `${status}: ${errors}` : status).slice(0, 300), at: ts };
    if (!best || RANK[outcome] > RANK[best.outcome]) best = report;
  }
  return best;
}

/** Null when Fast2SMS has nothing yet, or the lookup failed. */
export async function lookupWhatsAppReport(requestId: string, apiKey: string, fetchImpl: typeof fetch = fetch): Promise<WhatsAppReport | null> {
  try {
    const res = await fetchImpl(WA_REPORT_URL + encodeURIComponent(requestId), {
      headers: { authorization: apiKey },
      signal: AbortSignal.timeout(WA_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return parseWhatsAppReport(await res.json());
  } catch {
    return null;
  }
}

// --- The step -----------------------------------------------------------------------

export interface WhatsAppAckDeps {
  query: Query;
  /** Null: WhatsApp is not set up here (tests, another workspace); the SMS goes. */
  sendWhatsApp: ((claim: { ref: string; phone: string }, messageId: number) => Promise<WhatsAppResponse>) | null;
  lookupWhatsApp: (requestId: string) => Promise<WhatsAppReport | null>;
  templates?: Partial<Record<string, number>>;
  now?: () => Date;
}

/** done: WhatsApp delivered, no SMS. wait: look again later. sms: send the SMS now. */
export type WhatsAppStep = { kind: "done" } | { kind: "wait"; seconds: number } | { kind: "sms" };

interface AckRow {
  status: string;
  wa_status: string | null;
  wa_request_id: string | null;
  wa_sent_at: string | Date | null;
  wa_delivery: string | null;
  wa_updated_at: string | Date | null;
  ref: string;
  phone: string;
  locale: string | null;
}

const wait: WhatsAppStep = { kind: "wait", seconds: WA_CHECK_SECONDS };
const ms = (v: string | Date | null) => (v ? new Date(v).getTime() : 0);

/** The WhatsApp half of the acknowledgement, before the SMS step. */
export async function runWhatsAppAck(submissionId: string, deps: WhatsAppAckDeps): Promise<WhatsAppStep> {
  const now = (deps.now ?? (() => new Date()))().getTime();
  const [row] = await deps.query<AckRow>(GET_ACKNOWLEDGEMENT, [submissionId]);
  // Already sent by SMS (or skipped): the SMS step reconciles.
  if (!row || row.status !== "pending") return row?.status === "skipped" ? { kind: "done" } : { kind: "sms" };

  if (row.wa_status === null) {
    const template = templateFor(row.locale, deps.templates);
    if (!template || !deps.sendWhatsApp) {
      await deps.query(SKIP_WHATSAPP, [submissionId, template ? "WhatsApp is not set up" : `No approved WhatsApp template for ${row.locale ?? "this language"}`]);
      return { kind: "sms" };
    }
    const [claimed] = await deps.query(CLAIM_WHATSAPP_ACK, [submissionId]);
    if (!claimed) return wait;
    const result = classifyWhatsApp(await deps.sendWhatsApp(row, template));
    await deps.query(SAVE_WHATSAPP_RESULT, [submissionId, result.status, result.requestId, result.error]);
    return result.status === "accepted" ? wait : { kind: "sms" };
  }

  if (row.wa_status === "sending") {
    // An interrupted send may have gone: the SMS goes too rather than nothing.
    if (now - ms(row.wa_updated_at) < 5 * 60 * 1000) return wait;
    await deps.query(RECOVER_WHATSAPP_SEND, [submissionId]);
    return { kind: "sms" };
  }

  if (row.wa_status !== "accepted") return { kind: "sms" };
  if (row.wa_delivery === "delivered" || row.wa_delivery === "read") {
    await deps.query(SKIP_SMS, [submissionId]);
    return { kind: "done" };
  }
  if (row.wa_delivery === "failed") return { kind: "sms" };

  const report = row.wa_request_id ? await deps.lookupWhatsApp(row.wa_request_id) : null;
  if (report) await deps.query(SAVE_WHATSAPP_REPORT, [submissionId, report.outcome, report.detail, report.at]);
  if (report?.outcome === "delivered" || report?.outcome === "read") {
    await deps.query(SKIP_SMS, [submissionId]);
    return { kind: "done" };
  }
  if (report?.outcome === "failed") return { kind: "sms" };
  if (now - ms(row.wa_sent_at) >= WA_FALLBACK_MS) {
    await deps.query(SAVE_WHATSAPP_REPORT, [submissionId, "pending", report?.detail ?? "No delivery report in 10 minutes: SMS sent", null]);
    return { kind: "sms" };
  }
  return wait;
}
