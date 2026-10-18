/**
 * Copy for /labour-welfare-fund: each state's Labour Welfare Fund, read from
 * the employer dues in src/content/statutory.ts (the same rows the wage
 * state pages show), so the two never disagree and every figure keeps its
 * cited source. Nothing about a state's fund is typed here.
 *
 * Reference voice: short sentences, read by employers and workers alike,
 * no phone, no agency words, nothing that implies we supply crews in a
 * state outside our markets.
 */
import type { WageStateSlug } from "@/content/registry/identifiers";
import { STATUTORY_CHECKED, employerDues, statutorySources, type Deadline, type DueRow } from "@/content/statutory";
import { formatShortMonth, getWageState } from "@/content/wages";

const LWF = "Labour Welfare Fund";

export type StateFund = {
  slug: WageStateSlug;
  name: string;
  row: DueRow;
  /** The due date from the state's strip; undefined if the strip has none. */
  due: Deadline | undefined;
  /** No regular contribution (the U.P. Act, also in force in Uttarakhand). */
  noContribution: boolean;
  sources: typeof statutorySources;
};

/** Every state with a Labour Welfare Fund row, alphabetical (no state first, 17 Oct 2026). */
export function stateFunds(): StateFund[] {
  return (Object.keys(employerDues) as WageStateSlug[])
    .map((slug): StateFund | null => {
      const dues = employerDues[slug]!;
      const row = dues.rows.find((r) => r.name === LWF);
      if (!row) return null;
      const due = dues.deadlines.find((d) => d.what.startsWith(LWF));
      const ids = new Set([...row.sources, ...(due?.sources ?? [])]);
      return {
        slug,
        name: getWageState(slug)?.name ?? slug,
        row,
        due,
        noContribution: row.worker === "Nothing",
        sources: statutorySources.filter((s) => ids.has(s.id)),
      };
    })
    .filter((f): f is StateFund => f !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : (names[0] ?? ""));

/** "Updated Oct 2026": the date the dues were checked against the documents. */
export const lwfStamp = () => `Updated ${formatShortMonth(STATUTORY_CHECKED)}`;

export const lwfCopy = {
  /** Before " | Vayasya Seva": at most 55 characters. */
  title: "Labour Welfare Fund (LWF) 2026: Contribution by State",
  description: (names: string[]) =>
    `LWF in ${list(names.map((n) => (n === "Uttar Pradesh" ? "UP" : n)))}: the worker's and employer's share, who it covers and the due date. ${lwfStamp()}.`,
  breadcrumb: "Labour Welfare Fund",
  heading: "Labour Welfare Fund contributions by state.",
  /** The answer first: each state runs its own fund, and two take no regular contribution. */
  lede: (names: string[], noContribution: string[]) =>
    `Each state runs its own fund, with its own rates, due dates and size threshold. ${
      noContribution.length ? `${list(noContribution)} take no regular contribution; the others do.` : ""
    }`.trim(),
  table: {
    caption: "Labour Welfare Fund by state: who it covers, the worker's and the employer's share, and when it is due",
    state: "State",
    covers: "Who it covers",
    worker: "Worker",
    employer: "Employer",
    due: "When it is due",
  },
  state: {
    heading: (name: string) => `Labour Welfare Fund in ${name}`,
    covers: "Who it covers",
    worker: "Worker pays",
    employer: "Employer pays",
    due: "When",
    sources: "From",
    wages: (name: string) => `Minimum wages in ${name}`,
    full: (name: string) => `Labour Welfare Fund in ${name}: examples, payment and penalties`,
  },
  faqs: (funds: StateFund[]) => {
    const none = funds.filter((f) => f.noContribution).map((f) => f.name);
    return [
      {
        question: "Is the Labour Welfare Fund the same as EPF or ESIC?",
        answer:
          "No. EPF and ESIC are national schemes with the same rates in every state. The Labour Welfare Fund is a state fund under the state's own Act, run by the state's Labour Welfare Board, and each state sets its own amounts and dates.",
      },
      ...(none.length
        ? [
            {
              question: `Do employers in ${list(none)} pay a Labour Welfare Fund contribution?`,
              answer: `No regular contribution. Under the U.P. Labour Welfare Fund Act, 1965, which also applies in Uttarakhand, units with 50 or more persons pay in the fines deducted from workers' wages and any wages still unpaid two years after they fell due, every quarter.`,
            },
          ]
        : []),
    ];
  },
  links: { compliance: "Compliance help", wages: "Minimum wages by state" },
};
