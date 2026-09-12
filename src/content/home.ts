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

export const faqs: FaqItem[] = [
  {
    question: "What does Vayasya Seva do?",
    answer:
      "We provide contract labour, workforce management and industrial services. Our capabilities include housekeeping, civil works, fabrication, maintenance and other site support.",
    category: "commercial",
  },
  {
    question: "Where is Vayasya Seva based?",
    answer:
      "We are based in Haridwar, Uttarakhand, and support businesses in the SIDCUL region. Contact us to discuss your site and location.",
    category: "commercial",
  },
  {
    question: "Can you share compliance documentation?",
    answer:
      "Registration certificates and relevant workforce records are available for vendor due diligence and engagement reviews. Contact our team with your documentation needs.",
    category: "compliance",
  },
];
