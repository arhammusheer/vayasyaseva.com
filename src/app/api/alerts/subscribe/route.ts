import type { NextRequest } from "next/server";
import { runSubmission } from "@/server/submissions/pipeline";
import { alertSubscribeRoute } from "@/server/submissions/types/rate-alert";

export const runtime = "nodejs";

/**
 * The rate alert form on a wage page: an email address and the states to follow.
 * A thin adapter: the work is src/server/submissions (rate_alert.v1).
 */
export function POST(request: NextRequest) {
  return runSubmission(alertSubscribeRoute, request);
}
