/**
 * Transcribe · "Transcript result" (once per voice note). Takes Sarvam's
 * answer from either route - the REST call (full response, `body`) or the
 * Batch job's result file - and masks identity numbers before it is stored.
 */
import { maskIds } from "../lib/mask.ts";
import type { SarvamTranscript, TranscriptResult } from "../types.ts";

export default async function main(): Promise<N8nItem<TranscriptResult>> {
  const input = $json as { body?: SarvamTranscript } & SarvamTranscript;
  const result = input.body ?? input;
  return {
    json: {
      attachmentId: $("Claim voice notes").item.json.id,
      requestId: result.request_id ?? null,
      transcript: maskIds(String(result.transcript ?? "").trim()),
      language: result.language_code ?? null,
    },
  };
}
