import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { JsonLd, phoneFreeGraphSchema } from "@/lib/structured-data";
import { localeOfParams } from "@/lib/i18n";

/**
 * Location pages (/locations): business pages that job seekers also find
 * (estate searches are mostly map, company-list and job searches, PLAN §2),
 * so they get the business header and footer without the phone, like the
 * reference pages. Request a crew is the way in. It cannot import the phone
 * (eslint.config.mjs).
 */
export default async function LocationsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const locale = localeOfParams(await params);
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <JsonLd data={phoneFreeGraphSchema("reference")} />
      <Header door="business" />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <Footer door="business" locale={locale} />
    </div>
  );
}
