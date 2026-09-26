import { NextRequest, NextResponse } from "next/server";
import { jobsStartRequestSchema, type JobsStartResponse } from "@/lib/talent-intake/contract";
import {
  IntakeNotConfigured,
  attachmentKey,
  issueTicket,
  newRef,
  presignUpload,
  verifyTurnstile,
} from "@/lib/talent-intake/server";

export const runtime = "nodejs";

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}

/**
 * Step 1 of a jobs submission: checks Turnstile, issues the reference, and
 * returns one short-lived upload URL per declared file plus a signed ticket.
 */
export async function POST(request: NextRequest) {
  const parsed = jobsStartRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { source, turnstileToken, files } = parsed.data;

  try {
    if (!(await verifyTurnstile(turnstileToken, clientIp(request)))) {
      return NextResponse.json({ error: "verification_failed" }, { status: 403 });
    }

    const ref = newRef();
    const now = new Date();
    const ticketFiles = files.map((f, position) => ({ ...f, key: attachmentKey(ref, position, f.mime, now) }));
    const uploads = await Promise.all(
      ticketFiles.map(async (f) => ({ key: f.key, ...(await presignUpload(f.key, f.mime)) })),
    );

    const body: JobsStartResponse = { ref, ticket: issueTicket({ ref, source, files: ticketFiles }), uploads };
    return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof IntakeNotConfigured) {
      console.error("jobs/start not configured:", error.message);
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    console.error("jobs/start failed:", error);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
