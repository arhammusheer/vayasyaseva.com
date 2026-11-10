import type { NextRequest } from "next/server";
import { runSubmission } from "@/server/submissions/pipeline";
import { alertUnsubscribeRoute } from "@/server/submissions/types/rate-alert";

export const runtime = "nodejs";

/**
 * The link in every alert email (/alerts#stop=<token>), and mail clients' one-click unsubscribe.
 * A thin adapter: the work is src/server/submissions (rate_alert.v1).
 */
export function POST(request: NextRequest) {
  return runSubmission(alertUnsubscribeRoute, request);
}
