/**
 * Cloudflare Turnstile for the human forms (the contact form, the jobs form
 * and the rate alert sign-up). The open agent routes under /api/agent/*
 * never ask for it.
 */
import type { NextRequest } from "next/server";
import { TurnstileNotConfigured, verifyTurnstile } from "@/lib/turnstile";

export type TurnstileOutcome = "passed" | "failed" | "not_configured";

/**
 * The host the request reached, from the Host header (as src/proxy.ts reads
 * it): the page that holds the form is on the same host, since the forms
 * post to their own origin.
 */
const requestHost = (request: NextRequest) => request.headers.get("host") ?? request.nextUrl.host;

/**
 * "not_configured" when TURNSTILE_SECRET_KEY is missing (the routes answer
 * 503); any other error from Cloudflare, a timeout included, is thrown for
 * the route to handle as it always has. `action` is the one the form's
 * widget was rendered with (useTurnstile).
 */
export async function checkTurnstile(
  token: string | null | undefined,
  ip: string | null,
  { action, request }: { action: string; request: NextRequest },
): Promise<TurnstileOutcome> {
  try {
    return token && (await verifyTurnstile(token, ip, { action, hostname: requestHost(request) })) ? "passed" : "failed";
  } catch (error) {
    if (error instanceof TurnstileNotConfigured) {
      console.error("[TURNSTILE NOT CONFIGURED]", error.message);
      return "not_configured";
    }
    throw error;
  }
}
