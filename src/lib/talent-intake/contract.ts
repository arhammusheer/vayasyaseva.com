import { z } from "zod/v4";
import {
  AGENT_LANGUAGE_SOURCES,
  ATTACHMENT_KINDS,
  ATTACHMENT_MIME,
  INTAKE_CHANNELS,
  INTAKE_LIMITS,
  INTAKE_SOURCES,
  INTAKE_FORM_KEYS,
  JOB_HUB_SLUGS,
  MAX_APPLICANT_NAME_LENGTH,
  cleanQuickAnswers,
  JOB_ROLE_SLUGS,
  MAX_AGENT_NAME_LENGTH,
  REF_PATTERN,
  isAttachmentKeyFor,
  normaliseIndianMobile,
  type AgentLanguage,
  type IntakeSource,
} from "./rules";

/**
 * The job seeker intake contract: what the website's /api/jobs/intake route
 * forwards to the n8n webhook (hooks.vayasyaseva.com/webhook/vspl-talent-intake).
 * The n8n validation node is type-checked against `TalentIntakePayload` and
 * enforces the same rules from ./rules at runtime.
 */

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

/** Quick form answers: unknown questions and answer ids are dropped, empty becomes null. */
const quickAnswersSchema = z
  .record(z.string(), z.array(z.string().max(40)).max(12))
  .transform((value) => cleanQuickAnswers(value));

export const talentIntakeSchema = z
  .object({
    ref: z.string().regex(REF_PATTERN),
    source: z.enum(Object.keys(INTAKE_SOURCES) as [IntakeSource, ...IntakeSource[]]),
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
    message: "Add a voice note, a file or a few words about yourself",
    path: ["text"],
  })
  .refine((p) => p.attachments.every((a) => isAttachmentKeyFor(a.key, p.ref)), {
    message: "Attachment does not belong to this submission",
    path: ["attachments"],
  });

/** The payload after validation: phone normalised to +91XXXXXXXXXX. */
export type TalentIntakePayload = z.output<typeof talentIntakeSchema>;
export type TalentIntakeAttachment = TalentIntakePayload["attachments"][number];

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
  source: z.enum(Object.keys(INTAKE_SOURCES) as [IntakeSource, ...IntakeSource[]]),
  role: z.enum(JOB_ROLE_SLUGS).nullish().transform((r) => r ?? null),
  hub: z.enum(JOB_HUB_SLUGS).nullish().transform((h) => h ?? null),
  turnstileToken: z.string().min(1).max(4096),
  files: z.array(fileDeclarationSchema).max(INTAKE_LIMITS.maxAttachments),
});
export type JobsStartRequest = z.infer<typeof jobsStartRequestSchema>;

export interface JobsStartResponse {
  ref: string;
  /** Signed; send back unchanged to /api/jobs/submit. */
  ticket: string;
  /** Same order as the request's files. PUT the file with exactly these headers. */
  uploads: { key: string; url: string; headers: Record<string, string> }[];
}

/** Browser → POST /api/jobs/submit, after every upload has finished. */
/** The Google Ads click a web application came from (src/lib/ad-click.ts). */
export const adClickSchema = z.object({
  type: z.enum(["gclid", "gbraid", "wbraid"]),
  id: z.string().regex(/^[\w-]{10,300}$/),
});
export type AdClick = z.infer<typeof adClickSchema>;

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
});
export type JobsSubmitRequest = z.infer<typeof jobsSubmitRequestSchema>;

export interface JobsSubmitResponse {
  ref: string;
}

// --- Open agent routes (/api/agent/jobs*) -------------------------------------
// No Turnstile: an AI agent applies on a person's behalf with plain JSON. The
// agent confirms the person is 18 or older and agreed to be contacted, the
// same two things the jobs form asks the person to tick.

const agentLanguageSchema = z.enum(Object.keys(AGENT_LANGUAGE_SOURCES) as [AgentLanguage, ...AgentLanguage[]]);

/** Who is sending. Optional; shown to staff with the submission. */
export const agentInfoSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(MAX_AGENT_NAME_LENGTH)
      // Plain text: it is shown to staff in email and Chatwoot.
      .regex(/^[\p{L}\p{N} .,_+()/:-]+$/u, "Letters, numbers, spaces and . , _ + ( ) / : - only"),
  })
  .strict()
  .optional();

const agentPageFields = {
  /** Language the person speaks; picks the team and transcription language. */
  language: agentLanguageSchema.default("en"),
  role: z.enum(JOB_ROLE_SLUGS).nullish().transform((r) => r ?? null),
  agent: agentInfoSchema,
};

const agentPersonFields = {
  phone: z.string().min(1).max(20),
  adult: z.literal(true),
  consent: z.literal(true),
};

/** Agent → POST /api/agent/jobs: a text-only application in one request. */
export const agentJobsRequestSchema = z
  .object({
    ...agentPageFields,
    ...agentPersonFields,
    text: z.string().trim().min(1).max(INTAKE_LIMITS.maxTextLength),
  })
  .strict();
export type AgentJobsRequest = z.input<typeof agentJobsRequestSchema>;

/** Agent → POST /api/agent/jobs/start: declare files, get upload URLs and a ticket. */
export const agentJobsStartRequestSchema = z
  .object({
    ...agentPageFields,
    files: z.array(fileDeclarationSchema).min(1).max(INTAKE_LIMITS.maxAttachments),
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
