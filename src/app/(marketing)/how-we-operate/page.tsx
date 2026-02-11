import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowUp,
  Phone,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { operationsTimeline } from "@/content/home";

export const metadata: Metadata = {
  title: "How We Operate",
  description:
    "VSPL's five-step operating model from requirement intake to compliance closure, with defined escalation frameworks.",
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
      "Persistent issues, manpower shortfalls, or process deviations — escalated to the VSPL operations coordinator for resolution within 24 hours.",
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
      <Section>
        <SectionHeader
          title="How We Operate"
          subtitle="A disciplined operating model designed for accountability, compliance, and operational continuity — from the first requirement discussion to ongoing reporting."
        />
      </Section>

      {/* Five-step process */}
      <Section variant="subtle">
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
      <Section>
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
