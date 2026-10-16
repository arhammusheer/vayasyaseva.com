/**
 * The minimum wage dataset (PLAN §5.5): one JSON file per state, entered by
 * hand from the state's own notification. `checked.by` is set only once a
 * named person at VSPL has signed the figures off against the documents.
 * Every figure traces to a source in the same file, and `verification`
 * records what was read and how. Setu can read these files later.
 *
 * content:check (C8) validates every file against ./schema.ts. Keep this
 * module free of heavy imports: pages, scripts and tests read it.
 */
import type { WageStateSlug } from "@/content/registry/identifiers";
import delhi from "./delhi.json" with { type: "json" };
import haryana from "./haryana.json" with { type: "json" };
import karnataka from "./karnataka.json" with { type: "json" };
import punjab from "./punjab.json" with { type: "json" };
import uttarPradesh from "./uttar-pradesh.json" with { type: "json" };
import uttarakhand from "./uttarakhand.json" with { type: "json" };

export const SKILLS = {
  unskilled: "Unskilled",
  "semi-skilled": "Semi-skilled",
  skilled: "Skilled",
  "highly-skilled": "Highly skilled",
  "clerical-non-matric": "Clerical: below matriculation",
  "clerical-matric": "Clerical: matriculate, not graduate",
  "clerical-graduate": "Clerical: graduate and above",
  "clerical-grade-1": "Clerical grade I",
  "clerical-grade-2": "Clerical grade II",
} as const;
export type Skill = keyof typeof SKILLS;

export type WageSource = {
  id: string;
  kind: "notification" | "order" | "corrigendum";
  title: string;
  number: string;
  /** ISO date the instrument was issued. */
  date: string;
  authority: string;
  legalBasis?: string;
  url: string;
  /** The department page that lists the document. */
  listing: string;
  language: "en" | "hi" | "kn";
  /** SHA-256 of the file as retrieved, for the daily source monitor. */
  sha256: string;
  /** File size, shown in the link text so data-conscious readers know before they tap. */
  sizeKb?: number;
  retrievedOn: string;
};

export type WageRate = {
  zone: string;
  skill: Skill;
  basic: number;
  vda: number;
  monthly: number;
  /** Per day; null where the instrument sets no daily rate. */
  daily: number | null;
};

export type WageTable = {
  id: string;
  /** The table behind the page's headline rate (lede, facts strip, hub row). Exactly one per state. */
  headline?: boolean;
  title: string;
  appliesTo: string;
  /** Source ids; the first is the instrument that fixes the rates. */
  sources: string[];
  effectiveFrom: string;
  zones: { id: string; name: string; areas: string }[];
  /** stated: the daily rate is in the instrument; derived: monthly / 26 by the state's rule; none: not set. */
  daily: "stated" | "derived" | "none";
  dailyRule?: string;
  basicLabel: string;
  vdaLabel: string;
  vdaNote?: string;
  rates: WageRate[];
};

export type WageHistory = {
  table: string;
  effectiveFrom: string;
  effectiveTo: string;
  source: string;
  note?: string;
  rates: { zone?: string; skill: Skill; monthly: number; daily?: number }[];
};

export type WageState = {
  state: WageStateSlug;
  name: string;
  /** The name as people search it, used in the page title ("UP"). */
  titleName: string;
  /** expected: the next revision date; missed: earlier revision dates the state has not published. */
  nextRevision: { expected: string; missed?: string[]; basis: string };
  /**
   * on: the last check of the state's own sources. by: the person who signed
   * the figures off against the documents; absent until someone has.
   */
  checked: { on: string; by?: { name?: string; role: string } };
  sources: WageSource[];
  tables: WageTable[];
  history: WageHistory[];
  /** What was read, how, and what it said. Not rendered; kept for review. */
  verification: string[];
};

/** Hub order: home state first, then the NCR neighbours, then the rest. */
export const wageStates = [uttarakhand, uttarPradesh, delhi, haryana, punjab, karnataka] as unknown as readonly WageState[];

export function getWageState(slug: string): WageState | undefined {
  return wageStates.find((s) => s.state === slug);
}

export function sourceById(state: WageState, id: string): WageSource {
  const source = state.sources.find((s) => s.id === id);
  if (!source) throw new Error(`${state.state}: unknown wage source ${id}`);
  return source;
}

/**
 * One flat record per rate with everything PLAN §5.5 asks of it: zone,
 * skill, monthly and daily, basic and VDA, notification number, date,
 * authority, source URL, effective date, next expected revision, checked on.
 */
