/**
 * Form prefill from the link's fragment, e.g. /jobs#name=…&phone=98….
 * AI assistants build these links after asking the person conversationally
 * (see /llms.txt). The fragment never reaches the server, logs or analytics.
 * Values only fill fields: nothing is ticked or sent for the person.
 */

/**
 * "Request a crew" (/contact). Ids as in contact.contract.json: roles
 * (comma-separated), headcount (a band such as 50-99, or a number), state
 * (ISO code such as UK, or the name), city, pincode, start, duration, shifts.
 * location takes a place id (a location page's placeId, e.g. peenya, kapurthala, haridwar) or
 * free text; cluster tags the page. Mapping: crewPrefill in crew-request.ts.
 */
export const ENQUIRY_PREFILL_FIELDS = [
  "name",
  "phone",
  "email",
  "company",
  "role",
  "roles",
  "headcount",
  "state",
  "city",
  "pincode",
  "location",
  "cluster",
  "start",
  "duration",
  "shifts",
  "industry",
  "details",
] as const;

const MAX_LENGTH = 2000;

export function readPrefill<K extends string>(fields: readonly K[]): Partial<Record<K, string>> | null {
  const hash = window.location.hash.slice(1);
  if (!hash.includes("=")) return null;
  const params = new URLSearchParams(hash);
  const values: Partial<Record<K, string>> = {};
  for (const key of fields) {
    const value = params.get(key)?.trim();
    if (value) values[key] = value.slice(0, MAX_LENGTH);
  }
  if (Object.keys(values).length === 0) return null;
  // Clear the details from the address bar so they aren't shared or bookmarked by accident.
  history.replaceState(history.state, "", window.location.pathname + window.location.search);
  return values;
}
