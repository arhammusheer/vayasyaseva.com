import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePage } from "@/content/service-pages";
import { localeParams } from "@/lib/i18n";

const page = getServicePage("housekeeping");

export const dynamicParams = false;
export const generateStaticParams = localeParams("/services/housekeeping");
export const metadata = serviceLandingMetadata(page);

export default function HousekeepingPage() {
  return <ServiceLanding page={page} />;
}
