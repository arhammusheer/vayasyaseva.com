import type {
  TrustClient,
  Registration,
  ComplianceItem,
  FaqItem,
} from "./types";

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

export const registrations: Registration[] = [
  {
    label: "ESIC",
    value: "Registered",
  },
  {
    label: "EPF",
    value: "Registered",
  },
  {
    label: "GST",
    value: "Registered",
  },
  {
    label: "MSME",
    value: "Certified",
  },
];

export const complianceItems: ComplianceItem[] = [
  {
    title: "Registrations",
    description:
      "Vayasya Seva is registered under EPF, ESIC, GST and MSME. Registration documents are available during due diligence.",
    claim: "contractual",
    registrations: ["EPF", "ESIC", "GST", "MSME"],
  },
  {
    title: "Workforce records",
    description:
      "Attendance, wage documentation and statutory contribution records support the management and review of a labour engagement.",
    claim: "directional",
  },
  {
    title: "Client reviews",
    description:
      "Our team coordinates relevant workforce documentation for client assessment and review.",
    claim: "directional",
  },
];

/**
 * The home page FAQ (PLAN §5.2). The second question is the standard agency
 * FAQ from docs/brand-rules.md, word for word: keep it in sync with that file.
 * A `link` renders after its answer and stays out of the FAQPage text.
 */
export const homeFaqs: FaqItem[] = [
  {
    question: "What records can we check?",
    answer:
      "Attendance and wage registers, wage slips, and EPF and ESIC challans for the workers on your site. We share them for your monthly review and for audits.",
    category: "compliance",
  },
  {
    question: "Are you a manpower agency or a staffing company?",
    answer:
      "We’re a manpower contractor. An agency sends you candidates to hire. We supply the workers, keep them on our payroll, supervise them on site, replace absentees and handle wages, EPF and ESIC. You get a working crew and one invoice.",
    category: "commercial",
  },
  {
    question: "Where do you supply workers?",
    answer:
      "We’re based in Haridwar, Uttarakhand, and run crews at units in SIDCUL and across Haridwar. For a site elsewhere in India, send us the details. We’ll tell you plainly whether we can staff it.",
    link: { href: "/contact", label: "Request a crew" },
    category: "commercial",
  },
  {
    question: "Who handles EPF and ESIC?",
    answer:
      "We do. The workers are on our payroll, so we register them for EPF and ESIC where they apply, deposit the contributions every month and keep the challans for your review.",
    category: "compliance",
  },
];

/**
 * "Where we work" on the home page: one factual line per cluster with a
 * published buyer page. The list itself comes from the registry, so a
 * cluster appears here only once it has passed the readiness check and its
 * hub is published; a cluster without a line here is left out.
 */
export const whereWeWork: Partial<Record<string, { label: string; text: string; link: string }>> = {
  haridwar: {
    label: "OUR BASE",
    text: "We run crews at units in SIDCUL and across Haridwar district, with some of our work around Bahadrabad, Bhagwanpur and Roorkee.",
    link: "Contract labour in SIDCUL Haridwar",
  },
};
