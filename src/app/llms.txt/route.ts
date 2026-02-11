import { NextResponse } from "next/server";

const baseUrl = "https://www.vayasyaseva.com";
export const dynamic = "force-static";
export const revalidate = 3600;

const llmsIndex = `# Vayasya Seva Private Limited

> Compliance-first workforce operations partner for industrial and enterprise sites in Haridwar-SIDCUL, Uttarakhand, India.

## Canonical
- ${baseUrl}

## Primary pages
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

## Machine-readable endpoints
- ${baseUrl}/llms-full.txt
- ${baseUrl}/openapi/v1.json
- ${baseUrl}/sitemap.xml
- ${baseUrl}/robots.txt

## API endpoints
- POST ${baseUrl}/api/contact
- GET ${baseUrl}/openapi/v1.json

## Access notes
- Public website content is available for indexing and retrieval.
- /api/* is not intended for crawler indexing.
- Use source attribution for factual claims about registrations, compliance, and legal terms.
`;

export function GET() {
  return new NextResponse(llmsIndex, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
