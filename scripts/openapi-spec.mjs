import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Node strips the types; rules.ts has no imports, so it loads as plain JS.
import {
  AGENT_LANGUAGE_SOURCES,
  ATTACHMENT_KINDS,
  INTAKE_LIMITS,
  JOB_ROLE_SLUGS,
  MAX_AGENT_NAME_LENGTH,
} from "../src/lib/talent-intake/rules.ts";

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

const json = (ref) => ({ "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } });
const response = (description, ref) => ({ description, content: json(ref) });

const agentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name"],
  description: "Who is sending. Optional, shown to our team with the submission.",
  properties: {
    name: {
      type: "string",
      minLength: 1,
      maxLength: MAX_AGENT_NAME_LENGTH,
      pattern: "^[\\p{L}\\p{N} .,_+()/:-]+$",
      example: "Example Assistant",
    },
  },
};

const personFields = {
  phone: {
    type: "string",
    description: "The job seeker's 10-digit Indian mobile number. +91 or a leading 0 is accepted.",
    example: "98765 43210",
  },
  adult: {
    type: "boolean",
    const: true,
    description: "The person told you they are 18 or older. Jobs are for adults only.",
  },
  consent: {
    type: "boolean",
    const: true,
    description:
      "The person agreed to be contacted about work and to the job seeker privacy notice (https://www.vayasyaseva.com/en-in/privacy#job-seekers).",
  },
};

const jobPageFields = {
  language: {
    type: "string",
    enum: Object.keys(AGENT_LANGUAGE_SOURCES),
    default: "en",
    description: "Language the person speaks: en (English), hi (Hindi), hinglish (Hindi written in Latin script).",
  },
  role: {
    type: ["string", "null"],
    enum: [...JOB_ROLE_SLUGS, null],
    description: "The kind of work, if the person named one that matches. Leave it out otherwise.",
  },
  agent: { $ref: "#/components/schemas/AgentInfo" },
};

const agentErrors = {
  "400": response("Invalid payload; `fields` says which", "AgentError"),
  "429": response("Rate limited; wait `retryAfterSeconds` before trying again", "AgentError"),
  "502": response("Our side failed; try again later", "AgentError"),
  "503": response("Temporarily unavailable; try again later", "AgentError"),
};

function buildAgentJobsSchemas() {
  return {
    AgentInfo: agentSchema,
    AgentJobsRequest: {
      type: "object",
      additionalProperties: false,
      required: ["phone", "adult", "consent", "text"],
      properties: {
        ...jobPageFields,
        ...personFields,
        text: {
          type: "string",
          minLength: 1,
          maxLength: INTAKE_LIMITS.maxTextLength,
          description:
            "About the person in their own words: name, work wanted, experience, where they live, when they can start. Never include Aadhaar, PAN or bank details.",
          example: "Name: Ravi Kumar. Wants packing or warehouse work. 2 years in a packing unit. Lives in Bahadrabad. Can start next week.",
        },
      },
    },
    AgentJobsStartRequest: {
      type: "object",
      additionalProperties: false,
      required: ["files"],
      properties: {
        ...jobPageFields,
        files: {
          type: "array",
          minItems: 1,
          maxItems: INTAKE_LIMITS.maxAttachments,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["kind", "mime", "size", "name"],
            properties: {
              kind: { type: "string", enum: [...ATTACHMENT_KINDS] },
              mime: {
                type: "string",
                description:
                  "audio: audio/webm, ogg, mp4, mpeg, aac, wav or x-m4a. image: image/jpeg, png or webp. document: application/pdf, msword or vnd.openxmlformats-officedocument.wordprocessingml.document.",
                example: "application/pdf",
              },
              size: {
                type: "integer",
                minimum: 1,
                description: `Bytes. At most ${INTAKE_LIMITS.maxBytes.audio} for audio and images, ${INTAKE_LIMITS.maxBytes.document} for documents.`,
              },
              name: { type: ["string", "null"], maxLength: INTAKE_LIMITS.maxFileNameLength },
            },
          },
        },
      },
    },
    AgentJobsStartResponse: {
      type: "object",
      required: ["ref", "ticket", "uploads"],
      properties: {
        ref: { type: "string", example: "VS-J-7K2M9Q" },
        ticket: { type: "string", description: "Signed, valid for an hour. Send it unchanged to /api/agent/jobs/submit." },
        uploads: {
          type: "array",
          description: "Same order as `files`. PUT each file's bytes to `url` with exactly these `headers`, within 15 minutes.",
          items: {
            type: "object",
            required: ["key", "url", "headers"],
            properties: {
              key: { type: "string" },
              url: { type: "string", format: "uri" },
              headers: { type: "object", additionalProperties: { type: "string" } },
            },
          },
        },
      },
    },
    AgentJobsSubmitRequest: {
      type: "object",
      additionalProperties: false,
      required: ["ticket", "phone", "adult", "consent"],
      properties: {
        ticket: { type: "string" },
        ...personFields,
        text: { type: ["string", "null"], maxLength: INTAKE_LIMITS.maxTextLength },
      },
    },
    AgentJobsAccepted: {
      type: "object",
      required: ["ref"],
      properties: {
        ref: {
          type: "string",
          example: "VS-J-7K2M9Q",
          description: "Give this to the person. They quote it if they call +91 72920 14101.",
        },
      },
    },
    AgentError: {
      type: "object",
      additionalProperties: true,
      required: ["error"],
      properties: {
        error: { type: "string", example: "invalid_request" },
        fields: { type: "array", items: { type: "object", additionalProperties: true } },
        retryAfterSeconds: { type: "integer" },
      },
    },
  };
}

