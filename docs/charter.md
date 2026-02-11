# Project Charter -- VSPL Website Rebuild

**Entity:** Vayasya Seva Private Limited (VSPL)
**Project:** Marketing website rebuild -- vayasyaseva.com
**Stack:** Next.js 16 App Router + shadcn/ui + Tailwind CSS v4

---

## 1. Scope

An 8-page, statically-generated marketing website that positions VSPL as a compliance-first workforce operations partner for industrial environments.

### Pages

| # | Route | Purpose |
|---|-------|---------|
| 1 | `/` (Home) | Hero, value proposition, trust signals, CTA |
| 2 | `/services` | Service categories with detail sections |
| 3 | `/industries` | Industry verticals served (warehousing, logistics, manufacturing, facilities, hospitality-linked) |
| 4 | `/how-we-operate` | Process walkthrough -- onboarding, deployment, supervision, reporting |
| 5 | `/compliance` | Statutory compliance posture, PF/ESI/wages, audit readiness |
| 6 | `/vayasya-setu` | Vayasya Setu platform/initiative (bridge between workforce and opportunity) |
| 7 | `/about` | Company background, leadership, GSTIN, MSME registration, region |
| 8 | `/contact` | Contact form, phone, email, office address |

### Navigation

Primary nav items in order: **Home, Services, Industries, How We Operate, Compliance, Vayasya Setu, About, Contact**

---

## 2. Technology Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, RSC by default) |
| UI components | shadcn/ui |
| Styling | Tailwind CSS v4 |
| Forms | react-hook-form + zod |
| Icons | lucide-react |
| Hosting | Vercel (target) |
| Analytics | TBD (likely Vercel Analytics or Plausible) |

---

## 3. Non-Negotiables

1. **Compliance-first messaging.** Every claim about statutory compliance, workforce welfare, or audit readiness must be factual and defensible. No aspirational language presented as fact.
2. **Mobile-first.** All layouts designed for 360px baseline, progressively enhanced to desktop.
3. **No unqualified claims.** Words like "best", "world-class", "seamless", or "revolutionary" are prohibited. See `docs/claim-policy.md`.
4. **Performance budget.** Largest Contentful Paint under 2.5s on 4G. Total blocking time under 200ms.
5. **Accessibility.** WCAG 2.1 AA minimum. Semantic HTML, sufficient contrast, keyboard navigable.
6. **Legal accuracy.** GSTIN, MSME number, and any registration details must be verified before publishing.

---

## 4. Target Personas

| Persona | Role | Primary concern |
|---------|------|-----------------|
| Plant/Ops Head | Oversees site operations at manufacturing or warehouse facilities | Workforce reliability, shift coverage, zero disruption |
| Warehouse Manager | Manages day-to-day warehouse ops including loading/unloading | Worker availability, safety compliance, throughput |
| Procurement/Admin | Handles vendor empanelment and contract execution | Documentation, pricing transparency, vendor credibility |
| HR/Compliance Manager | Ensures statutory compliance across contract workforce | PF/ESI filings, wage compliance, audit trail |
| Finance/Audit | Reviews vendor invoices and compliance documentation | Invoice accuracy, statutory proof, reconciliation ease |

---

## 5. Acceptance Criteria

- [ ] All 8 pages render correctly on Chrome, Safari, Firefox, Edge (latest two versions)
- [ ] Mobile-first layouts verified at 360px, 768px, 1024px, 1440px breakpoints
- [ ] Lighthouse performance score >= 90 on all pages
- [ ] Lighthouse accessibility score >= 95 on all pages
- [ ] All claims pass review per `docs/claim-policy.md`
- [ ] Contact form submits successfully and delivers to `help@vayasyaseva.com`
- [ ] Client logos (ITC Limited, Wipro, Unilever) displayed only with documented approval
- [ ] GSTIN and MSME number displayed accurately on About page
- [ ] No console errors in production build
- [ ] `robots.txt` and `sitemap.xml` present and valid
- [ ] Open Graph and Twitter Card meta tags configured for all pages

---

## 6. Key Identifiers

| Field | Value |
|-------|-------|
| GSTIN | 05AAJCV4562E1ZB |
| MSME | UDYAM-UK-06-0029670 |
| Email | help@vayasyaseva.com |
| Phone | +91 72920 14101 |
| Primary region | Haridwar-SIDCUL, Uttarakhand |
