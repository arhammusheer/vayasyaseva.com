# SEO checklist — vayasyaseva.com

Goal: first-page (ideally #1) for labour, manpower, compliance and industrial-services queries in Haridwar, SIDCUL and the surrounding Uttarakhand belt. Status as of 13 September 2026.

## On-site: done in code

**Crawlability and indexing**
- `robots.txt`: blanket allow, only `/api/` disallowed; `Host` and `Sitemap` declared. Enforced by `npm run ai:check`.
- `sitemap.xml`: all 13 public pages, priorities weighted to `/`, `/services`, `/haridwar-sidcul`, `/contact`.
- One canonical per page via `pageMetadata()`; no root fallback canonical (404 no longer claims a URL).
- Root `robots` meta: index/follow, `max-snippet:-1`, `max-image-preview:large`, `max-video-preview:-1`.
- Host redirect `vayasyaseva.com` → `https://www.vayasyaseva.com` (301) in `next.config.ts`; `metadataBase` is the www host.
- HSTS (preload), nosniff, referrer and permissions headers; `X-Powered-By` removed.
- `llms.txt` / `llms-full.txt` / `ai-access-policy.txt` point AI crawlers at the HTML pages.

**Metadata**
- Unique title (≤ 60 chars, keyword-led, `| Vayasya Seva` suffix) and description (120–160 chars) per page.
- OG + Twitter cards on every page with a static, prerendered OG image.
- Geo meta (`geo.region`, `geo.placename`, `geo.position`, `ICBM`) for Haridwar.
- Search Console verification token slot: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.

**Structured data (all valid JSON-LD, one `@graph` per site + per-page nodes)**
- Site graph on every page: `Organization` + `LocalBusiness` (one node, `@id`), with logo, address, `geo`, `areaServed` (Haridwar, SIDCUL, Roorkee, Bahadrabad, Bhagwanpur, Uttarakhand), `contactPoint`, GSTIN/Udyam identifiers, `knowsAbout`, `sameAs` (empty until profiles exist) and a `WebSite` node.
- Every page: typed `WebPage` (`CollectionPage`, `AboutPage`, `ContactPage`) linked to the site and organisation by `@id`, plus `BreadcrumbList`.
- `/services`: `ItemList` of `Service` nodes with `serviceType`, `provider @id`, `areaServed`.
- `FAQPage` with visible matching Q&A on `/services`, `/compliance`, `/industries`, `/haridwar-sidcul`.

**Content and internal linking**
- Local-intent FAQ sections (`src/content/faqs.ts`) written for the questions plant HR/admin/procurement teams search.
- Services intro links to `/industries` and `/haridwar-sidcul`; every list page cross-links compliance; homepage "closer look" links the three hub pages; footer carries every primary page.
- Headings: one `h1` per page; `h2` for sections; sentence case.
- Copy passes the slop lint (no banned claims, no invented metrics).

**Performance**
- Self-hosted fonts via `next/font` (no third-party font requests), hero image `priority` with `sizes`, AVIF/WebP image formats, static prerender for all pages, no client JS on content pages beyond the header and form.
- No horizontal overflow at 390px; one CSS entrance animation, reduced-motion honoured.

**Measurement hooks**
- GA4 loads only when `NEXT_PUBLIC_GA_ID` is set (`@next/third-parties`), so the same build works with or without analytics.

## Off-site and account-level: owner actions

These move rankings more than anything above and cannot be done from the repository.

1. **Google Business Profile** for Vayasya Seva Private Limited at the real street address in Haridwar. Categories: Labour contractor / Employment agency / Facility services. Add the phone, website, hours, photos of real sites and teams, and start collecting client reviews. For "labour contractor Haridwar" queries this listing outranks the website.
2. **Street address and hours on the site.** `siteConfig.address` is city-level; NAP consistency (name, address, phone) between GBP, site footer, schema and directories is a core local ranking signal. Supply the address and opening hours and they go into the footer, contact page and `LocalBusiness` schema.
3. **Search Console**: verify (paste the token into `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`), submit `sitemap.xml`, and review the Performance report monthly to pick the next content targets from real impressions.
4. **GA4**: create the property, set `NEXT_PUBLIC_GA_ID`, enable Enhanced Measurement, mark form submission as a conversion. If EU visitors matter, add a consent banner with Consent Mode v2; the privacy policy already permits analytics.
5. **Citations with identical NAP**: IndiaMART, JustDial, Sulekha, TradeIndia, Uttarakhand MSME/Udyam directory, SIDCUL industrial association listings, LinkedIn company page. Add each public URL to `siteConfig.sameAs`.
6. **Backlinks that are natural for this business**: client testimonials linking back, SIDCUL/industry association pages, local chamber of commerce, supplier listings on client procurement portals, a LinkedIn company page posting site photos.
7. **Real photography** to replace the stock hero and to feed GBP and future pages.

## Next content build (recommended, not yet done)

- A content hub (`/insights`) of 15–25 substantive pages answering compliance and operations questions for principal employers in Uttarakhand: CLRA registration and licence thresholds, EPF/ESIC obligations when using contractors, minimum wage notifications for Uttarakhand, what a compliant contractor invoice includes, how to audit a labour contractor. These are the "barely relevant" long-tail queries and no local competitor writes them. Each needs a legal/compliance review before publishing.
- Location pages only where there is real locality: Roorkee, Bhagwanpur, Bahadrabad. Three, not thirty; doorway pages trip Google's scaled-content policy.
- Keep Search Console driving the list: write for queries that already show impressions.
