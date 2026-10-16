import type { WageStateSlug } from "@/content/registry/identifiers";

/**
 * What an employer owes beyond the wage itself, by state, for the "Employer
 * dues" table on each wage state page (owner direction, 16 Oct 2026). Every
 * row cites primary sources (`sources`, listed under "Documents used").
 *
 * Checked against the documents on `checked`. Re-check by `reviewBy`:
 * the ESIC due date rests on the old ESI regulations, saved by Code on
 * Social Security s.164(2)(b) for one year from 21 Nov 2025, and the
 * Uttarakhand and Delhi OSH rules are still drafts. content:check warns once
 * the date passes.
 */
export const STATUTORY_CHECKED = "2026-10-16";
export const STATUTORY_REVIEW_BY = "2026-11-21";

export type StatutorySource = { id: string; title: string; number: string; date: string; authority: string; url: string };

/** One due date in the strip: when, then what is due. */
export type Deadline = { when: string; detail: string; what: string; sources: string[] };

/** One row of "Who pays what": the worker's and the employer's share. */
export type DueRow = {
  name: string;
  /** Who it covers, one short line. */
  applies: string;
  worker: string;
  employer: string;
  /** A row that is not a rate (the UP-law welfare fund): what is paid and when, as labelled lines under the row. */
  explain?: [label: string, text: string][];
  sources: string[];
};

export type StateDues = {
  deadlines: Deadline[];
  rows: DueRow[];
  /** "Professional Tax is not levied in Uttarakhand." Absent where it is levied (Karnataka). */
  notLevied?: string;
};

export const statutorySources: StatutorySource[] = [
  {
    id: "cow-2019",
    title: "The Code on Wages, 2019 (section 17: time limit for payment of wages)",
    number: "Act No. 29 of 2019",
    date: "2019-08-08",
    authority: "Ministry of Law and Justice",
    url: "https://egazette.gov.in/WriteReadData/2019/210356.pdf",
  },
  {
    id: "css-2020",
    title: "The Code on Social Security, 2020 (First Schedule: EPF and ESIC coverage)",
    number: "Act No. 36 of 2020",
    date: "2020-09-29",
    authority: "Ministry of Law and Justice",
    url: "https://egazette.gov.in/WriteReadData/2020/222111.pdf",
  },
  {
    id: "epf-ceiling-2026",
    title: "EPF wage ceiling of ₹25,000 a month from 17 September 2026",
    number: "S.O. 5109(E)",
    date: "2026-09-17",
    authority: "Ministry of Labour and Employment; EPFO circular of 28 September 2026",
    url: "https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/Wage-Ceiling-Circular-28.09.2026.pdf",
  },
  {
    id: "epf-faq-2026",
    title: "EPFO: frequently asked questions on the wage ceiling (contribution rates, EDLI and admin charges)",
    number: "EPFO FAQs",
    date: "2026-09-28",
    authority: "Employees' Provident Fund Organisation",
    url: "https://pmvbry-cdn.epfindia.gov.in/wp-content/uploads/2026/09/EPFO_Wage_Ceiling_FAQs.pdf",
  },
  {
    id: "ss-central-rules-2026",
    title: "Code on Social Security (Central) Rules, 2026 (rule 19: ESIC contribution rates)",
    number: "G.S.R. 344(E)",
    date: "2026-05-08",
    authority: "Ministry of Labour and Employment",
    url: "https://egazette.gov.in/WriteReadData/2026/272366.pdf",
  },
  {
    id: "esic-contribution",
    title: "ESIC: rates of contribution and due date",
    number: "esic.gov.in",
    date: "2026-10-16",
    authority: "Employees' State Insurance Corporation",
    url: "https://www.esic.gov.in/contribution",
  },
  {
    id: "interest-2026",
    title: "Interest at 12% a year on amounts due under the Code on Social Security",
    number: "S.O. 2698(E)",
    date: "2026-05-29",
    authority: "Ministry of Labour and Employment",
    url: "https://egazette.gov.in/WriteReadData/2026/272998.pdf",
  },
  {
    id: "dl-lwf-2004",
    title: "Constitution of the Labour Welfare Fund for Delhi (Bombay Labour Welfare Fund Act, 1953 as extended to Delhi)",
    number: "F.9(1)/89/DLC(W)/100",
    date: "2004-07-13",
    authority: "Delhi Labour Welfare Board",
    url: "https://dlwb.delhi.gov.in/dlwb/constitution-labour-welfare-fund-national-capital-territory-delhi-notification-ii",
  },
  {
    id: "up-lwf-rules-1972",
    title: "U.P. Labour Welfare Fund Rules, 1972 (also listed by Uttarakhand's Labour Department)",
    number: "153(V)/XXXV-15-529(V)-71",
    date: "1972-01-12",
    authority: "Government of Uttar Pradesh",
    url: "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads/2025/04/2025041461612759.pdf",
  },
  {
    id: "ka-pt-act",
    title: "Karnataka Tax on Professions, Trades, Callings and Employments Act, 1976 (sections 4, 6 and 6A: deduction, returns and payment)",
    number: "Karnataka Act 35 of 1976",
    date: "1976-04-01",
    authority: "Government of Karnataka",
    url: "https://prsindia.org/files/bills_acts/acts_states/karnataka/1976/1976KR35.pdf",
  },
  {
    id: "ka-pt-2025",
    title: "Karnataka Tax on Professions (Amendment) Bill, 2025: ₹200 a month on ₹25,000 or more, ₹300 in February",
    number: "L.A. Bill No. 8 of 2025",
    date: "2025-03-01",
    authority: "Karnataka Legislative Assembly",
    url: "https://prsindia.org/files/bills_acts/bills_states/karnataka/2025/Bill8of2025KA.pdf",
  },
  {
    id: "ka-lwf-2025",
    title: "Karnataka Labour Welfare Fund (Amendment) Act, 2024: ₹50 worker, ₹100 employer, ₹50 government a year",
    number: "Karnataka Act No. 5 of 2025",
    date: "2025-01-10",
    authority: "Karnataka Gazette, Part IVA No. 19",
    url: "https://klwb.karnataka.gov.in/uploads/Govt%20Gazette%20copy%20Lwf%2050&100_1766057899.pdf",
  },
  {
    id: "ka-osh-draft-2026",
    title: "Occupational Safety, Health and Working Conditions (Karnataka) Rules, 2026: draft",
    number: "LD 245 LET 2021",
    date: "2026-01-23",
    authority: "Labour Department, Government of Karnataka",
    url: "https://karmikaspandana.karnataka.gov.in/uploads/media_to_upload1769512711.pdf",
  },
  {
    id: "osh-handbook-2026",
    title: "Labour codes compliance handbook (OSH Code, sections 45 to 48: contract labour licence)",
    number: "Ministry of Labour handbook",
    date: "2026-02-01",
    authority: "Ministry of Labour and Employment",
    url: "https://www.labour.gov.in/static/uploads/2026/02/83978455025732b99b0165def80ab171.pdf",
  },
];

