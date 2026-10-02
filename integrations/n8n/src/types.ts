/**
 * Shapes of the data flowing between the talent workflows' nodes. Row types
 * mirror integrations/n8n/schema.sql; the claim queries in build.mts select
 * exactly these columns.
 */
import type { AttachmentKind, IntakeChannel, IntakeSource, JobHub, JobRole, IntakeForm, QuickAnswers } from "../../../src/lib/talent-intake/rules.ts";

/** Stored values (schema.sql). "hinglish" is the website's hi-Latn-IN locale. */
export type Locale = "en" | "hi" | "hinglish";

/** Output of "Validate submission", the parameters of "Save submission". */
export interface ValidatedSubmission {
  ref: string;
  source: IntakeSource;
  role: JobRole | null;
  hub: JobHub | null;
  /** "agent" when sent through /api/agent/jobs (submissions.channel). */
  channel: IntakeChannel;
  agentName: string | null;
  /** "long" or "quick" web form; null from the agent routes. */
  form: IntakeForm | null;
  applicantName: string | null;
  answers: QuickAnswers | null;
  locale: Locale;
  phone: string;
  consentVersion: string;
  consentedAt: string;
  text: string | null;
  attachments: {
    position: number;
    kind: AttachmentKind;
    key: string;
    mime: string;
    size: number;
    name: string | null;
  }[];
}

/** One row of "Claim voice notes". */
export interface ClaimedVoiceNote {
  id: string;
  r2_key: string;
  mime: string;
  file_name: string;
  locale: Locale;
}

/** One attachment inside "Claim submission" (jsonb_agg, ordered by position). */
export interface ClaimedAttachment {
  id: string;
  position: number;
  kind: AttachmentKind;
  key: string;
  mime: string;
  name: string | null;
  transcript: string | null;
  transcriptStatus: "none" | "pending" | "running" | "done" | "failed";
}

/** The single row of "Claim submission". */
export interface ClaimedSubmission {
  id: string;
  ref: string;
  source: IntakeSource;
  role: JobRole | null;
  hub: JobHub | null;
  /** "agent" when sent through /api/agent/jobs (submissions.channel). */
  channel: IntakeChannel;
  agentName: string | null;
  /** "long" or "quick" web form; null from the agent routes. */
  form: IntakeForm | null;
  applicantName: string | null;
  answers: QuickAnswers | null;
  locale: Locale;
  phone: string;
  text: string | null;
  attachments: ClaimedAttachment[];
}

export interface DeliverSettings {
  chatwootBaseUrl: string;
  /** The "Jobs, website" API inbox's identifier (Chatwoot public API). */
  chatwootInboxIdentifier: string;
}

export interface ComposedNote {
  contactName: string;
  note: string;
}

/** Sarvam's transcript, from the REST response or a Batch result file. */
export interface SarvamTranscript {
  request_id?: string;
  transcript?: string;
  language_code?: string;
}

export interface TranscriptResult {
  attachmentId: string;
  requestId: string | null;
  transcript: string;
  language: string | null;
}

/** One file for "Download files", with what "Chatwoot: attach file" needs. */
export interface FileToAttach {
  key: string;
  conversationId: number;
  label: string;
}
