/**
 * job_application.v1: the jobs form (/api/jobs/start, /api/jobs/submit,
 * Turnstile on start) and the open agent routes (/api/agent/jobs, /start,
 * /submit; no Turnstile, rate limited). The shared tail, validating the
 * canonical payload and handing it to the transport, is
 * src/lib/talent-intake/submit.ts.
 *
 * With an Idempotency-Key, a start that is retried keeps its reference (and
 * ticket), and /api/agent/jobs no longer files a second application when an
 * agent retries after a lost answer.
 */
import { NextResponse } from "next/server";
import {
  agentJobsRequestSchema,
  agentJobsStartRequestSchema,
  agentJobsSubmitRequestSchema,
  jobsStartRequestSchema,
  jobsSubmitRequestSchema,
  type JobsStartResponse,
  type JobsSubmitResponse,
} from "@/lib/talent-intake/contract";
import { AGENT_LANGUAGE_SOURCES, normaliseIndianMobile, type JobRole } from "@/lib/talent-intake/rules";
import { attachmentKey, issueTicket, newRef, presignUpload, type Ticket } from "@/lib/talent-intake/server";
import { forwardSubmission, submitWithTicket, unavailable } from "@/lib/talent-intake/submit";
import { adClickToReport, reportAdClickConversion } from "@/lib/measurement/server";
import type { SubmissionContext, SubmissionRoute } from "../pipeline";
import { agentJobsLimits, takeAll, type RateLimiter } from "../policies/rate-limit";
import { checkTurnstile } from "../policies/turnstile";
import type { z } from "zod/v4";

/** The body as JSON, or null (each schema then refuses it). */
const body = (request: Request) => request.json().catch(() => null);

