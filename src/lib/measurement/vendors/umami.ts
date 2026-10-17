"use client";
/**
 * Umami in the browser (self-hosted, cookie-free; the tag is proxied
 * through /_t). The only file that touches window.umami.
 */
import type { AnalyticsParams } from "../types";

type UmamiPayload = Record<string, unknown>;
type Umami = {
  track: {
    (name: string, data?: AnalyticsParams): void;
    (props: (base: UmamiPayload) => UmamiPayload): void;
  };
  identify?: (data: AnalyticsParams) => void;
};

declare global {
  interface Window {
    umami?: Umami;
  }
}

// Calls made before the Umami script loads wait here; capped in case it never
// loads (blocked, or no website ID outside production).
const pending: ((umami: Umami) => void)[] = [];

function withUmami(call: (umami: Umami) => void) {
  if (window.umami) call(window.umami);
  else if (pending.length < 100) pending.push(call);
}

/** Run the calls queued before the Umami script loaded (the tag's onReady). */
export function flushUmami() {
  const umami = window.umami;
  if (!umami) return;
  for (const call of pending.splice(0)) {
    try {
      call(umami);
    } catch {
      // Analytics must never interrupt the visitor's task.
    }
  }
}

export const umamiTrack = (name: string, parameters?: AnalyticsParams) => withUmami((umami) => umami.track(name, parameters));

/** A page view with the URL given (AnalyticsTracker sanitises it). */
export const umamiPageView = (url: string) => withUmami((umami) => umami.track((base) => ({ ...base, url })));

export const umamiIdentify = (data: AnalyticsParams) => withUmami((umami) => umami.identify?.(data));
