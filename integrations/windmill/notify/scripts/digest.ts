/**
 * f/notify/digest, 08:00 IST: one email with every event whose rule says
 * digest and that has not been in one yet, grouped by source and type
 * (lib/render.ts renderDigest), then deletes events older than 90 days.
 * Fails the job when Resend refuses, so the next run sends the same events.
 */
import { OWNER_PLACEHOLDER, notifyConfig } from "../lib/config.ts";
import { pgNotifyStore, withNotifyDb } from "../lib/db.ts";
import { runDigest } from "../lib/dispatch.ts";
import { resendClient } from "../lib/resend.ts";

export async function main() {
  const [key, from, to] = await Promise.all([notifyConfig("resend_api_key"), notifyConfig("email_from"), notifyConfig("email_to")]);
  if (key === OWNER_PLACEHOLDER) throw new Error("RESEND_NOTIFY_API_KEY is still the placeholder: set it in windmill-notify, then pnpm windmill:deploy");
  return withNotifyDb((sql) => runDigest({ store: pgNotifyStore(sql), resend: resendClient(key, from, to) }));
}
