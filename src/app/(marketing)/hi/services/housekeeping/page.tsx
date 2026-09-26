import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePageHi } from "@/content/hi/service-pages";

const page = getServicePageHi("housekeeping");

export const metadata = serviceLandingMetadata(page, "hi");

export default function HousekeepingHindiPage() {
  return <ServiceLanding page={page} locale="hi" />;
}
