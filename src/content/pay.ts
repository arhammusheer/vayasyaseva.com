/**
 * The day's pay a jobs page states ("₹600+ a day, including PF + ESI"),
 * worked out from the state's minimum wage (src/content/wages) and the
 * EPF and ESIC rules (src/content/contributions.ts), never typed in by hand,
 * so a wage revision moves the breakdown with it.
 *
 * Server-only: it reads the wage datasets, which must stay out of client
 * chunks (content:check C12). The jobs page renders it on the server.
 */
import { epf, esic } from "@/content/contributions";
import { getWageState, type Skill } from "@/content/wages";
import type { WageStateSlug } from "@/content/registry/identifiers";

/** The month the daily figures divide by: 26 working days. */
export const DAYS_IN_MONTH = 26;

export type PayBasis = { state: WageStateSlug; skill: Skill };

export type PayBreakdown = {
  /** The headline table's monthly minimum for the skill. */
  monthly: number;
  /** All per day, to the nearest rupee: the minimum wage, the employer's PF (EPF, EPS, EDLI, admin) and ESIC, their sum, the worker's own PF and ESIC, and what is left. */
  wage: number;
  employerPf: number;
  employerEsic: number;
  employer: number;
  total: number;
  workerShare: number;
  takeHome: number;
};

const day = (monthly: number) => monthly / DAYS_IN_MONTH;

export function payBreakdown({ state, skill }: PayBasis): PayBreakdown {
  const data = getWageState(state);
  const table = data?.tables.find((t) => t.headline);
  const rate = table?.rates.find((r) => r.skill === skill);
  if (!rate) throw new Error(`No ${skill} rate in the headline table of src/content/wages/${state}.json`);
  const monthly = rate.monthly;
  const pf = epf(monthly);
  const esi = esic(monthly);
  const wage = day(monthly);
  const employerPf = day(pf.employerCost);
  const employerEsic = day(esi.employer);
  const workerShare = day(pf.worker + esi.worker);
  // Rounded once each, from the exact daily amounts, so the lines add up as shown.
  const r = Math.round;
  return {
    monthly,
    wage: r(wage),
    employerPf: r(employerPf),
    employerEsic: r(employerEsic),
    employer: r(employerPf) + r(employerEsic),
    total: r(wage) + r(employerPf) + r(employerEsic),
    workerShare: r(workerShare),
    takeHome: r(wage) - r(workerShare),
  };
}
