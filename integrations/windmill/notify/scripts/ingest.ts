/**
 * f/notify/ingest: POST /api/r/webhook/vspl-notify (public as
 * hooks.vayasyaseva.com/api/r/webhook/vspl-notify, and in the cluster as
 * http://windmill.growth.svc.cluster.local:8000/api/r/webhook/vspl-notify)
 * for producers outside Windmill: the compliance monitor and SEO watch
 * CronJobs, GitHub Actions, the website. One event or { events: [...] },
 * checked by the x-vspl-notify-secret header. Answers 202 with the ids.
 *
 * The preprocessor checks the secret and drops any `pii` before main, so
 * neither becomes a job argument. Personal data comes only through emit().
 */
import { notifyConfig } from "../lib/config.ts";
import { pgNotifyStore, withNotifyDb } from "../lib/db.ts";
import { lowerHeaders, notifySecretMatches, type NotifyHttpEvent } from "../lib/http.ts";
import { checkIngest, withoutPii } from "../lib/ingest.ts";
import { respond } from "../../talent/lib/response.ts";

export const SECRET_HEADER = "x-vspl-notify-secret";

export async function preprocessor(event: NotifyHttpEvent) {
  const authorized = notifySecretMatches(lowerHeaders(event)[SECRET_HEADER], await notifyConfig("ingest_secret"));
  if (!authorized) return { authorized: false, events: [], pii_dropped: 0 };
  const { events, piiDropped } = withoutPii(event.body);
  return { authorized, events, pii_dropped: piiDropped };
}

export async function main(authorized: boolean, events: unknown[], pii_dropped = 0) {
  if (!authorized) return respond(403, { ok: false, error: "Forbidden" });
  const checked = checkIngest(Array.isArray(events) ? events : []);
  if (checked.events.length === 0) return respond(400, { ok: false, error: "No valid event", rejected: checked.rejected });
  try {
    const now = new Date();
    const ids = await withNotifyDb(async (sql) => {
      const store = pgNotifyStore(sql);
      const out: string[] = [];
      for (const e of checked.events) out.push(await store.insertEvent(e, now));
      return out;
    });
    return respond(202, { ok: true, ids, rejected: checked.rejected, piiDropped: pii_dropped });
  } catch (err) {
    console.error("notify ingest failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
    return respond(500, { ok: false, error: "Internal error" });
  }
}
