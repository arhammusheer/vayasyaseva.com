/**
 * How an accepted submission leaves the site for Windmill. One interface for
 * every type, so the routes never know which route carries it.
 *
 *   application  job_application.v1; throws unless Windmill answers 202
 *                (the route answers 502 and the person can retry)
 *   lead         business_enquiry.v1 / compliance_help.v1; retries twice,
 *                never throws, true once Windmill has it in the lead inbox
 *
 * With SUBMISSION_SIGNING_SECRET set, both go as envelope.v1 to the one signed
 * route, webhook/vspl-submission (HMAC over timestamp and body,
 * packages/contracts/src/signing.ts). Without it, the older routes as before
 * (f/talent/intake, f/leads/intake), so the site works before the owner adds
 * the secret.
 */
import { envelopeSchema, type Envelope } from "@vspl/contracts/envelope";
import type { JobApplicationCanonical } from "@vspl/contracts/job-application";
import type { LeadCanonical } from "@vspl/contracts/business-enquiry";
import { signRequest } from "@vspl/contracts/signing";
import { forwardLead } from "@/lib/lead-forward";
import { forwardToIntake } from "@/lib/talent-intake/server";

export interface Transport {
  application(payload: JobApplicationCanonical, meta: { idempotencyKey: string | null }): Promise<void>;
  lead(payload: LeadCanonical, meta: { idempotencyKey: string | null }): Promise<boolean>;
}

/** The older routes: the talent intake webhook and the leads webhook. */
export const webhookTransport: Transport = {
  application: (payload) => forwardToIntake(payload),
  lead: (payload) => forwardLead(payload),
};

const SUBMISSION_URL = "https://hooks.vayasyaseva.com/api/r/webhook/vspl-submission";
const APPLICATION_TIMEOUT_MS = 20_000;
const LEAD_TIMEOUT_MS = 8_000;
/** Waits before the second and third tries of a lead (Windmill files a case ID once). */
const LEAD_RETRY_DELAYS_MS = [1_000, 3_000];

export const signingSecret = () => process.env.SUBMISSION_SIGNING_SECRET?.trim() || null;

/** POSTs a signed envelope; the answer's status. */
async function postEnvelope(envelope: Envelope, timeoutMs: number, fetchImpl: typeof fetch): Promise<number> {
  const secret = signingSecret();
  if (!secret) throw new Error("SUBMISSION_SIGNING_SECRET is not set");
  // Never send what Windmill would refuse: a bug here should fail loudly on our side.
  const checked = envelopeSchema.parse(envelope);
  const body = JSON.stringify(checked);
  const res = await fetchImpl(process.env.SUBMISSION_WEBHOOK_URL?.trim() || SUBMISSION_URL, {
    method: "POST",
    headers: { "content-type": "application/json", ...signRequest(secret, body) },
    body,
    signal: AbortSignal.timeout(timeoutMs),
  });
  return res.status;
}

const envelopeOf = (type: Envelope["type"], id: string, payload: unknown, idempotencyKey: string | null) =>
  ({ v: 1, type, id, payload, idempotencyKey, sentAt: new Date().toISOString() }) as Envelope;

export function envelopeTransport(fetchImpl: typeof fetch = fetch, retryDelays: readonly number[] = LEAD_RETRY_DELAYS_MS): Transport {
  return {
    async application(payload, meta) {
      const status = await postEnvelope(envelopeOf("job_application.v1", payload.ref, payload, meta.idempotencyKey), APPLICATION_TIMEOUT_MS, fetchImpl);
      if (status !== 202) throw new Error(`submission webhook answered ${status}`);
    },
    async lead(payload, meta) {
      const type = payload.requestType === "compliance-help" ? "compliance_help.v1" : "business_enquiry.v1";
      const envelope = envelopeOf(type, payload.caseId, payload, meta.idempotencyKey);
      for (let attempt = 1; ; attempt++) {
        let retry = true;
        try {
          const status = await postEnvelope(envelope, LEAD_TIMEOUT_MS, fetchImpl);
          if (status === 202) {
            console.info("[LEAD FORWARDED]", { caseId: payload.caseId, attempt, route: "vspl-submission" });
            return true;
          }
          retry = status === 429 || status >= 500;
          console.error("[LEAD FORWARD FAILED]", { caseId: payload.caseId, status, attempt });
        } catch (error) {
          console.error("[LEAD FORWARD FAILED]", { caseId: payload.caseId, error: error instanceof Error ? error.name : "unknown", attempt });
          if (error instanceof Error && error.name === "ZodError") retry = false;
        }
        const delay = retryDelays[attempt - 1];
        if (!retry || delay === undefined) return false;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    },
  };
}

let override: Transport | null = null;

/** The envelope route once the site has its secret; the older routes until then. */
export const transport = (): Transport => override ?? (signingSecret() ? envelopeTransport() : webhookTransport);

/** Tests only. */
export function setTransport(next: Transport | null) {
  override = next;
}
