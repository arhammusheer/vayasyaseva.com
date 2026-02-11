import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowUp,
  Phone,
  UserCheck,
  Layers,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { operationsTimeline } from "@/content/home";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "How We Operate",
  description:
    "VSPL's five-step operating model from requirement intake to compliance closure, with defined escalation frameworks and a dual-plane governance approach.",
};

const escalationLevels = [
  {
    level: "Level 1 — Site Supervisor",
    description:
      "Immediate on-ground issues — attendance, discipline, task allocation — handled by the deployed supervisor within the shift.",
    icon: UserCheck,
  },
  {
    level: "Level 2 — Operations Coordinator",
    description:
      "Persistent issues, staffing shortfalls, or process deviations — escalated to the VSPL operations coordinator for tracked resolution.",
    icon: ArrowUp,
  },
  {
    level: "Level 3 — Management Review",
    description:
      "Systemic concerns, compliance risks, or contractual matters — escalated to VSPL management with documented review and response.",
    icon: AlertTriangle,
  },
  {
    level: "Client Escalation Hotline",
    description:
      "Direct access to VSPL operations management for urgent or critical requirements outside standard escalation flow.",
    icon: Phone,
  },
];

export default function HowWeOperatePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "How We Operate", href: "/how-we-operate" },
        ])}
      />
      <Section className="section-glow-seva">
        <SectionHeader
          title="How We Operate"
          subtitle="A disciplined operating model designed for accountability, compliance, and operational continuity — from the first requirement discussion to ongoing reporting."
        />
      </Section>

      {/* Dual-plane model */}
      <Section variant="subtle">
        <SectionHeader
          title="Two Coordinated Layers"
          subtitle="VSPL operates through a Setu Governance Plane and an Execution Plane — keeping governance consistent while allowing rapid on-ground delivery."
        />

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-setu/20 bg-setu/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-5 w-5 text-setu" />
              <h3 className="font-semibold text-setu">
                Setu Governance Plane
              </h3>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Policies, attendance controls, compliance workflows, reporting
              standards, payroll workflows, and workforce-to-shift alignment
              logic — managed centrally through Vayasya Setu.
            </p>
            <ul className="space-y-2">
              {[
                "Policy logic and compliance rules",
                "Attendance capture and verification",
                "Payroll input generation",
                "Compliance documentation and filing",
                "Reporting standards and delivery",
                "Workforce-to-shift alignment (where deployed)",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm leading-relaxed"
                >
                  <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-setu" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-background p-6">
            <div className="mb-3 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Execution Plane</h3>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              On-ground staffing operations, supervisor-led issue handling,
              client communication, and time-bound operational delivery.
            </p>
            <ul className="space-y-2">
              {[
                "Day-to-day deployment coordination",
                "Supervisor-led exception handling",
                "Direct communication with client teams",
                "Shift handovers and operational continuity",
                "Replacement pipeline activation",
                "On-ground escalation and resolution",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                >
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          This model keeps governance consistent while allowing adaptable field execution.
        </p>
      </Section>

      {/* Five-step process */}
      <Section>
        <SectionHeader
          title="The Five-Step Process"
          subtitle="Every engagement follows this structured deployment cycle."
        />

        <div className="mx-auto max-w-3xl space-y-6">
          {operationsTimeline.map((step) => {
            return (
              <div
                key={step.step}
                className="flex items-start gap-5 rounded-xl border border-border bg-background p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-seva bg-seva/10">
                  <span className="text-lg font-bold text-seva">
                    {step.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Escalation Framework */}
      <Section variant="subtle">
        <SectionHeader
          title="Escalation Framework"
          subtitle="Defined escalation tiers ensure issues are resolved at the appropriate level — with accountability at each stage."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {escalationLevels.map((level) => {
            const Icon = level.icon;
            return (
              <Card key={level.level}>
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-seva/10">
                    <Icon className="h-5 w-5 text-seva" />
                  </div>
                  <CardTitle className="text-lg">{level.level}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {level.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </Section>

      <CtaBlock />
    </>
  );
}
