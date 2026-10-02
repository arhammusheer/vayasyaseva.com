import { NextRequest, NextResponse } from "next/server";
import { agentJobsSubmitRequestSchema } from "@/lib/talent-intake/contract";
import { limitAgentRequest } from "@/lib/talent-intake/agent";
import { submitWithTicket, unavailable } from "@/lib/talent-intake/submit";

export const runtime = "nodejs";

/**
 * Open route for AI agents, step 2 of an application with files, after every
 * upload to the URLs from /api/agent/jobs/start has finished.
 */
export async function POST(request: NextRequest) {
  const parsed = agentJobsSubmitRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", fields: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }
  const { ticket, phone, text } = parsed.data;

  const limited = limitAgentRequest(request, phone);
  if (limited) return limited;

  try {
    return await submitWithTicket(ticket, phone, text);
  } catch (error) {
    return unavailable("agent/jobs/submit", error);
  }
}
