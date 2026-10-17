/**
 * f/leads/intake: the website's crew requests (src/lib/lead-forward.ts,
 * after /api/contact or /api/agent/contact), through the HTTP route
 * `webhook/vspl-lead`. Checks the shared secret, validates, writes the
 * company, contact, crew request and enquiry into Twenty CRM, answers 202.
 *
 * The preprocessor reads the request: only the outcome of the secret check
 * and the body reach main, so the secret never appears in the job's args.
 * Errors never reach the answer (they would carry the lead's details).
 */
import { timingSafeEqual } from "node:crypto";
import { config } from "../../talent/lib/config.ts";
import { respond } from "../../talent/lib/response.ts";
import { twentyFromConfig } from "../../talent/lib/twenty.ts";
import { recordLead, validateLead } from "../lib/lead.ts";

export const SECRET_HEADER = "x-vspl-lead-secret";

export function secretMatches(given: string | undefined, expected: string): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface HttpEvent {
  headers?: Record<string, string>;
  body?: unknown;
}

export async function preprocessor(event: HttpEvent) {
  const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  const authorized = secretMatches(headers[SECRET_HEADER], await config("lead_webhook_secret"));
  return { authorized, body: authorized ? (event.body ?? null) : null };
}

export async function main(authorized: boolean, body: unknown) {
  if (!authorized) return respond(403, { ok: false, error: "Forbidden" });
  const checked = validateLead(body);
  if (!checked.ok) return respond(400, { ok: false, error: `Invalid lead: ${checked.errors.join(", ")}` });
  try {
    const crm = await twentyFromConfig();
    const result = await recordLead(crm, checked.lead);
    return respond(202, { ok: true, caseId: checked.lead.caseId, created: result.created });
  } catch (err) {
    console.error("lead intake failed:", checked.lead.caseId, err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
    return respond(500, { ok: false, error: "Internal error" });
  }
}
