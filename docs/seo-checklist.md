# SEO checklist — vayasyaseva.com

Goal: improve qualified visibility for labour, manpower, compliance and industrial-services queries for SIDCUL and across Haridwar. Status as of 26 September 2026. See `docs/seo-growth-plan-2026-09.md` for the current query map and measurement plan. Copy changes in this revision need brand-owner approval before deployment.

## On-site: done in code

**Crawlability and indexing**
- `robots.txt`: blanket allow, only `/api/` disallowed; `Host` and `Sitemap` declared. Enforced by `pnpm ai:check`.
- `sitemap.xml`: every public page in each published language (70 URLs as of 2 October 2026), built from `src/app/sitemap.ts`, the role data and `pages` in `src/lib/i18n.ts`.
- Guided form `/jobs/apply` (all three languages): an experiment against the long form on `/jobs`, used as a Google Ads landing page. Tap answers (work, experience, shifts), then name, mobile and area. `?role=<job role>` answers the first question. noindex, not in the sitemap, not linked. Events carry `variant: quick` (`job_form_start`, `job_form_submit`, `job_form_error`), plus `quick_apply_start`, `quick_step` and `quick_apply_submit`; abandonment uses form name `quick`.
- Job hub pages `/jobs/freshers`, `/jobs/10th-pass` and `/jobs/12th-pass` (all three languages) are in the sitemap but deliberately **not linked** from navigation, the jobs page, role pages or `llms.txt` (owner's call, October 2026). They target "SIDCUL Haridwar vacancy for freshers" and "10th/12th pass job" searches. Don't add links to them without asking; see `JOB_HUBS` in `src/lib/talent-intake/rules.ts`. Applications from them carry a `hub` tag, shown as "Came from" in Chatwoot.
- Security guard pages are on hold until a PSARA licence or licensed partner is confirmed.
- One canonical per page via `pageMetadata()`; no root fallback canonical (404 no longer claims a URL).
- Root `robots` meta: index/follow, `max-snippet:-1`, `max-image-preview:large`, `max-video-preview:-1`.
- Host redirect `vayasyaseva.com` → `https://www.vayasyaseva.com` (301) in `next.config.ts`; `metadataBase` is the www host.
- HSTS (preload), nosniff, referrer and permissions headers; `X-Powered-By` removed.
- `llms.txt` / `llms-full.txt` / `ai-access-policy.txt` point AI crawlers at the HTML pages.

**Metadata**
- Unique, descriptive titles and page summaries. Search engines can rewrite snippets and do not enforce a fixed character limit.
- OG + Twitter cards on every page with a static, prerendered OG image.
- Geo meta (`geo.region`, `geo.placename`, `geo.position`, `ICBM`) for Haridwar.
- Search Console verification token slot: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.

**Structured data (all valid JSON-LD, one `@graph` per site + per-page nodes)**
- Site graph on every page: `Organization` + `LocalBusiness` (one node, `@id`), with logo, address, `geo`, `areaServed` (Haridwar, SIDCUL, Roorkee, Bahadrabad, Bhagwanpur, Uttarakhand), `contactPoint`, GSTIN/Udyam identifiers, `knowsAbout`, `sameAs` (LinkedIn company page) and a `WebSite` node.
- Every page: typed `WebPage` (`CollectionPage`, `AboutPage`, `ContactPage`) linked to the site and organisation by `@id`, plus `BreadcrumbList`.
- `/services`: `ItemList` of `Service` nodes with `serviceType`, `provider @id`, `areaServed`.
- `FAQPage` with visible matching Q&A on `/services`, `/compliance`, `/industries`, `/haridwar-sidcul`.

**Content and internal linking**
- Local-intent FAQ sections (`src/content/faqs.ts`) written for the questions plant HR/admin/procurement teams search.
- Services intro links to `/industries` and `/haridwar-sidcul`; every list page cross-links compliance; homepage "closer look" links the three hub pages; footer carries every primary page.
- Homepage, services index, local page and footer link to the new contract-labour service page. Visible headings now use the language of relevant local and service searches.
- Headings: one `h1` per page; `h2` for sections; sentence case.
- Copy passes the slop lint (no banned claims, no invented metrics).

**Performance**
- Self-hosted fonts via `next/font` (no third-party font requests), hero image `priority` with `sizes`, AVIF/WebP image formats, static prerender for all pages, no client JS on content pages beyond the header and form.
- No horizontal overflow at 390px; one CSS entrance animation, reduced-motion honoured.

**Measurement hooks** (decided 27 September 2026)
- Baseline, for every visitor whatever they choose (including "Required Only"): Vercel Web Analytics (cookie-free, URLs reduced to known paths) and self-hosted Umami (cookie-free, query strings and hashes excluded). Umami loads from `/_t/s.js` and posts to `/_t/e`; `src/proxy.ts` forwards both to `t.vayasyaseva.com` with the visitor IP in `x-vspl-client-ip` and Vercel geo headers (Umami reads them via `CLIENT_IP_HEADER`, vayasya-infra PR #27). Website ID comes from `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (Production only). Privacy policy basis: legitimate interest.
- Usage events, for every visitor (`src/components/analytics-tracker.tsx`, `src/lib/analytics.ts`): Umami's own page views are off (`data-auto-track="false"`); the tracker sends them with the known path plus `utm_*` tags only. `trackAnalyticsEvent` sends each event to Umami always, and to GA4 and Clarity after "Allow All". Values are fixed labels, known paths or numbers, never form input. Events:
  - Links: `contact_click` (phone/email/whatsapp), `contact_intent`, `jobs_intent`, `nav_click`, `outbound_click` (domain), `file_download`, `anchor_click`, `language_switch`, `language_choice` (picker); each with `zone` (header, mobile_menu, footer, main, picker) and `page` type.
  - Engagement: `scroll_depth` (25/50/75/90), `engaged_time` (10/30/60/180 s visible), `faq_open` (question), `text_copy` (zone only).
  - Forms (`data-analytics-form`): `form_field` (first focus per field name), `form_abandon` (last field, when the page is left), `contact_form_start`/`contact_form_error`/`generate_lead`, `job_form_start`/`job_form_error`/`job_form_submit`, `voice_record_start`, `voice_recorded` (length range), `voice_discard`, `voice_error`, `file_added` (kind), `file_rejected` (reason).
  - Health: `web_vital` (LCP, INP, CLS, FCP, TTFB with rating), `js_error` (kind and error name, max 3 a page), `not_found` (slug-like path, internal/external source).
  - Consent: `consent_prompt`, `consent_choice`; Umami session data `locale` and `consent`; Clarity tags `locale` and `page_type`.
- After "Allow All" only: GA4 (G-80VCZT0V6G, or `NEXT_PUBLIC_GA_ID`) and Microsoft Clarity (`yogh8zv088`, or `NEXT_PUBLIC_CLARITY_ID`; contact and jobs forms carry `data-clarity-mask`; set masking to Strict in the Clarity dashboard). Consent key is v4 (v2 when Clarity was added, v3 for Google Ads conversion measurement and v4 for unfinished-form records, both 2 October 2026); affirmative consent expires after 180 days.
- `form_abandon` (every visitor, no values): `form`, `last_field`, `page`, plus `focused_field`, `filled` and `empty` (field names, with `voice`/`files` when added), `errors` (failed checks from the last Send, e.g. `phone,agree`) and `tried_send`. Field reading lives in `src/lib/form-analytics.ts`; forms mark voice, files and failed checks with `data-draft-*` and `data-form-errors`. `job_form_error` and `contact_form_error` also carry `checks`. `form_abandon` and `form_complete` also carry `form_seconds`, `field_seconds`, `corrections`, `pastes` and `phone_digits` (counts only). Campaign tags (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) from the landing URL are also Umami session properties, so every event in an ad visit can be filtered by campaign or keyword. Google Ads final URL suffix: `utm_source=google&utm_medium=cpc&utm_campaign=search_jobs&utm_content={adgroupid}&utm_term={keyword}`. Other behaviour events: `rage_click`, `dead_click` (element name, never text; 5 each per page view), `voice_error` (`denied`, `no_mic`, `mic_error`, `recorder`, `unsupported`), `upload_error`, and `consent_allow_all` / `consent_required_only` for Umami funnels.
- Unfinished-form records, after "Allow All" only: when a tracked form is left unsent, `trackAbandonedDraft` sends its typed fields (plus voice-note length and file count from `data-draft-*`, never content) to Umami only, as `form_abandon_draft`. Umami → Events → form_abandon_draft → properties. A nightly CronJob in vayasya-infra (`apps/umami`) deletes that event data after 30 days. Internal rule: used only to fix the forms; never contacted, never copied into Chatwoot or the applicant pipeline.
- Google Ads conversion (`AW-18475903983`, or `NEXT_PUBLIC_GOOGLE_ADS_ID`), also after "Allow All" only: `trackAdsConversion("jobApplication")` fires when the jobs form succeeds. The Ads ID is configured on first use through the GA4 gtag.js with `allow_ad_personalization_signals: false` (no remarketing). Labels live in `adsConversions` in `src/lib/analytics-config.ts`.
- Umami replays and heatmaps, also after "Allow All" only: `/_t/recorder.js` (proxied like the tracker). Settings live in the Umami dashboard: both sample rates 1, mask level strict, max duration 10 min, block selector `form, .jobs-done`. Needs `/recorder.js`, `/api/record` and `/api/websites/<id>/recorder` on the public Umami ingress (vayasya-infra `apps/umami/base/ingress-public.yaml`).
- GA4 events: fixed-label contact intent, form-start, broad error, phone/email click and successful lead. No form contents or contact details. Create an "AI Assistants" custom channel group in GA4 admin for chatgpt/perplexity/gemini/claude/copilot referrals.
- Bing Webmaster Tools verified (`msvalidate.01` in `src/app/layout.tsx`). IndexNow key file in `public/`. `.github/workflows/indexnow.yml` runs after every production deploy: it checks production with `pnpm seo:check` and submits only pages whose content fingerprint changed. `pnpm indexnow` (all) or `pnpm indexnow /path` submits by hand.
- `pnpm seo:check [base]` crawls every sitemap URL: status 200, one `h1`, non-empty title, canonical equals the sitemap URL, no noindex, JSON-LD parses, registered (home) address only on /privacy and /terms. Runs in CI against the built site.
- `pnpm ship`: slop lint, lint, type check, build, local SEO check, push, wait for the Vercel production deploy, SEO check on production.

## Off-site and account-level: owner actions

Status 26 September 2026: Google Business Profile created, Search Console and analytics set up, LinkedIn company page linked from the footer and `sameAs`. Remaining: add the Business Profile URL to `siteConfig.sameAs`, confirm the LinkedIn page's website field points to https://www.vayasyaseva.com, and gather reviews from real clients.

These move rankings more than anything above and cannot be done from the repository.

1. **Google Business Profile** for Vayasya Seva Private Limited at the real street address in Haridwar. Categories: Labour contractor / Employment agency / Facility services. Add the phone, website, hours, photos of real sites and teams, and start collecting client reviews. For "labour contractor Haridwar" queries this listing outranks the website.
2. **Street address and hours on the site.** `siteConfig.address` is city-level; NAP consistency (name, address, phone) between GBP, site footer, schema and directories is a core local ranking signal. Supply the address and opening hours and they go into the footer, contact page and `LocalBusiness` schema.
3. **Search Console**: verify (paste the token into `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`), submit `sitemap.xml`, and review the Performance report monthly to pick the next content targets from real impressions.
4. **Analytics**: keep Vercel Web Analytics enabled in the project; in GA4 enable Enhanced Measurement with browser-history page changes and mark `generate_lead` as a key event. Use `NEXT_PUBLIC_GA_ID` only to override the production measurement ID. Have counsel review the privacy notice for the markets you serve before adding advertising or other new measurement purposes.
5. **Citations with identical NAP**: IndiaMART, JustDial, Sulekha, TradeIndia, Uttarakhand MSME/Udyam directory, SIDCUL industrial association listings, LinkedIn company page. Add each public URL to `siteConfig.sameAs`.
6. **Backlinks that are natural for this business**: client testimonials linking back, SIDCUL/industry association pages, local chamber of commerce, supplier listings on client procurement portals, a LinkedIn company page posting site photos.
7. **Real photography** to replace the stock hero and to feed GBP and future pages.

## Next content build (recommended, not yet done)

- A content hub (`/insights`) of 15–25 substantive pages answering compliance and operations questions for principal employers in Uttarakhand: contractor licensing under the Labour Codes (verify current central and Uttarakhand rules), EPF/ESIC obligations when using contractors, minimum wage notifications for Uttarakhand, what a compliant contractor invoice includes, how to audit a labour contractor. These are the "barely relevant" long-tail queries and no local competitor writes them. Each needs a legal/compliance review before publishing.
- Location pages only where there is real locality: Roorkee, Bhagwanpur, Bahadrabad. Three, not thirty; doorway pages trip Google's scaled-content policy.
- Keep Search Console driving the list: write for queries that already show impressions.
