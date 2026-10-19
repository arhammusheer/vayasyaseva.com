/**
 * f/talent/delivery_report: Fast2SMS's SMS delivery reports, through the
 * HTTP route `webhook/fast2sms-dlr` (set up in the Fast2SMS dashboard as
 * fast2sms-webhook.mts describes, with the x-vspl-dlr-secret header, or the
 * secret as ?key= where the form has no custom headers). Marks the
 * acknowledgement delivered or failed; sync_crm carries that to Twenty.
 *
 * The preprocessor keeps only what main needs (no phone number), so the job's
 * args hold the request id and status alone. Reports for messages that are
 * not acknowledgements answer 200 too, so Fast2SMS does not retry them.
 */
import { config } from "../lib/config.ts";
import { withTalentDb } from "../lib/db.ts";
import { parseReport, saveReport } from "../lib/delivery.ts";
import { failed, forbidden, respond } from "../lib/response.ts";
import { secretMatches } from "../lib/secret.ts";

export const SECRET_HEADER = "x-vspl-dlr-secret";


interface HttpEvent {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
}

/** The secret's fallback as ?key=, for a webhook form without custom headers. */
export const SECRET_PARAM = "key";

const KEPT = ["request_id", "status", "status_description", "failure_reason", "delivery_timestamp"] as const;

export async function preprocessor(event: HttpEvent) {
  const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  const expected = await config("fast2sms_dlr_secret");
  const authorized = secretMatches(headers[SECRET_HEADER], expected) || secretMatches(event.query?.[SECRET_PARAM], expected);
  const raw = authorized && event.body && typeof event.body === "object" ? (event.body as Record<string, unknown>) : null;
  const body = raw ? Object.fromEntries(KEPT.filter((k) => k in raw).map((k) => [k, raw[k]])) : null;
  return { authorized, body };
}

export async function main(authorized: boolean, body: unknown) {
  if (!authorized) return forbidden();
  const report = parseReport(body);
  if (!report) return respond(400, { ok: false, error: "Invalid delivery report" });
  try {
    const matched = await withTalentDb((query) => saveReport(query, report));
    return respond(200, { ok: true, matched });
  } catch (err) {
    console.error("delivery report failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
    return failed();
  }
}
