/**
 * /guides/new-labour-codes (PLAN §4 row 11, §5.6). Mixed audience: plant HR
 * reads it, and so do workers, so the page carries no phone.
 *
 * Status checked against the Gazette of India and state gazettes on
 * 16 October 2026 (sources.ts). Every legal statement carries a citation.
 * Section numbers behind the citations, for the reviewer:
 *   Code on Wages: s.2(y) wages and the one-half proviso; s.5 minimum wage
 *     for every employee; s.8(4) revision within five years; s.9 floor wage;
 *     s.17 time limits; s.69 repeal and savings.
 *   Social Security Code: s.2(88) wages; s.53 gratuity (fixed term, pro
 *     rata); s.164 repeal; First Schedule (EPF 20+, ESIC 10+).
 *   IR Code: s.2(o) fixed-term employment; s.2(zh)(iv) retrenchment;
 *     s.28 standing orders (300+); s.104 repeal.
 *   OSH Code: s.2(1)(d) appropriate Government; s.2(1)(p) core activity;
 *     s.6(1)(c), (f) health check, appointment letter; s.27 overtime;
 *     ss.45–57 contract labour; s.143 repeal and savings.
 */
import type { Guide } from "./index";

export const newLabourCodes: Guide = {
  slug: "new-labour-codes",
  audience: "mixed",
  title: "New Labour Codes 2026: What Changes for Employers",
  description:
    "The four labour codes in plain English: what is in force, what changes for wages, PF, safety and fixed-term work, and what to check if you use contract labour.",
  h1: "The new labour codes, explained for employers.",
  lede: "All four labour codes came into force on 21 November 2025. The central rules followed on 8 May 2026. States are still finishing their own rules, so check your state before you change anything.",
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
      id: "where-things-stand",
      eyebrow: "STATUS",
      heading: "Where things stand",
      blocks: [
        {
          type: "p",
          text: "The Central Government brought the four Codes into force on 21 November 2025, through four notifications in the Gazette of India that day.[[so-5322]][[so-5320]][[so-5319]][[so-5321]] The Industrial Relations Code and the OSH Code came into force in full. The Code on Wages and the Code on Social Security came into force in part. A few of their sections were left for later notifications.[[so-5322]][[so-5319]]",
        },
        {
          type: "p",
          text: "The Ministry of Labour and Employment said that during the transition, the relevant parts of the old Acts, and their rules, notifications and schemes, stay in force.[[pib-codes-effective]] The Codes also keep things done under the old Acts, such as notifications and appointments, to the extent they don't conflict with the Codes.[[code-wages]][[code-osh]]",
        },
        {
          type: "p",
          text: "Rules come in two sets. The central rules cover establishments under the Central Government, such as mines, major ports and central public sector units. They were notified on 8 May 2026.[[gsr-343]][[gsr-342]][[gsr-344]][[gsr-345]] For a factory, the appropriate Government is the state where it is.[[code-osh]] So for most plants, the state's own rules decide the forms, registers and timelines.",
        },
        { type: "h3", text: "State rules we have checked" },
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
              cells: ["Final, 12 August 2026[[up-wages-rules]]", "Not confirmed", "Final, 27 August 2026[[up-ss-rules]]", "Final, 27 August 2026[[up-osh-rules]]"],
            },
            { head: "Delhi", cells: ["Not confirmed", "Not confirmed", "Not confirmed", "Not confirmed"] },
          ],
        },
        {
          type: "p",
          text: "\"Not confirmed\" means we have not seen final rules in that state's own gazette. It does not mean there are none. Check with the state labour department before you rely on this table.",
        },
      ],
    },
    {
      id: "if-you-work-on-contract",
      eyebrow: "FOR WORKERS",
      heading: "If you work on contract",
      blocks: [
        { type: "p", text: "If a contractor employs you, these rules protect you." },
        {
          type: "rows",
          items: [
            { title: "Minimum wage", text: "Every worker gets at least the minimum wage.[[code-wages]]" },
            { title: "Pay day", text: "Monthly pay is due by the 7th of next month.[[code-wages]]" },
            { title: "Bank transfer", text: "The contractor pays wages into your bank account.[[code-osh]]" },
            { title: "Appointment letter", text: "You get a letter of appointment.[[code-osh]]" },
            { title: "No fee", text: "A contractor can't charge you any fee or commission.[[code-osh]]" },
            { title: "Overtime", text: "Overtime is paid at double the rate. It needs your consent.[[code-osh]]" },
            { title: "PF and ESIC", text: "PF covers workplaces with 20 or more workers. ESIC starts at 10.[[code-ss]]" },
          ],
        },
        { type: "link", href: "/jobs", label: "Looking for work? See jobs" },
      ],
    },
    {
      id: "four-codes",
      eyebrow: "OVERVIEW",
      heading: "The four codes in one table",
      short: "The four codes",
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
        { type: "p", text: "Together the four Codes consolidate 29 central labour laws.[[pib-codes-effective]] The EPF Act's repeal has not yet been notified.[[so-5319]]" },
      ],
    },
    {
      id: "code-on-wages",
      eyebrow: "CODE ON WAGES",
      heading: "Code on Wages: what counts as wages, and when to pay",
      short: "Code on Wages",
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
        { type: "h3", text: "Floor wage" },
        {
          type: "p",
          text: "The Central Government fixes a floor wage. A state's minimum wage may not be lower than it, and a state that already pays more may not reduce its rates.[[code-wages]] When we checked on 16 October 2026, we had not found a Gazette notification fixing the floor wage.",
        },
        {
          type: "p",
          text: "States review or revise their minimum wages, ordinarily at intervals of not more than five years.[[code-wages]] Many also add a dearness allowance twice a year. Our wage pages show the current rates for each state we cover.",
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
      eyebrow: "SOCIAL SECURITY CODE",
      heading: "Social Security Code: PF, ESIC and gratuity",
      short: "Social Security Code",
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
      eyebrow: "OSH CODE",
      heading: "OSH Code: contract labour, licences and safety",
      short: "OSH Code and contract labour",
      blocks: [
        {
          type: "p",
          text: "The Contract Labour (Regulation and Abolition) Act, 1970 is repealed. Its rules for contract labour now sit in the OSH Code, in sections 45 to 58.[[code-osh]]",
        },
        { type: "h3", text: "Who the contract labour part applies to" },
        {
          type: "p",
          text: "It applies to an establishment that employs 50 or more contract labour through contract, or did on any day in the last 12 months. It also applies to a manpower supply contractor who employed 50 or more contract labour on any day in the last 12 months.[[code-osh]] The 1970 Act started at 20.[[clra-1970]]",
        },
        {
          type: "p",
          text: "It does not apply where the work is only intermittent or casual. Work done for more than 120 days in a year, or seasonal work done for more than 60 days, does not count as intermittent.[[code-osh]]",
        },
        { type: "h3", text: "The contractor's licence" },
        {
          type: "p",
          text: "A contractor covered by this part needs a licence to supply or engage contract labour. The licence states how many workers the contractor may supply and the security deposit. It is valid for five years.[[code-osh]] A contractor working in more than one state can take one licence from the authority the Central Government names.[[code-osh]]",
        },
        {
          type: "p",
          text: "If a principal employer uses a contractor who needs a licence and has none, that employment is itself a breach of the Code.[[code-osh]]",
        },
        { type: "h3", text: "What the principal employer answers for" },
        {
          type: "rows",
          items: [
            { title: "Welfare facilities", text: "The principal employer provides the welfare facilities the Code requires to the contract labour at its site.[[code-osh]]" },
            {
              title: "Unpaid wages",
              text: "If the contractor doesn't pay on time, or pays short, the principal employer pays the workers in full and recovers the amount from the contractor.[[code-osh]]",
            },
            { title: "A licensed contractor", text: "Using a contractor who needs a licence and doesn't hold one is a breach.[[code-osh]]" },
          ],
        },
        { type: "h3", text: "Core and non-core work" },
        {
          type: "p",
          text: "Contract labour is not allowed in an establishment's core activities, with three exceptions. The work is normally done through contractors in that kind of establishment. Or it doesn't need full-time workers for most of the day. Or there is a sudden rise in work that must be finished in a set time.[[code-osh]]",
        },
        {
          type: "p",
          text: "The Code lists support work that isn't core unless the establishment is set up for it. The list includes cleaning and sanitation, watch and ward, canteens, loading and unloading, housekeeping and laundry, gardening, civil and maintenance work, courier and transport, and intermittent work.[[code-osh]]",
        },
        { type: "h3", text: "For every employee" },
        {
          type: "p",
          text: "Every employer issues a letter of appointment to each employee, and gives the free annual health check-ups the rules require.[[code-osh]] The government's summary says this covers workers over 40.[[pib-codes-effective]] Overtime is paid at twice the normal rate, and needs the worker's consent.[[code-osh]]",
        },
        {
          type: "p",
          text: "A contractor may not charge contract labour any fee or commission. On request, the contractor gives each worker an experience certificate.[[code-osh]]",
        },
        { type: "link", href: "/guides/contract-labour-act", label: "The Contract Labour Act and the OSH Code" },
      ],
    },
    {
      id: "fixed-term-employment",
      eyebrow: "INDUSTRIAL RELATIONS CODE",
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
        { type: "link", href: "/guides/what-is-contract-labour", label: "What contract labour is, and who employs the workers" },
        { type: "h3", text: "Standing orders" },
        {
          type: "p",
          text: "Standing orders set out the conditions of service in writing. The Code requires them in industrial establishments with 300 or more workers.[[code-ir]]",
        },
      ],
    },
    {
      id: "check-your-contractor",
      eyebrow: "BEFORE YOU SIGN",
      heading: "What to check with your contractor",
      short: "Checks for your contractor",
      blocks: [
        { type: "p", text: "If you use contract labour, ask your contractor for these. Each one maps to a duty in the Codes." },
        {
          type: "rows",
          items: [
            {
              title: "Licence",
              text: "A current licence under the OSH Code, if the contractor or your site has 50 or more contract labour. Check the number of workers it allows.[[code-osh]]",
            },
            { title: "Minimum wage", text: "Rates at or above the minimum wage for your state, zone and skill level.[[code-wages]]" },
            {
              title: "Wages paid on time",
              text: "Bank transfer records for each wage period, by the deadline, and the statement of what was paid.[[code-wages]][[code-osh]]",
            },
            { title: "PF and ESIC", text: "Monthly challans and contribution details for each covered worker.[[code-ss]]" },
            { title: "Attendance and overtime", text: "Attendance and overtime records that match the wage sheet, with overtime at twice the rate.[[code-osh]]" },
            { title: "Appointment letters", text: "A letter of appointment for each worker.[[code-osh]]" },
            { title: "No fees from workers", text: "Confirmation that no worker was charged a fee or commission.[[code-osh]]" },
            { title: "Full and final pay", text: "Dues paid within two working days when a worker leaves or is removed.[[code-wages]]" },
          ],
        },
        {
          type: "vspl",
          text: "We’re a manpower contractor, not a placement agency: the workers are on our payroll, and we manage attendance, wages, EPF and ESIC. Applicable EPF and ESIC records are available for your review. Before you sign, ask us for the registration and licence details that apply to your site.",
        },
        { type: "link", href: "/compliance", label: "How we handle compliance" },
      ],
    },
    {
      id: "still-pending",
      eyebrow: "STILL PENDING",
      heading: "What is still pending",
      blocks: [
        {
          type: "rows",
          items: [
            { title: "State rules", text: "Some states have notified final rules. Others have published proposed rules. See the state table above, as checked on 16 October 2026." },
            { title: "Floor wage", text: "We have not found a Gazette notification fixing the national floor wage." },
            {
              title: "Parts of two Codes",
              text: "Some sections of the Code on Wages and the Code on Social Security were not in the November 2025 notifications.[[so-5322]][[so-5319]]",
            },
            {
              title: "Old rules in the meantime",
              text: "During the transition, the relevant provisions of the old Acts and their rules stay in force.[[pib-codes-effective]]",
            },
          ],
        },
        { type: "p", text: "We update this guide when a state notifies its rules, or the Centre fixes the floor wage." },
      ],
    },
  ],
  faqs: [
    {
      question: "Are the new labour codes in force?",
      answer:
        "Yes. All four came into force on 21 November 2025.[[so-5322]][[so-5320]][[so-5319]][[so-5321]] A few sections of the Code on Wages and the Code on Social Security were left for later. The central rules followed on 8 May 2026, and states are notifying their own.[[gsr-343]]",
    },
    {
      question: "Do the old labour Acts still apply?",
      answer:
        "Most of them are repealed as the Codes come into force. The EPF Act's repeal has not yet been notified.[[so-5319]] During the transition, the government said, the relevant provisions of the old Acts and their rules stay in force.[[pib-codes-effective]] Things done under the old Acts carry over where they don't conflict with the Codes.[[code-wages]][[code-osh]]",
    },
    {
      question: "Does basic pay now have to be half of total pay?",
      answer:
        "The Code doesn't fix basic pay. It says that if the excluded allowances add up to more than half of total pay, the excess counts as wages.[[code-wages]] In practice, that keeps wages, as the law counts them, at about half of total pay or more.",
    },
    {
      question: "Is a licence taken under the 1970 Contract Labour Act still valid?",
      answer:
        "The 1970 Act is repealed. The OSH Code keeps anything done under it in force, to the extent it doesn't conflict with the Code, until the Central Government repeals it.[[code-osh]] Check your state's rules for when a licence under the Code is needed.",
    },
    {
      question: "Does a contractor with fewer than 50 workers need a licence?",
      answer:
        "The contract labour part of the OSH Code applies to a manpower supply contractor who employed 50 or more contract labour on any day in the last 12 months, and to establishments with 50 or more.[[code-osh]] Below that it doesn't apply. Other duties, such as minimum wages and paying on time, still do.[[code-wages]]",
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
    "clra-1970",
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
  doors: "mixed",
};
