/**
 * The edge pipeline every submission route runs (docs/submissions-edge.md):
 *
 *   read      parse and validate the body (the contracts package)     400
 *   key       the optional Idempotency-Key header                     400
 *   verify    Turnstile, on the human forms only                      403 / 503
 *   replay    a key seen before: its first answer                     2xx / 409 / 422
 *   screen    bot checks and rate limits                              429
 *   handle    the type's own work, then the transport to Windmill     2xx / 4xx / 5xx
 *
 * The legacy routes under src/app/api are thin adapters over this: their
 * URLs, status codes and bodies are unchanged. A thrown error gives back
 * the rate-limit slots and the idempotency claim, then answers the route's
 * own error (`fail`).
 */
import { after, NextResponse, type NextRequest } from "next/server";
import { clientIp } from "@/lib/rate-limit";
import {
  REPLAYED_HEADER,
  fingerprintOf,
  idempotencyKeyOf,
  idempotencyStore,
} from "./policies/idempotency";

export interface SubmissionContext {
  request: NextRequest;
  /** The caller's IP as Vercel reports it, or null. */
  ip: string | null;
  idempotencyKey: string | null;
  /** What a failed earlier run with the same key left for this one (e.g. its case ID). */
  carry: Record<string, string> | undefined;
  /** Leaves a note for a retry with the same key, should this run fail. */
  keep(carry: Record<string, string>): void;
  /** What this run has kept so far (for its logs). */
  readonly kept: Record<string, string> | undefined;
  /** Runs after the response (next/server after()). */
  defer(task: () => unknown): void;
}

export type Read<T> = { ok: true; value: T } | { ok: false; response: Response };

/** A refusal, or the slots taken (given back if the run then fails on our side). */
export type Screen = { response: Response } | { release: () => Promise<void> };

export interface SubmissionRoute<T> {
  /** The route's path: the idempotency scope and the log label. */
  name: string;
  read(request: NextRequest): Promise<Read<T>>;
  /** What makes two requests the same one for Idempotency-Key. Default: the parsed body. */
  fingerprint?(value: T): unknown;
  verify?(value: T, ctx: SubmissionContext): Promise<Response | null>;
  screen?(value: T, ctx: SubmissionContext): Promise<Screen>;
  handle(value: T, ctx: SubmissionContext): Promise<Response>;
  /** The answer for an unexpected error, as the route has always given it. */
  fail(error: unknown, ctx: SubmissionContext): Response;
}

/** Tests replace next/server's after(), which needs a request scope. */
let defer: (task: () => unknown) => void = (task) => after(task);
export function setDeferForTests(next: ((task: () => unknown) => void) | null) {
  defer = next ?? ((task) => after(task));
}

export async function runSubmission<T>(route: SubmissionRoute<T>, request: NextRequest): Promise<Response> {
  const read = await route.read(request);
  if (!read.ok) return read.response;
  const value = read.value;

  const key = idempotencyKeyOf(request.headers);
  if (key === "invalid") {
    return NextResponse.json({ error: "invalid_idempotency_key" }, { status: 400 });
  }

  let carry: Record<string, string> | undefined;
  let kept: Record<string, string> | undefined;
  const ctx: SubmissionContext = {
    request,
    ip: clientIp(request),
    idempotencyKey: key,
    get carry() {
      return carry;
    },
    keep: (note) => {
      kept = { ...kept, ...note };
    },
    get kept() {
      return kept;
    },
    defer: (task) => defer(task),
  };

  try {
    const refused = await route.verify?.(value, ctx);
    if (refused) return refused;
  } catch (error) {
    return route.fail(error, ctx);
  }

  const store = idempotencyStore();
  if (key) {
    const begun = await store.begin(route.name, key, fingerprintOf(route.fingerprint ? route.fingerprint(value) : value));
    if (begun.state === "replay") {
      return NextResponse.json(begun.answer.body, {
        status: begun.answer.status,
        headers: { [REPLAYED_HEADER]: "true", "cache-control": "no-store" },
      });
    }
    if (begun.state === "in_progress") return NextResponse.json({ error: "in_progress" }, { status: 409 });
    if (begun.state === "mismatch") return NextResponse.json({ error: "idempotency_key_reused" }, { status: 422 });
    carry = begun.carry;
  }
  const forget = async () => {
    if (key) await store.abandon(route.name, key, kept);
  };

  let release = async () => {};
  try {
    const screened = await route.screen?.(value, ctx);
    if (screened && "response" in screened) {
      await forget();
      return screened.response;
    }
    if (screened) release = screened.release;

    const response = await route.handle(value, ctx);
    if (key) {
      if (response.status >= 200 && response.status < 300) {
        const body = await response
          .clone()
          .json()
          .catch(() => null);
        await store.complete(route.name, key, { status: response.status, body });
      } else await forget();
    }
    return response;
  } catch (error) {
    await release();
    await forget();
    return route.fail(error, ctx);
  }
}

/** The JSON body, or null when it is not JSON (each route answers that as it always has). */
export async function jsonBody(request: NextRequest): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false };
  }
}
