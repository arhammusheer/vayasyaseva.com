import "../globals.css";
import { Suspense } from "react";
import { Analytics } from "@/components/analytics";
import { ContextRuntime } from "@/components/context-runtime";
import { bootCss, bootScript } from "@/context/boot";
import { NavigationProgress } from "@/components/navigation-progress";
import { gaId } from "@/lib/measurement/config";
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
    // suppressHydrationWarning: the visitor-context boot script sets data-ctx-*
    // on <html> before React hydrates (src/context/boot.ts).
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Visitor context before paint (docs/visitor-context.md): the rules, then the script that sets their attributes. */}
        <style dangerouslySetInnerHTML={{ __html: bootCss() }} />
        <script dangerouslySetInnerHTML={{ __html: bootScript() }} />
      </head>
      <body className={fontClassName}>
        <NavigationProgress />
        <Suspense fallback={null}>
          <ContextRuntime />
        </Suspense>
        {children}
        {gaId && <Analytics gaId={gaId} />}
      </body>
    </html>
  );
}
