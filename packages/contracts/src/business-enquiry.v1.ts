/**
 * business_enquiry.v1 and compliance_help.v1: one wire contract, the contact
 * form's (./contact.contract.json, version 1.3.0), told apart by
 * `requestType` ("crew" or "site-assessment" for an enquiry, "compliance-help"
 * for compliance help). /api/contact (the website form, Turnstile) and
 * /api/agent/contact (AI agents) accept it unchanged.
 *
 * Canonical (what the site forwards to Windmill f/leads/intake): the lead,
 * `leadCanonicalSchema`, built by src/lib/lead-forward.ts buildLeadPayload.
 * Windmill checks it with ajv against generated/business_enquiry.v1.canonical.schema.json.
 */
import { z } from "zod/v4";
import rawContactContract from "./contact.contract.json" with { type: "json" };
import { INTAKE_CLUSTERS } from "./rules.ts";

export const BUSINESS_ENQUIRY_V1 = "business_enquiry.v1";
export const COMPLIANCE_HELP_V1 = "compliance_help.v1";

type FieldFormat = "email";

interface BaseFieldDefinition {
  required: boolean;
  description: string;
  requiredMessage?: string;
  /** Kept for older senders; documented as deprecated in the OpenAPI spec. */
  deprecated?: boolean;
}

interface StringFieldDefinition extends BaseFieldDefinition {
  type: "string";
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  format?: FieldFormat;
  formatMessage?: string;
  example?: string;
}

/** One value from a fixed list: stored id → label (labels are for people). */
interface EnumFieldDefinition extends BaseFieldDefinition {
  type: "enum";
  values: Record<string, string>;
  example?: string;
}

/** Several values from a fixed list, without repeats. */
interface EnumArrayFieldDefinition extends BaseFieldDefinition {
  type: "enum-array";
  values: Record<string, string>;
  minItems?: number;
  example?: string[];
}

export type ContactFieldDefinition = StringFieldDefinition | EnumFieldDefinition | EnumArrayFieldDefinition;

export interface ContactContract {
  version: string;
  request: {
    fields: Record<string, ContactFieldDefinition>;
    /**
     * At least one of these groups must be complete: the free-text details
     * (older senders) or the structured requirement (the website form).
     */
    requireOneOf: string[][];
    requireOneOfMessage: string;
  };
  responses: {
    successMessage: string;
    validationError: string;
    rateLimitError: string;
    verificationError: string;
    unknownError: string;
  };
}

export const contactContract = rawContactContract as ContactContract;

const fields = contactContract.request.fields;

/** Empty strings and empty lists count as "not given" for optional fields. */
function blankToUndefined(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (Array.isArray(value) && value.length === 0) return undefined;
  return value;
}

/** The published description: the field's own, plus the ids with their labels. */
function fieldMeta(definition: ContactFieldDefinition) {
  const labels =
    definition.type === "string"
      ? ""
      : Object.entries(definition.values)
          .filter(([id, label]) => id !== label)
          .map(([id, label]) => `${id} (${label})`)
          .join(", ");
  return {
    description: labels ? `${definition.description} Values: ${labels}.` : definition.description,
    // The contract's own spelling of the pattern (Zod's would escape "/").
    ...(definition.type === "string" && definition.pattern ? { pattern: definition.pattern } : {}),
    ...(definition.example !== undefined ? { example: definition.example } : {}),
    ...(definition.deprecated ? { deprecated: true } : {}),
  };
}

function buildStringFieldSchema(definition: StringFieldDefinition) {
  let schema = z.string().trim();
  if (typeof definition.minLength === "number") schema = schema.min(definition.minLength, definition.requiredMessage);
  if (typeof definition.maxLength === "number") schema = schema.max(definition.maxLength);
  if (typeof definition.pattern === "string") schema = schema.regex(new RegExp(definition.pattern), definition.patternMessage);
  if (definition.format === "email") schema = schema.email(definition.formatMessage);
  return schema;
}

function buildEnumFieldSchema(definition: EnumFieldDefinition) {
  const ids = Object.keys(definition.values) as [string, ...string[]];
  return z.enum(ids, { error: definition.requiredMessage });
}

