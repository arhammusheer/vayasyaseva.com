"use client";

import NextLink from "next/link";
import { useSyncExternalStore, type ComponentProps } from "react";
import { LANGUAGE_COOKIE } from "@/lib/language-cookie";
import { allLocales, nearestLocalePath, type Locale } from "@/lib/i18n";

/**
 * The language a jobs link opens in. On a non-English page, the page's own.
 * On an English page, the language the visitor last picked on the language
 * picker (the vspl_lang cookie), else English. The first render is the
 * page's language on server and client alike, so hydration matches; the
 * saved language lands after mount.
 *
 * Jobs links used to point English readers at the neutral /jobs (the
 * picker). The picker has its own root layout, so the client router could
 * not enter it: every such click was a full reload, and some did nothing
 * (performance audit, 18 Oct 2026). The picker stays for links shared
 * outside the site, where the language is unknown.
 */
export function useJobsLocale(pageLocale: Locale): Locale {
  const saved = useSyncExternalStore(subscribe, savedLocale, () => null);
  return pageLocale === "en-IN" && saved ? saved : pageLocale;
}

// The cookie changes only on the picker, a separate root layout (a full
// page load), so there is nothing to subscribe to.
const subscribe = () => () => {};
const savedLocale = (): Locale | null => {
  const value = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE}=([^;]+)`))?.[1];
  return (value && allLocales.find((l) => l === decodeURIComponent(value))) || null;
};

/**
 * A link into the jobs section (`path` neutral, e.g. "/jobs" or
 * "/jobs/haridwar"), in the reader's language: a client navigation within
 * the site's root layout, prefetched like any other link.
 */
export function JobsLink({ path, locale, ...props }: { path: string; locale: Locale } & Omit<ComponentProps<typeof NextLink>, "href">) {
  const chosen = useJobsLocale(locale);
  return <NextLink href={nearestLocalePath(path, chosen)} {...props} />;
}
