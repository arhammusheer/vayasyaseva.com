import type { NextRequest } from "next/server";
import { runSubmission } from "@/server/submissions/pipeline";
import { agentContactRoute } from "@/server/submissions/types/business-enquiry";

export const runtime = "nodejs";

/**
 * Open route for AI agents: a business enquiry as plain JSON, no Turnstile.
 * A thin adapter: the work is src/server/submissions (agentContactRoute).
 */
export function POST(request: NextRequest) {
  return runSubmission(agentContactRoute, request);
}
