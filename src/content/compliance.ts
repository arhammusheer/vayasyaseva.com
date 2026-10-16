/**
 * /compliance: the records we keep and the checks to make with any
 * contractor (the four that map to records we show). llms-full.txt reads
 * these too. Registration numbers live on /about.
 */
export const COMPLIANCE_RECORDS = [
  { title: "Attendance and wage registers", text: "Attendance for every shift, and the wage register that follows from it." },
  { title: "Wage slips", text: "A slip for every worker, every wage period." },
  { title: "EPF and ESIC challans", text: "Deposited every month for the workers they apply to, and the challans sent to you." },
  { title: "Monthly review", text: "Registers, slips and challans open for your monthly review and for audits." },
];

export const CONTRACTOR_CHECKS = [
  { title: "Minimum wage", text: "Rates at or above the minimum wage for your state, zone and skill level." },
  { title: "Wages on time", text: "Bank transfer records for each wage period, paid by the deadline." },
  { title: "EPF and ESIC", text: "Monthly challans for each covered worker." },
  { title: "Attendance and overtime", text: "Attendance that matches the wage sheet, with overtime at twice the rate." },
];
