# Redesign changelog — 12 September 2026

Commit `10a0b5d` ("Overhaul marketing site design to editorial layout"). 58 files, +3420 / −3973. Companion to `website-redesign.md`, which records the direction; this file records what actually changed.

## Summary

The card/tile/bento composition was replaced with a photo-led editorial layout: full-bleed hero, two-column intros with an eyebrow gutter, ruled list rows instead of cards, one dark feature band, one gold invitation band. Section-level motion primitives were removed in favour of a single 450 ms CSS entrance. The homepage is now a hand-composed page rather than an assembly of 13 section components.

## Visual system

- **Display face**: Anek Devanagari added (switched to Anek Latin on 13 Sept; the Devanagari cut hooks Latin ascenders) (`--font-anek`, weights 500–700) for the wordmark, H1/H2 and large row headings. Hind stays for body/UI, JetBrains Mono for identifiers. `src/lib/fonts.ts`.
- **Type scale**: display headings are weight 500 (was 700) with tight tracking (−0.035 to −0.055 em). Hero H1 `clamp(64px, 7.7vw, 116px)`; section H2 `clamp(38px, 4.4vw, 62px)`. Body base raised to 17px.
- **Global base rules** (`globals.css` @layer base): `text-wrap: balance` and −0.02em tracking on h1–h3; gold-200 text selection; seva-600 focus ring; styled scrollbar.
- **Removed**: `.section-glow-*` radial ambient glows, `.glow-left`, the gradient-edged `.section-subtle` (a plain version remains). Replaced by flat surfaces and 1px rules (`.rule-top`).
- **Layout shell**: `.site-shell` = `min(100% − 112px, 1280px)` replaces the Tailwind `max-w-7xl px-…` wrapper in `Section`.
- **Hex tokens** lowercased (cosmetic; no value changes).
- **Approx. 1,080 lines of hand-written CSS** added to `globals.css` for the marketing composition (`.home-hero`, `.home-intro`, `.capability-row`, `.compliance-feature`, `.closer-links`, `.contact-invitation`, `.round-link`, footer, `.detail-list`, breakpoints at 1000/700/370 px). A second override block near the end of the file applies the later nav/footer refinement pass (64 px header, gold hairline, gold-tinted capability section). Note: several selectors are defined twice as a result and rely on cascade order.

## Header (`components/layout/header.tsx`, −300 lines)

- Rewritten from the previous mega-header. Sticky, 64 px desktop / 58 px mobile, `backdrop-filter: blur(10px)` at a constant radius.
- **Background-aware**: one scroll/resize listener, one `requestAnimationFrame`, samples the computed background of `main > section, footer` under the header and mixes them by overlap. Sets `--header-surface`, `data-theme="dark|light"` and `data-gold` on the `<header>`. Over the hero it drops to 36% opacity.
- Primary nav trimmed to Services / Industries / Our approach / Compliance / About; phone number and a "Let's talk" pill on the right; hamburger → shadcn Sheet on mobile.
- Skip link + `main#main-content` added.

## Footer (`components/layout/footer.tsx`)

Three-column grid: brand lockup with tagline and address / Company links / "A closer look" (compliance, Haridwar–SIDCUL, Vayasya Setu, Setu login). Registration strip (EPF & ESIC / GST / MSME-Udyam) and a bottom bar with © / GSTIN / Privacy / Terms. Dark neutral-950 surface.

## Homepage (`(marketing)/page.tsx`, rewritten)

Old order: Hero → ProofRail → TrustStrip → ServiceClusters → PersonaBlocks → OperationsTimeline → ComplianceBlock → SetuBlock → EngagementModels → ScopeBoundaries → GeographyBlock → FaqSection → CtaBlock.

New order, composed inline:

1. **Hero** – full-bleed `warehouse.webp` (Pexels stock, see `website-redesign.md`), dark left-to-right shade, eyebrow "People at the heart of work", H1 "Vayasya Seva / Workforce. With care.", one text link. Footer strip: "Based in Haridwar, Uttarakhand" + "A closer look ↓" anchor.
2. **Intro** – "Good work begins with the right people." + link to /about.
3. **Client strip** – three greyscale logos (ITC, Wipro, Unilever) from `trustClients`.
4. **Capabilities** – three ruled rows (workforce, facility & site, industrial & contract works) linking into /services anchors.
5. **Compliance feature** – dark band, "The work matters. So does how it's managed.", EPF & ESIC / GST & MSME registration lines.
6. **Closer look** – three ruled links to /how-we-operate, /industries, /haridwar-sidcul.
7. **CtaBlock** – gold-500 invitation "What's next for your business?" with a 150 px round "Let's talk" link.

## Inner pages

- **New `PageHero`** (`components/layout/page-hero.tsx`): opening band with `tone` light/dark/setu and an optional aside column. Used by all inner pages.
- **New `/haridwar-sidcul`** landing page (134 lines) with regional FAQ + FAQ schema.
- **Services**: 10 service groups as a ruled list, each with a native `<details>` "Typical roles & support" disclosure. Titles shortened ("Warehouse and logistics", "Housekeeping", …) and ampersands replaced with "and".
- **Compliance**: rewritten around registrations, workforce records and client reviews (−295/+…); cards removed.
- **How we operate, Industries, About**: rewritten to the same intro-column + ruled-list pattern.
- **Vayasya Setu**: cut from ~500 lines to a short page (−491).
- **Contact**: form kept the same validation/API contract. Copy simplified ("Name", "Received"); the pre-filled site-assessment message is now a fill-in template; optional details collapsed under a plain `<details>`.
- **error.tsx / not-found.tsx**: shorter copy, phone number on the error page.

