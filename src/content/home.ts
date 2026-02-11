import type {
  HeroContent,
  TrustClient,
  Registration,
  ServiceCluster,
  OperationStep,
  ComplianceItem,
  SetuFeature,
  FaqItem,
} from "./types";

export const hero: HeroContent = {
  headline: "Compliance-First Workforce Operations for Industrial Sites",
  subheadline:
    "Disciplined manpower deployment for warehouses, factories, and facilities — supported by structured supervision, attendance integrity, and audit-ready documentation.",
  primaryCta: { label: "Share Your Requirement", href: "/contact" },
  secondaryCta: { label: "Book Site Assessment", href: "/contact?type=assessment" },
};

export const trustClients: TrustClient[] = [
  {
    name: "ITC Limited",
    logoLight: "/assets/clients/ITC-light.png",
    logoDark: "/assets/clients/ITC-dark.png",
    visible: true,
  },
  {
    name: "Wipro",
    logoLight: "/assets/clients/Wipro-light.png",
    logoDark: "/assets/clients/Wipro-dark.png",
    visible: true,
  },
  {
    name: "Unilever",
    logoLight: "/assets/clients/Unilever-light.png",
    logoDark: "/assets/clients/Unilever-dark.png",
    visible: true,
  },
];

export const registrations: Registration[] = [
  { label: "ESIC", value: "Registered" },
  { label: "EPF", value: "Registered" },
  { label: "GST", value: "Registered" },
  { label: "MSME", value: "Certified" },
];

export const servicesClusters: ServiceCluster[] = [
  {
    id: "warehouse-logistics",
    title: "Warehouse & Logistics Manpower",
    description:
      "Loading, unloading, stacking, picking, dispatch, staging, and warehouse operations support.",
    roles: ["Loaders", "Pickers", "Stackers", "Dispatch Operators", "Staging Crew"],
    icon: "Warehouse",
    href: "/services#warehouse-logistics",
  },
  {
    id: "manufacturing-shopfloor",
    title: "Manufacturing & Shopfloor Support",
    description:
      "Helpers, packers, line feeders, material handling, and production support staff.",
    roles: ["Helpers", "Packers", "Line Feeders", "Material Handlers"],
    icon: "Factory",
    href: "/services#manufacturing-shopfloor",
  },
  {
    id: "housekeeping-facility",
    title: "Housekeeping, Facility & Hospitality Support",
    description:
      "Housekeeping, pantry, back-of-house, and guest-area staffing for facilities and hospitality operations.",
    roles: ["Housekeepers", "Pantry Staff", "BOH Staff", "Guest-Area Staff"],
    icon: "Building2",
    href: "/services#housekeeping-facility",
  },
  {
    id: "workforce-operations",
    title: "On-Ground Workforce Operations",
    description:
      "Recruitment, onboarding, shift planning, discipline management, and supervision for deployed teams.",
    roles: ["Supervisors", "Shift Planners", "Onboarding Coordinators"],
    icon: "Users",
    href: "/services#workforce-operations",
  },
];

export const operationsTimeline: OperationStep[] = [
  {
    step: 1,
    title: "Requirement Intake",
    description:
      "We assess your manpower needs — roles, headcount, shift patterns, compliance requirements, and site-specific conditions.",
    icon: "ClipboardList",
  },
  {
    step: 2,
    title: "Workforce Planning",
    description:
      "Sourcing, screening, and matching candidates to your operational requirements with structured selection criteria.",
    icon: "Search",
  },
  {
    step: 3,
    title: "Onboarding & Verification",
    description:
      "Document verification, compliance enrollment (ESIC/EPF), safety orientation, and site-specific induction.",
    icon: "ShieldCheck",
  },
  {
    step: 4,
    title: "Deployment & Supervision",
    description:
      "On-ground supervisors manage attendance, shift discipline, task allocation, and daily operational rhythm.",
    icon: "UserCheck",
  },
  {
    step: 5,
    title: "Reporting & Compliance Closure",
    description:
      "Structured reporting — attendance records, payroll inputs, compliance documentation — delivered in your preferred format.",
    icon: "FileText",
  },
];

export const complianceItems: ComplianceItem[] = [
  {
    title: "Statutory Registrations",
    description:
      "VSPL maintains active registrations under ESIC, EPF, GST, and MSME — ensuring every deployed worker is covered under applicable labour law frameworks.",
    registrations: ["ESIC", "EPF", "GST", "MSME"],
  },
  {
    title: "Audit-Ready Documentation",
    description:
      "Attendance records, wage registers, compliance filings, and workforce documentation are maintained in structured formats — inspection-ready at all times.",
  },
  {
    title: "Governance Controls",
    description:
      "Defined escalation protocols, disciplinary frameworks, and supervisory accountability layers ensure operational integrity across deployed teams.",
  },
];

export const setuFeatures: SetuFeature[] = [
  {
    title: "Attendance Integrity",
    description:
      "Structured attendance capture and verification — ensuring payroll accuracy and operational accountability.",
    icon: "Clock",
  },
  {
    title: "Compliance Documentation",
    description:
      "ESIC, EPF, and statutory documentation maintained with audit-trail discipline.",
    icon: "FileCheck",
  },
  {
    title: "Reporting Outputs",
    description:
      "Structured data delivery — Excel, CSV, or PDF — aligned to your payroll and compliance workflow.",
    icon: "BarChart3",
  },
  {
    title: "Operational Visibility",
    description:
      "Supervisory dashboards and shift-level tracking for deployed workforce performance.",
    icon: "Eye",
  },
];

export const faqs: FaqItem[] = [
  {
    question: "What industries does VSPL serve?",
    answer:
      "VSPL primarily serves warehousing and logistics, manufacturing, FMCG operations, institutional facilities, and hospitality-linked operations — primarily in the Haridwar–SIDCUL industrial region.",
  },
  {
    question: "How quickly can VSPL deploy a workforce?",
    answer:
      "Deployment timelines depend on headcount, role complexity, and compliance requirements. For standard warehouse and shopfloor roles, initial deployment can typically begin within 7–14 working days of requirement confirmation.",
  },
  {
    question: "What compliance documentation does VSPL maintain?",
    answer:
      "VSPL maintains ESIC and EPF enrollments for all deployed workers, along with attendance registers, wage records, and statutory filings — structured for inspection readiness.",
  },
  {
    question: "How does reporting and data delivery work?",
    answer:
      "Through Vayasya Setu, our operational control layer, attendance data, payroll inputs, and compliance reports are delivered in Excel, CSV, or PDF formats — aligned to your internal workflow.",
  },
  {
    question: "Does VSPL provide supervision on-site?",
    answer:
      "Yes. On-ground supervisors manage attendance, shift discipline, task allocation, and escalation — forming a direct accountability layer between VSPL and your site operations.",
  },
  {
    question: "What is the typical engagement model?",
    answer:
      "VSPL operates on contractual engagement models — typically structured around headcount, shift patterns, and service scope. Specific terms are defined during the requirement assessment phase.",
  },
];
