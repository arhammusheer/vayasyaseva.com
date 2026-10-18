import type { Topic } from "./types";

/**
 * /esic: ESIC for employers. Read against the documents on 18 Oct 2026:
 * the Code on Social Security, 2020 (First Schedule, Chapter IV; s.1(8),
 * 2(26), 2(27), 2(88), 29(4), 31, 128, 164(2)(b)), the Social Security
 * (Central) Rules, 2026 (rules 18 and 19), S.O. 2351(E) (crossing the limit
 * mid-period), S.O. 2698(E) (12% interest), the ESI (General) Regulations,
 * 1950 (regs 4, 31, 31C, kept by s.164(2)(b) for a year from 21 Nov 2025),
 * the Ministry's FAQs of 16 Mar 2026 (Q12), ESIC's contribution page and
 * its circular of 11 Dec 2025, and the draft 2026 regulations.
 *
 * Stated with whose word it is, because no notification under the Code was
 * found: the ₹21,000 limit (the Ministry's FAQs) and the ₹176 a day
 * exemption (ESIC's contribution page). Left out: a disability wage limit
 * (no current primary source).
 *
 * Re-check by 21 Nov 2026, when the 1950 regulations' saving ends and the
 * draft 2026 regulations (flat 1% a month damages) may replace them.
 */
export const esicTopic: Topic = {
  path: "/esic",
  title: "ESIC Contribution 2026: 3.25% + 0.75%, ₹21,000 Limit",
  description:
    "ESIC for employers: 3.25% from the employer and 0.75% from the worker on wages up to ₹21,000 a month, paid by the 15th. Contract workers, late fees, examples.",
  breadcrumb: "ESIC",
  heading: "ESIC for employers.",
  lede: "Every establishment with 10 or more employees pays ESIC for workers earning up to ₹21,000 a month: 3.25% of wages from the employer and 0.75% from the worker, each rounded up to the next rupee, within 15 days of the month's end.",
  sections: [
    {
      kind: "facts",
      id: "rules",
      rows: [
        { label: "Who must register", text: "Every establishment with 10 or more persons, other than a seasonal factory, from the date ESIC's benefits are notified for its area. Workers above the wage limit count towards the 10, and an establishment stays covered if its headcount later falls." },
        { label: "Wage limit", text: "₹21,000 a month, in force since 1 January 2017; the Ministry of Labour's FAQs of March 2026 confirm it continues under the Code." },
        { label: "Which wages", text: "Wages as the Code defines them (section 2(88)): basic pay, dearness allowance and retaining allowance, plus any excluded allowances above half of total pay. ESIC expects this to bring back workers who had been left out." },
        { label: "Employer pays", text: "3.25% of wages, rounded up to the next rupee." },
        { label: "Worker pays", text: "0.75% of wages, rounded up to the next rupee, deducted from wages. ESIC exempts workers whose average daily wage is up to ₹176 from their share; the employer still pays its own." },
        { label: "Workers with a disability", text: "No employer's share for up to three years." },
        { label: "Registering workers", text: "Each worker on or before the day they join, through the ESIC portal with Aadhaar; the insurance number lapses if the declaration is not completed within 30 days." },
        { label: "When", text: "Within 15 days of the end of the month the wages are for: by the 15th." },
      ],
    },
    {
      kind: "table",
      id: "example",
      heading: "What it comes to.",
      intro: "For one worker, a full month:",
      caption: "ESIC contributions a month at different wages",
      columns: ["Wages a month", "Worker, 0.75%", "Employer, 3.25%", "Total"],
      rows: [
        ["₹18,000", "₹135", "₹585", "₹720"],
        ["₹18,500", "₹139 (from ₹138.75)", "₹602 (from ₹601.25)", "₹741"],
        ["₹22,000, raised mid-period", "₹165", "₹715", "₹880"],
        ["₹22,000, on joining", "Not covered", "Not covered", "Nothing"],
      ],
      note: "A covered worker whose wages pass ₹21,000 during a contribution period stays covered until it ends; a worker who joins above the limit is not covered, but still counts towards the 10.",
    },
    {
      kind: "table",
      id: "periods",
      heading: "Contribution periods.",
      caption: "ESIC contribution periods",
      columns: ["Period", "Covered for the whole period if"],
      rows: [
        ["1 April to 30 September", "Wages were within the limit when the period began"],
        ["1 October to 31 March", "Wages were within the limit when the period began"],
      ],
    },
    {
      kind: "prose",
      id: "contract-workers",
      heading: "Contract workers.",
      paragraphs: [
        "The Code counts a person employed directly or through a contractor as an employee. The principal employer must pay both the employer's and the employee's contribution for every worker, including those employed through a contractor, and can recover the money from the contractor's bills or as a debt.",
      ],
    },
    {
      kind: "table",
      id: "late",
      heading: "Paid late.",
      intro: "Interest of 12% a year runs from the due date until payment, and damages can be charged on the arrears, up to these rates a year:",
      caption: "ESIC damages on arrears, maximum rate a year by length of delay",
      columns: ["Delay", "Damages, up to"],
      rows: [
        ["Less than 2 months", "5% a year"],
        ["2 months to less than 4", "10% a year"],
        ["4 months to less than 6", "15% a year"],
        ["6 months or more", "25% a year"],
      ],
      note: "Damages cannot exceed the arrears. These rates come from the 1950 regulations, which the Code keeps in force until November 2026; draft regulations of July 2026 propose a flat 1% a month in their place.",
    },
  ],
  faqs: [
    {
      question: "What is the ESIC wage limit in 2026?",
      answer: "₹21,000 a month. A worker who joins above it is not covered; one whose wages rise above it during a contribution period stays covered until the period ends, on 30 September or 31 March.",
    },
    {
      question: "How much is the employer's ESIC contribution?",
      answer: "3.25% of wages, rounded up to the next rupee, plus the worker's 0.75%, which the employer deducts from wages and pays with its own. On ₹18,000 that is ₹585 and ₹135.",
    },
    {
      question: "Who pays ESIC for contract workers?",
      answer: "The principal employer is responsible for both shares for workers employed through a contractor, and can recover them from the contractor. In practice the contractor pays, and the principal employer should check it has.",
    },
  ],
  sources: ["css-2020", "ss-central-rules-2026", "esi-period-2026", "mole-faq-2026", "esic-contribution", "esic-wages-circular-2025", "esi-regs-1950", "interest-2026", "esi-draft-regs-2026"],
  links: [
    { href: "/epf", label: "EPF for employers" },
    { href: "/minimum-wages", label: "Minimum wages by state" },
    { href: "/labour-welfare-fund", label: "Labour Welfare Fund by state" },
  ],
  checked: "2026-10-18",
};
