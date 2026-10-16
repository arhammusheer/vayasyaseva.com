/**
 * What the intake script does, step by step, with its outside world injected so the tests can
 * run every path. The order of steps is the n8n workflow's (integrations/n8n/build.mts).
 */
import { accepted, forbidden, invalid } from "./response.ts";
import { SAVE_SUBMISSION } from "./sql.ts";
import { saveSubmissionParams, validateSubmission } from "./validate.ts";
import type { Query } from "./db.ts";



export interface IntakeDeps {
  query: Query;
  /** Starts the acknowledgement for this submission now; the schedule covers a failure here. */
  startAcknowledgement: (submissionId: string) => Promise<void>;
}

export async function runIntake(authorized: boolean, body: unknown, deps: IntakeDeps) {
  if (!authorized) return forbidden();
  const checked = validateSubmission(body);
  if (!checked.ok) return invalid(checked.errors);
  const [saved] = await deps.query<{ submission_id: string | null }>(SAVE_SUBMISSION, saveSubmissionParams(checked.value));
  // A replayed reference saves nothing and sends nothing; it still answers 202 (n8n did).
  if (saved?.submission_id) {
    try {
      await deps.startAcknowledgement(saved.submission_id);
    } catch {
      // The every-minute acknowledge run picks it up.
    }
  }
  return accepted(checked.value.ref);
}
