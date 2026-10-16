/**
 * Masks identity numbers before anything is stored or shown to staff.
 * Aadhaar (12 digits, first 2-9, often grouped 4-4-4) keeps only its last
 * four digits; PAN is removed.
 */
export function maskIds(value: string): string {
  return value
    .replace(/\b([2-9]\d{3})[ -]?(\d{4})[ -]?(\d{4})\b/g, (_m, _a, _b, last: string) => `XXXX XXXX ${last}`)
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[PAN removed]");
}

export function maskDeep<T>(value: T): T {
  if (typeof value === "string") return maskIds(value) as T;
  if (Array.isArray(value)) return value.map(maskDeep) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskDeep(v)])) as T;
  }
  return value;
}
