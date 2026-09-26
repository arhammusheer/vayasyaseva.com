/**
 * Deliver · "Files to fetch" (run once, after the note is posted). One item
 * per attachment, in file-number order, for "Download files" and
 * "Chatwoot: attach file". Voice notes are attached too, so staff can listen.
 */
import type { FileToAttach } from "../types.ts";

const KIND: Record<string, string> = { audio: "voice note", image: "photo", document: "document" };

export default async function main(): Promise<N8nItem<FileToAttach>[]> {
  const conversationId = $("Chatwoot: create conversation").first().json.id;
  return $("Claim submission")
    .first()
    .json.attachments.map((a, n) => ({
      json: {
        key: a.key,
        conversationId,
        label: `File ${n + 1}: ${KIND[a.kind] ?? "file"}${a.name ? ` (${a.name})` : ""}`,
      },
    }));
}
