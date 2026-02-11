# VSPL Website Rebuild — Project Status Report

**Date:** 2026-02-11
**Stack:** Next.js 16.1.6, React 19, TypeScript, Tailwind CSS 4, shadcn/ui 3
**Build status:** Clean (0 errors, 0 warnings)

---

## Phase Completion Summary

| Phase | Description | Status | Notes |
|-------|-------------|--------|-------|
| Pre-Phase 0 | Project bootstrap (Next.js + shadcn) | DONE | All deps installed, build passes |
| Phase 0 | Project charter & docs | DONE | 4 docs in `/docs/` |
| Phase 1 | Technical setup & folder architecture | DONE | Folder structure, fonts, tokens |
| Phase 2 | Design system & tokens | DONE | Brand colors, Hind font, Section/SectionHeader primitives |
| Phase 3 | Content modeling | DONE | Typed content in `src/content/` — no stubs or placeholders |
| Phase 4 | Global layout & navigation | DONE | Header (sticky + mobile sheet), footer, marketing layout |
| Phase 5 | Homepage | DONE | 9 sections: hero, trust, services, timeline, compliance, setu, geography, FAQ, CTA |
| Phase 6 | Services + Industries pages | DONE | 6 services with included/not-included, 5 industries with staffing/risk/reporting |
| Phase 7 | How We Operate + Compliance | DONE | 5-step process, escalation framework, documentation matrix, governance blocks |
| Phase 8 | Vayasya Setu page | DONE | Capabilities, outputs, integration options, data governance |
| Phase 9 | Lead capture & contact | PARTIAL | Form UI + Zod validation done; **backend not implemented** |
| Phase 10 | SEO, analytics, performance | PARTIAL | Metadata + sitemap done; **analytics not set up** |
| Phase 11 | Legal/policy & QA hardening | NOT STARTED | Privacy, terms, accessibility, error pages all missing |
| Phase 12 | Launch & iteration | NOT STARTED | CI/CD, monitoring, A/B testing |

---

## Critical Issues (Must fix before launch)

### 1. All image assets are missing

The `public/` directory contains only `robots.txt` and `favicon.ico` (default Next.js). Every referenced image is missing:

| Missing File | Referenced In | Impact |
|---|---|---|
| `/assets/clients/ITC-light.png` | `src/content/home.ts:23` | Trust strip broken images |
| `/assets/clients/ITC-dark.png` | `src/content/home.ts:24` | Trust strip broken images |
| `/assets/clients/Wipro-light.png` | `src/content/home.ts:29` | Trust strip broken images |
| `/assets/clients/Wipro-dark.png` | `src/content/home.ts:30` | Trust strip broken images |
| `/assets/clients/Unilever-light.png` | `src/content/home.ts:35` | Trust strip broken images |
| `/assets/clients/Unilever-dark.png` | `src/content/home.ts:36` | Trust strip broken images |

**Also missing:** VSPL logo (no logo file exists anywhere — the header uses text-only fallback), favicon.

**Action needed:** Supply all logo/image files, or set `visible: false` on trust clients until logos are available.

### 2. Contact form has no backend

**File:** `src/app/(marketing)/contact/contact-form.tsx:57-63`

```typescript
async function onSubmit(data: ContactFormData) {
  // TODO: Connect to API route / webhook
  console.log("Form submitted:", data);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  setSubmitted(true);
}
```

- Form data is logged to console and discarded
- No API route exists (`src/app/api/` is empty)
- No email delivery, no webhook, no database
- User sees a fake "success" message

**Action needed:** Create `src/app/api/contact/route.ts` with email sending or webhook integration.

### 3. Privacy Policy and Terms pages don't exist

Footer links reference two pages that will 404:

- `/privacy` — linked from `src/content/site.ts:24`
- `/terms` — linked from `src/content/site.ts:25`

**Action needed:** Create `src/app/(marketing)/privacy/page.tsx` and `src/app/(marketing)/terms/page.tsx` with legal content.

### 4. Console.log in production code

**File:** `src/app/(marketing)/contact/contact-form.tsx:59`

```typescript
console.log("Form submitted:", data);
```

**Action needed:** Remove before deployment.

---

## High Priority Issues

### 5. No favicon or web manifest

- Default Next.js favicon at `src/app/favicon.ico` exists but is the generic Next.js icon
- No Apple touch icons
- No `manifest.json` / web app manifest
- No Open Graph image

**Action needed:** Replace `src/app/favicon.ico` with VSPL logo; add OG image.

### 6. No custom error pages

- No `src/app/not-found.tsx` (custom 404)
- No `src/app/error.tsx` (error boundary)
- Users hitting a bad URL see the default Next.js 404

**Action needed:** Create branded 404 and error pages.

