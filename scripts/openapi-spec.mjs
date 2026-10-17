import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

export const contactContractPath = path.join(projectRoot, "packages/contracts/src/contact.contract.json");
export const openApiOutputPath = path.join(projectRoot, "src/openapi/v1.json");

export const componentsPath = path.join(projectRoot, "packages/contracts/generated/openapi.components.json");

/** components.schemas, generated from the Zod contracts. */
export function loadComponents() {
  return JSON.parse(fs.readFileSync(componentsPath, "utf8"));
}

export function loadContactContract() {
  return JSON.parse(fs.readFileSync(contactContractPath, "utf8"));
}

const json = (ref) => ({ "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } });
const response = (description, ref) => ({ description, content: json(ref) });

const agentErrors = {
  "400": response("Invalid payload; `fields` says which", "AgentError"),
  "429": response("Rate limited; wait `retryAfterSeconds` before trying again", "AgentError"),
  "502": response("Our side failed; try again later", "AgentError"),
  "503": response("Temporarily unavailable; try again later", "AgentError"),
};

function buildAgentPaths() {
  return {
    "/api/agent/contact": {
      post: {
        tags: ["Agents"],
        summary: "Send a business enquiry for a person (AI agents)",
        description:
          "Open route for AI agents and assistants: no CAPTCHA, no key. A Request a crew enquiry: send the requirement (roles, headcountBand, siteState, siteCity, startWindow, durationBand) or, from older integrations, a free-text details. Send only details the person gave you and confirm with them first. The enquiry goes to our team marked as sent by an agent; no email is sent to the address given. We aim to reply within two working days (Monday to Saturday, IST). Rate limited per source.",
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
          "Step 1 of 3. Declare the files (CV, photos, documents). Then PUT each file to its upload URL, then call /api/agent/jobs/submit with the ticket.",
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
  const { schemas } = loadComponents();

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
          summary: "Request a crew (website form)",
          description:
            "Used by the Request a crew form on the website's contact page. Requires a Cloudflare Turnstile token in the x-turnstile-token header. AI agents: use /api/agent/contact.",
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
    // The request and response schemas: Zod in packages/contracts,
    // generated by its scripts/generate.mjs (pnpm contracts:generate).
    components: { schemas },
  };
}

export function stringifyOpenApiSpec(spec) {
  return `${JSON.stringify(spec, null, 2)}\n`;
}
