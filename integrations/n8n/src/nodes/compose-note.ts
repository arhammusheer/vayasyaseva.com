/**
 * Deliver · "Compose note" (run once). The private note that opens the
 * Chatwoot conversation: where the submission came from, the person's own
 * message and each voice note's transcript. Files follow as attachments.
 */
import { JOB_ROLES } from "../../../../src/lib/talent-intake/rules.ts";
import type { ComposedNote } from "../types.ts";

const PAGES: Record<string, string> = {
  web_en: "English jobs page",
  web_hi: "Hindi jobs page",
  web_hinglish: "Hinglish jobs page",
};
const KIND: Record<string, string> = { audio: "voice note", image: "photo", document: "document" };

export default async function main(): Promise<N8nItem<ComposedNote>[]> {
  const s = $("Claim submission").first().json;
  const page = PAGES[s.source] ?? s.source;
  const lines = [`**Job seeker ${s.ref}** · ${page} · ${s.phone}`];
  if (s.role) lines.push(`**Asked about:** ${JOB_ROLES[s.role] ?? s.role}`);

  if (s.text) lines.push("", "**Their message:**", s.text);

  for (const [n, a] of s.attachments.entries()) {
    if (a.kind !== "audio") continue;
    const transcript =
      a.transcriptStatus === "done" && a.transcript
        ? a.transcript
        : "_Could not be transcribed. Listen to the attachment._";
    lines.push("", `**Voice note (file ${n + 1}), automatic transcript:**`, transcript);
  }

  if (s.attachments.length) {
    lines.push(
      "",
      `**Files (${s.attachments.length}):** ${s.attachments
        .map((a, n) => `${n + 1}. ${KIND[a.kind] ?? "file"}${a.name ? ` (${a.name})` : ""}`)
        .join(" · ")}`,
    );
  }

  return [{ json: { contactName: `Job seeker ${s.ref}`, note: lines.join("\n") } }];
}
