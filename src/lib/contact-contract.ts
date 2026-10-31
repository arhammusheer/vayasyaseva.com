/**
 * The contact form's contract (business_enquiry.v1 / compliance_help.v1)
 * lives in the contracts package: packages/contracts/src/business-enquiry.v1.ts
 * and its contact.contract.json. This module adds what the site's pages need.
 */
import {
  buildFieldSchema,
  contactContract,
  type ContactFieldDefinition,
  type ContactFormData,
} from "@vspl/contracts/business-enquiry";

export {
  buildFieldSchema,
  contactContract,
  contactSchema,
  knownCluster,
  parseContactRequest,
  type ContactFieldDefinition,
  type ContactFormData,
  type ContactFormInput,
} from "@vspl/contracts/business-enquiry";

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
 * What an agent must send, in one wording for every agent surface (the
 * hidden form note, llms.txt, llms-full.txt), built from the contract.
 */
export const CONTACT_AGENT_REQUIRED = (() => {
  const [free, structured] = contactContract.request.requireOneOf;
  const always = Object.entries(fields).filter(([, d]) => d.required).map(([n]) => n);
  return `${always.join(", ")}, and either the requirement (${structured.join(", ")}) or ${free.join(", ")}`;
})();
export const CONTACT_AGENT_COMPANY = "Include company when the person gives it (ask for it)";

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
  const definition: ContactFieldDefinition | undefined = fields[name];
  if (!definition) throw new Error(`Unknown contact field: ${name}`);
  return buildFieldSchema(options.required === undefined ? definition : { ...definition, required: options.required });
}
