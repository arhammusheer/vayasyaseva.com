/**
 * f/platform/submission: the signed route `webhook/vspl-submission`
 * (envelope.v1 from the site's src/server/submissions/transport.ts). The
 * preprocessor checks the HMAC over the timestamp and raw body; main saves
 * the submission (talent intake or lead inbox) and answers 202, or runs a
 * rate alert action on the subscriber list (leads/lib/run-alerts.ts).
 */
import * as wmill from "windmill-client";
import { config } from "../../talent/lib/config.ts";
import { notifyConfig } from "../../notify/lib/config.ts";
import { tryEmit } from "../../notify/lib/emit.ts";
import { alertMailer } from "../../leads/lib/alert-mail.ts";
import { withDatabase, withTalentDb } from "../../talent/lib/db.ts";
import { runSubmission } from "../lib/run-submission.ts";
import { signedPreprocessor, type SignedHttpEvent } from "../lib/signed.ts";

export async function preprocessor(event: SignedHttpEvent) {
  return signedPreprocessor(event);
}

export async function main(authorized: boolean, body: unknown) {
  return runSubmission(authorized, body, {
    talent: (fn) => withTalentDb(fn),
    leads: (fn) => withDatabase("leads_pg_url", fn),
    startDispatch: async (submissionId) => {
      await wmill.runScriptByPathAsync("f/talent/dispatch", { submission_id: submissionId });
    },
    startLeadSync: async (leadId) => {
      await wmill.runScriptByPathAsync("f/leads/sync_crm", { lead_id: leadId });
    },
    // The hub's Resend key (verified for notify.vayasyaseva.com), with the alerts' own sender.
    alertMail: async () => alertMailer(await notifyConfig("resend_api_key").catch(() => ""), await config("alerts_email_from"), await config("alerts_reply_to")),
    notify: tryEmit,
  });
}
