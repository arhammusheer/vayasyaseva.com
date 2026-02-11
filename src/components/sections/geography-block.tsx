import { MapPin, Clock, TrendingUp } from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { siteConfig } from "@/content/site";

export function GeographyBlock() {
  return (
    <Section id="geography">
      <Reveal>
        <SectionHeader
          title="Geographic Presence & Deployment Reach"
          subtitle="Operationally rooted in one of India's most active industrial corridors."
        />
      </Reveal>

      <div className="mx-auto max-w-4xl">
        <Reveal>
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
        </Reveal>

        <Stagger className="mt-8 grid gap-4 sm:grid-cols-3">
          <StaggerItem>
            <div className="rounded-xl border border-border p-5 text-center transition-[shadow,transform] duration-[var(--motion-base)] ease-[var(--motion-ease)] hover:-translate-y-0.5 hover:shadow-md">
              <MapPin className="mx-auto h-5 w-5 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Current Operating Radius</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Haridwar, SIDCUL, and surrounding industrial areas within
                Uttarakhand.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="rounded-xl border border-border p-5 text-center transition-[shadow,transform] duration-[var(--motion-base)] ease-[var(--motion-ease)] hover:-translate-y-0.5 hover:shadow-md">
              <TrendingUp className="mx-auto h-5 w-5 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Expansion Criteria</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                New locations evaluated based on project scale, headcount
                requirement, and operational feasibility.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="rounded-xl border border-border p-5 text-center transition-[shadow,transform] duration-[var(--motion-base)] ease-[var(--motion-ease)] hover:-translate-y-0.5 hover:shadow-md">
              <Clock className="mx-auto h-5 w-5 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Mobilization</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Standard deployment within primary region: typically 7–14
                working days from requirement confirmation.
              </p>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </Section>
  );
}
