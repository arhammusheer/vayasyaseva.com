/**
 * job_application.v1: a job seeker's application.
 *
 * Wire (what callers send): the jobs form's /api/jobs/start and /submit, and
 * the open agent routes /api/agent/jobs, /start and /submit.
 * Canonical (what the site forwards to Windmill f/talent/intake): the
 * normalised payload, `jobApplicationCanonicalSchema`. `talentIntakeSchema`
 * builds it (normalising the phone, cleaning the answers); its output always
 * satisfies the canonical schema, which Windmill checks with ajv against the
 * generated JSON Schema (generated/job_application.v1.canonical.schema.json).
 *
 * The `.meta()` texts are the published OpenAPI descriptions (src/openapi/v1.json).
 */
import { z } from "zod/v4";
import {
  AGENT_LANGUAGE_SOURCES,
  ATTACHMENT_KINDS,
  ATTACHMENT_MIME,
  INTAKE_CHANNELS,
  INTAKE_CLUSTERS,
  INTAKE_LIMITS,
  INTAKE_LOCALES,
  INTAKE_SOURCES,
  INTAKE_FORM_KEYS,
  MAX_PAGE_PATH_LENGTH,
  PAGE_PATH_PATTERN,
  WEB_SOURCE,
  WHATSAPP_SOURCE,
  JOB_HUB_SLUGS,
  MAX_APPLICANT_NAME_LENGTH,
  QUICK_ANSWERS,
  cleanQuickAnswers,
  JOB_ROLE_SLUGS,
  MAX_AGENT_NAME_LENGTH,
  REF_PATTERN,
  isAttachmentKeyFor,
  normaliseIndianMobile,
  type AgentLanguage,
  type IntakeSource,
  type QuickQuestion,
} from "./rules.ts";

export const JOB_APPLICATION_V1 = "job_application.v1";

const attachmentSchema = z
  .object({
    kind: z.enum(ATTACHMENT_KINDS),
    key: z.string().min(1),
    mime: z.string().min(1),
    size: z.number().int().positive(),
    name: z.string().max(INTAKE_LIMITS.maxFileNameLength).nullable(),
  })
  .refine((a) => ATTACHMENT_MIME[a.kind].test(a.mime), { message: "Unsupported file type", path: ["mime"] })
  .refine((a) => a.size <= INTAKE_LIMITS.maxBytes[a.kind], { message: "File too large", path: ["size"] });

const legacySourceSchema = z.enum(Object.keys(INTAKE_SOURCES) as [IntakeSource, ...IntakeSource[]]);
/** "web" for new web submissions; the legacy page sources stay valid (rules.ts). */
const sourceSchema = z.union([z.literal(WEB_SOURCE), legacySourceSchema]);
/** What Windmill accepts: the web sources, and the WhatsApp chat's (Windmill builds those itself). */
const canonicalSourceSchema = z.union([z.literal(WEB_SOURCE), z.literal(WHATSAPP_SOURCE), legacySourceSchema]);
const localeSchema = z.enum(INTAKE_LOCALES);
const clusterSchema = z.enum(INTAKE_CLUSTERS);
const pagePathSchema = z.string().max(MAX_PAGE_PATH_LENGTH).regex(PAGE_PATH_PATTERN);

/** Quick form answers: unknown questions and answer ids are dropped, empty becomes null. */
const quickAnswersSchema = z
  .record(z.string(), z.array(z.string().max(40)).max(12))
  .transform((value) => cleanQuickAnswers(value));

/**
 * What the site forwards to Windmill (the parsing schema). Normalises the
 * phone to +91XXXXXXXXXX and cleans the answers; the result satisfies
 * jobApplicationCanonicalSchema.
 */
