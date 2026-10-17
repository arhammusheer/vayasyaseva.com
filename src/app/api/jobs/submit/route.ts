import type { NextRequest } from "next/server";
import { runSubmission } from "@/server/submissions/pipeline";
import { jobsSubmitRoute } from "@/server/submissions/types/job-application";

export const runtime = "nodejs";

/**
 * Step 2 of a jobs submission, after every upload: the ticket, the uploads, the contract, then Windmill.
 * A thin adapter: the work is src/server/submissions (jobsSubmitRoute).
 */
export function POST(request: NextRequest) {
  return runSubmission(jobsSubmitRoute, request);
}
