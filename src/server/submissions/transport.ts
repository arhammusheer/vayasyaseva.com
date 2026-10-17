/**
 * How an accepted submission leaves the site for Windmill. One interface for
 * every type, so the delivery can change (the signed envelope route, roadmap
 * 1F) without touching the routes.
 *
 *   application  job_application.v1 → f/talent/intake; throws unless 202
 *                (the route answers 502 and the person can retry)
 *   lead         business_enquiry.v1 / compliance_help.v1 → f/leads/intake;
 *                retries twice, never throws, true once accepted
 */
import type { JobApplicationCanonical } from "@vspl/contracts/job-application";
import type { LeadCanonical } from "@vspl/contracts/business-enquiry";
import { forwardLead } from "@/lib/lead-forward";
import { forwardToIntake } from "@/lib/talent-intake/server";

export interface Transport {
  application(payload: JobApplicationCanonical, meta: { idempotencyKey: string | null }): Promise<void>;
  lead(payload: LeadCanonical, meta: { idempotencyKey: string | null }): Promise<boolean>;
}

/** Today's routes: the talent intake webhook and the leads webhook. */
export const webhookTransport: Transport = {
  application: (payload) => forwardToIntake(payload),
  lead: (payload) => forwardLead(payload),
};

let current: Transport = webhookTransport;

export const transport = () => current;

/** Tests only (and the envelope transport when it lands). */
export function setTransport(next: Transport) {
  current = next;
}
