import type { TopicPage } from "./types";

/**
 * /epf: EPF for employers. Read against the documents on 18 Oct 2026:
 * the Code on Social Security, 2020 (First Schedule; s.1(5), 1(8), 2(26),
 * 2(27), 2(88), 16, 17, 127, 128), S.O. 5109(E) (₹25,000 from 17 Sep 2026)
 * and S.O. 2702(E) (₹15,000), the EPF Scheme, EPS and EDLI Scheme 2026
 * (G.S.R. 525 to 527(E)), S.O. 2698(E) (12% interest) and EPFO's
 * wage-ceiling FAQs (Q4, Q7 to Q15, Q25, Q26, Q29 to Q31, Q37, Q45, Q46).
 *
 * Left out, not verified from a primary source: the classes of
 * establishment on the 10% rate, and the Gazette basis of the EDLI and
 * administration rates (shown from EPFO's FAQs, cited as such).
 */
export const epfTopic: TopicPage = {
  path: "/epf",
  title: "EPF Contribution for Employers 2026: ₹25,000 Ceiling",
  description:
    "EPF for employers from 17 September 2026: the ₹25,000 wage ceiling, the 12% split into EPS and EPF, EDLI and admin charges, due dates and contract workers.",
  breadcrumb: "EPF",
  heading: "EPF for employers.",
  lede: "On PF wages up to ₹25,000 a month, the worker pays 12% and the employer pays 12% plus 1% for EDLI and admin charges, by the 15th of the next month.",
  glance: [
    { label: "Worker pays", value: "12%" },
    { label: "Employer pays", note: "plus 0.5% EDLI and 0.5% admin", value: "12%" },
    { label: "Wage ceiling", note: "from 17 September 2026", value: "₹25,000", key: true },
    { label: "Due", note: "with the ECR", value: "15th" },
  ],
  updatedFrom: "the Gazette and EPFO's documents",
  rules: [
    {
      heading: "Who it covers",
      rows: [
        { label: "Establishments", text: "Every establishment with 20 or more employees. Workers above the ceiling count towards the 20, and an establishment stays covered if its headcount later falls." },
        { label: "Workers", text: "Everyone on PF wages up to ₹25,000 when they join. A worker joining above it is left out unless worker and employer jointly opt in." },
        { label: "Which wages", text: "Basic pay, dearness allowance and retaining allowance (section 2(88) of the Code), not the gross salary. If HRA, overtime and other allowances come to more than half of pay, the excess counts too." },
      ],
    },
    {
      heading: "How much",
      rows: [
        { label: "Worker", text: "12% of PF wages up to the ceiling, deducted from wages." },
        { label: "Employer", text: "12% of the same wages: 8.33% to the pension fund (EPS) for its members, the rest to the worker's EPF account. It cannot be recovered from wages or folded into the cost to company." },
        { label: "EDLI and admin", text: "0.5% each, paid by the employer; admin charges are at least ₹500 a month for the establishment (EPFO's figures)." },
        { label: "Rounding", text: "To the nearest rupee, 50 paise and above counting as the next rupee." },
      ],
    },
    {
      heading: "When",
      rows: [
        { label: "Payment and return", text: "Pay and file the electronic challan-cum-return (ECR) within 15 days of the month's end: by the 15th." },
        { label: "Paid late", text: "Interest of 12% a year from the due date, plus damages on the arrears: 0.25% a month for under two months, 0.5% for two to four, 1% beyond four, up to the arrears themselves. A late ECR costs ₹500 a day, up to that month's admin charges." },
      ],
    },
    {
      heading: "Contract workers",
      rows: [
        { label: "Covered", text: "A worker employed through a contractor is an employee of the establishment under the Code, and the contractor is also an employer." },
        { label: "Who is liable", text: "The principal employer, jointly and severally with the contractor. It can recover what it pays from the contractor's bills or as a debt." },
        { label: "Paperwork", text: "The principal employer declares its contractors in Form X; each contractor sends Form XI within 10 days of the month's end; the principal employer files Form XII within 20 days." },
      ],
    },
  ],
  faqs: [
    {
      question: "Is EPF compulsory for a worker earning more than ₹25,000?",
      answer: "Not for a new joiner: a worker whose PF wages are above the ceiling when they join is excluded unless they and the employer jointly opt to contribute on higher wages. For existing members, contributions are worked out on ₹25,000 unless both opt for more.",
    },
    {
      question: "Who pays EPF for contract workers?",
      answer: "The contractor deducts and pays it, but the principal employer remains responsible with the contractor. If the contractor does not pay, the principal employer must, and can recover it from the contractor.",
    },
    {
      question: "Does ESIC change with the EPF ceiling?",
      answer: "No. ESIC has its own limit of ₹21,000 a month, and its own rates of 3.25% and 0.75%.",
    },
  ],
  sources: ["css-2020", "epf-ceiling-2026", "epf-ceiling-2026-may", "epf-scheme-2026", "eps-2026", "edli-scheme-2026", "epf-faq-2026", "interest-2026"],
  links: [
    { href: "/esic", label: "ESIC for employers" },
    { href: "/minimum-wages", label: "Minimum wages by state" },
  ],
  checked: "2026-10-18",
};

/** What EPFO's FAQs ask employers to do after the ceiling rose on 17 September 2026. */
export const epfCeilingChange = [
  { label: "September's return", text: "Work out 1 to 16 September on ₹15,000 and 17 to 30 September on ₹25,000, in a single ECR." },
  { label: "Newly covered workers", text: "Enrol anyone in service on 17 September earning up to ₹25,000 who had been left out, in EPF, EPS and EDLI from that date. The employer enrols them; they do not apply." },
  { label: "Pension membership", text: "EPF members earning ₹15,000 to ₹25,000 who were outside EPS join it from 17 September 2026." },
  { label: "Unrecovered share", text: "A worker's September share that was not deducted can be recovered in the next payroll; the full amount was still due by 15 October." },
];
