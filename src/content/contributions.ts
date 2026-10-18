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

export const BONUS_ELIGIBLE_UP_TO = 21_000;
export const BONUS_CALCULATION_CEILING = 7_000;
/**
 * Statutory bonus for a full accounting year (Code on Wages s.26, with the
 * Central sphere's S.O. 4711(E) and 4710(E)): eligible on monthly wages up
 * to ₹21,000; above ₹7,000 a month it is worked out on ₹7,000 or the
 * minimum wage, whichever is higher; 8⅓% to 20%, and at least ₹100.
 */
export function bonus(wages: number, minimumWage: number, ratePct = 100 / 12, months = 12) {
  const w = Math.max(wages, 0);
  const eligible = w > 0 && w <= BONUS_ELIGIBLE_UP_TO;
  const base = w <= BONUS_CALCULATION_CEILING ? w : Math.max(BONUS_CALCULATION_CEILING, minimumWage);
  const yearWages = paise(base * months);
  const at = (pct: number) => Math.max(paise((yearWages * pct) / 100), months === 12 ? 100 : 0);
  const rate = Math.min(Math.max(ratePct, 100 / 12), 20);
  return { eligible, base, yearWages, minimum: eligible ? at(100 / 12) : 0, maximum: eligible ? at(20) : 0, atRate: eligible ? at(rate) : 0, rate };
}

export const GRATUITY_CEILING = 2_000_000;
export type GratuityExit = "regular" | "fixed-term" | "death";
/**
 * Gratuity on leaving (Code on Social Security s.53 and 54; Social Security
 * (Central) Rules r.33): 15 days' wages for each completed year, a part over
 * six months counting as a year, monthly wages ÷ 26 × 15; due after five
 * years of continuous service, after one year for a fixed-term worker, and
 * at any length of service on death or disablement; up to ₹20 lakh.
 */
export function gratuity(wages: number, years: number, months: number, exit: GratuityExit = "regular") {
  const y = Math.max(Math.floor(years), 0);
  const m = Math.min(Math.max(Math.floor(months), 0), 11);
  const counted = y + (m > 6 ? 1 : 0);
  const served = y + m / 12;
  const due = exit === "death" ? counted > 0 : exit === "fixed-term" ? served >= 1 : y >= 5;
  const perYear = paise((Math.max(wages, 0) / 26) * 15);
  // Rounded once, at the end: wages ÷ 26 × 15 × years.
  const uncapped = paise((Math.max(wages, 0) / 26) * 15 * counted);
  return { due, counted, perYear, uncapped, amount: due ? Math.min(uncapped, GRATUITY_CEILING) : 0, capped: due && uncapped > GRATUITY_CEILING };
}
