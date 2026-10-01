import type { FaqItem } from "./types";

export interface ServiceLandingContent {
  slug: string;
  /** Service id in services.ts that this page expands. */
  serviceId: string;
  name: string;
  metaTitle: string;
  description: string;
  heading: string;
  lede: string;
  roles: string[];
  planning: string;
  related: { href: string; label: string }[];
  faqs: FaqItem[];
}

/**
 * Short landing pages for the service searches buyers make most often.
 * Each expands one section of /services; keep them distinct and factual.
 */
export const servicePages: ServiceLandingContent[] = [
  {
    slug: "warehouse-labour",
    serviceId: "warehouse-logistics",
    name: "Warehouse labour",
    metaTitle: "Warehouse Labour Supplier in SIDCUL Haridwar",
    description:
      "Loading, unloading, picking, packing and dispatch labour for warehouses in SIDCUL and across Haridwar, with site coordination and EPF/ESIC workforce records.",
    heading: "Warehouse labour in SIDCUL and across Haridwar.",
    lede: "Loading, unloading, picking, packing and dispatch teams, planned around your inbound and outbound activity.",
    roles: [
      "Loading and unloading",
      "Picking and packing",
      "Stacking and racking",
      "Dispatch and staging",
      "Inventory support",
      "Forklift and MHE operation",
      "Data entry operators (ERP / SAP)",
    ],
    planning:
      "Tell us the dock hours, vehicle movements, shift pattern and peak days. We plan the team and supervision around that activity and discuss changes as volumes move.",
    related: [
      { href: "/services/loading-unloading-labour", label: "Loading and unloading labour" },
      { href: "/services/factory-labour", label: "Factory labour" },
      { href: "/services/housekeeping", label: "Housekeeping" },
      { href: "/services/contract-labour", label: "How contract labour works" },
    ],
    faqs: [
      {
        question: "Do you supply loading and unloading labour for SIDCUL warehouses?",
        answer:
          "Yes. We plan loading, unloading, stacking and dispatch teams for warehouses and distribution sites in SIDCUL and across Haridwar.",
        category: "operations",
      },
      {
        question: "Can warehouse labour cover night shifts and peak days?",
        answer:
          "Shift patterns, including night work and peak periods, are discussed as part of the requirement so the team and supervision match your activity.",
        category: "operations",
      },
      {
        question: "Who handles EPF and ESIC for warehouse workers?",
        answer:
          "We do, as the contractor. Applicable EPF and ESIC contributions, attendance and wage records for the workers deployed are maintained by us and available for your review.",
        category: "compliance",
      },
    ],
  },
  {
    slug: "loading-unloading-labour",
    serviceId: "warehouse-logistics",
    name: "Loading and unloading labour",
    metaTitle: "Loading Unloading Labour Contractor in SIDCUL Haridwar",
    description:
      "Loading and unloading labour for factories, warehouses and transporters in SIDCUL and across Haridwar: truck and container handling, stacking and shifting, with EPF/ESIC records.",
    heading: "Loading and unloading labour in SIDCUL and across Haridwar.",
    lede: "Crews for trucks, containers and material movement at factories, warehouses and transport yards, sized to how many vehicles you handle.",
    roles: [
      "Truck loading and unloading",
      "Container stuffing and destuffing",
      "Bag, carton and drum handling",
      "Stacking, palletising and shrink-wrapping",
      "Shifting material inside the plant",
      "Counting and checking loads against the challan",
      "Helpers alongside forklift and MHE operators",
    ],
    planning:
      "Tell us how many vehicles you load or unload on a normal day and on a peak day, the hours the dock runs, what the goods are and how they are packed. We plan crew size and supervision around that, including night and holiday arrivals where needed, and revisit it as volumes change.",
    related: [
      { href: "/services/warehouse-labour", label: "Warehouse labour" },
      { href: "/services/factory-labour", label: "Factory labour" },
      { href: "/services/contract-labour", label: "How contract labour works" },
    ],
    faqs: [
      {
        question: "Do you supply loading and unloading labour for factories as well as warehouses?",
        answer:
          "Yes. We plan loading and unloading crews for factory stores and dispatch, warehouses, and transport yards in SIDCUL and across Haridwar.",
        category: "operations",
      },
      {
        question: "Can you provide extra loaders for peak days or a short period?",
        answer:
          "Peak and short-term requirements are discussed case by case. Share the dates, the number of vehicles and the goods, and we confirm what we can plan.",
        category: "commercial",
      },
      {
        question: "Who handles EPF, ESIC and safety for the loading crew?",
        answer:
          "We do, as the contractor, for EPF, ESIC, attendance and wage records. Your site's safety rules, PPE and dock procedures are part of planning, and our supervisor coordinates them with your team.",
        category: "compliance",
      },
    ],
  },
  {
    slug: "factory-labour",
    serviceId: "manufacturing-shopfloor",
    name: "Factory labour",
    metaTitle: "Factory Labour & Production Helpers in Haridwar",
    description:
      "Production helpers, packers, line feeders and material handlers for factories in SIDCUL and across Haridwar, planned around your shifts and site procedures.",
    heading: "Factory labour for SIDCUL plants.",
    lede: "Production helpers, packers, line feeders and material handlers for shopfloor work in SIDCUL and across Haridwar.",
    roles: [
      "Production helpers",
      "Packers and labellers",
      "Line feeders",
      "Material handlers",
      "Quality check assistants",
      "Shopfloor housekeeping",
      "Data entry operators (ERP / SAP)",
    ],
    planning:
      "Share the line, the tasks, shift timings and your site induction and safety requirements. We plan onboarding and supervision to fit the way your plant works.",
    related: [
      { href: "/services/warehouse-labour", label: "Warehouse labour" },
      { href: "/services/housekeeping", label: "Housekeeping" },
      { href: "/industries", label: "Industries we support" },
    ],
    faqs: [
      {
        question: "What roles do you supply for factories in Haridwar?",
        answer:
          "Production helpers, packers, labellers, line feeders, material handlers and quality check assistants. The mix is planned around your line and shift pattern.",
        category: "operations",
      },
      {
        question: "Can workers follow our site induction and safety process?",
        answer:
          "Yes. Your induction, PPE and safety procedures are part of planning the engagement, and our supervisors coordinate them with your site team.",
        category: "operations",
      },
      {
        question: "Can you add workers for a new line or a seasonal peak?",
        answer:
          "Additional workforce for new lines, projects and seasonal demand is discussed around your timing. Share the start date and expected duration.",
        category: "commercial",
      },
    ],
  },
  {
    slug: "housekeeping",
    serviceId: "housekeeping-facility",
    name: "Housekeeping",
    metaTitle: "Housekeeping Services in SIDCUL Haridwar",
    description:
      "Housekeeping, pantry and facility support staff for factories, offices and campuses in SIDCUL and across Haridwar, with routines planned around the premises.",
    heading: "Housekeeping for plants, offices and campuses.",
    lede: "Housekeeping, pantry, washroom and facility support teams in SIDCUL and across Haridwar, with routines planned around your premises.",
    roles: [
      "Housekeeping staff",
      "Pantry and cafeteria assistants",
      "Washroom attendants",
      "Shopfloor housekeeping",
      "Facility maintenance helpers",
      "Gardeners and grounds crew",
    ],
    planning:
      "Share the premises, the areas to cover, timings and hygiene standards. We plan the team, routines and supervision, and can combine housekeeping with grounds or shopfloor support.",
    related: [
      { href: "/services/factory-labour", label: "Factory labour" },
      { href: "/services/warehouse-labour", label: "Warehouse labour" },
      { href: "/services#horticulture", label: "Horticulture and grounds" },
    ],
    faqs: [
      {
        question: "Do you provide housekeeping staff for factories in SIDCUL?",
        answer:
          "Yes. Housekeeping for shopfloors, offices, canteens and common areas at industrial sites in SIDCUL and across Haridwar, planned around shifts and production areas.",
        category: "operations",
      },
      {
        question: "Can you supply cleaning materials and equipment?",
        answer:
          "Housekeeping equipment and consumables can be included in the engagement. Tell us what your site provides and what you need us to arrange.",
        category: "commercial",
      },
      {
        question: "Can housekeeping be combined with contract labour?",
        answer:
          "Yes. Many sites combine housekeeping with production, warehouse or grounds support under one arrangement, with a single point of coordination.",
        category: "commercial",
      },
    ],
  },
];

export function getServicePage(slug: string) {
  const page = servicePages.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown service page: ${slug}`);
  return page;
}
