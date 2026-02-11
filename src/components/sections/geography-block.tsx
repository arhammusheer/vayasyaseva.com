import { MapPin, Clock, TrendingUp } from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { siteConfig } from "@/content/site";

export function GeographyBlock() {
  return (
    <Section id="geography">
      <SectionHeader
        title="Geographic Presence & Deployment Reach"
        subtitle="Operationally rooted in one of India's most active industrial corridors."
      />

      <div className="mx-auto max-w-4xl">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5">
            <MapPin className="h-5 w-5 text-seva" />
            <span className="text-lg font-semibold">{siteConfig.region}</span>
          </div>
        </div>

        <p className="mt-6 text-center text-muted-foreground leading-relaxed">
          VSPL&apos;s primary operations are centred in the Haridwar–SIDCUL
          industrial region — covering manufacturing units, warehouses, and
          logistics hubs in and around the SIDCUL industrial estate.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-5 text-center">
            <MapPin className="mx-auto h-5 w-5 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">Current Operating Radius</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Haridwar, SIDCUL, and surrounding industrial areas within
              Uttarakhand.
            </p>
          </div>

          <div className="rounded-xl border border-border p-5 text-center">
            <TrendingUp className="mx-auto h-5 w-5 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">Expansion Criteria</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              New locations evaluated based on project scale, headcount
              requirement, and operational feasibility.
            </p>
          </div>

          <div className="rounded-xl border border-border p-5 text-center">
            <Clock className="mx-auto h-5 w-5 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">Mobilization</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Standard deployment within primary region: typically 7–14
              working days from requirement confirmation.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
