import { ServiceLanding, serviceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { localeOfParams, localeParams } from "@/lib/i18n";

const SLUG = "housekeeping";

export const dynamicParams = false;
export const generateStaticParams = localeParams(`/services/${SLUG}`);

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { page, locale } = serviceLanding(SLUG, localeOfParams(await params));
  return serviceLandingMetadata(page, locale);
}

export default async function HousekeepingPage({ params }: Props) {
  const { page, locale } = serviceLanding(SLUG, localeOfParams(await params));
  return <ServiceLanding page={page} locale={locale} />;
}
