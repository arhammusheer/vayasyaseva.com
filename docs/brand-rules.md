# Brand Rules -- VSPL

---

## 1. Brand Position

> Compliance-first workforce operations partner for industrial environments.

VSPL is not a staffing agency. The messaging must position the company as an **operations partner** -- one that owns process, compliance, and on-ground execution for enterprise clients in warehousing, logistics, manufacturing, facilities, and hospitality-linked environments.

---

## 2. Tone of Voice

| Attribute | Description |
|-----------|-------------|
| **Precise** | State what we do in concrete terms. Avoid vague qualifiers. |
| **Factual** | Every claim must be supportable. Cite registrations, numbers, or process details where possible. |
| **Respectful** | Workforce members are referred to with dignity. Never use language that reduces people to "resources" or "manpower supply". Preferred terms: workforce, team members, associates, deployed personnel. |
| **Reliable** | The tone conveys steadiness -- not excitement. We are not a startup pitching disruption. We are an operations partner that shows up, every shift, compliant and ready. |

### Tone Do / Don't

| Do | Don't |
|----|-------|
| "We deploy trained associates within 48 hours of contract activation." | "We provide the best manpower solutions instantly." |
| "Statutory filings (PF, ESI) completed within mandated timelines." | "We guarantee seamless compliance." |
| "Serving enterprise clients across the Haridwar-SIDCUL industrial corridor." | "We are India's leading workforce company." |

---

## 3. Visual Identity

### Logo
- Flat gold logomark on white or dark backgrounds.
- Minimum clear space: 1x the height of the logomark on all sides.
- Never stretch, rotate, recolor, or add effects to the logo.

### Design System

| Principle | Rule |
|-----------|------|
| Layout | White-heavy interface. Generous whitespace. Enterprise minimal aesthetic. |
| Imagery | Photography of real industrial environments preferred. No generic stock of people shaking hands in suits. |
| Icons | lucide-react icon set. Consistent stroke width, 24px default. |
| Borders | Subtle, muted. Used to define sections, not decorate. |
| Shadows | Minimal. Use only for elevated components (dropdowns, modals). |
| Radius | Small and consistent (`rounded-md` or `rounded-lg`). No pill shapes on primary UI elements. |

---

## 4. Color Tokens

### Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `bg.base` | `#FFFFFF` | Primary background, page canvas |
| `bg.subtle` | `#F8FAFC` | Secondary background, alternating sections, card fills |
| `text.primary` | `#0F172A` | Headlines, body text, primary content |
| `text.secondary` | `#334155` | Supporting text, descriptions, captions |
| `border.muted` | `#E2E8F0` | Card borders, dividers, input outlines |

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `brand.seva.accent` | `#C97A2B` | Primary accent -- CTAs, active states, key highlights |
| `brand.gold.onLight` | `#B8892D` | Gold used on light backgrounds (logo, subtle accents) |
| `brand.gold.onDark` | `#D3A23A` | Gold used on dark backgrounds (footer, dark sections) |

### State Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `state.success` | `#166534` | Success messages, confirmation indicators |
| `state.warning` | `#B45309` | Warning states, attention notices |
| `state.error` | `#B91C1C` | Error messages, destructive actions |

### Contrast Notes
- `text.primary` on `bg.base` -- contrast ratio 15.4:1 (AAA)
- `brand.seva.accent` on `bg.base` -- verify usage at font sizes >= 18px for AA compliance
- `brand.gold.onDark` on dark backgrounds (#0F172A or darker) -- verify >= 4.5:1 for body text

---

## 5. Typography

### Font Stack

| Role | Font | Fallback | Weight range |
|------|------|----------|--------------|
| Display (headlines, nav, section titles) | **Anek Devanagari** | system-ui, sans-serif | 500, 600, 700 |
| Serif (body, paragraphs, long-form copy) | **Hind** | system-ui, sans-serif | 300, 400, 500, 600, 700 |
| Mono (IDs, metrics, labels, code/data) | **JetBrains Mono** | ui-monospace, monospace | 400, 500 |

### Type Scale

| Element | Size (mobile) | Size (desktop) | Weight | Line height |
|---------|---------------|----------------|--------|-------------|
| H1 | 2rem (32px) | 3rem (48px) | 700 | 1.15 |
| H2 | 1.5rem (24px) | 2.25rem (36px) | 600 | 1.2 |
| H3 | 1.25rem (20px) | 1.5rem (24px) | 600 | 1.3 |
| H4 | 1.125rem (18px) | 1.25rem (20px) | 500 | 1.4 |
| Body | 1rem (16px) | 1rem (16px) | 400 | 1.6 |
| Small / Caption | 0.875rem (14px) | 0.875rem (14px) | 400 | 1.5 |

### Rules
- Never use more than two heading levels on a single viewport without body text between them.
- Body text minimum 16px. Never smaller for paragraph content.
- Line length capped at ~72 characters for readability on wide screens.
- Use `Display` on semantic headings (`h1`-`h6`) and title primitives (cards, dialogs, sheets, accordions).
- Use `Serif` as the default page/body family.
- Use `Mono` for numeric or machine-like content (status codes, phone, GSTIN/MSME, data badges, inline code).

---

## 6. Spacing Principles

| Principle | Rule |
|-----------|------|
| Base unit | 4px (`0.25rem`). All spacing values must be multiples of 4. |
| Section padding | `py-16` (64px) minimum on desktop, `py-10` (40px) on mobile. |
| Component gaps | Use `gap-4` (16px) to `gap-8` (32px) for component spacing within sections. |
| Card padding | `p-6` (24px) standard. `p-8` (32px) for featured cards. |
| Consistency | Identical component types must have identical spacing. No one-off overrides. |
| Breathing room | When in doubt, add more whitespace. Dense layouts undermine the enterprise-minimal aesthetic. |

---

## 7. Logo Usage on Dark Backgrounds

- Use `brand.gold.onDark` (#D3A23A) for the logo on dark sections.
- Footer background: `text.primary` (#0F172A) or darker.
- Ensure logo remains legible -- test at multiple sizes.

---

## 8. Client Logo Display

- Client logos (ITC Limited, Wipro, Unilever) displayed in grayscale by default.
- On hover or in featured placement, original color may be used.
- All client logos require documented usage approval. See `docs/content-approval-workflow.md`.