### 7. No analytics or event tracking

- No Google Analytics / GA4
- No Vercel Web Analytics
- No CTA click tracking
- No form start/submit event tracking
- No phone/email click tracking

**Action needed:** Add analytics provider to layout, instrument key events.

---

## Medium Priority Issues

### 8. Dark mode structurally prepared but not functional

- shadcn components include `dark:` class variants
- CSS variables only defined for `:root` (light mode) — no `.dark` overrides with brand colors
- No theme provider (next-themes not installed)
- No dark mode toggle in header

**Action needed:** Either implement fully or remove dark mode CSS to reduce confusion.

### 9. No `.env.example`

- `.gitignore` correctly excludes `.env*`
- But no `.env.example` to guide developers
- Contact info is hardcoded in `src/content/site.ts` (acceptable for now)
- Future API keys, webhook URLs, analytics IDs will need env vars

### 10. Package.json scripts are minimal

Current:
```json
"dev", "build", "start", "lint"
```

Missing:
- `type-check` (`tsc --noEmit`)
- `lint:fix` (`eslint --fix`)
- `format` (Prettier — not installed)

### 11. No CI/CD configuration

- No `.github/workflows/`
- No `vercel.json`
- No pre-commit hooks (husky/lint-staged)
- No automated build/lint/typecheck on PR

### 12. Empty directories

| Directory | Status |
|---|---|
| `src/hooks/` | Empty — no custom hooks written |
| `src/styles/` | Empty — all styles in globals.css |
| `src/app/api/` | Empty — no API routes |

Not harmful, but adds clutter. Can remove unused ones.

---

## Low Priority / Nice-to-Have

### 13. Accessibility gaps

**Good:**
- Form labels properly linked
- Alt text on images
- Semantic HTML (sections, headings)
- ARIA attributes in shadcn form components

**Missing:**
- No skip-to-main-content link
- No `role="status"` on form success message (screen reader won't announce it)
- No heading hierarchy audit done
- No keyboard navigation testing performed

### 14. Contact form query param not wired

The hero secondary CTA links to `/contact?type=assessment` but the contact form doesn't read or use the `type` query parameter. The form is identical regardless.

### 15. Unused dependencies in `package.json`

- `tw-animate-css` — imported but no custom animations defined
- These are harmless but add bundle weight

---

## What IS Complete and Working

### Content (fully populated, no placeholders)
- `src/content/home.ts` — 9 homepage sections with real copy
- `src/content/services.ts` — 6 detailed services with roles, shift patterns, included/not-included
- `src/content/industries.ts` — 5 industry sectors with staffing/risk/reporting
- `src/content/site.ts` — Company info, nav, footer links
- `src/content/types.ts` — Full TypeScript type definitions

### Pages (8 pages, all build successfully)
- `/` — Homepage with all 9 sections
- `/services` — Detailed service cards with scope boundaries
- `/industries` — Per-sector operating model
- `/how-we-operate` — 5-step process + escalation framework
- `/compliance` — Registrations, documentation matrix, governance
- `/vayasya-setu` — Capabilities, outputs, integration, data governance
- `/about` — Overview, philosophy, governance, footprint
- `/contact` — Lead form (11 fields) + direct contact info

### Brand system
- Color tokens: VSPL gold (#C97A2B), slate text, white backgrounds
- Typography: Hind (with Devanagari) primary, Inter fallback
- Consistent section padding, max-width, spacing
- Reusable `Section`, `SectionHeader`, `CtaBlock` components

### SEO
- Per-page `<Metadata>` exports with title, description
- Title template: `%s | Vayasya Seva Private Limited`
- OpenGraph tags on root layout
- `sitemap.xml` auto-generated
- `robots.txt` in place

### Code quality
- 0 TypeScript errors
- 0 ESLint errors
- 0 ESLint warnings
- All imports resolve
- Zod form validation schema complete

### Documentation
- `docs/charter.md` — Project scope and constraints
- `docs/brand-rules.md` — Visual identity and tone
- `docs/claim-policy.md` — Claim categories and review
- `docs/content-approval-workflow.md` — Content review process

---

## Suggested Priority Order for Remaining Work

1. **Supply image assets** (logo, client logos, favicon) — or disable trust strip
2. **Create contact form API route** — connect to email/webhook
3. **Remove console.log** from contact-form.tsx
4. **Create Privacy Policy + Terms pages** — legal requirement
5. **Replace favicon** with VSPL branding
6. **Create custom 404 page**
7. **Add analytics** (GA4 or Vercel)
8. **Add .env.example** and env var handling
9. **Setup CI/CD** (GitHub Actions: lint + typecheck + build)
10. **Accessibility pass** (skip nav, ARIA roles, heading audit)