const wages: Deadline = { when: "7th", detail: "of the next month", what: "Wages, in full", sources: ["cow-2019"] };
const epfEsic: Deadline = {
  when: "15th",
  detail: "of the next month",
  what: "EPF (with the ECR) and ESIC",
  sources: ["epf-faq-2026", "esic-contribution"],
};
const licence = (rules: string): Deadline => ({
  when: "Upfront",
  detail: "before work starts",
  what: `Contract labour licence, for contractors with 50+ workers. ${rules}`,
  sources: ["osh-handbook-2026"],
});
const upLwfDeadline: Deadline = {
  when: "Quarterly",
  detail: "by 15 Jan, Apr, Jul, Oct",
  what: "Labour Welfare Fund: fines and long-unpaid wages, for units with 50+ persons",
  sources: ["up-lwf-rules-1972"],
};

const epf: DueRow = {
  name: "EPF",
  applies: "20+ employees; wages up to ₹25,000 a month",
  worker: "12%",
  employer: "12% + 0.5% EDLI + 0.5% admin",
  sources: ["css-2020", "epf-ceiling-2026", "epf-faq-2026"],
};
const esic: DueRow = {
  name: "ESIC",
  applies: "10+ employees; wages up to ₹21,000 a month",
  worker: "0.75%",
  employer: "3.25%",
  sources: ["css-2020", "ss-central-rules-2026", "esic-contribution"],
};
/**
 * The U.P. Labour Welfare Fund Act, 1965 (in force in Uttarakhand as
 * inherited in 2000) has no contribution. Section 3(2)(a): the Fund takes
 * "all fines realised from or payable by the employees"; section 2(12)
 * (U.P. Act 17 of 1978): "unpaid accumulations" are sums due to employees,
 * including wages, gratuity and house allowance, not paid within two years
 * of falling due, excluding PF contributions; section 6: the Board invites
 * claims, which must arrive within one year of the first notice. Rule 3(iii)
 * of the 1972 Rules: both are paid quarterly, by the 15th of the month after
 * the quarter. U.P. Act 23 of 2024 changed only the "employee" definition and
 * section 8(3). The Act's text is on India Code (not reachable by the
 * compliance monitor, so the page cites it by section; docs/claims-register.md).
 */
