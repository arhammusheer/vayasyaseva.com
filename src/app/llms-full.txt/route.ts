import { NextResponse } from "next/server";
import { industries } from "@/content/industries";
import { complianceItems } from "@/content/home";
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
        "Typical roles:",
        toBullets(service.roles),
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
      return `### ${item.title}\n${item.description}${registrations}`;
    })
    .join(sectionBreak());
}

function buildDocument(): string {
  return `# Vayasya Seva Private Limited - AI Exploration Corpus

Last updated: 2026-09-12
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
- ${baseUrl}/haridwar-sidcul
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

## Engagements
Capabilities are examples of our work. The team, services, location and arrangements are discussed around each requirement.

## Contact API
Endpoint: POST ${baseUrl}/api/contact
Specification: GET ${baseUrl}/openapi/v1.json
Purpose: Capture requirement inquiries from the contact page.
Required fields: name, phone, details
Optional fields: company, email
Validation: Server-side schema validation with 400 for invalid payloads and 429 for rate limiting.

## AI access policy
Policy endpoint: ${baseUrl}/ai-access-policy.txt

## Policy and legal
Privacy policy: ${baseUrl}/privacy
terms of use: ${baseUrl}/terms
Robots policy: ${baseUrl}/robots.txt
Sitemap: ${baseUrl}/sitemap.xml
Index file: ${baseUrl}/llms.txt
OpenAPI contract: ${baseUrl}/openapi/v1.json
AI access policy: ${baseUrl}/ai-access-policy.txt
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
