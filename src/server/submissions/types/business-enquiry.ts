/**
 * business_enquiry.v1 and compliance_help.v1 (one wire contract, told apart
 * by requestType): the website's contact form (/api/contact, Turnstile) and
 * the open agent route (/api/agent/contact).
 *
 * The staff email goes first, as before: it carries the lead flags and is
 * the inbox staff work from. The lead goes to Windmill (Twenty CRM) after
 * the response whether or not that email worked, so a failed email no longer
 * loses the lead. The answer the person sees is unchanged: 500 when the
 * email failed (they are asked to try again or call), and the retry, if it
 * sends the same Idempotency-Key, keeps the same case ID, which Windmill
 * files once.
 */
import { NextResponse } from "next/server";
import { reportServerCount } from "@/lib/measurement/server";
import { contactContract, parseContactRequest, type ContactFormData } from "@/lib/contact-contract";
import { BUSINESS_NOTICE_VERSION, assessCrewRequest } from "@/lib/crew-request";
import { canSendContactAutoReply, createContactCaseId, sendContactAutoReply, sendInternalContactEmail } from "@/lib/msg91";
import { buildLeadPayload } from "@/lib/lead-forward";
import { agentInfoSchema } from "@/lib/talent-intake/contract";
import { normaliseIndianMobile } from "@/lib/talent-intake/rules";
import { jsonBody, type SubmissionContext, type SubmissionRoute } from "../pipeline";
import { duplicateKey, formAbuseReason } from "../policies/abuse";
import { agentContactLimits, contactFormLimits, takeAll } from "../policies/rate-limit";
import { checkTurnstile } from "../policies/turnstile";
import { transport } from "../transport";
import { notifyHub, type WebsiteEvent } from "@/server/notify";

const responses = contactContract.responses;

/**
 * lead.email_failed for the notification hub: the case ID and the route,
 * never the person or the error text (which may quote the enquiry).
 */
export function emailFailedEvent(caseId: string, route: string): WebsiteEvent {
  return {
    type: "lead.email_failed",
    severity: "warning",
    dedupeKey: `lead-email:${caseId}`,
    title: `Enquiry email not sent: ${caseId}`,
    summary: `The staff email for ${caseId} (${route}) failed, so the shared inbox does not have it. The lead still goes to Twenty; the person was asked to try again or call. Check MSG91.`,
    link: { label: "Leads in Twenty", url: "https://crm.vayasyaseva.com/objects/opportunities" },
  };
}

/**
 * Sends the staff email, then hands the lead to the transport after the
 * response, even if the email failed. Rethrows the email's error so the
 * route answers as it always has.
 */
async function emailThenLead(
  email: ContactFormData,
  lead: ReturnType<typeof buildLeadPayload>,
  ctx: SubmissionContext,
  caseId: string,
  route: string,
) {
  let delivery: Awaited<ReturnType<typeof sendInternalContactEmail>> | undefined;
  let emailError: unknown;
  try {
    delivery = await sendInternalContactEmail(email, { caseId });
  } catch (error) {
    emailError = error;
  }
  // Into Twenty CRM too, after the response: never delays the form.
  ctx.defer(() => transport().lead(lead, { idempotencyKey: ctx.idempotencyKey }));
  if (emailError !== undefined) {
    console.error("[CONTACT EMAIL FAILED; LEAD STILL FORWARDED]", {
      caseId,
      error: emailError instanceof Error ? emailError.message : "Unknown error",
    });
    // The shared inbox did not get it: tell the hub (after the response; no-op without NOTIFY_*).
    // A retry with the same case ID that fails again is one notification (the dedupeKey).
    ctx.defer(() => notifyHub(emailFailedEvent(caseId, route)));
    throw emailError;
  }
  return delivery!;
}

// --- /api/contact (the website form) -------------------------------------------

