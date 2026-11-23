import type { FaqItem } from "./types";
import type { LocationCluster } from "@/content/registry/identifiers";

/**
 * Service-by-market pages (owner direction, 24 Nov 2026): one page where a
 * service has its own search demand in a market. Keyword Planner, 24 Nov
 * 2026: of the three services only housekeeping is searched with a city
 * ("housekeeping services in delhi", "... in bangalore", "... in hyderabad",
 * "... in dehradun"); loading and factory labour by city measure near zero,
 * so they have no market pages. English only: buyers search these in
 * English. The areas come from the market's location page; no figures,
 * tenants or headcounts (docs/claims-register.md).
 */
export type ServiceMarketCopy = {
  service: "housekeeping";
  market: LocationCluster;
  /** The market's short name, for breadcrumbs and links. */
  name: string;
  /** Up to 55 characters before " | Vayasya Seva". */
  metaTitle: string;
  /** 140 to 160 characters. */
  description: string;
  heading: string;
  lede: string;
  /** One paragraph: where the teams work in this market. */
  paragraph: string;
  faqs: [FaqItem, FaqItem, FaqItem, FaqItem];
};

export const SERVICE_MARKET_SERVICES = ["housekeeping"] as const;
export const serviceMarketPath = (service: ServiceMarketCopy["service"], market: string) => `/services/${service}/${market}`;

const wagesFaq = (place: string, states: string): FaqItem => ({
  question: `Which minimum wage applies to housekeeping staff in ${place}?`,
  answer: `The minimum wage of the state the site is in (${states}), for the worker's skill category, revised by the state through the year. The current rates are on our minimum wage pages, linked under "Rules and rates here".`,
  category: "compliance",
});
const materialsFaq: FaqItem = {
  question: "Do you bring materials, equipment and consumables?",
  answer: "They can be included in the engagement. Tell us what your site provides and what you need us to arrange.",
  category: "commercial",
};
const shiftsFaq: FaqItem = {
  question: "Can housekeeping cover every shift?",
  answer: "Yes. Teams work full 8-hour shifts set to your site’s timings and cleaning schedule, with our supervisor checking the routine through the shift.",
  category: "operations",
};

export const serviceMarketPages: ServiceMarketCopy[] = [
  {
    service: "housekeeping",
    market: "delhi-ncr",
    name: "Delhi NCR",
    metaTitle: "Housekeeping Services in Delhi NCR: Plants and Offices",
    description: "Housekeeping, pantry, washroom and grounds staff for plants, warehouses and offices in Gurugram, Manesar, Noida, Faridabad, Ghaziabad and Delhi.",
    heading: "Housekeeping services in Delhi NCR.",
    lede: "Housekeeping, pantry, washroom and grounds teams for plants, warehouses and offices, on a routine set to your premises.",
    paragraph:
      "We supply housekeeping teams to industrial and commercial sites across Delhi NCR: IMT Manesar and Gurugram, Noida and Greater Noida, Faridabad and Ghaziabad, and Delhi's own industrial areas. One team can cover the shopfloor, offices, canteen, washrooms and grounds of a site.",
    faqs: [
      {
        question: "Do you supply housekeeping staff across Delhi NCR?",
        answer: "Yes. Plants, warehouses, offices and campuses in Gurugram and Manesar, Noida and Greater Noida, Faridabad and Ghaziabad, and Delhi's industrial areas.",
        category: "operations",
      },
      wagesFaq("Delhi NCR", "Delhi, Haryana or Uttar Pradesh"),
      materialsFaq,
      shiftsFaq,
    ],
  },
  {
    service: "housekeeping",
    market: "bengaluru",
    name: "Bengaluru",
    metaTitle: "Housekeeping Services in Bangalore: Plants and Offices",
    description: "Housekeeping, pantry, washroom and grounds staff for plants, warehouses and tech campuses in Bangalore: Peenya, Bommasandra, Electronic City and Hoskote.",
    heading: "Housekeeping services in Bengaluru.",
    lede: "Housekeeping, pantry, washroom and grounds teams for plants, warehouses and campuses, on a routine set to your premises.",
    paragraph:
      "We supply housekeeping teams to industrial and commercial sites around Bengaluru: Peenya in the north-west, Bommasandra, Jigani and Attibele on Hosur Road, Electronic City and Whitefield, and Hoskote and Narasapura in the east. One team can cover the shopfloor, offices, canteen, washrooms and grounds of a site.",
    faqs: [
      {
        question: "Do you supply housekeeping staff in Bangalore?",
        answer: "Yes. Plants, warehouses, offices and campuses in Peenya, Bommasandra and Jigani, Electronic City and Whitefield, and Hoskote and Narasapura.",
        category: "operations",
      },
      wagesFaq("Bengaluru", "Karnataka"),
      materialsFaq,
      shiftsFaq,
    ],
  },
  {
    service: "housekeeping",
    market: "hyderabad",
    name: "Hyderabad",
    metaTitle: "Housekeeping Services in Hyderabad: Plants and Offices",
    description: "Housekeeping, pantry, washroom and grounds staff for plants, pharma units and offices in Hyderabad: Patancheru, Jeedimetla, Cherlapally, Genome Valley.",
    heading: "Housekeeping services in Hyderabad.",
    lede: "Housekeeping, pantry, washroom and grounds teams for plants, pharma units and offices, on a routine set to your premises.",
    paragraph:
      "We supply housekeeping teams to industrial and commercial sites around Hyderabad: Patancheru and Pashamylaram, Jeedimetla and Medchal, Cherlapally and Nacharam, Genome Valley, and Shamshabad and Kothur. One team can cover the shopfloor, offices, canteen, washrooms and grounds of a site.",
    faqs: [
      {
        question: "Do you supply housekeeping staff in Hyderabad?",
        answer: "Yes. Plants, pharma units, warehouses and offices in Patancheru and Pashamylaram, Jeedimetla and Medchal, Cherlapally and Nacharam, Genome Valley, and Shamshabad and Kothur.",
        category: "operations",
      },
      wagesFaq("Hyderabad", "Telangana"),
      materialsFaq,
      shiftsFaq,
    ],
  },
  {
    service: "housekeeping",
    market: "dehradun",
    name: "Dehradun",
    metaTitle: "Housekeeping Services in Dehradun: Plants and Offices",
    description: "Housekeeping, pantry, washroom and grounds staff for plants, pharma units and offices in Dehradun, SIDCUL Selaqui and Langha Road, on a routine set to your site.",
    heading: "Housekeeping services in Dehradun.",
    lede: "Housekeeping, pantry, washroom and grounds teams for plants, pharma units and offices, on a routine set to your premises.",
    paragraph:
      "We supply housekeeping teams to industrial and commercial sites in and around Dehradun: SIDCUL Selaqui, Langha Road, Mohabbewala and Laltappar. One team can cover the shopfloor, offices, canteen, washrooms and grounds of a site.",
    faqs: [
      {
        question: "Do you supply housekeeping staff in Dehradun?",
        answer: "Yes. Plants, pharma units, warehouses and offices in SIDCUL Selaqui, Langha Road, Mohabbewala and Laltappar.",
        category: "operations",
      },
      wagesFaq("Dehradun", "Uttarakhand"),
      materialsFaq,
      shiftsFaq,
    ],
  },
];

export const serviceMarketPage = (service: string, market: string) => serviceMarketPages.find((p) => p.service === service && p.market === market);
