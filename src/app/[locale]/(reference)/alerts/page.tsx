import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";
import { ALERTS_PATH } from "@/lib/rate-alerts";
import { AlertLink } from "./alert-link";

/**
 * Where the links in our rate alert emails open (docs/rate-alerts.md):
 * /alerts#confirm=<token> confirms an address, /alerts#stop=<token> stops
 * the emails. The token is in the fragment, so it reaches no server log;
 * alert-link.tsx reads it in the browser. English only and out of search
 * (the registry's noindex): nothing links here but those emails.
 */
export const dynamicParams = false;
export const generateStaticParams = localeParams(ALERTS_PATH);

const TITLE = "Minimum Wage Alerts";

export const metadata = pageMetadata({
  title: TITLE,
  description: "Confirm or stop Vayasya Seva's minimum wage rate alerts.",
  alternates: { canonical: ALERTS_PATH },
});

type Props = { params: Promise<{ locale: string }> };

export default async function AlertsPage({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(ALERTS_PATH).includes(locale)) notFound();
  return (
    <>
      <PageHero title="Minimum wage alerts." />
      <Section>
        <AlertLink />
      </Section>
    </>
  );
}
