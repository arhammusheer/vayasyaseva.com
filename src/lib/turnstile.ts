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
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileWidget;
  }
}

/** Cloudflare answers siteverify in well under a second; a hung call must not hold the route. */
const SITEVERIFY_TIMEOUT_MS = 5_000;

/** What the token must have been issued for: the widget's action, and the page's host. */
export interface TurnstileExpectation {
  /** The action the widget was rendered with (useTurnstile). */
  action: string;
  /** The host the form was on: this site's own, as the request reached it. Its port is ignored. */
  hostname: string | null;
}

const bareHost = (host: string) => host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");

/**
 * True when Cloudflare says the token is valid and it was solved on this
 * host for this form's action, so a token from another page or another form
 * (or another site using the key) does not pass. With the always-pass test
 * secret (local development) the host and action are not checked, as
 * Cloudflare's test answers carry neither. A timeout or an unreadable answer
 * throws, for the route to handle as any other error from Cloudflare.
 */
export async function verifyTurnstile(token: string, ip: string | null, expected: TurnstileExpectation): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY ?? (process.env.NODE_ENV === "development" ? TURNSTILE_TEST_SECRET : undefined);
  if (!secret) throw new TurnstileNotConfigured("TURNSTILE_SECRET_KEY is not set");
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean; hostname?: string; action?: string };
  if (data.success !== true) return false;
  if (secret === TURNSTILE_TEST_SECRET) return true;
  if (data.action !== expected.action) return false;
  return Boolean(expected.hostname && data.hostname && bareHost(data.hostname) === bareHost(expected.hostname));
}
