# Notification hub

One place that decides who hears about what, and how: new job applications and business leads as instant pushes, problems as pushes with email for the serious ones, everything else in one morning digest. Owner decisions of 18 October 2026. Phase A built the hub (deployed and checked live on 18 October); phase B connects the real producers ("Producers" below).

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
| `seo.weekly_report` | none (search data stays off the lock screen) | instant, full body |
| `seo.rule_tripped` | instant | instant, full body |
| `compliance.source_changed` | instant; `link` is the changed source | instant, with the detail |
| `compliance.monitor_failed`, `seo.watch_failed` | instant | instant |
| `platform.*` | when firing starts, then a reminder every 24 h while it fires; resolved | digest |
| `windmill.job_failed` | the first now, then at most one "N times" summary per hour per `dedupeKey` (use one key per script). No producer yet: see "Windmill job failures" | digest |
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

### Alertmanager

The receiver URL is `http://windmill.growth.svc.cluster.local:8000/api/r/internal/vspl-alertmanager`. It is in the cluster only: the public ingress routes only `/api/r/webhook/`. The receiver authenticates with `Authorization: Bearer $NOTIFY_ALERTMANAGER_SECRET`, sent through `http_config.authorization.credentials_file`.

- Each alert becomes `{ source: "alertmanager", type: "alert.<alertname>", dedupeKey: "am:<fingerprint>", status }`.
- The `severity` label maps to the event's severity.
- The link points at Alertmanager.
- `Watchdog` and `InfoInhibitor` are ignored.
- Alertmanager re-sends a firing group every `repeat_interval`, and the hub drops those as duplicates.

Routing (vayasya-infra `infrastructure/kube-prometheus-stack/values.yaml`): every alert goes to the receiver `hub` with `continue: true`. Critical alerts, `NtfyNoRunningPods`, `PgMain*` and `Windmill*` also go straight to email from Alertmanager, so the alerts that mean the hub cannot deliver never depend on it. `Watchdog` stays on `null` until there is an external dead-man's switch. The token is the Secret `monitoring/alertmanager-notify` (`extra-manifests/secrets-notify.sops.yaml`), the same value as `NOTIFY_ALERTMANAGER_SECRET`.

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

## Producers (phase B)

