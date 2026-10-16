/**
 * /compliance: the records we keep and the checks to make with any
 * contractor that the records list does not already cover. llms-full.txt
 * reads these too. Registration numbers live on /about.
 */
export const COMPLIANCE_RECORDS = [
  { title: "Attendance and wage registers", text: "Attendance for every shift, and the wage register that follows from it." },
  { title: "Payroll and wage slips", text: "Wages for every worker, with a slip each wage period." },
  { title: "EPF and ESIC", text: "Deposited every month for the workers they apply to, and the challans sent to you." },
  { title: "Professional Tax", text: "Deducted, deposited and filed where your site’s state levies it." },
  { title: "Labour Welfare Fund", text: "Worker and employer contributions deposited where your site’s state levies it." },
  { title: "Contract labour licence", text: "Where the state and the crew size need one, we apply for the contractor’s licence for your site." },
  { title: "Monthly review", text: "Registers, slips, challans and returns open for your monthly review and for audits." },
];

/**
 * Compliance help (owner direction, 16 Oct 2026): for employers behind on
 * their own statutory work. Its one home is /compliance#help; the wage state
 * pages and /faq link here, and the enquiry is /contact?type=compliance.
 */
export const COMPLIANCE_HELP = {
  heading: "Behind on compliance? We can help.",
  text: "If your own workers are missing EPF, ESIC, PT, LWF, a licence or proper registers, we work out what is due, guide you through putting it right, and connect you with the Vayasya Network: the CAs, labour lawyers and compliance consultants we work with.",
  href: "/contact?type=compliance",
  label: "Get compliance help",
};

export const CONTRACTOR_CHECKS = [
  { title: "Minimum wage", text: "Rates at or above the minimum wage for your state, zone and skill level." },
  { title: "Wages on time", text: "Bank transfer records for each wage period, paid by the deadline." },
];
