import type { Metadata } from "next";
import { MapPin, Target, Eye, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import {
  OperatingModelIntro,
  TwoPlanes,
  DailyFlowTimeline,
  ClientOutcomes,
  OwnershipMatrix,
  GovernanceFaq,
} from "@/components/sections/operating-model";
import { siteConfig } from "@/content/site";
import { JsonLd, breadcrumbSchema, webPageSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Vayasya Seva Private Limited — a compliance-first industrial services partner for workforce, civil, fabrication, housekeeping, equipment, and maintenance requirements.",
};

const values = [
  {
    title: "Operational Discipline",
    description:
      "Every engagement follows a defined process — from scoping and mobilization to supervision and reporting. Consistency in execution is the foundation of reliable industrial service delivery.",
    icon: Target,
  },
  {
    title: "Compliance Integrity",
    description:
      "Statutory obligations are treated as operational requirements, not afterthoughts. ESIC, EPF, and regulatory compliance are embedded in every engagement from day one.",
    icon: Shield,
  },
  {
    title: "Accountability & Transparency",
    description:
      "Structured reporting, defined escalation frameworks, and supervisory accountability ensure clients have visibility into how each service scope is executed.",
    icon: Eye,
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: "About Vayasya Seva Private Limited",
          description:
            "A compliance-first industrial services partner for workforce, civil, fabrication, housekeeping, equipment, and maintenance requirements.",
          url: "/about",
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ])}
      />
      {/* Company Overview */}
      <Section className="section-glow-seva glow-left">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            About {siteConfig.companyName}
          </h1>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              Vayasya Seva Private Limited (VSPL) is a compliance-first
              industrial services partner for factory and enterprise sites. We
              combine disciplined on-ground execution with Setu-led governance
              workflows to deliver reliable workforce services, civil and
              fabrication works, housekeeping operations, equipment support, and
              machinery maintenance reporting.
            </p>
            <p>
              Our clients are enterprise and industrial operations in the
              Haridwar–SIDCUL region — including manufacturing plants,
              warehouses, logistics hubs, and institutional facilities. VSPL
              executes integrated scopes with trained teams, on-ground
              supervision, compliance coverage, and defined reporting cadences.
            </p>
          </div>
        </div>
      </Section>

      {/* Operating Philosophy */}
      <Section variant="subtle">
        <SectionHeader
          title="Operating Philosophy"
          subtitle="Three principles that define how VSPL approaches every industrial service engagement."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <Card key={value.title} className="h-full">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-seva/10">
                    <Icon className="h-5 w-5 text-seva" />
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {value.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* A) Enterprise Scale Intro */}
      <OperatingModelIntro />

      {/* B) Two Coordinated Planes */}
      <TwoPlanes />

      {/* Ownership Matrix */}
      <OwnershipMatrix />

      {/* C) How Work Flows Daily */}
      <DailyFlowTimeline />

      {/* D) What Clients Experience */}
      <ClientOutcomes />

      {/* E) Governance FAQ */}
      <GovernanceFaq />

      {/* Governance Mindset */}
      <Section variant="subtle">
        <div className="mx-auto max-w-3xl">
          <SectionHeader
            title="Governance Mindset"
            align="left"
          />
          <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              VSPL treats governance as an operational requirement — not a
              periodic audit exercise. Worker records, compliance
              documentation, attendance data, and payroll inputs are maintained
              with defined processes and accountability structures.
            </p>
            <p>
              This governance discipline extends to our internal operations
              through Vayasya Setu, the operating engine that powers attendance
              integrity, documentation workflows, and structured client
              reporting.
            </p>
          </div>
        </div>
      </Section>

      {/* Regional Footprint */}
      <Section>
        <SectionHeader
          title="Regional Footprint"
        />

        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5">
            <MapPin className="h-5 w-5 text-seva" />
            <span className="text-lg font-semibold">
              {siteConfig.region}
            </span>
          </div>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            VSPL&apos;s operations are centred in the Haridwar–SIDCUL industrial
            corridor — one of Uttarakhand&apos;s most active manufacturing and
            logistics hubs. Deployment to other locations is evaluated based on
            scale, project scope, and operational feasibility.
          </p>
        </div>
      </Section>

      <CtaBlock />
    </>
  );
}
