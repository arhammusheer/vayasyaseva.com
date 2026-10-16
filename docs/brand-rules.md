# Brand Rules -- VSPL

`/brand` publishes the logo files, three logo rules, the type specimens and the core colours (Gold and Neutral); `globals.css` holds every token. Everything else about the visual identity is internal and lives in section 3 of this file. Claims follow `docs/claim-policy.md`; copy and design slop follow `docs/ai-slop-registry.md`.

---

## 1. Position

A labour contractor and manpower supply company for factories, warehouses and facilities. The workers are on our payroll. Based in Haridwar, with crews in SIDCUL and across Haridwar; a site elsewhere in India is taken on only once we've checked we can recruit, pay and supervise people there. Home page title and H1 since 16 October 2026: "Labour Contractor and Manpower Supply Company" / "Contract labour for factories, warehouses and facilities". Haridwar search terms live on `/haridwar-sidcul` and `/jobs/haridwar`.

---

## 2. Voice

| Attribute | Rule |
|-----------|------|
| **Plain** | Say what we do in concrete terms: roles, sites, records. |
| **Factual** | Every claim must be supportable. No invented numbers, timelines or superlatives. |
| **Respectful** | Refer to people as workers, the workforce or the team. Never as "resources" or "headcount" in brand voice. |
| **Steady** | Calm, not excited. No "best", "leading", "No. 1". |

### Search vocabulary

Buyers search for "labour contractor", "labour supplier", "manpower supplier" and "manpower services". Use these terms where a buyer would look for them: titles, headings, service descriptions and FAQs that answer those searches. Don't use them as taglines, and don't use them to describe individual people.

#### We are a contractor, not a staffing agency

