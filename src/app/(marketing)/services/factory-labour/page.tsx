import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePage } from "@/content/service-pages";

const page = getServicePage("factory-labour");

export const metadata = serviceLandingMetadata(page);

export default function FactoryLabourPage() {
  return <ServiceLanding page={page} />;
}
