import { NextRequest, NextResponse } from "next/server";
import { jobsStartRequestSchema, type JobsStartResponse } from "@/lib/talent-intake/contract";
import { attachmentKey, issueTicket, newRef, presignUpload } from "@/lib/talent-intake/server";
import { unavailable } from "@/lib/talent-intake/submit";
import { clientIp } from "@/lib/rate-limit";
import { TurnstileNotConfigured, verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

/**
 * Step 1 of a jobs submission: checks Turnstile, issues the reference, and
 * returns one short-lived upload URL per declared file plus a signed ticket.
 * AI agents use /api/agent/jobs instead, which needs no Turnstile.
 */
export async function POST(request: NextRequest) {
  const parsed = jobsStartRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { source, role, hub, turnstileToken, files } = parsed.data;

  try {
    if (!(await verifyTurnstile(turnstileToken, clientIp(request)))) {
      return NextResponse.json({ error: "verification_failed", agentRoute: "/api/agent/jobs" }, { status: 403 });
    }

    const ref = newRef();
    const now = new Date();
    const ticketFiles = files.map((f, position) => ({ ...f, key: attachmentKey(ref, position, f.mime, now) }));
    const uploads = await Promise.all(
      ticketFiles.map(async (f) => ({ key: f.key, ...(await presignUpload(f.key, f.mime)) })),
    );

    const body: JobsStartResponse = { ref, ticket: issueTicket({ ref, source, role, hub, files: ticketFiles }), uploads };
    return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof TurnstileNotConfigured) {
      console.error("jobs/start not configured:", error.message);
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    return unavailable("jobs/start", error);
  }
}
