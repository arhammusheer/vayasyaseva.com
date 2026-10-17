/**
 * f/talent/intake: the website's POST (src/lib/talent-intake/server.ts),
 * through the HTTP route `vspl-talent-intake`. Checks the shared secret,
 * validates, saves (submission, attachments, SMS row, worker list), answers
 * 202 with the reference and starts the SMS acknowledgement.
 *
 * The preprocessor reads the request: only the outcome of the secret check
 * and the body reach main, so the secret never appears in the job's args.
 */
import { timingSafeEqual } from "node:crypto";
import * as wmill from "windmill-client";
import { config } from "../lib/config.ts";
import { withTalentDb } from "../lib/db.ts";
import { runIntake } from "../lib/run-intake.ts";
import { failed } from "../lib/response.ts";

export const SECRET_HEADER = "x-vspl-intake-secret";

export function secretMatches(given: string | undefined, expected: string): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface HttpEvent {
  kind?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export async function preprocessor(event: HttpEvent) {
  const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  const authorized = secretMatches(headers[SECRET_HEADER], await config("intake_webhook_secret"));
  return { authorized, body: authorized ? (event.body ?? null) : null };
}

export async function main(authorized: boolean, body: unknown) {
  try {
    return await withTalentDb((query) =>
      runIntake(authorized, body, {
        query,
        startAcknowledgement: async (submissionId) => {
          // The dispatcher sends the SMS now; if another run holds it, that run (or the next minute) does.
          await wmill.runScriptByPathAsync("f/talent/dispatch", { submission_id: submissionId });
        },
      }),
    );
  } catch (err) {
    // The job log (staff only) gets the error's kind and message, never its
    // parameters; the website gets a bare 500 (see failed()).
    console.error("intake failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
    return failed();
  }
}
