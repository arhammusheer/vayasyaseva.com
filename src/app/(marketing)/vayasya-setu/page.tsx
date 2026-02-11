import type { Metadata } from "next";
import Image from "next/image";
import {
  Clock,
  FileCheck,
  BarChart3,
  Eye,
  Database,
  Shield,
  Plug,
  Monitor,
  Layers,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";

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
      "ESIC, EPF, and statutory documentation maintained with defined verification workflows — organized for inspection readiness.",
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
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <Image
            src="/brand/logos/vertical-setu.svg"
            alt="Vayasya Setu"
            width={120}
            height={40}
            className="mx-auto mb-4 h-10 w-auto"
          />
          <Badge variant="secondary" className="mb-4">
            Operational Control Layer
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Vayasya Setu
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            The internal operating engine that powers VSPL&apos;s workforce
            deployment discipline. Setu manages the control layer — attendance,
            compliance, documentation, and reporting — so that your site
            operations receive structured outputs without managing the
            underlying process.
          </p>
        </div>
      </Section>

      {/* Controls vs Work layer */}
      <Section variant="subtle">
        <SectionHeader
          title="Controls Layer vs Work Layer"
          subtitle="Setu operates the controls layer. Your site operations remain the work layer."
        />

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-setu/20 bg-setu/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-5 w-5 text-setu" />
              <h3 className="font-semibold text-setu">
                Setu Controls (VSPL Managed)
              </h3>
            </div>
            <ul className="space-y-2">
              {[
                "Attendance capture, verification, and reconciliation",
                "ESIC/EPF enrollment and contribution tracking",
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
              <h3 className="font-semibold">
                Work Layer (Client Operations)
              </h3>
            </div>
            <ul className="space-y-2">
              {[
                "Task assignment and production targets",
                "Site-specific operational decisions",
                "Quality and output standards",
                "Client-side HR policies and performance metrics",
                "Infrastructure, equipment, and materials",
                "Product-specific process requirements",
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
          subtitle="Core operational capabilities that support workforce deployment discipline."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <Card key={cap.title} className="h-full">
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

      {/* Exception handling */}
      <Section variant="subtle">
        <SectionHeader
          title="Exception Handling"
          subtitle="Setu flags deviations from expected patterns — attendance gaps, shift shortfalls, documentation delays — triggering defined escalation protocols."
        />

        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="grid gap-px bg-border md:grid-cols-3">
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
                  response: "Replacement pipeline activation + client notification",
                },
                {
                  trigger: "Documentation Delay",
                  description:
                    "ESIC/EPF enrollment or filing behind defined timeline.",
                  response: "Escalation to compliance coordinator + tracked resolution",
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
          <div className="divide-y divide-border rounded-xl border border-border">
            {outputs.map((output) => (
              <div
                key={output.label}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <span className="font-medium">{output.label}</span>
                <Badge variant="secondary" className="font-data text-xs">
                  {output.format}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Integration */}
      <Section variant="subtle">
        <SectionHeader
          title="Integration & Access Options"
          subtitle="Flexible delivery methods — from standard reports to system-aligned data feeds."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {integrationOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.title} className="h-full">
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

        <div className="mt-8 mx-auto max-w-2xl rounded-xl border border-border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              Integration note:
            </span>{" "}
            VSPL formats output data for import into client systems. Column
            mapping and format alignment are handled during engagement setup.
            Direct API-level integration is not currently offered. Clients
            who need real-time data feeds should discuss requirements during
            scoping.
          </p>
        </div>
      </Section>

      {/* Data Governance */}
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-setu/10">
            <Shield className="h-6 w-6 text-setu" />
          </div>
          <h2 className="mt-4 text-2xl font-bold">
            Data Accuracy & Governance
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Attendance data, compliance records, and payroll inputs processed
            through Vayasya Setu follow defined verification and audit-trail
            protocols. Data integrity is maintained through structured
            workflows — not ad-hoc processes.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Setu is an internal VSPL system. Clients receive outputs, not
            software access — unless optional visibility is agreed during
            engagement scoping.
          </p>
        </div>
      </Section>

      <CtaBlock />
    </>
  );
}
