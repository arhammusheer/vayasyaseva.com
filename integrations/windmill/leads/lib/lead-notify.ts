/**
 * The lead inbox's notifications (docs/notification-hub.md):
 *
 *   lead.received        once the crew request (opportunity) is in Twenty: an
 *                        instant push with the contact's name and company and
 *                        a masked phone; a qualified lead is `notice`, which
 *                        the policy pushes at a higher priority
 *   lead.forward_failed  when a lead hits its attempt cap (dead): it is in the
 *                        inbox but not in Twenty
 *
 * Titles and summaries come from fixed lists (the service ids, the headcount
 * band, the cluster) and the case ID. The site, which the person typed, and
 * the enquiry text never go in; name, company and phone go in `pii` only.
 */
import type { EmitInput } from "../../notify/lib/emit.ts";
import { TWENTY_APP_URL, clusterLabel } from "../../talent/lib/notify-application.ts";
import type { Lead } from "./lead.ts";

export const WINDMILL_APP_URL = "https://windmill.vayasyaseva.com";

/**
 * Qualified (20+ workers for three months or more, src/lib/crew-request.ts):
 * the site writes it in the enquiry's Flags line, above the person's own
 * text (which follows a blank line and is not read here).
 */
export function isQualified(lead: Pick<Lead, "enquiry">): boolean {
  const header = lead.enquiry.split(/\n\s*\n/)[0] ?? "";
  return /^Flags: (?:.*; )?qualified\b/m.test(header);
}

const SERVICE_WORDS: Record<string, string> = {
  "loading-unloading": "loaders",
  warehouse: "warehouse staff",
  forklift: "forklift operators",
  housekeeping: "housekeeping",
  gardening: "gardeners",
  "factory-helpers": "factory helpers",
  packing: "packers",
  "machine-operators": "machine operators",
  "iti-trades": "ITI trades",
  maintenance: "maintenance staff",
  "fabrication-civil": "fabrication and civil",
  "data-entry": "data entry",
};

/** "50-99 packers, Haridwar": the size, the first service, the cluster. */
export function crewSummary(lead: Lead): string {
  if (lead.requestType === "compliance-help") return `compliance help${lead.cluster ? `, ${clusterLabel(lead.cluster)}` : ""}`;
  const size = /^[\d+\s-]{1,12}$/.test(lead.headcountBand ?? "") ? lead.headcountBand : /^\d{1,5}$/.test(lead.headcount?.trim() ?? "") ? lead.headcount!.trim() : null;
  const first = lead.services[0];
  const what = first ? (SERVICE_WORDS[first] ?? "workers") + (lead.services.length > 1 ? ` +${lead.services.length - 1}` : "") : "workers";
  const kind = lead.requestType === "site-assessment" ? "site assessment: " : "";
  return `${kind}${size ? `${size} ` : ""}${what}${lead.cluster ? `, ${clusterLabel(lead.cluster)}` : ""}`;
}

const requestWord = (lead: Lead) => (lead.requestType === "compliance-help" ? "compliance help request" : "crew request");

export function leadReceivedEvent(lead: Lead, opportunityId: string): EmitInput {
  const qualified = isQualified(lead);
  const from = lead.channel === "agent" ? "AI agent" : (lead.sourcePath ?? "/contact");
  return {
    source: "leads",
    type: "lead.received",
    severity: qualified ? "notice" : "info",
    dedupeKey: `lead:${lead.caseId}`,
    title: `New ${requestWord(lead)}${qualified ? " (qualified)" : ""}: ${crewSummary(lead)}`,
    summary: `${lead.caseId} · from ${from}`,
    link: { label: "View in Twenty", url: `${TWENTY_APP_URL}/object/opportunity/${encodeURIComponent(opportunityId)}` },
    pii: { name: lead.name, ...(lead.company ? { company: lead.company } : {}), phone: lead.phone },
  };
}

/** The error's kind only (HTTP status), never its text, which may echo the lead. */
const errorKind = (error: string | null) => error?.match(/HTTP \d{3}/)?.[0] ?? (error ? "an error" : "no answer");

export function leadForwardFailedEvent(caseId: string, attempts: number, error: string | null): EmitInput {
  return {
    source: "leads",
    type: "lead.forward_failed",
    severity: "warning",
    dedupeKey: `lead-dead:${caseId}`,
    title: `Lead not filed in Twenty: ${caseId}`,
    summary: `${caseId} stopped after ${attempts} attempts (last: ${errorKind(error)}). It is safe in the lead inbox; fix the cause, then reset its delivery (OPERATIONS.md, lead inbox).`,
    link: { label: "Windmill runs", url: `${WINDMILL_APP_URL}/runs/f/leads/sync_crm?workspace=vspl` },
  };
}
