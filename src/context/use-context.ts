"use client";
import { useSyncExternalStore } from "react";
import type { VisitorContext } from "./core";
import { currentContext, subscribe } from "./runtime";

/**
 * The visitor context for interactive parts that render from it (the jobs
 * form's area answers, the menu sheet, the crew form's state order). The
 * server render and hydration see null (no context), so the server HTML
 * stays the neutral page; surfaces visible on load order themselves with
 * CSS instead (css.ts) and read the context at click time (currentContext).
 */
export function useVisitorContext(): VisitorContext | null {
  return useSyncExternalStore(subscribe, currentContext, () => null);
}
