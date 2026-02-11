import { NextResponse } from "next/server";
import { industries } from "@/content/industries";
import { complianceItems, scopeBoundaries } from "@/content/home";
import { services } from "@/content/services";
import { siteConfig } from "@/content/site";

const baseUrl = "https://www.vayasyaseva.com";
export const dynamic = "force-static";
export const revalidate = 3600;

function toBullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function sectionBreak(): string {
  return "\n\n";
}

function buildServicesSection(): string {
  return services
    .map((service) => {
      return [
        `### ${service.title}`,
        service.description,
        "Included:",
        toBullets(service.included),
        "Not included:",
        toBullets(service.notIncluded),
      ].join("\n");
    })
    .join(sectionBreak());
}

function buildIndustriesSection(): string {
  return industries
    .map((industry) => {
      return [
        `### ${industry.title}`,
        industry.description,
        `Staffing pattern: ${industry.staffingPattern}`,
        `Risk controls: ${industry.riskControlNeeds}`,
        `Reporting cadence: ${industry.reportingCadence}`,
      ].join("\n");
    })
    .join(sectionBreak());
}

function buildComplianceSection(): string {
  return complianceItems
    .map((item) => {
      const registrations = item.registrations?.length
        ? `\nRegistrations referenced: ${item.registrations.join(", ")}`
        : "";
      return `### ${item.title}\nClaim class: ${item.claim}\n${item.description}${registrations}`;
    })
    .join(sectionBreak());
}

function buildScopeBoundarySection(): string {
  return scopeBoundaries
    .map((boundary) => {
      return [
        `### ${boundary.category}`,
        "Included:",
        toBullets(boundary.included),
        "Not included:",
        toBullets(boundary.notIncluded),
        "On request:",
        toBullets(boundary.onRequest),
      ].join("\n");
    })
    .join(sectionBreak());
}

function buildDocument(): string {
  return `# Vayasya Seva Private Limited - AI Exploration Corpus

Last updated: 2026-02-11
Canonical website: ${baseUrl}

## Organization summary
Legal name: ${siteConfig.legalName}
Tagline: ${siteConfig.tagline}
Primary region: ${siteConfig.region}
Address: ${siteConfig.address}
Email: ${siteConfig.email}
Phone: ${siteConfig.phone}
GSTIN: ${siteConfig.gstin}
MSME: ${siteConfig.msme}

## Primary routes
- ${baseUrl}/
- ${baseUrl}/services
- ${baseUrl}/industries
- ${baseUrl}/how-we-operate
- ${baseUrl}/compliance
- ${baseUrl}/vayasya-setu
- ${baseUrl}/about
- ${baseUrl}/contact
- ${baseUrl}/privacy
- ${baseUrl}/terms

## Services
${buildServicesSection()}

## Industries
${buildIndustriesSection()}

## Compliance posture
${buildComplianceSection()}

## Scope boundaries
${buildScopeBoundarySection()}

## Contact API
Endpoint: POST ${baseUrl}/api/contact
Specification: GET ${baseUrl}/openapi/v1.json
Purpose: Capture requirement inquiries from the contact page.
Required fields: name, company, role, phone, email, location, industry, headcount
Optional fields: shiftRequirement, targetStartDate, details
Validation: Server-side schema validation with 400 for invalid payloads and 429 for rate limiting.

## MCP endpoint
Endpoint: POST ${baseUrl}/mcp
Transport: Streamable HTTP (JSON response mode)
Mode: Stateless, read-only tools and resources
Core tools: list_services, get_service, list_industries, get_industry, get_compliance_posture, get_legal_document
Core resources: vayasya://site/profile, vayasya://services/catalog, vayasya://industries/catalog, vayasya://compliance/posture, vayasya://legal/privacy, vayasya://legal/terms, vayasya://api/contact/contract

## Agent card
Canonical discovery card: ${baseUrl}/.well-known/agent-card.json
Compatibility alias: ${baseUrl}/.well-known/agent.json
Declared protocol binding: MCP

## Policy and legal
Privacy policy: ${baseUrl}/privacy
Terms of service: ${baseUrl}/terms
Robots policy: ${baseUrl}/robots.txt
Sitemap: ${baseUrl}/sitemap.xml
Index file: ${baseUrl}/llms.txt
OpenAPI contract: ${baseUrl}/openapi/v1.json
MCP endpoint: ${baseUrl}/mcp
Agent card: ${baseUrl}/.well-known/agent-card.json
`;
}

export function GET() {
  return new NextResponse(buildDocument(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
