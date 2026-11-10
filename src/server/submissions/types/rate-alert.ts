/**
 * rate_alert.v1: minimum wage rate alerts (docs/rate-alerts.md).
 *
 *   /api/alerts/subscribe    the form on a wage page (Turnstile): an email
 *                            address and the states to follow. Windmill saves
 *                            it as pending and sends the confirmation email.
 *   /api/alerts/confirm      the link in that email (/alerts#confirm=<token>)
 *   /api/alerts/unsubscribe  the link in every email (/alerts#stop=<token>),
 *                            and mail clients' one-click unsubscribe (RFC 8058),
 *                            which posts with the token in the query
 *
 * The subscriber list lives in Windmill's lead inbox; the site keeps
 * nothing. The answer to a subscribe never says whether the address was
 * already on the list.
 */
import { NextResponse, type NextRequest } from "next/server";
import { rateAlertSubscribeRequestSchema, rateAlertTokenRequestSchema, type RateAlertSubscribeRequest } from "@vspl/contracts/rate-alert";
import { reportServerCount } from "@/lib/measurement/server";
import { ALERT_NOTICE_VERSION, alertStates, createAlertRef } from "@/lib/rate-alerts";
import { jsonBody, type SubmissionRoute } from "../pipeline";
import { formAbuseReason } from "../policies/abuse";
import { alertLimits, takeAll } from "../policies/rate-limit";
import { checkTurnstile } from "../policies/turnstile";
import { transport } from "../transport";

export const ALERT_RESPONSES = {
  validationError: "Enter a valid email address.",
  verificationError: "We couldn't verify this browser. Please try again.",
  rateLimitError: "Too many requests. Please try again shortly.",
  notSent: "We could not send the confirmation email. Please try again in a few minutes.",
  unknownLink: "This link is no longer valid.",
  unknownError: "Something went wrong. Please try again.",
} as const;

const refuse = (status: number, error: string) => NextResponse.json({ error }, { status });

export const alertSubscribeRoute: SubmissionRoute<RateAlertSubscribeRequest> = {
  name: "/api/alerts/subscribe",

  async read(request) {
    const body = await jsonBody(request);
    const parsed = body.ok ? rateAlertSubscribeRequestSchema.safeParse(body.body) : null;
    if (!parsed?.success) return { ok: false, response: refuse(400, ALERT_RESPONSES.validationError) };
    // Only states with a published wage page; one subscriber per address, whatever its case.
    const known = new Set<string>(alertStates());
    if (!parsed.data.states.every((state) => known.has(state))) return { ok: false, response: refuse(400, ALERT_RESPONSES.validationError) };
    return { ok: true, value: { ...parsed.data, email: parsed.data.email.trim().toLowerCase() } };
  },

  async verify(_data, ctx) {
    const outcome = await checkTurnstile(ctx.request.headers.get("x-turnstile-token")?.trim(), ctx.ip);
    if (outcome === "not_configured") return refuse(503, ALERT_RESPONSES.unknownError);
    return outcome === "failed" ? refuse(403, ALERT_RESPONSES.verificationError) : null;
  },

  async screen(data, ctx) {
    const ip = ctx.ip ?? "unknown";
    const reason = formAbuseReason(ctx.request.headers, Date.now());
    if (reason) {
      console.warn("[RATE ALERT BLOCKED]", { ip, reason });
      return { response: refuse(429, ALERT_RESPONSES.rateLimitError) };
    }
    const slots = await takeAll([
      [alertLimits.perIp, ip],
      [alertLimits.perEmail, data.email],
    ]);
    return slots.allowed ? { release: slots.release } : { response: refuse(429, ALERT_RESPONSES.rateLimitError) };
  },

  async handle(data) {
    const ref = createAlertRef();
    const answer = await transport().alert({
      action: "subscribe",
      ref,
      receivedAt: new Date().toISOString(),
      email: data.email,
      states: data.states,
      sourcePath: data.sourcePath ?? null,
      noticeVersion: ALERT_NOTICE_VERSION,
    });
    reportServerCount("rate_alert", "/api/alerts/subscribe", { action: "subscribe", states: data.states.length, result: answer.status === 202 ? "ok" : "failed" });
    if (answer.status !== 202) {
      console.error("[RATE ALERT NOT SAVED]", { ref, status: answer.status });
      return refuse(502, ALERT_RESPONSES.notSent);
    }
    console.info("[RATE ALERT SUBSCRIBE]", { ref, states: data.states });
    return NextResponse.json({ success: true });
  },

  fail(error) {
    console.error("[RATE ALERT FAILED]", { error: error instanceof Error ? error.message : "Unknown error" });
    return refuse(500, ALERT_RESPONSES.unknownError);
  },
};

/** The token from the JSON body, or from ?t= (a mail client's one-click unsubscribe sends a form body). */
async function readToken(request: NextRequest) {
  const fromQuery = request.nextUrl.searchParams.get("t");
  const body = fromQuery ? { ok: true as const, body: { token: fromQuery } } : await jsonBody(request);
  const parsed = body.ok ? rateAlertTokenRequestSchema.safeParse(body.body) : null;
  return parsed?.success ? { ok: true as const, value: parsed.data.token } : { ok: false as const, response: refuse(400, ALERT_RESPONSES.unknownLink) };
}

function linkRoute(action: "confirm" | "unsubscribe"): SubmissionRoute<string> {
  const name = `/api/alerts/${action}`;
  return {
    name,
    read: readToken,
    async screen(_token, ctx) {
      const slots = await takeAll([[alertLimits.links, ctx.ip ?? "unknown"]]);
      return slots.allowed ? { release: slots.release } : { response: refuse(429, ALERT_RESPONSES.rateLimitError) };
    },
    async handle(token) {
      const ref = createAlertRef();
      const answer = await transport().alert({ action, ref, receivedAt: new Date().toISOString(), token });
      const result = answer.status === 200 ? "ok" : answer.status === 404 ? "unknown_link" : "failed";
      reportServerCount("rate_alert", name, { action, states: answer.states?.length ?? 0, result });
      if (answer.status === 200) return NextResponse.json({ success: true, states: answer.states ?? [] });
      if (answer.status === 404) return refuse(404, ALERT_RESPONSES.unknownLink);
      console.error("[RATE ALERT LINK FAILED]", { ref, action, status: answer.status });
      return refuse(502, ALERT_RESPONSES.unknownError);
    },
    fail(error) {
      console.error("[RATE ALERT FAILED]", { action, error: error instanceof Error ? error.message : "Unknown error" });
      return refuse(500, ALERT_RESPONSES.unknownError);
    },
  };
}

export const alertConfirmRoute = linkRoute("confirm");
export const alertUnsubscribeRoute = linkRoute("unsubscribe");
