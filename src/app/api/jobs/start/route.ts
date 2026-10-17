import type { NextRequest } from "next/server";
import { runSubmission } from "@/server/submissions/pipeline";
import { jobsStartRoute } from "@/server/submissions/types/job-application";

export const runtime = "nodejs";

/**
 * Step 1 of a jobs submission (job_application.v1): Turnstile, the reference, upload URLs and a ticket.
 * A thin adapter: the work is src/server/submissions (jobsStartRoute).
 */
export function POST(request: NextRequest) {
  return runSubmission(jobsStartRoute, request);
}
