import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePageHi } from "@/content/hi/service-pages";

const page = getServicePageHi("factory-labour");

export const metadata = serviceLandingMetadata(page, "hi");

export default function FactoryLabourHindiPage() {
  return <ServiceLanding page={page} locale="hi" />;
}
