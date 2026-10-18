import type { TableCell, TopicPage } from "./types";

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
export const karnatakaPtTopic: TopicPage = {
  path: "/professional-tax/karnataka",
  title: "Professional Tax in Karnataka 2026: Slab, Due Date",
  description:
    "Karnataka professional tax for employers: ₹200 a month on salaries of ₹25,000 or more, ₹300 in February, paid by the 20th with Form 5-A. Penalties and examples.",
  breadcrumb: "Karnataka",
  heading: "Professional Tax in Karnataka.",
  lede: "Every worker earning ₹25,000 or more in a month pays ₹200, and ₹300 in February. The employer deducts it from salary and pays it by the 20th of the next month.",
  glance: [
    { label: "From a salary of", note: "a month", value: "₹25,000" },
    { label: "Each month", value: "₹200", key: true },
    { label: "February", value: "₹300" },
    { label: "Due", note: "with Form 5-A", value: "20th" },
  ],
  updatedFrom: "Karnataka's Act and the Commercial Taxes Department",
  rules: [
    {
      heading: "Who pays",
      rows: [
        { label: "Workers", text: "Anyone whose salary or wage for the month is ₹25,000 or more. Bonus and arrears count, spread over the months they relate to." },
        { label: "Left out", text: "Anyone employed for 120 days or less in the year, and people aged 60 or more." },
        { label: "The company itself", text: "A company also pays ₹2,500 a year for itself, before 30 April. Where several entries in the Schedule apply to a business, it pays under only one." },
      ],
    },
    {
      heading: "What the employer does",
      rows: [
        { label: "Register", text: "Apply for a registration certificate in Form 1 within 30 days of becoming an employer. Registering late carries a ₹1,000 penalty." },
        { label: "Deduct and pay", text: "Deduct the tax from salary, pay it and file the Form 5-A statement with proof of payment within 20 days of the month's end. The employer owes it whether or not it was deducted." },
        { label: "The year", text: "File the annual return within 60 days of the year's end. There has been no quarterly option since 1 April 2012." },
        { label: "Where", text: "On the Commercial Taxes Department's portal, ptax.karnataka.gov.in, under Employer Login." },
      ],
    },
    {
      heading: "Paid late",
      rows: [
        { label: "Interest", text: "1.5% of the unpaid tax for each month or part of a month." },
        { label: "Penalty", text: "10% of the tax due after a notice of demand, on top of the interest; ₹250 for not filing the statement or not paying." },
        { label: "Not registered", text: "The department assesses the tax on the information it has, and adds a penalty equal to that tax." },
      ],
    },
    {
      heading: "Contract workers",
      rows: [
        { label: "Who deducts", text: "The contractor, for its own workers. Where workers are supplied as a manpower service, the Act also has the principal deduct their tax from what it pays the contractor, in any month the payment exceeds ₹3,000, unless the contractor produces a copy of its filed return." },
      ],
    },
  ],
  faqs: [
    {
      question: "What is the professional tax slab in Karnataka?",
      answer: "One slab for salaried workers: ₹200 a month, and ₹300 in February, on a salary or wage of ₹25,000 or more for the month. Below ₹25,000 there is no tax.",
    },
    {
      question: "When did it change?",
      answer: "The ₹25,000 threshold applies from 1 April 2023, when it rose from ₹15,000. The ₹300 February amount applies from 1 April 2025, taking the year from ₹2,400 to ₹2,500.",
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

/** The six states we cover, in the hub's table. */
export const ptStates: { state: TableCell; levied: boolean; amount: string; who: string }[] = [
  { state: { text: "Karnataka", href: "/professional-tax/karnataka" }, levied: true, amount: "₹200 a month, ₹300 in February", who: "Salary of ₹25,000 or more in the month" },
  { state: "Punjab", levied: true, amount: "₹200 a month, as a development tax", who: "Income-tax payers only" },
  { state: "Delhi", levied: false, amount: "None", who: "" },
  { state: "Haryana", levied: false, amount: "None", who: "" },
  { state: "Uttar Pradesh", levied: false, amount: "None", who: "" },
  { state: "Uttarakhand", levied: false, amount: "None", who: "" },
];

export const professionalTaxTopic: TopicPage = {
  path: "/professional-tax",
  title: "Professional Tax by State 2026: Who Levies It",
  description:
    "Professional tax in the states we cover: Karnataka levies it, Punjab has a development tax, and Uttarakhand, UP, Delhi and Haryana levy none. The ₹2,500 cap.",
  breadcrumb: "Professional Tax",
  heading: "Professional Tax by state.",
  lede: "Each state decides whether to levy it, up to ₹2,500 a person a year. Of the six states we cover, Karnataka and Punjab levy one; the other four do not.",
  glance: [
    { label: "Most a person pays", note: "a year, Article 276(2)", value: "₹2,500", key: true },
    { label: "States that levy it", note: "of the six we cover", value: "2" },
    { label: "Karnataka", note: "on ₹25,000 or more", value: "₹200" },
    { label: "Punjab", note: "income-tax payers", value: "₹200" },
  ],
  updatedFrom: "the Constitution and the states' Acts",
  rules: [],
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
  ],
  checked: "2026-10-18",
};
