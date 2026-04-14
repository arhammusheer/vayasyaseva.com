"use client";

import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const emptySubscribe = () => () => {};
type LegacyMediaQueryList = {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};
type ModernMediaQueryList = {
  addEventListener?: (
    type: "change",
    listener: (event: MediaQueryListEvent) => void
  ) => void;
  removeEventListener?: (
    type: "change",
    listener: (event: MediaQueryListEvent) => void
  ) => void;
};

function getSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return emptySubscribe();
      }

      const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
      const modernMediaQuery = mediaQuery as MediaQueryList & ModernMediaQueryList;
      const legacyMediaQuery = mediaQuery as MediaQueryList & LegacyMediaQueryList;
      const handleChange = () => {
        onStoreChange();
      };

      if (typeof modernMediaQuery.addEventListener === "function") {
        modernMediaQuery.addEventListener("change", handleChange);

        return () => {
          modernMediaQuery.removeEventListener?.("change", handleChange);
        };
      }

      legacyMediaQuery.addListener?.(handleChange);

      return () => {
        legacyMediaQuery.removeListener?.(handleChange);
      };
    },
    getSnapshot,
    () => false
  );
}
