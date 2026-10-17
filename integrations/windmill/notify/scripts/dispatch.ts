/**
 * f/notify/dispatch, every minute: routes new events by f/notify/policy,
 * queues reminders and collapsed summaries, and sends the outbox (ntfy
 * pushes, Resend emails) with retries and the email fallback for critical
 * pushes (lib/dispatch.ts). Returns counts only; nothing personal is logged.
 */
import { OWNER_PLACEHOLDER, notifyConfig } from "../lib/config.ts";
import { pgNotifyStore, withNotifyDb } from "../lib/db.ts";
import { runDispatch } from "../lib/dispatch.ts";
import { ntfyClient } from "../lib/ntfy.ts";
import { parsePolicy } from "../lib/policy.ts";
import { resendClient } from "../lib/resend.ts";

export async function readPolicy() {
  let text: string | null = null;
  try {
    text = await notifyConfig("policy");
  } catch {}
  const { policy, problem } = parsePolicy(text);
  if (problem) console.error(`notify: ${problem}; using the default policy`);
  return policy;
}

export async function main() {
  const [ntfyToken, ntfyBase, resendKey, from, to] = await Promise.all([
    notifyConfig("ntfy_token"),
    notifyConfig("ntfy_base_url"),
    notifyConfig("resend_api_key"),
    notifyConfig("email_from"),
    notifyConfig("email_to"),
  ]);
  if (ntfyToken === OWNER_PLACEHOLDER || resendKey === OWNER_PLACEHOLDER) {
    // Events wait in the outbox until the owner sets the real values (docs/notification-hub.md, owner setup).
    throw new Error("NTFY_TOKEN or RESEND_NOTIFY_API_KEY is still the placeholder: set it in windmill-notify, then pnpm windmill:deploy");
  }
  const policy = await readPolicy();
  return withNotifyDb((sql) =>
    runDispatch({ store: pgNotifyStore(sql), policy, ntfy: ntfyClient(ntfyBase, ntfyToken), resend: resendClient(resendKey, from, to) }),
  );
}
