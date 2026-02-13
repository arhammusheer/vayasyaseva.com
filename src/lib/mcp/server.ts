import * as z from "zod/v4";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { complianceItems, faqs, scopeBoundaries } from "@/content/home";
import { industries } from "@/content/industries";
import { privacyContent } from "@/content/privacy";
import { services } from "@/content/services";
import { siteConfig } from "@/content/site";
import { termsContent } from "@/content/terms";
import { contactContract } from "@/lib/contact-contract";
import { aiAccessPolicy } from "@/content/ai-access-policy";

const baseUrl = "https://www.vayasyaseva.com";

function asJsonText(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function resourceJson(uri: string, data: unknown) {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: asJsonText(data),
      },
    ],
  };
}

function resourceMarkdown(uri: string, markdown: string) {
  return {
    contents: [
      {
        uri,
        mimeType: "text/markdown",
        text: markdown,
      },
    ],
  };
}

function successToolResult(summary: string, payload: unknown) {
  const structuredContent =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : { value: payload };

  return {
    content: [
      {
        type: "text" as const,
        text: summary,
      },
    ],
    structuredContent,
  };
}

function notFoundToolResult(message: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
  };
}

export function createVayasyaMcpServer() {
  const server = new McpServer(
    {
      name: "vayasya-seva-mcp",
      version: "1.0.0",
      websiteUrl: baseUrl,
    },
    {
      capabilities: {
        logging: {},
      },
      instructions:
        "Read-only MCP server for structured discovery of Vayasya Seva public website content. Use tools and resources for services, industries, compliance, and legal information.",
    }
  );

  server.registerResource(
    "site-profile",
    "vayasya://site/profile",
    {
      title: "Site Profile",
      description: "Legal entity, contact details, and canonical links for Vayasya Seva.",
      mimeType: "application/json",
    },
    async () =>
      resourceJson("vayasya://site/profile", {
        organization: siteConfig,
        canonicalUrl: baseUrl,
        endpoints: {
          llms: `${baseUrl}/llms.txt`,
          llmsFull: `${baseUrl}/llms-full.txt`,
          openapi: `${baseUrl}/openapi/v1.json`,
          mcp: `${baseUrl}/mcp`,
        },
      })
  );

  server.registerResource(
    "services-catalog",
    "vayasya://services/catalog",
    {
      title: "Services Catalog",
      description: "Detailed list of services, included scope, and exclusions.",
      mimeType: "application/json",
    },
    async () => resourceJson("vayasya://services/catalog", services)
  );

  server.registerResource(
    "industries-catalog",
    "vayasya://industries/catalog",
    {
      title: "Industries Catalog",
      description: "Industry-specific service patterns, risk controls, and reporting cadence.",
      mimeType: "application/json",
    },
    async () => resourceJson("vayasya://industries/catalog", industries)
  );

  server.registerResource(
    "compliance-posture",
    "vayasya://compliance/posture",
    {
      title: "Compliance Posture",
      description: "Compliance claims, scope boundaries, and operational FAQ coverage.",
      mimeType: "application/json",
    },
    async () =>
      resourceJson("vayasya://compliance/posture", {
        complianceItems,
        scopeBoundaries,
        faq: faqs.filter((item) => item.category === "compliance"),
      })
  );

  server.registerResource(
    "legal-privacy",
    "vayasya://legal/privacy",
    {
      title: "Privacy Policy",
      description: "Privacy policy in markdown format.",
      mimeType: "text/markdown",
    },
    async () => resourceMarkdown("vayasya://legal/privacy", privacyContent.trim())
  );

  server.registerResource(
    "legal-terms",
    "vayasya://legal/terms",
    {
      title: "Terms of Service",
      description: "Terms of service in markdown format.",
      mimeType: "text/markdown",
    },
    async () => resourceMarkdown("vayasya://legal/terms", termsContent.trim())
  );

  server.registerResource(
    "contact-contract",
    "vayasya://api/contact/contract",
    {
      title: "Contact API Contract",
      description: "Canonical request/response contract for the contact API route.",
      mimeType: "application/json",
    },
    async () =>
      resourceJson("vayasya://api/contact/contract", {
        contract: contactContract,
        openApi: `${baseUrl}/openapi/v1.json`,
        endpoint: `${baseUrl}/api/contact`,
      })
  );

  server.registerResource(
    "ai-access-policy",
    "vayasya://policy/ai-access",
    {
      title: "AI Access Policy",
      description: "Governance policy for AI and agent access endpoints.",
      mimeType: "text/markdown",
    },
    async () => resourceMarkdown("vayasya://policy/ai-access", aiAccessPolicy.trim())
  );

  server.registerTool(
    "list_services",
    {
      title: "List Services",
      description: "List all service offerings with IDs and short summaries.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
      },
    },
    async () =>
      successToolResult("Returned all service offerings.", {
        count: services.length,
        services: services.map((service) => ({
          id: service.id,
          title: service.title,
          description: service.description,
        })),
      })
  );

  server.registerTool(
    "get_service",
    {
      title: "Get Service",
      description: "Return the full service object for a given service ID.",
      inputSchema: {
        id: z.string().describe("Service identifier, e.g. warehouse-logistics"),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ id }) => {
      const service = services.find((item) => item.id === id);
      if (!service) {
        return notFoundToolResult(`Service '${id}' was not found.`);
      }
      return successToolResult(`Returned service '${id}'.`, service);
    }
  );

  server.registerTool(
    "list_industries",
    {
      title: "List Industries",
      description: "List all covered industries with IDs and summaries.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
      },
    },
    async () =>
      successToolResult("Returned all industries.", {
        count: industries.length,
        industries: industries.map((industry) => ({
          id: industry.id,
          title: industry.title,
          description: industry.description,
        })),
      })
  );

  server.registerTool(
    "get_industry",
    {
      title: "Get Industry",
      description: "Return the full industry object for a given industry ID.",
      inputSchema: {
        id: z.string().describe("Industry identifier, e.g. manufacturing"),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ id }) => {
      const industry = industries.find((item) => item.id === id);
      if (!industry) {
        return notFoundToolResult(`Industry '${id}' was not found.`);
      }
      return successToolResult(`Returned industry '${id}'.`, industry);
    }
  );

  server.registerTool(
    "get_compliance_posture",
    {
      title: "Get Compliance Posture",
      description:
        "Return compliance claims, scope boundaries, and compliance-related FAQ entries.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
      },
    },
    async () =>
      successToolResult("Returned compliance posture.", {
        complianceItems,
        scopeBoundaries,
        faq: faqs.filter((item) => item.category === "compliance"),
      })
  );

  server.registerTool(
    "get_legal_document",
    {
      title: "Get Legal Document",
      description: "Return the full markdown text for privacy policy or terms of service.",
      inputSchema: {
        document: z.enum(["privacy", "terms"]),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ document }) => {
      if (document === "privacy") {
        return successToolResult("Returned privacy policy markdown.", {
          document: "privacy",
          content: privacyContent.trim(),
          source: `${baseUrl}/privacy`,
        });
      }
      return successToolResult("Returned terms of service markdown.", {
        document: "terms",
        content: termsContent.trim(),
        source: `${baseUrl}/terms`,
      });
    }
  );

  server.registerTool(
    "get_ai_access_policy",
    {
      title: "Get AI Access Policy",
      description: "Return the AI access policy markdown and canonical source URL.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
      },
    },
    async () =>
      successToolResult("Returned AI access policy markdown.", {
        content: aiAccessPolicy.trim(),
        source: `${baseUrl}/ai-access-policy.txt`,
      })
  );

  return server;
}
