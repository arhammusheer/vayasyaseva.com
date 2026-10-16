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

export type DueRow = {
  name: string;
  /** Who it covers, one short line. */
  applies: string;
  worker: string;
  employer: string;
  due: string;
  sources: string[];
  /** Not levied in the state: one line across the worker, employer and due columns. */
  none?: string;
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

const wages: DueRow = {
  name: "Wages",
  applies: "Every worker",
  worker: "Gets at least the rate above",
  employer: "Pays the full wage",
  due: "By the 7th of the next month",
  sources: ["cow-2019"],
};

const epf: DueRow = {
  name: "EPF",
  applies: "Units with 20+ employees; wages up to ₹25,000 a month",
  worker: "12% of wages",
  employer: "12% (8.33% pension, 3.67% PF), plus 0.5% EDLI and 0.5% admin",
  due: "15th of the next month, with the ECR",
  sources: ["css-2020", "epf-ceiling-2026", "epf-faq-2026"],
};

const esic: DueRow = {
  name: "ESIC",
  applies: "Units with 10+ employees in a notified area; wages up to ₹21,000 a month",
  worker: "0.75% of wages",
  employer: "3.25% of wages",
  due: "15th of the next month",
  sources: ["css-2020", "ss-central-rules-2026", "esic-contribution"],
};

const noPt = (state: string): DueRow => ({
  name: "Professional Tax",
  applies: "Tax on salaries, set by each state",
  worker: "",
  employer: "",
  due: "",
  none: `Not levied in ${state}`,
  sources: [],
});

const upLwf: DueRow = {
  name: "Labour Welfare Fund",
  applies: "Units with 50+ persons",
  worker: "Nil",
  employer: "Sends fines and unpaid wages to the fund",
  due: "Quarterly: by 15 Jan, Apr, Jul and Oct",
  sources: ["up-lwf-rules-1972"],
};

const licence = (rules: string): DueRow => ({
  name: "Contract labour licence",
  applies: "Contractors with 50+ contract workers",
  worker: "–",
  employer: "Contractor holds a licence, valid 5 years",
  due: `Before work starts. ${rules}`,
  sources: ["osh-handbook-2026"],
});

export const employerDues: Partial<Record<WageStateSlug, DueRow[]>> = {
  uttarakhand: [wages, epf, esic, noPt("Uttarakhand"), upLwf, licence("State rules are still in draft.")],
  "uttar-pradesh": [wages, epf, esic, noPt("Uttar Pradesh"), upLwf, licence("Apply online on the UP Labour Department portal.")],
  delhi: [
    wages,
    epf,
    esic,
    noPt("Delhi"),
    {
      name: "Labour Welfare Fund",
      applies: "Units with 5+ persons; counted on 30 June and 31 December",
      worker: "₹0.75 each half-year",
      employer: "₹2.25 each half-year",
      due: "By 15 July and 15 January",
      sources: ["dl-lwf-2004"],
    },
    licence("State rules are still in draft."),
  ],
};

/** The two lines under the table. */
export const duesNotes = {
  late: "Late EPF and ESIC carry 12% a year interest, plus damages.",
  principal: "If a contractor does not pay EPF or ESIC for its workers, the principal employer must pay and recover it from the contractor.",
};

export function duesSources(slug: WageStateSlug) {
  const ids = new Set((employerDues[slug] ?? []).flatMap((r) => r.sources).concat("interest-2026"));
  return statutorySources.filter((s) => ids.has(s.id));
}
