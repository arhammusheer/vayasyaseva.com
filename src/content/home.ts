import type {
  HeroContent,
  ProofRailItem,
  TrustClient,
  Registration,
  ServiceCluster,
  OperationStep,
  ComplianceItem,
  SetuFeature,
  FaqItem,
  PersonaBlock,
  EngagementModel,
  ScopeBoundary,
} from "./types";

/* ── Hero ── */

export const hero: HeroContent = {
  headline: "Compliance-First Workforce Operations for Industrial Sites",
  subheadline:
    "Structured workforce deployment for warehouses, factories, and facilities — with supervision, attendance integrity, and audit-ready documentation built into every engagement.",
  primaryCta: { label: "Share Your Requirement", href: "/contact" },
  secondaryCta: { label: "Book Site Assessment", href: "/contact?type=assessment" },
};

/* ── Proof rail (compact evidence strip below hero) ── */

export const proofRail: ProofRailItem[] = [
  { label: "ESIC", value: "Registered", type: "registration" },
  { label: "EPF", value: "Registered", type: "registration" },
  { label: "GST", value: "Registered", type: "registration" },
  { label: "MSME", value: "UDYAM Certified", type: "registration" },
  { label: "Response", value: "Within 2 working days", type: "cadence" },
  { label: "Region", value: "Haridwar–SIDCUL", type: "region" },
];

/* ── Trust clients ── */

export const trustClients: TrustClient[] = [
  {
    name: "ITC Limited",
    logoLight: "/assets/clients/ITC-light.png",
    logoDark: "/assets/clients/ITC-dark.png",
    visible: true,
    context: "Industrial operations",
  },
  {
    name: "Wipro",
    logoLight: "/assets/clients/Wipro-light.png",
    logoDark: "/assets/clients/Wipro-dark.png",
    visible: true,
    context: "Facility operations",
  },
  {
    name: "Unilever",
    logoLight: "/assets/clients/Unilever-light.png",
    logoDark: "/assets/clients/Unilever-dark.png",
    visible: true,
    context: "Warehouse operations",
  },
];

export const registrations: Registration[] = [
  { label: "ESIC", value: "Registered" },
  { label: "EPF", value: "Registered" },
  { label: "GST", value: "Registered" },
  { label: "MSME", value: "Certified" },
];

/* ── Service clusters ── */

export const servicesClusters: ServiceCluster[] = [
  {
    id: "warehouse-logistics",
    title: "Warehouse & Logistics Operations",
    description:
      "Loading, unloading, stacking, picking, dispatch, and staging — deployed with shift discipline, supervision, and structured reporting.",
    roles: ["Loaders", "Pickers", "Stackers", "Dispatch Operators", "Staging Crew"],
    icon: "Warehouse",
    href: "/services#warehouse-logistics",
  },
  {
    id: "manufacturing-shopfloor",
    title: "Manufacturing & Shopfloor Support",
    description:
      "Helpers, packers, line feeders, and material handlers — deployed with safety orientation, attendance tracking, and output accountability.",
    roles: ["Helpers", "Packers", "Line Feeders", "Material Handlers"],
    icon: "Factory",
    href: "/services#manufacturing-shopfloor",
  },
  {
    id: "housekeeping-facility",
    title: "Facility & Hospitality Support",
    description:
      "Housekeeping, pantry, back-of-house, and guest-area staffing — with grooming standards, scheduling, and supervisory oversight.",
    roles: ["Housekeepers", "Pantry Staff", "BOH Staff", "Guest-Area Staff"],
    icon: "Building2",
    href: "/services#housekeeping-facility",
  },
  {
    id: "workforce-operations",
    title: "Workforce Operations Management",
    description:
      "Recruitment, onboarding, shift planning, discipline management, and supervision — the operating layer between your site and the deployed team.",
    roles: ["Supervisors", "Shift Coordinators", "Onboarding Leads"],
    icon: "Users",
    href: "/services#workforce-operations",
  },
];

/* ── Operations timeline ── */

export const operationsTimeline: OperationStep[] = [
  {
    step: 1,
    title: "Requirement Intake",
    description:
      "Roles, headcount, shift patterns, compliance requirements, and site-specific conditions — documented and confirmed before any sourcing begins.",
    icon: "ClipboardList",
  },
  {
    step: 2,
    title: "Workforce Planning",
    description:
      "Sourcing, screening, and matching against your operational requirements. Selection criteria defined jointly with your operations team.",
    icon: "Search",
  },
  {
    step: 3,
    title: "Onboarding & Verification",
    description:
      "Document verification, ESIC/EPF enrollment, safety orientation, and site-specific induction — completed before first deployment day.",
    icon: "ShieldCheck",
  },
  {
    step: 4,
    title: "Deployment & Supervision",
    description:
      "On-ground supervisors manage attendance, shift discipline, task allocation, and daily operational rhythm. Escalation protocols are active from day one.",
    icon: "UserCheck",
  },
  {
    step: 5,
    title: "Reporting & Compliance Closure",
    description:
      "Attendance records, payroll inputs, and compliance documentation delivered in Excel, CSV, or PDF — aligned to your internal workflow and calendar.",
    icon: "FileText",
  },
];