## Content (`src/content/`)

- `home.ts` −444 lines: `servicesClusters`, `operationsTimeline`, `setuFeatures`, `personaBlocks`, `engagementModels`, `scopeBoundaries` emptied (types retained). `hero.headline` → "Vayasya Seva. Workforce. With care." `complianceItems` renamed (Registrations / Workforce records / Client reviews). `faqs` and `trustClients` kept.
- `services.ts` −240 net: shorter titles, descriptions rewritten to plain sentences, roles retained.
- `industries.ts`: title case → sentence case.
- `site.ts`: tagline changed; Haridwar–SIDCUL added to navigation.

## Components

- **Deleted**: `motion/reveal.tsx`, `motion/stagger.tsx`, `motion/use-hydrated.ts`, `motion/use-in-view.ts`, `sections/operating-model.tsx`, `sections/proof-rail.tsx`.
- **Added**: `layout/page-hero.tsx`, `sections/roles-band.tsx` (marquee of roles from the services register; currently unused).
- **Deleted the following day (13 Sept)** as dead code: `compliance-block`, `engagement-models`, `faq-section`, `geography-block`, `hero`, `hero-video`, `hero-video-player`, `operations-timeline`, `persona-blocks`, `roles-band`, `scope-boundaries`, `service-clusters`, `setu-block`, `trust-strip`, plus `public/assets/video/hero/` (17 MB), the emptied arrays and their types in `content/`, and `scopeBoundaries` from the MCP compliance resource. Only `cta-block` remains in `sections/`.
- `Section` gained `size` and `tone` props.

## SEO / metadata

- **New `lib/metadata.ts`** `pageMetadata()` helper: title suffixing, OG/Twitter blocks and canonical from one input. Used by every page.
- Root metadata: title "Vayasya Seva | Contract Labour & Workforce Services", new description, keyword list rewritten to Haridwar/SIDCUL long-tail (labour contractor, manpower supply, factory workers, etc.). Canonical `./` (relative).
- `opengraph-image.tsx` rewritten to the new wordmark/tagline composition.
- `sitemap.ts`: machine-discovery URLs (agent cards, openapi, llms.txt, ai-access-policy) removed from the search sitemap; `/haridwar-sidcul` added at 0.9; `lastModified` 2026-09-12. `check-ai-discovery.mjs` updated to check marketing routes instead.
- `llms.txt` / `llms-full.txt`: summary line rewritten; Haridwar–SIDCUL page added.
- `structured-data.tsx`: 28-line change to align schema descriptions with visible copy.

## Tooling

- `docs/ai-slop-registry.md` (209 lines) and `scripts/slop-lint.mjs` + `npm run lint:slop`: prohibited/review-tier phrase scan and em-dash density check over content and pages. Currently reports 0 findings.
- `.gitignore`: `/.playwright-mcp/`.
- `public/assets/images/warehouse.webp` (389 KB) committed.

## Verification (at commit time)

`tsc --noEmit`, `eslint`, `lint:slop` and `next build` all pass; 25 routes generate. Headless screenshots reviewed at 1440 and 390 px for /, /services, /compliance, /haridwar-sidcul, /contact, /about.

## Follow-ups

- `globals.css` has duplicated selectors from the two passes; fold the override block into the base block.
- Services list is 10 identical rows; consider grouping (people / premises / works) so the page has a rhythm.
- Replace the stock hero photo with company photography when available.

## 13 September follow-up

- Header: wordmark text removed (logo only, `aria-label` on the link); gold hairline under the header removed; `.header-inner` now inherits `.site-shell` width so the logo aligns with page content; homepage-at-top logo enlargement (scale 1.33, 300 ms) restored via `data-home`/`data-top` attributes set in the existing rAF update.
- Display face switched from Anek Devanagari to Anek Latin (the Devanagari cut hooks Latin ascenders). Footer wordmark weight 700 → 500 to match site display weight.
- `/brand` added: logo usage, typography and colour palette only; the old brand handbook is retired. Downloads in `public/brand/downloads/` are generated by `npm run brand:assets` (`scripts/build-brand-assets.mjs`): cleaned master SVG, 1024px PNG, logo kit ZIP (PNG 256–2048, plated variants, icon set, README) and a font pack ZIP (Anek Latin, Hind, JetBrains Mono TTFs from google/fonts with OFL licences). Swatches copy hex on click.
- Vertical colours retired (13 Sept). Every product carries Vayasya Gold; the four scales were renamed Saffron / Indigo / Forest / Slate (tokens `--saffron-*` etc.) and kept only as an extended palette for charts, templates and Setu theme options. All website accent usage (`text-seva`, `var(--seva)`, focus ring) moved to gold-700 / gold-500. `/brand` headings made literal (Brand guidelines, Logo usage, Typography, Colour palette).
- MCP server, agent cards (`/.well-known/agent*.json`) and `@modelcontextprotocol/sdk` removed (13 Sept). Agents are directed at the public HTML pages and their JSON-LD; `llms.txt`, `llms-full.txt` and `ai-access-policy.txt` remain as an index. `robots.txt` is a single blanket allow with only `/api/` disallowed, and `check-ai-discovery.mjs` enforces that.
