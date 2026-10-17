import type { NextRequest } from "next/server";
import { runSubmission } from "@/server/submissions/pipeline";
import { agentJobsStartRoute } from "@/server/submissions/types/job-application";

export const runtime = "nodejs";

/**
 * Open route for AI agents, step 1 of an application with files.
 * A thin adapter: the work is src/server/submissions (agentJobsStartRoute).
 */
export function POST(request: NextRequest) {
  return runSubmission(agentJobsStartRoute, request);
}
