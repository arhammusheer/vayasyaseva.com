/**
 * Shapes of the rows and values the talent scripts pass around. Row types
 * mirror talent/schema.sql; the claim queries in sql.ts select exactly
 * these columns (ported from the retired n8n types).
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
} from "../../../../src/lib/talent-intake/rules.ts";

/** Stored values: a BCP 47 tag on new rows, the legacy short code on older ones ("hinglish" is hi-Latn-IN). */
export type Locale = IntakeLocale | LegacyLocale;

/** A validated website payload: the parameters of SAVE_SUBMISSION. */
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

/** One attachment of a claimed submission (jsonb_agg, ordered by position). */
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

/** The single row of CLAIM_SUBMISSION. */
export interface ClaimedSubmission {
  id: string;
  ref: string;
  source: SubmissionSource;
  role: JobRole | null;
  hub: JobHub | null;
  channel: IntakeChannel;
  agentName: string | null;
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

export interface ComposedNote {
  contactName: string;
  note: string;
}

/** One file to attach to the Chatwoot conversation, in file-number order. */
export interface FileToAttach {
  key: string;
  label: string;
}

/** The single row of CLAIM_ACKNOWLEDGEMENT. */
export interface ClaimedAcknowledgement {
  submission_id: string;
  attempts: number;
  ref: string;
  phone: string;
}

/** What Fast2SMS answered, or the network error: the input of classifyAcknowledgement. */
export interface Fast2SmsResponse {
  statusCode?: number;
  body?: { return?: boolean; request_id?: string; status_code?: number };
  error?: string;
}

export interface AcknowledgementResult {
  submissionId: string;
  status: "accepted" | "pending" | "failed" | "unknown";
  requestId: string | null;
  error: string | null;
}

/** The single row of CLAIM_ERASURE: a request, with every R2 key and Chatwoot contact for its phone. */
export interface ClaimedErasure {
  id: string;
  phone: string;
  reason: "request" | "retention";
  files: string[];
  contacts: number[];
}
