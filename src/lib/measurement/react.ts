"use client";
/** React bindings for the consent store. */
import { useSyncExternalStore } from "react";
import { allowed, consentSnapshot, serverConsentSnapshot, subscribeConsent, type ConsentSnapshot } from "./store";
import type { PurposeId } from "./purposes";

/** The banner's view of the stored choice: "loading" on the server and the first (hydrating) render. */
export function useConsent(): ConsentSnapshot["banner"] {
  return useSyncExternalStore(subscribeConsent, consentSnapshot, serverConsentSnapshot).banner;
}

/** Whether a purpose runs: false on the server and the first (hydrating) render. */
export function useAllowed(id: PurposeId): boolean {
  return useSyncExternalStore(subscribeConsent, () => allowed(id), () => false);
}
