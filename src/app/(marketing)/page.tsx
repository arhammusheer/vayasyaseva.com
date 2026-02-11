import { Hero } from "@/components/sections/hero";
import { TrustStrip } from "@/components/sections/trust-strip";
import { ServiceClusters } from "@/components/sections/service-clusters";
import { OperationsTimeline } from "@/components/sections/operations-timeline";
import { ComplianceBlock } from "@/components/sections/compliance-block";
import { SetuBlock } from "@/components/sections/setu-block";
import { GeographyBlock } from "@/components/sections/geography-block";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaBlock } from "@/components/sections/cta-block";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <ServiceClusters />
      <OperationsTimeline />
      <ComplianceBlock />
      <SetuBlock />
      <GeographyBlock />
      <FaqSection />
      <CtaBlock />
    </>
  );
}
