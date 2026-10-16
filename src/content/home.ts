import type { TrustClient, FaqItem } from "./types";
import { AGENCY_FAQ } from "./agency-faq";

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

/**
 * The home page FAQ: pricing, then the agency question, the only agency FAQ
 * on the site (docs/brand-rules.md). No crew-size question: its answer would
 * either repeat the hero or imply capacity we don't publish.
 */
export const homeFaqs: FaqItem[] = [
  {
    question: "How is the crew priced?",
    answer:
      "A rate per worker that covers wages, the EPF and ESIC that apply, and our service charge, billed on one monthly invoice.",
    category: "commercial",
  },
  AGENCY_FAQ,
];