export const talentIntakeSchema = z
  .object({
    ref: z.string().regex(REF_PATTERN),
    /** "web" from the jobs pages; a legacy page source from the agent routes. */
    source: sourceSchema,
    /** The page's language (BCP 47). Required with source "web". */
    locale: localeSchema.nullish().transform((l) => l ?? null),
    /** The submission's cluster: the area chosen, else the page's (rules.ts submissionCluster). */
    cluster: clusterSchema.nullish().transform((c) => c ?? null),
    /** The cluster of the page the form sits on (/jobs/haridwar), or null. */
    pageCluster: clusterSchema.nullish().transform((c) => c ?? null),
    /** The neutral path of the page the form sits on, e.g. /jobs/haridwar. */
    pagePath: pagePathSchema.nullish().transform((p) => p ?? null),
    /** The role page it came from, or null from the general jobs page. */
    role: z.enum(JOB_ROLE_SLUGS).nullable(),
    /** The hub page it came from (/jobs/freshers…), or null. */
    hub: z.enum(JOB_HUB_SLUGS).nullable(),
    /** The jobs form ("web") or the open agent routes ("agent"). */
    channel: z.enum(INTAKE_CHANNELS),
    /** The name an agent gave for itself, if any. */
    agentName: z.string().trim().max(MAX_AGENT_NAME_LENGTH).nullable(),
    phone: z
      .string()
      .transform((value, ctx) => {
        const phone = normaliseIndianMobile(value);
        if (!phone) {
          ctx.addIssue({ code: "custom", message: "Enter a 10-digit Indian mobile number" });
          return z.NEVER;
        }
        return phone;
      }),
    adult: z.literal(true),
    consent: z.object({
      version: z.string().min(1).max(40),
      at: z.iso.datetime(),
    }),
    text: z.string().trim().max(INTAKE_LIMITS.maxTextLength).nullable(),
    attachments: z.array(attachmentSchema).max(INTAKE_LIMITS.maxAttachments),
    /** Which web form ("long" or "quick"); null from the agent routes. */
    form: z.enum(INTAKE_FORM_KEYS).nullable(),
    /** The name typed on the quick form. */
    applicantName: z.string().trim().min(1).max(MAX_APPLICANT_NAME_LENGTH).nullable(),
    /** The quick form's answers by question (QUICK_ANSWERS ids). */
    answers: quickAnswersSchema.nullable(),
  })
  .refine((p) => Boolean(p.text) || p.attachments.length > 0 || Boolean(p.answers), {
    message: "Add a file, your answers or a few words about yourself",
    path: ["text"],
  })
  .refine((p) => p.attachments.every((a) => isAttachmentKeyFor(a.key, p.ref)), {
    message: "Attachment does not belong to this submission",
    path: ["attachments"],
  })
  .refine((p) => p.source !== WEB_SOURCE || p.locale !== null, { message: "A web submission needs its page locale", path: ["locale"] });

/** The payload after validation: phone normalised to +91XXXXXXXXXX. */
export type TalentIntakePayload = z.output<typeof talentIntakeSchema>;
export type TalentIntakeAttachment = TalentIntakePayload["attachments"][number];

// --- Canonical (the shape Windmill receives, without transforms) ----------------

/** One branch per kind, so JSON Schema can carry the per-kind type and size rules. */
const canonicalAttachment = (kind: (typeof ATTACHMENT_KINDS)[number]) =>
  z
    .object({
      kind: z.literal(kind),
      key: z.string().min(1).max(300),
      mime: z.string().regex(ATTACHMENT_MIME[kind]),
      size: z.number().int().min(1).max(INTAKE_LIMITS.maxBytes[kind]),
      name: z.string().max(INTAKE_LIMITS.maxFileNameLength).nullable(),
    })
    .strict();

/** Cleaned answers: known questions, known ids, each once (rules.ts cleanQuickAnswers). */
const canonicalAnswers = z
  .object(
    Object.fromEntries(
      (Object.entries(QUICK_ANSWERS) as [QuickQuestion, Record<string, string>][]).map(([question, options]) => [
        question,
        z
          .array(z.enum(Object.keys(options) as [string, ...string[]]))
          .min(1)
          .refine((list) => new Set(list).size === list.length, "Each value once")
          .meta({ uniqueItems: true })
          .optional(),
      ]),
    ),
  )
  .strict()
  .refine((a) => Object.keys(a).length > 0, "No answers")
  .meta({ minProperties: 1 });

/** The E.164 form normaliseIndianMobile returns. */
export const CANONICAL_PHONE_PATTERN = /^\+91[6-9]\d{9}$/;

