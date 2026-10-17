import { shareImageUrl } from "@/lib/share-images";
import type { Metadata } from "next";
import {
  brandDisplay,
  brandMono,
  brandSerif,
  brandSerifDevanagari,
} from "@/lib/fonts";

/** Shared by both root layouts: app/[locale] (the site) and app/(picker). */
const appDescription =
  "Contract labour, workforce management and industrial services from Vayasya Seva. People and operations supported by careful labour compliance.";

export const siteMetadata: Metadata = {
  title: {
    default: "Vayasya Seva | Contract Labour & Workforce Services",
    template: "%s | Vayasya Seva",
  },
  description: appDescription,
  metadataBase: new URL("https://www.vayasyaseva.com"),
  applicationName: "Vayasya Seva",
  category: "business",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    // Bing Webmaster Tools (also feeds ChatGPT search and Copilot)
    other: { "msvalidate.01": "2876603236738BF23E39FA2A9813FFC1" },
  },
  // No geo.* or ICBM tags: they would mark every page, including other
  // markets' location pages, as Haridwar (owner direction, 17 Oct 2026: no
  // default market). The registered office is in the Organization JSON-LD.
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.vayasyaseva.com",
    siteName: "Vayasya Seva",
    title: "Vayasya Seva | Contract Labour & Workforce Services",
    description: appDescription,
    images: [
      {
        url: shareImageUrl("/en-in"),
        width: 1200,
        height: 630,
        alt: "Vayasya Seva",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vayasya Seva | Contract Labour & Workforce Services",
    description: appDescription,
    images: [shareImageUrl("/en-in")],
  },
};

export const fontClassName = `${brandDisplay.variable} ${brandSerif.variable} ${brandMono.variable} ${brandSerifDevanagari.variable} font-serif antialiased`;
