import type { Metadata } from "next";
import { languageAlternates, locales, toEnglish, type Locale } from "@/lib/i18n";

/** Share previews and canonicals follow the actual landing page. */
export function pageMetadata(input: {
  title: Metadata["title"];
  description: string;
  alternates: { canonical: string };
  locale?: Locale;
}): Metadata {
  const { locale = "en", ...rest } = input;
  const title =
    typeof input.title === "string"
      ? `${input.title} | Vayasya Seva`
      : input.title && typeof input.title === "object" && "absolute" in input.title
        ? input.title.absolute
      : "Vayasya Seva | Contract Labour & Workforce Services";
  const canonical = input.alternates.canonical;
  const languages = languageAlternates(toEnglish(canonical));
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
