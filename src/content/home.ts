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
  headline:
    "Compliance-First Services for Industrial Sites",
  subheadline:
    "Workforce deployment, civil and fabrication works, housekeeping support, equipment provisioning, and machinery maintenance — delivered with supervision, compliance discipline, and audit-ready documentation.",
  primaryCta: { label: "Share Your Requirement", href: "/contact" },
  secondaryCta: { label: "Request a Site Assessment", href: "/contact?type=assessment" },
};

/* ── Proof rail (compact evidence strip below hero) ── */

export const proofRail: ProofRailItem[] = [
  { label: "ESIC", value: "Registered", type: "registration" },
  { label: "EPF", value: "Registered", type: "registration" },
  { label: "GST", value: "Registered", type: "registration" },
  { label: "MSME", value: "UDYAM Certified", type: "registration" },
  { label: "Region", value: "Haridwar–SIDCUL", type: "region" },
];

/* ── Trust clients ── */

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

/* ── Service clusters ── */

export const servicesClusters: ServiceCluster[] = [
  {
    id: "warehouse-logistics",
    title: "Warehouse & Logistics Operations",
    description:
      "Loading, unloading, stacking, picking, dispatch, and staging — executed with supervision, shift discipline, and structured reporting.",
    roles: ["Loaders", "Pickers", "Stackers", "Dispatch Operators", "Staging Crew"],
    icon: "Warehouse",
    href: "/services#warehouse-logistics",
  },
  {
    id: "manufacturing-shopfloor",
    title: "Manufacturing & Shopfloor Support",
    description:
      "Helpers, packers, line feeders, and material handlers — deployed with safety alignment, attendance tracking, and output accountability.",
    roles: ["Helpers", "Packers", "Line Feeders", "Material Handlers"],
    icon: "Factory",
    href: "/services#manufacturing-shopfloor",
  },
  {
    id: "housekeeping-facility",
    title: "Housekeeping for Business & Factory Premises",
    description:
      "Trained housekeeping, pantry, and facility support teams for offices, plants, and institutional premises.",
    roles: ["Housekeepers", "Pantry Staff", "Facility Attendants", "BOH Staff"],
    icon: "Building2",
    href: "/services#housekeeping-facility",
  },
  {
    id: "civil-fabrication-works",
    title: "Civil & Fabrication Works",
    description:
      "Civil repair, fabrication, fitting, and installation support for plant modifications and industrial project execution.",
    roles: ["Civil Supervisors", "Masons", "Carpenters", "Fitters", "Welders"],
    icon: "Hammer",
    href: "/services#civil-works",
  },
  {
    id: "machinery-maintenance",
    title: "Machinery Maintenance & Equipment Support",
    description:
      "Preventive maintenance support, breakdown response coordination, and scoped equipment provisioning for ongoing operations.",
    roles: ["Maintenance Technicians", "Equipment Coordinators", "Maintenance Helpers"],
    icon: "Wrench",
    href: "/services#machinery-maintenance",
  },
  {
    id: "workforce-operations",
    title: "Workforce Operations Management",
    description:
      "Recruitment, onboarding, shift planning, discipline management, and supervision — the operating layer between your site and deployed teams.",
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
      "Scope, roles, crew size, shift patterns, compliance requirements, and site conditions — documented and confirmed before mobilization begins.",
    icon: "ClipboardList",
  },
  {
    step: 2,
    title: "Resource & Work Planning",
    description:
      "Workforce, technician crews, tools, and equipment planning aligned to your operational requirement. Selection and deployment criteria are confirmed jointly.",
    icon: "Search",
  },
  {
    step: 3,
    title: "Onboarding, Safety & Mobilization",
    description:
      "Document verification, ESIC/EPF enrolment where applicable, safety orientation, and site-specific induction — completed before start of work.",
    icon: "ShieldCheck",
  },
  {
    step: 4,
    title: "Execution & Supervision",
    description:
      "On-ground supervisors manage attendance, task allocation, quality checkpoints, and daily operational rhythm across workforce and project works.",
    icon: "UserCheck",
  },
  {
    step: 5,
    title: "Reporting & Compliance Closure",
    description:
      "Attendance records, work completion logs, maintenance updates, and compliance documentation delivered in Excel, CSV, or PDF formats.",
    icon: "FileText",
  },
];