export const jobApplicationCanonicalSchema = z
  .object({
    ref: z.string().regex(REF_PATTERN),
    source: canonicalSourceSchema,
    locale: localeSchema.nullable(),
    cluster: clusterSchema.nullable(),
    pageCluster: clusterSchema.nullable(),
    pagePath: pagePathSchema.nullable(),
    role: z.enum(JOB_ROLE_SLUGS).nullable(),
    hub: z.enum(JOB_HUB_SLUGS).nullable(),
    channel: z.enum(INTAKE_CHANNELS),
    agentName: z.string().max(MAX_AGENT_NAME_LENGTH).nullable(),
    phone: z.string().regex(CANONICAL_PHONE_PATTERN),
    adult: z.literal(true),
    consent: z.object({ version: z.string().min(1).max(40), at: z.iso.datetime() }).strict(),
    text: z.string().max(INTAKE_LIMITS.maxTextLength).nullable(),
    attachments: z.array(z.discriminatedUnion("kind", ATTACHMENT_KINDS.map(canonicalAttachment) as [ReturnType<typeof canonicalAttachment>, ReturnType<typeof canonicalAttachment>])).max(INTAKE_LIMITS.maxAttachments),
    form: z.enum(INTAKE_FORM_KEYS).nullable(),
    applicantName: z.string().min(1).max(MAX_APPLICANT_NAME_LENGTH).nullable(),
    answers: canonicalAnswers.nullable(),
  })
  .strict()
  .refine((p) => Boolean(p.text) || p.attachments.length > 0 || Boolean(p.answers), {
    message: "Add a file, your answers or a few words about yourself",
    path: ["text"],
  })
  // JSON Schema cannot compare a key with the ref; Windmill checks that one by hand (talent/lib/intake-payload.ts).
  .refine((p) => p.attachments.every((a) => isAttachmentKeyFor(a.key, p.ref)), {
    message: "Attachment does not belong to this submission",
    path: ["attachments"],
  })
  .refine((p) => p.source !== WEB_SOURCE || p.locale !== null, { message: "A web submission needs its page locale", path: ["locale"] })
  .refine((p) => p.source !== WHATSAPP_SOURCE || (p.channel === "whatsapp" && p.locale !== null), {
    message: "A WhatsApp application comes through the WhatsApp channel, in the language chosen in the chat",
    path: ["channel"],
  })
  .meta({
    title: "job_application.v1 (canonical)",
    description: "A job application as the website forwards it to Windmill f/talent/intake.",
    allOf: [
      // Something to go on: a message, a file or the quick form's answers.
      {
        anyOf: [
          { properties: { text: { type: "string", minLength: 1 } }, required: ["text"] },
          { properties: { attachments: { minItems: 1 } }, required: ["attachments"] },
          { properties: { answers: { type: "object" } }, required: ["answers"] },
        ],
      },
      // A web submission carries its page locale.
      { if: { properties: { source: { const: WEB_SOURCE } }, required: ["source"] }, then: { properties: { locale: { type: "string" } } } },
      // A WhatsApp application: the WhatsApp channel, with the chat's language.
      {
        if: { properties: { source: { const: WHATSAPP_SOURCE } }, required: ["source"] },
        then: { properties: { channel: { const: "whatsapp" }, locale: { type: "string" } } },
      },
    ],
  });
export type JobApplicationCanonical = z.output<typeof jobApplicationCanonicalSchema>;

// --- Wire: the jobs form ---------------------------------------------------------

const fileDeclarationSchema = z
  .object({
    kind: z.enum(ATTACHMENT_KINDS),
    mime: z.string().min(1),
    size: z.number().int().positive(),
    name: z.string().max(INTAKE_LIMITS.maxFileNameLength).nullable(),
  })
  .refine((f) => ATTACHMENT_MIME[f.kind].test(f.mime), { message: "Unsupported file type", path: ["mime"] })
  .refine((f) => f.size <= INTAKE_LIMITS.maxBytes[f.kind], { message: "File too large", path: ["size"] });

/**
 * Browser → POST /api/jobs/start. Declares the files about to be uploaded;
 * the response carries one presigned upload URL per file and a signed
 * ticket that /api/jobs/submit requires.
 */
export const jobsStartRequestSchema = z.object({
  /** "web" with `locale`; pages built before it send a legacy page source. */
  source: sourceSchema,
  locale: localeSchema.nullish().transform((l) => l ?? null),
  /** Set by the page, never typed by the applicant. */
  pageCluster: clusterSchema.nullish().transform((c) => c ?? null),
  pagePath: pagePathSchema.nullish().transform((p) => p ?? null),
  role: z.enum(JOB_ROLE_SLUGS).nullish().transform((r) => r ?? null),
  hub: z.enum(JOB_HUB_SLUGS).nullish().transform((h) => h ?? null),
  turnstileToken: z.string().min(1).max(4096),
  files: z.array(fileDeclarationSchema).max(INTAKE_LIMITS.maxAttachments),
})
  .refine((r) => r.source !== WEB_SOURCE || r.locale !== null, { message: "A web submission needs its page locale", path: ["locale"] })
  .meta({ if: { properties: { source: { const: WEB_SOURCE } }, required: ["source"] }, then: { required: ["locale"], properties: { locale: { type: "string" } } } });
