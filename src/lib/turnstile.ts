/**
 * Cloudflare Turnstile for the human forms (contact and jobs). The open agent
 * routes under /api/agent/* do not use it. TURNSTILE_SECRET_KEY comes from
 * Vercel env (pnpm talent:sync-secrets).
 */

/** Public site key; Cloudflare's always-pass test key outside production. */
export const TURNSTILE_SITE_KEY =
  process.env.NODE_ENV === "production" ? "0x4AAAAAAFEAUg5yU699cqnZ" : "1x00000000000000000000AA";

export const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Cloudflare's always-pass test secret, used only in local development. */
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

export class TurnstileNotConfigured extends Error {}

export type TurnstileWidget = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileWidget;
  }
}

export async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY ?? (process.env.NODE_ENV === "development" ? TURNSTILE_TEST_SECRET : undefined);
  if (!secret) throw new TurnstileNotConfigured("TURNSTILE_SECRET_KEY is not set");
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