/* ── Compliance (with claim classification) ── */

export const complianceItems: ComplianceItem[] = [
  {
    title: "Statutory Registrations",
    description:
      "Registrations include ESIC, EPF, GST, and MSME. Current status details are shared during due diligence. Deployed workers and service teams are onboarded under applicable statutory processes.",
    claim: "contractual",
    registrations: ["ESIC", "EPF", "GST", "MSME"],
  },
  {
    title: "Documentation Discipline",
    description:
      "Attendance records, wage registers, and compliance filings are maintained in structured formats. Documentation is organised for inspection readiness as a standard operating practice.",
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
      "Shift-level deployment tracking and supervisory reporting — providing structured visibility across workforce and service operations.",
    icon: "Eye",
  },
  {
    title: "Workforce-to-Shift Alignment",
    description:
      "Deployment suitability evaluated per shift — factoring in attendance patterns, role familiarity, and site conditions to support structured roster allocation. Progressively enabled across engagements.",
    icon: "UserCheck",
  },
  {
    title: "Exception & Escalation Protocols",
    description:
      "Attendance gaps, shift shortfalls, and documentation delays flagged through defined protocols — with tiered escalation and tracked resolution.",
    icon: "AlertTriangle",
  },
];

/* ── Persona blocks ── */

export const personaBlocks: PersonaBlock[] = [
  {
    role: "Plant / Operations Head",
    headline: "Right people on every shift",
    whatYouGet: [
      "Workers on time for each shift",
      "One on-site supervisor in charge",
      "Daily attendance and shift reports",
      "Fast issue escalation",
    ],
    whatYouDontManage: [
      "Hiring and screening workers",
      "ESIC/EPF paperwork and filings",
      "Replacing workers who leave",
      "Attendance checks and payroll inputs",
    ],
  },
  {
    role: "HR / Compliance Manager",
    headline: "Clean records and compliance support",
    whatYouGet: [
      "ESIC and EPF enrollment for workers",
      "Monthly compliance packs with challans",
      "Attendance and wage records",
      "Audit summaries when needed",
    ],
    whatYouDontManage: [
      "Statutory filings and challan generation",
      "Collecting and verifying worker documents",
      "Maintaining and storing records",
      "Tracking compliance deadlines",
    ],
  },
  {
    role: "Procurement / Commercial",
    headline: "Clear scope and predictable billing",
    whatYouGet: [
      "Clear scope with included and excluded items",
      "Simple rates by role and shift",
      "Contract terms with SLAs",
      "Monthly reports for invoice checks",
    ],
    whatYouDontManage: [
      "Headcount changes and replacements",
      "Shift premium calculations",
      "Statutory contribution calculations",
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
    category: "Workforce & Housekeeping Services",
    included: [
      "Sourcing, screening, and onboarding",
      "ESIC/EPF enrolment",
      "On-site supervision and shift management",
      "Attendance verification and reporting",
      "Replacement deployment for attrition",
      "Housekeeping teams for business and factory premises",
    ],
    notIncluded: [
      "Permanent placement or recruitment services",
      "Client-side HR policy definition",
    ],
    onRequest: [
      "Skilled machine operators or technicians",
      "Extended shift patterns beyond standard two-shift model",
      "Multi-location deployment coordination",
      "Custom reporting formats or integration alignment",
    ],
  },
  {
    category: "Civil, Fabrication & Maintenance Works",
    included: [
      "Civil repair and site-upkeep works",
      "Fabrication and installation support",
      "Routine machinery maintenance support",
      "Supervisor-led execution tracking and reporting",
    ],
    notIncluded: [
      "Licensed structural design certification and authority approvals",
      "OEM warranty adjudication or claim ownership",
      "Major redesign engineering consultancy",
    ],
    onRequest: [
      "Shutdown-window maintenance execution",
      "Custom fabrication for plant modifications",
      "Preventive maintenance calendars and tracking",
    ],
  },
  {
    category: "Equipment & Materials Support",
    included: [
      "Operational equipment provisioning for scoped engagements",
      "Cleaning tools, consumables, and usage support",
      "Issue tracking, replacement planning, and stock visibility",
    ],
    notIncluded: [
      "Transport fleet operations (coordinated through partners when needed)",
      "Client capex approval and asset capitalization decisions",
      "Statutory operator licenses mandated for specific equipment",
    ],
    onRequest: [
      "Category-wise procurement planning",
      "Rental equipment coordination for peak loads",
      "Site-level equipment audit and optimization support",
      "Transport coordination through partner network",
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
      "Deployment timelines depend on headcount, role complexity, and compliance requirements. For standard warehouse and shopfloor roles in the Haridwar–SIDCUL region, initial deployment typically begins within 7–14 business days of requirement confirmation. Actual timelines are confirmed during the scoping process.",
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
      "VSPL maintains a replacement pipeline for attrition. Replacement deployment timelines depend on role type and availability — typically within 3–5 working days for standard roles. Workforce operations can reduce absenteeism through planning, supervision, and escalation workflows; however, zero absenteeism cannot be guaranteed by any deployment partner.",
    category: "operations",
  },
  {
    question: "Does VSPL handle multi-shift operations?",
    answer:
      "Yes. VSPL deploys two-shift and three-shift rotational models with shift-level attendance tracking and handover protocols. Shift patterns are defined during requirement intake.",
    category: "operations",
  },
  {
    question: "How does VSPL decide which workers are deployed to each shift?",
    answer:
      "Where this capability is deployed, VSPL evaluates workforce readiness factors — including attendance history, role familiarity, site experience, and prevailing conditions — to support structured shift allocation. This process is designed to reduce deployment mismatches and improve roster stability. The scope and enablement of this capability are defined during engagement setup and vary by engagement.",
    category: "operations",
  },
  {
    question:
      "Does VSPL also support civil works, fabrication, housekeeping, equipment provisioning, and machinery maintenance?",
    answer:
      "Yes. VSPL delivers these services as part of integrated industrial engagements. Scope can be workforce-only, project-only, or mixed, and is documented during requirement assessment with clear included/not-included boundaries.",
    category: "operations",
  },
  // Compliance
  {
    question: "What compliance documentation does VSPL maintain?",
    answer:
      "VSPL maintains ESIC and EPF enrolments for deployed workers, along with attendance registers, wage records, and monthly contribution challans. Documentation is structured for inspection readiness.",
    category: "compliance",
  },
  {
    question: "Are deployed workers covered under ESIC and EPF?",
    answer:
      "Yes. ESIC and EPF enrolment is completed as part of the onboarding process for all eligible deployed workers, with monthly contributions maintained and documented.",
    category: "compliance",
  },
  {
    question: "Can VSPL provide a compliance pack for audit preparation?",
    answer:
      "Yes, on request. A consolidated compliance pack — including registration certificates, contribution challans, and workforce documentation summaries — can be prepared for client audit requirements. To request compliance documentation, contact us at help@vayasyaseva.com.",
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
    question: "Can Setu data integrate with our existing systems?",
    answer:
      "VSPL follows a managed integration model. Output data can be formatted for import into your existing HR or payroll systems — column mapping and format alignment are handled as part of the engagement setup. While a public self-serve API is not currently exposed, secure API access and ERP adapters can be enabled for qualified enterprise engagements through executive approval, scoped implementation, and governance review.",
    category: "integration",
  },
  // Commercial
  {
    question: "What is the typical engagement model?",
    answer:
      "VSPL operates on contractual engagement models structured around service scope, crew size, shift patterns, and execution windows. Engagements can combine workforce deployment, civil/fabrication work, housekeeping, equipment support, and machinery maintenance under a single operating framework.",
    category: "commercial",
  },
  {
    question: "Does VSPL operate transport fleets?",
    answer:
      "VSPL does not operate transport fleets directly. When transport coordination is needed, it is managed through established transporter partners — subject to scope and site requirements.",
    category: "commercial",
  },
];