function buildEnumArrayFieldSchema(definition: EnumArrayFieldDefinition) {
  const ids = Object.keys(definition.values) as [string, ...string[]];
  return z
    .array(z.enum(ids), { error: definition.requiredMessage })
    .min(definition.minItems ?? 1, definition.requiredMessage)
    .max(ids.length)
    .refine((list) => new Set(list).size === list.length, "Each value once")
    .meta({ uniqueItems: true });
}

export function buildFieldSchema(definition: ContactFieldDefinition) {
  const schema =
    definition.type === "enum"
      ? buildEnumFieldSchema(definition)
      : definition.type === "enum-array"
        ? buildEnumArrayFieldSchema(definition)
        : buildStringFieldSchema(definition);
  if (definition.required) return schema.meta(fieldMeta(definition));
  return z.preprocess(blankToUndefined, schema.optional()).meta(fieldMeta(definition));
}

/** Fields only the website sets; the agent route drops them. */
export const WEBSITE_ONLY_FIELDS = ["pageCluster", "sourcePath"] as const;

const present = (value: unknown) => value !== undefined && value !== null;

function contactObject(names: string[], overrides: Record<string, z.ZodType> = {}) {
  return z
    .object({ ...Object.fromEntries(names.map((name) => [name, buildFieldSchema(fields[name])])), ...overrides })
    .strict()
    .superRefine((data, ctx) => {
      const groups = contactContract.request.requireOneOf;
      if (groups.some((group) => group.every((name) => present((data as Record<string, unknown>)[name])))) return;
      // Point at the missing fields of the group the sender started (the most
      // fields given; the first group on a tie), so a form can show them.
      const given = (group: string[]) => group.filter((n) => present((data as Record<string, unknown>)[n])).length;
      const closest = groups.reduce((best, group) => (given(group) > given(best) ? group : best));
      for (const name of closest.filter((n) => !present((data as Record<string, unknown>)[n]))) {
        ctx.addIssue({ code: "custom", path: [name], message: fields[name]?.requiredMessage ?? contactContract.request.requireOneOfMessage });
      }
    })
    .meta({
      description: contactContract.request.requireOneOfMessage,
      anyOf: contactContract.request.requireOneOf.map((group) => ({ required: group })),
    });
}

/** The wire contract of /api/contact: every field of contact.contract.json. */
export const contactSchema = contactObject(Object.keys(fields));

/** Fields of the agent route: the website-only ones are not part of it (the route drops them if sent). */
export const AGENT_CONTACT_FIELDS = Object.keys(fields).filter((n) => !(WEBSITE_ONLY_FIELDS as readonly string[]).includes(n));

/** The published wire contract of /api/agent/contact (documentation; the route parses with contactSchema). */
export const agentContactDocSchema = (agentInfo: z.ZodType) => contactObject(AGENT_CONTACT_FIELDS, { agent: agentInfo });

/** compliance_help.v1: the same wire shape, with requestType "compliance-help". */
export const complianceHelpSchema = contactSchema.refine((d) => (d as { requestType?: string }).requestType === "compliance-help", {
  message: "requestType must be compliance-help",
  path: ["requestType"],
});

/** The submitted values, typed by hand: the schema is built from JSON at runtime. */
export interface ContactFormData {
  name: string;
  phone: string;
  company?: string;
  role?: string;
  email?: string;
  roles?: string[];
  headcountBand?: string;
  siteState?: string;
  siteCity?: string;
  sitePincode?: string;
  startWindow?: string;
  durationBand?: string;
  shiftPattern?: string;
  /** "crew" (the default), "site-assessment" or "compliance-help". */
  requestType?: string;
  pageCluster?: string;
  sourcePath?: string;
  details?: string;
  /** Deprecated since 1.2.0 (older senders). */
  location?: string;
  industry?: string;
  headcount?: string;
  shiftRequirement?: string;
  targetStartDate?: string;
}
export type ContactFormInput = Partial<Record<keyof ContactFormData, unknown>>;

/** The contract publishes pageCluster as a plain slug; the cluster list is the intake's. */
export function knownCluster(value: string | undefined) {
  return value && (INTAKE_CLUSTERS as readonly string[]).includes(value) ? value : undefined;
}

/** Parse a request body against the contract. */
export function parseContactRequest(body: unknown) {
  const result = contactSchema.safeParse(body);
  if (!result.success) return { success: false, error: result.error } as const;
  const data = result.data as unknown as ContactFormData;
  // An unknown cluster is dropped, not rejected: it only tags the enquiry.
  if (data.pageCluster && !knownCluster(data.pageCluster)) delete data.pageCluster;
  return { success: true, data } as const;
}

