/**
 * Job seeker intake rules shared by the website (API route, Zod contract)
 * and the n8n intake workflow, which inlines this file at build time
 * (integrations/n8n/build.mts). Keep it dependency-free: no imports.
 */

/** Submission reference shown to the person, e.g. VS-J-7K2M9Q. */
export const REF_PATTERN = /^VS-J-[A-Z0-9]{6}$/;

/** Which jobs page the submission came from, and the locale it implies. */
export const INTAKE_SOURCES = {
  web_en: "en",
  web_hi: "hi",
  web_hinglish: "hinglish",
} as const;
export type IntakeSource = keyof typeof INTAKE_SOURCES;

/**
 * Role pages under /jobs/<slug>. A submission from one carries the slug, so
 * staff can find people by the work they asked about; the label is for staff.
 */
export const JOB_ROLES = {
  "factory-helper": "Factory helper",
  warehouse: "Warehouse: loading, picking, packing",
  "data-entry-operator": "Data entry operator",
  housekeeping: "Housekeeping",
  "iti-trades": "ITI trades: welder, fitter, electrician",
} as const;
export type JobRole = keyof typeof JOB_ROLES;
export const JOB_ROLE_SLUGS = Object.keys(JOB_ROLES) as [JobRole, ...JobRole[]];

export function isJobRole(value: unknown): value is JobRole {
  return typeof value === "string" && Object.hasOwn(JOB_ROLES, value);
}

export const ATTACHMENT_KINDS = ["audio", "image", "document"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

/** MIME types accepted per kind. Browsers record audio as WebM/Opus or MP4/AAC. */
export const ATTACHMENT_MIME: Record<AttachmentKind, RegExp> = {
  audio: /^audio\/(webm|ogg|mp4|mpeg|aac|wav|x-m4a)(;.*)?$/,
  image: /^image\/(jpeg|png|webp)$/,
  // PDF and Word (.doc, .docx).
  document:
    /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
};

export const INTAKE_LIMITS = {
  maxAttachments: 8,
  maxTextLength: 4000,
  maxFileNameLength: 200,
  maxAudioSeconds: 180,
  maxBytes: { audio: 10 * 1024 * 1024, image: 10 * 1024 * 1024, document: 20 * 1024 * 1024 } as Record<AttachmentKind, number>,
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
