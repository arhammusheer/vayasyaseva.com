/**
 * @vspl/contracts: the submission contracts the website, its tests and
 * Windmill share. Zod is the source; scripts/generate.mjs writes the JSON
 * Schemas and the OpenAPI components into generated/ (`--check` in CI).
 */
import { z } from "zod/v4";
import {
  JOB_APPLICATION_V1,
  agentErrorSchema,
  agentInfoObjectSchema,
  agentJobsAcceptedSchema,
  agentJobsRequestSchema,
  agentJobsStartRequestSchema,
  agentJobsStartResponseSchema,
  agentJobsSubmitRequestSchema,
  jobApplicationCanonicalSchema,
  jobsStartRequestSchema,
  jobsSubmitRequestSchema,
} from "./job-application.v1.ts";
import {
  BUSINESS_ENQUIRY_V1,
  COMPLIANCE_HELP_V1,
  agentContactDocSchema,
  agentContactSuccessSchema,
  apiErrorSchema,
  complianceHelpCanonicalSchema,
  complianceHelpSchema,
  contactSchema,
  contactSuccessSchema,
  leadCanonicalSchema,
} from "./business-enquiry.v1.ts";
import { ENVELOPE_V1, envelopeSchema } from "./envelope.v1.ts";
import { UPLOAD_TICKET, uploadTicketSchema } from "./upload-ticket.ts";

export * from "./job-application.v1.ts";
export * from "./business-enquiry.v1.ts";
export * from "./envelope.v1.ts";
export * from "./upload-ticket.ts";

/**
 * Every contract: its wire (request) schemas, named as in the OpenAPI spec,
 * and its canonical schema (what Windmill receives).
 */
export const CONTRACTS = {
  [JOB_APPLICATION_V1]: {
    requests: {
      JobsStartRequest: jobsStartRequestSchema,
      JobsSubmitRequest: jobsSubmitRequestSchema,
      AgentJobsRequest: agentJobsRequestSchema,
      AgentJobsStartRequest: agentJobsStartRequestSchema,
      AgentJobsSubmitRequest: agentJobsSubmitRequestSchema,
    },
    canonical: jobApplicationCanonicalSchema,
  },
  [BUSINESS_ENQUIRY_V1]: { requests: { ContactInquiryRequest: contactSchema }, canonical: leadCanonicalSchema },
  [COMPLIANCE_HELP_V1]: { requests: { ComplianceHelpRequest: complianceHelpSchema }, canonical: complianceHelpCanonicalSchema },
  [ENVELOPE_V1]: { requests: {}, canonical: envelopeSchema },
  [UPLOAD_TICKET]: { requests: {}, canonical: uploadTicketSchema },
} as const satisfies Record<string, { requests: Record<string, z.ZodType>; canonical: z.ZodType }>;

export type ContractName = keyof typeof CONTRACTS;

/**
 * The published OpenAPI components (src/openapi/v1.json), in the spec's
 * order. Built fresh on each call, so the registry holds only these.
 */
export function openApiComponents() {
  const registry = z.registry<{ id: string }>();
  const add = (id: string, schema: z.ZodType) => registry.add(schema, { id });
  add("ContactInquiryRequest", contactSchema);
  add("AgentContactRequest", agentContactDocSchema(agentInfoObjectSchema.optional()));
  add("AgentContactSuccess", agentContactSuccessSchema);
  add("AgentInfo", agentInfoObjectSchema);
  add("AgentJobsRequest", agentJobsRequestSchema);
  add("AgentJobsStartRequest", agentJobsStartRequestSchema);
  add("AgentJobsStartResponse", agentJobsStartResponseSchema);
  add("AgentJobsSubmitRequest", agentJobsSubmitRequestSchema);
  add("AgentJobsAccepted", agentJobsAcceptedSchema);
  add("AgentError", agentErrorSchema);
  add("ContactInquirySuccess", contactSuccessSchema);
  add("ApiError", apiErrorSchema);
  return registry;
}
