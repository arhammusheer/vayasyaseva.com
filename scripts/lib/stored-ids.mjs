// Stored ids (src/content/registry/identifiers.ts: "Add values; never rename
// or remove one"). Each value below is also kept somewhere the code can't
// see: the talent database, Twenty, Umami events, search rankings, shared
// links. The lock (tests/fixtures/stored-ids.lock.json) records them; content
// check C2b fails when a locked value is gone and when a new one is not in
// the lock yet, so every change shows in review. Order is not locked:
// display order lives elsewhere (quick-apply.ts, MARKET_ORDER).
//   node scripts/content-check.mjs --update-stored-ids   (after an intended addition)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { importTs, root } from "./register-ts.mjs";

export const LOCK_PATH = join(root, "tests/fixtures/stored-ids.lock.json");

const keys = (o) => Object.keys(o);

/** Every stored list, by a stable name, as it stands in the code now. */
export async function currentStoredIds() {
  const ids = await importTs("src/content/registry/identifiers.ts");
  const rules = await importTs("src/lib/talent-intake/rules.ts");
  const { KNOWN_PLACES } = await importTs("src/lib/crew-request.ts");
  const { locationPages } = await importTs("src/content/locations/index.ts");
  const { ANSWER_OPTIONS } = await importTs("integrations/windmill/talent/lib/crm.ts");

  const lists = {
    "identifiers.LOCALE_TAGS": ids.LOCALE_TAGS,
    "identifiers.CLUSTER_IDS": ids.CLUSTER_IDS,
    "identifiers.PAGE_STATUSES": ids.PAGE_STATUSES,
    "identifiers.AUDIENCES": ids.AUDIENCES,
    "identifiers.WAGE_STATE_SLUGS": ids.WAGE_STATE_SLUGS,
    "identifiers.WAGE_STATE_CODES": keys(ids.WAGE_STATE_CODES).map((code) => `${code}=${ids.WAGE_STATE_CODES[code]}`),
    "identifiers.GUIDE_SLUGS": ids.GUIDE_SLUGS,
    "identifiers.LOCATION_CLUSTERS": keys(ids.LOCATION_ESTATES),
    "identifiers.HARIDWAR_AREA_IDS": ids.HARIDWAR_AREA_IDS,
    "identifiers.BENGALURU_AREA_IDS": ids.BENGALURU_AREA_IDS,
    "identifiers.JALANDHAR_AREA_IDS": ids.JALANDHAR_AREA_IDS,
    "identifiers.UTTARAKHAND_AREA_IDS": ids.UTTARAKHAND_AREA_IDS,
    "identifiers.PUNJAB_AREA_IDS": ids.PUNJAB_AREA_IDS,
    "identifiers.DEHRADUN_AREA_IDS": ids.DEHRADUN_AREA_IDS,
    "identifiers.KAPURTHALA_AREA_IDS": ids.KAPURTHALA_AREA_IDS,
    "identifiers.VISAKHAPATNAM_AREA_IDS": ids.VISAKHAPATNAM_AREA_IDS,
    "identifiers.ANDHRA_PRADESH_AREA_IDS": ids.ANDHRA_PRADESH_AREA_IDS,
    "identifiers.MARKET_AREA_IDS": ids.MARKET_AREA_IDS,
    "identifiers.REST_OF_STATE_AREA_IDS": ids.REST_OF_STATE_AREA_IDS,
    "rules.INTAKE_SOURCES": keys(rules.INTAKE_SOURCES),
    "rules.LEGACY_SOURCE_LOCALES": keys(rules.LEGACY_SOURCE_LOCALES),
    "rules.INTAKE_CHANNELS": rules.INTAKE_CHANNELS,
    "rules.JOB_ROLE_SLUGS": rules.JOB_ROLE_SLUGS,
    "rules.JOB_HUB_SLUGS": rules.JOB_HUB_SLUGS,
    "rules.INTAKE_FORM_KEYS": rules.INTAKE_FORM_KEYS,
    "rules.ATTACHMENT_KINDS": rules.ATTACHMENT_KINDS,
    // #location= ids in shared links and AI-agent prefills.
    "crew-request.KNOWN_PLACES": keys(KNOWN_PLACES),
    "locations.placeId": [...new Set([...locationPages.values()].map((p) => p.placeId))],
  };
  for (const [estatesOf, estates] of Object.entries(ids.LOCATION_ESTATES)) lists[`identifiers.LOCATION_ESTATES.${estatesOf}`] = estates;
  for (const [group, answers] of Object.entries(rules.QUICK_ANSWERS)) lists[`rules.QUICK_ANSWERS.${group}`] = keys(answers);
  // Twenty select option values, each with the answer id it stands for.
  for (const [group, options] of Object.entries(ANSWER_OPTIONS)) {
    lists[`crm.ANSWER_OPTIONS.${group}`] = Object.entries(options).map(([id, [value]]) => `${id}=${value}`);
  }
  return Object.fromEntries(Object.entries(lists).map(([name, values]) => [name, [...values]]));
}

export const readLock = () => JSON.parse(readFileSync(LOCK_PATH, "utf8"));

export function writeLock(current) {
  writeFileSync(LOCK_PATH, `${JSON.stringify(current, null, 2)}\n`);
}

/**
 * What differs between the lock and the code: a locked list or value that
 * is gone is an error (stored data would no longer match); a new list or
 * value is an error until it is added to the lock on purpose.
 */
export function lockProblems(locked, current) {
  const problems = [];
  for (const [name, values] of Object.entries(locked)) {
    const now = current[name];
    if (!now) {
      problems.push(`${name} is locked but no longer exists; stored ids are never removed`);
      continue;
    }
    for (const value of values) if (!now.includes(value)) problems.push(`${name}: "${value}" was removed or renamed; stored ids are append-only`);
  }
  for (const [name, values] of Object.entries(current)) {
    const was = locked[name] ?? [];
    const added = values.filter((v) => !was.includes(v));
    if (added.length) problems.push(`${name}: new ${added.map((v) => `"${v}"`).join(", ")} not in the lock; if intended, run node scripts/content-check.mjs --update-stored-ids`);
  }
  return problems;
}
