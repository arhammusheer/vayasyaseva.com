import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePageHinglish } from "@/content/hinglish/service-pages";

const page = getServicePageHinglish("factory-labour");

export const metadata = serviceLandingMetadata(page, "hinglish");

export default function FactoryLabourHinglishPage() {
  return <ServiceLanding page={page} locale="hinglish" />;
}
