import type { TopicPage } from "./types";

/**
 * /gratuity: gratuity for employers. Read against the documents on
 * 18 Oct 2026: the Code on Social Security, 2020 (First Schedule Chapter V;
 * s.1(8), 2(26), 2(27), 2(88), 53 to 58, 133, 134, 164(2)(a)), S.O. 5319(E)
 * (commencement), the Social Security (Central) Rules, 2026 (r.32, 33) and
 * S.O. 1420(E) of 2018 (₹20 lakh, kept by the savings clause).
 *
 * Stated as found, because no notification under the Code was found: the
 * ₹20 lakh ceiling (the 2018 figure, kept by s.164(2)(a)), the interest rate
 * on late payment (none notified), and the start of compulsory insurance
 * under s.57 (none notified). The Code has no principal-employer clause for
 * gratuity, unlike EPF and ESIC; the page says the contractor owes it. The
 * "four years and 240 days" practice is not in the Code's text and is not
 * claimed either way.
 */
export const gratuityTopic: TopicPage = {
  path: "/gratuity",
  title: "Gratuity 2026: Formula, Calculator, 5 Years, Fixed Term",
  description:
    "Gratuity under the Code on Social Security: 15 days' wages a year, after five years or one year for fixed-term workers, up to ₹20 lakh. Calculator and rules.",
  breadcrumb: "Gratuity",
  heading: "Gratuity for employers.",
  lede: "A worker who leaves after five years of continuous service, or after one year on a fixed-term contract, gets 15 days' wages for every year worked: monthly wages ÷ 26 × 15 × years, within 30 days.",
  glance: [
    { label: "For each year", note: "monthly wages ÷ 26 × 15", value: "15 days", key: true },
    { label: "Due after", note: "one year for fixed-term workers", value: "5 years" },
    { label: "Up to", value: "₹20 lakh" },
    { label: "Pay within", note: "of it falling due", value: "30 days" },
  ],
  updatedFrom: "the Code on Social Security and the Gazette",
  rules: [
    {
      heading: "Who it covers",
      rows: [
        { label: "Establishments", text: "Every factory, mine, plantation, port and railway company, and every shop or establishment with ten or more employees on any day of the last twelve months. Coverage continues if headcount later falls." },
        { label: "When it is due", text: "On leaving after at least five years of continuous service: superannuation, retirement or resignation. Five years are not needed on death or disablement, or when a fixed-term contract ends." },
        { label: "Fixed-term workers", text: "Due after one year under the contract, pro rata, with any further part over six months counting as a year." },
        { label: "Continuous service", text: "Uninterrupted service, counting sickness, leave, lay-off and strikes. Where service was interrupted, a year counts if the worker actually worked 240 days in it (190 below ground or in a five-day-week establishment)." },
      ],
    },
    {
      heading: "How much",
      rows: [
        { label: "The formula", text: "15 days' wages on the rate last drawn for each completed year, and for a part over six months: monthly wages ÷ 26 × 15 × years. A piece-rated worker's wage is the average of the last three months; a seasonal worker gets seven days' wages a season." },
        { label: "Which wages", text: "Basic pay, dearness allowance and retaining allowance (section 2(88)). HRA, conveyance, overtime and commission are left out, unless together they are more than half of pay." },
        { label: "The ceiling", text: "₹20 lakh, the figure notified in 2018 under the Payment of Gratuity Act and kept by the Code's savings clause; no new figure had been notified under the Code when we checked." },
        { label: "Forfeiture", text: "Up to the loss caused, for wilful damage to the employer's property; wholly or partly, for riotous or violent conduct, or an offence of moral turpitude committed in the course of employment." },
      ],
    },
    {
      heading: "When and how",
      rows: [
        { label: "Payment", text: "The employer works out the amount as soon as it falls due, whether or not the worker has applied, gives written notice, and pays within 30 days, by bank transfer or demand draft." },
        { label: "Paid late", text: "Simple interest from the due date, at up to the rate the Central Government sets for long-term deposits; no rate had been notified under the Code when we checked." },
        { label: "Nomination", text: "A worker nominates someone after completing one year of service." },
        { label: "Penalty", text: "Up to one year in prison, a fine of up to ₹50,000, or both; for a repeat, two to three years and a fine of ₹3 lakh." },
      ],
    },
    {
      heading: "Contract workers",
      rows: [
        { label: "Who owes it", text: "The contractor, as the employer of the workers it supplies. Unlike EPF and ESIC, the Code's gratuity chapter has no clause making the principal employer pay if the contractor does not." },
        { label: "Insurance", text: "The Code requires employers to insure their gratuity liability from a date the government notifies, or run an approved gratuity fund; no date had been notified when we checked." },
      ],
    },
  ],
  faqs: [
    {
      question: "Is gratuity payable after one year?",
      answer: "To a fixed-term worker, yes: after one year under the contract, in proportion to service. A regular worker needs five years of continuous service, except on death or disablement.",
    },
    {
      question: "How is gratuity calculated?",
      answer: "Monthly wages (basic and DA) ÷ 26 × 15, for each completed year and for a part over six months. On ₹18,000 a month after six years that is ₹62,307.69.",
    },
    {
      question: "Who pays gratuity to contract workers?",
      answer: "The contractor, as their employer. The Code does not make the principal employer liable for it, as it does for EPF and ESIC, so check that your contractor provides for it.",
    },
  ],
  sources: ["css-2020-gratuity", "gratuity-ceiling-2018", "ss-central-rules-gratuity"],
  links: [
    { href: "/epf", label: "EPF for employers" },
    { href: "/bonus", label: "Statutory bonus" },
  ],
  checked: "2026-10-18",
};
