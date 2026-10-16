import { z } from "zod/v4";
import rawContactContract from "@/contracts/contact.contract.json";
import { CLUSTER_IDS } from "@/content/registry/identifiers";

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

interface ContactContract {
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

/** The fixed values of an enum field, in contract order. */
function enumValues(name: string) {
  const definition = fields[name];
  if (!definition || definition.type === "string") throw new Error(`Not an enum field: ${name}`);
  return definition.values;
}

export const ROLE_OPTIONS = enumValues("roles");
export const HEADCOUNT_BAND_OPTIONS = enumValues("headcountBand");
export const STATE_OPTIONS = enumValues("siteState");
export const START_WINDOW_OPTIONS = enumValues("startWindow");
export const DURATION_BAND_OPTIONS = enumValues("durationBand");
export const SHIFT_PATTERN_OPTIONS = enumValues("shiftPattern");
export const REQUEST_TYPE_OPTIONS = enumValues("requestType");

/**
 * The contract publishes pageCluster as a plain slug; the cluster list
 * itself lives in the registry, not the public spec.
 */
export function knownCluster(value: string | undefined) {
  return value && (CLUSTER_IDS as readonly string[]).includes(value) ? value : undefined;
}

/** Empty strings and empty lists count as "not given" for optional fields. */
function blankToUndefined(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (Array.isArray(value) && value.length === 0) return undefined;
  return value;
}

function buildStringFieldSchema(definition: StringFieldDefinition) {
  let schema = z.string().trim();

  if (typeof definition.minLength === "number") {
    schema = schema.min(definition.minLength, definition.requiredMessage);
  }

  if (typeof definition.maxLength === "number") {
    schema = schema.max(definition.maxLength);
  }

  if (typeof definition.pattern === "string") {
    schema = schema.regex(new RegExp(definition.pattern), definition.patternMessage);
  }

  if (definition.format === "email") {
    schema = schema.email(definition.formatMessage);
  }

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
    .refine((list) => new Set(list).size === list.length, "Each value once");
}

export function buildFieldSchema(definition: ContactFieldDefinition) {
  const schema =
    definition.type === "enum"
      ? buildEnumFieldSchema(definition)
      : definition.type === "enum-array"
        ? buildEnumArrayFieldSchema(definition)
        : buildStringFieldSchema(definition);

  if (definition.required) {
    return schema;
  }

  return z.preprocess(blankToUndefined, schema.optional());
}

function buildContactSchemaShape() {
  return Object.fromEntries(
    Object.entries(fields).map(([fieldName, definition]) => [fieldName, buildFieldSchema(definition)])
  );
}

const present = (value: unknown) => value !== undefined && value !== null;

export const contactSchema = z
  .object(buildContactSchemaShape())
  .strict()
  .superRefine((data, ctx) => {
    const groups = contactContract.request.requireOneOf;
    if (groups.some((group) => group.every((name) => present(data[name])))) return;
    // Point at the missing fields of the group the sender started (the most
    // fields given; the first group on a tie), so a form can show them.
    const given = (group: string[]) => group.filter((n) => present(data[n])).length;
    const closest = groups.reduce((best, group) => (given(group) > given(best) ? group : best));
    for (const name of closest.filter((n) => !present(data[n]))) {
      ctx.addIssue({
        code: "custom",
        path: [name],
        message: fields[name]?.requiredMessage ?? contactContract.request.requireOneOfMessage,
      });
    }
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
  /** "crew" (the default) or "site-assessment". */
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

/**
 * What an agent must send, in one wording for every agent surface (the
 * hidden form note, llms.txt, llms-full.txt), built from the contract.
 */
export const CONTACT_AGENT_REQUIRED = (() => {
  const [free, structured] = contactContract.request.requireOneOf;
  const always = Object.entries(fields).filter(([, d]) => d.required).map(([n]) => n);
  return `${always.join(", ")}, and either the requirement (${structured.join(", ")}) or ${free.join(", ")}`;
})();
export const CONTACT_AGENT_COMPANY = "Include company when the person gives it (ask for it)";

export const contactRequiredFields = Object.entries(fields)
  .filter(([, definition]) => definition.required)
  .map(([fieldName]) => fieldName);

/** A stored id's label, or the id itself if the field or value is unknown. */
export function contactOptionLabel(field: keyof ContactFormData, id: string | undefined) {
  if (!id) return undefined;
  const definition = fields[field];
  return definition && definition.type !== "string" ? definition.values[id] ?? id : id;
}

/**
 * One field's schema, optionally made required: the website form asks for
 * more than the contract demands (the contract stays open to older senders).
 */
export function contactFieldSchema(name: keyof ContactFormData, options: { required?: boolean } = {}) {
  const definition = fields[name];
  if (!definition) throw new Error(`Unknown contact field: ${name}`);
  return buildFieldSchema(options.required === undefined ? definition : { ...definition, required: options.required });
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
