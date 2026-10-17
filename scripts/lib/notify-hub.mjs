// The notification hub's ingest route (docs/notification-hub.md, "From a
// CronJob"), for the compliance monitor and the SEO watch: POST events,
// schema v1, with the shared secret. In the cluster NOTIFY_URL is the
// in-cluster route; anywhere else the public one.
//
//   NOTIFY_URL             http://windmill.growth.svc.cluster.local:8000/api/r/webhook/vspl-notify
//   NOTIFY_INGEST_SECRET   the x-vspl-notify-secret header
//
// Never send personal data here (the route drops `pii` anyway); titles and
// summaries go to a phone's lock screen.

export const MAX_BATCH = 50;

/** The destinations of --notify: a comma list, e.g. "chatwoot,hub". */
export function parseNotify(value, allowed) {
  const list = String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const bad = list.filter((d) => !allowed.includes(d));
  if (!list.length || bad.length) throw new Error(`--notify must be one or more of ${allowed.join(", ")} (comma-separated), not ${value}`);
  return [...new Set(list)];
}

/** A hub client from the environment; throws when NOTIFY_URL or NOTIFY_INGEST_SECRET is missing. */
export function hubFromEnv(env = process.env, fetchImpl = fetch) {
  if (!env.NOTIFY_URL || !env.NOTIFY_INGEST_SECRET) throw new Error("Set NOTIFY_URL and NOTIFY_INGEST_SECRET to report to the notification hub, or pass --dry-run.");
  return hubClient({ url: env.NOTIFY_URL, secret: env.NOTIFY_INGEST_SECRET, fetchImpl });
}

export function hubClient({ url, secret, fetchImpl = fetch, timeoutMs = 15_000 }) {
  return {
    /** Sends the events (in batches of 50); throws unless every batch is accepted (202) with nothing rejected. */
    async send(events) {
      const ids = [];
      for (let i = 0; i < events.length; i += MAX_BATCH) {
        const batch = events.slice(i, i + MAX_BATCH).map((e) => ({ v: 1, ...e }));
        const res = await fetchImpl(url, {
          method: "POST",
          headers: { "content-type": "application/json", "x-vspl-notify-secret": secret },
          body: JSON.stringify({ events: batch }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        // The answer's counts only: the body can echo what was sent.
        if (res.status !== 202) throw new Error(`notification hub: HTTP ${res.status}`);
        const answer = await res.json().catch(() => ({}));
        if (answer.rejected?.length) throw new Error(`notification hub rejected ${answer.rejected.length} of ${batch.length} events`);
        ids.push(...(answer.ids ?? []));
      }
      return ids;
    },
  };
}
