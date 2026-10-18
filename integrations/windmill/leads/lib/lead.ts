/**
 * A crew request from the website's contact form (src/lib/lead-forward.ts
 * builds it after /api/contact or /api/agent/contact has validated and
 * emailed it) as Twenty CRM records: the company, the client contact, the
 * crew request (an opportunity at stage NEW) and the enquiry itself as an
 * inbound communication. The case ID makes it replay-safe.
 */
import { optionValue, phoneDigits } from "../../talent/lib/crm.ts";
import { eq, type Twenty, type TwentyRecord } from "../../talent/lib/twenty.ts";
import { SCHEMAS, check } from "../../contracts/validate.ts";
import type { LeadCanonical } from "../../../../packages/contracts/src/business-enquiry.v1.ts";

/**
 * The lead: business_enquiry.v1 canonical (packages/contracts), checked by
 * checkLead against the generated schema. Its cluster is one of the intake
 * clusters (the schema's list), so it maps straight to Twenty's option.
 */
export type Lead = LeadCanonical;

/** The lead checked against the generated canonical schema (business_enquiry.v1, compliance_help.v1). */
export function checkLead(body: unknown): { ok: true; lead: Lead } | { ok: false; errors: string[] } {
  const checked = check<Lead>(SCHEMAS["business_enquiry.v1"], body);
  return checked.ok ? { ok: true, lead: { ...checked.value, receivedAt: new Date(checked.value.receivedAt).toISOString() } } : checked;
}

/** The form's role ids as the opportunity's three services (setup.mts). */
export function serviceValues(roles: string[]): string[] {
  const out = new Set<string>();
  for (const role of roles) {
    if (["loading-unloading", "warehouse", "forklift"].includes(role)) out.add("LOADING_UNLOADING");
    else if (["housekeeping", "gardening"].includes(role)) out.add("HOUSEKEEPING");
    else if (["factory-helpers", "packing", "machine-operators", "iti-trades", "maintenance", "fabrication-civil", "data-entry"].includes(role)) out.add("FACTORY_LABOUR");
    else out.add("OTHER");
  }
  return [...out];
}

/** A number of people: the stated headcount, else the low end of the band ("20-49" -> 20, "250+" -> 250). */
export function crewSize(lead: Pick<Lead, "headcount" | "headcountBand">): number | null {
  const stated = lead.headcount?.match(/\d+/)?.[0];
  if (stated) return Number(stated);
  const low = lead.headcountBand?.match(/^\d+/)?.[0];
  return low ? Number(low) : null;
}

export function opportunityName(lead: Lead): string {
  const who = lead.company ?? lead.name;
  const size = lead.headcount ?? lead.headcountBand;
  const what = lead.requestType === "compliance-help" ? "compliance help" : lead.requestType === "site-assessment" ? "site assessment" : "crew";
  return `${who} · ${size ? `${size} ` : ""}${what}`.slice(0, 200);
}

const isoDate = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(Date.parse(v)) ? v.slice(0, 10) : null);

export interface LeadResult {
  opportunityId: string;
  created: boolean;
}

/**
 * Writes the lead. Replaying a case ID finds the opportunity and adds only
 * what an interrupted first write left out (the enquiry's communication).
 */
export async function recordLead(crm: Twenty, lead: Lead): Promise<LeadResult> {
  const [existing] = await crm.find("opportunities", eq("caseId", lead.caseId));
  if (existing) {
    const personId = typeof existing.pointOfContactId === "string" ? existing.pointOfContactId : null;
    if (personId) await recordEnquiry(crm, lead, personId, existing.id);
    return { opportunityId: existing.id, created: false };
  }

  let companyId: string | null = null;
  if (lead.company) {
    const [company] = await crm.find("companies", eq("name", lead.company));
    companyId = company?.id ?? (await crm.create("companies", "Company", { name: lead.company })).id;
  }

  // Never an applicant's record: a job seeker who also sends an enquiry gets a
  // separate client contact, so erasing them as an applicant takes their
  // applicant name with the worker record (erasure keeps client contacts).
  const notWorker = (people: TwentyRecord[]) => people.find((p) => p.personType !== "WORKER");
  const byPhone = notWorker(await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(lead.phone))));
  const byEmail = byPhone || !lead.email ? undefined : notWorker(await crm.find("people", eq("emails.primaryEmail", lead.email)));
  const contact = byPhone ?? byEmail;
  let personId: string;
  if (contact) {
    personId = contact.id;
    const patch: Record<string, unknown> = {};
    if (!contact.personType) patch.personType = "CLIENT_CONTACT";
    if (companyId && !contact.companyId) patch.companyId = companyId;
    if (lead.jobTitle && !contact.jobTitle) patch.jobTitle = lead.jobTitle;
    if (Object.keys(patch).length) await crm.update("people", personId, patch);
  } else {
    personId = (
      await crm.create("people", "Person", {
        name: { firstName: lead.name, lastName: "" },
        phones: { primaryPhoneNumber: phoneDigits(lead.phone), primaryPhoneCountryCode: "IN", primaryPhoneCallingCode: "+91" },
        ...(lead.email ? { emails: { primaryEmail: lead.email, additionalEmails: [] } } : {}),
        ...(lead.jobTitle ? { jobTitle: lead.jobTitle } : {}),
        personType: "CLIENT_CONTACT",
        ...(companyId ? { companyId } : {}),
      })
    ).id;
  }

  const opportunity = await crm.create("opportunities", "Opportunity", {
    name: opportunityName(lead),
    stage: "NEW",
    leadSource: lead.channel === "agent" ? "OTHER" : "WEBSITE_FORM",
    caseId: lead.caseId,
    crewSize: crewSize(lead),
    services: serviceValues(lead.services),
    siteLocation: lead.site ?? "",
    cluster: lead.cluster ? optionValue(lead.cluster) : null,
    startDate: isoDate(lead.targetStartDate),
    enquiry: lead.enquiry,
    pointOfContactId: personId,
    ...(companyId ? { companyId } : {}),
  });

  await recordEnquiry(crm, lead, personId, opportunity.id);
  return { opportunityId: opportunity.id, created: true };
}

/** The enquiry as an inbound communication, once per case ID (its externalKey). */
async function recordEnquiry(crm: Twenty, lead: Lead, personId: string, opportunityId: string) {
  const externalKey = `lead:${lead.caseId}`;
  if ((await crm.find("communications", eq("externalKey", externalKey))).length) return;
  await crm.create("communications", "Communication", {
    name: `Website enquiry ${lead.caseId}`,
    channel: "EMAIL",
    direction: "INBOUND",
    deliveryStatus: "DELIVERED",
    body: lead.enquiry,
    provider: lead.channel === "agent" ? "AI agent (/api/agent/contact)" : "Website form (/api/contact)",
    statusAt: lead.receivedAt,
    externalKey,
    personId,
    opportunityId,
  });
}
