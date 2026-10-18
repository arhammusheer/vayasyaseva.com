/**
 * The talent database's records as Twenty CRM records (the model is
 * integrations/twenty/setup.mts; option values are UPPER_SNAKE there). Pure
 * mapping, plus the person upsert and the erasure, against an injected
 * Twenty client so the tests can drive every path.
 */
import { eq, type Twenty, type TwentyRecord } from "./twenty.ts";

/** One submission joined with its people row, SMS acknowledgement and sync state (SYNC_CANDIDATES). */
export interface SyncCandidate {
  id: string;
  ref: string;
  source: string;
  channel: string | null;
  locale: string;
  phone: string;
  consent_version: string;
  consented_at: string | Date;
  text: string | null;
  role: string | null;
  cluster: string | null;
  answers: Record<string, unknown> | null;
  page_path: string | null;
  applicant_name: string | null;
  created_at: string | Date;
  person_name: string | null;
  person_clusters: string[] | null;
  person_roles: string[] | null;
  home_area: string | null;
  person_locale: string | null;
  person_status: string | null;
  last_applied_at: string | Date | null;
  last_contact_at: string | Date | null;
  last_confirmed_at: string | Date | null;
  ack_status: string | null;
  request_id: string | null;
  ack_error: string | null;
  accepted_at: string | Date | null;
  ack_updated_at: string | Date | null;
  /** Handset delivery (delivery.ts): delivered, failed, pending, or null before any report. */
  delivery_status: string | null;
  delivery_detail: string | null;
  delivered_at: string | Date | null;
  person_id: string | null;
  application_id: string | null;
  synced_ack_status: string | null;
  synced: boolean;
}

const CLUSTER_VALUES = new Set(["HARIDWAR", "UTTARAKHAND", "DELHI_NCR", "BENGALURU", "JALANDHAR", "SAHARANPUR", "OTHER", "PUNJAB"]);
const ROLE_VALUES = new Set([
  "FACTORY_HELPER", "PACKING", "MACHINE_OPERATOR", "WAREHOUSE", "FORKLIFT_OPERATOR", "DATA_ENTRY_OPERATOR",
  "HOUSEKEEPING", "ITI_TRADES", "ELECTRICIAN", "WELDER", "FITTER", "ANY",
]);

/** "delhi-ncr" -> "DELHI_NCR": the slugs of the site and the database as Twenty option values. */
export const optionValue = (slug: string) => slug.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");

export function clusterValue(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const v = optionValue(slug);
  return CLUSTER_VALUES.has(v) ? v : null;
}

export function roleValue(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const v = optionValue(slug);
  return ROLE_VALUES.has(v) ? v : null;
}

const unique = (values: (string | null)[]) => [...new Set(values.filter((v): v is string => Boolean(v)))];

/** Languages: the BCP 47 tags of new submissions and the legacy short forms. */
export function languageValue(locale: string | null | undefined): string | null {
  switch (locale) {
    case "en":
    case "en-IN":
      return "EN";
    case "hi":
    case "hi-IN":
      return "HI";
    case "hinglish":
    case "hi-Latn-IN":
      return "HI_LATN";
    case "pa-IN":
      return "PA";
    case "kn-IN":
      return "KN";
    default:
      return null;
  }
}

export function sourceValue(c: Pick<SyncCandidate, "source" | "channel">): string {
  if (c.channel === "agent") return "AGENT";
  if (c.source === "web" || c.source.startsWith("web_")) return "WEBSITE";
  if (c.source === "whatsapp") return "WHATSAPP";
  if (c.source === "phone") return "PHONE";
  return "OTHER";
}

/** "+91XXXXXXXXXX" -> the 10 digits Twenty keeps as primaryPhoneNumber (+91 is its calling code). */
export function phoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

const iso = (value: string | Date | null | undefined) => (value ? new Date(value).toISOString() : null);

/** The roles a person said they do: their people row, the role page, and the quick form's work answers. */
export function workRoles(c: SyncCandidate): string[] {
  const work = Array.isArray(c.answers?.work) ? (c.answers.work as string[]) : [];
  return unique([...(c.person_roles ?? []), c.role, ...work].map(roleValue));
}

