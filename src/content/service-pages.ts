import type { FaqItem } from "./types";
import type { JobRole } from "@/lib/talent-intake/rules";

export interface ServiceLandingContent {
  slug: string;
  name: string;
  /** One line of the roles, for the /services rows. */
  summary: string;
  metaTitle: string;
  description: string;
  heading: string;
  lede: string;
  /** The quiet hero line for a job seeker who lands here: the matching role page. */
  jobs: { role: JobRole; label: string };
  rolesHeading: string;
  /** A ruled two-column set: the role, and one line of the work. */
  roles: { name: string; task: string }[];
  planning: string;
  faqs: FaqItem[];
}

/**
 * The three service landings, English only, in sibling order: each page's
 * "Next" link is the one after it (the last wraps to the first). Each page
 * says what is particular to it; the engagement steps live on /services, the
 * records on /compliance and the contractor line on home.
 */
export const servicePages: ServiceLandingContent[] = [
  {
    slug: "factory-labour",
    name: "Factory labour",
    summary: "Production helpers, packers, line feeders and material handlers.",
    metaTitle: "Factory Labour & Production Helpers in Haridwar",
    description:
      "Production helpers, packers, line feeders and material handlers for factories in SIDCUL and across Haridwar, planned around your line and shifts.",
    heading: "Factory labour for SIDCUL plants.",
    lede: "A supervised shopfloor crew sized to your line and your shifts, in SIDCUL and across Haridwar.",
    jobs: { role: "factory-helper", label: "Factory helper jobs" },
    rolesHeading: "Roles we staff.",
    roles: [
      { name: "Production helpers", task: "Feed, assist and clear the line." },
      { name: "Packers and labellers", task: "Pack, label and seal finished goods." },
      { name: "Line feeders", task: "Keep material at every station." },
      { name: "Material handlers", task: "Move stock between stores and the line." },
      { name: "Quality check assistants", task: "Sort, count and set aside rejects." },
    ],
    planning:
      "Share the line, the tasks, shift timings and your site induction and safety requirements. We plan onboarding and supervision to fit the way your plant works.",
    faqs: [
      {
        question: "Can workers follow our site induction and safety process?",
        answer:
          "Yes. Your induction, PPE and safety procedures are part of planning the engagement, and our supervisors coordinate them with your site team.",
        category: "operations",
      },
      {
        question: "Can you add workers for a new line or a seasonal peak?",
        answer:
          "We plan added workers for new lines, projects and seasonal demand around your start date.",
        category: "commercial",
      },
    ],
  },
  {
    slug: "loading-unloading-labour",
    name: "Loading and unloading",
    summary: "Loading, unloading, picking, packing, racking and dispatch crews.",
    metaTitle: "Loading and Unloading Labour, SIDCUL Haridwar",
    description:
      "Loading and unloading labour for warehouses, factory stores and transporters in SIDCUL and across Haridwar: trucks, containers, picking and dispatch.",
    heading: "Loading and unloading labour for warehouses and dispatch.",
    lede: "Crews sized to the vehicles you handle and the hours your dock runs, in SIDCUL and across Haridwar.",
    jobs: { role: "warehouse", label: "Warehouse jobs" },
    rolesHeading: "Work we staff.",
    roles: [
      { name: "Loading and unloading", task: "Trucks by hand, or alongside your forklift." },
      { name: "Container stuffing", task: "Stuffing and destuffing containers." },
      { name: "Load checks", task: "Count and check loads against the challan." },
      { name: "Picking and packing", task: "Pick and pack orders for dispatch." },
      { name: "Racking", task: "Stack, palletise and rack inbound stock." },
      { name: "Dispatch", task: "Stage and load outbound orders." },
    ],
    planning:
      "Tell us how many vehicles you handle on a normal day and on a peak day, the hours your dock runs and how the goods are packed. We size the crew and its supervision to that.",
    faqs: [
      {
        question: "Can the crew cover night shifts and peak days?",
        answer:
          "Night work and peak days are planned into the crew and its supervision.",
        category: "operations",
      },
      {
        question: "Do you supply crews for factory stores as well as warehouses?",
        answer:
          "Yes. We plan loading and unloading crews for factory stores and dispatch, warehouses and transport yards in SIDCUL and across Haridwar.",
        category: "operations",
      },
    ],
  },
  {
    slug: "housekeeping",
    name: "Housekeeping and grounds",
    summary: "Housekeeping, pantry, washroom and grounds staff.",
    metaTitle: "Housekeeping Manpower in SIDCUL Haridwar",
    description:
      "Housekeeping, pantry, washroom and grounds staff for plants, offices and campuses in SIDCUL and across Haridwar, with routines set to the premises.",
    heading: "Housekeeping manpower for plants, offices and campuses.",
    lede: "Housekeeping and grounds teams on a routine set to your premises, in SIDCUL and across Haridwar.",
    jobs: { role: "housekeeping", label: "Housekeeping jobs" },
    rolesHeading: "Roles we staff.",
    roles: [
      { name: "Housekeeping staff", task: "Shopfloors, offices and common areas." },
      { name: "Pantry and cafeteria assistants", task: "Serve and clear the canteen." },
      { name: "Washroom attendants", task: "Washrooms kept clean through the shift." },
      { name: "Facility helpers", task: "Small upkeep jobs around the site." },
      { name: "Gardeners and grounds crew", task: "Lawns, beds and outdoor areas." },
    ],
    planning:
      "Share the premises, the areas to cover, timings and hygiene standards. We plan the team, its routines and supervision around them.",
    faqs: [
      {
        question: "Do you bring materials, equipment and consumables?",
        answer:
          "They can be included in the engagement. Tell us what your site provides and what you need us to arrange.",
        category: "commercial",
      },
      {
        question: "Can housekeeping be combined with shopfloor support?",
        answer:
          "Yes. A site can combine housekeeping with production, warehouse or grounds support under one arrangement, with one point of coordination.",
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

/** The sibling after a landing, for its one "Next" link. */
export function nextServicePage(slug: string) {
  const i = servicePages.findIndex((p) => p.slug === slug);
  return servicePages[(i + 1) % servicePages.length];
}
