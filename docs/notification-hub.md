# Notification hub

One place that decides who hears about what, and how: new job applications and business leads as instant pushes, problems as pushes with email for the serious ones, everything else in one morning digest. Owner decisions of 18 October 2026; phase A (this document) builds the hub. Wiring the producers is phase B.

```
producers                                   hub (Windmill, workspace vspl, folder f/notify)          out
---------                                   ------------------------------------------------          ---
talent, leads scripts ── emit() ──────────► notify_events  (notify database on pg-main)
CronJobs, GitHub, website ── POST ────────► f/notify/ingest       /api/r/webhook/vspl-notify
Alertmanager ── webhook v4 ───────────────► f/notify/alertmanager /api/r/internal/vspl-alertmanager
                                                │
                                   every minute ▼
                                 f/notify/dispatch  route by f/notify/policy ──► notify_deliveries (outbox)
                                                    send, 4 tries each ───────► ntfy  ntfy.vayasyaseva.com ──► phone
                                                                         └────► Resend (notify.vayasyaseva.com) ──► email
                                   08:00 IST    ▼
                                 f/notify/digest    one email of the day's digest events
```

| Part | Where |
|---|---|
| Event schema, validation, scrubbing | `integrations/windmill/notify/lib/event.ts` |
| Policy, routing, dedupe and firing/resolved decisions | `notify/lib/policy.ts` |
| Push, email and digest text | `notify/lib/render.ts` |
| Run logic (dispatch, digest) | `notify/lib/dispatch.ts`, with storage behind `notify/lib/store.ts` (`db.ts` for Postgres, `memory-store.ts` for tests) |
| ntfy and Resend clients | `notify/lib/ntfy.ts`, `notify/lib/resend.ts` |
| `emit()` for other scripts | `notify/lib/emit.ts` |
| Webhooks | `notify/scripts/ingest.ts`, `notify/scripts/alertmanager.ts` (`notify/lib/alertmanager.ts` maps the payload) |
| Schema | `notify/schema.sql`, applied by `f/notify/setup` on every deploy |
| Tests | `integrations/windmill/notify.test.mts` (in `pnpm windmill:test`) |
| ntfy server, notify database, secrets | vayasya-infra: `apps/ntfy`, `apps/pg-main`, `apps/windmill/overlays/growth/secrets-notify.sops.yaml` |

## Event schema v1

```ts
{
  v: 1,
  source: "talent" | "leads" | "seo-watch" | "compliance" | "platform" | "alertmanager" | "github" | "website",
  type: string,             // dotted: application.received, lead.forward_failed, platform.db_down …
  severity: "info" | "notice" | "warning" | "critical",
  dedupeKey: string,        // ≤ 200; the same key is the same thing
  status?: "firing" | "resolved",
  occurredAt: string,       // ISO 8601; defaults to now
  title: string,            // ≤ 80, no personal data (lock screen, digest)
  summary: string,          // ≤ 500, no personal data
  body?: string,            // instant emails only (≤ 20 000)
  link?: { label, url },    // http(s); the push's tap target and action button
  pii?: { name?, phone?, email?, company? },
}
```

- **title and summary are scrubbed** whatever the producer sends: Aadhaar becomes `XXXX XXXX 1234`, PAN is removed (`talent/lib/mask.ts`), and phone numbers and email addresses become `[phone removed]` / `[email removed]`. Never put a person's details there on purpose.
- **pii** is rendered only where the policy allows it (a push whose rule has `pii: full` or `masked`). It is never put in an email or the digest. It is cleared from the row as soon as the push that needs it has been sent (or has failed for good), immediately when no push needs it, and after 24 hours in any case.
- **pii never becomes a Windmill job argument.** `emit()` inserts the row from inside the calling script. The webhooks drop any `pii` in their preprocessor (and count it as `piiDropped`).
- **Dedupe**: an event with no `status` is sent once per `dedupeKey`, and later ones are recorded as duplicates. With `status`, `firing` opens an episode (a second `firing` is a duplicate), and `resolved` closes it. A resolved notice goes only to the channels the firing went to, so a resolution of nothing sent is silent.

## Routing (default policy)

The policy is the Windmill variable **`f/notify/policy`** (JSON). `deploy.mts` creates it from `DEFAULT_POLICY` once and then leaves it to you. Edit it in the Windmill UI (Variables) and the next dispatch run uses it. An invalid policy is reported in the dispatch job's log, and the default is used until it is fixed. `pnpm windmill:deploy --reset-notify-policy` writes the default back.

