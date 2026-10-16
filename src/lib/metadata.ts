import { HOME_SHARE_ALT, hasOwnShareImage, shareImageUrl } from "@/lib/share-images";
import type { Metadata } from "next";
import { isIndexable, languageAlternates, localizeHref, locales, splitLocalePath, FALLBACK_LOCALE, type Locale } from "@/lib/i18n";

/**
 * Share previews and canonicals follow the actual landing page. The canonical
 * may be a neutral path ("/about"): it resolves to the page in `locale`, or
 * its default language.
 *
 * Robots and hreflang follow the page registry (src/content/registry): only
 * a published page in a published locale is indexed; review and paused
 * pages are noindex, follow and drop out of every alternate list.
 */
export function pageMetadata(input: {
  title: Metadata["title"];
  description: string;
  alternates: { canonical: string };
  locale?: Locale;
  shareVariant?: string;
}): Metadata {
  const { locale: requested, shareVariant = "", ...rest } = input;
  const title =
    typeof input.title === "string"
      ? `${input.title} | Vayasya Seva`
      : input.title && typeof input.title === "object" && "absolute" in input.title
        ? input.title.absolute
      : "Vayasya Seva | Contract Labour & Workforce Services";
  const canonical = localizeHref(input.alternates.canonical, requested);
  const { locale = FALLBACK_LOCALE, path } = splitLocalePath(canonical);
  const languages = languageAlternates(path);
  const image = shareImageUrl(canonical, shareVariant);
  return {
    ...rest,
    alternates: { canonical, ...(languages && { languages }) },
    ...(isIndexable(path, locale) ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      locale: locales[locale].ogLocale,
      siteName: "Vayasya Seva",
      title,
      description: input.description,
      url: canonical,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: hasOwnShareImage(canonical, shareVariant) ? title : HOME_SHARE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: [image],
    },
  };
}
