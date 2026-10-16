/**
 * Chatwoot, reached over cluster DNS. Deliver uses the public API of the
 * "Jobs, website" API inbox (authorised by its identifier): it finds an
 * existing contact by phone number and posts as the job seeker. Retention
 * deletes contacts with the "Automation (retention)" user's token.
 *
 * Retries follow the n8n nodes: contact creation and contact deletion
 * retry (3 tries, 5 s apart); creating messages never retries, because
 * Chatwoot can save a message and still answer 500.
 */
import { config } from "./config.ts";

const RETRY_TRIES = 3;
const RETRY_WAIT_MS = 5_000;
const TIMEOUT_MS = 30_000;

export interface PublicContact {
  id?: number;
  source_id: string;
}

async function inboxBase() {
  const [base, identifier] = await Promise.all([config("chatwoot_base_url"), config("chatwoot_inbox_identifier")]);
  return `${base.replace(/\/$/, "")}/public/api/v1/inboxes/${identifier}`;
}

async function retrying<T>(fn: () => Promise<T>, tries = RETRY_TRIES, waitMs = RETRY_WAIT_MS): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (attempt < tries) await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw last;
}

async function json<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) throw new Error(`Chatwoot ${what}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Creates (or finds, by source_id) the job seeker's contact. */
export async function createContact(phone: string, name: string): Promise<PublicContact> {
  const base = await inboxBase();
  return retrying(async () =>
    json<PublicContact>(
      await fetch(`${base}/contacts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source_id: `talent-${phone.replace("+", "")}`, name, phone_number: phone }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }),
      "contact",
    ),
  );
}

export async function createConversation(sourceId: string, customAttributes: Record<string, string>): Promise<{ id: number }> {
  const base = await inboxBase();
  return json(
    await fetch(`${base}/contacts/${sourceId}/conversations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ custom_attributes: customAttributes }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }),
    "create conversation",
  );
}

/** No retry: a failed run is redelivered by RECOVER_STUCK_DELIVERIES. */
export async function postMessage(sourceId: string, conversationId: number, content: string): Promise<void> {
  const base = await inboxBase();
  await json(
    await fetch(`${base}/contacts/${sourceId}/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }),
    "post message",
  );
}

/** No retry, and a failure is reported, not thrown: the n8n node continued on error. */
export async function attachFile(sourceId: string, conversationId: number, label: string, file: Blob, fileName: string): Promise<boolean> {
  const base = await inboxBase();
  const form = new FormData();
  form.append("content", label);
  form.append("attachments[]", file, fileName);
  try {
    const res = await fetch(`${base}/contacts/${sourceId}/conversations/${conversationId}/messages`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Deletes a contact (and with it, its conversations). A contact that is
 * already gone (404) counts as deleted; n8n treated 404 as a failure,
 * which left the erasure retrying a contact staff had removed by hand.
 */
export async function deleteContact(contactId: number): Promise<void> {
  const [base, accountId, token] = await Promise.all([config("chatwoot_base_url"), config("chatwoot_account_id"), config("chatwoot_admin_token")]);
  await retrying(async () => {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/v1/accounts/${accountId}/contacts/${contactId}`, {
      method: "DELETE",
      headers: { api_access_token: token },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok && res.status !== 404) throw new Error(`Chatwoot delete contact ${contactId}: HTTP ${res.status}`);
  });
}