export function clusters(c: SyncCandidate): string[] {
  return unique([...(c.person_clusters ?? []), c.cluster].map(clusterValue));
}

/** The worker fields, merged into what Twenty already has (lists union; staff's status kept). */
export function personFields(c: SyncCandidate, existing: TwentyRecord | null): Record<string, unknown> {
  const has = (field: string) => existing && existing[field] !== null && existing[field] !== undefined && existing[field] !== "";
  const existingList = (field: string) => (Array.isArray(existing?.[field]) ? (existing![field] as string[]) : []);
  const name = c.person_name ?? c.applicant_name;
  const lastContact = [c.last_contact_at, c.last_confirmed_at].filter(Boolean).map((d) => new Date(d!).getTime());
  const fields: Record<string, unknown> = {
    clusters: unique([...existingList("clusters"), ...clusters(c)]),
    workRoles: unique([...existingList("workRoles"), ...workRoles(c)]),
    lastAppliedAt: iso(c.last_applied_at ?? c.created_at),
    lastContactAt: lastContact.length ? new Date(Math.max(...lastContact)).toISOString() : iso(c.created_at),
    consentVersion: c.consent_version,
    consentedAt: iso(c.consented_at),
  };
  const language = languageValue(c.person_locale ?? c.locale);
  if (language) fields.language = language;
  if (c.home_area) fields.homeArea = c.home_area;
  if (!has("personType")) fields.personType = "WORKER";
  // A do-not-contact request always wins; otherwise staff's status (callable, placed...) stays.
  if (c.person_status === "do-not-contact") fields.workerStatus = "DO_NOT_CONTACT";
  else if (!has("workerStatus")) fields.workerStatus = "NEW";
  const currentName = existing?.name as { firstName?: string; lastName?: string } | undefined;
  if (name && !currentName?.firstName && !currentName?.lastName) fields.name = { firstName: name, lastName: "" };
  if (!existing) {
    fields.phones = phoneValue(c.phone);
    if (!fields.name) fields.name = { firstName: `Applicant ${c.ref}`, lastName: "" };
  }
  return fields;
}

/**
 * The quick form's answers (src/lib/talent-intake/rules.ts QUICK_ANSWERS) as
 * Twenty select options: answer id -> [option value, label]. Append-only, as
 * the answer ids are; integrations/twenty/setup.mts builds the fields from it.
 */
