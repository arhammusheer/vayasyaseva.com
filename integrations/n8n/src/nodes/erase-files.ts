/**
 * Retention · "Files to delete" (run once). One item per R2 file stored for
 * the claimed person, for "R2: delete file". With no files it returns one
 * item with key null, so the run still reaches the Chatwoot and database
 * steps ("Has file?" sends it past the R2 node).
 */
import type { FileToDelete } from "../types.ts";

export default async function main(): Promise<N8nItem<FileToDelete>[]> {
  const claimed = $("Claim erasure").first().json;
  const keys = [...new Set(claimed.files.filter((key) => typeof key === "string" && key.length > 0))];
  if (!keys.length) return [{ json: { requestId: claimed.id, key: null } }];
  return keys.map((key) => ({ json: { requestId: claimed.id, key } }));
}
