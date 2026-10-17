import type { NextRequest } from "next/server";
import { runSubmission } from "@/server/submissions/pipeline";
import { agentJobsRoute } from "@/server/submissions/types/job-application";

export const runtime = "nodejs";

/**
 * Open route for AI agents: a text-only job application in one request, no Turnstile.
 * A thin adapter: the work is src/server/submissions (agentJobsRoute).
 */
export function POST(request: NextRequest) {
  return runSubmission(agentJobsRoute, request);
}
