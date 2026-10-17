/**
 * Email through Resend (api.resend.com) from the verified
 * notify.vayasyaseva.com domain, with the hub's own API key. Each delivery
 * sends an Idempotency-Key, so a retry after a timeout never mails twice.
 */
import { responseDetail, retryableStatus, type Fetch, type SendResult } from "./ntfy.ts";
import type { EmailMessage } from "./render.ts";

export const RESEND_API = "https://api.resend.com/emails";

export function resendClient(apiKey: string, from: string, to: string, fetchImpl: Fetch = fetch) {
  return {
    async send(email: EmailMessage, idempotencyKey: string): Promise<SendResult> {
      try {
        const res = await fetchImpl(RESEND_API, {
          method: "POST",
          headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": idempotencyKey },
          body: JSON.stringify({ from, to: [to], subject: email.subject, text: email.text }),
          signal: AbortSignal.timeout(20_000),
        });
        if (res.ok) return { ok: true, retryable: false };
        return { ok: false, retryable: retryableStatus(res.status), error: `resend HTTP ${res.status} ${await responseDetail(res)}`.trim() };
      } catch (err) {
        return { ok: false, retryable: true, error: `resend ${err instanceof Error ? err.name : "error"}` };
      }
    },
  };
}

export type ResendClient = ReturnType<typeof resendClient>;
