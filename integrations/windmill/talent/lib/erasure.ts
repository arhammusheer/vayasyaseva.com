/**
 * What one erasure removes from R2, deduplicated: every file stored for the
 * person. Ported from the n8n "Files to delete" node; an empty list here is
 * what its single null item meant there. (Chatwoot contacts were erased too
 * until Chatwoot retired on 24 Oct 2026.)
 */
import type { ClaimedErasure } from "./types.ts";

export function filesToDelete(claimed: Pick<ClaimedErasure, "files">): string[] {
  return [...new Set(claimed.files.filter((key) => typeof key === "string" && key.length > 0))];
}
