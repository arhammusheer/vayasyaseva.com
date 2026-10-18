import type { Topic } from "./types";

/**
 * /professional-tax and /professional-tax/karnataka. Read against the
 * documents on 18 Oct 2026:
 * - Karnataka: the Act of 1976 with its amending Acts (PRS copy: ss.2(j),
 *   3(2), 4, 5, 6, 6A, 10, 11(2), 12 and the Schedule as replaced by Act 14
 *   of 2023), Act 33 of 2025 (₹200, ₹300 in February, from 1 Apr 2025), the
 *   Rules (Form 5-A), Article 276(2) of the Constitution and the live
 *   ptax.karnataka.gov.in portal. Act 18 of 2012 omitted the quarterly
 *   option in s.6A; there is none now.
 * - Punjab: the Punjab State Development Tax Act, 2018 (s.4(3): income-tax
 *   payers only; Schedule entry 1: ₹200 a month).
 * - Uttarakhand, Uttar Pradesh, Delhi and Haryana: no professional tax, as
 *   the wage pages' employer dues already say (statutory.ts notLevied).
 *
 * Left out, not verified from a primary source: the 2015 change of the
 * threshold to ₹15,000 (Act 14 of 2015, text not found).
 */
export const karnatakaPtTopic: Topic = {
  path: "/professional-tax/karnataka",
  title: "Professional Tax in Karnataka 2026: Slab, Due Date",
  description:
    "Karnataka professional tax for employers: ₹200 a month on salaries of ₹25,000 or more, ₹300 in February, paid by the 20th with Form 5-A. Penalties and examples.",
  breadcrumb: "Karnataka",
  heading: "Professional Tax in Karnataka.",
  lede: "An employer deducts ₹200 a month from every worker earning ₹25,000 or more in the month, and ₹300 in February: ₹2,500 a year, the most the Constitution allows. Workers earning less pay nothing. The employer pays it and files Form 5-A by the 20th of the next month.",
  sections: [
    {
      kind: "facts",
      id: "rules",
      rows: [
        { label: "Who pays", text: "Every worker whose salary or wage for the month is ₹25,000 or more. Bonus and arrears count, spread over the months they relate to." },
        { label: "Rate", text: "₹200 a month, ₹300 in February, from 1 April 2025 (Act 33 of 2025). Below ₹25,000 a month there is no tax." },
        { label: "Who is left out", text: "Anyone employed for 120 days or less in the year, and people aged 60 or more." },
        { label: "Employer's duty", text: "Deduct the tax from salary and pay it. The employer is liable for it whether or not it was deducted." },
        { label: "Registration", text: "A registration certificate, applied for in Form 1 within 30 days of becoming an employer. Registering late carries a ₹1,000 penalty." },
        { label: "When", text: "Pay, and file the Form 5-A statement with proof of payment, within 20 days of the month's end. There has been no quarterly option since 1 April 2012. The annual return is due within 60 days of the year's end." },
        { label: "The company's own tax", text: "A company pays ₹2,500 a year for itself, before 30 April. Where several entries in the Schedule apply to a business, it pays under only one." },
      ],
    },
    {
      kind: "table",
      id: "example",
      heading: "What it comes to.",
      intro: "For an employer with 10 workers on ₹24,000 a month and 5 on ₹30,000, over a year:",
      caption: "Karnataka professional tax for 15 workers over a year",
      columns: ["", "Each month", "February", "Year"],
      rows: [
        ["10 workers on ₹24,000", "Nothing", "Nothing", "Nothing"],
        ["5 workers on ₹30,000", "₹1,000", "₹1,500", "₹12,500"],
        ["The company's own tax", "", "", "₹2,500, before 30 April"],
      ],
      note: "A ₹24,000 worker whose bonus or arrears take a month to ₹25,000 or more owes ₹200 for that month.",
    },
    {
      kind: "prose",
      id: "contract-workers",
      heading: "Contract workers.",
      paragraphs: [
        "A contractor deducts and pays the tax for its own workers. Where workers are supplied as a manpower service, the Act also has the principal deduct the tax for them from what it pays the contractor, in any month the payment exceeds ₹3,000, unless the contractor produces a copy of its filed return.",
      ],
    },
    {
      kind: "facts",
      id: "late",
      heading: "Paid late.",
      rows: [
        { label: "Interest", text: "1.5% of the unpaid tax for each month or part of a month." },
        { label: "Penalty", text: "10% of the tax due after a notice of demand, on top of the interest; ₹250 for not filing the statement or not paying." },
        { label: "Not registered", text: "The department assesses the tax on the information it has, and adds a penalty equal to that tax." },
      ],
    },
    {
      kind: "table",
      id: "history",
      heading: "How the slab has moved.",
      caption: "Karnataka professional tax on salaries: the top slab over time",
      columns: ["From", "Who pays", "Amount"],
      rows: [
        ["2003", "₹15,000 a month and above (lower slabs below)", "₹200 a month"],
        ["1 April 2023", "₹25,000 a month and above", "₹200 a month"],
        ["1 April 2025", "₹25,000 a month and above", "₹200 a month, ₹300 in February"],
      ],
      note: "The 2025 change raised the year's total from ₹2,400 to ₹2,500, the limit in Article 276(2) of the Constitution. Employers pay through the Commercial Taxes Department's portal, ptax.karnataka.gov.in.",
    },
  ],
  faqs: [
    {
      question: "What is the professional tax slab in Karnataka?",
      answer: "One slab for salaried workers: ₹200 a month, and ₹300 in February, on a salary or wage of ₹25,000 or more for the month. Below ₹25,000 there is no tax.",
    },
    {
      question: "When is professional tax due in Karnataka?",
      answer: "Within 20 days of the month's end: by the 20th, with the Form 5-A statement and proof of payment. Late tax carries interest of 1.5% a month.",
    },
    {
      question: "Is professional tax deducted from contract workers?",
      answer: "Yes, from those earning ₹25,000 or more in the month and employed for more than 120 days in the year. The contractor deducts it; for workers supplied as a manpower service, the principal can be required to deduct it from the contractor's payment.",
    },
  ],
  sources: ["ka-pt-act", "ka-pt-2025", "ka-pt-rules", "constitution-276"],
  links: [
    { href: "/professional-tax", label: "Professional Tax in other states" },
    { href: "/minimum-wages/karnataka", label: "Minimum wages in Karnataka" },
    { href: "/locations/bengaluru", label: "Contract labour in Bengaluru" },
  ],
  checked: "2026-10-18",
};

