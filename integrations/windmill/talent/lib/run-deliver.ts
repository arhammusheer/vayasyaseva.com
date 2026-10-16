/**
 * What the deliver script does, step by step, with its outside world injected so the tests can
 * run every path. The order of steps is the n8n workflow's (integrations/n8n/build.mts).
 */
import { composeNote, conversationAttributes, filesToAttach } from "./note.ts";
import { CLAIM_SUBMISSION, MARK_DELIVERED, RECORD_CONVERSATION, RECOVER_STUCK_DELIVERIES } from "./sql.ts";
import type { ClaimedSubmission } from "./types.ts";
import type { Query } from "./db.ts";

// --- deliver --------------------------------------------------------------------

export interface DeliverDeps {
  query: Query;
  createContact: (phone: string, name: string) => Promise<{ id?: number; source_id: string }>;
  createConversation: (sourceId: string, attributes: Record<string, string>) => Promise<{ id: number }>;
  postMessage: (sourceId: string, conversationId: number, content: string) => Promise<void>;
  download: (key: string) => Promise<{ data: Blob }>;
  attachFile: (sourceId: string, conversationId: number, label: string, file: Blob, fileName: string) => Promise<boolean>;
}

export interface DeliverResult {
  ref: string;
  conversationId: number;
  files: number;
  filesAttached: number;
}

/**
 * One submission per run becomes a Chatwoot conversation: the note, then
 * every file. A failure before "delivered" leaves the row "delivering";
 * RECOVER_STUCK_DELIVERIES puts it back after 15 minutes (3 attempts).
 */
export async function runDeliver(deps: DeliverDeps): Promise<DeliverResult | null> {
  await deps.query(RECOVER_STUCK_DELIVERIES);
  const [s] = await deps.query<ClaimedSubmission>(CLAIM_SUBMISSION);
  if (!s?.id) return null;
  const { contactName, note } = composeNote(s);
  const contact = await deps.createContact(s.phone, contactName);
  const conversation = await deps.createConversation(contact.source_id, conversationAttributes(s));
  await deps.query(RECORD_CONVERSATION, [s.id, contact.id ?? null, conversation.id]);
  await deps.postMessage(contact.source_id, conversation.id, note);
  await deps.query(MARK_DELIVERED, [s.id]);
  let filesAttached = 0;
  const files = filesToAttach(s);
  for (const file of files) {
    const { data } = await deps.download(file.key);
    if (await deps.attachFile(contact.source_id, conversation.id, file.label, data, file.key.split("/").pop() || "file")) filesAttached++;
  }
  return { ref: s.ref, conversationId: conversation.id, files: files.length, filesAttached };
}
