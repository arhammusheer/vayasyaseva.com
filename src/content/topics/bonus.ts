import type { TopicPage } from "./types";

/**
 * /bonus: statutory bonus for employers. Read against the documents on
 * 18 Oct 2026: the Code on Wages, 2019 (s.2(a), 2(y), 26 to 29, 31, 36,
 * 37, 38, 39, 41, 43, 45, 54, 56), S.O. 4711(E) and S.O. 4710(E) of
 * 25 Aug 2026 (the Central sphere's ₹21,000 and ₹7,000, in force from
 * 21 Nov 2025), the Code on Wages (Central) Rules, 2026 (r.21) and the
 * Uttarakhand Code on Wages Rules, 2026 (r.52).
 *
 * Not found and so not claimed: any of our six states' own notifications
 * under s.26(1) or 26(2). The page says the figures are the Central
 * sphere's and that the states had not notified theirs when checked.
 */
export const bonusTopic: TopicPage = {
  path: "/bonus",
  title: "Statutory Bonus 2026: 8.33% to 20%, Due 30 November",
  description:
    "Statutory bonus under the Code on Wages: 8.33% to 20% of wages for workers on up to ₹21,000 a month, paid by 30 November. With a calculator and penalties.",
  breadcrumb: "Bonus",
  heading: "Statutory bonus.",
  lede: "Workers on wages up to ₹21,000 a month get a bonus of at least 8.33% of a year's wages, and up to 20% when the year's surplus allows, paid within eight months of the year's end: by 30 November.",
  glance: [
    { label: "At least", note: "of the year's wages, or ₹100", value: "8.33%" },
    { label: "At most", value: "20%" },
    { label: "For wages up to", note: "a month (Central sphere)", value: "₹21,000" },
    { label: "Due", note: "for an April to March year", value: "30 Nov", key: true },
  ],
  updatedFrom: "the Code on Wages and the Gazette",
  rules: [
    {
      heading: "Who it covers",
      rows: [
        { label: "Establishments", text: "Every establishment with 20 or more persons employed on any day of the accounting year. A new establishment pays only in its profit years for its first five years." },
        { label: "Workers", text: "Anyone on wages of up to ₹21,000 a month who worked at least 30 days in the accounting year. Lay-off, paid leave, maternity leave and accident disablement count as days worked." },
        { label: "Which wages", text: "Basic pay, dearness allowance and retaining allowance (section 2(y) of the Code). HRA, conveyance, overtime and commission are left out, unless together they are more than half of pay." },
        { label: "Left out", text: "A worker dismissed for fraud, riotous or violent behaviour on the premises, theft, misappropriation or sabotage, or convicted of sexual harassment." },
      ],
    },
    {
      heading: "How much",
      rows: [
        { label: "The base", text: "Wages up to ₹7,000 a month count in full. Above that, bonus is worked out as if the wage were ₹7,000 or the minimum wage, whichever is higher." },
        { label: "Minimum", text: "8⅓% of the year's wages, or ₹100, whichever is higher, whether or not there is a surplus. Part of a year earns a proportionate share." },
        { label: "Maximum", text: "20%, paid from the allocable surplus (67% of the available surplus) and carried forward or back over up to four years." },
        { label: "Diwali bonus", text: "A puja or other customary bonus already paid in the year can be deducted from the statutory bonus, as can an advance." },
      ],
    },
    {
      heading: "When",
      rows: [
        { label: "Payment", text: "Within eight months of the close of the accounting year, into the worker's bank account: by 30 November for an April to March year. Government can extend this on application, by up to two years in all." },
        { label: "Paid late or short", text: "A fine of up to ₹50,000, and for a repeat within five years up to three months in prison or a fine of up to ₹1 lakh. A claims authority can also award compensation of up to ten times the amount due." },
      ],
    },
    {
      heading: "Contract workers",
      rows: [
        { label: "Who pays", text: "The contractor, as their employer. If it does not, the principal employer pays at least the minimum bonus, once told of the failure in writing (Central rules, rule 21; Uttarakhand's rules, rule 52)." },
      ],
    },
  ],
  faqs: [
    {
      question: "Is a Diwali bonus the same as statutory bonus?",
      answer: "No, but it counts towards it. A customary bonus paid before Diwali can be deducted from the statutory bonus for that year, so a worker gets whichever is larger, not both.",
    },
    {
      question: "Does the Payment of Bonus Act, 1965 still apply?",
      answer: "No. The Code on Wages replaced it from 21 November 2025, keeping the same 8⅓% minimum, 20% maximum and eight-month deadline.",
    },
    {
      question: "Do the ₹21,000 and ₹7,000 apply in my state?",
      answer: "They are notified for the Central sphere. None of Uttarakhand, Uttar Pradesh, Delhi, Haryana, Punjab or Karnataka had notified its own figures when we checked on 18 October 2026, nor had Andhra Pradesh, whose Code on Wages rules of June 2026 set none, on 22 October 2026; we will update this page when one does.",
    },
  ],
  sources: ["cow-2019-bonus", "bonus-eligibility-2026", "bonus-ceiling-2026", "cow-central-rules-2026", "uk-wages-rules-2026"],
  links: [
    { href: "/minimum-wages", label: "Minimum wages by state" },
    { href: "/epf", label: "EPF for employers" },
  ],
  checked: "2026-10-18",
};
