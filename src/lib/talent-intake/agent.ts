/**
 * Limits for the open agent routes under /api/agent/jobs. They have no
 * Turnstile, so these keep one source from flooding the intake.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createRateLimiter, clientIp } from "@/lib/rate-limit";
import { normaliseIndianMobile } from "./rules";

const perIp = createRateLimiter({ windowMs: 10 * 60_000, max: 10 });
const perPhone = createRateLimiter({ windowMs: 60 * 60_000, max: 3 });

export const AGENT_RATE_LIMITED = { error: "rate_limited", retryAfterSeconds: 600 };

/** Null when the request may go ahead, else the 429 to send. */
export function limitAgentRequest(request: NextRequest, phone?: string) {
  const ip = clientIp(request) ?? "unknown";
  const phoneKey = phone ? normaliseIndianMobile(phone) : null;
  if (!perIp.take(ip) || (phoneKey && !perPhone.take(phoneKey))) {
    console.warn("[AGENT JOBS RATE LIMITED]", { ip });
    return NextResponse.json(AGENT_RATE_LIMITED, { status: 429, headers: { "retry-after": "600" } });
  }
  return null;
}
