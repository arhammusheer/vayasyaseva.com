/**
 * Copy for the minimum wage pages (PLAN §5.5). The hi-IN versions (PR8) are in
 * ./minimum-wages.hi.ts. Wage rates are not typed here: they come from the
 * dataset (src/content/wages), so the copy and the tables cannot drift.
 *
 * Translation lint (PLAN §6.6): each block between "@hi-source <key>" and
 * "@hi-source-end" has a Hindi version that records the sourceHash of this
 * English text. content:check (C13) fails when a block here changes and the
 * Hindi has not been updated; update the Hindi, then its hash.
 * Reference pages are read by buyers and workers alike: short sentences,
 * no phone, contractor vocabulary, and no agency words.
 */
import type { WageStateSlug } from "@/content/registry/identifiers";
import { formatDate, formatRupees, formatShortDate, formatShortMonth, getWageState, headlineRange, sourceById, unpublishedRevisions, wageStates, type Skill, type WageState } from "@/content/wages";

/** A rate from the dataset, by table, zone and skill. Throws if it is missing, so a typo fails the build. */
export function rate(state: WageState, table: string, zone: string, skill: Skill) {
  const found = state.tables.find((t) => t.id === table)?.rates.find((r) => r.zone === zone && r.skill === skill);
  if (!found) throw new Error(`${state.state}: no ${table}/${zone}/${skill} rate`);
  return found;
}
const rs = (state: WageState, table: string, zone: string, skill: Skill) => formatRupees(rate(state, table, zone, skill).monthly);

type Paragraphs = string[];
type FaqItem = { question: string; answer: string };
type LinkItem = { href: string; label: string };

export type WageStateCopy = {
  /** Page title before " | Vayasya Seva", without the year (added while the page is current). */
  title: (year: string | null) => string;
  description: string;
  /** First paragraph: the rate, the unit, the effective date and the instrument. Short sentences. */
  lede: string;
  /** The instrument behind the headline rate, for the facts strip. */
  headlineSource: { label: string; number: string };
  /** The site the "Request a crew" links prefill (contact form hash). */
  contactHref: string;
  /** Where the jobs are, for readers outside Uttarakhand. */
  jobsLine?: string;
  zones: { heading: string; text: Paragraphs; link?: LinkItem };
  madeUp: Paragraphs;
  contractLabour: { text: Paragraphs; vspl?: string; link: LinkItem };
  faqs: FaqItem[];
  /** Where a worker paid less can go: the state labour department. */
  labourDepartment: LinkItem;
};

/** The "when is the next revision" answer, from the dataset, for every state. */
export function nextRevisionAnswer(state: WageState, today?: string) {
  const { expected } = state.nextRevision;
  const due = unpublishedRevisions(state, today);
  if (due.length > 1)
    return `Revisions were due on ${listDates(due)}. When we last checked, on ${formatDate(state.checked.on)}, none had been published. If they come with back effect, arrears may be due. We update this page when the state publishes them.`;
  if (due.length === 1)
    return `A revision was due on ${formatDate(due[0])}. When we last checked, on ${formatDate(state.checked.on)}, the state had not published it. We update this page when it does.`;
  return `The next revision is expected on ${formatDate(expected)}. We update this page when the state publishes it.`;
}

/** "1 October 2025, 1 April 2026 and 1 October 2026". */
export const listDates = (dates: string[]) => {
  const parts = dates.map(formatDate);
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0];
};

/** Jobs are in Uttarakhand only: pages for other states say so. */
const JOBS_ELSEWHERE = "Our factory jobs are in Haridwar, Uttarakhand.";

const contractCheck =
  "If you use contract labour, ask your contractor each month for wage slips, the wage register and the EPF and ESIC challans. They show whether workers got at least these rates.";