export const professionalTaxTopic: Topic = {
  path: "/professional-tax",
  title: "Professional Tax by State 2026: Who Levies It",
  description:
    "Professional tax in the states we cover: Karnataka levies it, Punjab has a development tax, and Uttarakhand, UP, Delhi and Haryana levy none. The ₹2,500 cap.",
  breadcrumb: "Professional Tax",
  heading: "Professional Tax by state.",
  lede: "Each state decides whether to levy it, up to ₹2,500 a person a year. Of the states we cover, Karnataka levies professional tax and Punjab levies a development tax of the same kind; Uttarakhand, Uttar Pradesh, Delhi and Haryana levy none.",
  sections: [
    {
      kind: "table",
      id: "states",
      heading: "State by state.",
      caption: "Professional tax on salaries in Karnataka, Punjab, Uttarakhand, Uttar Pradesh, Delhi and Haryana",
      columns: ["State", "On salaries", "Who pays"],
      rows: [
        [{ text: "Karnataka", href: "/professional-tax/karnataka" }, "₹200 a month, ₹300 in February", "Salary of ₹25,000 or more in the month"],
        ["Punjab", "₹200 a month (development tax)", "Income-tax payers only"],
        ["Uttarakhand", "None", ""],
        ["Uttar Pradesh", "None", ""],
        ["Delhi", "None", ""],
        ["Haryana", "None", ""],
      ],
      note: "In both Karnataka and Punjab the employer deducts the tax from salary and pays it every month.",
    },
  ],
  faqs: [
    {
      question: "What is the most professional tax anyone can pay?",
      answer: "₹2,500 a year. Article 276(2) of the Constitution caps the tax on professions, trades, callings and employments at that amount per person.",
    },
    {
      question: "Does Punjab have professional tax?",
      answer: "It levies the Punjab State Development Tax instead: ₹200 a month for people assessable to income tax on their salary, deducted by the employer. Workers below the income-tax threshold pay nothing.",
    },
  ],
  sources: ["constitution-276", "ka-pt-act", "ka-pt-2025", "pb-psdt-act", "pb-psdt-rules-2021"],
  links: [
    { href: "/professional-tax/karnataka", label: "Professional Tax in Karnataka" },
    { href: "/labour-welfare-fund", label: "Labour Welfare Fund by state" },
    { href: "/epf", label: "EPF for employers" },
  ],
  checked: "2026-10-18",
};
