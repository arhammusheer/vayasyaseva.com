/**
 * /guides/new-labour-codes (PLAN §4 row 11, §5.6): an employer guide to the
 * four codes, for plant HR and compliance heads. The reference layout, so
 * no phone. It stays on the four codes: contract labour licensing and the
 * principal employer's duties are parked for a future
 * /guides/contract-labour-act (docs/guide-drafts/contract-labour-act.md).
 *
 * Status checked against the Gazette of India and state gazettes on
 * 16 October 2026 (sources.ts). Every legal statement keeps its [[source]]
 * marker: the page lists each section's sources at its foot, not after
 * each sentence. Section numbers behind the citations, for the reviewer:
 *   Code on Wages: s.2(y) wages and the one-half proviso; s.5 minimum wage
 *     for every employee; s.8(4) revision within five years; s.9 floor wage;
 *     s.17 time limits; s.69 repeal and savings.
 *   Social Security Code: s.2(88) wages; s.53 gratuity (fixed term, pro
 *     rata); s.164 repeal; First Schedule (EPF 20+, ESIC 10+).
 *   IR Code: s.2(o) fixed-term employment; s.2(zh)(iv) retrenchment;
 *     s.28 standing orders (300+); s.104 repeal.
 *   OSH Code: s.2(1)(d) appropriate Government; s.6(1)(c), (f) health
 *     check, appointment letter; s.27 overtime; ss.45–57 contract labour;
 *     s.143 repeal and savings.
 */
import type { Guide } from "./index";

