"use client";

import {
  Shield,
  Users,
  ClipboardList,
  FileCheck,
  BarChart3,
  Clock,
  AlertTriangle,
  CalendarCheck,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Layers,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, SectionHeader } from "@/components/layout/section";

/* ── A) Enterprise Scale Intro ── */

export function OperatingModelIntro() {
  return (
    <Section id="operating-model">
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          title="How VSPL Operates at Enterprise Scale"
          align="left"
        />
        <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
          <p>
            VSPL runs workforce operations through two coordinated planes:
            a <strong className="text-foreground">Setu Governance Plane</strong>{" "}
            that manages rules, compliance, and reporting centrally, and
            an <strong className="text-foreground">Execution Plane</strong>{" "}
            where supervisors and operations teams deliver on the ground.
          </p>
          <p>
            This separation matters because it prevents the governance gaps
            that typically arise when policy enforcement and field execution
            are handled by the same ad-hoc team. Standards are managed
            centrally; delivery is managed at site.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ── B) Two Coordinated Planes (side-by-side cards) ── */

const governanceBullets = [
  "Policy logic and compliance rule enforcement",
  "Attendance capture, verification, and reconciliation",
  "ESIC/EPF enrolment and contribution tracking",
  "Payroll input generation and delivery schedules",
  "Reporting standards and output formatting",
  "Workforce-to-shift alignment and roster readiness (where deployed)",
  "Role and skill mapping across deployments",
];

const executionBullets = [
  "On-ground workforce deployment and coordination",
  "Supervisor-led exception handling and resolution",
  "Daily client communication and alignment",
  "Shift-level operational delivery and handovers",
  "Real-time issue escalation and correction",
  "Replacement pipeline activation on attrition",
];

export function TwoPlanes() {
  return (
    <Section variant="subtle" id="two-planes">
      <SectionHeader
        title="Two Coordinated Planes"
        subtitle="Rules and reporting managed centrally. Delivery managed on ground."
      />

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        {/* Setu Governance Plane */}
        <Card className="border-setu/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-setu/10">
                <Shield className="h-5 w-5 text-setu" />
              </div>
              <div>
                <Badge
                  variant="secondary"
                  className="mb-1 bg-setu/10 text-setu"
                >
                  Governance
                </Badge>
                <CardTitle className="text-xl">Setu Governance Plane</CardTitle>
              </div>
            </div>
            <CardDescription className="mt-2 text-base leading-relaxed">
              The centralised operating layer where policies, compliance
              workflows, reporting standards, and payroll logic are defined,
              enforced, and monitored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {governanceBullets.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm leading-relaxed"
                >
                  <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-setu" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <p className="text-sm font-medium text-setu">
              Impact: consistent governance across all sites and engagements.
            </p>
          </CardFooter>
        </Card>

        {/* Execution Plane */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-seva/10">
                <Users className="h-5 w-5 text-seva" />
              </div>
              <div>
                <Badge
                  variant="secondary"
                  className="mb-1 bg-seva/10 text-seva"
                >
                  Execution
                </Badge>
                <CardTitle className="text-xl">Execution Plane</CardTitle>
              </div>
            </div>
            <CardDescription className="mt-2 text-base leading-relaxed">
              The on-ground operations layer where supervisors and field
              teams run day-to-day deployment, handle exceptions, and
              coordinate directly with client site teams.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {executionBullets.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm leading-relaxed"
                >
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-seva" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <p className="text-sm font-medium text-seva">
              Impact: faster response, adaptable execution, site-level ownership.
            </p>
          </CardFooter>
        </Card>
      </div>
    </Section>
  );
}

/* ── C) How Work Flows Daily (stepper/timeline) ── */

const dailyFlow = [
  {
    step: 1,
    title: "Requirement Intake & Shift Planning",
    description:
      "Client requirements — headcount, roles, shift patterns, and compliance needs — are documented and translated into deployment-ready rosters.",
    icon: ClipboardList,
  },
  {
    step: 2,
    title: "Rule Application & Roster Readiness",
    description:
      "The Setu Governance Plane applies compliance rules, validates enrolment status, confirms attendance parameters, and clears the roster for deployment.",
    icon: FileCheck,
  },
  {
    step: 3,
    title: "Site Deployment & Supervision",
    description:
      "Supervisors deploy the workforce on site, manage task allocation, enforce shift discipline, and serve as the first point of accountability.",
    icon: Users,
  },
  {
    step: 4,
    title: "Exception Flagging & Response",
    description:
      "Attendance gaps, shift shortfalls, or documentation delays are flagged through defined protocols. Supervisors act immediately; unresolved issues escalate automatically.",
    icon: AlertTriangle,
  },
  {
    step: 5,
    title: "Daily Reporting & Reconciliation",
    description:
      "Attendance data, deployment summaries, and exception logs are reconciled and delivered to client teams in agreed formats — typically Excel, CSV, or PDF.",
    icon: BarChart3,
  },
  {
    step: 6,
    title: "Monthly Compliance & Review Rhythm",
    description:
      "ESIC/EPF contribution challans, wage records, and compliance summary packs are compiled and delivered monthly. Periodic reviews ensure alignment with client expectations.",
    icon: CalendarCheck,
  },
];

export function DailyFlowTimeline() {
  return (
    <Section id="daily-flow">
      <SectionHeader
        title="How Work Flows Daily"
        subtitle="A structured rhythm from planning to reporting — repeated consistently across every engagement."
      />

      <div className="mx-auto max-w-3xl">
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-5 top-6 hidden h-[calc(100%-3rem)] w-px bg-border sm:block" />

          <div className="space-y-6">
            {dailyFlow.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="relative flex items-start gap-5"
                >
                  {/* Step indicator */}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-seva bg-background">
                    <Icon className="h-4 w-4 text-seva" />
                  </div>

                  {/* Content */}
                  <div className="rounded-xl border border-border bg-background p-5 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-data">
                        Step {item.step}
                      </Badge>
                      <h3 className="text-base font-semibold">{item.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ── D) What Clients Experience (outcome cards) ── */

const outcomes = [
  {
    title: "Operational Predictability",
    description:
      "Defined processes from intake to reporting reduce variability. Clients receive consistent deployment quality regardless of headcount or shift complexity.",
    icon: TrendingUp,
  },
  {
    title: "Faster Exception Closure",
    description:
      "Attendance gaps, shortfalls, and documentation delays are flagged within the same shift cycle. Defined escalation tiers keep resolution times short and trackable.",
    icon: Clock,
  },
  {
    title: "Audit-Ready Reporting Rhythm",
    description:
      "Compliance documentation, attendance records, and payroll inputs follow a structured production cycle — organised for inspection readiness as a standard practice.",
    icon: FileCheck,
  },
  {
    title: "Cross-Site Consistency",
    description:
      "The Setu Governance Plane applies the same compliance rules and reporting standards across all deployments. Governance does not vary by site or supervisor.",
    icon: Layers,
  },
];

export function ClientOutcomes() {
  return (
    <Section variant="subtle" id="client-outcomes">
      <SectionHeader
        title="What Clients Experience"
        subtitle="Measurable operating outcomes that result from a governance-led workforce model."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {outcomes.map((outcome) => {
          const Icon = outcome.icon;
          return (
            <Card key={outcome.title} className="h-full">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-seva/10">
                  <Icon className="h-5 w-5 text-seva" />
                </div>
                <CardTitle className="text-lg">{outcome.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {outcome.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}

/* ── E) Governance Without Operational Drag (FAQ accordion) ── */

const governanceFaqs = [
  {
    question: "Why not a generic staffing model?",
    answer:
      "Generic staffing providers typically treat workforce deployment as a placement exercise — sourcing and billing, with limited operational accountability. VSPL's two-plane model embeds governance, compliance, and reporting into the operating structure. This reduces the compliance burden on client teams and provides structured visibility into workforce operations that ad-hoc staffing arrangements cannot support.",
  },
  {
    question: "How are decisions handled during exceptions?",
    answer:
      "Exceptions — such as attendance gaps, shift shortfalls, or documentation delays — are handled through defined escalation tiers. The site supervisor addresses immediate issues within the shift. Persistent or systemic issues escalate to the VSPL operations coordinator and, if required, to management review. Each tier has a defined response expectation and tracking mechanism.",
  },
  {
    question: "How are client-specific workflows accommodated?",
    answer:
      "During engagement setup, VSPL maps client-specific requirements — shift patterns, reporting formats, compliance calendar, escalation preferences, and output delivery cadence. These are configured into the Setu Governance Plane so that ongoing operations follow client-aligned workflows without requiring repeated manual coordination.",
  },
  {
    question: "How are integration and API decisions made for enterprise clients?",
    answer:
      "VSPL follows a managed integration model. While a public self-serve API is not currently exposed, secure API access and ERP adapters can be enabled for qualified enterprise engagements through executive approval, scoped implementation, and governance review. Standard delivery is via structured reports in Excel, CSV, or PDF formats.",
  },
  {
    question: "What does 'governance without operational drag' mean?",
    answer:
      "It means compliance rules, attendance verification, and reporting standards are enforced centrally — without slowing down on-ground execution. The Setu Governance Plane handles the controls layer in the background, so supervisors and field teams can focus on deployment and delivery rather than paperwork and process compliance.",
  },
  {
    question:
      "How are shift rosters determined — is it just based on who is available?",
    answer:
      "For engagements where this capability is deployed, roster composition evaluates readiness factors beyond simple availability — including attendance patterns, role familiarity, site experience, and prevailing conditions. This is designed to reduce deployment mismatches and support shift-level accountability. Scope and enablement vary by engagement and are confirmed during setup.",
  },
];

export function GovernanceFaq() {
  return (
    <Section id="governance-faq">
      <SectionHeader
        title="Governance Without Operational Drag"
        subtitle="Common questions from enterprise stakeholders evaluating VSPL's operating model."
      />

      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {governanceFaqs.map((faq, index) => (
            <AccordionItem key={index} value={`gov-faq-${index}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

/* ── Ownership Clarity Matrix ── */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ownershipRows = [
  { area: "Compliance rules and statutory filings", governance: true, execution: false, client: false },
  { area: "Attendance capture and verification", governance: true, execution: true, client: false },
  { area: "ESIC/EPF enrolment and contributions", governance: true, execution: false, client: false },
  { area: "On-site deployment and supervision", governance: false, execution: true, client: false },
  { area: "Shift discipline and task allocation", governance: false, execution: true, client: false },
  { area: "Exception escalation and resolution", governance: true, execution: true, client: false },
  { area: "Reporting and data delivery", governance: true, execution: false, client: false },
  { area: "Production targets and output standards", governance: false, execution: false, client: true },
  { area: "Site infrastructure and equipment", governance: false, execution: false, client: true },
  { area: "Client-side HR policies", governance: false, execution: false, client: true },
];

export function OwnershipMatrix() {
  return (
    <Section variant="subtle" id="ownership-matrix">
      <SectionHeader
        title="Who Owns What"
        subtitle="Clear accountability boundaries between VSPL's governance layer, execution teams, and client operations."
      />

      <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%]">Operational Area</TableHead>
              <TableHead className="text-center">
                <span className="text-setu">Setu Governance</span>
              </TableHead>
              <TableHead className="text-center">
                <span className="text-seva">Execution</span>
              </TableHead>
              <TableHead className="text-center">Client</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ownershipRows.map((row) => (
              <TableRow key={row.area}>
                <TableCell className="font-medium text-sm">
                  {row.area}
                </TableCell>
                <TableCell className="text-center">
                  {row.governance && (
                    <CheckCircle2 className="mx-auto h-4 w-4 text-setu" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {row.execution && (
                    <CheckCircle2 className="mx-auto h-4 w-4 text-seva" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {row.client && (
                    <CheckCircle2 className="mx-auto h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Section>
  );
}
