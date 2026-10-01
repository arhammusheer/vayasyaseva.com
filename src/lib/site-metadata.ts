import type { Metadata } from "next";
import {
  brandDisplay,
  brandDisplayDevanagari,
  brandMono,
  brandSerif,
  brandSerifDevanagari,
} from "@/lib/fonts";

/** Shared by both root layouts: app/[locale] (the site) and app/(picker). */
const appDescription =
  "Contract labour, workforce management and industrial services from Vayasya Seva in Haridwar. People and operations supported by careful labour compliance.";

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
  other: {
    "geo.region": "IN-UK",
    "geo.placename": "Haridwar",
    "geo.position": "29.9457;78.1642",
    ICBM: "29.9457, 78.1642",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.vayasyaseva.com",
    siteName: "Vayasya Seva",
    title: "Vayasya Seva | Contract Labour & Workforce Services",
    description: appDescription,
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
    title: "Vayasya Seva | Contract Labour & Workforce Services",
    description: appDescription,
    images: ["/opengraph-image"],
  },
};

export const fontClassName = `${brandDisplay.variable} ${brandSerif.variable} ${brandMono.variable} ${brandDisplayDevanagari.variable} ${brandSerifDevanagari.variable} font-serif antialiased`;
