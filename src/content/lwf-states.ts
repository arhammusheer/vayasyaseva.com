import type { LwfStateSlug } from "@/content/registry/identifiers";

/**
 * The Labour Welfare Fund in detail for the states with a page of their own
 * (/labour-welfare-fund/<state>, 18 Oct 2026). The basic rows (who it
 * covers, the two shares, the due date) stay in src/content/statutory.ts,
 * which the hub and the wage pages read; this file holds what only the
 * state page shows. The page cites statutorySources by id.
 *
 * Read against the documents on 18 Oct 2026:
 * - Haryana: the Punjab Labour Welfare Fund Act, 1965 as amended by Haryana
 *   (Labour Department copy): s.2(4) "establishment" (ten or more
 *   employees on any day in the preceding twelve months), s.9A(1) 0.2% up
 *   to a limit indexed to the CPI every 1 January, employer twice the
 *   employee's, Explanation (the employee on the register on the last
 *   working day of the month), s.9A(2) both shares before 31 December
 *   "through online mode", s.9A(3) the employee's share deducted from
 *   wages, s.9A(4) 12% a year interest after one month, s.20 recovery as
 *   arrears of land revenue, s.26A fines. The Board's notice
 *   HLWB/REV/2026/3436 (8 May 2026): ₹34 from 1 Jan 2025, ₹35 from
 *   1 Jan 2026.
 * - Delhi: notification F.9(1)/89/DLC(W)/100 of 13 Jul 2004 under the
 *   Bombay Labour Welfare Fund Act, 1953 as extended to Delhi: para 4 the
 *   three shares, counted on the register on 30 June and 31 December, paid
 *   before 15 July and 15 January; para 5 five or more persons; para 6 who
 *   is left out, and recovery as arrears of land revenue. The Board's
 *   online portal was checked live.
 */

export type LwfStateDetail = {
  slug: LwfStateSlug;
  name: string;
  /** Before " | Vayasya Seva": at most 55 characters. */
  title: string;
  /** 140 to 160 characters. */
  description: string;
  heading: string;
  /** The answer first: the amounts and the date. */
  lede: string;
  glance: { label: string; note?: string; value: string; key?: boolean }[];
  /** The signature figure's heading and line. */
  figure: { heading: string; intro: string };
  calculator: { intro: string };
  rules: { heading: string; rows: { label: string; text: string }[] }[];
  pay: { text: string; link: { href: string; label: string } };
  faqs: { question: string; answer: string }[];
  sources: string[];
};

