import { NextRequest, NextResponse } from "next/server";
import { presignUpload, readTicket, uploadedSize } from "@/lib/talent-intake/server";
import { unavailable } from "@/lib/talent-intake/submit";
import type { JobsStartResponse } from "@/lib/talent-intake/contract";

export const runtime = "nodejs";

/** Renew upload URLs for a signed, already-verified human application. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (typeof body?.ticket !== "string" || body.ticket.length > 8192) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    const ticket = readTicket(body.ticket);
    if (!ticket) return NextResponse.json({ error: "expired" }, { status: 410 });
    if ((ticket.channel ?? "web") !== "web") return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    // The form renews URLs only while an upload is missing. Once every file is
    // in, new URLs would only let a checked (or already sent) file be replaced.
    const present = await Promise.all(ticket.files.map((f) => uploadedSize(f.key)));
    if (ticket.files.length > 0 && present.every((size) => size !== null)) {
      return NextResponse.json({ error: "already_uploaded" }, { status: 409 });
    }
    const uploads = await Promise.all(ticket.files.map(async (f) => ({ key: f.key, ...await presignUpload(f.key, f.mime) })));
    const response: JobsStartResponse = { ref: ticket.ref, ticket: body.ticket, uploads };
    return NextResponse.json(response, { headers: { "cache-control": "no-store" } });
  } catch (error) { return unavailable("jobs/resume", error); }
}