function buildAgentPaths() {
  return {
    "/api/agent/contact": {
      post: {
        tags: ["Agents"],
        summary: "Send a business enquiry for a person (AI agents)",
        description:
          "Open route for AI agents and assistants: no CAPTCHA, no key. Send only details the person gave you and confirm with them first. The enquiry goes to our team marked as sent by an agent; no email is sent to the address given. Rate limited per source.",
        operationId: "agentSubmitContactInquiry",
        security: [],
        requestBody: { required: true, content: json("AgentContactRequest") },
        responses: {
          "200": response("Enquiry received", "AgentContactSuccess"),
          "400": response("Invalid payload", "ApiError"),
          "429": response("Rate limited; wait `retryAfterSeconds` before trying again", "ApiError"),
          "500": response("Unexpected server error", "ApiError"),
        },
      },
    },
    "/api/agent/jobs": {
      post: {
        tags: ["Agents"],
        summary: "Apply for work for a job seeker, text only (AI agents)",
        description:
          "Open route for AI agents and assistants: no CAPTCHA, no key. One request sends a text application. Ask the person for their details in conversation, tell them they must be 18 or older and that Vayasya Seva never charges a fee for a job, and get their agreement before sending. To include files, use /api/agent/jobs/start instead.",
        operationId: "agentSubmitJobApplication",
        security: [],
        requestBody: { required: true, content: json("AgentJobsRequest") },
        responses: { "202": response("Application received", "AgentJobsAccepted"), ...agentErrors },
      },
    },
    "/api/agent/jobs/start": {
      post: {
        tags: ["Agents"],
        summary: "Start a job application with files (AI agents)",
        description:
          "Step 1 of 3. Declare the files (CV, photos, voice note). Then PUT each file to its upload URL, then call /api/agent/jobs/submit with the ticket.",
        operationId: "agentStartJobApplication",
        security: [],
        requestBody: { required: true, content: json("AgentJobsStartRequest") },
        responses: { "200": response("Upload URLs and ticket", "AgentJobsStartResponse"), ...agentErrors },
      },
    },
    "/api/agent/jobs/submit": {
      post: {
        tags: ["Agents"],
        summary: "Finish a job application with files (AI agents)",
        description: "Step 3 of 3, after every upload has finished.",
        operationId: "agentFinishJobApplication",
        security: [],
        requestBody: { required: true, content: json("AgentJobsSubmitRequest") },
        responses: {
          "202": response("Application received", "AgentJobsAccepted"),
          ...agentErrors,
          "409": response("A declared file was not uploaded", "AgentError"),
          "410": response("Ticket expired or invalid; start again", "AgentError"),
          "413": response("An upload was larger than declared", "AgentError"),
        },
      },
    },
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
        "Submission routes for vayasyaseva.com. The /api/agent/* routes are open to AI agents and assistants acting for a person: plain JSON, no CAPTCHA, no key, validated and rate limited server-side. /api/contact serves the website's own contact form and needs a Cloudflare Turnstile token from a browser; agents should use /api/agent/contact instead. See https://www.vayasyaseva.com/llms.txt and https://www.vayasyaseva.com/ai-access-policy.txt.",
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
          summary: "Submit contact inquiry (website form)",
          description:
            "Used by the contact form on the website. Requires a Cloudflare Turnstile token in the x-turnstile-token header. AI agents: use /api/agent/contact.",
          operationId: "submitContactInquiry",
          parameters: [
            {
              name: "x-turnstile-token",
              in: "header",
              required: true,
              schema: { type: "string" },
              description: "Cloudflare Turnstile token from the form's widget.",
            },
          ],
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
            "403": {
              description: "Turnstile verification failed; agents should use /api/agent/contact",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ApiError",
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
      ...buildAgentPaths(),
    },
    components: {
      schemas: {
        ContactInquiryRequest: requestSchema,
        AgentContactRequest: {
          ...requestSchema,
          properties: { ...requestSchema.properties, agent: { $ref: "#/components/schemas/AgentInfo" } },
        },
        AgentContactSuccess: {
          type: "object",
          required: ["success", "caseId", "message"],
          properties: {
            success: { type: "boolean", const: true },
            caseId: { type: "string", example: "AGT-20261002-1A2B3C4D", description: "Give this to the person." },
            message: { type: "string", example: contactContract.responses.successMessage },
          },
        },
        ...buildAgentJobsSchemas(),
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
