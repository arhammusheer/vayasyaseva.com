import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePage } from "@/content/service-pages";
import { localeParams } from "@/lib/i18n";

const page = getServicePage("loading-unloading-labour");

export const dynamicParams = false;
export const generateStaticParams = localeParams("/services/loading-unloading-labour");
export const metadata = serviceLandingMetadata(page);

export default function LoadingUnloadingLabourPage() {
  return <ServiceLanding page={page} />;
}
