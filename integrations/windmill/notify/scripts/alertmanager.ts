/**
 * f/notify/alertmanager: Alertmanager's webhook receiver (payload v4), in
 * the cluster only, at
 * http://windmill.growth.svc.cluster.local:8000/api/r/internal/vspl-alertmanager
 * (not under /api/r/webhook/, so the public hooks host never routes it).
 * Alertmanager authenticates with `Authorization: Bearer <secret>`
 * (http_config.authorization). Each alert becomes an event with dedupeKey
 * am:<fingerprint>; dispatch pushes firing ones and their resolutions.
 * Answers 200 so Alertmanager does not retry what was queued.
 */
import { notifyConfig } from "../lib/config.ts";
import { pgNotifyStore, withNotifyDb } from "../lib/db.ts";
import { alertmanagerEvents } from "../lib/alertmanager.ts";
import { validateEvent } from "../lib/event.ts";
import { bearer, lowerHeaders, notifySecretMatches, type NotifyHttpEvent } from "../lib/http.ts";
import { respond } from "../../talent/lib/response.ts";

export const SECRET_HEADER = "authorization";

export async function preprocessor(event: NotifyHttpEvent) {
  const authorized = notifySecretMatches(bearer(lowerHeaders(event)[SECRET_HEADER]), await notifyConfig("alertmanager_secret"));
  return { authorized, body: authorized ? (event.body ?? null) : null };
}

export async function main(authorized: boolean, body: unknown) {
  if (!authorized) return respond(403, { ok: false, error: "Forbidden" });
  const mapped = alertmanagerEvents(body);
  if (mapped.errors.length && mapped.events.length === 0 && mapped.ignored === 0) return respond(400, { ok: false, errors: mapped.errors });
  const now = new Date();
  const valid = mapped.events.map((e) => validateEvent({ v: 1, ...e }, now)).flatMap((c) => (c.ok ? [c.event] : []));
  try {
    const ids = await withNotifyDb(async (sql) => {
      const store = pgNotifyStore(sql);
      const out: string[] = [];
      for (const e of valid) out.push(await store.insertEvent(e, now));
      return out;
    });
    return respond(200, { ok: true, queued: ids.length, ignored: mapped.ignored, errors: mapped.errors });
  } catch (err) {
    console.error("notify alertmanager failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
    return respond(500, { ok: false, error: "Internal error" });
  }
}
