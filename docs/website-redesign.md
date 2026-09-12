# Website direction — 12 September 2026

The brand handbook is stale except for its typography, color palette and logo visual references. This is the user's explicit direction; do not import its positioning, service divisions, copy, process rules or approval workflows into future website work.

Retained references:
- https://brand.vayasyaseva.com/visual/color-palette
- https://brand.vayasyaseva.com/visual/typography
- https://brand.vayasyaseva.com/visual/logo-usage

Use the existing palette tokens: white/slate neutrals, master gold, and the documented accent families. Anek is the display face, Hind carries body/UI text, and JetBrains Mono is reserved for identifiers/data. Do not substitute an earthy green, cream or rust palette.

## Experience

Lead with the company as a contract labour provider with a strong focus on compliance. Capabilities are examples, not an exhaustive or exclusive catalogue. Avoid fixed service counts, public exclusions, unverified turnaround promises and invented proof metrics.

The homepage introduces the company, client experience, capabilities and compliance. Detailed service roles and compliance topics use native disclosures. Important routes remain accessible through ordinary links. The contact form keeps optional details collapsed and preserves the existing validation/API contract.

The production homepage uses static photography, a short CSS entrance, a compact background-aware sticky header and hover states. The header blends surface colors at section boundaries using one requestAnimationFrame callback; its blur radius stays constant. No autoplay video or animated blur. Reduced motion is supported.

## Search

Services, compliance and Haridwar–SIDCUL have distinct search intent, descriptions, canonical URLs and contextual links. Share metadata follows the landing page. Structured data describes visible content; the regional FAQ markup matches its rendered answers. The search sitemap contains public marketing pages; machine discovery endpoints remain linked through llms.txt and agent metadata.

This is an on-site SEO foundation. Search positions are not measured or guaranteed by these changes. Search Console performance, relevant business citations, and authentic project evidence should inform subsequent content work.

## Photography

`public/assets/images/warehouse.webp` is an optimized stock photograph from Pexels:
https://www.pexels.com/photo/men-working-in-factory-warehouse-4483772/

It is illustrative, not evidence of a Vayasya client site. No claim about company facilities or personnel is attached to it. Genuine company photography would make a stronger replacement when available.

## Verification

Production build, TypeScript, ESLint, AI discovery consistency and OpenAPI contract checks passed. Browser checks covered all 11 marketing routes at 320, 390, 768 and 1440 pixels, canonical URLs, one H1 per route, JSON-LD parsing, mobile navigation, native disclosures and reduced motion. Contact validation and success state were exercised with an intercepted request; no enquiry was sent. No browser runtime exceptions were detected.

## Navigation and footer refinement

User requested a denser navbar with background blending, a vertically compact company wordmark, a stronger logo-led footer and substantially more master-brand gold. Header height is 64px on desktop and 58px on mobile. Gold 500 now anchors primary actions and the contact section, with Gold 700 for accessible accents on light surfaces.
