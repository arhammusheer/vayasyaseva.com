"use client";

import { useCallback, useEffect, useState } from "react";

export function readSessionValue(key: string): unknown {
  try { return JSON.parse(sessionStorage.getItem(key) ?? "null"); }
  catch { return null; }
}

export function writeSessionValue(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch { /* Storage unavailable: the editable form still works. */ }
}

/** Text-only drafts; consent and binary attachments never enter storage. */
export function useSessionDraft<T>(
  key: string,
  value: T | null,
  decode: (raw: unknown) => T | null,
  restore: (draft: T) => void,
  enabled = true,
) {
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const serialized = value === null ? null : JSON.stringify(value);

  useEffect(() => {
    const draft = decode(readSessionValue(key));
    // Hydration reads this tab's saved inputs once, after link prefills.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (draft) { restore(draft); setRestored(true); }
    setLoadedKey(key);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [key, decode, restore]);

  useEffect(() => {
    if (loadedKey !== key) return;
    writeSessionValue(key, enabled && serialized ? JSON.parse(serialized) : null);
  }, [loadedKey, key, enabled, serialized]);

  const clear = useCallback(() => {
    writeSessionValue(key, null);
    setRestored(false);
  }, [key]);
  return { restored, clear };
}
