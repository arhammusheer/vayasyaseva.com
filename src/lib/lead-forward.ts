/**
 * Business enquiries into Twenty CRM (crm.vayasyaseva.com). After /api/contact
 * or /api/agent/contact has validated and emailed an enquiry, the route
 * hands it here, in next/server's after(): the lead is posted to Windmill's
 * `webhook/vspl-lead` route (integrations/windmill, f/leads/intake), which
 * files the company, the contact, the crew request and the enquiry.
 *
 * The email to the shared inbox stays the primary path: a failure here is
 * logged and never reaches the person filling in the form.
 */
import type { ContactFormData } from "@/lib/contact-contract";
import { assessCrewRequest, requirementLines, siteLine } from "@/lib/crew-request";
import { SITE_STATE_CLUSTERS } from "@/lib/intent/model";

const DEFAULT_URL = "https://hooks.vayasyaseva.com/api/r/webhook/vspl-lead";
const TIMEOUT_MS = 8_000;

/** What f/leads/intake accepts (integrations/windmill/leads/lib/lead.ts). */
export interface LeadPayload {
  caseId: string;
  receivedAt: string;
  channel: "web" | "agent";
  name: string;
  company: string | null;
  jobTitle: string | null;
  phone: string;
  email: string | null;
  services: string[];
  headcount: string | null;
  headcountBand: string | null;
  site: string | null;
  cluster: string | null;
  startWindow: string | null;
  targetStartDate: string | null;
  requestType: string | null;
  enquiry: string;
  sourcePath: string | null;
}

export function buildLeadPayload(
  data: ContactFormData,
  options: { caseId: string; channel: "web" | "agent"; receivedAt?: Date; note?: string },
): LeadPayload {
  const assessment = assessCrewRequest(data);
  // The site's state names the cluster where the work is; else the page the form was on.
  const cluster = (data.siteState && SITE_STATE_CLUSTERS[data.siteState]) || data.pageCluster || null;
  const flags = [
    assessment.qualified ? "qualified (20+ workers, a month or more)" : null,
    assessment.soon ? "starts soon" : null,
    assessment.outOfScope.length ? `check scope: ${assessment.outOfScope.join(", ")}` : null,
  ].filter(Boolean);
  const enquiry = [
    `Case ${options.caseId}`,
    ...requirementLines(data),
    data.role ? `Contact's role: ${data.role}` : null,
    data.sourcePath ? `Sent from: ${data.sourcePath}` : null,
    flags.length ? `Flags: ${flags.join("; ")}` : null,
    options.note ?? null,
    data.details ? `\n${data.details}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  return {
    caseId: options.caseId,
    receivedAt: (options.receivedAt ?? new Date()).toISOString(),
    channel: options.channel,
    name: data.name,
    company: data.company ?? null,
    jobTitle: data.role ?? null,
    phone: data.phone,
    email: data.email ?? null,
    services: data.roles ?? [],
    headcount: data.headcount ?? null,
    headcountBand: assessment.headcountBand ?? null,
    site: siteLine(data) ?? null,
    cluster,
    startWindow: data.startWindow ?? null,
    targetStartDate: data.targetStartDate ?? null,
    requestType: data.requestType ?? null,
    enquiry,
    sourcePath: data.sourcePath ?? null,
  };
}

/** Posts the lead; true once Windmill answers 202. Never throws. */
export async function forwardLead(payload: LeadPayload, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const secret = process.env.LEAD_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.warn("[LEAD FORWARD SKIPPED] LEAD_WEBHOOK_SECRET is not set", { caseId: payload.caseId });
    return false;
  }
  const url = process.env.LEAD_WEBHOOK_URL?.trim() || DEFAULT_URL;
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-vspl-lead-secret": secret },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 202) {
      console.info("[LEAD FORWARDED]", { caseId: payload.caseId });
      return true;
    }
    console.error("[LEAD FORWARD FAILED]", { caseId: payload.caseId, status: res.status });
  } catch (error) {
    console.error("[LEAD FORWARD FAILED]", { caseId: payload.caseId, error: error instanceof Error ? error.name : "unknown" });
  }
  return false;
}
