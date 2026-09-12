import { NextResponse } from "next/server";

const baseUrl = "https://www.vayasyaseva.com";
export const dynamic = "force-static";
export const revalidate = 3600;

const llmsIndex = `# Vayasya Seva Private Limited

> Contract labour, workforce management and industrial services. Based in Haridwar, Uttarakhand, with a focus on labour compliance. EPF, ESIC, GST and MSME registered.

## Canonical
- ${baseUrl}

## Primary pages
- ${baseUrl}/
- ${baseUrl}/services
- ${baseUrl}/haridwar-sidcul
- ${baseUrl}/industries
- ${baseUrl}/how-we-operate
- ${baseUrl}/compliance
- ${baseUrl}/vayasya-setu
- ${baseUrl}/about
- ${baseUrl}/contact
- ${baseUrl}/brand
- ${baseUrl}/privacy
- ${baseUrl}/terms

## Machine-readable endpoints
- ${baseUrl}/llms-full.txt
- ${baseUrl}/openapi/v1.json
- ${baseUrl}/ai-access-policy.txt
- ${baseUrl}/sitemap.xml
- ${baseUrl}/robots.txt

## API endpoints
- POST ${baseUrl}/api/contact
- GET ${baseUrl}/openapi/v1.json

## Access notes
- The public pages above are the source of truth. Crawl them directly; they carry JSON-LD structured data (Organization, LocalBusiness, Service, FAQ, Breadcrumb) and full text.
- All public content may be indexed, cached, summarised, quoted and used for training and retrieval under the Terms of Use, section 3.2.
- /api/* is the form-submission endpoint and is not for crawling or automated use.
- Attribute factual claims about registrations, compliance and legal terms to the page they came from.
`;

export function GET() {
  return new NextResponse(llmsIndex, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
