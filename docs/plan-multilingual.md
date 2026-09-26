# Plan: English, Hinglish and Hindi experience

Status: proposal, 26 September 2026. Nothing built.

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
- Content lives in `src/content/hi/`, mirroring the English files. Page components are shared and take the content as props, the way `ServiceLanding` already does.
- JSON-LD `inLanguage: "hi-IN"` on Hindi pages.

## Phase 1 scope

1. Homepage, `/haridwar-sidcul`, `/services/contract-labour`, and the three service pages.
2. The worker and job-seeker section (see `docs/plan-worker-pipeline.md`) is Hindi-first from the start.
3. Privacy and terms come later, with a note that the English version governs.

## Type

Hind already includes Devanagari. The self-hosted WOFF2 files are Latin-only subsets, so add a Devanagari subset for Hind, loaded only on `/hi/` pages via `unicode-range`. For headings, pick either Hind SemiBold or the Devanagari glyphs of Anek. The Anek Devanagari cut was rejected on 13 September for its Latin ascenders, which wouldn't matter if it were used only for Devanagari text. That is a brand decision.

## Copy rules

- Human translation with review. No raw machine translation.
- Use spoken, everyday Hindi, not Sanskritised Hindi. Keep the English terms people actually use: *PF, ESIC, helper, packing, loading, shift*.
- Keep a shared glossary (`docs/hindi-glossary.md`) so terms stay consistent. For example: contract labour → ठेका श्रमिक / कॉन्ट्रैक्ट लेबर; labour contractor → लेबर ठेकेदार.
- The claims policy applies unchanged. Add the Hindi equivalents of the banned words to the slop lint: गारंटी, हमेशा, 100%, सर्वश्रेष्ठ, नंबर 1.

## Measurement

Compare Search Console queries and clicks for pages under `/hi/` with their English pairs at 28 and 90 days. Expand only the pages that show impressions.

## Decisions needed

1. Who translates and reviews?
2. Which font for Devanagari headings?
3. Confirm phase 1 scope.
