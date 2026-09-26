# Plan: English, Hinglish and Hindi experience

Status: live since 26 September 2026. Hindi and Hinglish are published (`published: true` in `src/lib/i18n.ts`), and the languages are set per page by `pageLocales`.

## Locales

| Locale | BCP 47 / hreflang | URL prefix | Script |
|--------|-------------------|------------|--------|
| English | `en-IN` | none | Latin |
| Hindi | `hi-IN` | `/hi` | Devanagari |
| Hinglish | `hi-Latn` | `/hinglish` | Hindi in Latin script |

Hinglish was added on 26 September 2026 at the owner's request. Google does not treat Hinglish as a separate search language and may read these pages as English or Hindi. The hreflang tags tell it the three pages are translations of each other, so they don't compete. Each locale has its own `published` flag, so Hindi and Hinglish can go live separately and be compared in Search Console.

## Languages by page (26 September 2026)

The homepage and every business-facing page stay English. Translate a page only where searchers write in that script and would still want that page.

| Page | Languages | Reason |
|------|-----------|--------|
| `/`, `/services`, `/industries`, `/how-we-operate`, `/about`, `/vayasya-setu`, `/compliance`, `/contact`, `/brand`, `/terms` | English | Business buyers; legal text in one reviewed version |
| `/haridwar-sidcul`, `/services/contract-labour` | English, Hindi, Hinglish | Core local search terms in every script |
| `/services/warehouse-labour`, `/services/factory-labour`, `/services/housekeeping` | English, Hinglish | Hindi-script searches for these are mostly from job seekers, not buyers |
| `/privacy` (when the jobs section launches) | English, Hindi | Worker applicants must understand the data notice (DPDP); Hinglish is too loose for legal text |
| `/jobs`, `/jobs/apply` (future) | English, Hindi, Hinglish; Hindi-first | Workers read Hindi and type Hinglish; skilled roles use English |

Revisit this split with Search Console data. Adding or dropping a language on a page is one line in `pageLocales` plus the route and copy.

## Decisions (26 September 2026)

- Claude drafts the Hindi; a native speaker on the VSPL team reviews it before publishing.
- Headings: Anek Devanagari, used only for Devanagari characters. Latin text stays in Anek Latin.
- Pages and languages: see the table above.

## How it is built

- Routes live under `src/app/(marketing)/hi/` and `src/app/(marketing)/hinglish/`. Each has a layout that wraps the page content in `lang="hi"` or `lang="hi-Latn"`. The header and footer stay English, and the header links to the other versions only on translated pages. `<html lang>` stays `en`, because only the content area is translated.
- `src/lib/i18n.ts` holds the locales, the languages for each page (`pageLocales`) and the publish flags. `pageMetadata({ locale })` adds hreflang, and `noindex` while unpublished. The sitemap lists the pairs with `xhtml:link` alternates once the flag is on.
- Every translated page uses one shared template for all locales. The three service pages share `ServiceLanding`, with content in `src/content/service-pages.ts` and `src/content/hinglish/service-pages.ts`. The Haridwar and contract labour pages use `src/components/pages/*` with all three languages in `src/content/pages/*.ts`. When the English copy changes, update the other two in the same file.
- Fonts: WOFF2 subsets containing only Devanagari (`AnekDevanagari-Devanagari.woff2` at weight 500, and Hind at 400 to 700) with `unicode-range`. English pages never download them.
- Devanagari type rules in `globals.css`: no letter-spacing, and a taller line-height on headings.

## To publish

1. A native speaker reviews all five pages in that locale against `docs/hindi-glossary.md` and the claims policy.
2. Set `published: true` for that locale in `src/lib/i18n.ts`.
3. Add that locale's URLs to `llms.txt`.
4. Deploy, then request indexing in Search Console.

## Who reads what

| Reader | Searches in | Reads best in |
|--------|-------------|---------------|
| Plant HR, procurement, operations heads | English, some Hinglish ("labour thekedar Haridwar") | English |
| Site supervisors, contractors' contacts | Hinglish and Hindi | Hindi or simple English |
| Workers and job seekers | Hindi, Hinglish, voice search | Hindi |

Hinglish is a way of searching, not a separate language to build. We serve it in two ways. English pages naturally use the terms people type, such as *thekedar*. Hindi pages carry the common Latin-script terms in titles and headings, for example "लेबर ठेकेदार (Labour Contractor) हरिद्वार".

## Structure

- Hindi lives under `/hi/`. For example, `/hi/haridwar-sidcul` and `/hi/services/contract-labour`, with the same slugs as the English pages.
- Every pair declares `hreflang` `en-IN`, `hi-IN` and `x-default` → English, in `alternates.languages` and the sitemap.
- Readers switch with a visible "हिंदी / English" link in the header. There's no automatic redirect by browser language: Google crawls from the US, and people share links.
- JSON-LD `inLanguage: "hi-IN"` on Hindi pages.

## Later phases

- The worker and job-seeker section (see `docs/plan-worker-pipeline.md`) is Hindi-first from the start.
- The homepage and the remaining pages are added once Search Console shows the phase 1 pages earning impressions.
- Privacy and terms come later, with a note that the English version governs.

## Copy rules

- Human translation with review. No raw machine translation.
- Use spoken, everyday Hindi, not Sanskritised Hindi. Keep the English terms people actually use: *PF, ESIC, helper, packing, loading, shift*.
- Keep a shared glossary (`docs/hindi-glossary.md`) so terms stay consistent. For example: contract labour → कॉन्ट्रैक्ट लेबर; labour contractor → लेबर ठेकेदार.
- The claims policy applies unchanged. The slop lint also checks for the Hindi banned words listed in the glossary.

## Measurement

Compare Search Console queries and clicks for pages under `/hi/` with their English pairs at 28 and 90 days. Expand only the pages that show impressions.

