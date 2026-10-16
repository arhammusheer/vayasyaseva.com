import type { FaqItem } from "./types";

/**
 * Page FAQs. Written for the questions plant HR, admin and procurement teams
 * in SIDCUL and across Haridwar actually search. Answers stay within the claims
 * discipline: no turnaround promises, no invented figures.
 */
export const servicesFaqs: FaqItem[] = [
  {
    question: "What kinds of contract labour does Vayasya Seva supply?",
    answer:
      "Production helpers, packers, line feeders, loaders, material handlers, data entry operators for ERP and SAP work, housekeeping staff, gardeners, fabrication and civil crews, and maintenance technicians. The mix is planned around your site and shift pattern.",
    category: "operations",
  },
  {
    question: "Do you provide data entry operators who can work in SAP or other ERPs?",
    answer:
      "Yes. We provide data entry operators (DEOs) who can work in ERP systems such as SAP, for stores, dispatch, production, attendance and office records. Tell us the system, the entries involved and the shift, and we plan the team around your process.",
    category: "operations",
  },
  {
    question:
      "Do you provide manpower for warehouses and logistics hubs in Haridwar?",
    answer:
      "Yes. Loading, unloading, picking, stacking and dispatch crews for warehouses and distribution centres in SIDCUL and across Haridwar. Headcount can scale with throughput and can run single or multi-shift.",
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
      "We do. The workers are on our payroll, so we keep their attendance and wage registers, register them for EPF and ESIC where they apply, deposit the contributions every month and share the challans for your review.",
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
      "Attendance and wage registers, wage slips, and EPF and ESIC challans for the workers on your site, plus their onboarding records. We share them for your monthly review and for audits.",
    category: "compliance",
  },
  {
    question:
      "Does using a contract labour provider reduce the principal employer's compliance exposure?",
    answer:
      "Partly. As the employer, we pay the wages and deposit EPF and ESIC where they apply. Under contract labour law the principal employer must still make sure the workers are paid, so we keep the records open to your review throughout the engagement.",
    category: "compliance",
  },
  {
    question:
      "How do I request compliance documents for an audit or vendor assessment?",
    answer:
      "Email help@vayasyaseva.com with the documents your team needs and the engagement they relate to. We send the certificates and records that apply.",
    category: "compliance",
  },
  {
    question: "Do you hold a contract labour licence for my site?",
    answer:
      "Whether a licence is needed, and under which law, depends on the state, the site and the headcount. Before you sign, ask us for the registration and licence details that apply to your site.",
    category: "compliance",
  },
];

export const industriesFaqs: FaqItem[] = [
  {
    question:
      "Which industries does Vayasya Seva work with in SIDCUL and across Haridwar?",
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
      "We’re based in Haridwar, Uttarakhand, and run crews at units in SIDCUL and across Haridwar. For a site elsewhere in India, send us the details. We’ll tell you plainly whether we can staff it.",
    category: "commercial",
  },
];
