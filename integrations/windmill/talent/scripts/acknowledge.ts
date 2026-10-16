/**
 * f/talent/acknowledge: the Fast2SMS application acknowledgement. Started
 * by intake for one submission, and every minute by schedule for anything
 * due (and to flag interrupted sends as "unknown"). One SMS per run.
 */
import { config } from "../lib/config.ts";
import { withTalentDb } from "../lib/db.ts";
import { runAcknowledge } from "../lib/run-acknowledge.ts";
import { sendAcknowledgement } from "../lib/sms.ts";

export async function main(submission_id?: string | null) {
  const apiKey = await config("fast2sms_api_key");
  return withTalentDb((query) =>
    runAcknowledge(submission_id || null, { query, send: (claim) => sendAcknowledgement(claim, apiKey) }),
  );
}
