import { NextRequest, NextResponse } from "next/server";
import { jobsSubmitRequestSchema } from "@/lib/talent-intake/contract";
import { submitWithTicket, unavailable } from "@/lib/talent-intake/submit";

export const runtime = "nodejs";

/**
 * Step 2 of a jobs submission, after the browser has uploaded every file:
 * checks the ticket from /api/jobs/start, confirms each upload exists and
 * matches what was declared, validates the whole payload against the
 * contract and forwards it to n8n.
 */
export async function POST(request: NextRequest) {
  const parsed = jobsSubmitRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", fields: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }
  const { ticket, phone, text, form, name, answers } = parsed.data;

  try {
    return await submitWithTicket(ticket, phone, text, "web", { form, applicantName: name, answers });
  } catch (error) {
    return unavailable("jobs/submit", error);
  }
}
