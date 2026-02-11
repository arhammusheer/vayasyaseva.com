import type { Metadata } from "next";
import {
  Factory,
  Warehouse,
  Package,
  Building2,
  UtensilsCrossed,
  Clock,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { industries } from "@/content/industries";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Workforce operations for manufacturing, warehousing, FMCG, institutional facilities, and hospitality-linked operations in the Haridwar–SIDCUL region.",
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Factory,
  Warehouse,
  Package,
  Building2,
  UtensilsCrossed,
};

export default function IndustriesPage() {
  return (
    <>
      <Section className="section-glow-seva">
        <SectionHeader
          title="Industries We Serve"
          subtitle="Workforce deployment models tailored to each industrial environment — aligned to sector-specific staffing patterns, risk controls, and reporting needs."
        />
      </Section>

      {industries.map((industry, index) => {
        const Icon = iconMap[industry.icon];
        const isSubtle = index % 2 !== 0;

        return (
          <Section
            key={industry.id}
            id={industry.id}
            variant={isSubtle ? "subtle" : "default"}
          >
            <div className="mx-auto max-w-4xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-seva/10">
                  {Icon && <Icon className="h-5 w-5 text-seva" />}
                </div>
                <h2 className="text-2xl font-bold">{industry.title}</h2>
              </div>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {industry.description}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader>
                    <div className="mb-1 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-seva" />
                      <CardTitle className="text-sm uppercase tracking-wider">
                        Staffing Pattern
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {industry.staffingPattern}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="mb-1 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-seva" />
                      <CardTitle className="text-sm uppercase tracking-wider">
                        Risk & Controls
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {industry.riskControlNeeds}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-seva" />
                      <CardTitle className="text-sm uppercase tracking-wider">
                        Reporting Cadence
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">
                      {industry.reportingCadence}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </Section>
        );
      })}

      <CtaBlock />
    </>
  );
}
