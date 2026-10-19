/**
 * f/talent/whatsapp: the WhatsApp apply chat, through the HTTP route
 * `webhook/fast2sms-whatsapp` (made in the Fast2SMS dashboard as
 * integrations/windmill/fast2sms-whatsapp-webhook.mts describes, with the
 * x-vspl-wa-secret header). Each message moves the chat on
 * (talent/lib/whatsapp.ts); the last answer files the application through
 * the same intake as the jobs form and starts its SMS acknowledgement.
 *
 * Answers 200 to every message it has handled, or chosen to ignore, so
 * Fast2SMS does not retry it; 500 only when the chat could not be saved.
 */
import { randomInt } from "node:crypto";
import * as wmill from "windmill-client";
import { config } from "../lib/config.ts";
import { withTalentDb } from "../lib/db.ts";
import { failed, forbidden, respond } from "../lib/response.ts";
import { runWhatsApp, sendSessionText } from "../lib/run-whatsapp.ts";
import { secretMatches } from "../lib/secret.ts";
import { parseInbound } from "../lib/whatsapp.ts";

export const SECRET_HEADER = "x-vspl-wa-secret";

interface HttpEvent {
  headers?: Record<string, string>;
  body?: unknown;
}

/** The fields of Fast2SMS's inbound template that main reads. */
const KEPT = ["webhook_type", "from", "message_type", "body", "message_id", "phone_number_id"] as const;

export async function preprocessor(event: HttpEvent) {
  const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  const authorized = secretMatches(headers[SECRET_HEADER], await config("fast2sms_whatsapp_secret"));
  const raw = authorized && event.body && typeof event.body === "object" ? (event.body as Record<string, unknown>) : null;
  const body = raw ? Object.fromEntries(KEPT.filter((k) => k in raw).map((k) => [k, raw[k]])) : null;
  return { authorized, body };
}

// As the website's references (src/lib/talent-intake/server.ts): no 0/O, 1/I, read out on the phone.
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function newRef() {
  let s = "";
  for (let i = 0; i < 6; i++) s += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `VS-J-${s}`;
}

export async function main(authorized: boolean, body: unknown) {
  if (!authorized) return forbidden();
  const msg = parseInbound(body);
  // Not a message from an Indian mobile, or not a message at all: nothing to do, and nothing to retry.
  if (!msg) return respond(200, { ok: true, ignored: true });
  const phoneNumberId = String((body as Record<string, unknown>).phone_number_id ?? "");
  if (!/^\d{5,20}$/.test(phoneNumberId)) return respond(400, { ok: false, error: "No phone_number_id" });
  try {
    const apiKey = await config("fast2sms_api_key");
    const result = await withTalentDb((query) =>
      runWhatsApp(msg, {
        query,
        reply: (to, text) => sendSessionText(phoneNumberId, to, text, apiKey),
        startAcknowledgement: async (submissionId) => {
          await wmill.runScriptByPathAsync("f/talent/dispatch", { submission_id: submissionId });
        },
        newRef,
      }),
    );
    return respond(200, { ok: true, ...result });
  } catch (err) {
    console.error("whatsapp failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
    return failed();
  }
}
