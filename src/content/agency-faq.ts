import type { FaqItem } from "./types";

/**
 * The agency FAQ, on the home page only (docs/brand-rules.md, PLAN §5.1),
 * word for word from brand-rules: keep the two identical. It counts as two
 * agency terms toward the page's limit of three.
 */
export const AGENCY_FAQ: FaqItem = {
  question: "Are you a manpower agency or a staffing company?",
  answer:
    "We’re a manpower contractor. An agency sends you candidates to hire. We supply the workers, keep them on our payroll, supervise them on site, replace absentees and handle wages, EPF and ESIC. You get a working crew and one invoice.",
  category: "commercial",
};
