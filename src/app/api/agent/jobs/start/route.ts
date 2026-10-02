import { NextRequest, NextResponse } from "next/server";
import { agentJobsStartRequestSchema, type JobsStartResponse } from "@/lib/talent-intake/contract";
import { limitAgentRequest } from "@/lib/talent-intake/agent";
import { AGENT_LANGUAGE_SOURCES } from "@/lib/talent-intake/rules";
import { attachmentKey, issueTicket, newRef, presignUpload } from "@/lib/talent-intake/server";
import { unavailable } from "@/lib/talent-intake/submit";

export const runtime = "nodejs";

/**
 * Open route for AI agents, step 1 of an application with files: the same as
 * /api/jobs/start without Turnstile. Returns the reference, one presigned PUT
 * URL per declared file and a ticket for /api/agent/jobs/submit.
 */
export async function POST(request: NextRequest) {
  const parsed = agentJobsStartRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", fields: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }
  const { language, role, agent, files } = parsed.data;

  const { limited, release } = limitAgentRequest(request);
  if (limited) return limited;

  try {
    const ref = newRef();
    const now = new Date();
    const ticketFiles = files.map((f, position) => ({ ...f, key: attachmentKey(ref, position, f.mime, now) }));
    const uploads = await Promise.all(
      ticketFiles.map(async (f) => ({ key: f.key, ...(await presignUpload(f.key, f.mime)) })),
    );
    const ticket = issueTicket({
      ref,
      source: AGENT_LANGUAGE_SOURCES[language],
      role,
      hub: null,
      channel: "agent",
      agentName: agent?.name ?? null,
      files: ticketFiles,
    });

    const body: JobsStartResponse = { ref, ticket, uploads };
    return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    release();
    return unavailable("agent/jobs/start", error);
  }
}