export const lwfStates: Record<LwfStateSlug, LwfStateDetail> = {
  haryana: {
    slug: "haryana",
    name: "Haryana",
    title: "Haryana Labour Welfare Fund 2026: ₹35 Cap, Due Date",
    description:
      "Haryana LWF from 1 January 2026: 0.2% of wages up to ₹35 a month from the worker, twice that from the employer, paid online before 31 December. With examples.",
    heading: "Labour Welfare Fund in Haryana.",
    lede: "Each worker pays 0.2% of wages, up to ₹35 a month, and the employer pays twice that. The employer deposits both shares online once a year, before 31 December.",
    glance: [
      { label: "Worker pays", note: "of wages, up to ₹35 a month", value: "0.2%" },
      { label: "Employer pays", note: "up to ₹70 a month", value: "Twice", key: true },
      { label: "The cap starts at", note: "monthly wages", value: "₹17,500" },
      { label: "Due", note: "once a year", value: "31 Dec" },
    ],
    figure: {
      heading: "Capped at ₹35 a month.",
      intro: "The worker's share grows with wages until ₹17,500 a month, then stays at ₹35. The employer pays twice the worker's share.",
    },
    calculator: { intro: "For one worker. The shares are worked out every month and deposited together for the year." },
    rules: [
      {
        heading: "Who it covers",
        rows: [
          { label: "Establishments", text: "Factories, shops and commercial establishments with ten or more employees on any day in the last twelve months." },
          { label: "Who counts", text: "Every employee on the register on the last working day of the month." },
        ],
      },
      {
        heading: "How much",
        rows: [
          { label: "Worker", text: "0.2% of salary or wages, up to ₹35 a month from 1 January 2026 (₹34 in 2025), deducted from wages." },
          { label: "Employer", text: "Twice the worker's share, up to ₹70 a month." },
          { label: "The cap", text: "Indexed to the consumer price index every 1 January, so expect a new figure each year." },
        ],
      },
      {
        heading: "When",
        rows: [
          { label: "Payment", text: "Both shares, once a year, before 31 December, online." },
          { label: "Paid late", text: "More than a month after 31 December, interest of 12% a year runs until the money is deposited. Unpaid sums can be recovered as arrears of land revenue." },
          { label: "Penalty", text: "For breaking the Act or obstructing an inspector: a fine of ₹2,000 to ₹5,000 for a first offence; up to three months in prison or a fine of ₹3,000 to ₹10,000 after that." },
        ],
      },
    ],
    pay: {
      text: "The Act requires online payment to the Welfare Commissioner. Employers file and pay on the Haryana Labour Department's portal, under the Labour Welfare Board.",
      link: { href: "https://hrylabour.gov.in/login/welfare", label: "Haryana Labour Welfare Board login" },
    },
    faqs: [
      {
        question: "Is Haryana's Labour Welfare Fund paid monthly?",
        answer: "The shares are worked out every month, but the employer deposits them once a year: both shares, online, before 31 December. More than a month late, interest of 12% a year applies.",
      },
      {
        question: "Does a worker who joins mid-year count?",
        answer: "Yes, for each month they are on the establishment's register on its last working day. A worker who has left by then does not count for that month.",
      },
    ],
    sources: ["hr-lwf-act", "hr-lwf-2026"],
  },
  delhi: {
    slug: "delhi",
    name: "Delhi",
    title: "Delhi Labour Welfare Fund 2026: Rates and Due Dates",
    description:
      "Delhi LWF: ₹0.75 from each worker and ₹2.25 from the employer every half-year, for units with 5 or more persons, paid by 15 July and 15 January. With examples.",
    heading: "Labour Welfare Fund in Delhi.",
    lede: "A fixed amount for each worker, twice a year: ₹0.75 from the worker and ₹2.25 from the employer, deposited before 15 July and 15 January. The Government of Delhi adds ₹1.50.",
    glance: [
      { label: "Worker pays", note: "each half-year", value: "₹0.75" },
      { label: "Employer pays", note: "each half-year", value: "₹2.25", key: true },
      { label: "Covered from", value: "5 persons" },
      { label: "Due", value: "15 Jul, 15 Jan" },
    ],
    figure: {
      heading: "Twice a year, by headcount.",
      intro: "Not a share of wages: a fixed amount for each worker on the register on the last day of each half-year.",
    },
    calculator: { intro: "For one half-year, by the workers on the register on 30 June or 31 December." },
    rules: [
      {
        heading: "Who it covers",
        rows: [
          { label: "Establishments", text: "Establishments employing five or more persons." },
          { label: "Who counts", text: "Every employee on the register on 30 June and on 31 December, except those in a managerial or supervisory capacity drawing more than ₹2,500 a month." },
        ],
      },
      {
        heading: "How much",
        rows: [
          { label: "Worker", text: "₹0.75 every six months." },
          { label: "Employer", text: "₹2.25 every six months, and it deposits the worker's share with its own." },
          { label: "Government", text: "₹1.50 every six months for each worker, paid by the Government of Delhi." },
        ],
      },
      {
        heading: "When",
        rows: [
          { label: "Payment", text: "For January to June, before 15 July; for July to December, before 15 January." },
          { label: "Paid late", text: "Unpaid contributions can be recovered as arrears of land revenue." },
        ],
      },
    ],
    pay: {
      text: "Employers register the establishment and pay online on the Delhi Labour Welfare Board's portal.",
      link: { href: "https://dlabourwelfareboard.delhi.gov.in/index.php", label: "Delhi Labour Welfare Board portal" },
    },
    faqs: [
      {
        question: "Is Delhi's Labour Welfare Fund a percentage of wages?",
        answer: "No. It is a fixed amount for each worker on the register on 30 June and 31 December: ₹0.75 from the worker and ₹2.25 from the employer, whatever the wage.",
      },
      {
        question: "Do managers and supervisors pay it?",
        answer: "Not if they work in a managerial or supervisory capacity and draw more than ₹2,500 a month. Everyone else on the register counts.",
      },
    ],
    sources: ["dl-lwf-2004"],
  },
};
