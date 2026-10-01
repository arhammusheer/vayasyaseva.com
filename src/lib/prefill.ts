/**
 * Form prefill from the link's fragment, e.g. /jobs#phone=98…&work=packing.
 * AI assistants build these links after asking the person conversationally
 * (see /llms.txt). The fragment never reaches the server, logs or analytics.
 * Values only fill fields: nothing is ticked or sent for the person.
 */
export const JOB_PREFILL_FIELDS = ["name", "phone", "work", "experience", "location", "start", "about"] as const;
export const ENQUIRY_PREFILL_FIELDS = [
  "name",
  "phone",
  "email",
  "company",
  "role",
  "location",
  "industry",
  "headcount",
  "shifts",
  "start",
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

/** "Label: value" lines for the values present, in the given order. */
export function labelledLines(values: Record<string, string | undefined>, labels: Record<string, string>) {
  return Object.entries(labels)
    .filter(([key]) => values[key])
    .map(([key, label]) => `${label}: ${values[key]}`);
}
