import type { Metadata } from "next";
import {
  ShieldCheck,
  FileCheck,
  Scale,
  FileText,
  Users,
  ClipboardCheck,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Section, SectionHeader } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";

export const metadata: Metadata = {
  title: "Compliance",
  description:
    "VSPL's compliance framework — ESIC, EPF, GST, MSME registrations, audit-ready documentation, and governance controls.",
};

const registrations = [
  {
    name: "ESIC",
    description:
      "Deployed workers are enrolled under the Employees' State Insurance scheme as part of the onboarding process, supporting medical and social security coverage.",
    icon: ShieldCheck,
  },
  {
    name: "EPF",
    description:
      "Provident fund contributions maintained for eligible deployed workers in compliance with the EPF Act.",
    icon: Users,
  },
  {
    name: "GST",
    description:
      "Registered under Goods and Services Tax with compliant invoicing and filing discipline.",
    icon: Building,
  },
  {
    name: "MSME",
    description:
      "UDYAM-registered micro, small, and medium enterprise — supporting government procurement and compliance eligibility.",
    icon: ClipboardCheck,
  },
];

const documentationMatrix = [
  { document: "Attendance Registers", frequency: "Daily", format: "Excel / CSV" },
  { document: "Wage Records", frequency: "Monthly", format: "Excel / PDF" },
  { document: "ESIC Contribution Challans", frequency: "Monthly", format: "PDF" },
  { document: "EPF Contribution Challans", frequency: "Monthly", format: "PDF" },
  { document: "Workforce Deployment Reports", frequency: "Weekly / Monthly", format: "Excel / PDF" },
  { document: "Compliance Summary Pack", frequency: "Monthly / On Request", format: "PDF" },
];

export default function CompliancePage() {
  return (
    <>
      <Section>
        <SectionHeader
          title="Compliance Framework"
          subtitle="VSPL operates under a structured compliance framework — statutory coverage, documentation discipline, and inspection readiness are built into the operating model."
        />
      </Section>

      {/* Registrations */}
      <Section variant="subtle">
        <SectionHeader
          title="Statutory Registrations"
          subtitle="Active registrations under key labour and business regulations."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {registrations.map((reg) => {
            const Icon = reg.icon;
            return (
              <Card key={reg.name}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <Icon className="h-5 w-5 text-success" />
                    </div>
                    <CardTitle className="text-xl">{reg.name}</CardTitle>
                  </div>
                  <CardDescription className="mt-2 text-base leading-relaxed">
                    {reg.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Documentation Matrix */}
      <Section>
        <SectionHeader
          title="Documentation Matrix"
          subtitle="Standard documentation maintained and delivered as part of workforce engagements."
        />

        <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Format</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentationMatrix.map((row) => (
                <TableRow key={row.document}>
                  <TableCell className="font-medium">{row.document}</TableCell>
                  <TableCell>{row.frequency}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {row.format}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Section>

      {/* Governance */}
      <Section variant="subtle">
        <SectionHeader
          title="Governance & Audit Support"
          subtitle="Structured governance controls that support both internal discipline and client audit requirements."
        />

        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-xl border border-border bg-background p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <FileCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Inspection Readiness</h3>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Statutory records are maintained in structured formats,
                  organized for inspection readiness by labour authorities or
                  client audit teams.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <Scale className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Records Handling</h3>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Worker records, attendance logs, wage data, and compliance
                  filings are maintained with defined retention policies and
                  access controls — supporting both operational continuity and
                  regulatory requirements.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <FileText className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Compliance Pack</h3>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Clients can request a consolidated compliance pack —
                  including registration certificates, contribution challans,
                  and workforce documentation summaries — for internal review
                  or audit preparation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <CtaBlock />
    </>
  );
}
