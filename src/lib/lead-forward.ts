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
import { siteMarket } from "@/markets/index";
import { LEAD_LIMITS, type LeadCanonical } from "@vspl/contracts/business-enquiry";
import { isIntakeCluster } from "@/lib/talent-intake/rules";

const DEFAULT_URL = "https://hooks.vayasyaseva.com/api/r/webhook/vspl-lead";
const TIMEOUT_MS = 8_000;

/** What f/leads/intake accepts: business_enquiry.v1 canonical (packages/contracts). */
export type LeadPayload = LeadCanonical;

export function buildLeadPayload(
  data: ContactFormData,
  options: { caseId: string; channel: "web" | "agent"; receivedAt?: Date; note?: string },
): LeadPayload {
  const assessment = assessCrewRequest(data);
  // The market the site is in: a place named in the city, else the page the
  // form was sent from when its market covers that state, else the state's
  // market (src/markets siteMarket).
  const cluster = siteMarket(data.siteState, data.siteCity, data.pageCluster);
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
  // Cut to the lengths f/leads/intake keeps (LEAD_LIMITS), as it used to do itself.
  const cut = (value: string | null | undefined, max: number) => {
    const t = value?.trim();
    return t ? t.slice(0, max) : null;
  };
  return {
    caseId: options.caseId,
    receivedAt: (options.receivedAt ?? new Date()).toISOString(),
    channel: options.channel,
    name: cut(data.name, LEAD_LIMITS.name) ?? "",
    company: cut(data.company, LEAD_LIMITS.company),
    jobTitle: cut(data.role, LEAD_LIMITS.jobTitle),
    phone: cut(data.phone, LEAD_LIMITS.phone) ?? "",
    email: cut(data.email, LEAD_LIMITS.email),
    services: (data.roles ?? []).slice(0, LEAD_LIMITS.services).map((r) => r.slice(0, LEAD_LIMITS.service)),
    headcount: cut(data.headcount, LEAD_LIMITS.headcount),
    headcountBand: cut(assessment.headcountBand, LEAD_LIMITS.headcountBand),
    site: cut(siteLine(data), LEAD_LIMITS.site),
    // Only clusters Twenty knows; another market id only tagged the lead.
    cluster: isIntakeCluster(cluster) ? cluster : null,
    startWindow: cut(data.startWindow, LEAD_LIMITS.startWindow),
    targetStartDate: cut(data.targetStartDate, LEAD_LIMITS.targetStartDate),
    requestType: cut(data.requestType, LEAD_LIMITS.requestType),
    enquiry: enquiry.slice(0, LEAD_LIMITS.enquiry),
    sourcePath: cut(data.sourcePath, LEAD_LIMITS.sourcePath),
  };
}

/** Waits before the second and third tries. Windmill files a replayed case ID once (f/leads/intake). */
const RETRY_DELAYS_MS = [1_000, 3_000];

/**
 * Posts the lead; true once Windmill answers 202. Retries a network error,
 * a timeout, 429 or 5xx up to twice; any other answer (400, 403) is final.
 * Never throws.
 */
export async function forwardLead(payload: LeadPayload, fetchImpl: typeof fetch = fetch, retryDelays: readonly number[] = RETRY_DELAYS_MS): Promise<boolean> {
  const secret = process.env.LEAD_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.warn("[LEAD FORWARD SKIPPED] LEAD_WEBHOOK_SECRET is not set", { caseId: payload.caseId });
    return false;
  }
  const url = process.env.LEAD_WEBHOOK_URL?.trim() || DEFAULT_URL;
  for (let attempt = 1; ; attempt++) {
    let retry = true;
    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-vspl-lead-secret": secret },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status === 202) {
        console.info("[LEAD FORWARDED]", { caseId: payload.caseId, attempt });
        return true;
      }
      retry = res.status === 429 || res.status >= 500;
      console.error("[LEAD FORWARD FAILED]", { caseId: payload.caseId, status: res.status, attempt });
    } catch (error) {
      console.error("[LEAD FORWARD FAILED]", { caseId: payload.caseId, error: error instanceof Error ? error.name : "unknown", attempt });
    }
    const delay = retryDelays[attempt - 1];
    if (!retry || delay === undefined) return false;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
