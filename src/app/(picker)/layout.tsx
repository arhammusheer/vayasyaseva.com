import "../globals.css";
import { Suspense } from "react";
import { Analytics } from "@/components/analytics";
import { ContextRuntime } from "@/components/context-runtime";
import { bootCss, bootScript } from "@/context/boot";
import { NavigationProgress } from "@/components/navigation-progress";
import { gaId } from "@/lib/measurement/config";
import { fontClassName, siteMetadata } from "@/lib/site-metadata";

export const metadata = siteMetadata;

/**
 * Root layout for the language picker, shown at a page's neutral URL when
 * its locale override is "prompt" (src/lib/i18n.ts, src/proxy.ts). The page
 * offers every language, so <html lang> is English and each choice is
 * marked with its own language. The visitor context runs here too, so an
 * ad that lands on the picker still counts as the session's arrival.
 */
export default function PickerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
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
