import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePageHinglish } from "@/content/hinglish/service-pages";

const page = getServicePageHinglish("warehouse-labour");

export const metadata = serviceLandingMetadata(page, "hinglish");

export default function WarehouseLabourHinglishPage() {
  return <ServiceLanding page={page} locale="hinglish" />;
}
