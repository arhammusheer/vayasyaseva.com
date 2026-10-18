/**
 * Copy for /minimum-wages/vda: the VDA and DA revisions of the published
 * wage states. Every figure, date and status comes from the wage dataset
 * (src/content/wages), so the tracker moves when a state's file does. The
 * only facts typed here are each state's revision cycle in a few words,
 * restating `nextRevision.basis`; the full basis shows under each state.
 *
 * Reference voice (PLAN §5.5): short sentences, read by buyers and workers
 * alike, no phone, no agency words, nothing that implies we supply crews in
 * a state outside our markets.
 */
import type { WageStateSlug } from "@/content/registry/identifiers";
import { formatDate, formatMonth, formatRupees, headlineTable, unpublishedRevisions, type WageState } from "@/content/wages";

/** When each state's notification changes the allowance, in a few words (from `nextRevision.basis`). */
export const VDA_CYCLE: Record<WageStateSlug, string> = {
  uttarakhand: "1 April and 1 October",
  "uttar-pradesh": "1 April and 1 October",
  delhi: "1 April and 1 October",
  haryana: "1 April and 1 October, in draft rules",
  punjab: "Not yet set by the state",
  karnataka: "1 April each year",
};

/** The start of the half-year we are in: 1 April or 1 October. */
export function cycleStart(today: string) {
  const year = Number(today.slice(0, 4));
  const october = `${year}-10-01`;
  const april = `${year}-04-01`;
  return today >= october ? october : today >= april ? april : `${year - 1}-10-01`;
}

/** "A", "A and B", "A, B and C". */
export const listNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : (names[0] ?? ""));

/** The allowance in the headline table's unskilled rates: a range across zones, or null when none is notified. */
export function allowanceNow(state: WageState) {
  const table = headlineTable(state);
  const vdas = table.rates.filter((r) => r.skill === "unskilled").map((r) => r.vda).sort((a, b) => a - b);
  if (vdas.at(-1) === 0) return null;
  const [low, high] = [vdas[0], vdas.at(-1)!];
  return { table, text: low === high ? formatRupees(low) : `${formatRupees(low)} to ${formatRupees(high)}`, isDa: !/VDA/.test(table.vdaLabel) };
}

export type VdaStatus =
  | { kind: "due"; dates: string[] }
  | { kind: "revised"; from: string }
  | { kind: "next"; expected: string }
  | { kind: "unset" };

/**
 * Where the state stands today: a revision due and not published (the
 * missed ones too), new rates this half-year, or the next expected date.
 */
export function vdaStatus(state: WageState, today: string): VdaStatus {
  const due = unpublishedRevisions(state, today);
  if (due.length) return { kind: "due", dates: due };
  const from = headlineTable(state).effectiveFrom;
  if (from >= cycleStart(today)) return { kind: "revised", from };
  if (VDA_CYCLE[state.state].startsWith("Not yet")) return { kind: "unset" };
  return { kind: "next", expected: state.nextRevision.expected };
}

export const statusText = (s: VdaStatus) =>
  s.kind === "due"
    ? `Due ${listNames(s.dates.map(formatDate))}, not published`
    : s.kind === "revised"
      ? `Revised from ${formatDate(s.from)}`
      : s.kind === "unset"
        ? "Waiting for the state's rules"
        : `Next expected ${formatDate(s.expected)}`;

export const wageVdaCopy = {
  /** Before " | Vayasya Seva": at most 55 characters. */
  title: (year: string | null) => `Variable Dearness Allowance (VDA)${year ? ` ${year}` : ""}: State Tracker`,
  /** `stamp` is "Checked Oct 2026" once every state is signed off, else "Updated Oct 2026", as on the hub. */
  description: (names: string[], stamp: string) =>
    `VDA and DA revisions in ${listNames(names)}: the allowance in force, when it changed and what is still due. ${stamp}.`,
  breadcrumb: "VDA",
  heading: (cycle: string) => `VDA revisions by state, ${formatMonth(cycle)}.`,
  /** The answer first: who has published this half-year's revision and who has not. */
  lede: (cycle: string, revised: string[], due: string[]) => {
    const parts = [
      revised.length ? `${listNames(revised)} ${revised.length > 1 ? "have" : "has"} published new rates from ${formatDate(cycle)}.` : `No state here has published new rates from ${formatDate(cycle)} yet.`,
      due.length ? `${listNames(due)} ${due.length > 1 ? "have" : "has"} a revision due that is not yet published.` : "",
    ];
    return parts.filter(Boolean).join(" ");
  },
  table: {
    caption: "VDA or DA in force for unskilled work, by state, per month, in rupees",
    state: "State",
    allowance: "VDA or DA",
    perMonth: "unskilled, per month",
    since: "Rates in force from",
    cycle: "Revised on",
    status: "Status",
    none: "None notified",
    da: "DA",
  },
  explain: {
    heading: "What VDA is.",
    paragraphs: (withAllowance: string[], withDa: string[], allInclusive: string[]) =>
      [
        withAllowance.length
          ? `In ${listNames(withAllowance)}, the minimum wage is a basic rate plus a variable dearness allowance (VDA). The basic rate stays as the notification fixed it; the VDA moves with the consumer price index on the dates the notification sets.`
          : "",
        withDa.length
          ? `${listNames(withDa)} ${withDa.length > 1 ? "work" : "works"} the same way under another name: a dearness allowance (DA) added to the rate fixed in ${withDa.length > 1 ? "their" : "its"} base notification.`
          : "",
        allInclusive.length
          ? `${listNames(allInclusive)} now ${allInclusive.length > 1 ? "fix" : "fixes"} one basic rate with no allowance. Rises in the price index are to be passed on at intervals the state's rules will set; none had been notified when we last checked.`
          : "",
        "When a revision is due and the state has not published it, the last notified rates are still the latest ones. We mark the revision as due here and on the state's page, and update both when the order appears.",
      ].filter(Boolean),
  },
  moved: {
    heading: "How the rate moved.",
    intro: "Unskilled monthly rate at each revision, from the state's own orders.",
    summary: (name: string, count: number) => `${name}: ${count} ${count === 1 ? "rate" : "rates"}`,
    from: "In force from",
    rate: "Unskilled, per month",
    change: "Change",
    now: "now",
    basis: "Revision cycle",
  },
  faqs: (states: WageState[], today: string) => [
    {
      question: "Is VDA part of the minimum wage?",
      answer:
        "Yes. Where a state notifies a VDA, the minimum wage is the basic rate plus the VDA in force, and an employer pays the total. The rates on our state pages include it.",
    },
    {
      question: "When is the next VDA revision?",
      answer: states
        .map((s) => {
          const status = vdaStatus(s, today);
          if (status.kind === "due") return `${s.name}: due ${listNames(status.dates.map(formatDate))}, not yet published.`;
          if (status.kind === "unset") return `${s.name}: the state has not yet set its revision dates.`;
          return `${s.name}: ${formatDate(s.nextRevision.expected)}.`;
        })
        .join(" "),
    },
  ],
  links: { states: "All states", method: "How we check" },
};
