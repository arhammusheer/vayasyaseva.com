/**
 * upload_ticket: the signed ticket /api/jobs/start (and /api/agent/jobs/start)
 * issues and /submit and /resume read back. It binds the submit to the
 * reference and the files the start declared. The body is this object as
 * base64url JSON; the signature is HMAC-SHA256 (src/lib/talent-intake/server.ts).
 */
import { z } from "zod/v4";
import {
  ATTACHMENT_KINDS,
  INTAKE_CHANNELS,
  INTAKE_CLUSTERS,
  INTAKE_LOCALES,
  INTAKE_SOURCES,
  JOB_HUB_SLUGS,
  JOB_ROLE_SLUGS,
  MAX_AGENT_NAME_LENGTH,
  REF_PATTERN,
  WEB_SOURCE,
  type IntakeSource,
} from "./rules.ts";

export const UPLOAD_TICKET = "upload_ticket";

export const ticketFileSchema = z.object({
  key: z.string().min(1),
  kind: z.enum(ATTACHMENT_KINDS),
  mime: z.string().min(1),
  size: z.number().int().positive(),
  name: z.string().nullable(),
});

export const uploadTicketSchema = z
  .object({
    ref: z.string().regex(REF_PATTERN),
    /** "web" on tickets from pages that send their locale; a legacy page source otherwise. */
    source: z.union([z.literal(WEB_SOURCE), z.enum(Object.keys(INTAKE_SOURCES) as [IntakeSource, ...IntakeSource[]])]),
    /** The page's language. Missing on tickets with a legacy source, which implies it. */
    locale: z.enum(INTAKE_LOCALES).nullish(),
    /** Missing on older tickets. */
    pageCluster: z.enum(INTAKE_CLUSTERS).nullish(),
    pagePath: z.string().nullish(),
    role: z.enum(JOB_ROLE_SLUGS).nullish(),
    hub: z.enum(JOB_HUB_SLUGS).nullish(),
    /** "agent" on tickets from /api/agent/jobs/start; missing means the jobs form. */
    channel: z.enum(INTAKE_CHANNELS).optional(),
    agentName: z.string().max(MAX_AGENT_NAME_LENGTH).nullish(),
    files: z.array(ticketFileSchema),
    /** Expiry, in Unix seconds. */
    exp: z.number().int(),
  })
  .meta({ title: "upload_ticket", description: "The signed ticket from the jobs start routes (its base64url JSON body)." });

export type UploadTicket = z.infer<typeof uploadTicketSchema>;
export type TicketFile = z.infer<typeof ticketFileSchema>;
