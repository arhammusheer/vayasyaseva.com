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

Every page is at `/<locale><path>`, for example `/en-in/about`, `/hi-in/jobs`, `/hi-latn-in/services/housekeeping`. The path without a locale (`/about`, `/jobs`) is the page's **neutral URL**. What it does is set per page in the page registry, `src/content/registry/pages.ts` (`neutral`); `pages` in `src/lib/i18n.ts` is derived from it:

1. **Default in code:** the neutral URL redirects (308) to English. A path not in the registry is treated as English only, so it lands on `/en-in/...` and 404s there.
2. **`neutral` set to a locale:** the neutral URL redirects (308) to that locale.
3. **`neutral` set to `"prompt"`:** the neutral URL shows a language picker. The address bar keeps the neutral URL, and each choice links to that page in one language. Query strings carry over, so `/jobs?utm_source=whatsapp` keeps its tag.

`/jobs` and every `/jobs/<role>` page use `"prompt"`. Share `www.vayasyaseva.com/jobs` when you don't know which language the person reads.

Redirects from a neutral URL are permanent (308), so ranking moves to the locale URL. If a page's default changes later, browsers that cached the old redirect still land on a real page. The one catch: if a page is later switched to `"prompt"`, those browsers skip the picker until their cache clears. hreflang `x-default` is always the default language's page: never a redirect, and never the picker, which is noindex (18 Oct 2026: Google indexed the pickers in place of the pages they lead to).

Other rules, in `src/proxy.ts`:

- A locale the page doesn't have (e.g. `/hi-in/about`) resolves as the neutral URL, so `/hi-in/about` goes to `/en-in/about`. This redirect is temporary (307), because it stops applying once the translation exists.
- The old prefixes (`/hi/*`, and the old Latin-script prefix) are mapped in the proxy's locale routing (`fromLegacyPrefix` in `src/lib/i18n.ts`), not in `next.config.ts`, whose redirects would run first. The mapped URL is then routed like any other, so an old link takes one redirect to its final page even when that page has since retired or lost a language (`tests/legacy-redirects.spec.mjs`). That redirect is permanent (308) even where the mapped URL's own is temporary (`/hi` to `/en-in` while the Hindi home is unbuilt): the old prefix never comes back. An old URL whose page 404s answers 404 itself, with no hop. On the apex host they go straight to www, so they are one hop too.
- The picker's internal route (`/select-language/...`) is reached only by rewrite; visiting it directly redirects to the neutral URL. Only a real order key (2–3 distinct codes, then an optional known share variant) is stripped: `/select-language/hi` goes to `/hi`.
- The picker's order is chosen per request (PLAN §6.4, `src/lib/language-rank.ts`). Signals, in order: the `vspl_lang` cookie (set only when someone picks a language on the picker; it holds only the locale), non-English `Accept-Language` tags by q-value (`hi` pulls Hinglish in right after हिंदी), the visitor's state from the geo headers (`x-vercel-ip-country-region` on Vercel; `CF-IPCountry` plus `cf-region-code` behind Cloudflare, read by one helper, `visitorRegion`), the page's cluster (a jobs page without its own uses the one cluster with a published jobs hub, today Haridwar, so `/jobs` stays Hindi-first when the region is missing or misread), then the default set. Sets: Hindi belt हिंदी · Hinglish · English; Punjab Hinglish · English · हिंदी; Karnataka English · Hinglish · हिंदी until kn-IN exists; default, crawlers and outside India English · हिंदी · Hinglish.
- The proxy turns the order into a short key (`hi-hl-en`) and rewrites to `/select-language/<key>/<path>` (on `/jobs/apply`, `<key>_<share variant>` for `?role=`/`?hub=` links). Every key is prerendered, so no page renders per visit. The top three choices are large; any others sit under a "More languages" `<details>`. Every variant lists every language as an `<a hreflang>` link, and the canonical stays the neutral URL, so crawlers see the same page in a different order. The picker is `noindex, follow` and carries no hreflang set; it is not an x-default target (18 Oct 2026). Title and meta description are the English page's own, the same in every variant: one snippet per canonical URL. Each choice shows its page's title and short description in its own language (8-hour shifts, no fee). Devanagari on the picker uses the phone's own font. The response carries `CDN-Cache-Control: no-store` and `Cloudflare-CDN-Cache-Control: no-store`, so no shared cache in front of a self-hosted server keeps one visitor's order; `Vercel-CDN-Cache-Control` keeps Vercel's cache, which keys on the variant path. `pnpm seo:check` asserts the snippet, the headers and the one-hop redirects.
- `language_choice` carries `position` (1–3, or `more`) and `order_key`. After 30 days, if fewer than about seven in ten choices are the first option of a set, revisit that set.
- The header quick switch is fixed per page, never per visitor: the page market's `quickSwitch` (`src/markets/data.ts`), else English · हिंदी · Hinglish. Languages outside that set go under "More" ("और भाषाएँ" / "Aur bhasha" on Hindi and Hinglish jobs pages), which closes on Escape, a tap outside it and a new page. Each link has the language's hint ("Ye page Hindi mein padhein, English letters mein") as its `title`.
- The apex host (`vayasyaseva.com/x`) redirects in the proxy, straight to the resolved `https://www.vayasyaseva.com/<locale>/x`: one hop instead of two.

