/**
 * Copy for the English minimum wage pages (PLAN §5.5): lean answer pages.
 * The worker-first Hindi hub is in ./minimum-wages.hi.ts. Wage rates are not
 * typed here: they come from the dataset (src/content/wages), so the copy
 * and the tables cannot drift. The method (÷ 26, VDA, Delhi's base + DA)
 * lives once, on /minimum-wages/how-we-check (src/content/editorial.ts).
 *
 * Reference pages are read by buyers and workers alike: short sentences,
 * no phone, contractor vocabulary, and no agency words. Pages for states
 * outside Uttarakhand never imply we supply crews there.
 */
import type { WageStateSlug } from "@/content/registry/identifiers";
import { formatDate, formatMonth, formatRupees, formatShortDate, formatShortMonth, getWageState, wageStates, type Skill, type WageState } from "@/content/wages";

/** A rate from the dataset, by table, zone and skill. Throws if it is missing, so a typo fails the build. */
export function rate(state: WageState, table: string, zone: string, skill: Skill) {
  const found = state.tables.find((t) => t.id === table)?.rates.find((r) => r.zone === zone && r.skill === skill);
  if (!found) throw new Error(`${state.state}: no ${table}/${zone}/${skill} rate`);
  return found;
}
const rs = (state: WageState, table: string, zone: string, skill: Skill) => formatRupees(rate(state, table, zone, skill).monthly);

/**
 * The freshness stamp in the meta descriptions: "Checked Oct 2026" once a
 * named person signs the figures off, "Updated Oct 2026" until then (the
 * same wording as the line under each H1).
 */
const stamp = (states: readonly WageState[]) =>
  `${states.every((s) => s.checked.by) ? "Checked" : "Updated"} ${formatShortMonth(states.map((s) => s.checked.on).sort()[0])}`;

type FaqItem = { question: string; answer: string };
type LinkItem = { href: string; label: string };

export type WageStateCopy = {
  /** Page title before " | Vayasya Seva", without the year (added while the page is current). */
  title: (year: string | null) => string;
  description: string;
  /** One sentence under the H1: the rate and when it took effect. */
  answer: string;
  /** Uttarakhand: which of its two tables applies, as a switch above them. */
  whichTable?: { rule: string; labels: Record<string, string> };
  /** One line under the tables. */
  note?: { text: string; link: LinkItem };
  /** Two questions, for the page and its FAQPage schema. */
  faqs: [FaqItem, FaqItem];
  /** Where a worker paid less can complain: the state labour department. */
  labourDepartment: LinkItem;
  /**
   * The doors band: "haridwar" (jobs and a crew, where we work) or
   * "elsewhere" (the complaint link and a neutral crew door: no jobs door,
   * and nothing that implies we staff sites in that state).
   */
  band: "haridwar" | "elsewhere";
};