const copy: Record<WageStateSlug, ((s: WageState) => WageStateCopy) | undefined> = {
  // @hi-source state:uttarakhand
  uttarakhand: (s) => {
    const factory = rs(s, "factories-and-industries", "uttarakhand", "unskilled");
    const engineering = rs(s, "engineering-50-plus", "uttarakhand", "unskilled");
    const unskilled = rate(s, "factories-and-industries", "uttarakhand", "unskilled");
    return {
      title: (year) => `Uttarakhand Minimum Wages${year ? ` ${year}` : ""}: Rates by Skill`,
      description: `Uttarakhand minimum wage from 1 Apr 2026: ${factory} a month unskilled (notification 289), ${engineering} in engineering units with 50+ workers. Checked ${formatShortMonth(s.checked.on)}.`,
      lede: `From 1 April 2026, an unskilled factory worker in Uttarakhand must get at least ${factory} a month. That is about ${formatRupees(Math.round(unskilled.daily ?? 0))} a day. This is the rate under notification 289, which covers most registered factories. Engineering units with 50 or more workers pay at least ${engineering} a month.`,
      headlineSource: { label: "Notification", number: "289 + VDA order 1203" },
      contactHref: "/contact#location=haridwar",
      zones: {
        heading: "Which rate applies to your site",
        text: [
          "Uttarakhand has one rate for the whole state. There are no city zones. What decides the rate is the kind of employment and, for engineering units, the number of workers.",
          "Engineering units with 50 or more workers follow the interim order of 29 April 2026. The order says non-engineering units were revised in 2024, so it does not cover them.",
          "Every other factory under notification 289 follows its basic wage plus VDA, whatever its size. That includes engineering units with fewer than 50 workers and every registered factory not covered by another notification.",
          "Shops and commercial establishments, construction, hotels, transport and some other employments have their own notifications and rates. The Labour Department lists all of them.",
          "SIDCUL Haridwar, Bahadrabad, Bhagwanpur and Roorkee are all in Uttarakhand, so these rates apply there.",
        ],
        link: { href: "https://labour.uk.gov.in/document-category/minimum-wages-notification/", label: "All Uttarakhand notifications" },
      },
      madeUp: [
        "Under notification 289, the monthly rate is a basic wage plus a variable dearness allowance (VDA). The basic wage was fixed from 1 April 2024.",
        `The VDA follows the All-India Consumer Price Index (2016=100): ₹57.60 for each point above 139. From 1 April 2026 it is ${formatRupees(unskilled.vda)}, from the July to December 2025 average of 148. It is reset every April and October.`,
        "The daily rate is at least 1/26 of the monthly rate. The hourly rate is at least 1/6 of the daily rate.",
        `So an unskilled worker gets ${formatRupees(unskilled.basic)} basic plus ${formatRupees(unskilled.vda)} VDA: ${factory} a month, or ${formatRupees(unskilled.daily ?? 0)} a day.`,
        "For engineering units with 50 or more workers, the April 2026 order merges the DA into one monthly figure. It sets no separate DA and no daily rate.",
      ],
      contractLabour: {
        text: [
          "Notification 289 says it plainly: contract workers must get the same minimum wage and VDA as workers the employer hires directly.",
          contractCheck,
        ],
        vspl: "We supply contract labour in SIDCUL and across Haridwar. We pay the workers we deploy at least the notified rate for their employment and skill, and deposit EPF and ESIC where they apply.",
        link: { href: "/contact#location=haridwar", label: "Request a crew in Haridwar" },
      },
      faqs: [
        {
          question: "What is the minimum wage in Uttarakhand in 2026?",
          answer: `From 1 April 2026, ${factory} a month for an unskilled worker in a factory under notification 289, which covers most registered factories. In an engineering unit with 50 or more workers, it is ${engineering} a month. Some other employments have their own notifications.`,
        },
        {
          question: `Does the ${engineering} rate apply to my pharma or food factory?`,
          answer: "No. The April 2026 interim order covers engineering units and engineering industries with 50 or more workers only. A pharma, food or packaging factory follows notification 289 or its own employment's notification, whatever its size.",
        },
        { question: "When is the next revision?", answer: nextRevisionAnswer(s) },
        {
          question: "Does this apply to contract workers?",
          answer: "Yes. Notification 289 says contract workers get the same minimum wage and VDA as workers hired directly.",
        },
        {
          question: "Is the rate the same in Haridwar and Dehradun?",
          answer: "Yes. Uttarakhand has one rate for the whole state. It depends on the employment and the skill level, not the city.",
        },
      ],
      labourDepartment: { href: "https://labour.uk.gov.in/", label: "Labour Department, Uttarakhand" },
    };
  },
  // @hi-source-end
  // @hi-source state:uttar-pradesh
  "uttar-pradesh": (s) => {
    const t = "scheduled-employments";
    const [c1, c2, c3] = ["category-1", "category-2", "category-3"].map((z) => rs(s, t, z, "unskilled"));
    const first = rate(s, t, "category-1", "unskilled");
    return {
      title: (year) => `Minimum Wages in UP${year ? ` ${year}` : ""}: Rates by Skill Level`,
      description: `UP minimum wage from 1 Apr 2026, unskilled: ${c1} Noida/Ghaziabad, ${c2} Nagar Nigam districts, ${c3} elsewhere. All skill levels. Checked ${formatShortMonth(s.checked.on)}.`,
      lede: `From 1 April 2026, an unskilled worker in Uttar Pradesh must get at least ${c1} a month in Gautam Buddha Nagar and Ghaziabad. It is ${c2} in other districts with a Nagar Nigam, and ${c3} elsewhere. These rates come from order ${sourceById(s, "up-2026-04").number}.`,
      headlineSource: { label: "Order", number: sourceById(s, "up-2026-04").number },
      contactHref: "/contact#state=UP",
      jobsLine: JOBS_ELSEWHERE,
      zones: {
        heading: "Which category your district is in",
        text: [
          "The April 2026 order splits Uttar Pradesh into three categories of districts. The district where the work is done decides the rate.",
          "Category I is Gautam Buddha Nagar (Noida and Greater Noida) and Ghaziabad.",
          "Category II is every other district with a Nagar Nigam, a municipal corporation. These are Agra, Aligarh, Ayodhya, Bareilly, Firozabad, Gorakhpur, Jhansi, Kanpur Nagar, Lucknow, Mathura, Meerut, Moradabad, Prayagraj, Saharanpur, Shahjahanpur and Varanasi.",
          "Category III is every other district, such as Bulandshahr, Hapur, Muzaffarnagar or Unnao.",
          "The order itself names only Category I. The Category II list is the Nagar Nigams listed by the state's Directorate of Local Bodies.",
        ],
        link: { href: "https://localbodies.up.nic.in/listnn.htm", label: "Nagar Nigams in Uttar Pradesh (Directorate of Local Bodies)" },
      },
      madeUp: [
        `Each rate is a basic wage plus a variable dearness allowance (VDA). For unskilled work in Category I, that is ${formatRupees(first.basic)} basic plus ${formatRupees(first.vda)} VDA.`,
        "The order is interim relief. Its preamble says it followed the April 2026 labour unrest in Noida and Greater Noida. It replaced the Labour Commissioner's order of 25 March 2026.",
        "The notifications for the state's 74 scheduled employments provide for a VDA revision every April and October, from the consumer price index.",
        "The daily rate is at least 1/26 of basic plus VDA. The hourly rate is at least 1/6 of the daily rate.",
        "Piece-rate wages in brick kilns were left under the earlier order. They are not shown here.",
      ],
      contractLabour: {
        text: [
          "A contract worker is owed the minimum wage for their employment and skill, like any other worker in it.",
          contractCheck,
          "Need a contractor in Uttar Pradesh? Tell us the site and we'll tell you plainly whether we can staff it.",
        ],
        link: { href: "/contact#state=UP", label: "Request a crew" },
      },
      faqs: [
        {
          question: "What is the minimum wage in UP in 2026?",
          answer: `From 1 April 2026, unskilled work pays at least ${c1} a month in Gautam Buddha Nagar and Ghaziabad, ${c2} in other districts with a Nagar Nigam, and ${c3} in all other districts.`,
        },
        {
          question: "Why is the rate higher in Noida?",
          answer: "The April 2026 order put Gautam Buddha Nagar and Ghaziabad in Category I, the highest. Its preamble says the state weighed industry, city infrastructure and the cost of living, and that employers and workers agreed to the three categories.",
        },
        {
          question: "Which rate applies in Lucknow, Kanpur or Saharanpur?",
          answer: `Category II, ${c2} a month for unskilled work. Each of these districts has a Nagar Nigam.`,
        },
        { question: "When is the next revision?", answer: nextRevisionAnswer(s) },
        {
          question: "Does this apply to contract workers?",
          answer: "Yes. The minimum wage is owed to every worker in a scheduled employment. A contractor must pay at least these rates.",
        },
      ],
      labourDepartment: { href: "https://uplabour.gov.in/", label: "Labour Department, Uttar Pradesh" },
    };
  },
  // @hi-source-end
  // @hi-source state:delhi
  delhi: (s) => {
    const t = "all-scheduled-employments";
    const unskilled = rate(s, t, "delhi", "unskilled");
    const effective = formatDate(s.tables[0].effectiveFrom);
    return {
      title: (year) => `Delhi Minimum Wage${year ? ` ${year}` : ""}: ${formatRupees(unskilled.daily ?? 0)}/day, ${formatRupees(unskilled.monthly)}/month`,
      description: `Delhi minimum wage from ${formatShortDate(s.tables[0].effectiveFrom)}: ${rs(s, t, "delhi", "unskilled")} a month (${formatRupees(unskilled.daily ?? 0)} a day) unskilled, ${rs(s, t, "delhi", "semi-skilled")} semi-skilled, ${rs(s, t, "delhi", "skilled")} skilled. Latest order. Checked ${formatShortMonth(s.checked.on)}.`,
      lede: `From ${effective}, an unskilled worker in Delhi must get at least ${formatRupees(unskilled.monthly)} a month, or ${formatRupees(unskilled.daily ?? 0)} a day. Semi-skilled is ${rs(s, t, "delhi", "semi-skilled")} and skilled is ${rs(s, t, "delhi", "skilled")}. These are the latest rates the Labour Department has published, under its order of ${formatDate(sourceById(s, "dl-2025-04").date)}.`,
      headlineSource: { label: "Order", number: sourceById(s, "dl-2025-04").number },
      contactHref: "/contact#state=DL",
      jobsLine: JOBS_ELSEWHERE,
      zones: {
        heading: "Does the rate change across Delhi?",
        text: [
          "No. Delhi has one rate for the whole territory, by skill level, and the same rates apply in every scheduled employment.",
          "Gurugram and Faridabad are in Haryana, and Noida and Ghaziabad are in Uttar Pradesh. Their own state's rates apply there.",
        ],
        link: { href: "/minimum-wages/uttar-pradesh", label: "Minimum wages in Uttar Pradesh" },
      },
      madeUp: [
        "Delhi's current base rates apply from 22 October 2019, under an order signed on 23 October 2019. Since then it has added dearness allowance (DA) on top, due twice a year, on 1 April and 1 October, from the consumer price index.",
        "The latest order, effective from 1 April 2025, added DA from the consumer price index for July to December 2024.",
        "Delhi's orders give a daily rate next to each monthly one. Clerical and supervisory staff have their own three rates, by education.",
      ],
      contractLabour: {
        text: [
          "A contract worker is owed the minimum wage for their skill level, like any other worker in the employment.",
          contractCheck,
          "Need a contractor in Delhi? Tell us the site and we'll tell you plainly whether we can staff it.",
        ],
        link: { href: "/contact#state=DL", label: "Request a crew" },
      },
      faqs: [
        {
          question: "What is the minimum wage in Delhi in 2026?",
          answer: `${formatRupees(unskilled.monthly)} a month for unskilled work, under the order effective from ${effective}. When we last checked, on ${formatDate(s.checked.on)}, the Labour Department listed no later order.`,
        },
        {
          question: "Why hasn't Delhi's rate changed since April 2025?",
          answer: "Delhi's notification sets DA revisions every April and October, but the Labour Department's list shows no order after April 2025. When one appears, we update this page.",
        },
        {
          question: "Why do some websites show a higher Delhi rate?",
          answer: `Check whether the Labour Department lists the order they quote. When we checked on ${formatDate(s.checked.on)}, its newest order was the one dated ${formatDate(sourceById(s, "dl-2025-04").date)}. The rates on this page come from that order.`,
        },
        { question: "When is the next revision?", answer: nextRevisionAnswer(s) },
        {
          question: "Does this apply to contract workers?",
          answer: "Yes. Every worker in a scheduled employment is owed at least these rates, whoever pays them.",
        },
      ],
      labourDepartment: { href: "https://labour.delhi.gov.in/labour/current-minimum-wage-rate", label: "Labour Department, Delhi" },
    };
  },
  // @hi-source-end
  haryana: undefined,
};

