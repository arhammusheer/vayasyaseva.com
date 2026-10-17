import type { NextRequest } from "next/server";
import { runSubmission } from "@/server/submissions/pipeline";
import { agentJobsSubmitRoute } from "@/server/submissions/types/job-application";

export const runtime = "nodejs";

/**
 * Open route for AI agents, step 2 of an application with files.
 * A thin adapter: the work is src/server/submissions (agentJobsSubmitRoute).
 */
export function POST(request: NextRequest) {
  return runSubmission(agentJobsSubmitRoute, request);
}
