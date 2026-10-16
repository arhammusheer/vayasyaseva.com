/**
 * /guides/what-is-contract-labour (PLAN §4 row 12, §5.2 explainer). For
 * buyers. Contractor terms in the title, H1, headings and meta; the agency
 * words appear only in the comparison table, the body difference paragraph
 * and the standard FAQ (docs/brand-rules.md).
 *
 * Section numbers behind the citations, for the reviewer: OSH Code s.2(1)(m)
 * contract labour, s.2(1)(n) contractor, s.2(1)(p) core activity, s.45
 * applicability, s.47 licence, ss.53–55 principal employer, s.57 core
 * activities; IR Code s.2(o) fixed-term employment; Code on Wages s.5.
 */
import type { Guide } from "./index";

export const whatIsContractLabour: Guide = {
  slug: "what-is-contract-labour",
  audience: "mixed",
  title: "What Is Contract Labour? How a Contractor Works",
  crumb: "What is contract labour",
  description:
    "Contract labour explained: who employs the workers, who pays wages, EPF and ESIC, who supervises, and when it suits a plant better than hiring directly.",
  h1: "What contract labour is, and who employs the workers.",
  lede: "Contract labour means the workers stay on the contractor's payroll while they work at your site. Here is who does what, when it fits, and when to hire directly.",
  published: null,
  updated: "2026-10-16",
  checkedOn: "2026-10-16",
  review: null,
  facts: [
    { label: "The law", value: "OSH Code, 2020, in force from 21 November 2025", cite: "so-5321" },
    { label: "Contractor's licence", value: "From 50 or more contract workers", cite: "code-osh" },
  ],
  sections: [
    {
      id: "what-it-means",
      eyebrow: "THE TERM",
      heading: "What contract labour means",
      blocks: [
        {
          type: "p",
          text: "Contract labour means workers hired for your work by or through a contractor. They work at your site, but they are the contractor's workers.[[code-osh]]",
        },
        {
          type: "p",
          text: "A contractor is a business that produces a result for you through contract labour, or supplies workers for your work. A sub-contractor counts too. The business whose work it is, and which engages the contractor, is the principal employer.[[code-osh]]",
        },
        {
          type: "p",
          text: "A worker the contractor employs regularly in its own business, on permanent terms with increments and social security, is not contract labour.[[code-osh]]",
        },
        {
          type: "p",
          text: "The rules sit in the OSH Code. It replaced the Contract Labour (Regulation and Abolition) Act, 1970 when it came into force on 21 November 2025.[[so-5321]][[code-osh]]",
        },
      ],
    },
    {
      id: "who-does-what",
      eyebrow: "SIDE BY SIDE",
      heading: "Who does what",
      blocks: [
        {
          type: "table",
          caption: "Three ways to staff a site, compared",
          columns: ["", "Contract labour through a contractor", "Placement or staffing agency", "Direct hire"],
          rows: [
            {
              head: "Who employs the workers",
              cells: ["The contractor. Workers are on its payroll.[[code-osh]]", "You do. The agency finds candidates and you hire them.", "You do."],
            },
            {
              head: "Who pays wages",
              cells: ["The contractor, by bank transfer, and it tells you what was paid.[[code-osh]]", "You do, once they join.", "You do."],
            },
            { head: "Who deposits EPF and ESIC", cells: ["The contractor, as the employer. You check the challans.", "You do.", "You do."] },
            { head: "Who supervises", cells: ["The contractor, through its supervisor at your site.", "Your own supervisors.", "Your own supervisors."] },
            { head: "Who replaces absentees", cells: ["The contractor.", "You hire again, or ask for more candidates.", "You do."] },
            { head: "How you are invoiced", cells: ["One invoice from the contractor.", "A fee per hire, if the agency charges you.", "No invoice. You run payroll."] },
            {
              head: "If wages go unpaid",
              cells: [
                "The contractor pays first. If it doesn't pay on time, you pay and recover the amount.[[code-osh]]",
                "You answer, as the employer.",
                "You answer, as the employer.",
              ],
            },
            {
              head: "Licence",
              cells: ["The contractor needs one once it has 50 or more contract workers.[[code-osh]]", "Not under the contract labour rules, when it only places candidates.", "Not needed."],
            },
          ],
        },
        {
          type: "p",
          text: "Whatever a supplier calls itself, ask one question: whose payroll will the workers be on? If it is the supplier's, in law it is a contractor supplying contract labour, and the same rules apply.[[code-osh]]",
        },
      ],
    },
    {
      id: "when-it-suits",
      eyebrow: "WHEN IT FITS",
      heading: "When contract labour suits a plant",
      blocks: [
        {
          type: "rows",
          items: [
            {
              title: "Peaks in volume",
              text: "Seasonal peaks or a sudden rise in orders. The Code allows contract labour even in core work when there is a sudden rise in work that must be done in a set time.[[code-osh]]",
            },
            {
              title: "Support work",
              text: "Housekeeping, loading and unloading, cleaning, canteens and maintenance. The Code treats these as non-core unless your establishment is set up for them.[[code-osh]]",
            },
            {
              title: "A new line or site",
              text: "Starting before you know the long-term headcount. The contractor recruits, pays and replaces workers, and you get one invoice.",
            },
          ],
        },
      ],
    },
    {
      id: "when-it-doesnt",
      eyebrow: "WHEN IT DOESN'T",
      heading: "When to hire directly instead",
      short: "When to hire directly",
      blocks: [
        {
          type: "p",
          text: "Contract labour is not allowed in core activities, outside the exceptions above.[[code-osh]] If a role is central to your production and steady all year, hire for it yourself, on permanent or fixed-term terms.",
        },
        {
          type: "p",
          text: "Roles that need long training or knowledge of your plant are often better as your own staff. You keep the skills you pay to build.",
        },
        {
          type: "p",
          text: "If you need a handful of people for a few days, setting up a contractor may cost more effort than it saves.",
        },
      ],
    },
    {
      id: "fixed-term-and-temporary",
      eyebrow: "OTHER OPTIONS",
      heading: "Fixed-term employment and temporary staff",
      short: "Fixed-term and temporary staff",
      blocks: [
        {
          type: "p",
          text: "Fixed-term employment means you hire the worker yourself, on a written contract for a fixed period.[[code-ir]] The worker gets the same hours, wages and benefits as a permanent worker doing the same work, and is eligible for gratuity after one year.[[code-ir]]",
        },
        {
          type: "p",
          text: "A temporary staff agency can work either way. If the workers stay on its payroll, it is acting as a contractor. If they are on yours, you are the employer, and the fixed-term rules may apply.",
        },
        {
          type: "rows",
          items: [
            { title: "Permanent employee", text: "Your employee, with no end date." },
            { title: "Fixed-term employee", text: "Your employee, for a set period, on the same terms as permanent staff.[[code-ir]]" },
            { title: "Contract labour", text: "The contractor's worker, at your site. The contractor pays, and you check.[[code-osh]]" },
          ],
        },
        { type: "link", href: "/guides/new-labour-codes", label: "The new labour codes, explained for employers" },
      ],
    },
    {
      id: "principal-employer",
      eyebrow: "STILL YOURS",
      heading: "What stays with you as principal employer",
      short: "Your duties as principal employer",
      blocks: [
        {
          type: "rows",
          items: [
            { title: "Welfare facilities", text: "You provide the welfare facilities the Code requires to the contract labour at your site.[[code-osh]]" },
            { title: "Unpaid wages", text: "If the contractor doesn't pay on time, or pays short, you pay the workers and recover the amount from the contractor.[[code-osh]]" },
            { title: "A licensed contractor", text: "Using a contractor who needs a licence and doesn't hold one is a breach of the Code.[[code-osh]]" },
          ],
        },
      ],
    },
    {
      id: "how-we-work",
      eyebrow: "VAYASYA SEVA",
      heading: "How we work as a contractor",
      blocks: [
        {
          type: "vspl",
          text: "We’re a manpower contractor: the workers are on our payroll, and we manage attendance, wages, EPF and ESIC. Before you sign, ask us for the registration and licence details that apply to your site.",
        },
        {
          type: "p",
          text: "We supply crews for factories, warehouses and facilities, on full 8-hour shifts. Our supervisors run the crew on site and replace absentees. For each worker we track retention, training and how long they take to reach full pace.",
        },
        { type: "link", href: "/services#engagement", label: "How an engagement runs" },
        { type: "link", href: "/compliance", label: "How we handle compliance" },
      ],
    },
  ],
  faqs: [
    {
      question: "Are you a manpower agency or a staffing company?",
      answer:
        "We’re a manpower contractor. An agency sends you candidates to hire. We supply the workers, keep them on our payroll, supervise them on site, replace absentees and handle wages, EPF and ESIC. You get a working crew and one invoice.",
    },
    {
      question: "Is contract labour legal for production work?",
      answer:
        "Production is usually a core activity, and the OSH Code prohibits contract labour in core activities. There are three exceptions. The work is normally done through contractors in that kind of establishment. Or it doesn't need full-time workers for most of the day. Or there is a sudden rise in work that must be done in a set time.[[code-osh]] If there is a dispute, the appropriate Government decides whether an activity is core.[[code-osh]]",
    },
    {
      question: "What does a contractor charge?",
      answer:
        "A contractor's invoice usually covers the wages it pays, the EPF and ESIC contributions on those wages, and a service charge for recruiting, supervising and replacing workers. The wages can't be below the state's minimum wage.[[code-wages]] We quote once we know the work, the headcount, the shifts and the site.",
    },
    {
      question: "Who is the principal employer?",
      answer:
        "The business whose work the contract labour does, and which engages the contractor. It provides welfare facilities at its site, and pays the workers if the contractor defaults.[[code-osh]]",
    },
  ],
  sources: ["so-5321", "code-osh", "code-ir", "code-wages"],
  doors: "business",
};
