import type { Metadata } from "next";
import { Hind, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { JsonLd, organizationSchema } from "@/lib/structured-data";

const hind = Hind({
  variable: "--font-hind",
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

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
        className={`${hind.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <JsonLd data={organizationSchema()} />
        {children}
      </body>
    </html>
  );
}