| Event | Raised by | When | Shown |
|---|---|---|---|
| `application.received` | `talent/lib/run-sync-crm.ts` `syncOne` (the CRM step of `f/talent/dispatch`, and `f/talent/sync_crm`); text in `talent/lib/notify-application.ts` | once the Twenty person and application exist, before `crm_sync` is written, so a retry raises it again and the dedupeKey `application:<ref>` sends it once; an acknowledgement update raises nothing | title and summary: ref, role, area answer, cluster, form, language (fixed lists only); `pii { name, phone }`; "View in Twenty" opens the person |
| `lead.received` | `leads/lib/run-leads.ts` `runLeadsSync` (`f/leads/sync_crm`); text in `leads/lib/lead-notify.ts` | once the crew request (opportunity) is in Twenty; `lead:<caseId>` | crew size, first service, cluster, case ID, source page; `pii { name, company, phone }`; `notice` when the site flagged it qualified (the enquiry's Flags line), else `info` |
| `lead.forward_failed` | the same, `lead-dead:<caseId>` | when the lead's delivery hits its cap (eight attempts) | the case ID and the error's HTTP status only |
| `lead.email_failed` | the website, `src/server/submissions/types/business-enquiry.ts` through `src/server/notify.ts` (ingest, from `after()`) | when the MSG91 staff email throws; `lead-email:<caseId>` | the case ID and the route, no personal data |
| `platform.sms_unknown`, `platform.deliveries_dead`, `…_stuck`, `…_overdue`, `platform.erasure_failed`, `platform.db_unreadable` | `f/platform/health`, every 15 minutes (`platform/lib/health-notify.ts`) | firing when a condition starts and resolved when it clears, keyed `platform:health:<database>:<reason>[:<target>]`; health reads the hub's key states, so a condition that stays (the 11 October SMS `unknown`) is one push, then the routing table's daily reminder | counts and the oldest item's time; overdue and an unreadable database are critical (instant email too) |
| `compliance.source_changed`, `compliance.source_unreachable`, `compliance.source_recovered` | `scripts/wage-monitor` with `--notify hub` (`reportToHub` in `report.mjs`) | one per state and topic per run, keyed on the hash of the changes' fingerprints, and recorded in the snapshot (`state.hub.reported`) apart from Chatwoot's | state, topic and a count; the Chatwoot Markdown in the email body |
| `compliance.monitor_failed` | the same, on a failed run (once a day); and `.github/workflows/wage-monitor.yml`'s `notify-failure` job | | the error's first lines in the email only |
| `seo.weekly_report`, `seo.rule_tripped`, `seo.watch_failed` | `scripts/seo-watch` with `--notify hub` (`scripts/seo-watch/hub.mjs`) | weekly, keyed per week (failure per day) | the week and the rule's status; Search Console figures only in the email body |
| `search.pipeline_failed` | `.github/workflows/search.yml`'s `notify-failure` job | when any job of the run failed; the run is the link | |
| `alert.<alertname>` | Alertmanager | see "Alertmanager" | |

The monitors take `--notify` as a comma list. In the cluster they run `--notify chatwoot,hub` until Chatwoot is retired. The hub goes first: if Chatwoot then fails, the run fails without saving the snapshot, and the retry's hub events carry the same dedupeKeys, so the hub sends them once.

The GitHub jobs post to the public route with the repository secret `NOTIFY_INGEST_SECRET`. Without the secret they print a line and succeed.

### Windmill job failures

`windmill.job_failed` would come from a workspace error handler (`f/notify/on_error`). Windmill CE v1.822 does not run one: the workspace error handler is called from Windmill's enterprise code only (`windmill-queue/src/jobs.rs` at v1.822.0: `apply_completed_job_error_handlers` and the schedule handlers are behind `#[cfg(all(feature = "enterprise", feature = "private"))]`; `send_error_to_workspace_handler` has no caller in the open-source code). CE calls the handler only when it cannot push a schedule's next run. So none is set up, and `deploy.mts` does not set one. What covers failures instead:

- the producers' own outcomes: dead and stuck deliveries through `f/platform/health`, `lead.forward_failed`;
- `WindmillServerNoRunningPods` and `WindmillWorkerNoRunningPods` (Alertmanager, by email);
- Windmill's Runs page (filter by failed).

If job failures need their own pushes later, a scheduled script can read the failed runs from Windmill's API (`GET /api/w/vspl/jobs/completed/list?success=false`), keyed per script and collapsed hourly by the existing rule. It must emit the path and run link only, never the job's arguments.

## Phase B owner steps

In order. The cluster CronJobs download the website's `main`, so the website PR goes first: the CronJobs' new `--notify chatwoot,hub` would fail on the old scripts.

1. **Merge the website PR** ("Notifications: phase B, every source into the hub"). Vercel deploys the site.
2. **Vercel env** (Production): `NOTIFY_URL=https://hooks.vayasyaseva.com/api/r/webhook/vspl-notify` and `NOTIFY_INGEST_SECRET` (the value in `growth/windmill-notify`), then redeploy. Until then `lead.email_failed` is not sent; nothing else changes.
3. **Deploy Windmill**: `pnpm windmill:build && pnpm windmill:deploy --enable-notify`. It pushes the talent, leads and health scripts and turns on `f/platform/health`'s 15-minute schedule (only with `--enable-notify`).
4. **The policy variable**: the weekly SEO report is now email only in `DEFAULT_POLICY`. The live `f/notify/policy` keeps the old rule (one-line push) until you change it: either `pnpm windmill:deploy --reset-notify-policy` (if you have not edited it) or edit the `seo.weekly_report` rule's push mode to `none` in the Windmill UI.
5. **Merge the vayasya-infra PR** ("Notifications: Alertmanager into the hub, Windmill/Twenty alerts, monitors dual-write"). Argo syncs Alertmanager's new routing and Secret, the new PrometheusRules and the CronJobs.
6. **GitHub secret**: add the repository secret `NOTIFY_INGEST_SECRET` (the same value) for the `notify-failure` jobs of `search.yml` and `wage-monitor.yml`.
7. **Check**: a test application and a test lead each give one push (with the right phone shown); `f/platform/health` gives one push for the old SMS `unknown` and none at the next checks; the infra RUNBOOK's `amtool alert add` test gives a push on `vspl-ops`; the next compliance monitor run's log ends without errors.
8. **Later**: an external dead-man's switch for `Watchdog` (for example a free heartbeat service), then route `Watchdog` to it instead of `null`. Retire the monitors' Chatwoot path once the hub is trusted (`--notify hub`).