/** The agent routes' 400: every issue with its path and message. */
function agentInvalid(error: z.ZodError) {
  return NextResponse.json(
    { error: "invalid_request", fields: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
    { status: 400 },
  );
}

export const AGENT_RATE_LIMITED = { error: "rate_limited", retryAfterSeconds: 600 };

/** One slot for the caller's IP and, when given, the phone number. */
async function agentLimits(ctx: SubmissionContext, phone?: string) {
  const ip = ctx.ip ?? "unknown";
  const phoneKey = phone ? normaliseIndianMobile(phone) : null;
  const wanted: [RateLimiter, string][] = [[agentJobsLimits.perIp, ip]];
  if (phoneKey) wanted.push([agentJobsLimits.perPhone, phoneKey]);
  const slots = await takeAll(wanted);
  if (!slots.allowed) {
    console.warn("[AGENT JOBS RATE LIMITED]", { ip });
    return { response: NextResponse.json(AGENT_RATE_LIMITED, { status: 429, headers: { "retry-after": "600" } }) };
  }
  return { release: slots.release };
}

/** A new reference, or the one a failed run with the same Idempotency-Key issued. */
function reference(ctx: SubmissionContext) {
  const ref = ctx.carry?.ref ?? newRef();
  ctx.keep({ ref });
  return ref;
}

/** Issues the reference, one upload URL per declared file and the signed ticket. */
async function start(ctx: SubmissionContext, draft: Omit<Ticket, "exp" | "files" | "ref">, files: { kind: Ticket["files"][number]["kind"]; mime: string; size: number; name: string | null }[]) {
  const ref = reference(ctx);
  const now = new Date();
  const ticketFiles = files.map((f, position) => ({ ...f, key: attachmentKey(ref, position, f.mime, now) }));
  const uploads = await Promise.all(ticketFiles.map(async (f) => ({ key: f.key, ...(await presignUpload(f.key, f.mime)) })));
  const response: JobsStartResponse = { ref, ticket: issueTicket({ ...draft, ref, files: ticketFiles }), uploads };
  return NextResponse.json(response, { headers: { "cache-control": "no-store" } });
}

const meta = (ctx: SubmissionContext) => ({ idempotencyKey: ctx.idempotencyKey });

// --- The jobs form --------------------------------------------------------------

type JobsStart = z.output<typeof jobsStartRequestSchema>;

/**
 * Step 1 of a jobs submission: checks Turnstile, issues the reference, and
 * returns one short-lived upload URL per declared file plus a signed ticket.
 * AI agents use /api/agent/jobs instead, which needs no Turnstile.
 */
export const jobsStartRoute: SubmissionRoute<JobsStart> = {
  name: "/api/jobs/start",
  async read(request) {
    const parsed = jobsStartRequestSchema.safeParse(await body(request));
    return parsed.success ? { ok: true, value: parsed.data } : { ok: false, response: NextResponse.json({ error: "invalid_request" }, { status: 400 }) };
  },
  // A retry brings a fresh Turnstile token; it is the same request.
  fingerprint: (value) => ({ ...value, turnstileToken: undefined }),
  async verify(value, ctx) {
    const outcome = await checkTurnstile(value.turnstileToken, ctx.ip);
    if (outcome === "not_configured") return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if (outcome === "failed") return NextResponse.json({ error: "verification_failed", agentRoute: "/api/agent/jobs" }, { status: 403 });
    return null;
  },
  handle: ({ source, locale, pageCluster, pagePath, role, hub, files }, ctx) => start(ctx, { source, locale, pageCluster, pagePath, role, hub }, files),
  fail: (error) => unavailable("jobs/start", error),
};

type JobsSubmit = z.output<typeof jobsSubmitRequestSchema>;

/**
 * Step 2 of a jobs submission, after the browser has uploaded every file:
 * checks the ticket from /api/jobs/start, confirms each upload exists and
 * matches what was declared, validates the whole payload against the
 * contract and forwards it.
 */
export const jobsSubmitRoute: SubmissionRoute<JobsSubmit> = {
  name: "/api/jobs/submit",
  async read(request) {
    const parsed = jobsSubmitRequestSchema.safeParse(await body(request));
    return parsed.success
      ? { ok: true, value: parsed.data }
      : { ok: false, response: NextResponse.json({ error: "invalid_request", fields: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 }) };
  },
  async handle(value, ctx) {
    const { ticket, phone, text, form, name, answers } = value;
    const click = adClickToReport(value);
    const response = await submitWithTicket(ticket, phone, text, "web", { form, applicantName: name, answers }, meta(ctx));
    // From an ad: tell Google Ads which click led to this application.
    if (response.ok && click) {
      const { ref } = (await response.clone().json()) as JobsSubmitResponse;
      reportAdClickConversion(click, ref);
    }
    return response;
  },
  fail: (error) => unavailable("jobs/submit", error),
};

// --- The open agent routes ------------------------------------------------------

type AgentJobs = z.output<typeof agentJobsRequestSchema>;

/**
 * Open route for AI agents: a text-only job application in one request, no
 * Turnstile. Documented in /openapi/v1.json and /llms.txt. Files go through
 * /api/agent/jobs/start and /api/agent/jobs/submit instead.
 */
export const agentJobsRoute: SubmissionRoute<AgentJobs> = {
  name: "/api/agent/jobs",
  async read(request) {
    const parsed = agentJobsRequestSchema.safeParse(await body(request));
    return parsed.success ? { ok: true, value: parsed.data } : { ok: false, response: agentInvalid(parsed.error) };
  },
  screen: (value, ctx) => agentLimits(ctx, value.phone),
  handle: ({ language, role, agent, phone, text }, ctx) =>
    forwardSubmission(
      {
        ref: reference(ctx),
        source: AGENT_LANGUAGE_SOURCES[language],
        role: role as JobRole | null,
        hub: null,
        channel: "agent",
        agentName: agent?.name ?? null,
        files: [],
      },
      phone,
      text,
      {},
      meta(ctx),
    ),
  fail: (error) => unavailable("agent/jobs", error),
};

type AgentJobsStart = z.output<typeof agentJobsStartRequestSchema>;

/**
 * Open route for AI agents, step 1 of an application with files: the same as
 * /api/jobs/start without Turnstile. Returns the reference, one presigned PUT
 * URL per declared file and a ticket for /api/agent/jobs/submit.
 */
export const agentJobsStartRoute: SubmissionRoute<AgentJobsStart> = {
  name: "/api/agent/jobs/start",
  async read(request) {
    const parsed = agentJobsStartRequestSchema.safeParse(await body(request));
    return parsed.success ? { ok: true, value: parsed.data } : { ok: false, response: agentInvalid(parsed.error) };
  },
  screen: (_value, ctx) => agentLimits(ctx),
  handle: ({ language, role, agent, files }, ctx) =>
    start(ctx, { source: AGENT_LANGUAGE_SOURCES[language], role: role as JobRole | null, hub: null, channel: "agent", agentName: agent?.name ?? null }, files),
  fail: (error) => unavailable("agent/jobs/start", error),
};

type AgentJobsSubmit = z.output<typeof agentJobsSubmitRequestSchema>;

/**
 * Open route for AI agents, step 2 of an application with files, after every
 * upload to the URLs from /api/agent/jobs/start has finished.
 */
export const agentJobsSubmitRoute: SubmissionRoute<AgentJobsSubmit> = {
  name: "/api/agent/jobs/submit",
  async read(request) {
    const parsed = agentJobsSubmitRequestSchema.safeParse(await body(request));
    return parsed.success ? { ok: true, value: parsed.data } : { ok: false, response: agentInvalid(parsed.error) };
  },
  screen: (value, ctx) => agentLimits(ctx, value.phone),
  handle: ({ ticket, phone, text }, ctx) => submitWithTicket(ticket, phone, text, "agent", {}, meta(ctx)),
  fail: (error) => unavailable("agent/jobs/submit", error),
};
