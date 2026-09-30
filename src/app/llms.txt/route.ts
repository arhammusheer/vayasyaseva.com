import { NextResponse } from "next/server";

const baseUrl = "https://www.vayasyaseva.com";
export const dynamic = "force-static";
export const revalidate = 3600;

// Format follows https://llmstxt.org: H1, blockquote summary, then H2 sections
// of Markdown link lists ("- [name](url): notes"). Bare URLs are not parsed as links.
const llmsIndex = `# Vayasya Seva Private Limited

> Contract labour, workforce management and industrial services. Based in Haridwar, Uttarakhand, with a focus on labour compliance. EPF, ESIC, GST and MSME registered.

The public pages below are the source of truth. They carry full text and JSON-LD structured data (Organization, LocalBusiness, Service, FAQ, Breadcrumb). All public content may be indexed, cached, summarised, quoted and used for training and retrieval under the [Terms of Use](${baseUrl}/terms), section 3.2. \`/api/*\` is the form-submission endpoint and is not for crawling or automated use. Attribute factual claims about registrations, compliance and legal terms to the page they came from.

## Company
- [Home](${baseUrl}/): Contract labour, industrial manpower, site services and workforce documentation in SIDCUL and across Haridwar
- [About](${baseUrl}/about): Who Vayasya Seva is and how the company approaches people, site operations and compliance
- [How we operate](${baseUrl}/how-we-operate): Engagement planning, mobilisation, supervision, workforce records and reporting
- [Compliance](${baseUrl}/compliance): Worker documentation, attendance, wage records, EPF and ESIC contributions, client reviews
- [Industries](${baseUrl}/industries): Manufacturing, warehousing, FMCG, institutional facilities and hospitality
- [Haridwar SIDCUL](${baseUrl}/haridwar-sidcul): Workforce services for units in SIDCUL Haridwar
- [Vayasya Setu](${baseUrl}/vayasya-setu): Workforce operations platform for attendance, deployment, payroll inputs and compliance records
- [Contact](${baseUrl}/contact): Phone, email and enquiry form for the Haridwar team

## Services
- [Services overview](${baseUrl}/services): All services, from contract labour to civil works and maintenance
- [Contract labour](${baseUrl}/services/contract-labour): Contract labour supply with compliance records
- [Warehouse labour](${baseUrl}/services/warehouse-labour): Warehouse and logistics manpower
- [Factory labour](${baseUrl}/services/factory-labour): Manufacturing and shopfloor manpower
- [Housekeeping](${baseUrl}/services/housekeeping): Housekeeping staff for industrial and institutional sites

## Jobs
- [Jobs overview](${baseUrl}/jobs): Open roles for workers
- [Factory helper](${baseUrl}/jobs/factory-helper): Factory helper role
- [Warehouse](${baseUrl}/jobs/warehouse): Warehouse role
- [Data entry operator](${baseUrl}/jobs/data-entry-operator): Data entry operator role
- [Housekeeping](${baseUrl}/jobs/housekeeping): Housekeeping role
- [ITI trades](${baseUrl}/jobs/iti-trades): Roles for ITI-trained tradespeople

## Hindi pages
- [Haridwar SIDCUL (Hindi)](${baseUrl}/hi/haridwar-sidcul)
- [Contract labour (Hindi)](${baseUrl}/hi/services/contract-labour)
- [Jobs (Hindi)](${baseUrl}/hi/jobs)
- [Factory helper (Hindi)](${baseUrl}/hi/jobs/factory-helper)
- [Warehouse (Hindi)](${baseUrl}/hi/jobs/warehouse)
- [Data entry operator (Hindi)](${baseUrl}/hi/jobs/data-entry-operator)
- [Housekeeping (Hindi)](${baseUrl}/hi/jobs/housekeeping)
- [ITI trades (Hindi)](${baseUrl}/hi/jobs/iti-trades)

## Hinglish pages
- [Haridwar SIDCUL (Hinglish)](${baseUrl}/hinglish/haridwar-sidcul)
- [Contract labour (Hinglish)](${baseUrl}/hinglish/services/contract-labour)
- [Warehouse labour (Hinglish)](${baseUrl}/hinglish/services/warehouse-labour)
- [Factory labour (Hinglish)](${baseUrl}/hinglish/services/factory-labour)
- [Housekeeping (Hinglish)](${baseUrl}/hinglish/services/housekeeping)
- [Jobs (Hinglish)](${baseUrl}/hinglish/jobs)
- [Factory helper (Hinglish)](${baseUrl}/hinglish/jobs/factory-helper)
- [Warehouse (Hinglish)](${baseUrl}/hinglish/jobs/warehouse)
- [Data entry operator (Hinglish)](${baseUrl}/hinglish/jobs/data-entry-operator)
- [Housekeeping (Hinglish)](${baseUrl}/hinglish/jobs/housekeeping)
- [ITI trades (Hinglish)](${baseUrl}/hinglish/jobs/iti-trades)

## Machine-readable
- [llms-full.txt](${baseUrl}/llms-full.txt): Full plain-text corpus of services, industries and compliance posture
- [OpenAPI spec](${baseUrl}/openapi/v1.json): Contract for the contact API (POST /api/contact)
- [AI access policy](${baseUrl}/ai-access-policy.txt): Terms for crawling, indexing and training
- [Sitemap](${baseUrl}/sitemap.xml)
- [robots.txt](${baseUrl}/robots.txt)

## Optional
- [Brand](${baseUrl}/brand): Logo, lockups, typography and colour palette
- [Privacy policy](${baseUrl}/privacy)
- [Terms of use](${baseUrl}/terms)
`;

export function GET() {
  return new NextResponse(llmsIndex, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
