/**
 * The shared tail of a jobs submission: /api/jobs/submit (the form) and the
 * open agent routes under /api/agent/jobs end here. Validates the payload
 * against the contract and forwards it to n8n.
 */
import { NextResponse } from "next/server";
import { talentIntakeSchema, type JobsSubmitResponse } from "./contract";
import {
  IntakeNotConfigured,
  TALENT_CONSENT_VERSION,
  deleteUpload,
  forwardToIntake,
  readTicket,
  uploadedSize,
  type Ticket,
} from "./server";

type Draft = Omit<Ticket, "exp" | "files"> & { files: Ticket["files"] };

/** Builds, validates and forwards one submission; answers 202 with the reference. */
export async function forwardSubmission(draft: Draft, phone: string, text: string | null) {
  const payload = talentIntakeSchema.safeParse({
    ref: draft.ref,
    source: draft.source,
    role: draft.role ?? null,
    hub: draft.hub ?? null,
    channel: draft.channel ?? "web",
    agentName: draft.agentName ?? null,
    phone,
    adult: true,
    consent: { version: TALENT_CONSENT_VERSION, at: new Date().toISOString() },
    text: text || null,
    attachments: draft.files.map(({ kind, key, mime, size, name }) => ({ kind, key, mime, size, name })),
  });
  if (!payload.success) {
    return NextResponse.json({ error: "invalid_request", fields: payload.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }

  await forwardToIntake(payload.data);
  const body: JobsSubmitResponse = { ref: draft.ref };
  return NextResponse.json(body, { status: 202, headers: { "cache-control": "no-store" } });
}

/**
 * Checks the ticket from a start route, confirms each upload exists and
 * matches what was declared, then forwards. The attachment list comes from
 * the ticket, never from the caller.
 */
export async function submitWithTicket(rawTicket: string, phone: string, text: string | null) {
  const ticket = readTicket(rawTicket);
  if (!ticket) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  for (const file of ticket.files) {
    const size = await uploadedSize(file.key);
    if (size === null) return NextResponse.json({ error: "upload_missing", key: file.key }, { status: 409 });
    if (size > file.size) {
      await deleteUpload(file.key);
      return NextResponse.json({ error: "upload_too_large", key: file.key }, { status: 413 });
    }
  }

  return forwardSubmission(ticket, phone, text);
}

/** The 5xx answer for a failure on our side, logged under `route`. */
export function unavailable(route: string, error: unknown) {
  if (error instanceof IntakeNotConfigured) {
    console.error(`${route} not configured:`, error.message);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  console.error(`${route} failed:`, error);
  return NextResponse.json({ error: "unavailable" }, { status: 502 });
}
