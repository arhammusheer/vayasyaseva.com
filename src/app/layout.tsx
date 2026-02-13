import type { Metadata } from "next";
import "./globals.css";
import { JsonLd, organizationSchema } from "@/lib/structured-data";
import { brandDisplay, brandMono, brandSerif } from "@/lib/fonts";

export const metadata: Metadata = {
  title: {
    default: "Vayasya Seva Private Limited | Compliance-First Workforce Operations",
    template: "%s | Vayasya Seva Private Limited",
  },
  description:
    "Compliance-first workforce operations partner for industrial and enterprise sites. Structured deployment with supervision, attendance integrity, and audit-ready reporting.",
  keywords: [
    "workforce operations",
    "industrial workforce",
    "compliance workforce",
    "warehouse staffing",
    "factory workforce",
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
    title: "Vayasya Seva Private Limited | Compliance-First Workforce Operations",
    description:
      "Compliance-first workforce operations partner for industrial and enterprise sites. Structured deployment with supervision, attendance integrity, and audit-ready reporting.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Vayasya Seva Private Limited — Compliance-First Workforce Operations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vayasya Seva Private Limited | Compliance-First Workforce Operations",
    description:
      "Compliance-first workforce operations partner for industrial and enterprise sites. Structured deployment with supervision, attendance integrity, and audit-ready reporting.",
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
