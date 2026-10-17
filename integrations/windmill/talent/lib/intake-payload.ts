/**
 * The website's application (job_application.v1, canonical), checked with
 * the generated JSON Schema (contracts/validate.ts), then shaped for
 * SAVE_SUBMISSION. JSON Schema cannot say that a file key lies under the
 * submission's own reference, so that one rule is checked here.
 */
import type { JobApplicationCanonical } from "../../../../packages/contracts/src/job-application.v1.ts";
import { INTAKE_SOURCES, WEB_SOURCE, isAttachmentKeyFor } from "../../../../packages/contracts/src/rules.ts";
import { SCHEMAS, check } from "../../contracts/validate.ts";
import { maskIds } from "./mask.ts";
import type { ValidatedSubmission } from "./types.ts";

export type Validation = { ok: true; value: ValidatedSubmission } | { ok: false; errors: string[] };

export function checkSubmission(raw: unknown): Validation {
  const checked = check<JobApplicationCanonical>(SCHEMAS["job_application.v1"], raw);
  if (!checked.ok) return checked;
  const p = checked.value;
  if (!p.attachments.every((a) => isAttachmentKeyFor(a.key, p.ref))) return { ok: false, errors: ["attachments"] };
  return {
    ok: true,
    value: {
      ref: p.ref,
      source: p.source,
      role: p.role,
      hub: p.hub,
      channel: p.channel,
      agentName: p.agentName?.trim() || null,
      form: p.form,
      applicantName: p.applicantName?.trim() || null,
      answers: p.answers,
      // The site sends the BCP 47 locale; a legacy source alone implies its short code.
      locale: p.locale ?? INTAKE_SOURCES[p.source as Exclude<typeof p.source, typeof WEB_SOURCE>],
      cluster: p.cluster,
      pageCluster: p.pageCluster,
      pagePath: p.pagePath,
      phone: p.phone,
      consentVersion: p.consent.version,
      consentedAt: new Date(p.consent.at).toISOString(),
      text: p.text?.trim() ? maskIds(p.text.trim()) : null,
      attachments: p.attachments.map((a, position) => ({ position, kind: a.kind, key: a.key, mime: a.mime, size: a.size, name: a.name })),
    },
  };
}

/** SAVE_SUBMISSION's parameters, in $1..$18 order (as the n8n node passed them). */
export function saveSubmissionParams(s: ValidatedSubmission): (string | null)[] {
  return [
    s.ref,
    s.source,
    s.locale,
    s.phone,
    s.consentVersion,
    s.consentedAt,
    s.text,
    JSON.stringify(s.attachments),
    s.role,
    s.hub,
    s.channel,
    s.agentName,
    s.form,
    s.applicantName,
    s.answers ? JSON.stringify(s.answers) : null,
    s.cluster,
    s.pageCluster,
    s.pagePath,
  ];
}