export type JobsStartRequest = z.input<typeof jobsStartRequestSchema>;

export interface JobsStartResponse {
  ref: string;
  /** Signed; send back unchanged to /api/jobs/submit. */
  ticket: string;
  /** Same order as the request's files. PUT the file with exactly these headers. */
  uploads: { key: string; url: string; headers: Record<string, string> }[];
}

/** The Google Ads click a web application came from (src/lib/measurement/gateway.ts, currentAdClick). */
export const adClickSchema = z.object({
  type: z.enum(["gclid", "gbraid", "wbraid"]),
  id: z.string().regex(/^[\w-]{10,300}$/),
});
export type AdClick = z.infer<typeof adClickSchema>;

/**
 * The browser's consent choice, sent with a web application so the server
 * decides the ad-click report the same way (src/lib/measurement/policy.ts).
 * A malformed claim is dropped, never a reason to refuse the application.
 */
export const measurementClaimSchema = z.object({
  v: z.number().int().min(1).max(1000),
  choice: z.enum(["all", "required", "none"]),
  legacyRefused: z.boolean(),
});

/** Browser → POST /api/jobs/submit, after every upload has finished. */
export const jobsSubmitRequestSchema = z.object({
  ticket: z.string().min(1).max(8192),
  phone: z.string().min(1).max(20),
  adult: z.literal(true),
  consent: z.literal(true),
  text: z.string().trim().max(INTAKE_LIMITS.maxTextLength).nullable(),
  /** "quick" from /jobs/apply; the long form leaves it out. */
  form: z.enum(INTAKE_FORM_KEYS).optional(),
  name: z.string().trim().max(MAX_APPLICANT_NAME_LENGTH).nullish(),
  answers: quickAnswersSchema.nullish(),
  /** Reported to Google Ads by the server, then dropped; never stored with the application. */
  adClick: adClickSchema.nullish(),
  /** Missing (pages built before it): the click is reported whenever it is sent. */
  measurement: measurementClaimSchema.nullish().catch(null),
});
export type JobsSubmitRequest = z.infer<typeof jobsSubmitRequestSchema>;

export interface JobsSubmitResponse {
  ref: string;
}

// --- Wire: the open agent routes (/api/agent/jobs*) ------------------------------
// No Turnstile: an AI agent applies on a person's behalf with plain JSON. The
// agent confirms the person is 18 or older and agreed that we may keep their
// details and contact them about work, the same two things the jobs form asks
// the person to tick.

const agentLanguageSchema = z.enum(Object.keys(AGENT_LANGUAGE_SOURCES) as [AgentLanguage, ...AgentLanguage[]]);

/** Who is sending. Shown to staff with the submission. */
export const agentInfoObjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(MAX_AGENT_NAME_LENGTH)
      // Plain text: it is shown to staff in email and Chatwoot.
      .regex(/^[\p{L}\p{N} .,_+()/:-]+$/u, "Letters, numbers, spaces and . , _ + ( ) / : - only")
      .meta({ example: "Example Assistant" }),
  })
  .strict()
  .meta({ description: "Who is sending. Optional, shown to our team with the submission." });
/** Optional on every agent route. */
export const agentInfoSchema = agentInfoObjectSchema.optional();

const agentPageFields = {
  /** Language the person speaks; picks the team that replies. */
  language: agentLanguageSchema.default("en").meta({
    description: "Language the person speaks: en (English), hi (Hindi), hinglish (Hindi written in Latin script).",
  }),
  role: z
    .enum(JOB_ROLE_SLUGS)
    .nullish()
    .transform((r) => r ?? null)
    .meta({ description: "The kind of work, if the person named one that matches. Leave it out otherwise." }),
  agent: agentInfoSchema,
};

