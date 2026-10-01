# Plan: English and Hindi experience

Status: live. हिंदी (hi-IN) and Hindi in Latin script (hi-Latn-IN) are published (`published: true` in `src/lib/i18n.ts`). Since 1 October 2026 every page lives under a locale segment, and English is no longer the unprefixed default.

## Locales

| Locale | Shown to readers as | URL segment | Script |
|--------|---------------------|-------------|--------|
| `en-IN` | English | `/en-in` | Latin |
| `hi-IN` | हिंदी | `/hi-in` | Devanagari |
| `hi-Latn-IN` | Hindi | `/hi-latn-in` | Hindi in Latin script |

The locale code is the BCP 47 tag, used as is in `<html lang>`, hreflang and JSON-LD `inLanguage`. `hi-Latn-IN` reads as language Hindi, script Latin, region India. URL segments are the lowercase tag. Other casings (`/hi-IN/jobs`) redirect permanently to the lowercase URL.

Labels: readers see "English", "हिंदी" and "Hindi". Don't call hi-Latn-IN anything else on the site. In code and docs, use the locale code or "Hindi in Latin script".

Google does not treat Hindi in Latin script as its own search language and may read these pages as English or Hindi. The hreflang tags tell it the pages are translations of each other, so they don't compete.

## Routing

Every page is at `/<locale><path>`, for example `/en-in/about`, `/hi-in/jobs`, `/hi-latn-in/services/housekeeping`. The path without a locale (`/about`, `/jobs`) is the page's **neutral URL**. What it does is set per page in `pages` in `src/lib/i18n.ts`:

1. **Default in code:** the neutral URL redirects (308) to English. A page not listed in `pages` is English only.
2. **Page override set to a locale:** the neutral URL redirects (308) to that locale, e.g. `{ locales: ["en-IN", "hi-IN"], override: "hi-IN" }`.
3. **Page override set to `"prompt"`:** the neutral URL shows a language picker. The address bar keeps the neutral URL, and each choice links to that page in one language. Query strings carry over, so `/jobs?utm_source=whatsapp` keeps its tag.

`/jobs` and every `/jobs/<role>` page use `"prompt"`. Share `www.vayasyaseva.com/jobs` when you don't know which language the person reads.

Redirects from a neutral URL are permanent (308), so ranking moves to the locale URL. If a page's default changes later, browsers that cached the old redirect still land on a real page. The one catch: if a page is later switched to `"prompt"`, those browsers skip the picker until their cache clears. hreflang `x-default` never points at a redirect: it is the neutral URL on picker pages (which answer there) and the default language's page on all others.

Other rules, in `src/proxy.ts`:

- A locale the page doesn't have (e.g. `/hi-in/about`) resolves as the neutral URL, so `/hi-in/about` goes to `/en-in/about`. This redirect is temporary (307), because it stops applying once the translation exists.
- The old prefixes redirect permanently in `next.config.ts`: `/hi/*` to `/hi-in/*`, and the old Latin-script prefix to `/hi-latn-in/*`.
- The picker's internal route (`/select-language/...`) is reached only by rewrite; visiting it directly redirects to the neutral URL.

### Adding or changing a page's languages

1. Set the page's `locales` (and `override`, if any) in `pages` in `src/lib/i18n.ts`.
2. Give the page the copy for each locale and read the locale from its params (`localeOfParams`). Its `generateStaticParams` is `localeParams("/the-path")`, so only its languages are built.
3. Write in-site links as neutral paths (`<Link href="/contact">`). `@/components/i18n/link` points them at the reader's current locale when the target page has it, else the target's default language.

## Languages by page (1 October 2026)

The homepage and every business-facing page stay English. Translate a page only where searchers write in that script and would still want that page.

| Page | Languages | Neutral URL | Reason |
|------|-----------|-------------|--------|
| `/`, `/services`, `/industries`, `/how-we-operate`, `/about`, `/vayasya-setu`, `/compliance`, `/contact`, `/brand`, `/privacy`, `/terms` | en-IN | English | Business buyers; legal text in one reviewed version |
| `/haridwar-sidcul`, `/services/contract-labour` | en-IN, hi-IN, hi-Latn-IN | English | Core local search terms in every script |
| `/services/warehouse-labour`, `/services/factory-labour`, `/services/housekeeping` | en-IN, hi-Latn-IN | English | Devanagari searches for these are mostly from job seekers, not buyers |
| `/jobs`, `/jobs/<role>` | en-IN, hi-IN, hi-Latn-IN; hi-IN first | Language picker | Workers read हिंदी and type in Latin script; skilled roles use English. The link is often shared on a call |