const copy: Record<WageStateSlug, ((s: WageState) => WageStateCopy) | undefined> = {
  uttarakhand: (s) => {
    const factory = rs(s, "factories-and-industries", "uttarakhand", "unskilled");
    const engineering = rs(s, "engineering-50-plus", "uttarakhand", "unskilled");
    const unskilled = rate(s, "factories-and-industries", "uttarakhand", "unskilled");
    return {
      title: (year) => `Uttarakhand Minimum Wages${year ? ` ${year}` : ""}: Rates by Skill`,
      description: `Uttarakhand minimum wage from 1 Apr 2026: ${factory} a month unskilled (notification 289), ${engineering} in engineering units with 50+ workers. ${stamp([s])}.`,
      answer: `From 1 April 2026, an unskilled worker in most Uttarakhand factories must get at least ${factory} a month, or ${formatRupees(unskilled.daily ?? 0)} a day.`,
      whichTable: {
        rule: "Engineering units with 50 or more workers use the second table. Every other factory uses the first.",
        labels: { "factories-and-industries": "Most factories", "engineering-50-plus": "Engineering, 50+" },
      },
      faqs: [
        {
          question: `Does the ${engineering} rate apply to my pharma or food factory?`,
          answer: "No. The April 2026 order covers engineering units with 50 or more workers only. A pharma, food or packaging factory follows notification 289, or its own employment's notification, whatever its size.",
        },
        {
          question: "Is the rate different in Haridwar and Dehradun?",
          answer: "No. Uttarakhand has one rate for the whole state, so the same figures apply in SIDCUL Haridwar, Roorkee and Dehradun. The kind of work and the skill level decide the rate, not the city.",
        },
      ],
      labourDepartment: { href: "https://labour.uk.gov.in/", label: "Labour Department, Uttarakhand" },
      band: "haridwar",
    };
  },
  "uttar-pradesh": (s) => {
    const t = "scheduled-employments";
    const [c1, c2, c3] = ["category-1", "category-2", "category-3"].map((z) => rs(s, t, z, "unskilled"));
    return {
      title: (year) => `Minimum Wages in UP${year ? ` ${year}` : ""}: Rates by Skill Level`,
      description: `UP minimum wage from 1 Apr 2026, unskilled: ${c1} Noida/Ghaziabad, ${c2} Nagar Nigam districts, ${c3} elsewhere. All skill levels. ${stamp([s])}.`,
      answer: `From 1 April 2026, unskilled work in Uttar Pradesh pays at least ${c1} a month in Gautam Buddha Nagar (Noida) and Ghaziabad, ${c2} in other Nagar Nigam districts and ${c3} everywhere else.`,
      faqs: [
        {
          question: "Why is the rate higher in Noida?",
          answer: "The April 2026 order put Gautam Buddha Nagar and Ghaziabad in Category I, the highest. Its preamble says the state weighed industry, city infrastructure and the cost of living, and that employers and workers agreed to the three categories.",
        },
        {
          question: "Which rate applies in Lucknow, Kanpur or Saharanpur?",
          answer: `Category II, ${c2} a month for unskilled work. Each of these districts has a Nagar Nigam.`,
        },
      ],
      labourDepartment: { href: "https://uplabour.gov.in/", label: "Labour Department, Uttar Pradesh" },
      band: "elsewhere",
    };
  },
  delhi: (s) => {
    const t = "all-scheduled-employments";
    const unskilled = rate(s, t, "delhi", "unskilled");
    const from = s.tables[0].effectiveFrom;
    const latest = s.sources.find((x) => x.id === "dl-2025-04")!;
    return {
      title: (year) => `Delhi Minimum Wage${year ? ` ${year}` : ""}: ${formatRupees(unskilled.daily ?? 0)}/day, ${formatRupees(unskilled.monthly)}/month`,
      description: `Delhi minimum wage from ${formatShortDate(from)}: ${rs(s, t, "delhi", "unskilled")} a month (${formatRupees(unskilled.daily ?? 0)} a day) unskilled, ${rs(s, t, "delhi", "semi-skilled")} semi-skilled, ${rs(s, t, "delhi", "skilled")} skilled. Latest order. ${stamp([s])}.`,
      answer: `From ${formatDate(from)}, Delhi's minimum wage is ${formatRupees(unskilled.monthly)} a month for unskilled work, ${rs(s, t, "delhi", "semi-skilled")} semi-skilled and ${rs(s, t, "delhi", "skilled")} skilled.`,
      note: {
        text: "One rate covers all of Delhi. Gurugram and Faridabad are in Haryana, and Noida and Ghaziabad are in Uttar Pradesh.",
        link: { href: "/minimum-wages/uttar-pradesh", label: "UP rates" },
      },
      faqs: [
        {
          question: "Why do some websites show a higher Delhi rate?",
          answer: `Check whether the Labour Department lists the order they quote. When we checked on ${formatDate(s.checked.on)}, its newest order was the one dated ${formatDate(latest.date)}. The rates on this page come from that order.`,
        },
        {
          question: `Why hasn't Delhi's rate changed since ${formatMonth(from)}?`,
          answer: `Delhi's notification sets DA revisions every April and October, but the Labour Department's list shows no order after ${formatMonth(from)}. When one appears, we update this page.`,
        },
      ],
      labourDepartment: { href: "https://labour.delhi.gov.in/labour/current-minimum-wage-rate", label: "Labour Department, Delhi" },
      band: "elsewhere",
    };
  },
  haryana: undefined,
};

export function getWageStateCopy(slug: WageStateSlug): WageStateCopy | undefined {
  const state = getWageState(slug);
  const build = copy[slug];
  return state && build ? build(state) : undefined;
}

/** "1 October 2025, 1 April 2026 and 1 October 2026". */
export const listDates = (dates: string[]) => {
  const parts = dates.map(formatDate);
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0];
};

