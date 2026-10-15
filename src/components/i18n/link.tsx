"use client";

import NextLink from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { linkProblem, localeFromSegment, localizeHref } from "@/lib/i18n";

/**
 * next/link for in-site links. Write the neutral path ("/contact"); it opens
 * in the reader's current language when the page has it, else the page's
 * default language (src/lib/i18n.ts).
 *
 * linkable() guard: a published page may link only to published pages. A
 * link to a draft, review, paused or unknown page throws while the site is
 * built (or in dev), which fails the build. At request time it is only
 * logged, so a stale link never turns into a 500; seo:check C11 catches
 * links in the built pages either way.
 */
const failHard = process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build";

export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();
  const locale = localeFromSegment(params?.locale);
  const resolved = typeof href === "string" ? localizeHref(href, locale) : href;
  if (typeof resolved === "string" && pathname) {
    const problem = linkProblem(resolved, pathname);
    if (problem) {
      if (typeof window === "undefined" && failHard) throw new Error(problem);
      console.error(problem);
    }
  }
  return <NextLink href={resolved} {...props} />;
}
