/**
 * f/platform/submission: one signed route for every submission type
 * (envelope.v1). A job application is saved by the talent intake (the same
 * code as f/talent/intake), a business enquiry or compliance help request by
 * the lead inbox (the same as f/leads/intake). Both answer 202 once saved.
 * A rate alert action (rate_alert.v1) is run on the subscriber list in the
 * lead inbox and answers 202 (subscribe), 200 or 404 (confirm, unsubscribe).
 * The older routes stay, as adapters, until the site no longer uses them.
 */
import type { Envelope } from "../../../../packages/contracts/src/envelope.v1.ts";
import { SCHEMAS, check } from "../../contracts/validate.ts";
import { checkLead } from "../../leads/lib/lead.ts";
import { saveLead } from "../../leads/lib/run-leads.ts";
import { runAlertAction } from "../../leads/lib/run-alerts.ts";
import type { AlertMailer } from "../../leads/lib/alert-mail.ts";
import type { Notify } from "../../notify/lib/emit.ts";
import { failed, forbidden, respond } from "../../talent/lib/response.ts";
import { runIntake } from "../../talent/lib/run-intake.ts";
import type { Query } from "../../talent/lib/db.ts";

export interface SubmissionDeps {
  /** One connection to the talent database for `fn`. */
  talent: <T>(fn: (query: Query) => Promise<T>) => Promise<T>;
  /** One connection to the lead inbox for `fn`. */
  leads: <T>(fn: (query: Query) => Promise<T>) => Promise<T>;
  startDispatch: (submissionId: string) => Promise<void>;
  startLeadSync: (leadId: string) => Promise<void>;
  /** The rate alert emails (Resend). Read only when an alert action arrives. */
  alertMail: () => Promise<AlertMailer>;
  /** The notification hub. Unset: no notifications. */
  notify?: Notify;
}

export async function runSubmission(authorized: boolean, body: unknown, deps: SubmissionDeps) {
  if (!authorized) return forbidden();
  const envelope = check<Envelope>(SCHEMAS["envelope.v1"], body);
  if (!envelope.ok) return respond(400, { ok: false, error: `Invalid envelope: ${envelope.errors.join(", ")}` });
  const e = envelope.value;
  try {
    if (e.type === "job_application.v1") {
      if (e.id !== e.payload.ref) return respond(400, { ok: false, error: "Invalid envelope: id" });
      return await deps.talent((query) => runIntake(true, e.payload, { query, startAcknowledgement: deps.startDispatch }));
    }
    if (e.type === "rate_alert.v1") {
      if (e.id !== e.payload.ref) return respond(400, { ok: false, error: "Invalid envelope: id" });
      const alert = e.payload;
      const mail = await deps.alertMail();
      return await deps.leads((query) => runAlertAction(alert, { query, mail, notify: deps.notify }));
    }
    const lead = checkLead(e.payload);
    if (!lead.ok) return respond(400, { ok: false, error: `Invalid lead: ${lead.errors.join(", ")}` });
    if (e.id !== lead.lead.caseId) return respond(400, { ok: false, error: "Invalid envelope: id" });
    const saved = await deps.leads((query) => saveLead(query, lead.lead, e.idempotencyKey));
    if (saved.leadId) await deps.startLeadSync(saved.leadId).catch(() => {});
    return respond(202, { ok: true, caseId: lead.lead.caseId, created: saved.created });
  } catch (err) {
    // The job log gets the kind and message, never the parameters (they carry personal details).
    console.error("submission failed:", e.type, e.id, err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
    return failed();
  }
}
