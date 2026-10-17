// The privacy notice's retention periods against the retention registry
// (src/lib/measurement/retention.ts): every day, month and year count in
// src/content/privacy.ts must be a period some store declares, each declared
// period must still be in the notice, and each period must match the store's
// day count. Run by scripts/content-check.mjs (C14); standalone:
//   node scripts/check-privacy-retention.mjs
import { pathToFileURL } from "node:url";
import { importTs } from "./lib/register-ts.mjs";

const WORDS = { one: 1, two: 2, three: 3 };
const PERIOD = /\b(\d+|one|two|three)\s+(days?|months?|years?)\b/gi;

/** "30 days" → 30, "12 months" → 365, "one year" → 365. */
export function periodDays(phrase) {
  const [, n, unit] = /^(\S+)\s+(\S+)$/.exec(phrase.toLowerCase()) ?? [];
  const count = WORDS[n] ?? Number(n);
  if (unit.startsWith("day")) return count;
  if (unit.startsWith("month")) return Math.round((count * 365) / 12);
  return count * 365;
}

const normalise = (phrase) => phrase.toLowerCase().replace(/\s+/g, " ").replace(/^(one|two|three) years$/, "$1 year");

export async function privacyRetentionProblems() {
  const { privacyContent, analyticsSummary } = await importTs("src/content/privacy.ts");
  const { RETENTION } = await importTs("src/lib/measurement/retention.ts");
  const { CONSENT_MAX_AGE_DAYS } = await importTs("src/lib/measurement/policy.ts");
  const text = [privacyContent, ...analyticsSummary.flatMap((row) => [row.what, row.when, row.gets])].join("\n");
  const inNotice = new Set([...text.matchAll(PERIOD)].map((m) => normalise(m[0])));
  const declared = new Map();
  for (const store of RETENTION) if (store.notice) declared.set(normalise(store.notice), [...(declared.get(normalise(store.notice)) ?? []), store]);

  const problems = [];
  for (const phrase of inNotice) {
    if (!declared.has(phrase)) problems.push(`privacy.ts says "${phrase}", which no store in src/lib/measurement/retention.ts declares`);
  }
  for (const [phrase, stores] of declared) {
    if (!inNotice.has(phrase)) problems.push(`${stores.map((s) => s.id).join(", ")} declare "${phrase}", which privacy.ts no longer says`);
    for (const store of stores) {
      if (store.days !== periodDays(phrase)) problems.push(`${store.id}: notice says "${phrase}" (${periodDays(phrase)} days) but the store keeps ${store.days} days`);
    }
  }
  const consent = RETENTION.find((s) => s.id === "consent-choice");
  if (consent?.days !== CONSENT_MAX_AGE_DAYS) problems.push(`consent-choice keeps ${consent?.days} days but policy.ts expires Allow All after ${CONSENT_MAX_AGE_DAYS}`);
  return { problems, periods: [...inNotice].sort() };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { problems, periods } = await privacyRetentionProblems();
  if (problems.length) {
    console.error(`Privacy retention check failed:\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  console.log(`Privacy retention check passed: ${periods.join(", ")} match the retention registry`);
}
