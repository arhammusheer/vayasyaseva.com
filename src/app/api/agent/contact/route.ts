import { NextRequest, NextResponse } from "next/server";
import { trackServerEvent } from "@/lib/server-events";
import { contactContract, contactSchema } from "@/lib/contact-contract";
import { createContactCaseId, sendInternalContactEmail } from "@/lib/msg91";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { agentInfoSchema } from "@/lib/talent-intake/contract";
import { normaliseIndianMobile } from "@/lib/talent-intake/rules";

export const runtime = "nodejs";

const perIp = createRateLimiter({ windowMs: 10 * 60_000, max: 5 });
const perSender = createRateLimiter({ windowMs: 10 * 60_000, max: 1 });

/**
 * Open route for AI agents: a business enquiry as plain JSON, no Turnstile.
 * Documented in /openapi/v1.json and /llms.txt. The enquiry reaches the shared
 * inbox only, with an AGT- case ID and a note that an agent sent it. No
 * acknowledgement goes to the email address given, so this route can't be
 * used to send mail to someone else.
 */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  // The contact form's fields, plus an optional `agent` naming the sender.
  const { agent: rawAgent, ...fields } = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const parsed = contactSchema.safeParse(body && typeof body === "object" ? fields : body);
  const parsedAgent = agentInfoSchema.safeParse(rawAgent);
  if (!parsed.success || !parsedAgent.success) {
    return NextResponse.json(
      {
        error: contactContract.responses.validationError,
        details: [...(parsed.error?.issues ?? []), ...(parsedAgent.error?.issues.map((i) => ({ ...i, path: ["agent", ...i.path] })) ?? [])],
      },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const agent = parsedAgent.data;

  const ip = clientIp(request) ?? "unknown";
  // Normalised, so "+91 98765 43210" and "9876543210" count as one sender.
  const phone = String(data.phone ?? "");
  const sender = `${String(data.email ?? "").trim().toLowerCase()}:${normaliseIndianMobile(phone) ?? phone.replace(/\D/g, "")}`;
  if (!perIp.take(ip) || !perSender.take(sender)) {
    console.warn("[AGENT CONTACT RATE LIMITED]", { ip });
    return NextResponse.json(
      { error: contactContract.responses.rateLimitError, retryAfterSeconds: 600 },
      { status: 429, headers: { "retry-after": "600" } }
    );
  }

  const caseId = createContactCaseId().replace(/^REQ-/, "AGT-");
  const note = `[Sent by an AI agent${agent ? ` (${agent.name})` : ""} on the person's behalf through /api/agent/contact. Confirm the details with them when you reply.]`;

  try {
    const delivery = await sendInternalContactEmail({ ...data, details: `${note}\n\n${data.details}` }, { caseId });
    console.info("[AGENT CONTACT DELIVERED]", {
      caseId,
      ip,
      agent: agent?.name ?? null,
      messageId: delivery.messageId,
    });
    trackServerEvent("enquiry_received", "/api/agent/contact", { channel: "agent" });
    return NextResponse.json({
      success: true,
      caseId,
      message: contactContract.responses.successMessage,
    });
  } catch (error) {
    perIp.release(ip);
    perSender.release(sender);
    console.error("[AGENT CONTACT FAILED]", {
      caseId,
      ip,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: contactContract.responses.unknownError }, { status: 500 });
  }
}
