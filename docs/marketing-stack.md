# Marketing and measurement stack

How the tools around www.vayasyaseva.com fit together, what each one is for, and how they feed each other. Updated 3 October 2026. The event-by-event detail is in `docs/seo-checklist.md`; claims rules are in `docs/claim-policy.md`.

## Who does what

| Tool | Job | Gets data from | Consent |
|------|-----|----------------|---------|
| **Umami** (self-hosted, t.vayasyaseva.com) | The main analytics: page views, every usage and form event, funnels, the Jobs & Ads board, replays and heatmaps | The site's tracker (`/_t`), and the server for application and enquiry counts | Counts and events for everyone; replays and unfinished-form contents with Allow All |
| **Vercel Web Analytics** | Cookie-free page counts as a cross-check | Vercel | Everyone |
| **Google Analytics 4** (property 556021189, stream `G-80VCZT0V6G`) | Google-side reporting, audiences for Google Ads, Search Console data | The Google tag | Allow All |
| **Google Ads** (account 994-521-4823, manager 874-352-1700) | Search campaigns for job seekers; conversions and bidding | The Google tag (conversions), GA4 (imported key events, secondary) | Allow All |
| **Google Search Console** | Organic search queries, indexing, sitemap | Google's crawler, the sitemap, IndexNow | n/a |
| **Bing Webmaster Tools + IndexNow** | Bing, Yahoo, DuckDuckGo and other engines | Sitemap, IndexNow on every deploy | n/a |
| **Google Business Profile** | Maps and local search, reviews | Manual | n/a |
| **Meta Pixel** | Facebook and Instagram ads for job seekers (dormant, see below) | The site, after Allow All | Allow All |
| **Chatwoot + n8n** | The applications themselves (the true count) | The forms through n8n | Form consent |

No Google Tag Manager: tags live in the code (`src/components/analytics.tsx`), next to the consent logic, and the platforms are configured through their APIs.

## One Google tag

After **Allow All**, the site loads one Google tag (gtag.js) with two destinations:

- `G-80VCZT0V6G` (GA4) and `AW-18475903983` (Google Ads), both configured on load, so the ad click id (gclid) is kept in a first-party cookie across pages and a later application still credits the ad.
- Set for every hit: `allow_google_signals: false`, `allow_ad_personalization_signals: false`, `allow_enhanced_conversions: false`.
- Consent Mode (basic): the tag loads only after Allow All and declares consent (ads and analytics granted, personalisation denied), so Google Ads can model the conversions it can't see.

Before a choice, or with Required Only, no Google or Meta code loads at all.

## Conversions and key events

| Outcome | Site event | GA4 key event | Google Ads | Meta (when on) | Server count (Umami) |
|---------|-----------|---------------|------------|----------------|----------------------|
| Job application | `job_form_submit` (long and quick form, `variant`) | yes | **Job Application form Filled** (primary, one per click) | SubmitApplication | `application_received` |
| Business enquiry | `generate_lead` | yes | Business enquiry sent (secondary) | Lead | `enquiry_received` |
| Phone, email or WhatsApp click | `contact_click` | yes | not tracked | Contact | n/a |

GA4's imported `job_form_submit` is secondary in Google Ads, so nothing is counted twice. Google Ads bids only on its own tag's primary conversion.

## GA4 setup (done through the Admin API)

- Linked to Google Ads 994-521-4823, **ads personalisation off**. Google signals off.
- Event data retention 14 months.
- Enhanced measurement: only page changes (needed for in-app navigation). Scrolls, outbound clicks, file downloads, forms, site search and video are off; the site's own events cover them with more detail.
- 22 event-scoped custom dimensions (variant, page, form, reason, checks, locale, contact_method, zone, target, step, answer, work, experience, …), so the site's event properties are usable in reports.

## Campaign tagging (UTM)

Every paid link carries UTM tags; Umami keeps them as session properties, so every event in an ad visit can be filtered by them.

| Parameter | Value | Example |
|-----------|-------|---------|
| `utm_source` | the platform | `google`, `meta`, `whatsapp`, `bing` |
| `utm_medium` | the type | `cpc` (paid search), `paid_social`, `social`, `referral` |
| `utm_campaign` | a stable campaign slug | `search_jobs`, `search_jobs_quick` |
| `utm_content` | ad group or creative id | `{adgroupid}` |
| `utm_term` | keyword | `{keyword}` |

Google Ads also adds `gclid` (auto-tagging on). Lower case, words joined with `_`, never personal data.

## Links still to make in the web UIs (no API for these)

1. **Search Console ↔ GA4**: GA4 → Admin → Product links → Search Console links → Link → choose the www.vayasyaseva.com property and the web stream.
2. **Search Console ↔ Google Ads**: Google Ads → Tools → Data manager → Linked accounts → Search Console → Link.
3. **Google Business Profile ↔ Google Ads**: Google Ads → Assets → Location → link the Business Profile, to show your area and reviews on ads.
4. **Enhanced conversions off**: Google Ads → Goals → Settings → Enhanced conversions for leads (the tag already refuses it).

## Turning on the Meta Pixel

The code is in place (`src/components/meta-pixel.tsx`) and does nothing until a pixel id is set. In this order:

1. In Meta Events Manager, create a dataset (pixel) for www.vayasyaseva.com. Turn **off** Automatic Advanced Matching and automatic event setup.
2. Update the privacy notice: Meta as a provider in "Additional site measurement" and Section 5, what it receives (page views and the three outcome events, no form details), Meta's retention, and a link to Meta's privacy policy.
3. Bump the consent version (`analyticsConsentKey` in `src/lib/analytics.ts`, to v5) so everyone is asked again, and add Meta to the banner's "Learn more" text.
4. Set `NEXT_PUBLIC_META_PIXEL_ID` in Vercel (production), then ship.
5. In Ads Manager, use `utm_source=meta&utm_medium=paid_social&utm_campaign=…` on every ad link, and optimise for the SubmitApplication event.
