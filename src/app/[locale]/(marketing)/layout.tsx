import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { businessPhone, businessPhoneHref } from "@/content/business-contact";
import { businessGraphSchema } from "@/lib/business-graph";
import { JsonLd } from "@/lib/structured-data";
import { localeOfParams } from "@/lib/i18n";

/** The business phone: business pages are the only ones that get it. */
const phone = { display: businessPhone.display, href: businessPhoneHref };

/** Business pages: the Jobs door, the phone, and the site graph with telephone. */
export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOfParams(await params);
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <JsonLd data={businessGraphSchema()} />
      <Header door="business" phone={phone} />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <Footer door="business" phone={phone} locale={locale} />
    </div>
  );
}
