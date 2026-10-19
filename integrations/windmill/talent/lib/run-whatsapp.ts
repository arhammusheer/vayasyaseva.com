/**
 * One incoming WhatsApp message on the apply number, step by step: handled
 * once per message id, the chat advanced (whatsapp.ts) and saved only if no
 * other message was handled in between (else read again and retried), the
 * finished application filed by the same intake as the jobs form, then the
 * replies sent through Fast2SMS. Its outside world is injected for the tests.
 */
import { runIntake } from "./run-intake.ts";
import {
  DELETE_WHATSAPP_CHAT,
  FORGET_WHATSAPP_MESSAGE,
  GET_WHATSAPP_CHAT,
  SAVE_WHATSAPP_CHAT,
  SEEN_WHATSAPP_MESSAGE,
  UPDATE_WHATSAPP_CHAT,
} from "./sql.ts";
import { advance, type Chat, type Inbound } from "./whatsapp.ts";
import type { Query } from "./db.ts";

export interface WhatsAppDeps {
  query: Query;
  /** Sends one text reply in the open conversation; never throws. */
  reply: (to: string, text: string) => Promise<{ ok: boolean }>;
  startAcknowledgement: (submissionId: string) => Promise<void>;
  newRef: () => string;
  now?: () => Date;
}

export interface WhatsAppResult {
  duplicate?: true;
  step: Chat["step"] | "deleted" | null;
  ref: string | null;
  filed: boolean;
  replies: number;
  failedReplies: number;
}

/** Two messages handled at once: this many reads before giving up (Fast2SMS then retries the webhook). */
const SAVE_TRIES = 3;

type Row = Omit<Chat, "consentedAt" | "updatedAt"> & { consentedAt: string | Date | null; updatedAt: string | Date };

const chatOf = (row: Row | undefined): Chat | null =>
  row
    ? {
        ...row,
        answers: row.answers ?? {},
        consentedAt: row.consentedAt ? new Date(row.consentedAt).toISOString() : null,
        updatedAt: new Date(row.updatedAt).toISOString(),
        version: Number(row.version),
      }
    : null;

const chatParams = (chat: Chat, readVersion: number) => [
  chat.phone,
  chat.locale,
  chat.step,
  JSON.stringify(chat.answers),
  chat.name,
  chat.notes,
  chat.consentedAt,
  chat.ref,
  readVersion,
];

export async function runWhatsApp(msg: Inbound, deps: WhatsAppDeps): Promise<WhatsAppResult> {
  const [first] = await deps.query(SEEN_WHATSAPP_MESSAGE, [msg.messageId]);
  if (!first) return { duplicate: true, step: null, ref: null, filed: false, replies: 0, failedReplies: 0 };
  try {
    return await handle(msg, deps);
  } catch (err) {
    // Not handled after all: let Fast2SMS's retry of this webhook through.
    await deps.query(FORGET_WHATSAPP_MESSAGE, [msg.messageId]).catch(() => {});
    throw err;
  }
}

async function handle(msg: Inbound, deps: WhatsAppDeps): Promise<WhatsAppResult> {
  const now = deps.now?.() ?? new Date();
  // A reference made in an attempt that then lost the save is reused, so a retry files nothing twice.
  let ref: string | null = null;
  const newRef = () => (ref ??= deps.newRef());
  let filed = false;
  for (let attempt = 0; attempt < SAVE_TRIES; attempt++) {
    const [row] = await deps.query<Row>(GET_WHATSAPP_CHAT, [msg.phone]);
    const saved = chatOf(row);
    const readVersion = saved?.version ?? 0;
    const turn = advance(saved, msg, now, newRef);

    // The application first (SAVE_SUBMISSION ignores a reference it already has), then the chat.
    if (turn.application && !filed) {
      const answer = await runIntake(true, turn.application, { query: deps.query, startAcknowledgement: deps.startAcknowledgement });
      filed = answer.wm_status_code === 202;
      // The person still gets their reference; a refused application is a bug to see in the job log.
      if (!filed) console.error("whatsapp application refused:", turn.application.ref, JSON.stringify(answer.result));
    }

    let stored: unknown[];
    if (!turn.chat) stored = saved ? await deps.query(DELETE_WHATSAPP_CHAT, [msg.phone, readVersion]) : [{}];
    else if (turn.chat === saved) stored = [{}];
    else stored = await deps.query(readVersion === 0 ? SAVE_WHATSAPP_CHAT : UPDATE_WHATSAPP_CHAT, chatParams(turn.chat, readVersion));
    if (!stored.length) continue;

    let failedReplies = 0;
    for (const text of turn.replies) {
      const sent = await deps.reply(msg.phone, text);
      if (!sent.ok) failedReplies++;
    }
    return {
      step: turn.chat ? turn.chat.step : "deleted",
      ref: turn.chat?.ref ?? null,
      filed,
      replies: turn.replies.length,
      failedReplies,
    };
  }
  throw new Error("WhatsApp chat changed while saving; Fast2SMS retries the webhook");
}

// --- Fast2SMS ----------------------------------------------------------------------

export const FAST2SMS_SESSION_URL = "https://www.fast2sms.com/dev/whatsapp-session";
const TIMEOUT_MS = 15_000;

/**
 * A free-form reply in the open conversation (Fast2SMS "Send session
 * message"): POST with the phone number id and the recipient as query
 * parameters. Never throws; the outcome is only logged (a reply is not resent).
 */
export async function sendSessionText(
  phoneNumberId: string,
  to: string,
  text: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status: number }> {
  const url = `${FAST2SMS_SESSION_URL}?phone_number_id=${encodeURIComponent(phoneNumberId)}&to=${encodeURIComponent(to.replace(/\D/g, ""))}`;
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { authorization: apiKey, "content-type": "application/json" },
      body: JSON.stringify({ type: "text", text }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => null)) as { status?: unknown; return?: unknown } | null;
    const ok = res.ok && body?.return !== false && body?.status !== "error" && body?.status !== false;
    if (!ok) console.error("whatsapp reply not accepted:", res.status, typeof body?.status === "string" ? body.status : "");
    return { ok, status: res.status };
  } catch (err) {
    console.error("whatsapp reply failed:", err instanceof Error ? err.name : "unknown error");
    return { ok: false, status: 0 };
  }
}