Later: `/privacy` in hi-IN, so worker applicants can read the data notice (DPDP). Latin-script Hindi is too loose for legal text.

Revisit this split with Search Console data.

## Decisions

- Claude drafts the Hindi; a native speaker on the VSPL team reviews it before publishing.
- Headings: Anek Devanagari, used only for Devanagari characters. Latin text stays in Anek Latin.
- 1 October 2026: every page moved under a locale segment, with per-page neutral URL behaviour and the language picker for `/jobs`. The Latin-script locale became `hi-Latn-IN`, shown as "Hindi".

## How it is built

- `src/app/[locale]/layout.tsx` is the root layout, so `<html lang>` is the page's locale. The header and footer are English and carry `lang="en-IN"`.
- `src/app/(picker)/` is a second root layout for the language picker (`<html lang="en-IN">`, each choice marked with its own language). `src/app/global-not-found.tsx` serves URLs no route matches.
- `src/lib/i18n.ts` holds the locales, the `pages` registry, the publish flags and the link helpers. `pageMetadata({ locale })` adds the canonical, hreflang and `noindex` while unpublished. The sitemap lists each page once per published locale, with `xhtml:link` alternates.
- Every translated page uses one shared template for all locales. The three service pages share `ServiceLanding`, with content in `src/content/service-pages.ts` and `src/content/hi-latn/service-pages.ts`. The Haridwar, contract labour and jobs pages use `src/components/pages/*` with all three locales in `src/content/pages/*.ts`. When the English copy changes, update the others in the same file.
- Fonts: WOFF2 subsets containing only Devanagari (`AnekDevanagari-Devanagari.woff2` at weight 500, and Hind at 400 to 700) with `unicode-range`. Pages without Devanagari never download them.
- Devanagari type rules in `globals.css` apply to `:lang(hi)` but not `:lang(hi-Latn)`: no letter-spacing, and a taller line-height on headings.
- The jobs form still sends the intake source `web_hinglish` for hi-Latn-IN. It is a stored value shared with n8n and its database (`integrations/n8n/schema.sql`); renaming it needs a migration and an n8n deploy.

## To publish a locale

1. A native speaker reviews every page in that locale against `docs/hindi-glossary.md` and the claims policy.
2. Set `published: true` for that locale in `src/lib/i18n.ts`.
3. Add that locale's URLs to `llms.txt`.
4. Deploy, then request indexing in Search Console.

## Who reads what

| Reader | Searches in | Reads best in |
|--------|-------------|---------------|
| Plant HR, procurement, operations heads | English, some Hindi in Latin script ("labour thekedar Haridwar") | English |
| Site supervisors, contractors' contacts | Hindi in either script | हिंदी or simple English |
| Workers and job seekers | Hindi in either script, voice search | हिंदी |

English pages naturally use the terms people type, such as *thekedar*. हिंदी pages carry the common Latin-script terms in titles and headings, for example "लेबर ठेकेदार (Labour Contractor) हरिद्वार".

## Copy rules

- Human translation with review. No raw machine translation.
- Use spoken, everyday Hindi, not Sanskritised Hindi. Keep the English terms people actually use: *PF, ESIC, helper, packing, loading, shift*.
- Keep a shared glossary (`docs/hindi-glossary.md`) so terms stay consistent. For example: contract labour → कॉन्ट्रैक्ट लेबर; labour contractor → लेबर ठेकेदार.
- The claims policy applies unchanged. The slop lint also checks for the Hindi banned words listed in the glossary.

## Measurement

Compare Search Console queries and clicks for pages under `/hi-in/` and `/hi-latn-in/` with their `/en-in/` pairs at 28 and 90 days. Expand only the pages that show impressions. Indexed URLs moved on 1 October 2026; watch the Pages report for the move to the locale URLs.
