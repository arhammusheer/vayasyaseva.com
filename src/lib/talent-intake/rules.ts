/**
 * Job seeker intake rules shared by the website (API route, Zod contract)
 * and the n8n intake workflow, which inlines this file at build time
 * (integrations/n8n/build.mts). Keep it dependency-free: no imports.
 */

/** Submission reference shown to the person, e.g. VS-J-7K2M9Q. */
export const REF_PATTERN = /^VS-J-[A-Z0-9]{6}$/;

/**
 * Legacy sources: which jobs page a submission came from, and the short
 * locale it implies. Stored values (integrations/n8n/schema.sql): web_hinglish
 * is the hi-Latn-IN page. Old rows keep them, the agent routes still send
 * them, and tickets issued before WEB_SOURCE may carry them. Never rename one.
 */
export const INTAKE_SOURCES = {
  web_en: "en",
  web_hi: "hi",
  web_hinglish: "hinglish",
} as const;
export type IntakeSource = keyof typeof INTAKE_SOURCES;
export type LegacyLocale = (typeof INTAKE_SOURCES)[IntakeSource];

/**
 * The source of new web submissions (PLAN §1a): one value, with the page's
 * language in `locale` as a BCP 47 tag instead of being folded into the source.
 */
export const WEB_SOURCE = "web";
export type SubmissionSource = IntakeSource | typeof WEB_SOURCE;

export function isSubmissionSource(value: unknown): value is SubmissionSource {
  return value === WEB_SOURCE || (typeof value === "string" && Object.hasOwn(INTAKE_SOURCES, value));
}

/**
 * Page languages a submission can carry (BCP 47). Same list as LOCALE_TAGS in
 * src/content/registry/identifiers.ts (content:check compares them); repeated
 * here because n8n inlines this file and it must stay import-free.
 */
export const INTAKE_LOCALES = ["en-IN", "hi-IN", "hi-Latn-IN", "pa-IN"] as const;
export type IntakeLocale = (typeof INTAKE_LOCALES)[number];

export function isIntakeLocale(value: unknown): value is IntakeLocale {
  return typeof value === "string" && (INTAKE_LOCALES as readonly string[]).includes(value);
}

/** The BCP 47 locale a legacy source stands for. */
export const LEGACY_SOURCE_LOCALES = { web_en: "en-IN", web_hi: "hi-IN", web_hinglish: "hi-Latn-IN" } as const satisfies Record<
  IntakeSource,
  IntakeLocale
>;

/**
 * Cluster ids (PLAN §1a). Same list as CLUSTER_IDS in
 * src/content/registry/identifiers.ts (content:check compares them).
 */
export const INTAKE_CLUSTERS = ["haridwar", "uttarakhand", "delhi-ncr", "bengaluru", "jalandhar", "saharanpur", "other", "punjab"] as const;
export type IntakeCluster = (typeof INTAKE_CLUSTERS)[number];

export function isIntakeCluster(value: unknown): value is IntakeCluster {
  return typeof value === "string" && (INTAKE_CLUSTERS as readonly string[]).includes(value);
}

