/**
 * Publishing to our ntfy (apps/ntfy in vayasya-infra), from the workers over
 * cluster DNS, as the `windmill` ntfy user with its access token. ntfy's JSON
 * publish: POST / with { topic, title, message, priority, tags, click,
 * actions }. The server relays only a poll request (message id, hashed
 * topic) to ntfy.sh for iOS; the content stays on our server.
 */
import type { NtfyMessage } from "./render.ts";

export type Fetch = typeof fetch;

export interface SendResult {
  ok: boolean;
  /** Worth another try (network, 408, 429, 5xx); any other 4xx is not. */
  retryable: boolean;
  /** Safe to log and store: the status and the service's error text, never the message. */
  error?: string;
}

export const retryableStatus = (status: number) => status === 408 || status === 429 || status >= 500;

export async function responseDetail(res: Response): Promise<string> {
  try {
    return (await res.text()).replace(/\s+/g, " ").slice(0, 200);
  } catch {
    return "";
  }
}

export function ntfyClient(baseUrl: string, token: string, fetchImpl: Fetch = fetch) {
  const base = baseUrl.replace(/\/$/, "");
  return {
    async publish(message: NtfyMessage): Promise<SendResult> {
      try {
        const res = await fetchImpl(`${base}/`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify(message),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) return { ok: true, retryable: false };
        return { ok: false, retryable: retryableStatus(res.status), error: `ntfy HTTP ${res.status} ${await responseDetail(res)}`.trim() };
      } catch (err) {
        return { ok: false, retryable: true, error: `ntfy ${err instanceof Error ? err.name : "error"}` };
      }
    },
  };
}

export type NtfyClient = ReturnType<typeof ntfyClient>;
