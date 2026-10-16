import type { FaqItem } from "./types";
import { AGENCY_FAQ } from "./agency-faq";
import { servicePages } from "./service-pages";
import { haridwarCopy } from "./pages/haridwar-sidcul";
import { WAGE_HUB_PATH } from "@/content/registry/identifiers";

/**
 * /faq: every buyer question in one place, grouped. Each question has one
 * home: the general and compliance groups live here, the service groups in
 * service-pages.ts and the Haridwar group in pages/haridwar-sidcul.ts, and
 * the pages show their own group with a "More questions" link to
 * /faq#<group>. Claims follow docs/claims-register.md.
 */
export type FaqGroup = {
  id: string;
  title: string;
  items: FaqItem[];
  /** A topic group (a service or a place). /faq#<id> shows it with the shared groups and hides the other topics. */
  topic?: boolean;
};

export const WORKING_WITH_US: FaqItem[] = [
  {
    question: "How is the crew priced?",
    answer:
      "Usually per manday: one rate that covers wages, the EPF and ESIC that apply, and our service charge, billed monthly. If you prefer, we can contract per piece or per kg instead.",
    category: "commercial",
  },
  {
    question: "What size of crew, and for how long?",
    answer:
      "We’re set up for crews of about 20 workers or more, on 8-hour shifts, for three months or longer: a season, a project or years.",
    category: "commercial",
  },
  {
    question: "Do you supply crews outside Haridwar?",
    answer:
      "Most of our work is in SIDCUL and across Haridwar. For a site elsewhere in India, tell us where it is and we’ll tell you plainly whether we can staff it.",
    category: "commercial",
  },
  AGENCY_FAQ,
  {
    question: "What happens when a worker is absent?",
    answer: "Our supervisor sends a replacement for the shift. Keeping the headcount up is our job, not yours.",
    category: "operations",
  },
  {
    question: "Who supervises the crew?",
    answer:
      "Our supervisor runs the crew on your site: attendance, shift allocation and replacements, working with your site team on the day’s plan.",
    category: "operations",
  },
  {
    question: "Do you supply part-time or hourly workers?",
    answer: "No. Every shift is a full 8 hours.",
    category: "operations",
  },
  {
    question: "How do we start?",
    answer:
      "Request a crew with the roles, headcount, shifts and start date. We aim to reply within two working days, and we visit the site before a crew starts.",
    link: { href: "/contact", label: "Request a crew" },
    category: "commercial",
  },
];

export const COMPLIANCE_FAQS: FaqItem[] = [
  {
    question: "Who is the employer of the workers?",
    answer:
      "We are. The workers are on our payroll: we pay their wages, deposit EPF and ESIC where they apply, and keep their records.",
    category: "compliance",
  },
  {
    question: "Do you deposit EPF and ESIC every month?",
    answer: "Yes, for every worker they apply to, and we share the challans for your review.",
    category: "compliance",
  },
  {
    question: "What about Professional Tax and Labour Welfare Fund?",
    answer:
      "They depend on the state. Where your site’s state levies them, we deduct, deposit and file them for the crew.",
    category: "compliance",
  },
  {
    question: "Does our site need a contract labour licence?",
    answer:
      "It depends on the state and the size of the crew. Where one is needed, we apply for the contractor’s licence for your site. Ask us for the registration and licence details before you sign.",
    category: "compliance",
  },
  {
    question: "Do you pay at least the minimum wage?",
    answer: "Yes. We pay at least the notified rate for the state, zone, employment and skill.",
    link: { href: WAGE_HUB_PATH, label: "Minimum wages by state" },
    category: "compliance",
  },
  {
    question: "What records can we see?",
    answer:
      "Attendance and wage registers, wage slips, and the EPF and ESIC challans, every month and for any audit.",
    link: { href: "/compliance", label: "The records we keep" },
    category: "compliance",
  },
];

/** The four on the home page, in order; the agency question last (docs/brand-rules.md). */
export const homeFaqs: FaqItem[] = WORKING_WITH_US.slice(0, 4);

export const faqGroups: FaqGroup[] = [
  { id: "working-with-us", title: "Working with us", items: WORKING_WITH_US },
  { id: "compliance", title: "Payroll and compliance", items: COMPLIANCE_FAQS },
  ...servicePages.map((s) => ({ id: s.slug, title: s.name, items: s.faqs, topic: true })),
  { id: "haridwar-sidcul", title: "SIDCUL Haridwar", items: haridwarCopy["en-IN"].faqs, topic: true },
];

export const FAQ_PATH = "/faq";
export const faqHref = (group: string) => `${FAQ_PATH}#${group}`;
