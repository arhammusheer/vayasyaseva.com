import type { NextRequest } from "next/server";
import { runSubmission } from "@/server/submissions/pipeline";
import { alertConfirmRoute } from "@/server/submissions/types/rate-alert";

export const runtime = "nodejs";

/**
 * The link in the confirmation email (/alerts#confirm=<token>).
 * A thin adapter: the work is src/server/submissions (rate_alert.v1).
 */
export function POST(request: NextRequest) {
  return runSubmission(alertConfirmRoute, request);
}
