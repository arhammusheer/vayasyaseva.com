/**
 * Deliver · "Compose note" (run once). The private note that opens the
 * Chatwoot conversation: where the submission came from, the person's own
 * message and each voice note's transcript. Files follow as attachments.
 */
import { INTAKE_FORMS, JOB_HUBS, JOB_ROLES, QUICK_ANSWERS, QUICK_QUESTIONS, type QuickQuestion } from "../../../../src/lib/talent-intake/rules.ts";
import type { ComposedNote } from "../types.ts";

const PAGES: Record<string, string> = {
  web_en: "English jobs page (en-IN)",
  web_hi: "हिंदी jobs page (hi-IN)",
  web_hinglish: "Hindi jobs page, Latin script (hi-Latn-IN)",
};
/** An agent's submission has no page; its source only says the language. */
const AGENT_LANGUAGES: Record<string, string> = { web_en: "English", web_hi: "Hindi", web_hinglish: "Hindi, Latin script" };
const KIND: Record<string, string> = { audio: "voice note", image: "photo", document: "document" };

export default async function main(): Promise<N8nItem<ComposedNote>[]> {
  const s = $("Claim submission").first().json;
  const page = s.channel === "agent" ? `AI agent (${AGENT_LANGUAGES[s.source] ?? s.source})` : (PAGES[s.source] ?? s.source);
  const lines = [`**${s.applicantName ? `${s.applicantName} · ` : ""}Job seeker ${s.ref}** · ${page} · ${s.phone}`];
  if (s.form) lines.push(`**Form:** ${INTAKE_FORMS[s.form] ?? s.form}`);
  if (s.channel === "agent") {
    lines.push(
      `**Sent by an AI agent${s.agentName ? ` (${s.agentName})` : ""}** on the person's behalf, not through the form. Confirm the details and their consent when you call.`,
    );
  }
  if (s.role) lines.push(`**Asked about:** ${JOB_ROLES[s.role] ?? s.role}`);
  if (s.hub) lines.push(`**Came from:** ${JOB_HUBS[s.hub] ?? s.hub} (not linked on the site; found through search)`);

  if (s.answers) {
    lines.push("", "**Their answers:**");
    for (const [question, ids] of Object.entries(s.answers) as [QuickQuestion, string[]][]) {
      const labels = QUICK_ANSWERS[question] as Record<string, string> | undefined;
      lines.push(`- ${QUICK_QUESTIONS[question] ?? question}: ${ids.map((id) => labels?.[id] ?? id).join(", ")}`);
    }
  }
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

  return [{ json: { contactName: s.applicantName ?? `Job seeker ${s.ref}`, note: lines.join("\n") } }];
}