export const contactFormRoute: SubmissionRoute<ContactFormData> = {
  name: "/api/contact",

  async read(request) {
    const body = await jsonBody(request);
    if (!body.ok) return { ok: false, response: NextResponse.json({ error: responses.validationError }, { status: 400 }) };
    const result = parseContactRequest(body.body);
    if (!result.success) {
      return { ok: false, response: NextResponse.json({ error: responses.validationError, details: result.error.issues }, { status: 400 }) };
    }
    return { ok: true, value: result.data };
  },

  // Human form only: AI agents use /api/agent/contact, which has no Turnstile.
  async verify(_data, ctx) {
    const outcome = await checkTurnstile(ctx.request.headers.get("x-turnstile-token")?.trim(), ctx.ip);
    if (outcome === "not_configured") return NextResponse.json({ error: responses.unknownError }, { status: 503 });
    if (outcome === "failed") {
      return NextResponse.json({ error: responses.verificationError, agentRoute: "/api/agent/contact" }, { status: 403 });
    }
    return null;
  },

  async screen(data, ctx) {
    const ip = ctx.ip ?? "unknown";
    const now = Date.now();
    const abuseReason = formAbuseReason(ctx.request.headers, now);
    if (abuseReason) {
      console.warn("[CONTACT SUBMISSION BLOCKED]", { ip, reason: abuseReason });
      return { response: NextResponse.json({ error: responses.rateLimitError }, { status: 429 }) };
    }
    const dup = duplicateKey(ip, data.email ?? "", data.phone ?? "");
    const slots = await takeAll(
      [
        [contactFormLimits.perIp, ip],
        [contactFormLimits.duplicate, dup],
      ],
      { releaseOnRefusal: true, now },
    );
    if (!slots.allowed) {
      console.warn("[CONTACT SUBMISSION BLOCKED]", { duplicateKey: dup, ip, reason: "rate-limit-or-duplicate" });
      return { response: NextResponse.json({ error: responses.rateLimitError }, { status: 429 }) };
    }
    return { release: slots.release };
  },

  async handle(data, ctx) {
    const ip = ctx.ip ?? "unknown";
    const now = Date.now();
    // A retry with the same Idempotency-Key keeps the case ID the failed run issued.
    const caseId = ctx.carry?.caseId ?? createContactCaseId(new Date(now));
    ctx.keep({ caseId });
    const dup = duplicateKey(ip, data.email ?? "", data.phone ?? "");

    // The staff email first, always: it carries the lead flags (qualified,
    // starts soon, out of scope), which never reach the buyer.
    const assessment = assessCrewRequest(data);
    const lead = buildLeadPayload(data, { caseId, channel: "web", receivedAt: new Date(now) });
    const sharedInboxDelivery = await emailThenLead(data, lead, ctx, caseId, "/api/contact");

    console.info("[CONTACT SUBMISSION DELIVERED]", {
      timestamp: new Date().toISOString(),
      caseId,
      deliveryPath: "shared-inbox-intake",
      duplicateKey: dup,
      ip,
      name: data.name,
      company: data.company,
      email: data.email,
      headcountBand: assessment.headcountBand,
      qualified: assessment.qualified,
      // The privacy notice the buyer saw (also in the staff email's flags).
      privacyVersion: BUSINESS_NOTICE_VERSION,
      messageId: sharedInboxDelivery.messageId,
      threadId: sharedInboxDelivery.threadId,
      uniqueId: sharedInboxDelivery.uniqueId,
    });

    // Then the buyer's copy, if they gave an email. The enquiry is already
    // with our team, so a failure here doesn't fail the request.
    if (canSendContactAutoReply(data)) {
      try {
        const acknowledgement = await sendContactAutoReply(data, { caseId });
        console.info("[CONTACT ACKNOWLEDGEMENT SENT]", { caseId, messageId: acknowledgement.messageId });
      } catch (error) {
        console.error("[CONTACT ACKNOWLEDGEMENT FAILED]", { caseId, error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    reportServerCount("enquiry_received", "/api/contact", {
      channel: "web",
      cluster: data.pageCluster ?? "none",
      qualified: assessment.qualified ? "yes" : "no",
      request_type: data.requestType ?? "crew",
    });
    return NextResponse.json({ success: true, caseId, message: responses.successMessage });
  },

  fail(error, ctx) {
    console.error("[CONTACT SUBMISSION FAILED]", {
      caseId: ctx.kept?.caseId ?? ctx.carry?.caseId ?? null,
      ip: ctx.ip ?? "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: responses.unknownError }, { status: 500 });
  },
};

// --- /api/agent/contact (AI agents) ----------------------------------------------

type AgentEnquiry = { data: ContactFormData; agent: { name: string } | undefined };

/**
 * Open route for AI agents: a business enquiry as plain JSON, no Turnstile.
 * Documented in /openapi/v1.json and /llms.txt. The enquiry reaches the shared
 * inbox only, with an AGT- case ID and a note that an agent sent it. No
 * acknowledgement goes to the email address given, so this route can't be
 * used to send mail to someone else.
 */
export const agentContactRoute: SubmissionRoute<AgentEnquiry> = {
  name: "/api/agent/contact",

  async read(request) {
    const body: unknown = await request.json().catch(() => null);
    // The contact form's fields, plus an optional `agent` naming the sender.
    const { agent: rawAgent, ...fields } = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const parsed = parseContactRequest(body && typeof body === "object" ? fields : body);
    const parsedAgent = agentInfoSchema.safeParse(rawAgent);
    if (!parsed.success || !parsedAgent.success) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: responses.validationError,
            details: [
              ...(parsed.success ? [] : parsed.error.issues),
              ...(parsedAgent.error?.issues.map((i) => ({ ...i, path: ["agent", ...i.path] })) ?? []),
            ],
          },
          { status: 400 },
        ),
      };
    }
    const data = parsed.data;
    // Set by the website only; an agent can't claim a page.
    delete data.pageCluster;
    delete data.sourcePath;
    return { ok: true, value: { data, agent: parsedAgent.data } };
  },

  async screen({ data }, ctx) {
    const ip = ctx.ip ?? "unknown";
    // Normalised, so "+91 98765 43210" and "9876543210" count as one sender.
    const phone = String(data.phone ?? "");
    const sender = `${String(data.email ?? "").trim().toLowerCase()}:${normaliseIndianMobile(phone) ?? phone.replace(/\D/g, "")}`;
    const slots = await takeAll([
      [agentContactLimits.perIp, ip],
      [agentContactLimits.perSender, sender],
    ]);
    if (!slots.allowed) {
      console.warn("[AGENT CONTACT RATE LIMITED]", { ip });
      return {
        response: NextResponse.json(
          { error: responses.rateLimitError, retryAfterSeconds: 600 },
          { status: 429, headers: { "retry-after": "600" } },
        ),
      };
    }
    return { release: slots.release };
  },

  async handle({ data, agent }, ctx) {
    const caseId = ctx.carry?.caseId ?? createContactCaseId().replace(/^REQ-/, "AGT-");
    ctx.keep({ caseId });
    const note = `[Sent by an AI agent${agent ? ` (${agent.name})` : ""} on the person's behalf through /api/agent/contact. Confirm the details with them when you reply.]`;
    const lead = buildLeadPayload(data, { caseId, channel: "agent", note });
    const delivery = await emailThenLead({ ...data, details: [note, data.details].filter(Boolean).join("\n\n") }, lead, ctx, caseId, "/api/agent/contact");
    console.info("[AGENT CONTACT DELIVERED]", { caseId, ip: ctx.ip ?? "unknown", agent: agent?.name ?? null, messageId: delivery.messageId });
    reportServerCount("enquiry_received", "/api/agent/contact", {
      channel: "agent",
      cluster: "none",
      qualified: assessCrewRequest(data).qualified ? "yes" : "no",
    });
    return NextResponse.json({ success: true, caseId, message: responses.successMessage });
  },

  fail(error, ctx) {
    console.error("[AGENT CONTACT FAILED]", {
      caseId: ctx.kept?.caseId ?? ctx.carry?.caseId ?? null,
      ip: ctx.ip ?? "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: responses.unknownError }, { status: 500 });
  },
};
