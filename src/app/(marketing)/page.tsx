import { HeroVideo } from "@/components/sections/hero-video";
import { Hero } from "@/components/sections/hero";
import { ProofRail } from "@/components/sections/proof-rail";
import { TrustStrip } from "@/components/sections/trust-strip";
import { ServiceClusters } from "@/components/sections/service-clusters";
import { PersonaBlocks } from "@/components/sections/persona-blocks";
import { OperationsTimeline } from "@/components/sections/operations-timeline";
import { ComplianceBlock } from "@/components/sections/compliance-block";
import { SetuBlock } from "@/components/sections/setu-block";
import { EngagementModels } from "@/components/sections/engagement-models";
import { ScopeBoundaries } from "@/components/sections/scope-boundaries";
import { GeographyBlock } from "@/components/sections/geography-block";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaBlock } from "@/components/sections/cta-block";

export default function HomePage() {
  return (
    <>
      {/* Hero zone: video covers both hero content and trust strip */}
      <section
        id="hero-zone"
        className="relative -mt-[65px] overflow-hidden bg-foreground pt-[65px]"
      >
        <HeroVideo />
        <div className="absolute inset-0 bg-foreground/75" />
        <div className="relative">
          <Hero />
          <TrustStrip />
        </div>
      </section>

      <ProofRail />
      <ServiceClusters />
      <PersonaBlocks />
      <OperationsTimeline />
      <ComplianceBlock />
      <SetuBlock />
      <EngagementModels />
      <ScopeBoundaries />
      <GeographyBlock />
      <FaqSection />
      <CtaBlock />
    </>
  );
}