/** Which submission type an enquiry is. */
export const enquiryType = (data: Pick<ContactFormData, "requestType">) =>
  data.requestType === "compliance-help" ? COMPLIANCE_HELP_V1 : BUSINESS_ENQUIRY_V1;

// --- Canonical: the lead f/leads/intake files in Twenty ---------------------------

/** Case IDs the site issues: REQ- from the form, AGT- from the agent route. */
export const CASE_ID_PATTERN = /^(REQ|AGT)-\d{8}-[0-9A-F]{8}$/;

/** The lengths f/leads/intake has always kept; buildLeadPayload cuts to them. */
export const LEAD_LIMITS = {
  name: 120,
  company: 160,
  jobTitle: 120,
  phone: 30,
  email: 200,
  service: 40,
  services: 20,
  headcount: 40,
  headcountBand: 20,
  site: 300,
  startWindow: 40,
  targetStartDate: 40,
  requestType: 40,
  enquiry: 8000,
  sourcePath: 300,
} as const;

const optionalText = (max: number) => z.string().min(1).max(max).nullable();

const leadShape = {
  caseId: z.string().regex(CASE_ID_PATTERN),
  receivedAt: z.iso.datetime(),
  channel: z.enum(["web", "agent"]),
  name: z.string().min(1).max(LEAD_LIMITS.name),
  company: optionalText(LEAD_LIMITS.company),
  jobTitle: optionalText(LEAD_LIMITS.jobTitle),
  // At least ten digits, in whatever spacing the person typed.
  phone: z.string().max(LEAD_LIMITS.phone).regex(/^\D*(?:\d\D*){10,}$/),
  email: z.string().max(LEAD_LIMITS.email).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).nullable(),
  /** The contact form's role ids (factory-helpers, loading-unloading...). */
  services: z.array(z.string().min(1).max(LEAD_LIMITS.service)).max(LEAD_LIMITS.services),
  headcount: optionalText(LEAD_LIMITS.headcount),
  headcountBand: optionalText(LEAD_LIMITS.headcountBand),
  site: optionalText(LEAD_LIMITS.site),
  cluster: z.enum(INTAKE_CLUSTERS).nullable(),
  startWindow: optionalText(LEAD_LIMITS.startWindow),
  targetStartDate: optionalText(LEAD_LIMITS.targetStartDate),
  requestType: optionalText(LEAD_LIMITS.requestType),
  /** The whole enquiry as our team reads it: every answer, then the free text. */
  enquiry: z.string().min(1).max(LEAD_LIMITS.enquiry),
  sourcePath: optionalText(LEAD_LIMITS.sourcePath),
};

export const leadCanonicalSchema = z
  .object(leadShape)
  .strict()
  .meta({ title: "business_enquiry.v1 (canonical)", description: "A business enquiry as the website forwards it to Windmill f/leads/intake." });
export type LeadCanonical = z.output<typeof leadCanonicalSchema>;

export const complianceHelpCanonicalSchema = z
  .object({ ...leadShape, requestType: z.literal("compliance-help") })
  .strict()
  .meta({ title: "compliance_help.v1 (canonical)", description: "A compliance help request: a lead with requestType compliance-help." });

// --- Responses (published) ---------------------------------------------------------

export const contactSuccessSchema = z
  .object({
    success: z.literal(true).meta({ example: true }),
    caseId: z.string().optional().meta({ example: "REQ-20261016-1A2B3C4D", description: "Reference for this enquiry, shown to the person." }),
    message: z.string().meta({ example: contactContract.responses.successMessage }),
  })
  .strict();

export const agentContactSuccessSchema = z.object({
  success: z.literal(true),
  caseId: z.string().meta({ example: "AGT-20261002-1A2B3C4D", description: "Give this to the person." }),
  message: z.string().meta({ example: contactContract.responses.successMessage }),
});

export const apiErrorSchema = z
  .object({
    error: z.string().meta({ example: contactContract.responses.validationError }),
    details: z.array(z.looseObject({})).optional().meta({ description: "Validation issue details (present on 400 responses)" }),
  })
  .loose();
