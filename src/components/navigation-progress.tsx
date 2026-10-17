"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** A click that has not navigated by then shows the bar; quicker ones never do. */
const SHOW_AFTER_MS = 120;
/** A navigation that never lands (offline, an error) stops showing after this. */
const GIVE_UP_MS = 10_000;

/**
 * A thin gold bar along the top of the window while a link click is
 * loading, so a slow navigation reads as "loading" and not as a click that
 * missed (performance audit, 18 Oct 2026: readers clicked twice, or opened
 * links in new tabs, when nothing seemed to happen).
 *
 * It follows plain clicks on same-site links that open in this tab, and
 * clears when the path changes. next/link cancels every click it routes, so
 * a cancelled click still counts; a handler that keeps the reader on the
 * page (Apply scrolling to the form) cancels it with stayOnPage instead.
 * Links to the current path (a query or #hash change) are left alone.
 * One in each root layout.
 */
const STAY = Symbol("stay-on-page");

/** Cancels a link click that does not navigate, so the bar does not show. */
export function stayOnPage(event: { preventDefault(): void; nativeEvent: Event }) {
  event.preventDefault();
  (event.nativeEvent as Event & { [STAY]?: true })[STAY] = true;
}

export function NavigationProgress() {
  const pathname = usePathname();
  // The path a slow click is leaving, while the bar shows.
  const [leaving, setLeaving] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  // Loading until the path changes; then the bar fills and fades.
  const state = leaving === null ? "idle" : leaving === pathname ? "loading" : "done";

  useEffect(() => {
    const clear = () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
    const onClick = (event: MouseEvent) => {
      if ((event as MouseEvent & { [STAY]?: true })[STAY] || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;
      const url = new URL(link.href, window.location.href);
      const from = window.location.pathname;
      if (url.origin !== window.location.origin || url.pathname === from) return;
      clear();
      setLeaving(null);
      timers.current.push(
        window.setTimeout(() => window.location.pathname === from && setLeaving(from), SHOW_AFTER_MS),
        window.setTimeout(() => setLeaving(null), GIVE_UP_MS),
      );
    };
    const onBack = () => {
      clear();
      setLeaving(null);
    };
    // On window, so it runs after every other click handler and sees a cancel.
    window.addEventListener("click", onClick);
    window.addEventListener("popstate", onBack);
    window.addEventListener("pageshow", onBack);
    return () => {
      clear();
      window.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onBack);
      window.removeEventListener("pageshow", onBack);
    };
  }, []);

  useEffect(() => {
    if (state !== "done") return;
    const t = window.setTimeout(() => setLeaving(null), 300);
    return () => window.clearTimeout(t);
  }, [state]);

  return <div className="nav-progress" data-state={state} aria-hidden="true" />;
}
