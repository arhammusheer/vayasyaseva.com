import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

export const contactContractPath = path.join(projectRoot, "src/contracts/contact.contract.json");
export const openApiOutputPath = path.join(projectRoot, "src/openapi/v1.json");

export function loadContactContract() {
  return JSON.parse(fs.readFileSync(contactContractPath, "utf8"));
}

function buildRequestSchema(fields) {
  const properties = {};
  const required = [];

  for (const [fieldName, definition] of Object.entries(fields)) {
    const property = {
      type: "string",
      description: definition.description,
    };

    if (typeof definition.minLength === "number") {
      property.minLength = definition.minLength;
    }

    if (typeof definition.format === "string") {
      property.format = definition.format;
    }

    if (typeof definition.example === "string") {
      property.example = definition.example;
    }

    if (definition.required) {
      required.push(fieldName);
    }

    properties[fieldName] = property;
  }

  return {
    type: "object",
    additionalProperties: false,
    required,
    properties,
  };
}

export function buildOpenApiSpec(contactContract) {
  const requestSchema = buildRequestSchema(contactContract.request.fields);

  return {
    openapi: "3.1.1",
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    info: {
      title: "Vayasya Seva API",
      summary: "Public API contract for vayasyaseva.com",
      description:
        "Contract for inquiry submission from the public contact form. Write access is rate limited and validated server-side.",
      version: contactContract.version,
    },
    servers: [
      {
        url: "https://www.vayasyaseva.com",
      },
    ],
    paths: {
      "/api/contact": {
        post: {
          tags: ["Contact"],
          summary: "Submit contact inquiry",
          operationId: "submitContactInquiry",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ContactInquiryRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Inquiry accepted",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ContactInquirySuccess",
                  },
                },
              },
            },
            "400": {
              description: "Invalid payload",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ApiError",
                  },
                },
              },
            },
            "429": {
              description: "Rate limit exceeded",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ApiError",
                  },
                },
              },
            },
            "500": {
              description: "Unexpected server error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ApiError",
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        ContactInquiryRequest: requestSchema,
        ContactInquirySuccess: {
          type: "object",
          additionalProperties: false,
          required: ["success", "message"],
          properties: {
            success: {
              type: "boolean",
              const: true,
              example: true,
            },
            message: {
              type: "string",
              example: contactContract.responses.successMessage,
            },
          },
        },
        ApiError: {
          type: "object",
          additionalProperties: true,
          required: ["error"],
          properties: {
            error: {
              type: "string",
              example: contactContract.responses.validationError,
            },
            details: {
              type: "array",
              description: "Validation issue details (present on 400 responses)",
              items: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
  };
}

export function stringifyOpenApiSpec(spec) {
  return `${JSON.stringify(spec, null, 2)}\n`;
}