export const newLabourCodes: Guide = {
  slug: "new-labour-codes",
  audience: "mixed",
  title: "New Labour Codes 2026: What Changes for Employers",
  crumb: "New labour codes",
  description:
    "The four labour codes in plain English: in force since November 2025, and what changes at a plant for wages, PF and ESIC, safety and fixed-term work.",
  h1: "The new labour codes, explained for employers.",
  lede: "All four labour codes have been in force since 21 November 2025. The central rules followed on 8 May 2026. States are still finishing their own rules, so check your state before you change anything.",
  published: null,
  updated: "2026-10-16",
  checkedOn: "2026-10-16",
  review: null,
  facts: [
    { label: "In force from", value: "21 November 2025", cite: "so-5322" },
    { label: "Central rules", value: "8 May 2026", cite: "gsr-343" },
    { label: "Laws consolidated", value: "29 central labour laws", cite: "pib-codes-effective" },
  ],
  sections: [
    {
      id: "four-codes",
      heading: "The four codes in one table",
      blocks: [
        {
          type: "table",
          caption: "The four labour codes, the laws each replaced, and what each changes at a plant",
          columns: ["Code", "What it replaced", "What it changes at a plant"],
          rows: [
            {
              head: "Code on Wages, 2019",
              cells: [
                "Payment of Wages Act, Minimum Wages Act, Payment of Bonus Act and Equal Remuneration Act[[code-wages]]",
                "One definition of wages. A minimum wage for every employee. Fixed deadlines for paying wages.",
              ],
            },
            {
              head: "Code on Social Security, 2020",
              cells: [
                "Nine Acts, including the ESI Act, the Payment of Gratuity Act and the Maternity Benefit Act. Repeal of the EPF Act was not part of the November 2025 notification.[[code-ss]][[so-5319]]",
                "PF, ESIC, gratuity and maternity benefit under one law. Gratuity for fixed-term employees.",
              ],
            },
            {
              head: "Industrial Relations Code, 2020",
              cells: [
                "Trade Unions Act, Industrial Employment (Standing Orders) Act and Industrial Disputes Act[[code-ir]]",
                "Fixed-term employment set out in law. Standing orders from 300 workers.",
              ],
            },
            {
              head: "OSH Code, 2020",
              cells: [
                "Thirteen Acts, including the Factories Act and the Contract Labour (Regulation and Abolition) Act[[code-osh]]",
                "Contract labour rules move here. Appointment letters for every employee. Free annual health check-ups.",
              ],
            },
          ],
        },
        { type: "p", text: "Together the four Codes consolidate 29 central labour laws.[[pib-codes-effective]]" },
      ],
    },
    {
      id: "code-on-wages",
      heading: "Code on Wages: what counts as wages, and when to pay",
      blocks: [
        {
          type: "p",
          text: "No employer may pay an employee less than the minimum wage the government has notified.[[code-wages]] Under the old Minimum Wages Act, rates applied only to listed (scheduled) employments. Now they cover every employee.[[pib-codes-effective]]",
        },
        { type: "h3", text: "One definition of wages" },
        {
          type: "p",
          text: "Wages means basic pay, dearness allowance and retaining allowance. Some payments are left out, such as house rent allowance, conveyance, overtime, commission, bonus and the employer's PF contribution.[[code-wages]]",
        },
        {
          type: "p",
          text: "There is a limit. If those left-out payments add up to more than half of total pay, the part above half is added back into wages.[[code-wages]] The Code on Social Security has the same rule.[[code-ss]] So a pay structure with a small basic and large allowances will have more of its pay counted as wages, including for PF and gratuity.",
        },
        { type: "h3", text: "Minimum and floor wages" },
        {
          type: "p",
          text: "The Central Government fixes a floor wage, and no state's minimum wage may be lower than it.[[code-wages]] When we checked on 16 October 2026, no floor wage had been notified. States revise their own rates at intervals of not more than five years, and many add a dearness allowance twice a year.[[code-wages]]",
        },
        { type: "link", href: "/minimum-wages", label: "Minimum wages by state" },
        { type: "h3", text: "When wages must be paid" },
        {
          type: "table",
          caption: "Time limits for paying wages under section 17 of the Code on Wages",
          columns: ["Wage period", "Pay by"],
          rows: [
            { head: "Daily", cells: ["The end of the shift[[code-wages]]"] },
            { head: "Weekly", cells: ["The last working day of the week, before the weekly holiday[[code-wages]]"] },
            { head: "Fortnightly", cells: ["Before the end of the second day after the fortnight[[code-wages]]"] },
            { head: "Monthly", cells: ["Before the end of the 7th day of the next month[[code-wages]]"] },
            { head: "Worker leaves or is removed", cells: ["Within two working days[[code-wages]]"] },
          ],
        },
        {
          type: "p",
          text: "For contract labour, the contractor pays the wages by bank transfer or another electronic mode, and tells the principal employer what was paid.[[code-osh]]",
        },
      ],
    },
    {
      id: "social-security",
      heading: "Social Security Code: PF, ESIC and gratuity",
      blocks: [
        {
          type: "p",
          text: "The Code brings provident fund, ESIC, gratuity, maternity benefit and employee compensation under one law.[[code-ss]]",
        },
        {
          type: "p",
          text: "The PF chapter applies to every establishment with 20 or more employees. The ESIC chapter applies to every establishment with 10 or more persons, other than a seasonal factory. It also applies to an establishment with even one employee if the work is a hazardous occupation the Central Government has notified.[[code-ss]]",
        },
        {
          type: "p",
          text: "The PF scheme is new too. The Employees' Provident Funds Scheme, 2026 was notified under the Code on 29 June 2026.[[gsr-525]] Payroll teams should read it against the 1952 scheme they have worked to.",
        },
        {
          type: "p",
          text: "Gig work, platform work and aggregators are defined in law for the first time, and aggregators contribute to a fund for those workers.[[code-ss]][[pib-codes-effective]] Gratuity for fixed-term employees is covered below.",
        },
      ],
    },
    {
      id: "osh-code",
      heading: "OSH Code: appointment letters, health checks and overtime",
      blocks: [
        {
          type: "p",
          text: "Every employer issues a letter of appointment to each employee, and gives the free annual health check-ups the rules require.[[code-osh]] The government's summary says this covers workers over 40.[[pib-codes-effective]] Overtime is paid at twice the normal rate, and needs the worker's consent.[[code-osh]]",
        },
        {
          type: "p",
          text: "The Contract Labour Act, 1970 is repealed; its rules now sit in the OSH Code, for establishments and contractors with 50 or more contract labour.[[code-osh]]",
        },
      ],
    },
    {
      id: "fixed-term-employment",
      heading: "Fixed-term employment",
      blocks: [
        {
          type: "p",
          text: "The Industrial Relations Code defines fixed-term employment. It is the engagement of a worker on a written contract for a fixed period.[[code-ir]]",
        },
        {
          type: "rows",
          items: [
            {
              title: "Same terms",
              text: "Hours, wages, allowances and other benefits may not be less than those of a permanent worker doing the same or similar work.[[code-ir]]",
            },
            {
              title: "Benefits in proportion",
              text: "The worker gets the statutory benefits a permanent worker gets, in proportion to the service, even if the contract is shorter than the qualifying period.[[code-ir]]",
            },
            {
              title: "Gratuity",
              text: "The worker is eligible for gratuity after one year of service under the contract.[[code-ir]] It is paid pro rata, and five years' service is not needed when the fixed term ends.[[code-ss]]",
            },
            { title: "End of the term", text: "A fixed-term contract that ends on its date is not a retrenchment.[[code-ir]]" },
          ],
        },
        {
          type: "p",
          text: "A fixed-term employee is your own employee. Contract labour is employed by the contractor. Both are lawful, and each carries different duties for you.",
        },
        { type: "h3", text: "Standing orders" },
        {
          type: "p",
          text: "Standing orders set out the conditions of service in writing. The Code requires them in industrial establishments with 300 or more workers.[[code-ir]]",
        },
      ],
    },
    {
      id: "status",
      heading: "Where things stand, and what is still pending",
      blocks: [
        {
          type: "p",
          text: "The Central Government brought the four Codes into force on 21 November 2025, through four Gazette notifications that day.[[so-5322]][[so-5320]][[so-5319]][[so-5321]] The Industrial Relations Code and the OSH Code came into force in full. Some sections of the Code on Wages and the Code on Social Security were left for later notifications, and the EPF Act's repeal has not yet been notified.[[so-5322]][[so-5319]]",
        },
        {
          type: "p",
          text: "During the transition, the government said, the relevant parts of the old Acts and their rules stay in force.[[pib-codes-effective]] Things done under the old Acts, such as notifications and appointments, carry over where they don't conflict with the Codes.[[code-wages]][[code-osh]]",
        },
        {
          type: "p",
          text: "The central rules, notified on 8 May 2026, cover establishments under the Central Government, such as mines, major ports and central public sector units.[[gsr-343]][[gsr-342]][[gsr-344]][[gsr-345]] For a factory, the appropriate Government is the state where it is, so the state's own rules decide most plants' forms, registers and timelines.[[code-osh]]",
        },
        { type: "h3", text: "State rules we have confirmed" },
        {
          type: "table",
          caption: "Final and proposed state rules under the four Codes, as checked on 16 October 2026",
          columns: ["State", "Code on Wages", "Industrial Relations", "Social Security", "OSH"],
          rows: [
            {
              head: "Uttarakhand",
              cells: [
                "Final, 25 August 2026[[uk-wages-rules]]",
                "Final, 25 August 2026[[uk-ir-rules]]",
                "Proposed rules published[[uk-acts-rules]]",
                "Proposed rules published[[uk-acts-rules]]",
              ],
            },
            {
              head: "Uttar Pradesh",
              cells: ["Final, 12 August 2026[[up-wages-rules]]", "Not seen in the state gazette", "Final, 27 August 2026[[up-ss-rules]]", "Final, 27 August 2026[[up-osh-rules]]"],
            },
          ],
        },
        { type: "p", text: "We update this guide when a state notifies its rules, or the Centre fixes the floor wage." },
      ],
    },
  ],
  faqs: [
    {
      question: "Does basic pay now have to be half of total pay?",
      answer:
        "The Code doesn't fix basic pay. It says that if the excluded allowances add up to more than half of total pay, the excess counts as wages.[[code-wages]] In practice, that keeps wages, as the law counts them, at about half of total pay or more.",
    },
    {
      question: "Do fixed-term employees get gratuity?",
      answer: "Yes. A fixed-term employee is eligible after one year of service under the contract, paid pro rata.[[code-ir]][[code-ss]]",
    },
  ],
  sources: [
    "so-5322",
    "so-5320",
    "so-5319",
    "so-5321",
    "pib-codes-effective",
    "code-wages",
    "code-ss",
    "code-ir",
    "code-osh",
    "gsr-343",
    "gsr-342",
    "gsr-344",
    "gsr-345",
    "gsr-525",
    "uk-wages-rules",
    "uk-ir-rules",
    "uk-acts-rules",
    "up-wages-rules",
    "up-ss-rules",
    "up-osh-rules",
  ],
};
