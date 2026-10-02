import { NextRequest, NextResponse } from "next/server";
import { agentJobsRequestSchema } from "@/lib/talent-intake/contract";
import { limitAgentRequest } from "@/lib/talent-intake/agent";
import { AGENT_LANGUAGE_SOURCES } from "@/lib/talent-intake/rules";
import { newRef } from "@/lib/talent-intake/server";
import { forwardSubmission, unavailable } from "@/lib/talent-intake/submit";

export const runtime = "nodejs";

/**
 * Open route for AI agents: a text-only job application in one request, no
 * Turnstile. Documented in /openapi/v1.json and /llms.txt. Files go through
 * /api/agent/jobs/start and /api/agent/jobs/submit instead.
 */
export async function POST(request: NextRequest) {
  const parsed = agentJobsRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", fields: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }
  const { language, role, agent, phone, text } = parsed.data;

  const limited = limitAgentRequest(request, phone);
  if (limited) return limited;

  try {
    return await forwardSubmission(
      {
        ref: newRef(),
        source: AGENT_LANGUAGE_SOURCES[language],
        role,
        hub: null,
        channel: "agent",
        agentName: agent?.name ?? null,
        files: [],
      },
      phone,
      text,
    );
  } catch (error) {
    return unavailable("agent/jobs", error);
  }
}
