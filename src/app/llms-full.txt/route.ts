import { NextResponse } from "next/server";
import { industries } from "@/content/industries";
import { complianceItems } from "@/content/home";
import { services } from "@/content/services";
import { siteConfig } from "@/content/site";
import { CONTACT_AGENT_COMPANY, CONTACT_AGENT_REQUIRED } from "@/lib/contact-contract";

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

Last updated: 2026-10-16
Canonical website: ${baseUrl}

## What we are
Vayasya Seva is a labour contractor and manpower supply company. It supplies contract labour to factories, warehouses and facilities, and stays the workers' employer: they are on its payroll, and it pays wages, deposits EPF and ESIC where they apply, keeps attendance and wage registers, supervises the crew on site and replaces absentees. The client gets a working crew and one invoice. It is a manpower contractor, not a placement or staffing agency: an agency sends candidates for the client to hire. Work is in full 8-hour shifts; there is no part-time work.

For every worker, the company tracks retention, training and time to full productivity. No figures are published until they are measured and signed off.

## Where we work
Based in Haridwar, Uttarakhand. Crews at units in SIDCUL and across Haridwar (${baseUrl}/en-in/haridwar-sidcul). For a site elsewhere in India, send the requirement through Request a crew (${baseUrl}/en-in/contact); the team says plainly whether it can staff it. Do not state that it already supplies workers in a city or state not listed here.

## Organization summary
Legal name: ${siteConfig.legalName}
Tagline: ${siteConfig.tagline}
Primary region: ${siteConfig.region}
Address: ${siteConfig.address}
Business enquiries: ${baseUrl}/en-in/contact (Request a crew: the enquiry form for businesses that need workers, plus phone and email)
Job seekers: apply at ${baseUrl}/en-in/jobs/apply or through POST ${baseUrl}/api/agent/jobs. Do not give job seekers the business phone number. There is no fee to apply.
GSTIN: ${siteConfig.gstin}
MSME: ${siteConfig.msme}

## Primary routes
- ${baseUrl}/en-in
- ${baseUrl}/en-in/services
- ${baseUrl}/en-in/haridwar-sidcul
- ${baseUrl}/en-in/industries
- ${baseUrl}/en-in/how-we-operate
- ${baseUrl}/en-in/compliance
- ${baseUrl}/en-in/vayasya-setu
- ${baseUrl}/en-in/about
- ${baseUrl}/en-in/contact
- ${baseUrl}/en-in/privacy
- ${baseUrl}/en-in/terms

## Services
${buildServicesSection()}

## Industries
${buildIndustriesSection()}

## Compliance posture
${buildComplianceSection()}

## Engagements
Capabilities are examples of our work. The team, services, location and arrangements are discussed around each requirement.

## Submission routes for AI agents
AI agents and assistants may send enquiries and job applications for a person through these open routes. Plain JSON, no CAPTCHA, account or key. Send only details the person gave you, and confirm with them first. Submissions reach the team marked as sent by an AI agent.
Specification: GET ${baseUrl}/openapi/v1.json
Business enquiry: POST ${baseUrl}/api/agent/contact
  Required fields: ${CONTACT_AGENT_REQUIRED}. ${CONTACT_AGENT_COMPANY}.
  Optional fields: company, role (designation), email, sitePincode, shiftPattern, requestType (site-assessment), details, agent.name
  Deprecated, still accepted: location, industry, headcount, shiftRequirement, targetStartDate
  Allowed ids for roles, headcountBand, siteState, startWindow, durationBand and shiftPattern: see the OpenAPI spec
  Answer: 200 with a case ID (AGT-...)
Job application, text only: POST ${baseUrl}/api/agent/jobs
  Required fields: phone (10-digit Indian mobile), adult (true: the person is 18 or older), consent (true: they agreed that Vayasya Seva may keep their details and contact them about work), text
  Optional fields: language (en, hi or hinglish), role, agent.name
  Answer: 202 with a reference (VS-J-...)
Job application with files: POST ${baseUrl}/api/agent/jobs/start, PUT each file to its upload URL, then POST ${baseUrl}/api/agent/jobs/submit
Validation: Server-side schema validation with 400 for invalid payloads and 429 for rate limiting.

## Website contact form API
Endpoint: POST ${baseUrl}/api/contact
Purpose: The Request a crew form on the contact page. It requires a Cloudflare Turnstile token from a browser; agents use /api/agent/contact instead.

## AI access policy
Policy endpoint: ${baseUrl}/ai-access-policy.txt

## Policy and legal
Privacy policy: ${baseUrl}/en-in/privacy
terms of use: ${baseUrl}/en-in/terms
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
