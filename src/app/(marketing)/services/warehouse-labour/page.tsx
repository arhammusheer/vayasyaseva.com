import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePage } from "@/content/service-pages";

const page = getServicePage("warehouse-labour");

export const metadata = serviceLandingMetadata(page);

export default function WarehouseLabourPage() {
  return <ServiceLanding page={page} />;
}
