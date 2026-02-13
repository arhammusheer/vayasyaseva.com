import type { Metadata } from "next";
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
import { JsonLd, faqSchema, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { faqs } from "@/content/home";

export const metadata: Metadata = {
  title:
    "Compliance-First Industrial Services for Workforce, Civil, Fabrication & Maintenance",
  description:
    "Integrated industrial services across workforce deployment, civil and fabrication works, housekeeping, equipment provisioning, and machinery maintenance. ESIC, EPF registered. Haridwar–SIDCUL region.",
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: "Vayasya Seva Private Limited — Compliance-First Industrial Services",
          description:
            "Integrated industrial services across workforce deployment, civil and fabrication works, housekeeping, equipment provisioning, and machinery maintenance.",
          url: "/",
        })}
      />
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([{ name: "Home", href: "/" }])}
      />
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
