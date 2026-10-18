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
export const stamp = (states: readonly WageState[]) =>
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
  /** The state Labour Department's site, shown as the official source. */
  labourDepartment: LinkItem;
  /**
   * The doors band: a state with a jobs market ("uttarakhand", "punjab",
   * "bengaluru" for Karnataka: its jobs hub and a crew door) or "elsewhere"
   * (the Labour Department as official source and a crew door: no jobs
   * door, and nothing that implies we staff sites in that state).
   */
  band: "uttarakhand" | "bengaluru" | "punjab" | "elsewhere";
};

const copy: Record<WageStateSlug, ((s: WageState) => WageStateCopy) | undefined> = {
  uttarakhand: (s) => {
    const factory = rs(s, "factories-and-industries", "uttarakhand", "unskilled");
    const engineering = rs(s, "engineering-50-plus", "uttarakhand", "unskilled");
    const unskilled = rate(s, "factories-and-industries", "uttarakhand", "unskilled");
    const from = s.tables.find((t) => t.id === "factories-and-industries")!.effectiveFrom;
    return {
      title: (year) => `Uttarakhand Minimum Wages${year ? ` ${year}` : ""}: Rates by Skill`,
      description: `Uttarakhand minimum wage from ${formatShortDate(from)}: ${factory} a month unskilled (notification 289), ${engineering} in engineering units with 50+ workers. ${stamp([s])}.`,
      answer: `From ${formatDate(from)}, an unskilled worker in most Uttarakhand factories must get at least ${factory} a month, or ${formatRupees(unskilled.daily ?? 0)} a day.`,
      whichTable: {
        rule: "Pharma, food and packaging units use Most factories, whatever their size.",
        labels: { "factories-and-industries": "Most factories", "engineering-50-plus": "Engineering unit, 50+ workers" },
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
      band: "uttarakhand",
    };
  },
  "uttar-pradesh": (s) => {
    const t = "scheduled-employments";
    const [c1, c2, c3] = ["category-1", "category-2", "category-3"].map((z) => rs(s, t, z, "unskilled"));
    return {
      title: (year) => `Minimum Wage in Uttar Pradesh${year ? ` ${year}` : ""}: UP Rates by Skill`,
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
  haryana: (s) => {
    const t = "all-employments";
    const u = rate(s, t, "haryana", "unskilled");
    const from = s.tables[0].effectiveFrom;
    return {
      title: (year) => `Haryana Minimum Wage${year ? ` ${year}` : ""}: ${formatRupees(u.monthly)}/month Unskilled`,
      description: `Haryana minimum wage from ${formatShortDate(from)}: ${rs(s, t, "haryana", "unskilled")} a month (${formatRupees(u.daily ?? 0)} a day) unskilled, ${rs(s, t, "haryana", "semi-skilled")} semi-skilled, ${rs(s, t, "haryana", "skilled")} skilled. ${stamp([s])}.`,
      answer: `From ${formatDate(from)}, unskilled work anywhere in Haryana pays at least ${formatRupees(u.monthly)} a month, or ${formatRupees(u.daily ?? 0)} a day. One rate covers the whole state.`,
      note: {
        text: "One rate covers all of Haryana, including Gurugram, Manesar, Faridabad and Kundli. Delhi, Noida and Ghaziabad pay their own state's rates.",
        link: { href: "/minimum-wages/delhi", label: "Delhi rates" },
      },
      faqs: [
        {
          question: "Which level is a clerk, a driver or a peon?",
          answer: "The notification lists no jobs. The draft Haryana wage rules of May 2026 place clerks, typists, data entry operators, storekeepers and drivers under Skilled, accountants under Highly skilled, and peons, helpers and loaders under Unskilled. They apply once the rules are final.",
        },
        {
          question: "When does Haryana's rate change next?",
          answer: `Before 2026 Haryana revised its rates every January and July. The draft Code on Wages (Haryana) Rules, 2026 move the dearness allowance to 1 April and 1 October, but no revision had been published when we checked on ${formatDate(s.checked.on)}. When one is, we update this page.`,
        },
      ],
      labourDepartment: { href: "https://hrylabour.gov.in/", label: "Labour Department, Haryana" },
      band: "elsewhere",
    };
  },
  punjab: (s) => {
    const t = "all-employments";
    const u = rate(s, t, "punjab", "unskilled");
    const from = s.tables[0].effectiveFrom;
    return {
      title: (year) => `Punjab Minimum Wage${year ? ` ${year}` : ""}: ${formatRupees(u.daily ?? 0)}/day, ${formatRupees(u.monthly)}/month`,
      description: `Punjab minimum wage from ${formatShortDate(from)}: ${rs(s, t, "punjab", "unskilled")} a month (${formatRupees(u.daily ?? 0)} a day) unskilled, ${rs(s, t, "punjab", "semi-skilled")} semi-skilled, ${rs(s, t, "punjab", "skilled")} skilled, plus staff rates. ${stamp([s])}.`,
      answer: `From ${formatDate(from)}, unskilled work anywhere in Punjab pays at least ${formatRupees(u.monthly)} a month, or ${formatRupees(u.daily ?? 0)} a day. One rate covers the whole state.`,
      faqs: [
        {
          question: "Is there a separate rate for office staff?",
          answer: `Yes. Alongside the four skill levels, the notification sets four staff categories, from ${formatRupees(rate(s, "office-staff", "punjab", "staff-d").monthly)} a month for Class IV staff such as peons and attendants, including those supplied through a contractor, to ${formatRupees(rate(s, "office-staff", "punjab", "staff-a").monthly)} for postgraduates and professionals.`,
        },
        {
          question: "Can the rate be split into allowances?",
          answer: "No. The notification fixes these as basic rates and does not allow them to be split into allowances.",
        },
      ],
      labourDepartment: { href: "https://pblabour.gov.in/", label: "Labour Department, Punjab" },
      band: "punjab",
    };
  },
  karnataka: (s) => {
    const t = "most-employments";
    const u1 = rate(s, t, "zone-1", "unskilled");
    const u3 = rate(s, t, "zone-3", "unskilled");
    return {
      title: (year) => `Karnataka Minimum Wages${year ? ` ${year}` : ""}: Rates by Zone`,
      description: `Karnataka minimum wage from 22 May 2026, unskilled: ${formatRupees(u1.monthly)} a month in Bengaluru (Zone 1), ${formatRupees(u3.monthly)} in Zone 3, basic plus VDA. All skill levels. ${stamp([s])}.`,
      answer: `From 22 May 2026, unskilled work in Bengaluru city (Zone 1) pays at least ${formatRupees(u1.monthly)} a month, or ${formatRupees(u1.daily ?? 0)} a day, basic plus VDA. Zones 2 and 3 pay less.`,
      note: {
        text: "Zone 1 is the Greater Bengaluru Authority area. Industrial areas outside it, such as Bommasandra, Jigani and Attibele, are Zone 3 unless they fall in a city corporation or district headquarters.",
        link: { href: "/jobs/bengaluru", label: "Jobs in Bengaluru" },
      },
      faqs: [
        {
          question: "Is the new Karnataka minimum wage in force while it is challenged in court?",
          answer: "Yes. Employers have challenged the 22 May 2026 notification in the Karnataka High Court, but it has not been stayed: in September 2026 the court refused employers interim relief and stayed the circulars that had deferred the new rates. This page will change if the court rules otherwise.",
        },
        {
          question: "Is the VDA added on top of these rates?",
          answer: `Yes. The notification fixes basic rates by zone and skill, and a VDA of ${formatRupees(u1.vda)} a month payable from 22 May 2026. The Labour Department lists them separately; the figures above add them. The VDA is revised once a year, from 1 April.`,
        },
      ],
      labourDepartment: { href: "https://karmikaspandana.karnataka.gov.in/en", label: "Labour Department, Karnataka" },
      band: "bengaluru",
    };
  },
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
  title: (year: string | null) => `Minimum Wages${year ? ` ${year}` : ""} by State: Rates by Skill Level`,
  /** The oldest date across the states, so the line is true for every one of them. */
  description: () =>
    `Minimum wage rates for Delhi, Haryana, Punjab, UP and Uttarakhand by skill level, each with its notification number and effective date. ${stamp(wageStates)}.`,
  heading: (year: string | null) => (year ? `Minimum wages in ${year}, by state.` : "Minimum wages by state."),
  /**
   * The answer, first: the hero lede carries what the old one-question FAQ
   * and the "no national minimum wage" caption said (owner direction,
   * 17 Oct 2026: no filler on the hub).
   */
  lede: (lowest: string, highest: string) =>
    `Each state sets its own; there is no national rate. For unskilled work it runs from ${lowest} to ${highest}.`,
  /** What changed in the last revision, under the in-force date; none where nothing did. */
  lastChange: {
    uttarakhand: (s: WageState) => `VDA up to ${formatRupees(rate(s, "factories-and-industries", "uttarakhand", "unskilled").vda)}; DA for engineering units of 50+`,
    "uttar-pradesh": () => "Split into three district categories",
  } as Partial<Record<WageStateSlug, (s: WageState) => string>>,
};

type Door = { eyebrow: string; heading: string; text: string; link: LinkItem; external?: boolean };

/** The doors band at the foot of each wage page (PLAN §5.5): no phone. */
export const wageDoors = {
  /** Uttarakhand: the state's market, whose form also files Haridwar applicants under Haridwar. */
  jobs: {
    eyebrow: "LOOKING FOR WORK",
    heading: "Factory and warehouse jobs across Uttarakhand.",
    text: "Haridwar and the rest of the state. Full 8-hour shifts. There is no fee to apply.",
    link: { href: "/jobs/uttarakhand", label: "Jobs across Uttarakhand" },
  } satisfies Door,
  /** The hub covers several states, so its jobs door is the national jobs page, not one city's. */
  jobsAll: {
    eyebrow: "LOOKING FOR WORK",
    heading: "Factory and warehouse jobs.",
    text: "In Bengaluru, Haridwar, Jalandhar–Kapurthala, Punjab and Uttarakhand. Full 8-hour shifts. There is no fee to apply.",
    link: { href: "/jobs", label: "See jobs" },
  } satisfies Door,
  business: {
    eyebrow: "HIRING FOR A UNIT",
    heading: "Need a crew on your site?",
    text: "Tell us the work, the headcount and the shifts.",
    link: { href: "/contact", label: "Request a crew" },
  } satisfies Door,
  /** Karnataka: the Bengaluru worker list (no buyer hub there yet, so the business door stays neutral). */
  jobsBengaluru: {
    eyebrow: "LOOKING FOR WORK",
    heading: "Factory and warehouse work in Bengaluru.",
    text: "Join our worker list. Full 8-hour shifts. There is no fee.",
    link: { href: "/jobs/bengaluru", label: "Jobs in Bengaluru" },
  } satisfies Door,
  /** Punjab: the state's market, whose form also files Jalandhar–Kapurthala applicants there. */
  jobsPunjab: {
    eyebrow: "LOOKING FOR WORK",
    heading: "Factory and packing jobs across Punjab.",
    text: "Jalandhar, Kapurthala and the rest of the state. Full 8-hour shifts. There is no fee to apply.",
    link: { href: "/jobs/punjab", label: "Jobs across Punjab" },
  } satisfies Door,
  /**
   * UP and Delhi: the state's Labour Department as the official source, not
   * as a place to complain (owner direction, 17 Oct 2026: a complaint door
   * read to employers as if we might act against them).
   */
  officialSource: (name: string, department: LinkItem): Door => ({
    eyebrow: "OFFICIAL SOURCE",
    heading: `${name} Labour Department.`,
    text: "Notifications, registrations and forms, from the government itself.",
    link: department,
    external: true,
  }),
  /**
   * The crew door where a location page covers the state (Delhi NCR for UP
   * and Delhi, Bengaluru for Karnataka; owner confirmed supply there, 16 Oct
   * 2026), so an employer reading these rates lands on their own region.
   */
  crewIn: (region: string, text: string, href: string): Door => ({
    eyebrow: "FOR EMPLOYERS",
    heading: `Hiring in ${region}?`,
    text,
    link: { href, label: "Request a crew" },
  }),
  /** A neutral crew door, where no location page covers the state. */
  neutral: {
    eyebrow: "FOR EMPLOYERS",
    heading: "Hiring for a unit?",
    text: "Tell us where your site is, and we'll say plainly whether we can staff it.",
    link: { href: "/contact", label: "Request a crew" },
  } satisfies Door,
};
export type { Door as WageDoor };

/** Labels the wage page components use. */
export const wageUi = {
  minimumWages: "Minimum wages",
  stateHeading: (name: string, year: string | null) => `Minimum wages in ${name}${year ? `, ${year}` : ""}.`,
  /** The line under each H1: who checked and when, or the unsigned wording until someone signs off. */
  checked: (by: string | null, date: string) => (by ? `Checked ${date} by ${by}` : `Updated ${date}`),
  howWeCheck: "How we check",
  dues: {
    heading: (name: string) => `What employers owe in ${name}`,
    caption: (name: string) => `Who pays what for EPF, ESIC and the Labour Welfare Fund in ${name}`,
    what: "Who pays what",
    worker: "Worker",
    employer: "Employer",
    help: "Behind on any of this? The Vayasya Network of CAs, labour lawyers and compliance consultants can help.",
  },
  inLanguage: { hi: "In Hindi", kn: "In Kannada" } as Record<"hi" | "kn", string>,
  notice: {
    staleStrong: "These rates may have been revised.",
    staleText: "Check the latest notification.",
    staleLink: "Latest notifications from the state",
    many: (dates: string) => `Revisions due ${dates} not yet notified.`,
    one: (date: string) => `Revision due ${date} not yet notified.`,
  },
  table: {
    caption: (title: string, name: string, date: string) => `${title}: minimum wages in ${name} from ${date}, in rupees`,
    skill: "Skill",
    month: "Per month",
    day: "Per day",
    dayDerived: "Per day (÷ 26)",
    /** Under "Skill" in a zoned table: what the two figures in each cell are. */
    units: "a month, then a day",
    unitsDerived: "a month, then a day (÷ 26)",
    notSet: "Not set",
    breakdown: "Show breakdown",
    source: (date: string, kind: string, number: string) => `In force from ${date}. ${kind} ${number}.`,
    range: (from: string, to: string) => `${from} to ${to}`,
    which: "Where do you work?",
  },
  /** The full list of scheduled employments under the main tables (Uttarakhand). */
  schedule: {
    heading: "Every scheduled employment",
    intro: (name: string, count: number, vda: string, date: string) =>
      `${name} sets a minimum wage for ${count} kinds of work, each in its notification. Every figure below is the notification's basic wage plus the VDA of ${vda} from ${date}, a month.`,
    find: "Find your work",
    introOneRate: (name: string) => `${name}'s rates above cover every kind of work in this list, except the rows that show their own rates or say why none are shown.`,
    findHint: "For example hotel, bakery or school",
    noMatch: "Nothing matches. Try another word, or clear the box to see the full list.",
    only: (amount: string, unit?: string) => `${amount}${unit ? ` ${unit.toLowerCase()}` : ""}`,
    work: "Work",
    from: (amount: string, unit?: string) => `From ${amount}${unit ? ` ${unit.toLowerCase()}` : ""}`,
    allowance: (label: string, amount: string) => `${label} ${amount}`,
    inTable: "In the table above",
    notOnline: "Rates not online",
    seeTable: "These rates are in the table above:",
    unpublished: (number: string, date: string, vda: string) =>
      `The labour department cites notification ${number} of ${date} for this work but has not put it on its website; the 2019 notification it replaced is the one still listed there. The minimum is the basic wage in notification ${number} plus the VDA of ${vda}.`,
    notification: (number: string, date: string) => `Notification ${number} of ${date}`,
    perMonth: "A month",
    plusVda: (vda: string) => `Basic wage plus VDA of ${vda}.`,
    captionStated: (work: string, name: string, unit: string) => `${work}: minimum wages in ${name}, in rupees, ${unit.toLowerCase()}`,
    caption: (work: string, name: string, vda: string) => `${work}: minimum wages in ${name}, in rupees a month, basic wage plus VDA of ${vda}`,
  },
  sourceKind: (kind: "notification" | "order" | "corrigendum") => (kind === "notification" ? "Notification" : kind === "order" ? "Order" : "Amendment"),
  /** After a document we host: the link to where the state (or a third party) publishes it. */
  original: (host: string) => `Original on ${host}`,
  pdf: (hindi: boolean, size: string | null) => `PDF${hindi ? ", Hindi" : ""}${size ? `, ${size}` : ""}`,
  sections: {
    rates: (name: string) => `Pay rates in ${name}`,
    questions: "Questions",
    documents: "Sources",
    wageDocs: "Wage rates",
    duesDocs: "EPF, ESIC, welfare fund and licence",
  },
  hub: {
    state: "State",
    unskilled: "Unskilled",
    semiSkilled: "Semi-skilled",
    skilled: "Skilled",
    perMonth: "per month",
    inForce: "In force from",
    byCategory: "by district category",
    mayBeRevised: "may have been revised",
    checked: "Updated from each state's own notifications.",
    vda: "VDA revisions by state",
  },
};
