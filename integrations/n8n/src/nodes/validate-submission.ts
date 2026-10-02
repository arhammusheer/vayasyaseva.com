/**
 * Intake · "Validate submission" (run once). Re-checks the website's payload
 * with the same rules as its Zod contract (n8n cannot load Zod), then
 * normalises it for "Save submission". A throw makes the webhook answer 500,
 * which the website shows as "please try again".
 */
import type { TalentIntakePayload } from "../../../../src/lib/talent-intake/contract.ts";
import {
  ATTACHMENT_MIME,
  INTAKE_LIMITS,
  INTAKE_SOURCES,
  MAX_AGENT_NAME_LENGTH,
  REF_PATTERN,
  isJobHub,
  isJobRole,
  isAttachmentKeyFor,
  normaliseIndianMobile,
  type AttachmentKind,
} from "../../../../src/lib/talent-intake/rules.ts";
import { maskIds } from "../lib/mask.ts";
import type { ValidatedSubmission } from "../types.ts";

export default async function main(): Promise<N8nItem<ValidatedSubmission>[]> {
  const body = ($("Webhook").first().json.body ?? {}) as Partial<TalentIntakePayload>;
  const errors = new Set<string>();

  const ref = String(body.ref ?? "");
  if (!REF_PATTERN.test(ref)) errors.add("ref");

  const source = body.source && body.source in INTAKE_SOURCES ? body.source : null;
  if (!source) errors.add("source");

  // Unknown role or hub: keep the submission, drop the tag.
  const role = isJobRole(body.role) ? body.role : null;
  const hub = isJobHub(body.hub) ? body.hub : null;

  // Missing on payloads from before the agent routes: those are all the jobs form.
  const channel = body.channel === "agent" ? "agent" : "web";
  const agentName =
    channel === "agent" && typeof body.agentName === "string" && body.agentName.trim()
      ? body.agentName.trim().slice(0, MAX_AGENT_NAME_LENGTH)
      : null;

  const phone = normaliseIndianMobile(String(body.phone ?? ""));
  if (!phone) errors.add("phone");

  if (body.adult !== true) errors.add("adult");
  const consentAt = Date.parse(body.consent?.at ?? "");
  if (!body.consent?.version || Number.isNaN(consentAt)) errors.add("consent");

  const rawText = typeof body.text === "string" ? body.text.trim() : "";
  const text = rawText ? maskIds(rawText.slice(0, INTAKE_LIMITS.maxTextLength)) : null;

  const attachments = (Array.isArray(body.attachments) ? body.attachments : [])
    .slice(0, INTAKE_LIMITS.maxAttachments)
    .map((a, position) => ({
      position,
      kind: String(a?.kind ?? "") as AttachmentKind,
      key: String(a?.key ?? ""),
      mime: String(a?.mime ?? ""),
      size: Math.max(0, Math.trunc(Number(a?.size) || 0)),
      name: a?.name ? String(a.name).slice(0, INTAKE_LIMITS.maxFileNameLength) : null,
    }));
  for (const a of attachments) {
    if (!(a.kind in ATTACHMENT_MIME) || !ATTACHMENT_MIME[a.kind].test(a.mime)) errors.add("attachment type");
    else if (a.size > INTAKE_LIMITS.maxBytes[a.kind]) errors.add("attachment size");
    if (!isAttachmentKeyFor(a.key, ref)) errors.add("attachment key");
  }

  if (!text && attachments.length === 0) errors.add("empty");
  if (errors.size || !source || !phone || !body.consent) {
    throw new Error(`Invalid submission: ${[...errors].join(", ")}`);
  }

  return [
    {
      json: {
        ref,
        source,
        role,
        hub,
        channel,
        agentName,
        locale: INTAKE_SOURCES[source],
        phone,
        consentVersion: String(body.consent.version).slice(0, 40),
        consentedAt: new Date(consentAt).toISOString(),
        text,
        attachments,
      },
    },
  ];
}
