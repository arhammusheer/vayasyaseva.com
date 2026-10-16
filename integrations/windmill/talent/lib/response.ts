/**
 * How a sync Windmill HTTP route turns a script's return value into the
 * HTTP response (verified live on CE v1.822.0): `wm_status_code` sets the
 * status, and the body is the `result` key only (other keys are dropped;
 * without `result` the body is empty). A thrown error answers 422. Kept in
 * one place so it is easy to adjust if Windmill changes this.
 */
export interface RouteResponse<T> {
  wm_status_code: number;
  result: T;
}

export function respond<T>(status: number, body: T): RouteResponse<T> {
  return { wm_status_code: status, result: body };
}

/** The n8n intake answered exactly this body on success. */
export const accepted = (ref: string) => respond(202, { ok: true, ref });
/** n8n's header auth answered 403 for a missing or wrong secret. */
export const forbidden = () => respond(403, { ok: false, error: "Forbidden" });
/** n8n threw (500); the website treats any non-202 the same way. */
export const invalid = (errors: string[]) => respond(400, { ok: false, error: `Invalid submission: ${errors.join(", ")}` });
/**
 * Anything unexpected (a database or code error). Never the error itself: a
 * thrown error would answer 422 with its message and query parameters, which
 * carry the applicant's phone number. The job log keeps the detail.
 */
export const failed = () => respond(500, { ok: false, error: "Internal error" });
