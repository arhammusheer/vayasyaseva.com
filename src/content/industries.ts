import type { IndustrySector } from "./types";

export const industries: IndustrySector[] = [
  {
    id: "manufacturing",
    title: "Manufacturing",
    description:
      "Integrated manufacturing support covering shopfloor workforce deployment, fabrication requirements, civil upkeep, and machinery maintenance support.",
    staffingPattern:
      "Shift-based deployment of helpers, packers, line feeders, technicians, and maintenance support crews aligned to production schedules.",
    riskControlNeeds:
      "Safety induction, permit discipline, attendance integrity, shutdown coordination, and incident reporting structures.",
    reportingCadence:
      "Daily attendance and work logs, weekly execution summaries, monthly compliance filings.",
    icon: "Factory",
  },
  {
    id: "warehousing-logistics",
    title: "Warehousing & Logistics",
    description:
      "Loading, unloading, picking, stacking, dispatch, and warehouse support services for logistics hubs and distribution centres.",
    staffingPattern:
      "Volume-driven deployment — scales with throughput requirements. Single or multi-shift operations.",
    riskControlNeeds:
      "Material handling safety, inventory accuracy discipline, staging protocols, and dispatch verification.",
    reportingCadence:
      "Daily attendance and deployment reports, shift-wise output logs, and monthly compliance packs.",
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
      "Quality handling standards, hygiene protocols, batch tracking discipline, and line-speed compliance requirements.",
    reportingCadence:
      "Daily deployment and output reports, weekly quality compliance, monthly statutory filings.",
    icon: "Package",
  },
  {
    id: "institutional-facilities",
    title: "Institutional Facilities",
    description:
      "Housekeeping for business and factory premises, pantry support, grounds maintenance, and facility operations support.",
    staffingPattern:
      "Stable deployment with defined schedules and trained labour teams for housekeeping, pantry, and grounds.",
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
      "Back-of-house, pantry, housekeeping, and guest-area support with trained labour for hospitality and hospitality-adjacent operations.",
    staffingPattern:
      "Split-shift and round-the-clock deployment. Role separation between guest-facing and back-of-house.",
    riskControlNeeds:
      "Guest interaction standards, hygiene compliance, grooming protocols, and incident escalation procedures.",
    reportingCadence:
      "Daily attendance and shift logs, monthly compliance and performance reports.",
    icon: "UtensilsCrossed",
  },
];
