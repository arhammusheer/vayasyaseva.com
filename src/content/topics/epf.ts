import type { Topic } from "./types";

/**
 * /epf: EPF for employers. Read against the documents on 18 Oct 2026:
 * the Code on Social Security, 2020 (First Schedule; s.1(5), 1(8), 2(26),
 * 2(27), 2(88), 16, 17, 127, 128), S.O. 5109(E) (₹25,000 from 17 Sep 2026)
 * and S.O. 2702(E) (₹15,000), the EPF Scheme, EPS and EDLI Scheme 2026
 * (G.S.R. 525 to 527(E)), S.O. 2698(E) (12% interest) and EPFO's
 * wage-ceiling FAQs (Q4, Q7 to Q15, Q25, Q26, Q29 to Q31, Q37, Q45, Q46).
 *
 * Left out, not verified from a primary source: the classes of
 * establishment on the 10% rate, and the Gazette basis of the EDLI and
 * administration rates (shown from EPFO's FAQs, cited as such).
 */
export const epfTopic: Topic = {
  path: "/epf",
  title: "EPF Contribution for Employers 2026: ₹25,000 Ceiling",
  description:
    "EPF for employers from 17 September 2026: the ₹25,000 wage ceiling, the 12% split into EPS and EPF, EDLI and admin charges, due dates and contract workers.",
  breadcrumb: "EPF",
  heading: "EPF for employers.",
  lede: "From 17 September 2026 the EPF wage ceiling is ₹25,000 a month, up from ₹15,000. On wages up to the ceiling the worker pays 12% and the employer pays 12%, plus 0.5% for EDLI and 0.5% admin charges, by the 15th of the next month.",
  sections: [
    {
      kind: "facts",
      id: "rules",
      rows: [
        { label: "Who must register", text: "Every establishment with 20 or more employees. Employees earning above the ceiling count towards the 20, and an establishment stays covered if its headcount later falls below it." },
        { label: "Wage ceiling", text: "₹25,000 a month from 17 September 2026 (S.O. 5109(E)). It had been ₹15,000 since September 2014." },
        { label: "Which wages", text: "Basic pay, dearness allowance and retaining allowance (section 2(88) of the Code), not the gross salary. HRA, conveyance, overtime, bonus and commission are left out." },
        { label: "Worker pays", text: "12% of wages up to the ceiling, deducted from wages." },
        { label: "Employer pays", text: "12% of the same wages: 8.33% goes to the pension fund (EPS) for members, the rest to the worker's EPF account. The employer's share cannot be deducted from wages." },
        { label: "EDLI", text: "0.5% of wages up to the ceiling, paid by the employer (EPFO's figure)." },
        { label: "Admin charges", text: "0.5% of wages up to the ceiling, at least ₹500 a month for the establishment (EPFO's figure)." },
        { label: "When", text: "Pay and file the electronic challan-cum-return (ECR) within 15 days of the end of the month: by the 15th." },
      ],
    },
    {
      kind: "table",
      id: "example",
      heading: "What it comes to.",
      intro: "For one worker, a full month from October 2026, rounded to the nearest rupee as the Scheme requires:",
      caption: "EPF contributions a month for a worker on ₹20,000 and on ₹30,000 of PF wages",
      columns: ["", "₹20,000 a month", "₹30,000 a month"],
      rows: [
        ["Worker, 12%", "₹2,400", "₹3,000 (on ₹25,000)"],
        ["Employer to EPS, 8.33%", "₹1,666", "₹2,083 (on ₹25,000)"],
        ["Employer to EPF", "₹734", "₹917"],
        ["EDLI, 0.5%", "₹100", "₹125"],
        ["Admin charges, 0.5%", "₹100", "₹125"],
        ["Cost to the employer", "₹2,600", "₹3,250"],
        ["Total paid in", "₹5,000", "₹6,250"],
      ],
      note: "The ₹30,000 column is for an existing member with no joint option for higher wages, so contributions stop at ₹25,000. A worker who is not in the pension scheme has the employer's whole 12% in EPF.",
    },
    {
      kind: "facts",
      id: "change",
      heading: "What changed on 17 September 2026.",
      intro: "What EPFO's FAQs ask employers to do:",
      rows: [
        { label: "September's return", text: "Work out 1 to 16 September on ₹15,000 and 17 to 30 September on ₹25,000, in a single ECR." },
        { label: "Workers newly covered", text: "Anyone in service on 17 September earning up to ₹25,000 who had been left out must be enrolled in EPF, EPS and EDLI from that date. The employer enrols them; they do not apply." },
        { label: "Pension membership", text: "EPF members earning between ₹15,000 and ₹25,000 who were not in EPS join it from 17 September 2026." },
        { label: "Unrecovered share", text: "A worker's share for September that was not deducted can be recovered in the next payroll, but the full amount was still due by 15 October." },
        { label: "Salary structure", text: "The employer's share cannot be passed on by describing it as part of the cost to company." },
      ],
    },
    {
      kind: "facts",
      id: "contract-workers",
      heading: "Contract workers.",
      rows: [
        { label: "Covered", text: "The Code counts a person employed directly or through a contractor as an employee, and a contractor as an employer." },
        { label: "Who is liable", text: "The principal employer stays responsible for contributions and admin charges for workers employed through a contractor, jointly and severally with the contractor, and can recover the money from the contractor's bills or as a debt." },
        { label: "Paperwork", text: "The principal employer declares its contractors in Form X; each contractor sends Form XI within 10 days of the month's end; the principal employer files Form XII within 20 days." },
      ],
    },
    {
      kind: "table",
      id: "late",
      heading: "Paid late.",
      intro: "Interest of 12% a year runs from the due date until payment, and damages are charged on the arrears:",
      caption: "EPF damages on arrears, per month of delay",
      columns: ["Delay", "Damages a month"],
      rows: [
        ["Less than two months", "0.25% of the arrears"],
        ["More than two and less than four months", "0.5%"],
        ["More than four months", "1%"],
      ],
      note: "Damages cannot exceed the arrears. A late ECR costs ₹500 a day, up to that month's admin charges.",
    },
  ],
  faqs: [
    {
      question: "Is EPF compulsory for a worker earning more than ₹25,000?",
      answer: "Not for a new joiner: a worker whose PF wages are above the ceiling when they join is excluded unless they and the employer jointly opt to contribute on higher wages. For existing members, contributions are worked out on ₹25,000 unless both opt for more.",
    },
    {
      question: "Who pays EPF for contract workers?",
      answer: "The contractor deducts and pays it, but the principal employer remains responsible with the contractor. If the contractor does not pay, the principal employer must, and can recover it from the contractor.",
    },
    {
      question: "When is EPF due?",
      answer: "Within 15 days of the end of the month: by the 15th, with the electronic challan-cum-return. Interest of 12% a year and damages apply after that.",
    },
  ],
  sources: ["css-2020", "epf-ceiling-2026", "epf-ceiling-2026-may", "epf-scheme-2026", "eps-2026", "edli-scheme-2026", "epf-faq-2026", "interest-2026"],
  links: [
    { href: "/esic", label: "ESIC for employers" },
    { href: "/minimum-wages", label: "Minimum wages by state" },
    { href: "/labour-welfare-fund", label: "Labour Welfare Fund by state" },
  ],
  checked: "2026-10-18",
};
