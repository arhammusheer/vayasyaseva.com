import type { NextRequest } from "next/server";
import { runSubmission } from "@/server/submissions/pipeline";
import { contactFormRoute } from "@/server/submissions/types/business-enquiry";

export const runtime = "nodejs";

/**
 * The Request a crew and compliance help forms (business_enquiry.v1, compliance_help.v1).
 * A thin adapter: the work is src/server/submissions (contactFormRoute).
 */
export function POST(request: NextRequest) {
  return runSubmission(contactFormRoute, request);
}