/* ── Compliance (with claim classification) ── */

export const complianceItems: ComplianceItem[] = [
  {
    title: "Statutory Registrations",
    description:
      "VSPL maintains active registrations under ESIC, EPF, GST, and MSME. Deployed workers are enrolled under applicable statutory schemes as part of the onboarding process.",
    claim: "contractual",
    registrations: ["ESIC", "EPF", "GST", "MSME"],
  },
  {
    title: "Documentation Discipline",
    description:
      "Attendance records, wage registers, and compliance filings are maintained in structured formats. Documentation is organized for inspection readiness as a standard operating practice.",
    claim: "directional",
  },
  {
    title: "Governance Controls",
    description:
      "Defined escalation protocols, disciplinary frameworks, and supervisory accountability layers support operational integrity across deployed teams.",
    claim: "directional",
  },
];

/* ── Setu features ── */

export const setuFeatures: SetuFeature[] = [
  {
    title: "Attendance Integrity",
    description:
      "Structured attendance capture and verification — supporting payroll accuracy and shift-level accountability.",
    icon: "Clock",
  },
  {
    title: "Compliance Documentation",
    description:
      "ESIC, EPF, and statutory documentation maintained with defined verification workflows.",
    icon: "FileCheck",
  },
  {
    title: "Reporting Outputs",
    description:
      "Data delivered in Excel, CSV, or PDF — formatted for your payroll system, compliance calendar, or internal reporting requirements.",
    icon: "BarChart3",
  },
  {
    title: "Operational Visibility",
    description:
      "Shift-level deployment tracking and supervisory reporting — providing structured visibility into workforce operations.",
    icon: "Eye",
  },
];

/* ── Persona blocks ── */

export const personaBlocks: PersonaBlock[] = [
  {
    role: "Plant / Operations Head",
    headline: "Reliable deployment, structured supervision",
    whatYouGet: [
      "Shift-ready workforce deployed per your schedule",
      "On-site supervisor as single point of accountability",
      "Daily attendance and deployment reports",
      "Defined escalation protocol for operational issues",
    ],
    whatYouDontManage: [
      "Recruitment sourcing and screening",
      "ESIC/EPF enrollment and compliance filings",
      "Worker replacement on attrition",
      "Attendance verification and payroll inputs",
    ],
  },
  {
    role: "HR / Compliance Manager",
    headline: "Inspection-ready documentation, statutory coverage",
    whatYouGet: [
      "ESIC and EPF enrollment for deployed workers",
      "Monthly compliance packs with contribution challans",
      "Structured attendance and wage records",
      "Compliance summary on request for audit preparation",
    ],
    whatYouDontManage: [
      "Statutory filing and challan generation",
      "Worker document verification",
      "Record maintenance and retention",
      "Compliance calendar tracking",
    ],
  },
  {
    role: "Procurement / Commercial",
    headline: "Clear scope, defined deliverables",
    whatYouGet: [
      "Defined service scope with included/not-included boundaries",
      "Transparent rate structure aligned to role and shift pattern",
      "Contractual terms with SLA commitments",
      "Monthly reconciliation-ready reporting",
    ],
    whatYouDontManage: [
      "Headcount variability and replacement logistics",
      "Shift premium calculations",
      "Statutory contribution computation",
      "Overtime and attendance reconciliation",
    ],
  },
];

/* ── Engagement models ── */

export const engagementModels: EngagementModel[] = [
  {
    type: "Long-Term Deployment",
    description:
      "Ongoing workforce for stable operations. Defined headcount, shift patterns, and supervisory structure with monthly reporting cycles.",
    typicalDuration: "6+ months",
    icon: "CalendarDays",
  },
  {
    type: "Seasonal / Project Ramp-Up",
    description:
      "Rapid scaling for demand spikes or project requirements. Accelerated onboarding with short-term compliance coverage.",
    typicalDuration: "1–6 months",
    icon: "TrendingUp",
  },
  {
    type: "Multi-Shift Operations",
    description:
      "Two or three-shift deployment with rotational scheduling, handover protocols, and shift-level attendance tracking.",
    typicalDuration: "As per operations",
    icon: "Clock",
  },
];

/* ── Scope boundaries ── */