export const wageHubCopy = {
  title: (year: string | null) => `Minimum Wages${year ? ` ${year}` : ""}: Uttarakhand, UP and Delhi`,
  /** The oldest date across the states, so the line is true for every one of them. */
  description: () =>
    `Minimum wage rates for Uttarakhand, Uttar Pradesh and Delhi by skill level, each with its notification number and effective date. ${stamp(wageStates)}.`,
  heading: (year: string | null) => (year ? `Minimum wages in ${year}, by state.` : "Minimum wages by state."),
  lede: "Monthly rates. Open a state for every skill level and the daily rate.",
  /** The visible table caption: the "national minimum wage" answer. */
  caption:
    "There is no single national minimum wage. Each state fixes its own rates, and the Code on Wages, 2019 lets the Centre set a floor wage that no state may go below.",
  /** The table's "Last change" cell, one short phrase per state. */
  lastChange: {
    uttarakhand: (s: WageState) => `VDA up to ${formatRupees(rate(s, "factories-and-industries", "uttarakhand", "unskilled").vda)}; new engineering rates`,
    "uttar-pradesh": () => "Split into three district categories",
    delhi: (s: WageState) => `None since ${formatMonth(s.tables[0].effectiveFrom)}`,
  } as Partial<Record<WageStateSlug, (s: WageState) => string>>,
  /** The year drops out with the H1's once the figures may be stale. */
  faq: (year: string | null, lowest: string, highest: string): FaqItem => ({
    question: year ? `What is the minimum wage in ${year}?` : "What is the minimum wage in India?",
    answer: `It depends on the state, the kind of work and the skill level. For unskilled work in the employments shown here, monthly rates run from ${lowest} to ${highest}.`,
  }),
};

type Door = { eyebrow: string; heading: string; text: string; link: LinkItem; external?: boolean };

/** The doors band at the foot of each wage page (PLAN §5.5): no phone. */
export const wageDoors = {
  jobs: {
    eyebrow: "LOOKING FOR WORK",
    heading: "Factory and warehouse jobs in SIDCUL and across Haridwar.",
    text: "Full 8-hour shifts. There is no fee to apply.",
    link: { href: "/jobs/haridwar", label: "Jobs in Haridwar" },
  } satisfies Door,
  business: {
    eyebrow: "HIRING FOR A UNIT",
    heading: "Need a crew on your site?",
    text: "Tell us the work, the headcount and the shifts.",
    link: { href: "/contact", label: "Request a crew" },
  } satisfies Door,
  /** UP and Delhi: who to complain to, by state. */
  paidLess: (name: string, department: LinkItem): Door => ({
    eyebrow: "PAID LESS THAN THIS?",
    heading: `Complain to the ${name} Labour Department.`,
    text: "Keep your wage slips and attendance record. They show what you were paid.",
    link: department,
    external: true,
  }),
  /** UP and Delhi: a neutral crew door that promises nothing about that state. */
  neutral: {
    eyebrow: "FOR EMPLOYERS",
    heading: "Hiring for a unit?",
    text: "We supply crews in SIDCUL and across Haridwar.",
    link: { href: "/contact", label: "Request a crew" },
  } satisfies Door,
};
export type { Door as WageDoor };

/** Labels the wage page components use. */
export const wageUi = {
  minimumWages: "Minimum wages",
  stateHeading: (name: string, year: string | null) => `Minimum wages in ${name}${year ? `, ${year}` : ""}.`,
  /** The line under each H1: who checked and when, or the unsigned wording until someone signs off. */
  checked: (by: string | null, date: string) => (by ? `Rates checked ${date} by ${by}` : `Updated ${date} from the state's own documents`),
  howWeCheck: "How we check",
  notice: {
    staleStrong: "These rates may have been revised.",
    staleText: "Check the latest notification.",
    staleLink: "Latest notifications from the state",
    many: (dates: string) => `Revisions due on ${dates} have not been notified. Arrears may be due when they are; these are the latest published rates.`,
    one: (date: string) => `The revision due on ${date} has not been notified. These are the latest published rates.`,
  },
  table: {
    caption: (title: string, name: string, date: string) => `${title}: minimum wages in ${name} from ${date}, in rupees`,
    skill: "Skill",
    month: "Per month",
    day: "Per day",
    dayDerived: "Per day (÷ 26)",
    notSet: "Not set",
    breakdown: "Show breakdown",
    source: (date: string, kind: string, number: string) => `In force from ${date}. ${kind} ${number}.`,
    range: (from: string, to: string) => `${from} to ${to}`,
    which: "Which table?",
  },
  sourceKind: (kind: "notification" | "order" | "corrigendum") => (kind === "notification" ? "Notification" : kind === "order" ? "Order" : "Amendment"),
  pdf: (hindi: boolean, size: string | null) => `PDF${hindi ? ", Hindi" : ""}${size ? `, ${size}` : ""}`,
  sections: {
    rates: (name: string) => `Minimum wage rates in ${name}`,
    earlier: "Earlier rates",
    questions: "Common questions",
    documents: "Documents used",
  },
  hub: {
    state: "State",
    unskilled: "Unskilled",
    semiSkilled: "Semi-skilled",
    skilled: "Skilled",
    perMonth: "per month",
    inForce: "In force from",
    lastChange: "Last change",
    byCategory: "by district category",
    mayBeRevised: "may have been revised",
    checked: "Updated from each state's own notifications.",
  },
};
