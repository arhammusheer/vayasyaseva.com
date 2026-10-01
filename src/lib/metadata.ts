import type { Metadata } from "next";
import { languageAlternates, localizeHref, locales, splitLocalePath, FALLBACK_LOCALE, type Locale } from "@/lib/i18n";

/**
 * Share previews and canonicals follow the actual landing page. The canonical
 * may be a neutral path ("/about"): it resolves to the page in `locale`, or
 * its default language.
 */
export function pageMetadata(input: {
  title: Metadata["title"];
  description: string;
  alternates: { canonical: string };
  locale?: Locale;
}): Metadata {
  const { locale: requested, ...rest } = input;
  const title =
    typeof input.title === "string"
      ? `${input.title} | Vayasya Seva`
      : input.title && typeof input.title === "object" && "absolute" in input.title
        ? input.title.absolute
      : "Vayasya Seva | Contract Labour & Workforce Services";
  const canonical = localizeHref(input.alternates.canonical, requested);
  const { locale = FALLBACK_LOCALE, path } = splitLocalePath(canonical);
  const languages = languageAlternates(path);
  return {
    ...rest,
    alternates: { canonical, ...(languages && { languages }) },
    ...(locales[locale].published ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      locale: locales[locale].ogLocale,
      siteName: "Vayasya Seva",
      title,
      description: input.description,
      url: canonical,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Vayasya Seva",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: ["/opengraph-image"],
    },
  };
}
