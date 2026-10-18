/**
 * Erasure of business enquiries on request (privacy notice §10), the leads
 * counterpart of the applicant erasure (talent/lib/run-retention.ts). A
 * request names a case ID or a phone; f/leads/erase takes one per run:
 *
 *   Twenty   each enquiry's crew request (opportunity) with its enquiry
 *            communications, files, notes and tasks; then its contact, unless
 *            another crew request still names them (an applicant's record
 *            keeps the worker side only); then its company, unless anyone or
 *            anything else is still on it
 *   inbox    the leads rows (their deliveries go with them)
 *
 * The run holds the lead sync's lock, so no sync writes in between. A Twenty
 * failure stops the run before a row is deleted; the request goes back to
 * pending and fails after three attempts. Nothing here is automatic: requests
 * are queued by hand (OPERATIONS.md).
 */
import { phoneDigits, removeAttachments } from "../../talent/lib/crm.ts";
import { eq, type Twenty, type TwentyRecord } from "../../talent/lib/twenty.ts";
import type { Query } from "../../talent/lib/db.ts";
import { LEADS_ERASURE_CLAIM, LEADS_ERASURE_DONE, LEADS_ERASURE_FAIL, LEADS_ERASURE_RECOVER, LEADS_SYNC_LOCK, LEADS_SYNC_UNLOCK } from "./sql.ts";

export interface ErasableLead {
  id: string;
  caseId: string;
  company: string | null;
  phone: string | null;
  opportunityId: string | null;
}

export interface ErasedLeadsCrm {
  opportunities: number;
  people: number;
  companies: number;
  files: number;
}

/** Live and trashed records: Twenty's API leaves trashed ones out unless the filter names deletedAt. */
async function findAll(crm: Twenty, plural: string, filter: string): Promise<TwentyRecord[]> {
  const live = await crm.find(plural, filter);
  const trashed = await crm.find(plural, `and(${filter},deletedAt[is]:NOT_NULL)`);
  return [...new Map([...live, ...trashed].map((r) => [r.id, r])).values()];
}

/**
 * The notes and tasks on a record: each link goes, and the note or task too
 * once nothing else is linked to it.
 */
async function removeNotesAndTasks(crm: Twenty, field: string, id: string): Promise<void> {
  for (const [targets, records, key] of [["noteTargets", "notes", "noteId"], ["taskTargets", "tasks", "taskId"]] as const) {
    for (const link of await findAll(crm, targets, eq(field, id))) {
      await crm.remove(targets, link.id);
      const parent = typeof link[key] === "string" ? (link[key] as string) : null;
      if (parent && (await findAll(crm, targets, eq(key, parent))).length === 0) await crm.remove(records, parent);
    }
  }
}

const idOf = (value: unknown) => (typeof value === "string" && value ? value : null);

/** The client side of a contact who is also an applicant: what recordLead added. */
const CLIENT_FIELDS_CLEARED = { personType: "WORKER", companyId: null, jobTitle: "", emails: { primaryEmail: "", additionalEmails: [] } } as const;

