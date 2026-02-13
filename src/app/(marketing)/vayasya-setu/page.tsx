import type { Metadata } from "next";
import {
  Clock,
  FileCheck,
  BarChart3,
  Eye,
  UserCheck,
  CalendarClock,
  Database,
  Shield,
  Plug,
  Monitor,
  Layers,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Vayasya Setu",
  description:
    "Vayasya Setu — VSPL's internal operational control layer for attendance integrity, compliance documentation, and structured reporting.",
};

const capabilities = [
  {
    title: "Attendance Integrity",
    description:
      "Structured attendance capture and verification — supporting payroll accuracy and shift-level accountability.",
    icon: Clock,
  },
  {
    title: "Compliance Documentation",
    description:
      "ESIC, EPF, and statutory documentation maintained with defined verification workflows — organised for inspection readiness.",
    icon: FileCheck,
  },
  {
    title: "Structured Reporting",
    description:
      "Attendance data, payroll inputs, deployment summaries, and compliance reports — delivered in Excel, CSV, or PDF formats.",
    icon: BarChart3,
  },
  {
    title: "Operational Visibility",
    description:
      "Supervisory tracking and shift-level deployment data — providing structured visibility into workforce operations.",
    icon: Eye,
  },
  {
    title: "Workforce-to-Shift Alignment",
    description:
      "Deployment suitability evaluated per shift — factoring in attendance patterns, role familiarity, and site conditions. Designed to reduce deployment mismatches and improve roster stability. Progressively enabled across engagements.",
    icon: UserCheck,
  },
  {
    title: "Scheduling & Roster Discipline",
    description:
      "Shift allocation follows a structured evaluation of workforce readiness — not just headcount availability. Roster composition considers operational context, attendance history, and role requirements.",
    icon: CalendarClock,
  },
];

const outputs = [
  { label: "Daily Attendance Reports", format: "Excel / CSV" },
  { label: "Payroll Input Sheets", format: "Excel" },
  { label: "Deployment Summaries", format: "PDF / Excel" },
  { label: "ESIC/EPF Contribution Records", format: "PDF" },
  { label: "Monthly Compliance Packs", format: "PDF" },
  { label: "Shift-Level Tracking Logs", format: "Excel / CSV" },
];

const integrationOptions = [
  {
    title: "Standard Delivery",
    description:
      "Reports delivered via email in Excel, CSV, or PDF format — aligned to your payroll and compliance calendar.",
    icon: Database,
  },
  {
    title: "System Alignment",
    description:
      "Data formatted for import into your existing HR/payroll systems — column mapping and format alignment handled by VSPL.",
    icon: Plug,
  },
  {
    title: "Client Visibility Access",
    description:
      "Optional read-only access to attendance and deployment dashboards — subject to engagement scope and terms.",
    icon: Monitor,
  },
];

