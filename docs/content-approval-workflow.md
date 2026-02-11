# Content Approval Workflow -- VSPL

This document defines who reviews content, what triggers a review, and the steps required before any content goes live on vayasyaseva.com.

---

## 1. Roles

| Role | Responsibility |
|------|---------------|
| **Brand Owner** | Final approver for all published content. Owns the VSPL brand voice, claim accuracy, and legal correctness. |
| **Content Author** | Writes or modifies website copy. Responsible for self-review against `docs/claim-policy.md` before submitting for approval. |
| **Developer** | Implements content in code. Does not publish content changes without brand owner sign-off. |

---

## 2. What Triggers a Review

A brand owner review is **required** when any of the following occur:

| Trigger | Examples |
|---------|----------|
| **New claim introduced** | Any statement about capability, performance, or scope that did not exist on the previous version of the site. |
| **Metric change** | Updated numbers -- associate count, site count, compliance rate, client count. |
| **Legal or compliance text** | GSTIN, MSME number, registered address, statutory compliance descriptions, contract-related language. |
| **New page or section** | Any entirely new page or a new content section on an existing page. |
| **Client logo addition or removal** | Adding a new client logo, removing an existing one, or changing how logos are displayed. |
| **Tone or positioning shift** | Changes to tagline, hero copy, value proposition, or brand-level messaging. |
| **Meta content** | Page titles, meta descriptions, Open Graph titles/descriptions. |

### Does NOT require review

- Typo fixes (spelling, punctuation) that do not alter meaning.
- Technical changes (performance optimization, dependency updates) that do not affect visible content.
- Layout or styling changes that do not alter text content.

---

## 3. Review Checklist

Before approving, the brand owner must confirm each item:

### Claim Validation

- [ ] Every claim is categorized per `docs/claim-policy.md` (Directional / Measured / Contractual).
- [ ] Category B (measured) claims have a documented evidence source and reference period.
- [ ] Category C (contractual) claims match active contract language or SLA documentation.
- [ ] No prohibited words are present ("best", "world-class", "seamless", "revolutionary", etc.).
- [ ] No unqualified guarantees or universal absolutes.

### Brand Consistency

- [ ] Tone matches brand rules: precise, factual, respectful, reliable.
- [ ] Workforce members are referred to with appropriate terms (associates, team members, deployed personnel -- never "resources" or "labour supply").
- [ ] Company is positioned as an operations partner, not a staffing agency.

### Legal Accuracy

- [ ] GSTIN displayed correctly: `05AAJCV4562E1ZB`
- [ ] MSME number displayed correctly: `UDYAM-UK-06-0029670`
- [ ] Contact details are current: `help@vayasyaseva.com`, `+91 72920 14101`
- [ ] No claims that could create unintended contractual obligations.

### Technical Review

- [ ] Meta descriptions are under 160 characters and contain no prohibited words.
- [ ] Open Graph and Twitter Card content matches approved copy.
- [ ] Alt text on images is descriptive and claim-free.

---

## 4. Claim Validation Steps (Detail)

For each new or modified claim:

1. **Identify the claim.** Highlight the specific sentence or phrase.
2. **Assign a category.**
   - A (Directional): Capability intent. No metric required.
   - B (Measured): Metric-backed. Requires source + period.
   - C (Contractual): Scope/commitment. Requires contract or SLA reference.
3. **Locate evidence.** For B and C, document the evidence source (internal spreadsheet, filing receipt, contract clause). Record this in the review log.
4. **Check currency.** If the claim references a metric, confirm it is from within the last 12 months. If older, update or remove.
5. **Test phrasing.** Read the claim aloud. If it sounds like a sales pitch, rewrite it to sound like an operations brief.
6. **Approve or reject.** If any step fails, return to the content author with specific feedback.

---

## 5. Client Logo Usage Approval

Client logos are displayed on the website as trust signals. Each logo requires explicit approval.

### Process

1. **Confirm active relationship.** The client must be a current or recent (within 12 months) VSPL client.
2. **Obtain permission.** Written approval (email is sufficient) from the client's authorized representative allowing logo usage on the VSPL website.
3. **Document approval.** Store the approval record (email, letter, or contract clause) in the project's internal records.
4. **Specify display rules.** Client logos are shown in grayscale by default. No claims about the client relationship beyond the logo presence unless separately approved.
5. **Review periodically.** If a client relationship ends, the logo must be reviewed for removal within 90 days.

### Current approved logos

| Client | Status | Approval reference |
|--------|--------|--------------------|
| ITC Limited | Active | [To be documented] |
| Wipro | Active | [To be documented] |
| Unilever | Active | [To be documented] |

---

## 6. Workflow Summary

```
Content Author writes/modifies copy
        |
        v
Self-review against claim-policy.md
        |
        v
Submit to Brand Owner for review
        |
        v
Brand Owner runs review checklist
        |
       / \
      /   \
  Approved  Rejected (with feedback)
     |            |
     v            v
  Deploy    Author revises, resubmits
```

---

## 7. Review Log

Maintain a running log of reviews. Minimum fields:

| Date | Reviewer | Page/Section | Change summary | Claims reviewed | Outcome |
|------|----------|-------------- |----------------|-----------------|---------|
| (template) | | | | | Approved / Rejected |

This log is internal and not published. It serves as an audit trail for claim accuracy.
