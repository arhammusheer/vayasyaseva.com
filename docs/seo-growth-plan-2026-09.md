# Search growth plan: Haridwar and SIDCUL

Status: code and copy changes prepared on 26 September 2026. Brand-owner review is required before deployment under `docs/content-approval-workflow.md`.

## What the audit found

- Crawlability, canonicals, sitemap, and business schema were already present. The main gap was that commercial-intent phrases appeared in metadata while the visible headings and copy were often abstract.
- The existing `/haridwar-sidcul` page is the local-intent destination. `/services/contract-labour` now explains the core service. `/services` remains the capabilities index. Keep these pages distinct so they answer different questions.
- A live search sample showed local business directories and individual contractors for labour contractor and manpower supplier queries. It is qualitative evidence of wording and competitors, **not** a rank, search-volume, or difficulty report. Google Search Console data is needed for prioritization.
- The previous `meta keywords` list did not help Google ranking. Google says it ignores that tag. We removed it and put relevant terms in useful, visible copy.

## Query map

These are intent clusters, not a list to repeat verbatim on every page. Spellings such as "labor" and "labour" usually belong to the same intent; use natural Indian English on the site.

| Priority | Search intent and phrases to validate | Destination | Next improvement |
| --- | --- | --- | --- |
| 1 | labour contractor Haridwar; labour contractor SIDCUL; contractor for factory labour; labour contractor near me | `/haridwar-sidcul` | Add a verified street address and actual service-area details after owner review. Match the Google Business Profile. |
| 1 | contract labour supplier; manpower supplier Haridwar; manpower provider SIDCUL; industrial manpower services; manpower contractor | `/services/contract-labour` | Add real engagement examples and buyer questions approved by operations. |
| 1 | factory labour supplier; production helpers; shopfloor manpower; packers and line feeders | `/services#manufacturing-shopfloor` | Consider a dedicated factory page only after Search Console shows sustained demand and unique operational material is available. |
| 1 | warehouse labour supplier; loading unloading labour; packing staff; material handling manpower; dispatch crew | `/services#warehouse-logistics` | Consider a dedicated warehouse page with a real workflow or case example. |
| 2 | EPF ESIC registered labour contractor; PF ESI labour contractor; contract worker records; wage and attendance documentation | `/compliance` | Publish only verified, current compliance details. Avoid implying that registration alone guarantees compliance. |
| 2 | housekeeping manpower Haridwar; factory housekeeping contractor; facility support staff | `/services#housekeeping-facility` | Expand if there is proven demand and genuine service detail. |
| 2 | temporary workforce; seasonal labour; project ramp-up manpower | `/services#seasonal-rampup` | Add a specific process/example if documented. |
| 3 | Roorkee, Bahadrabad, Bhagwanpur variants | `/haridwar-sidcul` | Create location pages only for places with real delivery history and distinct local information. |

Queries for **jobs, salaries, placement, recruitment agencies, tenders, and security guards** have a different intent or unverified service fit. Do not target them merely for traffic. Hindi pages could be useful if actual Search Console queries and a reviewed translation justify them.

## Owner and account work

1. Verify or update the Google Business Profile with the correct category, address or service area, hours, phone, website, and real photos. Ask actual clients for honest reviews; do not buy or gate reviews. Google says local results depend on relevance, distance, and prominence.
2. Provide the verified address and hours for consistent use on the site, Business Profile, and legitimate directories. The current site only says "Haridwar, Uttarakhand" and should not invent a street address or map pin.
3. In Search Console, confirm the canonical domain and submit `/sitemap.xml`. Export the last 3 to 6 months of **non-branded** queries with clicks, impressions, CTR, average position, and landing page. Filter for labour, labor, manpower, contractor, staffing, SIDCUL, and Haridwar; inspect actual variants rather than assuming volume.
4. Record a baseline before release. At 28 and 90 days, compare non-branded clicks and impressions for each destination page, indexed status, and qualified contact enquiries. Rankings vary by location and searcher; no honest SEO change can promise a top position.
5. Build citations and links from relevant, real business relationships: industry associations, client or vendor pages where appropriate, and maintained business directories. Keep name, address, phone and website consistent.
6. Ask operations for proof that would help a buyer choose: site photos with permission, an anonymized scope example, onboarding and document-review steps, and actual service-area details. Review all claims under `docs/claim-policy.md` before publishing.

## Sources

- [Google Search Essentials](https://developers.google.com/search/docs/essentials): use the words people search for in prominent visible locations.
- [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): descriptive, unique titles and useful content.
- [Google Business Profile local ranking guidance](https://support.google.com/business/answer/7091): relevance, distance, and prominence.
- [Google Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies): avoid keyword stuffing and near-duplicate doorway pages.
- [Search Console guide](https://developers.google.com/search/docs/monitor-debug/search-console-start): measure actual queries and pages.
- [Google on meta keywords](https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag): ignored for web ranking.
