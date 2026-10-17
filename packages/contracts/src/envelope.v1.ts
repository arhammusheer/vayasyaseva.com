/**
 * envelope.v1: one submission of any type, as the site delivers it to the
 * signed Windmill route (webhook/vspl-submission). The `type` names the
 * payload's canonical contract; `id` is the reference the person was given
 * (VS-J-… or REQ-/AGT-…), the key Windmill files it under once.
 */
import { z } from "zod/v4";
import { JOB_APPLICATION_V1, jobApplicationCanonicalSchema } from "./job-application.v1.ts";
import { BUSINESS_ENQUIRY_V1, COMPLIANCE_HELP_V1, CASE_ID_PATTERN, complianceHelpCanonicalSchema, leadCanonicalSchema } from "./business-enquiry.v1.ts";
import { REF_PATTERN } from "./rules.ts";

export const ENVELOPE_V1 = "envelope.v1";

/** What an Idempotency-Key header may hold (src/server/submissions/policies/idempotency.ts). */
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_.:-]{8,128}$/;

const common = {
  v: z.literal(1),
  /** When the site accepted it (ISO 8601, UTC). */
  sentAt: z.iso.datetime(),
  /** The caller's Idempotency-Key, if it sent one. */
  idempotencyKey: z.string().regex(IDEMPOTENCY_KEY_PATTERN).nullable(),
};

export const envelopeSchema = z
  .discriminatedUnion("type", [
    z.object({ ...common, type: z.literal(JOB_APPLICATION_V1), id: z.string().regex(REF_PATTERN), payload: jobApplicationCanonicalSchema }).strict(),
    z.object({ ...common, type: z.literal(BUSINESS_ENQUIRY_V1), id: z.string().regex(CASE_ID_PATTERN), payload: leadCanonicalSchema }).strict(),
    z.object({ ...common, type: z.literal(COMPLIANCE_HELP_V1), id: z.string().regex(CASE_ID_PATTERN), payload: complianceHelpCanonicalSchema }).strict(),
  ])
  .meta({ title: "envelope.v1", description: "One submission, as the site delivers it to Windmill webhook/vspl-submission." });

export type Envelope = z.output<typeof envelopeSchema>;
export type SubmissionType = Envelope["type"];
export const SUBMISSION_TYPES = [JOB_APPLICATION_V1, BUSINESS_ENQUIRY_V1, COMPLIANCE_HELP_V1] as const;