export function wageRecords(state: WageState) {
  return state.tables.flatMap((table) => {
    const source = sourceById(state, table.sources[0]);
    return table.rates.map((rate) => ({
      state: state.state,
      table: table.id,
      zone: table.zones.find((z) => z.id === rate.zone)?.name ?? rate.zone,
      skill: rate.skill,
      monthly: rate.monthly,
      daily: rate.daily,
      basic: rate.basic,
      vda: rate.vda,
      notificationNumber: source.number,
      notificationDate: source.date,
      authority: source.authority,
      sourceUrl: source.url,
      effectiveFrom: table.effectiveFrom,
      nextRevisionExpected: state.nextRevision.expected,
      checkedOn: state.checked.on,
    }));
  });
}

/** Daily rate from a monthly one under a "no less than 1/26" rule, rounded up to the paisa. */
export const dailyFromMonthly = (monthly: number) => Math.ceil((monthly * 100) / 26) / 100;

const DAY = 86_400_000;
const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
export const todayIso = (now = new Date()) => now.toISOString().slice(0, 10);

/** How long past the expected revision (or the last check after it) a page stays current. */
export const STALE_AFTER_DAYS = 14;

/**
 * The staleness rule (PLAN §5.5): more than 14 days past the expected
 * revision with no newer check recorded. A check made after the expected
 * date counts as newer and keeps the page current for another 14 days,
 * so the daily monitor (or the updater) has to keep confirming that
 * nothing new was published.
 */
export function wageStatus(state: WageState, today = todayIso()) {
  const { expected } = state.nextRevision;
  const lastCheck = state.checked.on;
  const staleFrom = addDays(lastCheck > expected ? lastCheck : expected, STALE_AFTER_DAYS + 1);
  return {
    /** The revision date has passed (a newer notification may be due or late). */
    revisionDue: today >= expected,
    /** The page shows the "may have been revised" notice and drops the year from its title. */
    stale: today >= staleFrom,
    staleFrom,
  };
}

/** The year the rates were last confirmed in force; only on pages that are not stale. */
export const ratesYear = (state: WageState) => state.checked.on.slice(0, 4);

const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const formatDate = (iso: string) => longDate.format(parse(iso));
export const formatShortDate = (iso: string) => shortDate.format(parse(iso));
export const formatMonth = (iso: string) => monthYear.format(parse(iso));
const shortMonthYear = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
/** "Oct 2026": for meta descriptions, where every character counts. */
export const formatShortMonth = (iso: string) => shortMonthYear.format(parse(iso));

const rupees = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const paise = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
/** ₹13,690 or ₹526.54: whole rupees without decimals, paise with two digits. */
export const formatRupees = (value: number) => `₹${Number.isInteger(value) ? rupees.format(value) : paise.format(value)}`;

/**
 * Who signed the figures off: "<name>, <role>", or "a director of Vayasya
 * Seva" from the role alone. Null until someone has, and then the page says
 * only what is true: the figures were entered from the state's documents.
 */
export const checkedByLine = (state: WageState) => {
  const by = state.checked.by;
  if (!by) return null;
  return by.name ? `${by.name}, ${by.role}` : `a ${by.role.toLowerCase()} of Vayasya Seva`;
};

/** The table marked `headline` (validated: exactly one per state). */
export const headlineTable = (state: WageState) => state.tables.find((t) => t.headline) ?? state.tables[0];

/**
 * The headline unskilled rate: from the headline table only, lowest and
 * highest across its zones (equal where the state has one zone). It is the
 * rate for the employments that table covers, not a state-wide floor.
 */
export function headlineRate(state: WageState) {
  const table = headlineTable(state);
  const rows = table.rates.filter((r) => r.skill === "unskilled").sort((a, b) => a.monthly - b.monthly);
  return { table, low: rows[0], high: rows.at(-1)! };
}

/** "₹13,018", or "₹12,356 to ₹13,690" where the headline table has zones. */
export const headlineRange = (state: WageState) => {
  const { low, high } = headlineRate(state);
  return low.monthly === high.monthly ? formatRupees(low.monthly) : `${formatRupees(low.monthly)} to ${formatRupees(high.monthly)}`;
};

/** "751 KB" or "2.3 MB". */
export const formatSize = (kb: number) => (kb < 1000 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`);

/** Revisions the state has not published, oldest first: the missed ones, plus the expected one once it has passed. */
export function unpublishedRevisions(state: WageState, today = todayIso()) {
  const { expected, missed = [] } = state.nextRevision;
  return [...missed, ...(today >= expected ? [expected] : [])];
}
