"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeOf, localePath } from "@/lib/i18n";

const LABEL = { en: "Jobs", hi: "नौकरी", hinglish: "Jobs" } as const;

/** The footer is a server component; the jobs link follows the page's language. */
export function FooterJobsLink() {
  const locale = localeOf(usePathname());
  return (
    <Link href={localePath("/jobs", locale)} lang={locale === "hi" ? "hi" : undefined}>
      {LABEL[locale]}
    </Link>
  );
}
