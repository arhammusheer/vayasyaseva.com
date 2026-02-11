import type { IndustrySector } from "./types";

export const industries: IndustrySector[] = [
  {
    id: "manufacturing",
    title: "Manufacturing",
    description:
      "Production support manpower for shopfloors, assembly lines, and packaging operations — deployed with shift discipline and supervisory controls.",
    staffingPattern:
      "Shift-based deployment of helpers, packers, line feeders, and material handlers. Headcount aligned to production schedules.",
    riskControlNeeds:
      "Safety induction, PPE discipline, attendance integrity, shift handover protocols, and incident reporting structures.",
    reportingCadence:
      "Daily attendance, weekly output summaries, monthly compliance filings.",
    icon: "Factory",
  },
  {
    id: "warehousing-logistics",
    title: "Warehousing & Logistics",
    description:
      "Loading, unloading, picking, stacking, and dispatch manpower for warehouses, distribution centres, and logistics hubs.",
    staffingPattern:
      "Volume-driven deployment — scales with throughput requirements. Single or multi-shift operations.",
    riskControlNeeds:
      "Material handling safety, inventory accuracy discipline, staging protocols, and dispatch verification.",
    reportingCadence:
      "Daily attendance and deployment reports, shift-wise output logs, monthly compliance packs.",
    icon: "Warehouse",
  },
  {
    id: "fmcg-consumer",
    title: "FMCG & Consumer Operations",
    description:
      "High-throughput packaging, labelling, sorting, and distribution support for fast-moving consumer goods operations.",
    staffingPattern:
      "Seasonal and demand-responsive deployment. Rapid ramp-up capability for peak periods.",
    riskControlNeeds:
      "Quality handling standards, hygiene protocols, batch tracking discipline, and line-speed compliance.",
    reportingCadence:
      "Daily deployment and output reports, weekly quality compliance, monthly statutory filings.",
    icon: "Package",
  },
  {
    id: "institutional-facilities",
    title: "Institutional Facilities",
    description:
      "Housekeeping, pantry, grounds maintenance, and facility support for corporate offices, campuses, and institutional sites.",
    staffingPattern:
      "Stable deployment with defined schedules. Role-specific teams for housekeeping, pantry, and grounds.",
    riskControlNeeds:
      "Grooming standards, visitor-area protocols, facility access controls, and hygiene compliance.",
    reportingCadence:
      "Daily attendance, monthly compliance and payroll reports.",
    icon: "Building2",
  },
  {
    id: "hospitality-linked",
    title: "Hospitality-Linked Operations",
    description:
      "Back-of-house, pantry, housekeeping, and guest-area support for hospitality and hospitality-adjacent operations.",
    staffingPattern:
      "Split-shift and round-the-clock deployment. Role separation between guest-facing and back-of-house.",
    riskControlNeeds:
      "Guest interaction standards, hygiene compliance, grooming protocols, and incident escalation procedures.",
    reportingCadence:
      "Daily attendance and shift logs, monthly compliance and performance reports.",
    icon: "UtensilsCrossed",
  },
];
