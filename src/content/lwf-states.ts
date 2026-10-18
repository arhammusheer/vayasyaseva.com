import type { LwfStateSlug } from "@/content/registry/identifiers";

/**
 * The Labour Welfare Fund in detail for the states with a page of their own
 * (/labour-welfare-fund/<state>, 18 Oct 2026). The basic rows (who it
 * covers, the two shares, the due date) stay in src/content/statutory.ts,
 * which the hub and the wage pages read; this file holds what only the
 * state page shows. Every line cites a source in statutorySources by id.
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

export type LwfFact = { label: string; text: string; sources: string[] };

export type LwfExample = {
  heading: string;
  /** One line before the rows: what the example assumes. */
  intro: string;
  rows: { label: string; value: string }[];
  note?: string;
};

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
  facts: LwfFact[];
  example: LwfExample;
  /** How the amounts have moved, where the documents show it. */
  history?: { heading: string; rows: { from: string; worker: string; employer: string; source: string }[]; note: string };
  pay: { heading: string; text: string; link: { href: string; label: string } };
  faqs: { question: string; answer: string }[];
  sources: string[];
};

const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

/**
 * Haryana's worked example from the state's unskilled minimum wage (the
 * wage dataset), so the figure moves when the wage page does, and one wage
 * above the cap.
 */
function haryanaExample(minimumWage: number): LwfExample {
  const cap = 35;
  const share = Math.round(minimumWage * 0.002 * 100) / 100;
  const worker = Math.min(share, cap);
  const capFrom = cap / 0.002;
  return {
    heading: "What it comes to.",
    intro: `For one worker on Haryana's unskilled minimum wage of ${rupees(minimumWage)} a month, and one earning ${rupees(20000)}:`,
    rows: [
      { label: `On ${rupees(minimumWage)} a month`, value: `Worker ${rupees(worker)}, employer ${rupees(worker * 2)}: ${rupees(worker * 3)} a month, ${rupees(worker * 3 * 12)} a year` },
      { label: `On ${rupees(20000)} a month`, value: `0.2% is ${rupees(40)}, above the cap, so worker ${rupees(cap)}, employer ${rupees(cap * 2)}: ${rupees(cap * 3)} a month, ${rupees(cap * 3 * 12)} a year` },
      { label: "Where the cap starts", value: `At ${rupees(capFrom)} a month; above it the shares stay at ${rupees(cap)} and ${rupees(cap * 2)}` },
    ],
    note: "Figures before any rounding. The employer deducts the worker's share from wages and deposits both shares together.",
  };
}

export function lwfStateDetail(slug: LwfStateSlug, haryanaMinimumWage: number): LwfStateDetail {
  if (slug === "haryana") {
    return {
      slug,
      name: "Haryana",
      title: "Haryana Labour Welfare Fund 2026: ₹35 Cap, Due Date",
      description:
        "Haryana LWF from 1 January 2026: 0.2% of wages up to ₹35 a month from the worker, twice that from the employer, paid online before 31 December. With examples.",
      heading: "Labour Welfare Fund in Haryana.",
      lede: "From 1 January 2026, each worker pays 0.2% of wages, up to ₹35 a month, and the employer pays twice the worker's share, up to ₹70. The employer pays both shares online once a year, before 31 December.",
      facts: [
        { label: "Who it covers", text: "Factories, shops and commercial establishments with ten or more employees on any day in the last twelve months.", sources: ["hr-lwf-act"] },
        { label: "Who counts", text: "Every employee on the establishment's register on the last working day of the month.", sources: ["hr-lwf-act"] },
        { label: "Worker pays", text: "0.2% of salary or wages, up to ₹35 a month from 1 January 2026, deducted from wages by the employer.", sources: ["hr-lwf-act", "hr-lwf-2026"] },
        { label: "Employer pays", text: "Twice the worker's share, up to ₹70 a month.", sources: ["hr-lwf-act", "hr-lwf-2026"] },
        { label: "When", text: "Both shares, once a year, before 31 December.", sources: ["hr-lwf-act"] },
        { label: "Paid late", text: "More than a month after 31 December, interest of 12% a year runs until the money is deposited. Unpaid sums can be recovered as arrears of land revenue.", sources: ["hr-lwf-act"] },
        { label: "Penalty", text: "Breaking the Act or obstructing an inspector: a fine of ₹2,000 to ₹5,000 for a first offence; up to three months in prison or a fine of ₹3,000 to ₹10,000 after that.", sources: ["hr-lwf-act"] },
      ],
      example: haryanaExample(haryanaMinimumWage),
      history: {
        heading: "How the cap has moved.",
        rows: [
          { from: "1 January 2025", worker: "₹34", employer: "₹68", source: "hr-lwf-2026" },
          { from: "1 January 2026", worker: "₹35", employer: "₹70", source: "hr-lwf-2026" },
        ],
        note: "The cap is indexed to the consumer price index every 1 January, so expect a new figure each year.",
      },
      pay: {
        heading: "How to pay.",
        text: "The Act requires online payment to the Welfare Commissioner. Employers file and pay through the Haryana Labour Department's portal, under the Labour Welfare Board.",
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
    };
  }
  return {
    slug,
    name: "Delhi",
    title: "Delhi Labour Welfare Fund 2026: Rates and Due Dates",
    description:
      "Delhi LWF: ₹0.75 from each worker and ₹2.25 from the employer every half-year, for units with 5 or more persons, paid by 15 July and 15 January. With examples.",
    heading: "Labour Welfare Fund in Delhi.",
    lede: "Every half-year, each worker pays ₹0.75 and the employer pays ₹2.25, and the Government of Delhi adds ₹1.50. The employer deposits the worker's and its own share before 15 July and 15 January.",
    facts: [
      { label: "Who it covers", text: "Establishments employing five or more persons.", sources: ["dl-lwf-2004"] },
      { label: "Who counts", text: "Every employee on the register on 30 June and on 31 December, except those working in a managerial or supervisory capacity and drawing more than ₹2,500 a month.", sources: ["dl-lwf-2004"] },
      { label: "Worker pays", text: "₹0.75 every six months.", sources: ["dl-lwf-2004"] },
      { label: "Employer pays", text: "₹2.25 every six months, and deposits the worker's share with its own.", sources: ["dl-lwf-2004"] },
      { label: "Government adds", text: "₹1.50 every six months for each worker, paid by the Government of Delhi.", sources: ["dl-lwf-2004"] },
      { label: "When", text: "For January to June, before 15 July; for July to December, before 15 January.", sources: ["dl-lwf-2004"] },
      { label: "Paid late", text: "Unpaid contributions can be recovered as arrears of land revenue.", sources: ["dl-lwf-2004"] },
    ],
    example: {
      heading: "What it comes to.",
      intro: "For an establishment with 40 workers on the register on 30 June:",
      rows: [
        { label: "Workers' share", value: "40 × ₹0.75 = ₹30" },
        { label: "Employer's share", value: "40 × ₹2.25 = ₹90" },
        { label: "Deposit before 15 July", value: "₹120, and the same again before 15 January for the next count" },
      ],
      note: "The Government of Delhi's ₹1.50 a worker is paid separately; the employer does not deposit it.",
    },
    pay: {
      heading: "How to pay.",
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
  };
}
