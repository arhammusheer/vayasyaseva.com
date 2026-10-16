# Claims register

Every public claim the site makes about Vayasya Seva, with its tier under `docs/claim-policy.md` (PLAN §10.1 item 4, §10.2). Tiers: **A** directional (what we aim for or do as practice), **B** measured (needs a reference period and data, reviewed quarterly, removed after 12 months without a refresh), **C** contractual or registration fact (checkable against a document).

The owner signs off each line by filling in **Signed off** (name or role, date). A claim with no sign-off stays live only where it repeats a line the owner already approved; new claims wait for sign-off. Directional claims are re-confirmed every 12 months, measured ones every quarter. Cluster claim blocks live in `src/content/registry/clusters.ts` and expire 6 months after sign-off on their own.

Last compiled: 16 October 2026, for the national phase 1 pull request.

## Employer and payroll

| Claim (as worded on the site) | Pages | Tier | Evidence or approval | Signed off | Review by |
|---|---|---|---|---|---|
| The workers are on our payroll; we pay wages, deposit EPF and ESIC where they apply, supervise the crew and replace absentees | Home, /services/contract-labour (3 languages), /about, /compliance, /haridwar-sidcul, llms.txt | C | Owner decision 3 (VSPL is employer of record); EPF and ESIC registrations | | 16 Oct 2027 |
| We deposit EPF and ESIC every month and share the challans for your review | Home FAQ, /compliance, /services/contract-labour | C | Monthly challans | | 16 Oct 2027 |
| Attendance and wage registers, wage slips and challans are open for your monthly review and for audits | Home, /compliance, /contact, /services/contract-labour | A | Practice; owner to confirm | | 16 Oct 2027 |
| EPF, ESIC, GST and MSME registered; GSTIN, Udyam and CIN as shown | Footer, /about, /compliance | C | Registration certificates | | On any change |
| Every shift is a full 8 hours; no part-time work | Home, jobs pages, /contact, /industries | C | Owner decision 15 | Owner, 16 Oct 2026 | 16 Oct 2027 |
| Contract labour licence: "before you sign, ask us for the registration and licence details that apply to your site" | /compliance, guides | A | Says what to ask, not what is held; licence status is an owner todo | | When the licence list is confirmed |

## Workers and jobs

| Claim | Pages | Tier | Evidence or approval | Signed off | Review by |
|---|---|---|---|---|---|
| There is no fee to apply (and not to get work) | All jobs pages, /jobs/fees-and-fraud, wage pages | C | Owner direction | | 16 Oct 2027 |
| We typically call within a few days when there is suitable work | /jobs FAQ, confirmation screen (3 languages) | A | Practice; becomes B once callback times are measured | | 16 Apr 2027 |
| SMS with the reference comes from VAYSPL (may show as VM-VAYSPL); references start with VS-J- | Confirmation screen, /jobs/fees-and-fraud | C | DLT sender and template 227115 | | On any template change |
| We tell you the site and the shift before you join | Jobs FAQ, /jobs/fees-and-fraud | A | Practice | | 16 Oct 2027 |
| "Most of our work is here" / "some of our work is around Roorkee, Bhagwanpur and Bahadrabad" | /jobs/haridwar, /jobs FAQ, /haridwar-sidcul, home | A | Owner to confirm current work in all three areas | | 16 Apr 2027 |
| You are on our payroll; we pay your PF and ESIC where they apply | Role and hub pages (3 languages) | C | As the payroll line above | | 16 Oct 2027 |
| For each worker we track retention, training and time to full productivity (no figures) | Home, contract labour explainer (review) | A | Owner positioning note; any figure is B and needs data | | 16 Oct 2027 |

## Business enquiries

| Claim | Pages | Tier | Evidence or approval | Signed off | Review by |
|---|---|---|---|---|---|
| We aim to reply within two working days (Monday to Saturday, IST) | /contact, CTA band (3 languages), /services/contract-labour | A | PLAN §8.1; becomes B after 90 days of first-reply data | | 16 Jan 2027 |
| For a site elsewhere in India, we'll tell you plainly whether we can staff it | Home, /contact, /industries FAQ, wage pages | A | Owner decision 3 | | 16 Oct 2027 |
| A site visit before a crew starts (site assessment request) | /contact, home | A | Owner to confirm | | 16 Oct 2027 |
| We're set up for crews of about 20 workers or more, on 8-hour shifts, for three months or longer | Home FAQ | A | Owner decision 6 (qualified lead = 20+ workers, 3+ months) | | 16 Oct 2027 |
| A rate per worker covering wages, applicable EPF and ESIC and our service charge, on one monthly invoice | Home FAQ | A | Practice; owner to confirm billing basis | | 16 Oct 2027 |
| We put a supervised crew on your floor and keep it running, for a season or for years | Home hero | A | Practice; owner to confirm | | 16 Oct 2027 |

## Wages and guides

| Claim | Pages | Tier | Evidence or approval | Signed off | Review by |
|---|---|---|---|---|---|
| Every wage figure, with its notification and dates | /minimum-wages and state pages (hi-IN in review) | C | `src/content/wages/<state>.json`, `verification` array; daily source monitor | Pending: add `checked.by` per state | Each revision date |
| We pay the workers we deploy at least the notified rate for their employment and skill | Uttarakhand wage page | C | Payroll records | | 16 Oct 2027 |
| We re-check each state around every revision date; we correct confirmed errors quickly and note the date | Wage pages, /about#editorial | A | Practice; monitor runs daily once merged | | 16 Oct 2027 |
| Guide statements of law | Guides (review) | C | Cited to Gazette texts; named legal reviewer pending (decision 9) | Pending | 6 months after review |

## Not on the site until signed off

- Current deployed headcount and multi-shift patterns (a scale line for buyers): B, needs the figure and its date.
- Night shifts and a supervisor on every shift: A or C once the owner confirms.
- EPF establishment code and ESIC employer code on /compliance and /about: C, owner to approve publishing the numbers.
