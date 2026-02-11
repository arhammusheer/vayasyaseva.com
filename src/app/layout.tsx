import type { Metadata } from "next";
import { Hind, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
    "Structured workforce operations for warehouses, factories, and facilities. Supervision, attendance integrity, and audit-ready documentation.",
  keywords: [
    "workforce operations",
    "industrial workforce",
    "compliance workforce",
    "warehouse operations",
    "Haridwar",
    "SIDCUL",
    "ESIC EPF compliance",
  ],
  metadataBase: new URL("https://vayasyaseva.com"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://vayasyaseva.com",
    siteName: "Vayasya Seva Private Limited",
    title: "Vayasya Seva Private Limited | Compliance-First Workforce Operations",
    description:
      "Structured workforce operations for warehouses, factories, and facilities.",
  },
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
        {children}
      </body>
    </html>
  );
}
