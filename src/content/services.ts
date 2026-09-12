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
    title: "Warehouse and logistics",
    description:
      "Contract workers for loading, unloading, picking, packing and dispatch. We help plan the team around your warehouse activity and shift requirements.",
    roles: [
      "Loading & Unloading Operators",
      "Stacking & Racking Staff",
      "Picking & Packing Operators",
      "Dispatch & Staging Crew",
      "Warehouse General Helpers",
      "Inventory Support Staff",
      "Forklift / MHE Operators",
    ],
    shiftPatterns: ["Planned around the engagement"],
    included: [
      "Workforce planning",
      "Site coordination",
      "Applicable workforce documentation",
    ],
    notIncluded: [],
    icon: "Warehouse",
  },
  {
    id: "manufacturing-shopfloor",
    title: "Manufacturing and shopfloor",
    description:
      "Production helpers, packers, line feeders and material handlers to support your shopfloor. Workforce planning takes your production needs and site procedures into account.",
    roles: [
      "Production Helpers",
      "Packers & Labellers",
      "Line Feeders",
      "Material Handlers",
      "Quality Check Assistants",
      "Housekeeping (Shopfloor)",
    ],
    shiftPatterns: ["Planned around the engagement"],
    included: [
      "Workforce planning",
      "Site coordination",
      "Applicable workforce documentation",
    ],
    notIncluded: [],
    icon: "Factory",
  },
  {
    id: "housekeeping-facility",
    title: "Housekeeping",
    description:
      "Housekeeping, pantry and facility support for offices, plants, campuses and hospitality environments. Teams and routines are planned around the premises.",
    roles: [
      "Housekeeping Staff",
      "Pantry & Cafeteria Assistants",
      "Washroom Attendants",
      "Guest-Area Support",
      "Back-of-House Staff",
      "Facility Maintenance Helpers",
    ],
    shiftPatterns: ["Planned around the engagement"],
    included: [
      "Workforce planning",
      "Site coordination",
      "Applicable workforce documentation",
    ],
    notIncluded: [],
    icon: "Building2",
  },
  {
    id: "civil-works",
    title: "Civil works",
    description:
      "Civil repairs, modifications and upkeep for factories and business premises, with coordination of the people, materials and work on site.",
    roles: [
      "Civil Supervisors",
      "Masons",
      "Shuttering Carpenters",
      "Bar Benders",
      "Civil Helpers",
      "Finishing Crew",
    ],
    shiftPatterns: ["Planned around the engagement"],
    included: [
      "Workforce planning",
      "Site coordination",
      "Applicable workforce documentation",
    ],
    notIncluded: [],
    icon: "Hammer",
  },
  {
    id: "fabrication-works",
    title: "Fabrication and installation",
    description:
      "MS and SS fabrication, fitting and installation for plant modifications and utility structures, working from the project requirements and approved drawings.",
    roles: [
      "Fabrication Supervisors",
      "Fitters",
      "Welders",
      "Gas Cutters",
      "Rigging Helpers",
      "Installation Technicians",
    ],
    shiftPatterns: ["Planned around the engagement"],
    included: [
      "Workforce planning",
      "Site coordination",
      "Applicable workforce documentation",
    ],
    notIncluded: [],
    icon: "Cog",
  },
  {
    id: "equipment-provisioning",
    title: "Equipment and tools",
    description:
      "Tools, material-handling aids, housekeeping equipment and consumables to support the work on site.",
    roles: [
      "Equipment Coordinators",
      "Stores & Issue Assistants",
      "Inventory Support Staff",
      "Maintenance Helpers",
    ],
    shiftPatterns: ["Planned around the engagement"],
    included: [
      "Workforce planning",
      "Site coordination",
      "Applicable workforce documentation",
    ],
    notIncluded: [],
    icon: "Package",
  },
  {
    id: "machinery-maintenance",
    title: "Machinery maintenance",
    description:
      "Routine upkeep, preventive maintenance and breakdown support in coordination with your site team.",
    roles: [
      "Maintenance Supervisors",
      "Mechanical Technicians",
      "Electrical Assistants",
      "Maintenance Helpers",
      "Shutdown Crew",
    ],
    shiftPatterns: ["Planned around the engagement"],
    included: [
      "Workforce planning",
      "Site coordination",
      "Applicable workforce documentation",
    ],
    notIncluded: [],
    icon: "Wrench",
  },
  {
    id: "workforce-operations",
    title: "Workforce operations",
    description:
      "Contract labour sourcing, onboarding, attendance and site coordination. We bring the people and the supporting administration together for your operation.",
    roles: [
      "Field Supervisors",
      "Shift Coordinators",
      "Onboarding Coordinators",
      "Attendance Officers",
      "Discipline and grievance handlers",
    ],
    shiftPatterns: ["Planned around the engagement"],
    included: [
      "Workforce planning",
      "Site coordination",
      "Applicable workforce documentation",
    ],
    notIncluded: [],
    icon: "Users",
  },
  {
    id: "horticulture",
    title: "Horticulture and grounds",
    description:
      "Gardeners and grounds teams for the care of green spaces at industrial campuses, business premises and institutional sites.",
    roles: [
      "Gardeners",
      "Grounds Maintenance Crew",
      "Landscaping Helpers",
      "Lawn & Green-Area Attendants",
    ],
    shiftPatterns: ["Planned around the engagement"],
    included: [
      "Workforce planning",
      "Site coordination",
      "Applicable workforce documentation",
    ],
    notIncluded: [],
    icon: "TreePine",
  },
  {
    id: "seasonal-rampup",
    title: "Seasonal and project ramp-up",
    description:
      "Additional workforce for busy periods, new projects and changes in production demand. The team and mobilisation plan are discussed around your timing.",
    roles: [
      "General Helpers",
      "Loaders & Unloaders",
      "Packers",
      "Event/Project Support Staff",
    ],
    shiftPatterns: ["Planned around the engagement"],
    included: [
      "Workforce planning",
      "Site coordination",
      "Applicable workforce documentation",
    ],
    notIncluded: [],
    icon: "TrendingUp",
  },
];
