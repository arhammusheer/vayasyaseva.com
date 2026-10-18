import type { TopicPage } from "./types";

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
export const esicTopic: TopicPage = {
  path: "/esic",
  title: "ESIC Contribution 2026: 3.25% + 0.75%, ₹21,000 Limit",
  description:
    "ESIC for employers: 3.25% from the employer and 0.75% from the worker on wages up to ₹21,000 a month, paid by the 15th. Contract workers, late fees, examples.",
  breadcrumb: "ESIC",
  heading: "ESIC for employers.",
  lede: "For every worker earning up to ₹21,000 a month, the employer pays 3.25% of wages and the worker 0.75%, each rounded up to the next rupee, by the 15th of the next month.",
  glance: [
    { label: "Employer pays", value: "3.25%", key: true },
    { label: "Worker pays", note: "nothing on ₹176 a day or less", value: "0.75%" },
    { label: "Wage limit", note: "a month, when a period begins", value: "₹21,000" },
    { label: "Due", value: "15th" },
  ],
  updatedFrom: "the Gazette, the Ministry of Labour and ESIC",
  rules: [
    {
      heading: "Who it covers",
      rows: [
        { label: "Establishments", text: "Every establishment with 10 or more persons, other than a seasonal factory, from the date ESIC's benefits are notified for its area. Workers above the limit count towards the 10, and it stays covered if headcount later falls." },
        { label: "Workers", text: "Everyone on wages up to ₹21,000 a month, in force since 1 January 2017; the Ministry of Labour's FAQs of March 2026 confirm it continues under the Code." },
        { label: "Which wages", text: "Wages as the Code defines them (section 2(88)): basic pay, dearness allowance and retaining allowance, plus allowances above half of total pay. ESIC expects this to bring back workers who had been left out." },
      ],
    },
    {
      heading: "How much",
      rows: [
        { label: "Employer", text: "3.25% of wages, rounded up to the next rupee." },
        { label: "Worker", text: "0.75%, rounded up, deducted from wages. ESIC exempts workers averaging ₹176 a day or less; the employer still pays its own share." },
        { label: "Workers with a disability", text: "No employer's share for up to three years." },
      ],
    },
    {
      heading: "When",
      rows: [
        { label: "Registering workers", text: "On or before the day each worker joins, through the ESIC portal with Aadhaar; the insurance number lapses if the declaration is not finished within 30 days." },
        { label: "Payment", text: "Within 15 days of the end of the month the wages are for: by the 15th." },
        { label: "Paid late", text: "Interest of 12% a year, plus damages of up to 5% a year for under two months, 10% for two to four, 15% for four to six and 25% beyond, up to the arrears themselves. These rates come from the 1950 regulations, kept in force until November 2026; draft regulations propose a flat 1% a month." },
      ],
    },
    {
      heading: "Contract workers",
      rows: [
        { label: "Covered", text: "A worker employed through a contractor is an employee of the establishment under the Code." },
        { label: "Who is liable", text: "The principal employer must pay both shares for every worker, including those employed through a contractor, and can recover them from the contractor's bills or as a debt." },
      ],
    },
  ],
  faqs: [
    {
      question: "What is the ESIC wage limit in 2026?",
      answer: "₹21,000 a month. A worker who joins above it is not covered; one whose wages rise above it during a contribution period stays covered until the period ends, on 30 September or 31 March.",
    },
    {
      question: "How much is the employer's ESIC contribution?",
      answer: "3.25% of wages, rounded up to the next rupee, plus the worker's 0.75%, which the employer deducts and pays with its own. On ₹18,000 that is ₹585 and ₹135.",
    },
    {
      question: "Who pays ESIC for contract workers?",
      answer: "The principal employer is responsible for both shares for workers employed through a contractor, and can recover them from the contractor. In practice the contractor pays, and the principal employer checks that it has.",
    },
  ],
  sources: ["css-2020", "ss-central-rules-2026", "esi-period-2026", "mole-faq-2026", "esic-contribution", "esic-wages-circular-2025", "esi-regs-1950", "interest-2026", "esi-draft-regs-2026"],
  links: [
    { href: "/epf", label: "EPF for employers" },
    { href: "/minimum-wages", label: "Minimum wages by state" },
  ],
  checked: "2026-10-18",
};
