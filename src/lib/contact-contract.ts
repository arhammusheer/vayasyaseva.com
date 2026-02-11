import { z } from "zod/v4";
import rawContactContract from "@/contracts/contact.contract.json";

type FieldFormat = "email";

interface ContactFieldDefinition {
  type: "string";
  required: boolean;
  minLength?: number;
  format?: FieldFormat;
  description: string;
  requiredMessage?: string;
  formatMessage?: string;
  example?: string;
}

interface ContactContract {
  version: string;
  request: {
    fields: Record<string, ContactFieldDefinition>;
  };
  responses: {
    successMessage: string;
    validationError: string;
    rateLimitError: string;
    unknownError: string;
  };
}

export const contactContract = rawContactContract as ContactContract;

function buildStringFieldSchema(definition: ContactFieldDefinition) {
  let schema = z.string();

  if (typeof definition.minLength === "number") {
    schema = schema.min(definition.minLength, definition.requiredMessage);
  }

  if (definition.format === "email") {
    schema = schema.email(definition.formatMessage);
  }

  return definition.required ? schema : schema.optional();
}

function buildContactSchemaShape() {
  return Object.fromEntries(
    Object.entries(contactContract.request.fields).map(([fieldName, definition]) => [
      fieldName,
      buildStringFieldSchema(definition),
    ])
  );
}

export const contactSchema = z.object(buildContactSchemaShape()).strict();
export type ContactFormData = z.infer<typeof contactSchema>;

export const contactRequiredFields = Object.entries(contactContract.request.fields)
  .filter(([, definition]) => definition.required)
  .map(([fieldName]) => fieldName);