### Adding or changing a page's languages

1. Set the page's `locales` (each language with its status) and `neutral`, if any, in `src/content/registry/pages.ts`. Start a new language at `review`: it is built, `noindex`, left out of the sitemap and hreflang, and links from published pages go to another language. Set it to `published` once reviewed. The status rules are in `src/content/registry/identifiers.ts` (`PAGE_STATUSES`).
2. Give the page the copy for each locale and read the locale from its params (`localeOfParams`). Its `generateStaticParams` is `localeParams("/the-path")`, so only its languages are built.
3. Write in-site links as neutral paths (`<Link href="/contact">`). `@/components/i18n/link` points them at the reader's current locale when the target page has it, else the target's default language.

## Languages by page (1 October 2026)

The homepage and every business-facing page stay English. Translate a page only where searchers write in that script and would still want that page.

| Page | Languages | Neutral URL | Reason |
|------|-----------|-------------|--------|
| `/`, `/services`, `/services/factory-labour`, `/services/loading-unloading-labour`, `/services/housekeeping`, `/about`, `/vayasya-setu`, `/compliance`, `/contact`, `/brand`, `/privacy`, `/terms` | en-IN | English | Business buyers; legal text in one reviewed version. Business pages are English only since 16 Oct 2026: the Hinglish service landings 308 to English |
| `/locations/haridwar` (was `/haridwar-sidcul`) | en-IN, hi-IN, hi-Latn-IN | English | Core local search terms in every script; the one location page with translations so far (any Hindi-belt hub may join: `LOCATION_HUB_LOCALES`) |
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
- `src/content/registry/` holds the page registry (every page, its languages and each one's status), the clusters with public pages, and the canonical identifiers. `src/lib/i18n.ts` holds the locales, the publish flags and the link helpers, and derives `pages` from the registry. `pageMetadata({ locale })` adds the canonical, hreflang and `noindex` unless both the locale and the page's status are published. The sitemap lists each page once per published locale, with `xhtml:link` alternates.
- Every translated page uses one shared template for all locales. The three service landings are English only and share `ServiceLanding`, with content in `src/content/service-pages.ts`. The Haridwar and jobs pages use `src/components/pages/*` with all three locales in `src/content/pages/*.ts`. When the English copy changes, update the others in the same file.
- Fonts: WOFF2 subsets of Hind containing only Devanagari (Regular, SemiBold for weights 500–600, Bold) with `unicode-range`. Devanagari headings use Hind SemiBold, not Anek Devanagari, to keep a first Hindi visit light (16 October 2026). Pages without Devanagari never download them.
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
