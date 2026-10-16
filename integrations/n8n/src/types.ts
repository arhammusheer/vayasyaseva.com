/**
 * Shapes of the data flowing between the talent workflows' nodes. Row types
 * mirror integrations/n8n/schema.sql; the claim queries in build.mts select
 * exactly these columns.
 */
import type {
  AttachmentKind,
  IntakeChannel,
  IntakeCluster,
  IntakeForm,
  IntakeLocale,
  JobHub,
  JobRole,
  LegacyLocale,
  QuickAnswers,
  SubmissionSource,
} from "../../../src/lib/talent-intake/rules.ts";

/**
 * Stored values (schema.sql): a BCP 47 tag on new rows, the legacy short code
 * on older ones ("hinglish" is hi-Latn-IN).
 */
export type Locale = IntakeLocale | LegacyLocale;

/** Output of "Validate submission", the parameters of "Save submission". */
export interface ValidatedSubmission {
  ref: string;
  source: SubmissionSource;
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
  /** submissions.cluster, page_cluster, page_path: set by the page; null when unknown. */
  cluster: IntakeCluster | null;
  pageCluster: IntakeCluster | null;
  pagePath: string | null;
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
  /** "audio" only on rows saved before 16 October 2026; the intake no longer accepts it. */
  kind: AttachmentKind | "audio";
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
  source: SubmissionSource;
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
  cluster: IntakeCluster | null;
  pageCluster: IntakeCluster | null;
  pagePath: string | null;
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

/**
 * One row of "Claim erasure" (retention workflow): an erasure request, with
 * every R2 key and Chatwoot contact stored for its phone number.
 */
export interface ClaimedErasure {
  id: string;
  phone: string;
  reason: "request" | "retention";
  files: string[];
  contacts: number[];
}

/** Output of "Files to delete": one R2 key, or null when there is none. */
export interface FileToDelete {
  requestId: string;
  key: string | null;
}

/** Output of "Contacts to delete": one Chatwoot contact id, or null when there is none. */
export interface ContactToDelete {
  requestId: string;
  contactId: number | null;
}

/** The retention workflow's Settings node (filled by the deploy script). */
export interface RetentionSettings {
  chatwootBaseUrl: string;
  chatwootAccountId: string;
}
