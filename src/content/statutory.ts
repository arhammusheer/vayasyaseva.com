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
  sources: string[];
};

export type StateDues = {
  deadlines: Deadline[];
  rows: DueRow[];
  /** "Professional Tax is not levied in Uttarakhand." */
  notLevied: string;
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
  what: "Labour Welfare Fund, for units with 50+ persons",
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
const upLwf: DueRow = {
  name: "Labour Welfare Fund",
  applies: "50+ persons",
  worker: "Nil",
  employer: "Fines and unpaid wages",
  sources: ["up-lwf-rules-1972"],
};

export const employerDues: Partial<Record<WageStateSlug, StateDues>> = {
  uttarakhand: {
    deadlines: [wages, epfEsic, upLwfDeadline, licence("State rules in draft.")],
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
      licence("State rules in draft."),
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
