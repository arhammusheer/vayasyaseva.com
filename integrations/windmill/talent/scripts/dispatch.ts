/**
 * f/talent/dispatch (roadmap 1F): every minute, and started by intake for a
 * new application's SMS. The one worker for the deliveries table (SMS,
 * Chatwoot, Twenty) on one connection; every 15 minutes it also looks up
 * SMS delivery reports that never came. See talent/lib/run-dispatch.ts.
 */
import { attachFile, createContact, createConversation, postMessage } from "../lib/chatwoot.ts";
import { config } from "../lib/config.ts";
import { withTalentDb } from "../lib/db.ts";
import { lookupReport } from "../lib/delivery.ts";
import { downloadObject } from "../lib/r2.ts";
import { runDispatch } from "../lib/run-dispatch.ts";
import { sendAcknowledgement } from "../lib/sms.ts";
import { twentyFromConfig } from "../lib/twenty.ts";
import { tryEmit } from "../../notify/lib/emit.ts";

export async function main(submission_id?: string | null) {
  const apiKey = await config("fast2sms_api_key");
  const crm = submission_id ? null : await twentyFromConfig().catch(() => null);
  const deliveryCheck = !submission_id && new Date().getUTCMinutes() % 15 === 0;
  return withTalentDb((query) =>
    runDispatch(
      {
        query,
        sendSms: (claim) => sendAcknowledgement(claim, apiKey),
        chatwoot: { createContact, createConversation, postMessage, download: downloadObject, attachFile },
        crm,
        lookupReport: (id) => lookupReport(id, apiKey),
        notify: tryEmit,
      },
      { submissionId: submission_id || null, deliveryCheck },
    ),
  );
}
