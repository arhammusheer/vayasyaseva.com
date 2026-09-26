import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@/components/analytics";
import { gaId } from "@/lib/analytics-config";
import { JsonLd, siteGraphSchema } from "@/lib/structured-data";
import {
  brandDisplay,
  brandDisplayDevanagari,
  brandMono,
  brandSerif,
  brandSerifDevanagari,
} from "@/lib/fonts";

const appDescription =
  "Contract labour, workforce management and industrial services from Vayasya Seva in Haridwar. People and operations supported by careful labour compliance.";

export const metadata: Metadata = {
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
  // verification: { google: "YOUR_GOOGLE_VERIFICATION_CODE" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${brandDisplay.variable} ${brandSerif.variable} ${brandMono.variable} ${brandDisplayDevanagari.variable} ${brandSerifDevanagari.variable} font-serif antialiased`}
      >
        <JsonLd data={siteGraphSchema()} />
        {children}
        {gaId && <Analytics gaId={gaId} />}
      </body>
    </html>
  );
}
