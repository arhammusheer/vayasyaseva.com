import { ServiceLanding, serviceLandingMetadata } from "@/components/layout/service-landing";
import { getServicePageHinglish } from "@/content/hinglish/service-pages";

const page = getServicePageHinglish("housekeeping");

export const metadata = serviceLandingMetadata(page, "hinglish");

export default function HousekeepingHinglishPage() {
  return <ServiceLanding page={page} locale="hinglish" />;
}