export const scopeBoundaries: ScopeBoundary[] = [
  {
    category: "Workforce Deployment",
    included: [
      "Sourcing, screening, and onboarding",
      "ESIC/EPF enrollment",
      "On-site supervision and shift management",
      "Attendance verification and reporting",
      "Replacement deployment for attrition",
    ],
    notIncluded: [
      "Skilled machine operators or technicians",
      "Permanent placement or recruitment services",
      "Client-side HR policy definition",
    ],
    onRequest: [
      "Extended shift patterns beyond standard 2-shift model",
      "Multi-location deployment coordination",
      "Custom reporting formats or integration alignment",
    ],
  },
  {
    category: "Compliance & Documentation",
    included: [
      "Statutory filings (ESIC/EPF contributions)",
      "Attendance registers and wage records",
      "Monthly compliance packs",
    ],
    notIncluded: [
      "Client-side statutory obligations",
      "Insurance beyond statutory requirements",
      "Legal representation in disputes",
    ],
    onRequest: [
      "Consolidated compliance pack for audit preparation",
      "Custom documentation formats",
      "Historical records retrieval beyond standard retention",
    ],
  },
  {
    category: "Operations & Logistics",
    included: [
      "On-ground supervision",
      "Escalation management",
      "Shift planning and allocation",
    ],
    notIncluded: [
      "Transport fleet operations (coordinated through partners when needed)",
      "Infrastructure, equipment, or PPE supply",
      "Product-specific technical training",
    ],
    onRequest: [
      "Transport coordination through partner network",
      "Site assessment and deployment planning",
      "Scoping for new locations outside primary region",
    ],
  },
];

/* ── FAQ (categorised by persona/use-case) ── */

export const faqs: FaqItem[] = [
  // Operations
  {
    question: "How quickly can VSPL deploy a workforce?",
    answer:
      "Deployment timelines depend on headcount, role complexity, and compliance requirements. For standard warehouse and shopfloor roles in the Haridwar–SIDCUL region, initial deployment typically begins within 7–14 working days of requirement confirmation.",
    category: "operations",
  },
  {
    question: "Does VSPL provide on-site supervision?",
    answer:
      "Yes. On-ground supervisors manage attendance, shift discipline, task allocation, and escalation. The supervisor acts as the primary accountability layer between VSPL and your site operations.",
    category: "operations",
  },
  {
    question: "What happens if a deployed worker leaves or is absent?",
    answer:
      "VSPL maintains a replacement pipeline for attrition. Replacement deployment timelines depend on role type and availability — typically within 3–5 working days for standard roles.",
    category: "operations",
  },
  {
    question: "Does VSPL handle multi-shift operations?",
    answer:
      "Yes. VSPL deploys two-shift and three-shift rotational models with shift-level attendance tracking and handover protocols. Shift patterns are defined during requirement intake.",
    category: "operations",
  },
  // Compliance
  {
    question: "What compliance documentation does VSPL maintain?",
    answer:
      "VSPL maintains ESIC and EPF enrollments for deployed workers, along with attendance registers, wage records, and monthly contribution challans. Documentation is structured for inspection readiness.",
    category: "compliance",
  },
  {
    question: "Are deployed workers covered under ESIC and EPF?",
    answer:
      "Yes. ESIC and EPF enrollment is completed as part of the onboarding process for all eligible deployed workers, with monthly contributions maintained and documented.",
    category: "compliance",
  },
  {
    question: "Can VSPL provide a compliance pack for audit preparation?",
    answer:
      "Yes, on request. A consolidated compliance pack — including registration certificates, contribution challans, and workforce documentation summaries — can be prepared for client audit requirements.",
    category: "compliance",
  },
  // Integration / Setu
  {
    question: "How does reporting and data delivery work?",
    answer:
      "Through Vayasya Setu, attendance data, payroll inputs, and compliance reports are delivered in Excel, CSV, or PDF formats. Delivery cadence and format are aligned to your internal workflow during onboarding.",
    category: "integration",
  },
  {
    question: "Do we need to use any software from VSPL?",
    answer:
      "No. Vayasya Setu is VSPL's internal operating system. Clients receive structured outputs (reports, data files) — not software access. Optional read-only visibility can be discussed based on engagement scope.",
    category: "integration",
  },
  {
    question: "Can Setu data integrate with our existing payroll system?",
    answer:
      "VSPL can format output data for import into your existing HR or payroll systems — column mapping and format alignment are handled as part of the engagement setup. Direct API integration is not currently offered.",
    category: "integration",
  },
  // Commercial
  {
    question: "What is the typical engagement model?",
    answer:
      "VSPL operates on contractual engagement models — structured around headcount, shift patterns, and service scope. Terms are defined during the requirement assessment phase, with included/not-included boundaries documented.",
    category: "commercial",
  },
  {
    question: "Does VSPL operate transport fleets?",
    answer:
      "VSPL does not operate transport fleets directly. When transport coordination is needed, it is managed through established transporter partners — subject to scope and site requirements.",
    category: "commercial",
  },
];
