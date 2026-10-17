/**
 * The website's payloads, checked against the contracts package's generated
 * canonical JSON Schemas (packages/contracts/generated, built from Zod by
 * `pnpm contracts:generate`). The Windmill build inlines the schemas, so
 * each script carries the contract it was built with; ajv is the only npm
 * dependency. Formats are not checked: Zod writes a pattern next to each
 * format it uses (email, date-time), and ajv checks the patterns.
 */
import { Ajv2020, type ValidateFunction } from "ajv/dist/2020.js";
import jobApplicationSchema from "../../../packages/contracts/generated/job_application.v1.canonical.schema.json" with { type: "json" };
import businessEnquirySchema from "../../../packages/contracts/generated/business_enquiry.v1.canonical.schema.json" with { type: "json" };
import envelopeSchema from "../../../packages/contracts/generated/envelope.v1.canonical.schema.json" with { type: "json" };

export type Checked<T> = { ok: true; value: T } | { ok: false; errors: string[] };

let ajv: Ajv2020 | undefined;
const compiled = new Map<object, ValidateFunction>();

function validator(schema: object): ValidateFunction {
  ajv ??= new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  let validate = compiled.get(schema);
  if (!validate) {
    validate = ajv.compile(schema);
    compiled.set(schema, validate);
  }
  return validate;
}

/** The top-level fields that failed (a body that is not an object: "payload"); never the values. */
function fieldsOf(validate: ValidateFunction): string[] {
  const names = new Set<string>();
  for (const e of validate.errors ?? []) {
    const top = e.instancePath.split("/")[1];
    if (top) names.add(top);
    else if (e.keyword === "required" || e.keyword === "additionalProperties") {
      const p = e.params as { missingProperty?: string; additionalProperty?: string };
      names.add(p.missingProperty ?? p.additionalProperty ?? "payload");
    } else names.add("payload");
  }
  return names.size ? [...names].sort() : ["payload"];
}

export function check<T>(schema: object, body: unknown): Checked<T> {
  const validate = validator(schema);
  return validate(body) ? { ok: true, value: body as T } : { ok: false, errors: fieldsOf(validate) };
}

export const SCHEMAS = {
  "job_application.v1": jobApplicationSchema,
  "business_enquiry.v1": businessEnquirySchema,
  "envelope.v1": envelopeSchema,
} as const;
