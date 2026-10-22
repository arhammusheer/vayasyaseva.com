/**
 * The language picker's orders (PLAN §6.4), moved from
 * src/lib/language-rank.ts so the visitor-context tables (src/context) and
 * the proxy read one copy. Data only; no imports but types.
 */
import type { LanguageSetName } from "./data";

/**
 * Picker orders per set. Karnataka puts ಕನ್ನಡ first (published 17 Oct
 * 2026), then English · Hinglish · हिंदी. Punjab puts ਪੰਜਾਬੀ first (owner
 * direction, 17 Oct 2026), then PLAN §6.4's Punjab order: Hinglish ·
 * English · हिंदी (workers from the Hindi belt read Hinglish). Maharashtra
 * gets a set only if it is promoted (with mr-IN).
 */
export const LANGUAGE_SETS = {
  // Andhra Pradesh (22 Oct 2026): English first, then Hinglish and Hindi for
  // workers from the Hindi belt. No Telugu until it is a site language.
  andhra: ["en-IN", "hi-Latn-IN", "hi-IN"],
  hindi: ["hi-IN", "hi-Latn-IN", "en-IN"],
  karnataka: ["kn-IN", "en-IN", "hi-Latn-IN", "hi-IN"],
  punjab: ["pa-IN", "hi-Latn-IN", "en-IN", "hi-IN"],
  default: ["en-IN", "hi-IN", "hi-Latn-IN"],
} as const satisfies Record<LanguageSetName | "default", readonly string[]>;
export type LanguageSet = keyof typeof LANGUAGE_SETS;

/**
 * ISO 3166-2:IN subdivision codes (without "IN-", current codes; UT is read
 * as UK by canonicalRegion). Chhattisgarh CG/CT is listed both ways.
 */
export const STATE_LANGUAGE_SETS: Readonly<Record<string, LanguageSetName>> = {
  UK: "hindi", UP: "hindi", DL: "hindi", HR: "hindi", RJ: "hindi", MP: "hindi",
  BR: "hindi", JH: "hindi", CG: "hindi", CT: "hindi", HP: "hindi", CH: "hindi",
  KA: "karnataka",
  PB: "punjab",
  AP: "andhra",
};

/**
 * A language that hints at a market when a phone lists it or the picker
 * chose it (visitor context, ambient family). Hindi and English hint at
 * none: Indian phones list them whatever the person reads.
 */
export const LANGUAGE_MARKET_HINTS: Readonly<Record<string, string>> = {
  "kn-IN": "bengaluru",
  "pa-IN": "punjab",
};