| Event | Push | Email |
|---|---|---|
| `application.received` | instant, name and **full phone**, **Call** (`tel:`) and "View in Twenty", topic `vspl-jobs`, priority 4 | digest |
| `lead.received` | instant, name, company, **masked phone** (`+91 XXXXXX3210`), "View in Twenty", topic `vspl-leads`; priority 3, or 4 for a qualified lead (send `severity: "notice"`) | none (the MSG91 shared-inbox mail stays) |
| `lead.forward_failed`, `lead.email_failed` | instant | instant |
| `seo.weekly_report` | one line (the summary's first line) | instant, full body |
| `seo.rule_tripped` | instant | instant, full body |
| `compliance.source_changed` | instant; `link` is the GitHub issue | instant, with the detail |
| `compliance.monitor_failed`, `seo.watch_failed` | instant | instant |
| `platform.*` | when firing starts, then a reminder every 24 h while it fires; resolved | digest |
| `windmill.job_failed` | the first now, then at most one "N times" summary per hour per `dedupeKey` (use one key per script) | digest |
| Alertmanager, critical | instant; resolved | instant |
| Alertmanager, warning and below | instant; resolved | digest |
| `search.pipeline_failed` | instant | none |
| anything else | none | digest |

Policy-wide settings:

- `criticalEmail: true`. A critical event always gets an instant email.
- `fallbackEmail: ["critical"]`. A push of these severities that fails every try is sent by email instead, unless it was already emailed.
- `reminderHours: 24` and `collapseMinutes: 60`.

The topics are `vspl-jobs`, `vspl-leads` and `vspl-ops` (the default). Subscribe to all three. Mute `vspl-ops` at night if you like, and job applications still ring.

Each rule is `{ name, match: { type?, source?, severity? }, push: { mode, pii?, call?, topic?, priority? }, email }`. The first rule that matches wins.

- `type` is an exact type, a prefix glob (`platform.*`), `*`, or a list of these.
- Push modes are `instant`, `one_line`, `firing_daily`, `collapsed_hourly` and `none`.
- Email modes are `instant`, `digest` and `none`.
- `priority` maps a severity to an ntfy priority (1 to 5).

## Delivery

- **dispatch** (every minute) runs in this order:
  1. It puts sends that a crashed run left in `sending` for 10 minutes back to `pending`.
  2. It routes new events into the outbox in one transaction (claimed `FOR UPDATE SKIP LOCKED`, with the dedupe state locked per key).
  3. It adds the reminders and collapsed summaries that are due.
  4. It sends due deliveries, claimed with `SKIP LOCKED`. Each delivery gets four tries (the first and three retries, after 1, 2 and 5 minutes). Network errors, 408, 429 and 5xx are retried, and any other 4xx fails at once.
  5. A critical push that fails every try becomes an email.
  6. It clears personal data older than 24 h.

  The job returns counts only.
- **ntfy** is published in the cluster (`http://ntfy.growth.svc.cluster.local`) by the ntfy user `windmill` with its token. With `upstream-base-url: https://ntfy.sh`, our server sends ntfy.sh only a poll request (the message id and a hash of the topic), so the iPhone app wakes up. The name and number never leave our server except to your phone.
- **Resend** sends from `VSPL notifications <notify@notify.vayasyaseva.com>` to the address in `NOTIFY_EMAIL_TO`, which is kept in the cluster Secret and not in this public repo. Every delivery sends an `Idempotency-Key`, so a retry never mails twice.
- **digest** (08:00 IST) sends one email with every event whose rule says `digest`, grouped by source and then type, with the most severe source first. If there is nothing to send, no email goes. If Resend refuses, the job fails and the next run sends the same events. The digest also deletes events older than 90 days (only titles and summaries are left by then).

## Emitting

### From a Windmill script (talent, leads, anything in this repo)

```ts
import { tryEmit } from "../../notify/lib/emit.ts";

// After the application is saved (f/talent/intake, or sync_crm once the Twenty person exists):
await tryEmit({
  source: "talent",
  type: "application.received",
  severity: "info",
  dedupeKey: `application:${ref}`,                     // one push per application
  title: `New job application: ${roleLabel}, ${clusterLabel}`, // no name, no number
  summary: `${ref} · ${formLabel} · ${languageLabel}`,          // never the applicant's free text
  link: { label: "View in Twenty", url: `https://crm.vayasyaseva.com/object/person/${personId}` },
  pii: { name: applicantName ?? undefined, phone },           // E.164, e.g. +919876543210
});