const upLwf: DueRow = {
  name: "Labour Welfare Fund",
  applies: "Units with 50+ persons",
  worker: "Nothing",
  employer: "No set rate",
  explain: [
    ["Fines", "Every fine you deducted from a worker's wages, paid for the quarter it was deducted."],
    ["Unpaid wages", "Wages, gratuity or house allowance owed to a worker and still unpaid two years after it fell due. PF is not included."],
    ["When", "Each quarter, by 15 January, April, July and October, with the statement in Annexure I."],
    ["After", "The Labour Welfare Board publishes notices. The worker has one year from the first notice to claim the money; unclaimed money stays in the Fund."],
    ["Law", "U.P. Labour Welfare Fund Act, 1965, sections 2, 3 and 6, and its 1972 Rules, rule 3. There is no regular contribution."],
  ],
  sources: ["up-lwf-rules-1972"],
};

export const employerDues: Partial<Record<WageStateSlug, StateDues>> = {
  karnataka: {
    deadlines: [
      wages,
      epfEsic,
      { when: "20th", detail: "of the next month", what: "Professional Tax (quarterly if under ₹5,000 a month)", sources: ["ka-pt-act"] },
      { when: "Yearly", detail: "1 to 15 January", what: "Labour Welfare Fund, for the year before", sources: ["ka-lwf-2025"] },
      { ...licence("Karnataka's rules are still in draft; ask the Labour Department how to apply."), sources: ["osh-handbook-2026", "ka-osh-draft-2026"] },
    ],
    rows: [
      epf,
      esic,
      { name: "Professional Tax", applies: "Wages of ₹25,000 a month or more", worker: "₹200 a month, ₹300 in February", employer: "Deducts and pays it", sources: ["ka-pt-act", "ka-pt-2025"] },
      { name: "Labour Welfare Fund", applies: "Factories with 10+ workers, 20+ contract workers, shops with 50+", worker: "₹50 a year", employer: "₹100 a year", sources: ["ka-lwf-2025"] },
    ],
  },
  uttarakhand: {
    deadlines: [wages, epfEsic, upLwfDeadline, licence("Uttarakhand has not yet fixed the forms and fees; ask the Labour Department how to apply.")],
    rows: [epf, esic, upLwf],
    notLevied: "Professional Tax is not levied in Uttarakhand.",
  },
  "uttar-pradesh": {
    deadlines: [wages, epfEsic, upLwfDeadline, licence("Apply on the UP Labour Department portal.")],
    rows: [epf, esic, upLwf],
    notLevied: "Professional Tax is not levied in Uttar Pradesh.",
  },
  delhi: {
    deadlines: [
      wages,
      epfEsic,
      { when: "Half-yearly", detail: "by 15 Jul and 15 Jan", what: "Labour Welfare Fund, for units with 5+ persons", sources: ["dl-lwf-2004"] },
      licence("Delhi has not yet fixed the forms and fees; ask the Labour Department how to apply."),
    ],
    rows: [
      epf,
      esic,
      { name: "Labour Welfare Fund", applies: "5+ persons", worker: "₹0.75 a half-year", employer: "₹2.25 a half-year", sources: ["dl-lwf-2004"] },
    ],
    notLevied: "Professional Tax is not levied in Delhi.",
  },
};

/** The one line under the table. */
export const duesNote =
  "Late EPF and ESIC carry 12% a year interest and damages. If your contractor does not pay them, you must, and recover it from them.";

export function duesSources(slug: WageStateSlug) {
  const dues = employerDues[slug];
  const ids = new Set([...(dues?.deadlines ?? []), ...(dues?.rows ?? [])].flatMap((r) => r.sources).concat("interest-2026"));
  return statutorySources.filter((s) => ids.has(s.id));
}
