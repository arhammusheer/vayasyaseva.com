/**
 * Zod schema for the wage dataset, used by content:check (C8) and the
 * wage tests. Not imported by pages. Objects are strict: an unknown key
 * fails, so nothing unplanned slips into a public file.
 */
import { z } from "zod/v4";
import { WAGE_STATE_SLUGS } from "@/content/registry/identifiers";
import { SKILLS, dailyFromMonthly, type WageState } from "./index";

const isoDate = z.iso.date();
const rupees = z.number().nonnegative();
const skill = z.enum(Object.keys(SKILLS) as [keyof typeof SKILLS, ...(keyof typeof SKILLS)[]]);

const sourceSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(["notification", "order", "corrigendum"]),
  title: z.string().min(1),
  number: z.string().min(1),
  date: isoDate,
  authority: z.string().min(1),
  legalBasis: z.string().min(1).optional(),
  url: z.url({ protocol: /^https$/ }),
  listing: z.url({ protocol: /^https$/ }),
  language: z.enum(["en", "hi", "kn"]),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  sizeKb: z.number().int().positive().optional(),
  retrievedOn: isoDate,
});

const rateSchema = z.strictObject({
  zone: z.string().min(1),
  skill,
  basic: rupees,
  vda: rupees,
  monthly: rupees,
  daily: rupees.nullable(),
});

const tableSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  headline: z.literal(true).optional(),
  title: z.string().min(1),
  appliesTo: z.string().min(1),
  sources: z.array(z.string()).min(1),
  effectiveFrom: isoDate,
  zones: z.array(z.strictObject({ id: z.string().min(1), name: z.string().min(1), areas: z.string().min(1) })).min(1),
  daily: z.enum(["stated", "derived", "none"]),
  dailyRule: z.string().min(1).optional(),
  basicLabel: z.string().min(1),
  vdaLabel: z.string().min(1),
  vdaNote: z.string().min(1).optional(),
  rates: z.array(rateSchema).min(1),
});

const historySchema = z.strictObject({
  table: z.string().min(1),
  effectiveFrom: isoDate,
  effectiveTo: isoDate,
  source: z.string().min(1),
  note: z.string().min(1).optional(),
  rates: z.array(z.strictObject({ zone: z.string().optional(), skill, monthly: rupees, daily: rupees.optional() })).min(1),
});

export const wageStateSchema = z.strictObject({
  state: z.enum(WAGE_STATE_SLUGS),
  name: z.string().min(1),
  titleName: z.string().min(1),
  nextRevision: z.strictObject({ expected: isoDate, missed: z.array(isoDate).min(1).optional(), basis: z.string().min(1) }),
  checked: z.strictObject({ on: isoDate, by: z.strictObject({ name: z.string().min(1).optional(), role: z.string().min(1) }).optional() }),
  sources: z.array(sourceSchema).min(1),
  tables: z.array(tableSchema).min(1),
  history: z.array(historySchema),
  verification: z.array(z.string().min(1)).min(1),
});

/**
 * Integrity rules beyond the shape (C8): every reference resolves, every
 * monthly figure is basic + VDA, daily figures follow the table's rule,
 * nothing takes effect after the check, and every zone has every skill once.
 */
export function wageIntegrityProblems(state: WageState): string[] {
  const problems: string[] = [];
  const sourceIds = new Set(state.sources.map((s) => s.id));
  if (sourceIds.size !== state.sources.length) problems.push("duplicate source id");
  const tableIds = new Set(state.tables.map((t) => t.id));
  if (state.tables.filter((t) => t.headline).length !== 1) problems.push("exactly one table must be marked headline");
  // A new order entered without moving the next revision forward would show "not published" next to it.
  // Judged on the headline table: one table can move (Uttarakhand's
  // engineering DA from 1 October 2026) while the headline still awaits its
  // revision.
  const newest = (state.tables.find((t) => t.headline) ?? state.tables[0]).effectiveFrom;
  const { expected, missed = [] } = state.nextRevision;
  if (expected <= newest) problems.push(`nextRevision.expected ${expected} is not after the newest rates (${newest}); move it to the next revision date`);
  for (const date of missed) {
    if (date <= newest || date >= expected) problems.push(`nextRevision.missed ${date} must fall after the newest rates (${newest}) and before the expected revision (${expected})`);
  }
  if ([...missed].sort().join() !== missed.join()) problems.push("nextRevision.missed must be in date order");
  for (const table of state.tables) {
    const where = `table ${table.id}`;
    for (const id of table.sources) if (!sourceIds.has(id)) problems.push(`${where}: unknown source ${id}`);
    if (table.effectiveFrom > state.checked.on) problems.push(`${where}: effective ${table.effectiveFrom} is after the check (${state.checked.on})`);
    if (table.daily === "derived" && !table.dailyRule) problems.push(`${where}: derived daily rates need the state's rule (dailyRule)`);
    const zoneIds = new Set(table.zones.map((z) => z.id));
    const seen = new Set<string>();
    for (const rate of table.rates) {
      const label = `${where} ${rate.zone}/${rate.skill}`;
      if (!zoneIds.has(rate.zone)) problems.push(`${label}: unknown zone`);
      if (seen.has(`${rate.zone}/${rate.skill}`)) problems.push(`${label}: listed twice`);
      seen.add(`${rate.zone}/${rate.skill}`);
      if (rate.basic + rate.vda !== rate.monthly) problems.push(`${label}: basic ${rate.basic} + VDA ${rate.vda} is not ${rate.monthly}`);
      if (table.daily === "none" && rate.daily !== null) problems.push(`${label}: the table sets no daily rate`);
      if (table.daily !== "none" && rate.daily === null) problems.push(`${label}: daily rate missing`);
      if (table.daily === "derived" && rate.daily !== null && rate.daily !== dailyFromMonthly(rate.monthly)) {
        problems.push(`${label}: daily ${rate.daily} is not ${rate.monthly} / 26 rounded up (${dailyFromMonthly(rate.monthly)})`);
      }
      if (table.daily === "stated" && rate.daily !== null && Math.abs(rate.daily - rate.monthly / 26) > 1) {
        problems.push(`${label}: stated daily ${rate.daily} is far from ${rate.monthly} / 26; check the transcription`);
      }
    }
    const skills = new Set(table.rates.map((r) => r.skill));
    for (const zone of zoneIds) for (const s of skills) if (!seen.has(`${zone}/${s}`)) problems.push(`${where}: ${zone} has no ${s} rate`);
  }
  for (const h of state.history) {
    if (!tableIds.has(h.table)) problems.push(`history ${h.effectiveFrom}: unknown table ${h.table}`);
    if (!sourceIds.has(h.source)) problems.push(`history ${h.effectiveFrom}: unknown source ${h.source}`);
    if (h.effectiveTo < h.effectiveFrom) problems.push(`history ${h.effectiveFrom}: ends before it starts`);
  }
  for (const source of state.sources) {
    if (source.retrievedOn > state.checked.on) problems.push(`source ${source.id}: retrieved after the recorded check`);
  }
  return problems;
}
