import "../globals.css";
import { Analytics } from "@/components/analytics";
import { gaId } from "@/lib/analytics-config";
import { fontClassName, siteMetadata } from "@/lib/site-metadata";

export const metadata = siteMetadata;

/**
 * Root layout for the language picker, shown at a page's neutral URL when
 * its locale override is "prompt" (src/lib/i18n.ts, src/proxy.ts). The page
 * offers every language, so <html lang> is English and each choice is
 * marked with its own language.
 */
export default function PickerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className={fontClassName}>
        {children}
        {gaId && <Analytics gaId={gaId} />}
      </body>
    </html>
  );
}
