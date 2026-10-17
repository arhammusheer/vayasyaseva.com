/**
 * The Fast2SMS application acknowledgement (integrations/windmill/OPERATIONS.md,
 * "SMS acknowledgement (Fast2SMS)"): approved DLT sender VAYSPL, Fast2SMS message
 * 227115, the reference as the only variable. Acceptance is not handset
 * delivery, and an ambiguous outcome is never automatically resent.
 */
import type { AcknowledgementResult, ClaimedAcknowledgement, Fast2SmsResponse } from "./types.ts";

export const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";
export const FAST2SMS_TIMEOUT_MS = 15_000;
/** Rate-limited sends retry up to this many attempts in total. */
export const MAX_ATTEMPTS = 3;

/** The request body: the n8n "Fast2SMS: acknowledgement" node's JSON, unchanged. */
export function acknowledgementRequest(claim: Pick<ClaimedAcknowledgement, "ref" | "phone">) {
  return {
    route: "dlt",
    sender_id: "VAYSPL",
    message: "227115",
    variables_values: claim.ref,
    numbers: claim.phone.slice(-10),
    sms_details: "1",
    udf1: claim.ref,
  };
}

/** Classifies Fast2SMS's answer. Only a documented explicit rejection or rate limit is safe to classify. */
export function classifyAcknowledgement(claim: Pick<ClaimedAcknowledgement, "submission_id" | "attempts">, response: Fast2SmsResponse): AcknowledgementResult {
  const body = response.body;
  const accepted = response.statusCode === 200 && body?.return === true
    && typeof body.request_id === "string" && body.request_id.length > 0;
  // Network failures, unexpected bodies and server errors may have sent the SMS.
  const rejected = (response.statusCode === 400 || response.statusCode === 401) && body?.return === false;
  const limited = response.statusCode === 429;
  const status = accepted ? "accepted"
    : limited && claim.attempts < MAX_ATTEMPTS ? "pending"
    : rejected || limited ? "failed" : "unknown";
  return {
    submissionId: claim.submission_id,
    status,
    requestId: accepted ? body!.request_id! : null,
    error: accepted ? null
      : rejected ? `Fast2SMS rejected request (HTTP ${response.statusCode}, code ${body?.status_code ?? "unspecified"})`
      : limited ? "Fast2SMS rate limit"
      : "Send outcome uncertain; check Fast2SMS delivery history before retrying",
  };
}

/**
 * Sends the request and never throws: a network error or an unreadable
 * body becomes a response that classifies as "unknown", like the n8n node's
 * "never error" full response.
 */
export async function sendAcknowledgement(
  claim: Pick<ClaimedAcknowledgement, "ref" | "phone">,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Fast2SmsResponse> {
  try {
    const res = await fetchImpl(FAST2SMS_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: apiKey },
      body: JSON.stringify(acknowledgementRequest(claim)),
      signal: AbortSignal.timeout(FAST2SMS_TIMEOUT_MS),
    });
    let body: Fast2SmsResponse["body"];
    try {
      body = (await res.json()) as Fast2SmsResponse["body"];
    } catch {
      body = undefined;
    }
    return { statusCode: res.status, body };
  } catch {
    // The message may carry request details: keep only that it failed.
    return { error: "request failed" };
  }
}
