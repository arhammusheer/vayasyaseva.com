import { NextRequest, NextResponse } from "next/server";
import {
  jobsSubmitRequestSchema,
  talentIntakeSchema,
  type JobsSubmitResponse,
} from "@/lib/talent-intake/contract";
import {
  IntakeNotConfigured,
  TALENT_CONSENT_VERSION,
  deleteUpload,
  forwardToIntake,
  readTicket,
  uploadedSize,
} from "@/lib/talent-intake/server";

export const runtime = "nodejs";

/**
 * Step 2 of a jobs submission, after the browser has uploaded every file:
 * checks the ticket from /api/jobs/start, confirms each upload exists and
 * matches what was declared, validates the whole payload against the
 * contract and forwards it to n8n. The attachment list comes from the
 * ticket, never from the browser.
 */
export async function POST(request: NextRequest) {
  const parsed = jobsSubmitRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", fields: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }
  const { ticket: rawTicket, phone, text } = parsed.data;

  try {
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

    const payload = talentIntakeSchema.safeParse({
      ref: ticket.ref,
      source: ticket.source,
      role: ticket.role ?? null,
      hub: ticket.hub ?? null,
      phone,
      adult: true,
      consent: { version: TALENT_CONSENT_VERSION, at: new Date().toISOString() },
      text: text || null,
      attachments: ticket.files.map(({ kind, key, mime, size, name }) => ({ kind, key, mime, size, name })),
    });
    if (!payload.success) {
      return NextResponse.json({ error: "invalid_request", fields: payload.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
    }

    await forwardToIntake(payload.data);
    const body: JobsSubmitResponse = { ref: ticket.ref };
    return NextResponse.json(body, { status: 202, headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof IntakeNotConfigured) {
      console.error("jobs/submit not configured:", error.message);
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    console.error("jobs/submit failed:", error);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
