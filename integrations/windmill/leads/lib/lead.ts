/**
 * A crew request from the website's contact form (src/lib/lead-forward.ts
 * builds it after /api/contact or /api/agent/contact has validated and
 * emailed it) as Twenty CRM records: the company, the client contact, the
 * crew request (an opportunity at stage NEW) and the enquiry itself as an
 * inbound communication. The case ID makes it replay-safe.
 */
import { optionValue, phoneDigits } from "../../talent/lib/crm.ts";
import { eq, type Twenty } from "../../talent/lib/twenty.ts";

export interface Lead {
  caseId: string;
  receivedAt: string;
  channel: "web" | "agent";
  name: string;
  company: string | null;
  jobTitle: string | null;
  phone: string;
  email: string | null;
  /** The contact form's role ids (factory-helpers, loading-unloading...). */
  services: string[];
  headcount: string | null;
  headcountBand: string | null;
  site: string | null;
  cluster: string | null;
  startWindow: string | null;
  targetStartDate: string | null;
  requestType: string | null;
  /** The whole enquiry as our team reads it: every answer, then the free text. */
  enquiry: string;
  sourcePath: string | null;
}

const CASE_ID = /^(REQ|AGT)-\d{8}-[0-9A-F]{8}$/;
const CLUSTERS = new Set(["HARIDWAR", "UTTARAKHAND", "DELHI_NCR", "BENGALURU", "JALANDHAR", "SAHARANPUR", "OTHER", "PUNJAB"]);

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

/** Only the fields we use, each checked and cut to size; anything else is ignored. */
export function validateLead(body: unknown): { ok: true; lead: Lead } | { ok: false; errors: string[] } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const caseId = str(b.caseId, 40);
  if (!caseId || !CASE_ID.test(caseId)) errors.push("caseId");
  const name = str(b.name, 120);
  if (!name) errors.push("name");
  const phone = str(b.phone, 30);
  if (!phone || phoneDigits(phone).length < 10) errors.push("phone");
  const enquiry = str(b.enquiry, 8000);
  if (!enquiry) errors.push("enquiry");
  const receivedAt = str(b.receivedAt, 40);
  if (!receivedAt || Number.isNaN(Date.parse(receivedAt))) errors.push("receivedAt");
  const email = str(b.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email");
  if (errors.length) return { ok: false, errors };
  const services = Array.isArray(b.services) ? b.services.filter((s): s is string => typeof s === "string").slice(0, 20).map((s) => s.slice(0, 40)) : [];
  return {
    ok: true,
    lead: {
      caseId: caseId!,
      receivedAt: new Date(receivedAt!).toISOString(),
      channel: b.channel === "agent" ? "agent" : "web",
      name: name!,
      company: str(b.company, 160),
      jobTitle: str(b.jobTitle, 120),
      phone: phone!,
      email,
      services,
      headcount: str(b.headcount, 40),
      headcountBand: str(b.headcountBand, 20),
      site: str(b.site, 300),
      cluster: str(b.cluster, 40),
      startWindow: str(b.startWindow, 40),
      targetStartDate: str(b.targetStartDate, 40),
      requestType: str(b.requestType, 40),
      enquiry: enquiry!,
      sourcePath: str(b.sourcePath, 300),
    },
  };
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

  const [byPhone] = await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(lead.phone)));
  const [byEmail] = byPhone || !lead.email ? [] : await crm.find("people", eq("emails.primaryEmail", lead.email));
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

  const cluster = lead.cluster ? optionValue(lead.cluster) : null;
  const opportunity = await crm.create("opportunities", "Opportunity", {
    name: opportunityName(lead),
    stage: "NEW",
    leadSource: lead.channel === "agent" ? "OTHER" : "WEBSITE_FORM",
    caseId: lead.caseId,
    crewSize: crewSize(lead),
    services: serviceValues(lead.services),
    siteLocation: lead.site ?? "",
    cluster: cluster && CLUSTERS.has(cluster) ? cluster : null,
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
