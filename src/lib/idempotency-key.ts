"use client";

import { readSessionValue, writeSessionValue } from "./use-session-draft";

const KEY_PATTERN = /^[A-Za-z0-9_.:-]{8,128}$/;

async function digest(request: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(request)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * The Idempotency-Key for a form's request, kept in this tab's session
 * storage under `storageKey` with a hash of the request (never the request
 * itself): the same while the request is the same, so a retry after a lost
 * answer gets the first answer back (src/server/submissions); a changed
 * request gets a new key. Without storage, a fresh key each time (the route
 * then simply runs again, as before keys existed).
 */
export async function idempotencyKeyFor(storageKey: string, request: unknown): Promise<string> {
  const hash = await digest(JSON.stringify(request)).catch(() => null);
  const saved = readSessionValue(storageKey) as { key?: unknown; hash?: unknown } | null;
  if (hash && saved && typeof saved.key === "string" && KEY_PATTERN.test(saved.key) && saved.hash === hash) return saved.key;
  const key = crypto.randomUUID();
  if (hash) writeSessionValue(storageKey, { key, hash });
  return key;
}

/** Forget the key once its request has been answered. */
export function forgetIdempotencyKey(storageKey: string) {
  writeSessionValue(storageKey, null);
}
