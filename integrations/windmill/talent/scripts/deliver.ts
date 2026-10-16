/**
 * f/talent/deliver: every minute, one submission becomes a conversation in
 * Chatwoot's "Jobs, website" inbox: a private note, then every file.
 * Retires with Chatwoot.
 */
import { attachFile, createContact, createConversation, postMessage } from "../lib/chatwoot.ts";
import { withTalentDb } from "../lib/db.ts";
import { downloadObject } from "../lib/r2.ts";
import { runDeliver } from "../lib/run-deliver.ts";

export async function main() {
  return withTalentDb((query) =>
    runDeliver({ query, createContact, createConversation, postMessage, download: downloadObject, attachFile }),
  );
}