Vayasya Seva supplies the workforce. Workers are on our rolls: we pay wages, deposit EPF and ESIC, supervise the crew on site and replace absentees. A staffing agency or placement consultancy finds candidates for the client to hire and steps away. Buyers use the agency words too; answer them in body text and FAQs with the difference, and say plainly which one we are. We never describe ourselves as an agency. (Owner's direction, 16 October 2026.)

| Term | Where it may appear |
|---|---|
| labour contractor, contract labour, manpower supply, manpower supplier, manpower company, manpower contractor, labour supplier, manpower outsourcing | Titles, H1s, headings, body, FAQs |
| manpower agency, manpower consultancy, staffing agency, staffing company, placement agency, job consultancy | Body text and FAQs only, always next to the difference ("we supply and manage the workers ourselves"). Never in a title, an H1 or a tagline, and never to describe Vayasya Seva as one. |

Say it the same way each time: **"We're a manpower contractor, not a placement agency: the workers are on our payroll, and we manage attendance, wages, EPF and ESIC."**

Since 16 October 2026 the contractor point has one home: the home page, as benefit 3 ("Our payroll, our paperwork.") and the agency FAQ below. The agency FAQ appears on the home page only (`src/content/agency-faq.ts`); service landings, `/haridwar-sidcul`, `/services` and `/compliance` carry no agency FAQ and no payroll paragraph. Other pages get at most one line that mentions the payroll, where the page needs it (the `/services` engagement steps), and never repeat the agency answer. The agency FAQ:

> **Are you a manpower agency or a staffing company?**
> We’re a manpower contractor. An agency sends you candidates to hire. We supply the workers, keep them on our payroll, supervise them on site, replace absentees and handle wages, EPF and ESIC. You get a working crew and one invoice.

Job-seeker pages may use "job consultancy" and "placement" in the same way: say we hire people onto our own rolls and place them at client sites, and that there is no fee.

| Do | Don't |
|----|-------|
| "Contract labour and manpower for factories in SIDCUL and across Haridwar." | "We provide the best manpower solutions instantly." |
| "Applicable EPF and ESIC records are available for your review." | "We guarantee seamless compliance." |
| "Based in Haridwar, supporting SIDCUL industry." | "India's leading workforce company." |

### Place names: SIDCUL is in Haridwar

SIDCUL Haridwar is the State's Integrated Industrial Estate, inside Haridwar city (Ranipur / BHEL area). SIDCUL, now SIIDCUL, is also the state corporation that runs seven estates across Uttarakhand, so "SIDCUL" alone is ambiguous. Never write the two as separate places ("Haridwar and SIDCUL", "Haridwar–SIDCUL").

| Use | English (en-IN) | हिंदी (hi-IN) | Hindi (hi-Latn-IN) |
|---|---|---|---|
| Short label: titles, headings, footer, breadcrumbs | SIDCUL Haridwar | सिडकुल हरिद्वार | SIDCUL Haridwar |
| Coverage in running text | in SIDCUL and across Haridwar | सिडकुल और पूरे हरिद्वार में | SIDCUL aur poore Haridwar mein |
| First mention on the local page | SIDCUL Haridwar, the State's Integrated Industrial Estate in the Ranipur and BHEL area | सिडकुल हरिद्वार, रानीपुर और BHEL क्षेत्र का एकीकृत औद्योगिक क्षेत्र | same as English |

Both words are search terms in their own right: keep "SIDCUL" and "Haridwar" together in titles. The `/haridwar-sidcul` URL stays as it is (indexed, and it holds both words). Schema models SIDCUL Haridwar as a `Place` with `containedInPlace` Haridwar.

---

## 3. Visual rules not covered by `/brand`

- Gold is the only accent; keep it under 20% of the visible surface. Use Gold 700 for text on light backgrounds.
- Buttons use an 8px radius, never pills.
- Prefer photography of real industrial sites. No stock handshakes.
- Icons come from lucide-react. The only exceptions are third-party marks (such as LinkedIn), drawn inline.

The rest of this section moved off `/brand` on 16 October 2026 (the page keeps downloads, three logo rules, specimens and the Gold and Neutral ramps). The values mirror the tokens in `globals.css`.

### Logo rules beyond the three on `/brand`

- Over imagery, place the mark on a calm solid plate first.
- If it is too small to read clearly, use a larger placement rather than forcing it smaller.
- A product name sits beside the mark in Anek at weight 500, in one weight. Use the supplied lockup file.
- Setu has no colour of its own: in a lockup the name takes the text colour of its surface.

### Type rules

- Anek carries headings and high-emphasis lines only; it is not a reading face.
- Hind carries everything people read: paragraphs, labels, interface copy.
- JetBrains Mono is for values that need alignment or character distinction: IDs, tables, figures.
- Sentence case by default. No new fonts or local fallbacks to fix a surface quickly.

| Level | Family | Weight | Size / line | Use |
|---|---|---|---|---|
| Display | Anek Latin | 500 | 40 / 48 | Page titles, hero statements |
| Heading | Anek Latin | 500 | 30 / 38 | Section headings |
| Body | Hind | 400 | 18 / 30 | Reading copy, interface text |
| Data | JetBrains Mono | 500 | 14 / 22 | Tables, identifiers, aligned values |

### Extended palette

For chart series, document templates and theme options in Setu. They never identify a product line, and the website does not use them as accents.

| Step | Saffron | Indigo | Forest | Slate |
|---|---|---|---|---|
| 50 | #FFF6ED | #F4F7FD | #F1FAF6 | #F7F8FA |
| 100 | #FFE9D3 | #E7EDF8 | #DBF2E8 | #EDEFF3 |
| 200 | #FDCFA8 | #CEDAF0 | #B9E4D1 | #D8DCE4 |
| 300 | #F9B379 | #A8BDE4 | #8CCFB1 | #B8BFCC |
| 400 | #F38E46 | #7D98D5 | #5FB58F | #919BAB |
| 500 | #E06C24 | #5B77C4 | #3D966F | #6F7A8D |
| 600 | #BA511A | #445FA8 | #2E7A58 | #556073 |
| 700 | #8F3F17 | #374B85 | #256146 | #434C5D |
| 800 | #6E3215 | #2D3E6C | #204D38 | #353C4A |
| 900 | #552811 | #273558 | #1B402F | #2A303C |
| 950 | #301306 | #151D33 | #0F261C | #171B22 |

### State colours

Semantic status only, never decorative: Success #1F7A4D, Info #215EA6, Warning #A45E0C, Danger #B42318, Pending #556073, Locked #4A4458 (frozen or final; waiting on nobody).

### Dark surfaces

The brand has no separate dark palette: dark mode is the Neutral and Gold ramps turned over. Text pairings clear 4.5:1 on their surface; gold text uses 300, never 500. Setu's dark theme is built from exactly these.

| Role | Token | Hex | Contrast |
|---|---|---|---|
| Canvas | Neutral 950 | #020617 | |
| Surface | Neutral 900 | #0F172A | |
| Muted and rules | Neutral 800 | #1E293B | |
| Text | Neutral 50 | #F8FAFC | 19.3:1 on canvas |
| Secondary text | Neutral 300 | #CBD5E1 | 12.0:1 on surface |
| Placeholder | Neutral 400 | #94A3B8 | 7.0:1 on surface |
| Brand text | Gold 300 | #F4CD6D | 11.7:1 on surface |
| Focus | Gold 400 | #EBB74A | 11.0:1 on canvas |

---

## 4. Client logos

Client logos (ITC Limited, Wipro, Unilever) need documented usage approval. See `docs/content-approval-workflow.md`.
