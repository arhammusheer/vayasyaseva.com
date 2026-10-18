/**
 * The contribution arithmetic behind the reference pages' calculators and
 * worked examples, one function per scheme, each following its document's
 * rule (cited on the page). Pure and dependency-free: the client
 * calculators import it, and tests/contributions.spec.mjs checks it against
 * the worked examples the documents themselves give.
 */

/** Nearest rupee, 50 paise and up to the next (EPF Scheme 2026, para 18(5)). */
const nearest = (x: number) => Math.floor(x + 0.5 + 1e-9);
/** Up to the next rupee (Social Security (Central) Rules 2026, rule 19). */
const up = (x: number) => Math.ceil(Number(x.toFixed(6)));
/** Two decimals, for amounts the documents do not round. */
const paise = (x: number) => Math.round(x * 100) / 100;

export const EPF_CEILING = 25_000;
/** EPF, EPS, EDLI and admin charges a month on one worker's PF wages. */
export function epf(wages: number, pensionMember = true) {
  const base = Math.min(Math.max(wages, 0), EPF_CEILING);
  const worker = nearest(base * 0.12);
  const employerTotal = nearest(base * 0.12);
  const eps = pensionMember ? nearest(base * 0.0833) : 0;
  const employerEpf = employerTotal - eps;
  const edli = nearest(base * 0.005);
  const admin = nearest(base * 0.005);
  return { base, capped: wages > EPF_CEILING, worker, eps, employerEpf, edli, admin, employerCost: employerTotal + edli + admin, total: worker + employerTotal + edli + admin };
}

export const ESIC_LIMIT = 21_000;
/** ESIC a month: both shares rounded up to the next rupee. */
export function esic(wages: number) {
  const w = Math.max(wages, 0);
  return { withinLimit: w <= ESIC_LIMIT, worker: up(w * 0.0075), employer: up(w * 0.0325), total: up(w * 0.0075) + up(w * 0.0325) };
}

export const HARYANA_LWF_CAP = 35;
/** Haryana Labour Welfare Fund a month: 0.2% up to the cap, the employer twice. */
export function haryanaLwf(wages: number) {
  const worker = paise(Math.min(Math.max(wages, 0) * 0.002, HARYANA_LWF_CAP));
  return { worker, employer: paise(worker * 2), month: paise(worker * 3), year: paise(worker * 3 * 12), capped: wages * 0.002 > HARYANA_LWF_CAP, capFrom: HARYANA_LWF_CAP / 0.002 };
}

/** Delhi Labour Welfare Fund for one half-year, by workers on the register. */
export function delhiLwf(workers: number) {
  const n = Math.max(Math.floor(workers), 0);
  return { workers: paise(n * 0.75), employer: paise(n * 2.25), deposit: paise(n * 3), government: paise(n * 1.5) };
}

export const KA_PT_FROM = 25_000;
/** Karnataka professional tax on one salary: a month, February, the year. */
export function karnatakaPt(salary: number) {
  const due = salary >= KA_PT_FROM;
  return { due, month: due ? 200 : 0, february: due ? 300 : 0, year: due ? 2500 : 0 };
}
