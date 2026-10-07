"use client";

import { useEffect, useRef, useState } from "react";
import { jobsSubmitRequestSchema, type JobsStartRequest, type JobsStartResponse, type JobsSubmitRequest } from "./talent-intake/contract";
import { REF_PATTERN } from "./talent-intake/rules";
import { readSessionValue, writeSessionValue } from "./use-session-draft";

type Attempt = { started: JobsStartResponse; payload: JobsSubmitRequest; uploaded: boolean; submitted: boolean };
type Failure = "verification" | "server" | "network" | "expired";
export class JobSubmissionFailure extends Error {
  constructor(public reason: Failure) { super(reason); }
}

export function decodeJobAttempt(raw: unknown): Attempt | null {
  if (!raw || typeof raw !== "object" || !("ref" in raw) || !("payload" in raw)) return null;
  const payload = jobsSubmitRequestSchema.safeParse(raw.payload);
  if (typeof raw.ref !== "string" || !REF_PATTERN.test(raw.ref) || !payload.success) return null;
  return { started: { ref: raw.ref, ticket: payload.data.ticket, uploads: [] }, payload: payload.data, uploaded: true, submitted: true };
}

/** A retry uses the original ticket, uploaded files and frozen request body. */
export function useJobSubmission(key: string) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const running = useRef(false);
  useEffect(() => {
    // Recover an interrupted final request after a reload in this tab.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttempt(decodeJobAttempt(readSessionValue(key)));
  }, [key]);

  function clear() { setAttempt(null); writeSessionValue(key, null); }

  async function send({ start, payload, upload, resetVerification }: {
    start: JobsStartRequest;
    payload: Omit<JobsSubmitRequest, "ticket">;
    upload: (uploads: JobsStartResponse["uploads"]) => Promise<void>;
    resetVerification: () => void;
  }) {
    if (running.current) return null;
    running.current = true;
    let current = attempt;
    try {
      if (!current) {
        let response: Response;
        try {
          response = await fetch("/api/jobs/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(start) });
        } finally { resetVerification(); }
        if (!response.ok) throw new JobSubmissionFailure(response.status === 403 ? "verification" : "server");
        const started = await response.json() as JobsStartResponse;
        current = { started, payload: { ...payload, ticket: started.ticket }, uploaded: false, submitted: false };
        setAttempt(current);
      } else if (!current.uploaded) {
        // PUT URLs last 15 minutes; renew them without allocating a new ref.
        const response = await fetch("/api/jobs/resume", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticket: current.started.ticket }) });
        if (!response.ok) throw new JobSubmissionFailure(response.status === 410 ? "expired" : "server");
        current = { ...current, started: await response.json() as JobsStartResponse };
        setAttempt(current);
      }
      if (!current.uploaded) {
        await upload(current.started.uploads);
        current = { ...current, uploaded: true };
      }
      current = { ...current, submitted: true };
      setAttempt(current);
      // Save before the request: the server may receive it even if its answer
      // is lost. Reload + Retry must confirm that same reference.
      writeSessionValue(key, { ref: current.started.ref, payload: current.payload });
      const response = await fetch("/api/jobs/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(current.payload) });
      if (!response.ok) throw new JobSubmissionFailure(response.status === 410 ? "expired" : "server");
      writeSessionValue(key, null);
      return current.started.ref;
    } catch (error) {
      throw error instanceof JobSubmissionFailure ? error : new JobSubmissionFailure("network");
    } finally { running.current = false; }
  }
  return { attempt, send, clear };
}