// A business lead (f/leads/intake), once the Twenty records exist:
await tryEmit({
  source: "leads",
  type: "lead.received",
  severity: qualified ? "notice" : "info",               // qualified leads push at priority 4
  dedupeKey: `lead:${caseId}`,
  title: `New crew request: ${crewSummary}`,               // e.g. "12 loaders, SIDCUL Haridwar"
  summary: `${caseId} · ${sourcePage}`,
  link: { label: "View in Twenty", url: `https://crm.vayasyaseva.com/object/opportunity/${opportunityId}` },
  pii: { name: contactName, company, phone },
});
```

- `tryEmit` never throws: it logs the error's kind and returns `false`, so an intake never fails because of a notification. `emit` throws (`InvalidEventError` with the reasons) when you would rather know.
- **Never** put Aadhaar, PAN, file contents or the applicant's own message in any field. Free text that might hold IDs goes through `maskIds` first, and title and summary are scrubbed again anyway.
- The script needs the variable `f/notify/notify_pg_url`, which deploy sets. Schedules and routes run as the workspace admin service user, who can read it.
- The bundler inlines `notify/lib/*`, so a talent script that imports `emit.ts` is still one file. Its exported names are prefixed (`notifyConfig`, `withNotifyDb`, `NOTIFY_*`), so they do not collide with talent's.

### From a CronJob or another service in the cluster

POST to `http://windmill.growth.svc.cluster.local:8000/api/r/webhook/vspl-notify` with the header `x-vspl-notify-secret: $NOTIFY_INGEST_SECRET`. The body is one event or `{ "events": [...] }`, with at most 50 events. The answer is `202 { ok, ids, rejected, piiDropped }`, or 400 when no event is valid. Windmill's network policy admits the `app: compliance-monitor` and `app: seo-watch` pods. Another workload needs a line there (vayasya-infra `apps/windmill/base/networkpolicy.yaml`).

```js
await fetch("http://windmill.growth.svc.cluster.local:8000/api/r/webhook/vspl-notify", {
  method: "POST",
  headers: { "content-type": "application/json", "x-vspl-notify-secret": process.env.NOTIFY_INGEST_SECRET },
  body: JSON.stringify({
    v: 1, source: "compliance", type: "compliance.source_changed", severity: "notice",
    dedupeKey: `compliance:${state}:${sourceId}:${hash}`,
    title: `Uttarakhand minimum wages: source changed`,
    summary: "The notification PDF on the labour department page is new.",
    body: detailText,
    link: { label: "GitHub issue", url: issueUrl },
  }),
});
```

### From outside (GitHub Actions, the website)

The same route is public as `https://hooks.vayasyaseva.com/api/r/webhook/vspl-notify`, with the same header. Keep the secret in the caller's secret store (GitHub Actions secret, Vercel env). Never send `pii` here, because it is dropped.

### Alertmanager (phase B)

The receiver URL is `http://windmill.growth.svc.cluster.local:8000/api/r/internal/vspl-alertmanager`. It is in the cluster only: the public ingress routes only `/api/r/webhook/`. The receiver authenticates with `Authorization: Bearer $NOTIFY_ALERTMANAGER_SECRET`, sent through `http_config.authorization.credentials_file`.

- Each alert becomes `{ source: "alertmanager", type: "alert.<alertname>", dedupeKey: "am:<fingerprint>", status }`.
- The `severity` label maps to the event's severity.
- The link points at Alertmanager.
- `Watchdog` and `InfoInhibitor` are ignored.
- Alertmanager re-sends a firing group every `repeat_interval`, and the hub drops those as duplicates.

The vayasya-infra PR carries the exact receiver and route snippet. Alertmanager routing is unchanged until phase B.

## Owner setup

In order:

1. **Merge the vayasya-infra PR** ("Notifications: ntfy, notify database, windmill-notify secrets"). Argo creates:
   - the `notify` role and database on pg-main;
   - ntfy at `ntfy.vayasyaseva.com` (DNS through ExternalDNS, TLS from cert-manager);
   - the Secret `growth/windmill-notify`;
   - Windmill's new ingress rules.

   Check it with `curl -s https://ntfy.vayasyaseva.com/v1/health`, which should answer `{"healthy":true}`.
2. **Create the ntfy users and token** (in the pod, so nothing is typed into a shell history elsewhere):

   ```sh
   kubectl -n growth exec -it deploy/ntfy -- ntfy user add owner              # your phone's login; prompts for a password
   kubectl -n growth exec -it deploy/ntfy -- ntfy access owner 'vspl-*' read-only
   kubectl -n growth exec -it deploy/ntfy -- ntfy user add windmill           # the publisher; any long random password
   kubectl -n growth exec -it deploy/ntfy -- ntfy access windmill 'vspl-*' write-only
   kubectl -n growth exec -it deploy/ntfy -- ntfy token add --label=windmill windmill   # prints tk_…
   ```

3. **Replace the placeholders** in vayasya-infra: run `sops edit apps/windmill/overlays/growth/secrets-notify.sops.yaml` and set:
   - `NTFY_TOKEN` to the `tk_…` token from step 2;
   - `RESEND_NOTIFY_API_KEY` to a new Resend API key with "Sending access" restricted to `notify.vayasyaseva.com`.

   Commit and push (PR, merge). `NOTIFY_EMAIL_TO` is already set. Change it the same way if you want the email somewhere else.
4. **Deploy the hub**: run `pnpm windmill:build && pnpm windmill:deploy --enable-notify` (kubectl access, WARP on). It does the following:
   - creates folder `notify` and its variables (`f/notify/policy` from the default);
   - creates the scripts and runs `f/notify/setup`;
   - creates the two schedules (`--enable-notify` turns them on, otherwise they are created disabled) and the two routes;
   - warms the routes (a wrong secret must answer 403).
5. **Phone**: install ntfy (iOS or Android).
   - Add the server `https://ntfy.vayasyaseva.com` and log in as `owner`.
   - Subscribe to `vspl-jobs`, `vspl-leads` and `vspl-ops`.
   - On iOS, allow notifications and Time Sensitive for ntfy.
6. **Test event**: post one through a port-forward. The secret stays in your shell's memory and is never printed.

   ```sh
   kubectl -n growth port-forward svc/windmill 8000:8000 &
   S=$(kubectl -n growth get secret windmill-notify -o jsonpath='{.data.NOTIFY_INGEST_SECRET}' | base64 -d)
   curl -s -X POST http://127.0.0.1:8000/api/r/webhook/vspl-notify \
     -H "content-type: application/json" -H "x-vspl-notify-secret: $S" \
     -d "{\"v\":1,\"source\":\"platform\",\"type\":\"platform.test\",\"severity\":\"critical\",\"dedupeKey\":\"test:$(date +%s)\",\"title\":\"Notification hub test\",\"summary\":\"If you can read this on your phone and in your inbox, the hub works.\"}"
   unset S; kill %1
   ```

   Within a minute you should get a push on `vspl-ops`, and an email because the event is critical. The dispatch job's result shows the counts.

## Retention and privacy

| What | How long |
|---|---|
| `pii` (name, phone, email, company) | until its push is sent or has failed for good; 24 h at most |
| Events (title, summary, body, link) | 90 days |
| ntfy's message cache (the push text, including the applicant's name and number) | 12 h on the ntfy volume (`cache-duration`); nothing on ntfy.sh |
| Delivery rows | with their event |

The repo is public, so no personal data, phone numbers or real addresses appear in code, tests (made-up data only) or docs. The recipient address lives in the cluster Secret.

## Phase B (not built yet)

- Talent: `tryEmit` for `application.received` after Twenty sync (so the "View in Twenty" link exists).
- Leads: `tryEmit` for `lead.received`, plus `lead.forward_failed` and `lead.email_failed` from the website's side.
- seo-watch and compliance-monitor: POST their reports and failures to ingest, adding `NOTIFY_INGEST_SECRET` to their Secrets. This replaces their Chatwoot posts once trusted.
- Alertmanager: the receiver and route from the infra PR, plus a `monitoring` Secret holding `NOTIFY_ALERTMANAGER_SECRET`.
- `windmill.job_failed`: a workspace error handler that emits per script.
- GitHub: `search.pipeline_failed` from `search.yml`.