export default function VayasyaSetuPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Vayasya Setu", href: "/vayasya-setu" },
        ])}
      />
      {/* Setu hero — themed glow header */}
      <section className="section-glow-setu py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant={"secondary"}
              className="mb-4 border-setu/20 bg-setu/10 text-setu/80"
            >
              Operational Control Layer
            </Badge>
            <h1 className="text-balance tracking-tight">
              <span className="text-4xl font-semibold text-primary sm:text-6xl">
                Vayasya
              </span>{" "}
              <span className="text-3xl font-medium text-setu sm:text-5xl">
                Setu
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-setu/80">
              The internal operating engine that powers VSPL&apos;s workforce and
              service deployment discipline. Setu manages the control layer —
              attendance, compliance, documentation, and reporting — so that your
              site operations receive structured outputs without managing the
              underlying process.
            </p>
          </div>
        </div>
      </section>

      {/* Dual-plane operating model */}
      <Section className="bg-setu/5">
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
                "Attendance capture, verification, and reconciliation",
                "ESIC/EPF enrolment and contribution tracking",
                "Payroll input generation and delivery",
                "Compliance documentation and filing",
                "Deployment reporting and shift tracking",
                "Exception flagging and escalation triggers",
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
              On-ground service operations, supervisor-led issue handling,
              client communication, and time-bound operational delivery.
            </p>
            <ul className="space-y-2">
              {[
                "Day-to-day deployment and task coordination",
                "Supervisor-led exception handling",
                "Direct communication with client site teams",
                "Shift handovers and operational continuity",
                "Replacement pipeline activation on attrition",
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
      </Section>

      {/* Capabilities */}
      <Section>
        <SectionHeader
          title="What Setu Delivers"
          subtitle="Core operational capabilities that support disciplined workforce and service execution."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <Card key={cap.title} className="h-full border-setu/20">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-setu/10">
                    <Icon className="h-5 w-5 text-setu" />
                  </div>
                  <CardTitle className="text-lg">{cap.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {cap.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* How Shift Allocation Works */}
      <Section>
        <SectionHeader
          title="How Shift Allocation Works"
          subtitle="Beyond headcount availability — VSPL evaluates workforce readiness factors to support structured roster composition."
        />

        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-muted-foreground">
              For engagements where workforce-to-shift alignment is deployed,
              VSPL goes beyond simply filling headcount. Roster composition is
              informed by a structured evaluation of readiness factors —
              attendance patterns, role familiarity, site experience, and
              prevailing conditions — considered for each shift.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              This approach is designed to reduce deployment mismatches, support
              operational continuity, and improve roster stability over time. The
              scope of this capability is defined during engagement setup and
              progressively enabled as operational data matures.
            </p>
            <p className="text-sm text-muted-foreground/80 italic">
              Availability and scope vary by engagement. Capability enablement is
              confirmed during the scoping process.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-setu/20 bg-setu/5 p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-setu">
                Readiness Factors Considered
              </h3>
              <ul className="space-y-2.5">
                {[
                  "Attendance history and pattern consistency",
                  "Role familiarity and prior deployment experience",
                  "Site-specific orientation and conditions awareness",
                  "Shift-pattern compatibility and schedule continuity",
                  "Supervisory feedback and operational readiness",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm leading-relaxed"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-setu" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-background p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Designed to Support
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Reduced deployment mismatches",
                  "Improved roster stability",
                  "Operational continuity",
                  "Shift-level accountability",
                ].map((outcome) => (
                  <Badge
                    key={outcome}
                    variant="secondary"
                    className="bg-setu/10 text-setu"
                  >
                    {outcome}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Exception handling */}
      <Section className="bg-setu/5">
        <SectionHeader
          title="Exception Handling"
          subtitle="Setu flags deviations from expected patterns — attendance gaps, shift shortfalls, documentation delays — triggering defined escalation protocols."
        />

        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-setu/20 bg-background overflow-hidden">
            <div className="grid gap-px bg-setu/10 md:grid-cols-3">
              {[
                {
                  trigger: "Attendance Gap",
                  description:
                    "Unverified or missing attendance entries flagged within the same shift cycle.",
                  response: "Supervisor verification + same-day resolution",
                },
                {
                  trigger: "Shift Shortfall",
                  description:
                    "Deployed headcount below confirmed requirement for a given shift.",
                  response:
                    "Replacement pipeline activation + client notification",
                },
                {
                  trigger: "Documentation Delay",
                  description:
                    "ESIC/EPF enrolment or filing behind defined timeline.",
                  response:
                    "Escalation to compliance coordinator + tracked resolution",
                },
              ].map((exc) => (
                <div key={exc.trigger} className="bg-background p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <h3 className="text-sm font-semibold">{exc.trigger}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {exc.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-setu">
                    {exc.response}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Outputs */}
      <Section>
        <SectionHeader
          title="What Clients Receive"
          subtitle="Standard output documents delivered through Vayasya Setu."
        />

        <div className="mx-auto max-w-2xl">
          <div className="divide-y divide-setu/10 rounded-xl border border-setu/20">
            {outputs.map((output) => (
              <div
                key={output.label}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <span className="font-medium">{output.label}</span>
                <Badge variant="secondary" className="font-data text-xs bg-setu/10 text-setu">
                  {output.format}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Integration */}
      <Section className="bg-setu/5">
        <SectionHeader
          title="Integration & Access Options"
          subtitle="Flexible delivery methods — from standard reports to system-aligned data feeds."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {integrationOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.title} className="h-full border-setu/20">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-setu/10">
                    <Icon className="h-5 w-5 text-setu" />
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {option.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 mx-auto max-w-2xl rounded-xl border border-setu/20 bg-background p-5">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-setu">
              Integration note:
            </span>{" "}
            VSPL follows a managed integration model. While a public self-serve
            API is not currently exposed, secure API access and ERP adapters can
            be enabled for qualified enterprise engagements through executive
            approval, scoped implementation, and governance review.
          </p>
        </div>
      </Section>

      {/* Data Governance — dark setu closer */}
      <section className="bg-setu-100 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-setu-foreground/10">
              <Shield className="h-6 w-6 text-setu" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-setu">
              Data Accuracy & Governance
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-setu/70">
              Attendance data, compliance records, and payroll inputs processed
              through Vayasya Setu follow defined verification and audit-trail
              protocols. Data integrity is maintained through structured workflows
              — not ad-hoc processes.
            </p>
            <p className="mt-4 text-sm text-setu/60">
              Setu is an internal VSPL system. Clients receive outputs, not
              software access — unless optional visibility is agreed during
              engagement scoping.
            </p>
          </div>
        </div>
      </section>

      <CtaBlock />
    </>
  );
}
