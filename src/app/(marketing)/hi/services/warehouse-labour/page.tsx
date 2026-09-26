import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePageHi } from "@/content/hi/service-pages";

const page = getServicePageHi("warehouse-labour");

export const metadata = serviceLandingMetadata(page, "hi");

export default function WarehouseLabourHindiPage() {
  return <ServiceLanding page={page} locale="hi" />;
}
