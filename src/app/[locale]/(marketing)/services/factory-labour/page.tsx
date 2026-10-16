import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePage } from "@/content/service-pages";
import { localeParams } from "@/lib/i18n";

const page = getServicePage("factory-labour");

export const dynamicParams = false;
export const generateStaticParams = localeParams("/services/factory-labour");
export const metadata = serviceLandingMetadata(page);

export default function FactoryLabourPage() {
  return <ServiceLanding page={page} />;
}
