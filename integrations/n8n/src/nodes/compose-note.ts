/**
 * Deliver · "Compose note" (run once). The private note that opens the
 * Chatwoot conversation: where the submission came from, the person's own
 * message and each voice note's transcript. Files follow as attachments.
 */
import { INTAKE_FORMS, JOB_HUBS, JOB_ROLES, QUICK_ANSWERS, QUICK_QUESTIONS, type QuickQuestion } from "../../../../src/lib/talent-intake/rules.ts";
import type { ComposedNote } from "../types.ts";

/** The page's language, by stored locale (BCP 47 on new rows, short code on older ones). */
const PAGES: Record<string, string> = {
  "en-IN": "English jobs page (en-IN)",
  "hi-IN": "हिंदी jobs page (hi-IN)",
  "hi-Latn-IN": "Hindi jobs page, Latin script (hi-Latn-IN)",
  en: "English jobs page (en-IN)",
  hi: "हिंदी jobs page (hi-IN)",
  hinglish: "Hindi jobs page, Latin script (hi-Latn-IN)",
};
/** An agent's submission has no page; its locale only says the language. */
const AGENT_LANGUAGES: Record<string, string> = {
  "en-IN": "English",
  "hi-IN": "Hindi",
  "hi-Latn-IN": "Hindi, Latin script",
  en: "English",
  hi: "Hindi",
  hinglish: "Hindi, Latin script",
};
const KIND: Record<string, string> = { audio: "voice note", image: "photo", document: "document" };

export default async function main(): Promise<N8nItem<ComposedNote>[]> {
  const s = $("Claim submission").first().json;
  const page = s.channel === "agent" ? `AI agent (${AGENT_LANGUAGES[s.locale] ?? s.locale})` : (PAGES[s.locale] ?? s.locale);
  const lines = [`**${s.applicantName ? `${s.applicantName} · ` : ""}Job seeker ${s.ref}** · ${page} · ${s.phone}`];
  if (s.form) lines.push(`**Form:** ${INTAKE_FORMS[s.form] ?? s.form}${s.pagePath ? ` on ${s.pagePath}` : ""}`);
  if (s.cluster) {
    const page = s.pageCluster && s.pageCluster !== s.cluster ? ` (page: ${s.pageCluster})` : "";
    lines.push(`**Cluster:** ${s.cluster}${page}`);
  }
  if (s.channel === "agent") {
    lines.push(
      `**Sent by an AI agent${s.agentName ? ` (${s.agentName})` : ""}** on the person's behalf, not through the form. Confirm the details and their consent when you call.`,
    );
  }
  if (s.role) lines.push(`**Asked about:** ${JOB_ROLES[s.role] ?? s.role}`);
  if (s.hub) lines.push(`**Came from:** ${JOB_HUBS[s.hub] ?? s.hub}`);

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