export function getWageStateCopy(slug: WageStateSlug): WageStateCopy | undefined {
  const state = getWageState(slug);
  const build = copy[slug];
  return state && build ? build(state) : undefined;
}

/** The source line under a table: the instrument that fixes the rates. */
export function sourceLine(state: WageState, id: string) {
  const s = sourceById(state, id);
  const kind = s.kind === "notification" ? "Notification" : s.kind === "order" ? "Order" : "Amendment";
  // Delhi's numbers carry their own "F.No." prefix.
  return `${kind} ${/^F\.?\s?No\./i.test(s.number) ? "" : "No. "}${s.number}, dated ${formatDate(s.date)}. ${s.authority}.`;
}

// @hi-source hub
export const wageHubCopy = {
  title: (year: string | null) => `Minimum Wages${year ? ` ${year}` : ""}: Uttarakhand, UP and Delhi`,
  /** The oldest check across the states, so the line is true for every one of them. */
  description: () =>
    `Minimum wage rates for Uttarakhand, Uttar Pradesh and Delhi by skill level, each with its notification number and effective date. Checked ${formatShortMonth(wageStates.map((s) => s.checked.on).sort()[0])}.`,
  heading: (year: string | null) => `Minimum wages by state${year ? `, ${year}` : ""}.`,
  /** The figures go in the first screen: unskilled, per month, by state. */
  lede: (states: readonly WageState[]) =>
    `Unskilled, per month: ${states.map((s) => `${s.name === "Uttar Pradesh" ? "UP" : s.name} ${headlineRange(s)}`).join(", ")}. Each state page has every skill level and the state's own notification. More states will follow.`,
  whatIs: {
    heading: "What a minimum wage is",
    text: [
      "A minimum wage is the least an employer may pay for a month or a day of work. Each state fixes rates for its scheduled employments, by skill level, and some states also set different rates by district.",
      "Most rates have two parts: a basic wage, and a variable dearness allowance (VDA) that rises with prices. The notifications provide for a VDA revision every April and October, but states often publish late or skip a cycle. Each state page says what was last published.",
      "The Code on Wages, 2019 came into force on 21 November 2025. It lets the central government set a national floor wage, and state rates may not be lower than it.",
    ],
  },
  changes: {
    heading: "What changed in 2026",
    items: [
      {
        state: "uttar-pradesh" as const,
        text: () => "From 1 April 2026, an interim order split the state into three categories of districts, with the highest rates in Gautam Buddha Nagar and Ghaziabad.",
      },
      {
        state: "uttarakhand" as const,
        text: (s: WageState) =>
          `From 1 April 2026, engineering units with 50 or more workers got new interim rates, and the VDA for other employments rose to ${formatRupees(rate(s, "factories-and-industries", "uttarakhand", "unskilled").vda)} a month.`,
      },
      {
        state: "delhi" as const,
        text: (s: WageState) =>
          `No new order since the one effective from ${formatDate(s.tables[0].effectiveFrom)}. Its rates are the latest the Labour Department has published.`,
      },
    ],
  },
  employers: {
    heading: "For employers using contract labour",
    text: [
      "A contract worker is owed the same minimum wage as a worker you hire directly. Uttarakhand's notification says so in as many words.",
      "Ask your contractor each month for wage slips, the wage register and the EPF and ESIC challans. They show whether the crew got at least these rates.",
    ],
  },
  workers: {
    heading: "For workers",
    text: [
      "If you are paid less than the minimum wage for your work, you can complain to the labour department of the state where you work.",
      "Keep your wage slips and your attendance record. They show what you were paid.",
    ],
  },
  faqs: (lowest: string, highest: string): FaqItem[] => [
    {
      question: "What is the minimum wage in 2026?",
      answer: `It depends on the state, the kind of work and the skill level. For unskilled work in the employments shown here, monthly rates run from ${lowest} to ${highest}.`,
    },
    {
      question: "Is there a national minimum wage?",
      answer: "Not one rate for everyone. The Code on Wages, 2019 lets the central government set a floor wage. Each state fixes its own minimum wages, which may not be lower than that floor.",
    },
    {
      question: "How often do rates change?",
      answer: "The notifications provide for a dearness allowance revision every April and October, and the basic wage is revised every few years. States often publish late or skip a cycle. Each state page says what was last published and when the next revision is due.",
    },
    {
      question: "Do these rates apply to contract workers?",
      answer: "Yes. A contract worker is owed the minimum wage for the work they do, like a direct employee. Uttarakhand's notification says so in as many words.",
    },
  ],
};

