"use client";

import Link from "@/components/i18n/link";
import { usePathname } from "next/navigation";
import { FALLBACK_LOCALE, localePath, splitLocalePath } from "@/lib/i18n";

const LABEL = { "en-IN": "Jobs", "hi-IN": "नौकरी", "hi-Latn-IN": "Jobs" } as const;

/** The footer is a server component; the jobs link follows the page's language. */
export function FooterJobsLink() {
  const locale = splitLocalePath(usePathname()).locale ?? FALLBACK_LOCALE;
  return (
    <Link href={localePath("/jobs", locale)} lang={locale === "hi-IN" ? "hi-IN" : undefined}>
      {LABEL[locale]}
    </Link>
  );
}
