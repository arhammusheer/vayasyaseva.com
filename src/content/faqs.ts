import type { FaqItem } from "./types";

/**
 * Page FAQs. Written for the questions plant HR, admin and procurement teams
 * in Haridwar and SIDCUL actually search. Answers stay within the claims
 * discipline: no turnaround promises, no invented figures.
 */
export const servicesFaqs: FaqItem[] = [
  {
    question: "What kinds of contract labour does Vayasya Seva supply?",
    answer:
      "Production helpers, packers, line feeders, loaders, material handlers, housekeeping staff, gardeners, fabrication and civil crews, and maintenance technicians. The mix is planned around your site and shift pattern.",
    category: "operations",
  },
  {
    question:
      "Do you provide manpower for warehouses and logistics hubs in Haridwar?",
    answer:
      "Yes. Loading, unloading, picking, stacking and dispatch crews for warehouses and distribution centres in Haridwar, SIDCUL and the surrounding area. Headcount can scale with throughput and can run single or multi-shift.",
    category: "operations",
  },
  {
    question:
      "Can one engagement cover labour, housekeeping and site works together?",
    answer:
      "Yes. Many clients combine contract labour with housekeeping, grounds upkeep, civil repairs or fabrication under one arrangement, with a single point of coordination.",
    category: "commercial",
  },
  {
    question:
      "Who handles EPF, ESIC and wage records for the workers you deploy?",
    answer:
      "We do, as the contractor. Worker onboarding, attendance, wage documentation and applicable EPF and ESIC contributions are maintained by our team and are available for your review.",
    category: "compliance",
  },
  {
    question: "How is a new requirement started?",
    answer:
      "Share the site, roles, headcount, shift pattern and intended start. We review the requirement with you, agree the team and supervision, and plan mobilisation around the readiness of the site.",
    category: "commercial",
  },
];

export const complianceFaqs: FaqItem[] = [
  {
    question: "Is Vayasya Seva registered under EPF and ESIC?",
    answer:
      "Yes. Vayasya Seva Private Limited is registered under EPF and ESIC, and holds GST and MSME (Udyam) registrations. Registration certificates are available during vendor onboarding and due diligence.",
    category: "compliance",
  },
  {
    question:
      "What compliance records can a client review during an engagement?",
    answer:
      "Worker identification and onboarding records, attendance, wage documentation and applicable EPF and ESIC contribution records for the workers deployed to your site, coordinated with your HR, operations or procurement team.",
    category: "compliance",
  },
  {
    question:
      "Does using a contract labour provider reduce the principal employer's compliance exposure?",
    answer:
      "A registered contractor that maintains worker records and statutory contributions supports the principal employer's obligations under contract labour law. Responsibilities remain shared, which is why we keep records open to your review throughout the engagement.",
    category: "compliance",
  },
  {
    question:
      "How do I request compliance documents for an audit or vendor assessment?",
    answer:
      "Email help@vayasyaseva.com with the documents your team needs and the engagement they relate to. Our team coordinates the relevant certificates and records with you.",
    category: "compliance",
  },
];

export const industriesFaqs: FaqItem[] = [
  {
    question:
      "Which industries in Haridwar and SIDCUL does Vayasya Seva work with?",
    answer:
      "Manufacturing plants, warehouses and logistics hubs, FMCG and consumer goods operations, institutional campuses and hospitality-linked facilities. Each engagement is planned around the realities of that site.",
    category: "operations",
  },
  {
    question: "Can you support seasonal peaks or a new production line?",
    answer:
      "Yes. Additional workforce for busy periods, new projects and changes in production demand is a regular part of our work. The team and mobilisation plan are discussed around your timing.",
    category: "operations",
  },
  {
    question:
      "Do you supply housekeeping and facility staff for offices and campuses?",
    answer:
      "Yes. Housekeeping, pantry, grounds and general facility support for offices, plants, campuses and hospitality properties, with teams and routines planned around the premises.",
    category: "operations",
  },
  {
    question: "Do you work outside Haridwar?",
    answer:
      "Haridwar and SIDCUL are our base. Enquiries for Roorkee, Bhagwanpur, Bahadrabad and other locations in Uttarakhand are welcome; share the site and we will discuss what is possible.",
    category: "commercial",
  },
];
