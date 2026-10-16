/**
 * What the acknowledge script does, step by step, with its outside world injected so the tests can
 * run every path. The order of steps is the n8n workflow's (integrations/n8n/build.mts).
 */
import { classifyAcknowledgement } from "./sms.ts";
import { CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT } from "./sql.ts";
import type { AcknowledgementResult, ClaimedAcknowledgement, Fast2SmsResponse } from "./types.ts";
import type { Query } from "./db.ts";

// --- acknowledge ----------------------------------------------------------------

export interface AcknowledgeDeps {
  query: Query;
  send: (claim: ClaimedAcknowledgement) => Promise<Fast2SmsResponse>;
}

/**
 * With a submission id (started by intake): that application only. Without
 * (the schedule): first flags sends interrupted for five minutes as
 * "unknown", then takes the oldest due one. One SMS per run, as in n8n.
 */
export async function runAcknowledge(submissionId: string | null, deps: AcknowledgeDeps): Promise<AcknowledgementResult | null> {
  if (!submissionId) await deps.query(RECOVER_INTERRUPTED_SENDS);
  const [claim] = submissionId
    ? await deps.query<ClaimedAcknowledgement>(CLAIM_ACKNOWLEDGEMENT_FOR, [submissionId])
    : await deps.query<ClaimedAcknowledgement>(CLAIM_ACKNOWLEDGEMENT);
  if (!claim?.submission_id) return null;
  const result = classifyAcknowledgement(claim, await deps.send(claim));
  await deps.query(SAVE_ACKNOWLEDGEMENT_RESULT, [result.submissionId, result.status, result.requestId, result.error]);
  return result;
}
