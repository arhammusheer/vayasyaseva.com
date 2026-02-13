export interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  roles: string[];
  shiftPatterns: string[];
  included: string[];
  notIncluded: string[];
  icon: string;
}

export const services: ServiceDetail[] = [
  {
    id: "warehouse-logistics",
    title: "Warehouse & Logistics Operations",
    description:
      "End-to-end workforce deployment for warehouse and logistics operations — from goods receipt to dispatch. VSPL deploys trained associates with on-ground supervision to maintain throughput discipline and operational continuity.",
    roles: [
      "Loading & Unloading Operators",
      "Stacking & Racking Staff",
      "Picking & Packing Operators",
      "Dispatch & Staging Crew",
      "Warehouse General Helpers",
      "Inventory Support Staff",
    ],
    shiftPatterns: ["Single shift", "Double shift", "Rotational", "Seasonal ramp-up"],
    included: [
      "Workforce sourcing and screening",
      "ESIC/EPF enrolment",
      "On-site supervision",
      "Attendance and shift management",
      "Payroll-aligned reporting",
      "Replacement deployment for attrition",
    ],
    notIncluded: [
      "Warehouse infrastructure or equipment",
      "Transport/fleet operations",
      "Specialized forklift or MHE certification",
      "Client-side ERP or WMS access provisioning",
    ],
    icon: "Warehouse",
  },
  {
    id: "manufacturing-shopfloor",
    title: "Manufacturing & Shopfloor Support",
    description:
      "Production support workforce for manufacturing environments — helpers, packers, line feeders, and material handlers deployed with shift discipline and supervisory oversight.",
    roles: [
      "Production Helpers",
      "Packers & Labellers",
      "Line Feeders",
      "Material Handlers",
      "Quality Check Assistants",
      "Housekeeping (Shopfloor)",
    ],
    shiftPatterns: ["Single shift", "Double shift", "Three-shift rotation", "Project-based"],
    included: [
      "Workforce sourcing and screening",
      "ESIC/EPF enrolment",
      "Safety orientation and site induction",
      "On-site supervision",
      "Attendance and output tracking",
      "Compliance documentation",
    ],
    notIncluded: [
      "PPE or safety equipment provisioning",
      "Product-specific technical training",
      "QC/QA certification responsibilities",
    ],
    icon: "Factory",
  },
  {
    id: "housekeeping-facility",
    title: "Housekeeping, Facility & Hospitality Support",
    description:
      "Staffing for housekeeping, pantry, back-of-house, and guest-facing operations across corporate facilities, institutional campuses, and hospitality-linked sites.",
    roles: [
      "Housekeeping Staff",
      "Pantry & Cafeteria Assistants",
      "Washroom Attendants",
      "Guest-Area Support",
      "Back-of-House Staff",
      "Facility Maintenance Helpers",
    ],
    shiftPatterns: ["Day shift", "Split shift", "Round-the-clock", "Event-based"],
    included: [
      "Staff sourcing and grooming standards",
      "ESIC/EPF enrolment",
      "On-site supervision",
      "Attendance management",
      "Replacement coverage",
      "Compliance reporting",
    ],
    notIncluded: [
      "Cleaning chemicals or equipment supply",
      "Specialized pest control or deep-cleaning services",
      "Front-desk or reception-trained staff",
      "F&B preparation or cooking",
    ],
    icon: "Building2",
  },
  {
    id: "workforce-operations",
    title: "On-Ground Workforce Operations",
    description:
      "Complete workforce operations management — from recruitment to deployment supervision. VSPL acts as the operational layer between your site requirements and the deployed workforce.",
    roles: [
      "Field Supervisors",
      "Shift Coordinators",
      "Onboarding Coordinators",
      "Attendance Officers",
      "Discipline & Grievance Handlers",
    ],
    shiftPatterns: ["Aligned to client operations"],
    included: [
      "Recruitment and onboarding pipeline",
      "Shift planning and allocation",
      "Daily attendance verification",
      "Supervisory discipline enforcement",
      "Escalation management",
      "Structured reporting to client",
    ],
    notIncluded: [
      "Client HR policy definition",
      "Strategic workforce planning or analytics",
      "Permanent placement or recruitment services",
    ],
    icon: "Users",
  },
  {
    id: "horticulture",
    title: "Horticulture & Grounds Maintenance",
    description:
      "Grounds maintenance, landscaping upkeep, and green-area management for industrial campuses, corporate facilities, and institutional sites.",
    roles: [
      "Gardeners",
      "Grounds Maintenance Crew",
      "Landscaping Helpers",
      "Lawn & Green-Area Attendants",
    ],
    shiftPatterns: ["Day shift", "Seasonal"],
    included: [
      "Workforce deployment",
      "Supervision and scheduling",
      "Attendance management",
      "Compliance documentation",
    ],
    notIncluded: [
      "Landscaping design or architecture",
      "Plant/material procurement",
      "Specialized arboriculture or pest management",
    ],
    icon: "TreePine",
  },
  {
    id: "seasonal-rampup",
    title: "Seasonal & Project-Based Workforce Ramp-Up",
    description:
      "Rapid workforce scaling for seasonal demand spikes, project-based requirements, or short-term operational surges — with structured onboarding and compliance coverage.",
    roles: [
      "General Helpers",
      "Loaders & Unloaders",
      "Packers",
      "Event/Project Support Staff",
    ],
    shiftPatterns: ["Project-duration", "Seasonal", "Burst deployment"],
    included: [
      "Rapid sourcing pipeline",
      "Accelerated onboarding",
      "Short-term compliance coverage",
      "On-site supervision during deployment",
      "Exit documentation and closure",
    ],
    notIncluded: [
      "Long-term retention commitments for seasonal staff",
      "Specialized skilled labour for short-duration needs",
    ],
    icon: "TrendingUp",
  },
];
