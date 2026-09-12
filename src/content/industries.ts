import type { IndustrySector } from "./types";

export const industries: IndustrySector[] = [
  {
    id: "manufacturing",
    title: "Manufacturing",
    description:
      "Shopfloor crews, fabrication for plant modifications, civil upkeep, and maintenance technicians for production plants.",
    staffingPattern:
      "Helpers, packers, line feeders, technicians, and maintenance crews on the plant's shift pattern.",
    riskControlNeeds:
      "Safety induction, permit-to-work, attendance, shutdown coordination, incident reporting.",
    reportingCadence: "Reporting arrangements discussed with your team.",
    icon: "Factory",
  },
  {
    id: "warehousing-logistics",
    title: "Warehousing and logistics",
    description:
      "Loading, unloading, picking, stacking, and dispatch crews for logistics hubs and distribution centres.",
    staffingPattern:
      "Headcount scales with throughput. Single or multi-shift.",
    riskControlNeeds:
      "Material handling safety, inventory accuracy, staging, dispatch verification.",
    reportingCadence: "Reporting arrangements discussed with your team.",
    icon: "Warehouse",
  },
  {
    id: "fmcg-consumer",
    title: "FMCG and consumer goods",
    description:
      "Packaging, labelling, sorting, and distribution crews for high-throughput consumer goods lines.",
    staffingPattern:
      "Seasonal and demand-driven. Ramp-up for peak periods.",
    riskControlNeeds:
      "Hygiene, handling standards, batch tracking, line-speed requirements.",
    reportingCadence: "Reporting arrangements discussed with your team.",
    icon: "Package",
  },
  {
    id: "institutional-facilities",
    title: "Institutional facilities",
    description:
      "Housekeeping, pantry, grounds, and facility staff for offices, campuses, and institutional buildings.",
    staffingPattern:
      "Fixed schedules and stable teams.",
    riskControlNeeds:
      "Grooming standards, visitor-area conduct, access control, hygiene.",
    reportingCadence: "Reporting arrangements discussed with your team.",
    icon: "Building2",
  },
  {
    id: "hospitality-linked",
    title: "Hospitality-linked operations",
    description:
      "Back-of-house, pantry, housekeeping, and guest-area staff for hospitality and hospitality-adjacent sites.",
    staffingPattern:
      "Split shifts and round-the-clock cover. Guest-facing and back-of-house roles kept separate.",
    riskControlNeeds:
      "Guest interaction standards, hygiene, grooming, incident escalation.",
    reportingCadence: "Reporting arrangements discussed with your team.",
    icon: "UtensilsCrossed",
  },
];