export const ANSWER_OPTIONS = {
  experience: {
    fresher: ["FRESHER", "Fresher"],
    "under-1": ["UNDER_1_YEAR", "Under 1 year"],
    "1-3": ["YEARS_1_TO_3", "1 to 3 years"],
    "3-plus": ["YEARS_3_PLUS", "3+ years"],
  },
  education: {
    "below-10th": ["BELOW_CLASS_10", "Below 10th"],
    "10th": ["CLASS_10", "10th pass"],
    "12th": ["CLASS_12", "12th pass"],
    "iti-diploma": ["ITI_DIPLOMA", "ITI / diploma"],
    graduate: ["GRADUATE", "Graduate"],
  },
  start: { now: ["NOW", "Immediately"], week: ["WITHIN_WEEK", "Within a week"], month: ["WITHIN_MONTH", "Within a month"] },
  shift: { day: ["DAY", "Day"], night: ["NIGHT", "Night"], rotating: ["ROTATING", "Rotating / any"] },
  area: {
    "sidcul-bahadrabad": ["SIDCUL_BAHADRABAD", "SIDCUL / Bahadrabad"],
    "haridwar-jwalapur": ["HARIDWAR_JWALAPUR", "Haridwar city / Jwalapur"],
    "roorkee-bhagwanpur": ["ROORKEE_BHAGWANPUR", "Roorkee / Bhagwanpur"],
    laksar: ["LAKSAR", "Laksar"],
    outside: ["OUTSIDE_HARIDWAR", "Outside Haridwar"],
    "bengaluru:north": ["BENGALURU_NORTH", "Bengaluru North / Peenya"],
    "bengaluru:south": ["BENGALURU_SOUTH", "Bengaluru South / Electronic City"],
    "bengaluru:east": ["BENGALURU_EAST", "Bengaluru East / Whitefield"],
    "bengaluru:west": ["BENGALURU_WEST", "Bengaluru West / Kengeri"],
    "bengaluru:outside": ["OUTSIDE_BENGALURU", "Outside Bengaluru"],
    "jalandhar:kapurthala": ["KAPURTHALA", "Kapurthala"],
    "jalandhar:city": ["JALANDHAR_CITY", "Jalandhar city"],
    "jalandhar:phagwara-goraya": ["PHAGWARA_GORAYA", "Phagwara / Goraya"],
    "jalandhar:outside": ["OUTSIDE_JALANDHAR", "Outside Jalandhar and Kapurthala"],
    "uttarakhand:haridwar": ["UK_HARIDWAR_ROORKEE", "Haridwar / Roorkee (Uttarakhand form)"],
    "uttarakhand:dehradun-selaqui": ["DEHRADUN_SELAQUI", "Dehradun / Selaqui"],
    "uttarakhand:udham-singh-nagar": ["UDHAM_SINGH_NAGAR", "Rudrapur / Kashipur / Sitarganj"],
    "uttarakhand:other": ["ELSEWHERE_UTTARAKHAND", "Elsewhere in Uttarakhand"],
    "uttarakhand:outside": ["OUTSIDE_UTTARAKHAND", "Outside Uttarakhand"],
    "punjab:jalandhar-kapurthala": ["PB_JALANDHAR_KAPURTHALA", "Jalandhar / Kapurthala (Punjab form)"],
    "punjab:ludhiana": ["LUDHIANA", "Ludhiana"],
    "punjab:mohali": ["MOHALI_KHARAR", "Mohali / Kharar"],
    "punjab:amritsar": ["AMRITSAR", "Amritsar"],
    "punjab:other": ["ELSEWHERE_PUNJAB", "Elsewhere in Punjab"],
    "punjab:outside": ["OUTSIDE_PUNJAB", "Outside Punjab"],
    "market:haridwar": ["MARKET_HARIDWAR", "Haridwar / Roorkee (market)"],
    "market:uttarakhand": ["MARKET_UTTARAKHAND", "Elsewhere in Uttarakhand (market)"],
    "market:jalandhar": ["MARKET_JALANDHAR", "Jalandhar / Kapurthala (market)"],
    "market:punjab": ["MARKET_PUNJAB", "Elsewhere in Punjab (market)"],
    "market:bengaluru": ["MARKET_BENGALURU", "Bengaluru (market)"],
    "market:other": ["MARKET_OTHER", "Somewhere else"],
    "haridwar:rest-of-uttarakhand": ["HW_REST_OF_UTTARAKHAND", "Elsewhere in Uttarakhand (Haridwar form)"],
    "jalandhar:rest-of-punjab": ["JL_REST_OF_PUNJAB", "Elsewhere in Punjab (Jalandhar form)"],
  },
} as const satisfies Record<string, Record<string, readonly [string, string]>>;