const agentPersonFields = {
  phone: z
    .string()
    .min(1)
    .max(20)
    .meta({ description: "The job seeker's 10-digit Indian mobile number. +91 or a leading 0 is accepted.", example: "98765 43210" }),
  adult: z.literal(true).meta({ description: "The person told you they are 18 or older. Jobs are for adults only." }),
  consent: z.literal(true).meta({
    description:
      "The person agreed that Vayasya Seva may keep their details and contact them about work, under the job seeker privacy notice (https://www.vayasyaseva.com/en-in/privacy#job-seekers; in plain words, in their language: https://www.vayasyaseva.com/en-in/jobs/privacy).",
  }),
};

/** Agent → POST /api/agent/jobs: a text-only application in one request. */
export const agentJobsRequestSchema = z
  .object({
    ...agentPageFields,
    ...agentPersonFields,
    text: z
      .string()
      .trim()
      .min(1)
      .max(INTAKE_LIMITS.maxTextLength)
      .meta({
        description:
          "About the person in their own words: name, work wanted, experience, where they live, when they can start. Never include Aadhaar, PAN or bank details.",
        example: "Name: Ravi Kumar. Wants packing or warehouse work. 2 years in a packing unit. Lives in Bahadrabad. Can start next week.",
      }),
  })
  .strict();
export type AgentJobsRequest = z.input<typeof agentJobsRequestSchema>;

/** A file an agent declares (the published doc lists the accepted types and sizes). */
const agentFileDeclarationSchema = z
  .object({
    kind: z.enum(ATTACHMENT_KINDS),
    mime: z.string().min(1).meta({
      description:
        "image: image/jpeg, png or webp. document: application/pdf, msword or vnd.openxmlformats-officedocument.wordprocessingml.document.",
      example: "application/pdf",
    }),
    size: z
      .number()
      .int()
      .positive()
      .meta({ description: `Bytes. At most ${INTAKE_LIMITS.maxBytes.image} for images, ${INTAKE_LIMITS.maxBytes.document} for documents.` }),
    name: z.string().max(INTAKE_LIMITS.maxFileNameLength).nullable(),
  })
  .refine((f) => ATTACHMENT_MIME[f.kind].test(f.mime), { message: "Unsupported file type", path: ["mime"] })
  .refine((f) => f.size <= INTAKE_LIMITS.maxBytes[f.kind], { message: "File too large", path: ["size"] })
  // Unknown keys are dropped at runtime; the published doc asks for none.
  .meta({ additionalProperties: false });

/** Agent → POST /api/agent/jobs/start: declare files, get upload URLs and a ticket. */
export const agentJobsStartRequestSchema = z
  .object({
    ...agentPageFields,
    files: z.array(agentFileDeclarationSchema).min(1).max(INTAKE_LIMITS.maxAttachments),
  })
  .strict();
export type AgentJobsStartRequest = z.input<typeof agentJobsStartRequestSchema>;

/** Agent → POST /api/agent/jobs/submit, after every upload has finished. */
export const agentJobsSubmitRequestSchema = z
  .object({
    ticket: z.string().min(1).max(8192),
    ...agentPersonFields,
    text: z.string().trim().max(INTAKE_LIMITS.maxTextLength).nullish().transform((t) => t || null),
  })
  .strict();
export type AgentJobsSubmitRequest = z.input<typeof agentJobsSubmitRequestSchema>;

// --- Responses (published) ---------------------------------------------------------

export const agentJobsStartResponseSchema = z.object({
  ref: z.string().meta({ example: "VS-J-7K2M9Q" }),
  ticket: z.string().meta({ description: "Signed, valid for an hour. Send it unchanged to /api/agent/jobs/submit." }),
  uploads: z
    .array(
      z.object({
        key: z.string(),
        url: z.string().meta({ format: "uri" }),
        headers: z.record(z.string(), z.string()),
      }),
    )
    .meta({ description: "Same order as `files`. PUT each file's bytes to `url` with exactly these `headers`, within 15 minutes." }),
});

export const agentJobsAcceptedSchema = z.object({
  ref: z.string().meta({
    example: "VS-J-7K2M9Q",
    description:
      "Give this to the person. Our team calls them on the number they applied with; they quote this reference if they write to us about the application.",
  }),
});

export const agentErrorSchema = z
  .object({
    error: z.string().meta({ example: "invalid_request" }),
    fields: z.array(z.looseObject({})).optional(),
    retryAfterSeconds: z.number().int().optional(),
  })
  .loose();
