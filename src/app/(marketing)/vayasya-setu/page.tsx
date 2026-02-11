import type { Metadata } from "next";
import {
  Clock,
  FileCheck,
  BarChart3,
  Eye,
  Database,
  Shield,
  Plug,
  Monitor,
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
      "Structured attendance capture and verification — ensuring payroll accuracy and operational accountability across deployed teams.",
    icon: Clock,
  },
  {
    title: "Compliance Documentation",
    description:
      "ESIC, EPF, and statutory documentation maintained with audit-trail discipline — inspection-ready at all times.",
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
      "Supervisory tracking and shift-level deployment data — providing visibility into workforce performance and operational rhythm.",
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
      "Optional read-only access to attendance and deployment dashboards — subject to scope and engagement terms.",
    icon: Monitor,
  },
];

export default function VayasyaSetuPage() {
  return (
    <>
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">
            Operational Control Layer
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Vayasya Setu
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            The internal operating engine that powers VSPL&apos;s workforce
            deployment discipline. Vayasya Setu ensures attendance integrity,
            compliance documentation, payroll-aligned outputs, and structured
            reporting — forming the backbone of every engagement.
          </p>
        </div>
      </Section>

      {/* Capabilities */}
      <Section variant="subtle">
        <SectionHeader
          title="What Setu Delivers"
          subtitle="Core operational capabilities that support every VSPL workforce deployment."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <Card key={cap.title} className="h-full">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                    <Icon className="h-5 w-5 text-brand" />
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
                <Badge variant="secondary" className="text-xs">
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
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                    <Icon className="h-5 w-5 text-brand" />
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
      </Section>

      {/* Data Governance */}
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10">
            <Shield className="h-6 w-6 text-brand" />
          </div>
          <h2 className="mt-4 text-2xl font-bold">Data Accuracy & Governance</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Attendance data, compliance records, and payroll inputs processed
            through Vayasya Setu follow defined verification and audit-trail
            protocols — ensuring data integrity and governance discipline across
            all reporting outputs.
          </p>
        </div>
      </Section>

      <CtaBlock />
    </>
  );
}
