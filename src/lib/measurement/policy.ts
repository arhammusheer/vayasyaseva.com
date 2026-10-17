/**
 * What each purpose may do in a given consent state. Layer 1 (pure): the
 * state is plain data that store.ts reads from the browser and server.ts
 * rebuilds from what the browser sent, so the rules are the same on both
 * sides and can be tested in node.
 *
 * These are today's rules, kept exactly (owner follow-ups in the 1C PR):
 *   - "Allow All" counts only when stored as "accepted" with a finite
 *     acceptance time that is > 0, not in the future and under 180 days old;
 *   - the banner shows "rejected" whenever the current key says so, and
 *     treats an expired or undated acceptance as no answer;
 *   - blocked storage reads as no answer: opt-in purposes fail closed, the
 *     ad-click report fails open;
 *   - the ad-click report is refused by "Required Only" under ANY consent
 *     version (legacyRefused), even after a later "Allow All".
 */
import type { MeasurementEnv } from "./config";
import { CONSENT_MODE_SIGNALS, PURPOSES, purpose, type ConsentModeSignal, type PurposeId } from "./purposes";

/** An "Allow All" choice stops counting after this long. */
export const CONSENT_MAX_AGE_DAYS = 180;
const CONSENT_MAX_AGE_MS = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

/** What the browser holds, as read by store.ts (or rebuilt by server.ts). */
export type ConsentState = {
  /** localStorage threw: nothing could be read. */
  blocked: boolean;
  /** The current version's key, as stored (any string, or null). */
  choice: string | null;
  /** Number(the "-at" key): 0 when missing, NaN when not a number. */
  at: number;
  /** Some consent key of any version, the current one included, says "rejected". */
  legacyRefused: boolean;
  now: number;
};

/** What the banner shows: a choice, or null for "ask". */
export type BannerState = "accepted" | "rejected" | null;

/** The state of a browser whose storage is blocked. */
export const blockedState = (now: number): ConsentState => ({ blocked: true, choice: null, at: 0, legacyRefused: false, now });

/** A current, valid "Allow All". */
export function hasValidAcceptance(state: ConsentState) {
  if (state.blocked) return false;
  const { at, now } = state;
  return state.choice === "accepted" && Number.isFinite(at) && at > 0 && at <= now && now - at < CONSENT_MAX_AGE_MS;
}

export function bannerState(state: ConsentState): BannerState {
  if (state.blocked) return null;
  if (state.choice === "rejected") return "rejected";
  return hasValidAcceptance(state) ? "accepted" : null;
}

/** Whether a purpose's basis allows it in this state, ignoring the build. */
export function consentAllows(id: PurposeId, state: ConsentState) {
  const { basis } = purpose(id);
  if (basis === "always") return true;
  // Blocked storage reads as not refused (legacyRefused false): fails open.
  if (basis === "unless-refused") return !state.legacyRefused;
  return hasValidAcceptance(state);
}

/** Whether a purpose runs: the build can run it and the consent state allows it. */
export function decide(id: PurposeId, state: ConsentState, env: MeasurementEnv) {
  return purpose(id).enabled(env) && consentAllows(id, state);
}

/**
 * The Consent Mode default the Google tag starts with. The tag loads only
 * when ga4 is allowed, so in practice this is the "Allow All" state: each
 * signal granted when an allowed purpose needs it; ad_personalization
 * belongs to no purpose, so it is always denied.
 */
export function googleConsentDefault(allowed: (id: PurposeId) => boolean): Record<ConsentModeSignal, "granted" | "denied"> {
  const granted = new Set(PURPOSES.filter((p) => allowed(p.id)).flatMap((p) => p.consentModeSignals));
  return Object.fromEntries(CONSENT_MODE_SIGNALS.map((s) => [s, granted.has(s) ? "granted" : "denied"])) as Record<ConsentModeSignal, "granted" | "denied">;
}

/** The consent block of the Data Manager conversion upload (google-ads-conversions.ts). */
export function dataManagerConsent() {
  // Measurement only: never used for ad personalisation. adUserData is not
  // sent today (owner follow-up).
  return { adPersonalization: "CONSENT_DENIED" } as const;
}

/** What the browser sends with a job application, so the server can decide the ad-click report. */
export type MeasurementClaim = { v: number; choice: "all" | "required" | "none"; legacyRefused: boolean };

export function claimOf(state: ConsentState, version: number): MeasurementClaim {
  const shown = bannerState(state);
  return { v: version, choice: shown === "accepted" ? "all" : shown === "rejected" ? "required" : "none", legacyRefused: state.legacyRefused };
}

/** The state a claim stands for, as far as the server's decisions need it. */
export function stateOfClaim(claim: MeasurementClaim, now: number): ConsentState {
  return {
    blocked: false,
    choice: claim.choice === "all" ? "accepted" : claim.choice === "required" ? "rejected" : null,
    at: claim.choice === "all" ? now : 0,
    legacyRefused: claim.legacyRefused || claim.choice === "required",
    now,
  };
}
