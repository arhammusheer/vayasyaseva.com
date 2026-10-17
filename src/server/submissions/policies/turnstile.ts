/**
 * Cloudflare Turnstile for the human forms (the contact form and the jobs
 * form). The open agent routes under /api/agent/* never ask for it.
 */
import { TurnstileNotConfigured, verifyTurnstile } from "@/lib/turnstile";

export type TurnstileOutcome = "passed" | "failed" | "not_configured";

/**
 * "not_configured" when TURNSTILE_SECRET_KEY is missing (the routes answer
 * 503); any other error from Cloudflare is thrown for the route to handle as
 * it always has.
 */
export async function checkTurnstile(token: string | null | undefined, ip: string | null): Promise<TurnstileOutcome> {
  try {
    return token && (await verifyTurnstile(token, ip)) ? "passed" : "failed";
  } catch (error) {
    if (error instanceof TurnstileNotConfigured) {
      console.error("[TURNSTILE NOT CONFIGURED]", error.message);
      return "not_configured";
    }
    throw error;
  }
}
