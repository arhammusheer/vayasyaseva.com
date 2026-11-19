/**
 * f/talent/whatsapp_inbound: incoming WhatsApp messages on the Business
 * number, through the HTTP route `webhook/fast2sms-whatsapp` (made in the
 * Fast2SMS dashboard as fast2sms-whatsapp-webhook.mts describes). A reply to
 * a crew message is saved (talent/lib/crew-inbound.ts) and f/talent/crew is
 * started to write it to Twenty; anything else is left alone.
 *
 * The secret comes as the x-vspl-wa-secret header, or as ?key= when the
 * dashboard form has no custom headers. The preprocessor keeps only the
 * message's fields, so the secret never reaches the job's arguments.
 * Answers 200 to every message it handled or chose to ignore, so Fast2SMS
 * does not retry it; 500 only when the reply could not be saved.
 */
import * as wmill from "windmill-client";
import { config } from "../lib/config.ts";
import { INBOUND_FIELDS, parseInbound, saveInbound } from "../lib/crew-inbound.ts";
import { withTalentDb } from "../lib/db.ts";
import { failed, forbidden, respond } from "../lib/response.ts";
import { secretMatches } from "../lib/secret.ts";

export const SECRET_HEADER = "x-vspl-wa-secret";
export const SECRET_PARAM = "key";

interface HttpEvent {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
}

export async function preprocessor(event: HttpEvent) {
  const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  const expected = await config("fast2sms_whatsapp_secret");
  const authorized = secretMatches(headers[SECRET_HEADER], expected) || secretMatches(event.query?.[SECRET_PARAM], expected);
  const raw = authorized && event.body && typeof event.body === "object" ? (event.body as Record<string, unknown>) : null;
  const body = raw ? Object.fromEntries(INBOUND_FIELDS.filter((k) => k in raw).map((k) => [k, raw[k]])) : null;
  return { authorized, body };
}

export async function main(authorized: boolean, body: unknown) {
  if (!authorized) return forbidden();
  const msg = parseInbound(body);
  if (!msg) return respond(200, { ok: true, ignored: true });
  try {
    const outcome = await withTalentDb((query) => saveInbound(query, msg));
    if (outcome.saved) {
      // f/talent/crew writes it to Twenty now; if a run holds the lock, the next minute does.
      await wmill.runScriptByPathAsync("f/talent/crew", {}).catch(() => {});
      return respond(200, { ok: true, answer: outcome.answer });
    }
    return respond(200, { ok: true, ignored: true });
  } catch (err) {
    console.error("whatsapp_inbound failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
    return failed();
  }
}
