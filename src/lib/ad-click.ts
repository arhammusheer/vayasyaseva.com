"use client";

import type { AdClick } from "@/lib/talent-intake/contract";

/**
 * The Google Ads click a visit came from (gclid, or gbraid/wbraid from iOS),
 * read from the landing URL and kept in this browser tab (sessionStorage)
 * until a job application is sent with it. The server then reports the
 * conversion to Google Ads (src/lib/google-ads-conversions.ts). Not kept, and
 * not sent, after "Required Only".
 */
const KEY = "vayasya-ad-click";
const TYPES = ["gclid", "gbraid", "wbraid"] as const;
const VALID = /^[\w-]{10,300}$/;

/** "Required Only", now or under an earlier consent version. */
function refused() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("vayasya-site-measurement-v") && !key.endsWith("-at") && localStorage.getItem(key) === "rejected") return true;
    }
  } catch {
    return false;
  }
  return false;
}

/** On every page load: keep the click id if the URL carries one. */
export function rememberAdClick() {
  try {
    if (refused()) {
      sessionStorage.removeItem(KEY);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    for (const type of TYPES) {
      const id = params.get(type);
      if (id && VALID.test(id)) {
        sessionStorage.setItem(KEY, JSON.stringify({ type, id } satisfies AdClick));
        return;
      }
    }
  } catch {
    // Storage off: the conversion just isn't reported.
  }
}

/** The click to send with an application, if any. */
export function adClick(): AdClick | null {
  try {
    if (refused()) return null;
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as AdClick | null;
    return saved && TYPES.includes(saved.type) && VALID.test(saved.id) ? saved : null;
  } catch {
    return null;
  }
}