/** Labels of the skill answers (rules.ts QUICK_ANSWERS), summarised into one Skills line. */
const SKILL_LABELS: Record<string, Record<string, string>> = {
  iti: { "iti-pass": "ITI passed", "iti-pursuing": "ITI studying / apprentice", "no-iti": "Experience, no ITI" },
  trade: { electrician: "Electrician", welder: "Welder", fitter: "Fitter", machinist: "Machinist / turner", "other-trade": "Other trade" },
  machines: {
    "packing-machine": "Packing machines", moulding: "Injection moulding", press: "Press / sheet metal", "cnc-vmc": "CNC / VMC",
    "other-machine": "Other machines",
  },
  forklift: { "licence-experience": "Forklift licence and experience", "experience-only": "Forklift experience, no licence", "want-to-learn": "Wants to learn forklift" },
  computer: { typing: "Typing", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP" },
};

const answerList = (answers: Record<string, unknown> | null | undefined, question: string): string[] => {
  const v = answers?.[question];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
};

function answerOption(answers: Record<string, unknown> | null | undefined, question: keyof typeof ANSWER_OPTIONS): string | null {
  const options = ANSWER_OPTIONS[question] as Record<string, readonly [string, string]>;
  const id = answerList(answers, question).find((a) => Object.hasOwn(options, a));
  return id ? options[id][0] : null;
}

/** The screening answers as the application's own fields, so staff can sort, filter and group by them. */
export function screeningFields(answers: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const shifts = ANSWER_OPTIONS.shift as Record<string, readonly [string, string]>;
  const skills = Object.entries(SKILL_LABELS).flatMap(([q, labels]) => answerList(answers, q).map((a) => labels[a]).filter(Boolean));
  return {
    experience: answerOption(answers, "experience"),
    education: answerOption(answers, "education"),
    canStart: answerOption(answers, "start"),
    area: answerOption(answers, "area"),
    shifts: unique(answerList(answers, "shift").map((a) => shifts[a]?.[0] ?? null)),
    workWanted: unique(answerList(answers, "work").map(roleValue)),
    skills: skills.join(" · "),
  };
}

/** Twenty's PHONES value for an Indian mobile. */
export const phoneValue = (phone: string) => ({ primaryPhoneNumber: phoneDigits(phone), primaryPhoneCountryCode: "IN", primaryPhoneCallingCode: "+91" });

export function applicationFields(c: SyncCandidate, personId: string): Record<string, unknown> {
  return {
    ...screeningFields(c.answers),
    phone: phoneValue(c.phone),
    name: c.ref,
    status: "NEW",
    source: sourceValue(c),
    jobRole: roleValue(c.role),
    cluster: clusterValue(c.cluster),
    message: c.text ?? "",
    answers: c.answers ?? null,
    submittedAt: iso(c.created_at),
    consentVersion: c.consent_version,
    pagePath: c.page_path ?? "",
    talentSubmissionId: c.id,
    personId,
  };
}

/** The approved DLT acknowledgement (Fast2SMS message 227115, integrations/windmill README). */
export const ACK_TEMPLATE = "Job application received (DLT 1677100000000394062)";
export const ackText = (ref: string) => `Vayasya Seva received your job application. Ref ${ref}. We will contact you on this number about work.`;

/** The Communication's Delivery: the handset report once Fast2SMS has one, else the send's outcome. */
export function deliveryStatus(ackStatus: string | null, delivery: string | null = null): string {
  if (ackStatus === "accepted" && delivery === "delivered") return "DELIVERED";
  if (ackStatus === "accepted" && delivery === "failed") return "FAILED";
  switch (ackStatus) {
    case "accepted":
      return "SENT";
    case "failed":
      return "FAILED";
    case "unknown":
      return "UNKNOWN";
    default:
      return "QUEUED";
  }
}

/** What crm_sync remembers writing ("accepted", "accepted:delivered"…): SYNC_CANDIDATES builds the same. */
export const ackSyncState = (c: Pick<SyncCandidate, "ack_status" | "delivery_status">) =>
  c.ack_status && c.delivery_status ? `${c.ack_status}:${c.delivery_status}` : c.ack_status;

export const ackKey = (submissionId: string) => `sms-ack:${submissionId}`;

export function ackFields(c: SyncCandidate, personId: string, applicationId: string): Record<string, unknown> {
  return {
    name: `SMS · application received · ${c.ref}`,
    channel: "SMS",
    direction: "OUTBOUND",
    deliveryStatus: deliveryStatus(c.ack_status, c.delivery_status),
    template: ACK_TEMPLATE,
    body: ackText(c.ref),
    provider: "Fast2SMS",
    providerId: c.request_id ?? "",
    statusAt: iso(c.delivered_at ?? c.accepted_at ?? c.ack_updated_at),
    error: c.delivery_status === "failed" ? (c.delivery_detail ?? "") : (c.ack_error ?? ""),
    externalKey: ackKey(c.id),
    personId,
    applicationId,
  };
}

/** Finds the person by phone and creates or updates them. Returns their id. */
export async function upsertPerson(crm: Twenty, c: SyncCandidate): Promise<string> {
  // The worker record when the number also has a separate client contact (recordLead).
  const people = await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(c.phone)));
  const existing = people.find((p) => p.personType !== "CLIENT_CONTACT") ?? people[0];
  const fields = personFields(c, existing ?? null);
  if (existing) {
    await crm.update("people", existing.id, fields);
    return existing.id;
  }
  return (await crm.create("people", "Person", fields)).id;
}

