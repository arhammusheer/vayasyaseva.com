import type { Metadata } from "next";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { JsonLd, siteGraphSchema } from "@/lib/structured-data";
import { brandDisplay, brandMono, brandSerif } from "@/lib/fonts";

const appDescription =
  "Contract labour, workforce management and industrial services from Vayasya Seva in Haridwar. People and operations supported by careful labour compliance.";

export const metadata: Metadata = {
  title: {
    default: "Vayasya Seva | Contract Labour & Workforce Services",
    template: "%s | Vayasya Seva",
  },
  description: appDescription,
  keywords: [
    "labour contractor Haridwar",
    "contract labour SIDCUL",
    "manpower supply Haridwar",
    "industrial manpower SIDCUL",
    "workforce contractor Uttarakhand",
    "warehouse labour Haridwar",
    "factory workers SIDCUL",
    "housekeeping services Haridwar",
    "facility management SIDCUL",
    "civil contractor Haridwar industrial",
    "fabrication contractor SIDCUL",
    "machinery maintenance Haridwar",
    "ESIC EPF compliant contractor",
    "contract staffing Haridwar",
    "industrial services Haridwar SIDCUL",
    "Vayasya Seva",
  ],
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
        className={`${brandDisplay.variable} ${brandSerif.variable} ${brandMono.variable} font-serif antialiased`}
      >
        <JsonLd data={siteGraphSchema()} />
        {children}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