/** Shown on every wage page: how the figures are checked and corrected (PLAN §10.4). */
export const howWeCheck = {
  heading: "How we check these pages",
  text: [
    "We enter every figure by hand from the state's own notification or order, not from a summary site. Each state page links the documents it uses.",
    "We re-check each state's labour department around every revision date (1 April and 1 October), and when we hear of a new order.",
  ],
  corrections: "Spotted a wrong figure? Email us with the page and the notification. We correct confirmed errors quickly and note the date on the page.",
};

/** Two doors at the foot of every wage page (PLAN §5.5): no phone. */
export const wageDoors = {
  jobs: {
    eyebrow: "LOOKING FOR WORK",
    heading: "Factory and warehouse jobs in SIDCUL and across Haridwar.",
    text: "Full 8-hour shifts. There is no fee to apply.",
    link: { href: "/jobs", label: "See jobs" },
  },
  business: { eyebrow: "HIRING FOR A UNIT", heading: "Need a crew on your site?", text: "Tell us the work, the headcount and the shifts.", link: { href: "/contact", label: "Request a crew" } },
};
// @hi-source-end

/** Labels the wage page components use, so the Hindi pages can swap them (./minimum-wages.hi.ts). */
export type WageUi = {
  minimumWages: string;
  stateHeading: (name: string, year: string | null) => string;
  statesListItem: (name: string) => string;
  facts: { inForce: string; checked: string; checkedBy: (by: string) => string; fromDocs: string; overdue: string; wasDue: string; next: string };
  checkedPhrase: (by: string | null, date: string) => string;
  doors: { looking: string; hiring: string; paidLess: string; whatYouCanDo: string };
  notice: {
    staleStrong: string;
    staleText: string;
    staleLink: string;
    many: (dates: string, checked: string) => [string, string];
    one: (date: string, checked: string, name: string) => [string, string];
  };
  table: {
    caption: (title: string, name: string, date: string) => string;
    skill: string;
    month: string;
    day: string;
    dayDerived: string;
    split: (basicLabel: string, basic: string, vdaLabel: string, vda: string) => string;
    notSet: string;
    from: (date: string) => string;
    also: string;
    range: (from: string, to: string) => string;
  };
  pdf: (kind: "notification" | "order" | "corrigendum", hindi: boolean, size: string | null) => string;
  sourceKind: (kind: "notification" | "order" | "corrigendum") => string;
  dated: string;
  sections: {
    rates: string;
    ratesHeading: (name: string) => string;
    where: string;
    theRate: string;
    madeUpHeading: string;
    history: string;
    historyHeading: string;
    employers: string;
    employersHeading: (name: string) => string;
    workerLine: [string, string];
    others: string;
    allStates: string;
    questions: string;
    questionsHeading: string;
    sources: string;
    editorial: string;
    documents: string;
  };
  hub: {
    byState: string;
    tableHeading: string;
    caption: string;
    state: string;
    unskilledMonth: string;
    inForce: string;
    checked: string;
    byCategory: string;
    mayBeRevised: string;
    from: (date: string) => string;
    note: string;
    basics: string;
    thisYear: string;
    employers: string;
    requestCrew: string;
    workers: string;
  };
};

