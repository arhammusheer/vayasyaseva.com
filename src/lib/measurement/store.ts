"use client";
/**
 * The consent choice in this browser. Layer 2: reads and writes the same
 * localStorage keys as before (vayasya-site-measurement-v8 and -v8-at),
 * turns them into a policy.ts ConsentState, and tells subscribers (this tab
 * and others) when it changes.
 *
 * Kept exactly as it was (owner follow-ups in the 1C PR): blocked storage
 * reads as no answer; the legacy reader counts "Required Only" under any
 * consent version for the ad-click report; another tab's withdrawal is seen
 * through the storage event but scripts already loaded keep running until
 * this tab reloads.
 */
import { measurementEnv } from "./config";
import { track } from "./gateway";
import { CONSENT_VERSION } from "./version";
import { bannerState, blockedState, decide, type BannerState, type ConsentState } from "./policy";
import type { PurposeId } from "./purposes";

const KEY_PREFIX = "vayasya-site-measurement-v";
export const CONSENT_KEY = `${KEY_PREFIX}${CONSENT_VERSION}`;
export const CONSENT_AT_KEY = `${CONSENT_KEY}-at`;
/** This tab's own changes (the storage event covers other tabs). */
const CONSENT_EVENT = "vayasya:analytics-consent";
/** Opens the banner again (the footer's "Privacy choices"). */
export const PREFERENCES_EVENT = "vayasya:analytics-preferences";

/** "Required Only", now or under an earlier consent version (any vayasya-site-measurement-v* key). */
function legacyRefused() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(KEY_PREFIX) && !key.endsWith("-at") && localStorage.getItem(key) === "rejected") return true;
    }
  } catch {
    return false;
  }
  return false;
}

/** The stored state, read now (never cached: expiry depends on the clock). */
export function readConsent(): ConsentState {
  const now = Date.now();
  let state: ConsentState;
  try {
    const at = Number(localStorage.getItem(CONSENT_AT_KEY));
    state = { blocked: false, choice: localStorage.getItem(CONSENT_KEY), at, legacyRefused: false, now };
  } catch {
    state = blockedState(now);
  }
  state.legacyRefused = legacyRefused();
  return state;
}

/** Whether a purpose runs in this build with the choice stored now. */
export const allowed = (id: PurposeId) => decide(id, readConsent(), measurementEnv);

export type ConsentSnapshot = { banner: BannerState | "loading"; legacyRefused: boolean };
const LOADING: ConsentSnapshot = Object.freeze({ banner: "loading", legacyRefused: false });
let last: ConsentSnapshot = LOADING;

/** The banner's view, memoised so useSyncExternalStore sees one object per state. */
export function consentSnapshot(): ConsentSnapshot {
  const state = readConsent();
  const banner = bannerState(state);
  if (last.banner !== banner || last.legacyRefused !== state.legacyRefused) last = Object.freeze({ banner, legacyRefused: state.legacyRefused });
  return last;
}

/** On the server and before hydration: nothing known yet. */
export const serverConsentSnapshot = () => LOADING;

export function subscribeConsent(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_EVENT, callback);
  };
}

/**
 * Store a banner choice. `current` is what the banner showed. The choice
 * events go out first (so they follow the old choice), then the keys are
 * written; going from "Allow All" to "Required Only" reloads the page to
 * stop scripts already running. "failed" when storage is blocked: nothing
 * changes, and the banner stays open.
 */
export function setChoice(next: "accepted" | "rejected", current: BannerState): "saved" | "reloading" | "failed" {
  const from = current === "accepted" ? "allow_all" : current === "rejected" ? "required_only" : "none";
  track("consent_choice", { choice: next, from });
  // One event per choice too: Umami funnel steps match event names, not properties.
  track(next === "accepted" ? "consent_allow_all" : "consent_required_only", { from });
  try {
    localStorage.setItem(CONSENT_KEY, next);
    if (next === "accepted") {
      localStorage.setItem(CONSENT_AT_KEY, String(Date.now()));
    } else {
      localStorage.removeItem(CONSENT_AT_KEY);
    }
  } catch {
    return "failed";
  }
  if (current === "accepted" && next === "rejected") {
    window.location.reload();
    return "reloading";
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
  return "saved";
}

/** Open the banner again. */
export const openPreferences = () => window.dispatchEvent(new Event(PREFERENCES_EVENT));
