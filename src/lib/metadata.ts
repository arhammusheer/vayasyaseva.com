import type { Metadata } from "next";

/** Share previews and canonicals follow the actual landing page. */
export function pageMetadata(input: {
  title: Metadata["title"];
  description: string;
  alternates: { canonical: string };
}): Metadata {
  const title =
    typeof input.title === "string"
      ? `${input.title} | Vayasya Seva`
      : "Vayasya Seva | Contract Labour & Workforce Services";
  return {
    ...input,
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: "Vayasya Seva",
      title,
      description: input.description,
      url: input.alternates.canonical,
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
