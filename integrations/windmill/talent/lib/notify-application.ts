/**
 * application.received for the notification hub (docs/notification-hub.md):
 * one push per application, raised by the CRM step once the Twenty person and
 * application exist, so "View in Twenty" opens a record that is there.
 *
 * The title and summary are built from fixed lists only (the role, the area
 * answer, the cluster, the form and the language), never from what the
 * applicant typed, so nothing personal reaches the lock screen or the digest.
 * The name and phone go in `pii`, which the policy shows in the push alone and
 * the hub clears once it is sent.
 */
import type { EmitInput } from "../../notify/lib/emit.ts";
import { JOB_ROLES, QUICK_ANSWERS } from "../../../../packages/contracts/src/rules.ts";
import type { SyncCandidate } from "./crm.ts";

export const TWENTY_APP_URL = "https://crm.vayasyaseva.com";

export const CLUSTER_LABELS: Record<string, string> = {
  haridwar: "Haridwar",
  uttarakhand: "Uttarakhand",
  "delhi-ncr": "Delhi NCR",
  bengaluru: "Bengaluru",
  jalandhar: "Jalandhar",
  saharanpur: "Saharanpur",
  punjab: "Punjab",
  dehradun: "Dehradun",
  other: "other area",
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  "en-IN": "English",
  hi: "Hindi",
  "hi-IN": "Hindi",
  hinglish: "Hinglish",
  "hi-Latn-IN": "Hinglish",
  "pa-IN": "Punjabi",
  "kn-IN": "Kannada",
};

const has = <T extends object>(table: T, key: unknown): key is keyof T => typeof key === "string" && Object.hasOwn(table, key);
const firstAnswer = (c: SyncCandidate, question: string): string | null => {
  const value = c.answers?.[question];
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : null;
};

/** The work asked about: the role page, else the quick form's first work answer. */
export function roleLabel(c: SyncCandidate): string {
  if (has(JOB_ROLES, c.role)) return JOB_ROLES[c.role];
  const work = firstAnswer(c, "work");
  if (has(QUICK_ANSWERS.work, work)) return QUICK_ANSWERS.work[work];
  return "any work";
}

/** The area answer's label (a fixed list), or null. */
export function areaLabel(c: SyncCandidate): string | null {
  const area = firstAnswer(c, "area");
  return has(QUICK_ANSWERS.area, area) ? QUICK_ANSWERS.area[area] : null;
}

export const clusterLabel = (cluster: string | null) => (cluster && has(CLUSTER_LABELS, cluster) ? CLUSTER_LABELS[cluster] : "no area");

function formLabel(c: SyncCandidate): string {
  if (c.channel === "agent") return "AI agent";
  if (c.channel === "whatsapp") return "WhatsApp chat";
  if (c.answers && Object.keys(c.answers).length) return "quick form";
  if (c.source === "web" || c.source.startsWith("web_")) return "website form";
  return c.source;
}

/** The event for one application, once Twenty has its person (personId) and application. */
export function applicationEvent(c: SyncCandidate, personId: string): EmitInput {
  const role = roleLabel(c);
  const cluster = clusterLabel(c.cluster);
  const area = areaLabel(c);
  const language = LANGUAGE_LABELS[c.person_locale ?? c.locale] ?? LANGUAGE_LABELS[c.locale] ?? c.locale;
  const name = (c.applicant_name ?? c.person_name ?? "").trim();
  return {
    source: "talent",
    type: "application.received",
    severity: "info",
    dedupeKey: `application:${c.ref}`,
    title: `New job application: ${role}, ${cluster}`,
    summary: [c.ref, role, area, cluster, formLabel(c), language].filter(Boolean).join(" · "),
    link: { label: "View in Twenty", url: `${TWENTY_APP_URL}/object/person/${encodeURIComponent(personId)}` },
    pii: { ...(name ? { name } : {}), phone: c.phone },
  };
}