/** The page a form sits on: a neutral path such as /jobs/haridwar (no locale, no query). */
export const PAGE_PATH_PATTERN = /^\/([a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*)?$/;
export const MAX_PAGE_PATH_LENGTH = 200;

export function isPagePath(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_PAGE_PATH_LENGTH && PAGE_PATH_PATTERN.test(value);
}

/**
 * How a submission reached us: the jobs form in a browser ("web"), or an AI
 * agent through the open routes under /api/agent/jobs ("agent"). Stored in
 * submissions.channel and shown to staff in Chatwoot.
 */
export const INTAKE_CHANNELS = ["web", "agent"] as const;
export type IntakeChannel = (typeof INTAKE_CHANNELS)[number];

/** Locale an agent writes in, mapped to the jobs page source it stands in for. */
export const AGENT_LANGUAGE_SOURCES = { en: "web_en", hi: "web_hi", hinglish: "web_hinglish" } as const satisfies Record<
  (typeof INTAKE_SOURCES)[IntakeSource],
  IntakeSource
>;
export type AgentLanguage = keyof typeof AGENT_LANGUAGE_SOURCES;

/** Longest agent name kept with a submission. */
export const MAX_AGENT_NAME_LENGTH = 100;

/**
 * Role pages under /jobs/<slug>. A submission from one carries the slug, so
 * staff can find people by the work they asked about; the label is for staff.
 */
export const JOB_ROLES = {
  "factory-helper": "Factory helper",
  packing: "Packing",
  "machine-operator": "Machine operator",
  warehouse: "Warehouse: loading, picking, packing",
  "forklift-operator": "Forklift operator",
  "data-entry-operator": "Data entry operator",
  housekeeping: "Housekeeping",
  "iti-trades": "ITI trades: welder, fitter, electrician",
  electrician: "Electrician",
  welder: "Welder",
  fitter: "Fitter",
} as const;
export type JobRole = keyof typeof JOB_ROLES;
export const JOB_ROLE_SLUGS = Object.keys(JOB_ROLES) as [JobRole, ...JobRole[]];

export function isJobRole(value: unknown): value is JobRole {
  return typeof value === "string" && Object.hasOwn(JOB_ROLES, value);
}

/**
 * Hub pages under /jobs/<slug>: who the search was from, not a kind of work.
 * They are in the sitemap and linked from the jobs overview. A submission from one
 * carries the slug, so staff can see which hub brought the person in; the
 * label is for staff.
 */
export const JOB_HUBS = {
  freshers: "Freshers page",
  "10th-pass": "10th pass page",
  "12th-pass": "12th pass page",
} as const;
export type JobHub = keyof typeof JOB_HUBS;
export const JOB_HUB_SLUGS = Object.keys(JOB_HUBS) as [JobHub, ...JobHub[]];

export function isJobHub(value: unknown): value is JobHub {
  return typeof value === "string" && Object.hasOwn(JOB_HUBS, value);
}

/**
 * Which web form a submission came from (submissions.form): the long form on
 * /jobs and the role pages, or the guided quick form on /jobs/apply. Null for
 * the agent routes. The label is for staff.
 */
export const INTAKE_FORMS = {
  long: "Long form (/jobs and role pages)",
  quick: "Quick apply (/jobs/apply)",
} as const;
export type IntakeForm = keyof typeof INTAKE_FORMS;
export const INTAKE_FORM_KEYS = Object.keys(INTAKE_FORMS) as [IntakeForm, ...IntakeForm[]];

export const MAX_APPLICANT_NAME_LENGTH = 80;

/**
 * The quick form's questions and answers: question -> answer id -> English
 * label for staff. Ids are stored values (submissions.answers) and analytics
 * labels, the same in every page language; page wording lives in
 * src/content/pages/quick-apply.ts.
 */
export const QUICK_ANSWERS = {
  work: {
    "factory-helper": "Factory helper", packing: "Packing", warehouse: "Warehouse / loading", "machine-operator": "Machine operator",
    "iti-trades": "ITI trade", housekeeping: "Housekeeping", "data-entry-operator": "Data entry", "forklift-operator": "Forklift operator",
    any: "Any work",
  },
  trade: { electrician: "Electrician", welder: "Welder", fitter: "Fitter", machinist: "Machinist / turner", "other-trade": "Other trade" },
  iti: { "iti-pass": "ITI passed", "iti-pursuing": "Studying / apprentice", "no-iti": "Experience, no ITI" },
  machines: {
    "packing-machine": "Packing machines", moulding: "Injection moulding", press: "Press / sheet metal", "cnc-vmc": "CNC / VMC",
    "other-machine": "Other machines",
  },
  forklift: { "licence-experience": "Licence and experience", "experience-only": "Experience, no licence", "want-to-learn": "Wants to learn" },
  computer: { typing: "Typing", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP" },
  experience: { fresher: "Fresher", "under-1": "Under 1 year", "1-3": "1 to 3 years", "3-plus": "3+ years" },
  education: { "below-10th": "Below 10th", "10th": "10th pass", "12th": "12th pass", "iti-diploma": "ITI / diploma", graduate: "Graduate" },
  shift: { day: "Day", night: "Night", rotating: "Rotating / any" },
  start: { now: "Immediately", week: "Within a week", month: "Within a month" },
  area: {
    "sidcul-bahadrabad": "SIDCUL / Bahadrabad", "haridwar-jwalapur": "Haridwar city / Jwalapur", "roorkee-bhagwanpur": "Roorkee / Bhagwanpur",
    laksar: "Laksar", outside: "Outside Haridwar",
    "bengaluru:north": "Bengaluru North / Peenya", "bengaluru:south": "Bengaluru South / Electronic City", "bengaluru:east": "Bengaluru East / Whitefield",
    "bengaluru:west": "Bengaluru West / Kengeri", "bengaluru:outside": "Outside Bengaluru",
    "jalandhar:kapurthala": "Kapurthala", "jalandhar:city": "Jalandhar city", "jalandhar:phagwara-goraya": "Phagwara / Goraya",
    "jalandhar:outside": "Outside Jalandhar and Kapurthala",
    "uttarakhand:haridwar": "Haridwar / Roorkee", "uttarakhand:dehradun-selaqui": "Dehradun / Selaqui",
    "uttarakhand:udham-singh-nagar": "Rudrapur / Kashipur / Sitarganj", "uttarakhand:other": "Elsewhere in Uttarakhand",
    "uttarakhand:outside": "Outside Uttarakhand",
    "punjab:jalandhar-kapurthala": "Jalandhar / Kapurthala", "punjab:ludhiana": "Ludhiana", "punjab:mohali": "Mohali / Kharar",
    "punjab:amritsar": "Amritsar", "punjab:other": "Elsewhere in Punjab", "punjab:outside": "Outside Punjab",
    "market:haridwar": "Haridwar / Roorkee", "market:uttarakhand": "Elsewhere in Uttarakhand", "market:jalandhar": "Jalandhar / Kapurthala",
    "market:punjab": "Elsewhere in Punjab", "market:bengaluru": "Bengaluru", "market:other": "Somewhere else",
    "haridwar:rest-of-uttarakhand": "Elsewhere in Uttarakhand (Haridwar form)", "jalandhar:rest-of-punjab": "Elsewhere in Punjab (Jalandhar form)",
  },
} as const;
export type QuickQuestion = keyof typeof QUICK_ANSWERS;

/**
 * The cluster each `area` answer lies in; null when the answer names no
 * cluster ("outside" Haridwar), so the page's cluster or "other" decides.
 * Append-only, like the answer ids.
 */
export const AREA_CLUSTERS: Record<keyof typeof QUICK_ANSWERS.area, IntakeCluster | null> = {
  "sidcul-bahadrabad": "haridwar",
  "haridwar-jwalapur": "haridwar",
  "roorkee-bhagwanpur": "haridwar",
  laksar: "haridwar",
  outside: null,
  "bengaluru:north": "bengaluru",
  "bengaluru:south": "bengaluru",
  "bengaluru:east": "bengaluru",
  "bengaluru:west": "bengaluru",
  "bengaluru:outside": null,
  "jalandhar:kapurthala": "jalandhar",
  "jalandhar:city": "jalandhar",
  "jalandhar:phagwara-goraya": "jalandhar",
  "jalandhar:outside": null,
  "uttarakhand:haridwar": "haridwar",
  "uttarakhand:dehradun-selaqui": "uttarakhand",
  "uttarakhand:udham-singh-nagar": "uttarakhand",
  "uttarakhand:other": "uttarakhand",
  "uttarakhand:outside": null,
  "punjab:jalandhar-kapurthala": "jalandhar",
  "punjab:ludhiana": "punjab",
  "punjab:mohali": "punjab",
  "punjab:amritsar": "punjab",
  "punjab:other": "punjab",
  "punjab:outside": null,
  "market:haridwar": "haridwar",
  "market:uttarakhand": "uttarakhand",
  "market:jalandhar": "jalandhar",
  "market:punjab": "punjab",
  "market:bengaluru": "bengaluru",
  "market:other": null,
  "haridwar:rest-of-uttarakhand": "uttarakhand",
  "jalandhar:rest-of-punjab": "punjab",
};

/**
 * The cluster a submission belongs to (PLAN pipelines, rules 1 to 3): the
 * area the person chose when it names a cluster, else the page's cluster,
 * else "other", which is a real cluster, not an error. So "Outside Haridwar"
 * on /jobs/haridwar files under haridwar (the page), and the same answer on
 * /jobs/apply files under other. The page's own cluster is stored separately
 * (page_cluster). The market answers (market:*) and the cross-market ones
 * (uttarakhand:haridwar, punjab:jalandhar-kapurthala) file under the market
 * the person named, whatever page they were on.
 */
export function submissionCluster(pageCluster: IntakeCluster | null | undefined, answers: QuickAnswers | null | undefined): IntakeCluster {
  const area = answers?.area?.[0];
  const fromArea = area && Object.hasOwn(AREA_CLUSTERS, area) ? AREA_CLUSTERS[area as keyof typeof AREA_CLUSTERS] : null;
  return fromArea ?? pageCluster ?? "other";
}
export type QuickAnswers = Partial<Record<QuickQuestion, string[]>>;

/** Staff labels for the questions, in the order they are asked. */
export const QUICK_QUESTIONS: Record<QuickQuestion, string> = {
  work: "Work", trade: "ITI trade", iti: "ITI", machines: "Machines", forklift: "Forklift", computer: "Computer skills",
  experience: "Experience", education: "Education", shift: "Shifts", start: "Can start", area: "Area",
};

/** Keeps only known questions and answer ids; null when nothing is left. */
export function cleanQuickAnswers(raw: unknown): QuickAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  const out: QuickAnswers = {};
  for (const [question, options] of Object.entries(QUICK_ANSWERS) as [QuickQuestion, Record<string, string>][]) {
    const values = (raw as Record<string, unknown>)[question];
    if (!Array.isArray(values)) continue;
    const kept = [...new Set(values.filter((v): v is string => typeof v === "string" && Object.hasOwn(options, v)))];
    if (kept.length) out[question] = kept;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Photos and documents only. Audio (voice notes) stopped being accepted on
 * 16 October 2026 when speech-to-text was dropped (PLAN, owner answers).
 */
export const ATTACHMENT_KINDS = ["image", "document"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

/** MIME types accepted per kind. */
export const ATTACHMENT_MIME: Record<AttachmentKind, RegExp> = {
  image: /^image\/(jpeg|png|webp)$/,
  // PDF and Word (.doc, .docx).
  document:
    /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
};

export const INTAKE_LIMITS = {
  maxAttachments: 8,
  maxTextLength: 4000,
  maxFileNameLength: 200,
  maxBytes: { image: 10 * 1024 * 1024, document: 20 * 1024 * 1024 } as Record<AttachmentKind, number>,
} as const;

/** R2 object key for one upload: intake/YYYY/MM/<ref>/<position>.<ext> */
export function attachmentKeyPrefix(ref: string, at: Date) {
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `intake/${at.getUTCFullYear()}/${month}/${ref}/`;
}

export function isAttachmentKeyFor(key: string, ref: string) {
  return key.startsWith("intake/") && key.includes(`/${ref}/`);
}

/** Indian mobile number in E.164 (+91XXXXXXXXXX), or null. */
export function normaliseIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0[6-9]\d{9}$/.test(digits)) return `+91${digits.slice(1)}`;
  return null;
}
