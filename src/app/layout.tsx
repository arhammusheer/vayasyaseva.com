import type { Metadata } from "next";
import { Hind, Inter } from "next/font/google";
import "./globals.css";

const hind = Hind({
  variable: "--font-hind",
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vayasya Seva Private Limited | Compliance-First Workforce Operations",
    template: "%s | Vayasya Seva Private Limited",
  },
  description:
    "Disciplined manpower deployment for warehouses, factories, and facilities. Structured supervision, attendance integrity, and audit-ready documentation.",
  keywords: [
    "workforce operations",
    "manpower deployment",
    "warehouse staffing",
    "industrial workforce",
    "compliance workforce",
    "Haridwar",
    "SIDCUL",
  ],
  metadataBase: new URL("https://vayasyaseva.com"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://vayasyaseva.com",
    siteName: "Vayasya Seva Private Limited",
    title: "Vayasya Seva Private Limited | Compliance-First Workforce Operations",
    description:
      "Disciplined manpower deployment for warehouses, factories, and facilities.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${hind.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
