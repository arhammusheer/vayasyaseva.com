import { z } from "zod/v4";
import {
  ATTACHMENT_KINDS,
  ATTACHMENT_MIME,
  INTAKE_LIMITS,
  INTAKE_SOURCES,
  REF_PATTERN,
  isAttachmentKeyFor,
  normaliseIndianMobile,
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

export const talentIntakeSchema = z
  .object({
    ref: z.string().regex(REF_PATTERN),
    source: z.enum(Object.keys(INTAKE_SOURCES) as [IntakeSource, ...IntakeSource[]]),
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
  })
  .refine((p) => Boolean(p.text) || p.attachments.length > 0, {
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

/**
 * Browser → POST /api/jobs/start. Declares the files about to be uploaded;
 * the response carries one presigned upload URL per file and a signed
 * ticket that /api/jobs/submit requires.
 */
export const jobsStartRequestSchema = z.object({
  source: z.enum(Object.keys(INTAKE_SOURCES) as [IntakeSource, ...IntakeSource[]]),
  turnstileToken: z.string().min(1).max(4096),
  files: z
    .array(
      z
        .object({
          kind: z.enum(ATTACHMENT_KINDS),
          mime: z.string().min(1),
          size: z.number().int().positive(),
          name: z.string().max(INTAKE_LIMITS.maxFileNameLength).nullable(),
        })
        .refine((f) => ATTACHMENT_MIME[f.kind].test(f.mime), { message: "Unsupported file type", path: ["mime"] })
        .refine((f) => f.size <= INTAKE_LIMITS.maxBytes[f.kind], { message: "File too large", path: ["size"] }),
    )
    .max(INTAKE_LIMITS.maxAttachments),
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
export const jobsSubmitRequestSchema = z.object({
  ticket: z.string().min(1).max(8192),
  phone: z.string().min(1).max(20),
  adult: z.literal(true),
  consent: z.literal(true),
  text: z.string().trim().max(INTAKE_LIMITS.maxTextLength).nullable(),
});
export type JobsSubmitRequest = z.infer<typeof jobsSubmitRequestSchema>;

export interface JobsSubmitResponse {
  ref: string;
}
