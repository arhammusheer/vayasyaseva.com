import { NextResponse } from "next/server";

const baseUrl = "https://www.vayasyaseva.com";
export const dynamic = "force-static";
export const revalidate = 3600;

// Format follows https://llmstxt.org: H1, blockquote summary, then H2 sections
// of Markdown link lists ("- [name](url): notes"). Bare URLs are not parsed as links.
const llmsIndex = `# Vayasya Seva Private Limited

> Contract labour, workforce management and industrial services. Based in Haridwar, Uttarakhand, with a focus on labour compliance. EPF, ESIC, GST and MSME registered.

The public pages below are the source of truth. They carry full text and JSON-LD structured data (Organization, LocalBusiness, Service, FAQ, Breadcrumb). All public content may be indexed, cached, summarised, quoted and used for training and retrieval under the [Terms of Use](${baseUrl}/en-in/terms), section 3.2. \`/api/*\` is the form-submission endpoint and is not for crawling or automated use. Attribute factual claims about registrations, compliance and legal terms to the page they came from.

## Company
- [Home](${baseUrl}/en-in): Contract labour, industrial manpower, site services and workforce documentation in SIDCUL and across Haridwar
- [About](${baseUrl}/en-in/about): Who Vayasya Seva is and how the company approaches people, site operations and compliance
- [How we operate](${baseUrl}/en-in/how-we-operate): Engagement planning, mobilisation, supervision, workforce records and reporting
- [Compliance](${baseUrl}/en-in/compliance): Worker documentation, attendance, wage records, EPF and ESIC contributions, client reviews
- [Industries](${baseUrl}/en-in/industries): Manufacturing, warehousing, FMCG, institutional facilities and hospitality
- [Haridwar SIDCUL](${baseUrl}/en-in/haridwar-sidcul): Workforce services for units in SIDCUL Haridwar
- [Vayasya Setu](${baseUrl}/en-in/vayasya-setu): Workforce operations platform for attendance, deployment, payroll inputs and compliance records
- [Contact](${baseUrl}/en-in/contact): Phone, email and enquiry form for the Haridwar team

## Services
- [Services overview](${baseUrl}/en-in/services): All services, from contract labour to civil works and maintenance
- [Contract labour](${baseUrl}/en-in/services/contract-labour): Contract labour supply with compliance records
- [Warehouse labour](${baseUrl}/en-in/services/warehouse-labour): Warehouse and logistics manpower
- [Factory labour](${baseUrl}/en-in/services/factory-labour): Manufacturing and shopfloor manpower
- [Housekeeping](${baseUrl}/en-in/services/housekeeping): Housekeeping staff for industrial and institutional sites

## Jobs
- [Jobs overview](${baseUrl}/en-in/jobs): Open roles for workers. The neutral link ${baseUrl}/jobs asks the reader to choose a language
- [Factory helper](${baseUrl}/en-in/jobs/factory-helper): Factory helper role
- [Warehouse](${baseUrl}/en-in/jobs/warehouse): Warehouse role
- [Data entry operator](${baseUrl}/en-in/jobs/data-entry-operator): Data entry operator role
- [Housekeeping](${baseUrl}/en-in/jobs/housekeeping): Housekeeping role
- [ITI trades](${baseUrl}/en-in/jobs/iti-trades): Roles for ITI-trained tradespeople

## हिंदी pages (hi-IN, Hindi in Devanagari)
- [Haridwar SIDCUL (हिंदी)](${baseUrl}/hi-in/haridwar-sidcul)
- [Contract labour (हिंदी)](${baseUrl}/hi-in/services/contract-labour)
- [Jobs (हिंदी)](${baseUrl}/hi-in/jobs)
- [Factory helper (हिंदी)](${baseUrl}/hi-in/jobs/factory-helper)
- [Warehouse (हिंदी)](${baseUrl}/hi-in/jobs/warehouse)
- [Data entry operator (हिंदी)](${baseUrl}/hi-in/jobs/data-entry-operator)
- [Housekeeping (हिंदी)](${baseUrl}/hi-in/jobs/housekeeping)
- [ITI trades (हिंदी)](${baseUrl}/hi-in/jobs/iti-trades)

## Hindi pages (hi-Latn-IN, Hindi in Latin script)
- [Haridwar SIDCUL (Hindi)](${baseUrl}/hi-latn-in/haridwar-sidcul)
- [Contract labour (Hindi)](${baseUrl}/hi-latn-in/services/contract-labour)
- [Warehouse labour (Hindi)](${baseUrl}/hi-latn-in/services/warehouse-labour)
- [Factory labour (Hindi)](${baseUrl}/hi-latn-in/services/factory-labour)
- [Housekeeping (Hindi)](${baseUrl}/hi-latn-in/services/housekeeping)
- [Jobs (Hindi)](${baseUrl}/hi-latn-in/jobs)
- [Factory helper (Hindi)](${baseUrl}/hi-latn-in/jobs/factory-helper)
- [Warehouse (Hindi)](${baseUrl}/hi-latn-in/jobs/warehouse)
- [Data entry operator (Hindi)](${baseUrl}/hi-latn-in/jobs/data-entry-operator)
- [Housekeeping (Hindi)](${baseUrl}/hi-latn-in/jobs/housekeeping)
- [ITI trades (Hindi)](${baseUrl}/hi-latn-in/jobs/iti-trades)

## Machine-readable
- [llms-full.txt](${baseUrl}/llms-full.txt): Full plain-text corpus of services, industries and compliance posture
- [OpenAPI spec](${baseUrl}/openapi/v1.json): Contract for the contact API (POST /api/contact)
- [AI access policy](${baseUrl}/ai-access-policy.txt): Terms for crawling, indexing and training
- [Sitemap](${baseUrl}/sitemap.xml)
- [robots.txt](${baseUrl}/robots.txt)

## Optional
- [Brand](${baseUrl}/en-in/brand): Logo, lockups, typography and colour palette
- [Privacy policy](${baseUrl}/en-in/privacy)
- [Terms of use](${baseUrl}/en-in/terms)
`;

export function GET() {
  return new NextResponse(llmsIndex, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
