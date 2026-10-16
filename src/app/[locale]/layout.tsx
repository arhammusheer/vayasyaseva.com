import "../globals.css";
import { Analytics } from "@/components/analytics";
import { gaId } from "@/lib/analytics-config";
import { allLocales, locales, localeOfParams } from "@/lib/i18n";
import { fontClassName, siteMetadata } from "@/lib/site-metadata";

export const metadata = siteMetadata;

export const dynamicParams = false;
export function generateStaticParams() {
  return allLocales.map((l) => ({ locale: locales[l].segment }));
}

/**
 * Root layout for every page: <html lang> is the page's locale. The site
 * graph (JSON-LD) comes from the group layouts: (marketing) with the
 * business phone, (jobs) and (reference) without it.
 */
export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const locale = localeOfParams(await params);
  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className={fontClassName}>
        {children}
        {gaId && <Analytics gaId={gaId} />}
      </body>
    </html>
  );
}
