import type { Metadata } from "next";
import "./globals.css";
import { JsonLd, organizationSchema } from "@/lib/structured-data";
import { brandDisplay, brandMono, brandSerif } from "@/lib/fonts";

const appDescription =
  "Contract labour, workforce management and industrial services from Vayasya Seva in Haridwar. People and operations supported by careful labour compliance.";

export const metadata: Metadata = {
  title: {
    default: "Vayasya Seva | Contract Labour & Workforce Services",
    template: "%s | Vayasya Seva Private Limited",
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
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.vayasyaseva.com",
    siteName: "Vayasya Seva Private Limited",
    title: "Vayasya Seva | Contract Labour & Workforce Services",
    description: appDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Vayasya Seva Private Limited",
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
