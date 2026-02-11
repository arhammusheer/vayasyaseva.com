import { MapPin } from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { siteConfig } from "@/content/site";

export function GeographyBlock() {
  return (
    <Section id="geography">
      <SectionHeader
        title="Geographic Presence"
        subtitle="Operationally rooted in one of India's most active industrial corridors."
      />

      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5">
          <MapPin className="h-5 w-5 text-brand" />
          <span className="text-lg font-semibold">
            {siteConfig.region}
          </span>
        </div>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          VSPL&apos;s primary operations are centred in the Haridwar–SIDCUL
          industrial region. Deployment to other locations is evaluated based on
          scale and project requirements.
        </p>
      </div>
    </Section>
  );
}