/** The application for this submission: the existing one (an earlier run stopped after creating it), else a new one. */
export async function ensureApplication(crm: Twenty, c: SyncCandidate, personId: string): Promise<string> {
  const [existing] = await crm.find("applications", eq("talentSubmissionId", c.id));
  if (existing) return existing.id;
  return (await crm.create("applications", "Application", applicationFields(c, personId))).id;
}

export async function upsertAcknowledgement(crm: Twenty, c: SyncCandidate, personId: string, applicationId: string): Promise<void> {
  const fields = ackFields(c, personId, applicationId);
  const [existing] = await crm.find("communications", eq("externalKey", ackKey(c.id)));
  if (existing) await crm.update("communications", existing.id, fields);
  else await crm.create("communications", "Communication", fields);
}

/** The worker side of a person, emptied when a client contact's applicant data is erased. */
const WORKER_FIELDS_CLEARED = {
  personType: "CLIENT_CONTACT",
  workerStatus: null,
  clusters: [],
  workRoles: [],
  homeArea: "",
  language: null,
  consentVersion: "",
  consentedAt: null,
  lastAppliedAt: null,
  lastContactAt: null,
} as const;

/** What a kept client contact is called once the applicant name it carried is erased. */
const CLIENT_NAME_CLEARED = { firstName: "Client contact", lastName: "" } as const;

/**
 * Every attachment on a record (`field` is targetApplicationId or
 * targetPersonId), the trashed ones too: a filter on deletedAt is how
 * Twenty's API returns soft-deleted records.
 */
async function attachmentsOf(crm: Twenty, field: string, id: string): Promise<TwentyRecord[]> {
  const live = await crm.find("attachments", eq(field, id));
  const trashed = await crm.find("attachments", `and(${eq(field, id)},deletedAt[is]:NOT_NULL)`);
  return [...new Map([...live, ...trashed].map((r) => [r.id, r])).values()];
}

/** Hard-deletes a record's attachments (and so their files); returns how many. */
async function removeAttachments(crm: Twenty, field: string, id: string): Promise<number> {
  let removed = 0;
  for (const a of await attachmentsOf(crm, field, id)) if (await crm.remove("attachments", a.id)) removed++;
  return removed;
}

export interface ErasedCrm {
  /** People who had applicant data erased. */
  people: number;
  /** Attachments (applicants' files) deleted. */
  files: number;
}

/**
 * Erasure (privacy notice §10): the applicant data Twenty holds for a phone
 * number, its applications (their attachments, trashed ones too, then their
 * communications) first: deleting an application only unlinks its
 * attachments, so their files would stay. A person who is also a client
 * contact (a lead's point of contact, or typed so by the leads intake) keeps
 * the person and the enquiry history, which leads retention covers; only the
 * worker side goes. Anyone else is removed, with their own attachments.
 * Nothing to remove is success.
 */
export async function erasePerson(crm: Twenty, phone: string): Promise<ErasedCrm> {
  const people = await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(phone)));
  let files = 0;
  for (const person of people) {
    for (const app of await crm.find("applications", eq("personId", person.id))) {
      files += await removeAttachments(crm, "targetApplicationId", app.id);
      for (const comm of await crm.find("communications", eq("applicationId", app.id))) await crm.remove("communications", comm.id);
      await crm.remove("applications", app.id);
    }
    const clientContact =
      person.personType === "CLIENT_CONTACT" || (await crm.find("opportunities", eq("pointOfContactId", person.id))).length > 0;
    for (const comm of await crm.find("communications", eq("personId", person.id))) {
      if (!clientContact || !comm.opportunityId) await crm.remove("communications", comm.id);
    }
    if (clientContact) {
      // A name from an application goes too: a record still typed worker was
      // merged before leads got their own contact, and the placeholder names
      // the application.
      const name = person.name as { firstName?: string } | undefined;
      const fromApplication = person.personType !== "CLIENT_CONTACT" || /^Applicant VS-J-/.test(name?.firstName ?? "");
      await crm.update("people", person.id, fromApplication ? { ...WORKER_FIELDS_CLEARED, name: CLIENT_NAME_CLEARED } : WORKER_FIELDS_CLEARED);
    }
    else {
      files += await removeAttachments(crm, "targetPersonId", person.id);
      await crm.remove("people", person.id);
    }
  }
  return { people: people.length, files };
}
