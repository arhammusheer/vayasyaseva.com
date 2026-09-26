import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePage } from "@/content/service-pages";

const page = getServicePage("housekeeping");

export const metadata = serviceLandingMetadata(page);

export default function HousekeepingPage() {
  return <ServiceLanding page={page} />;
}
