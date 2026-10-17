/**
 * The consent fingerprint (ledger.ts): SHA-256 over the canonical JSON of
 * the purpose registry's behaviour fields and the banner copy. Node only
 * (node:crypto): tests and scripts import it, the site never does.
 */
import { createHash } from "node:crypto";
import { BANNER } from "./copy";
import { PURPOSES } from "./purposes";

/** JSON with object keys sorted at every level, so key order never changes the hash. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined && typeof v !== "function");
    return `{${entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** The fields that change what is measured or what the visitor is told in the banner. */
export function fingerprintInput() {
  return {
    purposes: PURPOSES.map(({ id, basis, vendors, side, since, data, storage, consentModeSignals }) => ({ id, basis, vendors, side, since, data, storage, consentModeSignals })),
    banner: BANNER,
  };
}

export const consentFingerprint = () => createHash("sha256").update(canonicalJson(fingerprintInput())).digest("hex");
