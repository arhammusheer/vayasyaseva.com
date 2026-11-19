/**
 * Incoming WhatsApp messages on the Business number (Fast2SMS's WhatsApp
 * webhook, Standard format, event "Incoming Messages"; fast2sms-whatsapp-webhook.mts
 * sets it up), read as replies to crew messages. Only a message from a
 * worker who was sent a crew message in the last 7 days is kept; anything
 * else is left to the team in the WhatsApp Business app, where every
 * message shows anyway (co-existence).
 *
 * The route saves the reply and answers at once; f/talent/crew writes it to
 * Twenty (run-crew.ts).
 */
import { createHash } from "node:crypto";
import { normaliseIndianMobile } from "../../../../packages/contracts/src/rules.ts";
import { interpretReply, type Answer } from "./crew.ts";
import { OPEN_CREW_MESSAGE, SAVE_CREW_REPLY } from "./crew-sql.ts";
import { WA_PHONE_NUMBER_ID } from "./whatsapp-ack.ts";
import type { Query } from "./db.ts";

/** The fields of Fast2SMS's Standard payload the route keeps (the preprocessor drops the rest). */
export const INBOUND_FIELDS = ["webhook_type", "from", "message_type", "body", "caption", "request_id", "context_message_id", "phone_number_id"] as const;

export interface Inbound {
  key: string;
  phone: string;
  type: string;
  text: string;
}

const MAX_TEXT = 1000;

/**
 * The webhook body as a message, or null when it is not an incoming message
 * from an Indian mobile on our number. An unfilled placeholder (a field
 * Fast2SMS had no value for) counts as empty.
 */
export function parseInbound(body: unknown): Inbound | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  const str = (k: string) => {
    const v = b[k];
    const s = typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
    return s.includes("{{") ? "" : s.trim();
  };
  const type = str("webhook_type");
  if (type && type !== "incoming_message") return null;
  const numberId = str("phone_number_id");
  if (numberId && numberId !== WA_PHONE_NUMBER_ID) return null;
  const phone = normaliseIndianMobile(str("from"));
  if (!phone) return null;
  const messageType = (str("message_type") || "text").toLowerCase().slice(0, 40);
  const text = (str("body") || str("caption")).slice(0, MAX_TEXT);
  if (!type && !text) return null;
  // Fast2SMS's id for the message when it sends one, else the message itself (a retry is the same message).
  const id = str("request_id");
  const key = id && id.length <= 200 ? `f2s:${id}` : `sha256:${createHash("sha256").update([phone, messageType, text, str("context_message_id")].join("\u0000")).digest("hex")}`;
  return { key, phone, type: messageType, text };
}

export type InboundOutcome =
  | { saved: true; answer: Answer; kind: string }
  | { saved: false; reason: "no open crew message" | "already saved" };

/** Saves the reply against the worker's latest crew message, once per key. */
export async function saveInbound(query: Query, msg: Inbound): Promise<InboundOutcome> {
  const [open] = await query<{ id: string; kind: string }>(OPEN_CREW_MESSAGE, [msg.phone]);
  if (!open) return { saved: false, reason: "no open crew message" };
  const answer = msg.type === "text" || msg.type === "button" || msg.type === "interactive" ? interpretReply(msg.text) : "other";
  const [saved] = await query(SAVE_CREW_REPLY, [msg.key, msg.phone, open.id, answer, msg.type, msg.text || null]);
  return saved ? { saved: true, answer, kind: open.kind } : { saved: false, reason: "already saved" };
}