export async function eraseLeadsInCrm(crm: Twenty, leads: ErasableLead[], phone: string | null): Promise<ErasedLeadsCrm> {
  const result: ErasedLeadsCrm = { opportunities: 0, people: 0, companies: 0, files: 0 };
  const contacts = new Set<string>();
  const companies = new Set<string>();

  for (const lead of leads) {
    const opportunities = await findAll(crm, "opportunities", eq("caseId", lead.caseId));
    for (const opp of opportunities) {
      for (const comm of await findAll(crm, "communications", eq("opportunityId", opp.id))) await crm.remove("communications", comm.id);
      result.files += await removeAttachments(crm, "targetOpportunityId", opp.id);
      await removeNotesAndTasks(crm, "targetOpportunityId", opp.id);
      const contact = idOf(opp.pointOfContactId);
      const company = idOf(opp.companyId);
      if (contact) contacts.add(contact);
      if (company) companies.add(company);
      if (await crm.remove("opportunities", opp.id)) result.opportunities++;
    }
    // An interrupted first write can leave the enquiry without its crew request.
    for (const comm of await findAll(crm, "communications", eq("externalKey", `lead:${lead.caseId}`))) await crm.remove("communications", comm.id);
  }

  // By phone: client contacts on that number that no crew request names any more.
  if (phone) {
    for (const person of await findAll(crm, "people", eq("phones.primaryPhoneNumber", phoneDigits(phone)))) {
      if (person.personType === "CLIENT_CONTACT") contacts.add(person.id);
    }
  }

  for (const personId of contacts) {
    const [person] = await findAll(crm, "people", eq("id", personId));
    if (!person) continue;
    if ((await findAll(crm, "opportunities", eq("pointOfContactId", personId))).length) continue;
    const company = idOf(person.companyId);
    if (company) companies.add(company);
    const applications = await findAll(crm, "applications", eq("personId", personId));
    if (applications.length) {
      // Also an applicant (an enquiry came first and the application merged
      // into its contact): the worker side stays, under the applicant's name.
      const ref = applications.map((a) => a.name).find((n): n is string => typeof n === "string" && n.startsWith("VS-J-"));
      await crm.update("people", personId, { ...CLIENT_FIELDS_CLEARED, ...(ref ? { name: { firstName: `Applicant ${ref}`, lastName: "" } } : {}) });
      continue;
    }
    for (const comm of await findAll(crm, "communications", eq("personId", personId))) await crm.remove("communications", comm.id);
    result.files += await removeAttachments(crm, "targetPersonId", personId);
    await removeNotesAndTasks(crm, "targetPersonId", personId);
    if (await crm.remove("people", personId)) result.people++;
  }

  // A company goes only when no one, no crew request and no note or task is left on it.
  for (const companyId of companies) {
    const inUse =
      (await crm.find("people", eq("companyId", companyId))).length ||
      (await findAll(crm, "opportunities", eq("companyId", companyId))).length ||
      (await findAll(crm, "noteTargets", eq("targetCompanyId", companyId))).length ||
      (await findAll(crm, "taskTargets", eq("targetCompanyId", companyId))).length;
    if (inUse) continue;
    result.files += await removeAttachments(crm, "targetCompanyId", companyId);
    if (await crm.remove("companies", companyId)) result.companies++;
  }
  return result;
}

export interface LeadErasureResult {
  recovered: number;
  skipped?: string;
  erased: ({ requestId: string; leads: number } & ErasedLeadsCrm) | null;
}

/** One queued request per run (f/leads/erase). */
export async function runLeadErasure(deps: { query: Query; crm: Twenty }): Promise<LeadErasureResult> {
  const recovered = (await deps.query(LEADS_ERASURE_RECOVER)).length;
  const [lock] = await deps.query<{ locked: boolean }>(LEADS_SYNC_LOCK);
  if (!lock?.locked) return { recovered, skipped: "the lead sync is running", erased: null };
  try {
    const [claimed] = await deps.query<{ id: string; case_id: string | null; phone: string | null; leads: ErasableLead[] }>(LEADS_ERASURE_CLAIM);
    if (!claimed?.id) return { recovered, erased: null };
    try {
      const crm = await eraseLeadsInCrm(deps.crm, claimed.leads, claimed.phone);
      const [done] = await deps.query<{ removed_leads: number }>(LEADS_ERASURE_DONE, [
        claimed.id,
        claimed.leads.map((l) => l.id),
        crm.opportunities,
        crm.people,
        crm.companies,
        crm.files,
      ]);
      return { recovered, erased: { requestId: claimed.id, leads: Number(done?.removed_leads ?? 0), ...crm } };
    } catch (error) {
      // Twenty's messages name the field or constraint, not the values.
      await deps.query(LEADS_ERASURE_FAIL, [claimed.id, error instanceof Error ? error.message.slice(0, 300) : "erasure failed"]);
      throw error;
    }
  } finally {
    await deps.query(LEADS_SYNC_UNLOCK);
  }
}