// @hi-source ui
export const wageUiEn: WageUi = {
  minimumWages: "Minimum wages",
  stateHeading: (name, year) => `Minimum wages in ${name}${year ? `, ${year}` : ""}.`,
  statesListItem: (name) => `Minimum wages in ${name}`,
  facts: {
    inForce: "In force from",
    checked: "Checked",
    checkedBy: (by) => `, by ${by}`,
    fromDocs: ", from the state's documents",
    overdue: "Revisions overdue since",
    wasDue: "Revision was due",
    next: "Next revision",
  },
  checkedPhrase: (by, date) => (by ? `Checked by ${by} on ${date}.` : `Entered from the state's own documents on ${date}.`),
  doors: { looking: "Looking for work?", hiring: "Hiring for a unit?", paidLess: "Paid less than this?", whatYouCanDo: "What you can do" },
  notice: {
    staleStrong: "These rates may have been revised.",
    staleText: "Check the latest notification.",
    staleLink: "Latest notifications from the state",
    many: (dates, checked) => [
      `Revisions were due on ${dates}.`,
      `None had been published when we checked on ${checked}. If they are published with back effect, arrears may be due. These are the latest published rates.`,
    ],
    one: (date, checked, name) => [`A revision was due on ${date}.`, `When we checked on ${checked}, ${name} had not published one. These are the latest published rates.`],
  },
  table: {
    caption: (title, name, date) => `${title}: minimum wages in ${name} from ${date}, in rupees`,
    skill: "Skill level",
    month: "Per month",
    day: "Per day",
    dayDerived: "Per day (÷ 26)",
    split: (basicLabel, basic, vdaLabel, vda) => `${basicLabel} ${basic} plus ${vdaLabel} ${vda}`,
    notSet: "Not set",
    from: (date) => `From ${date}.`,
    also: "Also:",
    range: (from, to) => `${from} to ${to}`,
  },
  pdf: (kind, hindi, size) => `Read the ${kind === "corrigendum" ? "amendment" : kind} (PDF${hindi ? ", Hindi" : ""}${size ? `, ${size}` : ""})`,
  sourceKind: (kind) => (kind === "notification" ? "Notification" : kind === "order" ? "Order" : "Amendment"),
  dated: "dated",
  sections: {
    rates: "RATES",
    ratesHeading: (name) => `Minimum wage rates in ${name}`,
    where: "WHERE IT APPLIES",
    theRate: "THE RATE",
    madeUpHeading: "How the rate is made up",
    history: "HISTORY",
    historyHeading: "Earlier rates",
    employers: "FOR EMPLOYERS",
    employersHeading: (name) => `If you use contract labour in ${name}`,
    workerLine: ["Paid less than this? You can complain to the", ". Keep your wage slips and attendance record."],
    others: "OTHER STATES",
    allStates: "All states",
    questions: "QUESTIONS",
    questionsHeading: "Common questions",
    sources: "SOURCES AND CHECKS",
    editorial: "Our editorial policy",
    documents: "Documents used for this page",
  },
  hub: {
    byState: "BY STATE",
    tableHeading: "Unskilled rate by state",
    caption: "Monthly minimum wage for unskilled work in the main factory employments, by state, in rupees",
    state: "State",
    unskilledMonth: "Unskilled, per month",
    inForce: "In force from",
    checked: "Checked",
    byCategory: ", by district category",
    mayBeRevised: " · may have been revised",
    from: (date) => `from ${date}`,
    note: "These are the rates for the main factory employments. Each state page has every skill level and zone, the other tables it covers, and the notification each comes from.",
    basics: "THE BASICS",
    thisYear: "THIS YEAR",
    employers: "FOR EMPLOYERS",
    requestCrew: "Request a crew",
    workers: "FOR WORKERS",
  },
};
// @hi-source-end
