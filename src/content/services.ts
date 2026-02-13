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
      "End-to-end warehouse and logistics operations support — from goods receipt to dispatch — delivered through trained teams, supervision, and workflow discipline.",
    roles: [
      "Loading & Unloading Operators",
      "Stacking & Racking Staff",
      "Picking & Packing Operators",
      "Dispatch & Staging Crew",
      "Warehouse General Helpers",
      "Inventory Support Staff",
      "Forklift / MHE Operators",
    ],
    shiftPatterns: [
      "Single shift",
      "Double shift",
      "Rotational",
      "Seasonal ramp-up",
    ],
    included: [
      "Workforce sourcing and screening",
      "ESIC/EPF enrolment",
      "On-site supervision",
      "Attendance and shift management",
      "Payroll-aligned reporting",
      "Replacement deployment for attrition",
      "Specialized forklift or MHE operators (if required and scoped)",
      "Operational equipment support planning for warehouse functions",
    ],
    notIncluded: [
      "Transport fleet ownership and line-haul operations",
      "Client-side ERP or WMS license provisioning",
      "Inventory carrying-cost accountability",
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
    shiftPatterns: [
      "Single shift",
      "Double shift",
      "Three-shift rotation",
      "Project-based",
    ],
    included: [
      "Workforce sourcing and screening",
      "ESIC/EPF enrolment",
      "Safety orientation and site induction",
      "On-site supervision",
      "Attendance and output tracking",
      "Compliance documentation",
      "Shift-aligned housekeeping support inside shopfloor areas",
    ],
    notIncluded: [
      "Product engineering ownership or process redesign",
      "Regulated QA/QC certification sign-off by third-party auditors",
      "Client-owned SOP authoring",
    ],
    icon: "Factory",
  },
  {
    id: "housekeeping-facility",
    title: "Housekeeping for Business & Factory Premises",
    description:
      "Trained housekeeping and facility support teams for business offices, industrial plants, factory premises, institutional campuses, and hospitality-linked environments.",
    roles: [
      "Housekeeping Staff",
      "Pantry & Cafeteria Assistants",
      "Washroom Attendants",
      "Guest-Area Support",
      "Back-of-House Staff",
      "Facility Maintenance Helpers",
    ],
    shiftPatterns: [
      "Day shift",
      "Split shift",
      "Round-the-clock",
      "Event-based",
    ],
    included: [
      "Trained labour deployment with grooming standards",
      "ESIC/EPF enrolment",
      "On-site supervision",
      "Attendance management",
      "Replacement coverage",
      "Compliance reporting",
      "Cleaning tools and equipment provisioning (as scoped)",
      "Consumables and replenishment coordination (as scoped)",
    ],
    notIncluded: [
      "Licensed pest-control services requiring statutory contractors",
      "Hazmat handling outside agreed cleaning protocol",
      "Front-desk or reception-trained staff",
      "F&B preparation or cooking",
    ],
    icon: "Building2",
  },
  {
    id: "civil-works",
    title: "Civil Works for Industrial & Commercial Sites",
    description:
      "Civil repair, modification, and upkeep works across factories and business premises — executed with trained crews, site supervision, and schedule discipline.",
    roles: [
      "Civil Supervisors",
      "Masons",
      "Shuttering Carpenters",
      "Bar Benders",
      "Civil Helpers",
      "Finishing Crew",
    ],
    shiftPatterns: [
      "Day shift",
      "Extended shift",
      "Shutdown-window execution",
      "Project-based",
    ],
    included: [
      "Site survey and requirement scoping support",
      "Civil repair, modification, and finishing works",
      "Material and equipment requirement planning",
      "Supervisor-led execution and progress tracking",
      "Safety alignment with client EHS protocols",
    ],
    notIncluded: [
      "Government approval processing and permit filing ownership",
      "Licensed structural design certification",
      "Architectural consultancy scope",
    ],
    icon: "Hammer",
  },
  {
    id: "fabrication-works",
    title: "Fabrication Works & Installation Support",
    description:
      "MS/SS fabrication, assembly, and installation support for industrial modifications, utility structures, and plant-side execution requirements.",
    roles: [
      "Fabrication Supervisors",
      "Fitters",
      "Welders",
      "Gas Cutters",
      "Rigging Helpers",
      "Installation Technicians",
    ],
    shiftPatterns: [
      "Day shift",
      "Double shift",
      "Shutdown-window execution",
      "Project-based",
    ],
    included: [
      "Fabrication and fit-up as per approved drawings",
      "On-site fabrication team deployment",
      "Welding, cutting, and assembly support",
      "Installation and alignment support",
      "Supervisor-led QA checkpoints and reporting",
    ],
    notIncluded: [
      "Design engineering ownership for unissued drawings",
      "OEM intellectual-property restricted fabrication without authorization",
      "Independent third-party certification unless contracted",
    ],
    icon: "Cog",
  },
  {
    id: "equipment-provisioning",
    title: "Equipment Provisioning & Operational Tools Support",
    description:
      "Provisioning of operational equipment and tools for scoped engagements, including housekeeping kits, material-handling aids, and site-use accessories.",
    roles: [
      "Equipment Coordinators",
      "Stores & Issue Assistants",
      "Inventory Support Staff",
      "Maintenance Helpers",
    ],
    shiftPatterns: ["Day shift", "As per operational schedule"],
    included: [
      "Requirement mapping for equipment and tools",
      "Procurement and provisioning coordination",
      "On-site issue tracking and replacement planning",
      "Consumable replenishment cycles",
      "Support documentation for operational audits",
    ],
    notIncluded: [
      "Capital budgeting approval owned by client procurement",
      "Fuel and utility costs for client-owned heavy assets",
      "Equipment operation licenses held by client/OEM where mandated",
    ],
    icon: "Package",
  },
  {
    id: "machinery-maintenance",
    title: "Machinery Maintenance Support",
    description:
      "Planned and reactive machinery maintenance support through trained technicians for industrial operations, including preventive routines and breakdown response coordination.",
    roles: [
      "Maintenance Supervisors",
      "Mechanical Technicians",
      "Electrical Assistants",
      "Maintenance Helpers",
      "Shutdown Crew",
    ],
    shiftPatterns: [
      "Day shift",
      "Round-the-clock on call",
      "Preventive maintenance windows",
      "Shutdown-based execution",
    ],
    included: [
      "Preventive maintenance task execution support",
      "Breakdown response coordination with site teams",
      "Routine inspection and upkeep checklists",
      "Maintenance logs and closure reporting",
      "Spare usage tracking support",
    ],
    notIncluded: [
      "OEM warranty policy decisions and claim approvals",
      "Major OEM overhauls requiring proprietary tooling unless arranged",
      "Root-cause engineering redesign ownership",
    ],
    icon: "Wrench",
  },
  {
    id: "workforce-operations",
    title: "On-Ground Workforce Operations",
    description:
      "Complete workforce operations management — from recruitment to deployment supervision. VSPL acts as the operating layer between your site requirements and execution teams.",
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
      "Permanent staffing conversion guarantees",
    ],
    icon: "TrendingUp",
  },
];
