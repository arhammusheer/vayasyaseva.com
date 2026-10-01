"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import type { ComponentProps } from "react";
import { localeFromSegment, localizeHref } from "@/lib/i18n";

/**
 * next/link for in-site links. Write the neutral path ("/contact"); it opens
 * in the reader's current language when the page has it, else the page's
 * default language (src/lib/i18n.ts).
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const params = useParams<{ locale?: string }>();
  const locale = localeFromSegment(params?.locale);
  return <NextLink href={typeof href === "string" ? localizeHref(href, locale) : href} {...props} />;
}
