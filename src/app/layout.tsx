import type { Metadata } from "next";
import "./globals.css";
import { JsonLd, organizationSchema } from "@/lib/structured-data";
import { brandDisplay, brandMono, brandSerif } from "@/lib/fonts";

const appDescription =
  "Vayasya Seva Private Limited delivers compliance-first industrial services across workforce deployment, civil and fabrication works, housekeeping for business and factory premises, equipment provisioning, and machinery maintenance.";

export const metadata: Metadata = {
  title: {
    default: "Vayasya Seva Private Limited | Compliance-First Industrial Services",
    template: "%s | Vayasya Seva Private Limited",
  },
  description: appDescription,
  keywords: [
    "workforce operations",
    "industrial workforce",
    "compliance workforce",
    "warehouse staffing",
    "factory workforce",
    "civil works",
    "fabrication works",
    "housekeeping services",
    "equipment provisioning",
    "machinery maintenance",
    "Haridwar",
    "SIDCUL",
    "ESIC EPF compliance",
    "workforce deployment",
    "contract staffing",
  ],
  metadataBase: new URL("https://www.vayasyaseva.com"),
  icons: {
    icon: "/brand/logos/vspl.svg",
    apple: "/brand/logos/vspl.svg",
  },
  alternates: {
    canonical: "https://www.vayasyaseva.com",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.vayasyaseva.com",
    siteName: "Vayasya Seva Private Limited",
    title: "Vayasya Seva Private Limited | Compliance-First Industrial Services",
    description: appDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Vayasya Seva Private Limited — Compliance-First Industrial Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vayasya Seva Private Limited | Compliance-First Industrial Services",
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
    <html lang="en">
      <body
        className={`${brandDisplay.variable} ${brandSerif.variable} ${brandMono.variable} font-serif antialiased`}
      >
        <JsonLd data={organizationSchema()} />
        {children}
      </body>
    </html>
  );
}
