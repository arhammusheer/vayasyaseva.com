# Job seeker intake: Windmill scripts

The VSPL talent pipeline, ported from n8n (retired 17 October 2026; the workflows are in git history) to the growth cluster's Windmill CE (v1.822.0), workspace **`vspl`**. Same SQL, same claims and retries, same retention order; the website does not change.

```
website (SUBMISSION_SIGNING_SECRET set) ──POST envelope.v1, HMAC──► hooks.vayasyaseva.com/api/r/webhook/vspl-submission
                  f/platform/submission  checks the signature (timestamp + raw body, 5 min skew),
                                        saves a job application (talent DB) or a lead (lead inbox),
                                        answers 202
website without the secret (the older routes, kept as adapters):
                  webhook/vspl-talent-intake → f/talent/intake   (x-vspl-intake-secret)
                  webhook/vspl-lead          → f/leads/intake    (x-vspl-lead-secret)

talent DB         f/talent/dispatch     every minute, and started by intake for the new acknowledgement: the
                                        one worker for the deliveries table (acknowledgement on WhatsApp,
                                        else SMS; Twenty CRM,
                                        files into Twenty, Chatwoot conversation), backoff, caps, dead / unknown;
                                        every 15 minutes also the missing SMS delivery reports
                  f/talent/retention    hourly: the 12-month rule and erasure requests,
                                        across R2, Chatwoot, Twenty CRM and the talent DB
                  f/talent/setup        the schema (talent/schema.sql), run by every deploy
                  f/talent/acknowledge, deliver, sync_crm, delivery_check
                                        the steps the dispatcher runs; their schedules are off
                                        (deploy turns them off), kept for hand runs

lead inbox (leads DB)
                  f/leads/sync_crm      every minute, and started by intake: due leads into Twenty
                                        (company, contact, crew request, enquiry), backoff, cap 8
                  f/leads/setup         the schema (leads/schema.sql), run by every deploy

Fast2SMS delivery reports ──POST──► hooks.vayasyaseva.com/api/r/webhook/fast2sms-dlr
                  f/talent/delivery_report  checks x-vspl-dlr-secret (or ?key=), marks the
                                        acknowledgement delivered / failed; the CRM delivery reruns

site Idempotency-Key store ──POST, HMAC──► webhook/vspl-idempotency
                  f/platform/idempotency  begin / complete / abandon; jobs keys in the talent DB,
                                        contact keys in the lead inbox, kept a day
                  f/platform/health     every 15 minutes (with --enable-notify) and on demand: dead,
                                        unknown, stuck and overdue counts per database and target;
                                        each condition to the notification hub when it starts and clears
```

Twenty's side (the model, views, setup) is `integrations/twenty/README.md`.

The Sarvam transcribe workflow is not ported (voice notes ended 16 October 2026).

## Layout

| Path | What |
|---|---|
| `talent/scripts/*.ts` | Script entries: `main` (and intake's `preprocessor`). Thin: they wire the real database, Fast2SMS, Chatwoot and R2 into `talent/lib/run-*.ts`. |
| `talent/lib/run-*.ts` | What each script does, step by step, with its outside world injected (the tests drive these). |
| `talent/lib/sql.ts` | Every query, copied verbatim from the n8n workflows when they were ported. |
| `contracts/validate.ts` | ajv over the contracts package's generated canonical schemas (`packages/contracts/generated`, inlined by the build). Intake and leads validate with it; the fixture corpus (`packages/contracts/fixtures`) runs through it in `contracts.test.mts`. |
| `talent/lib/intake-payload.ts` | The application checked (ajv, plus the one rule JSON Schema cannot say: file keys under the reference) and shaped for SAVE_SUBMISSION. |
| `talent/lib/{sms,note,erasure,mask}.ts` | The n8n Code nodes, as plain functions, using the shared `packages/contracts/src/rules.ts`. |
| `talent/lib/{config,db,r2,chatwoot}.ts` | Windmill variables, Postgres (`postgres` npm, one connection per run), R2 (`aws4fetch`), Chatwoot. |
| `talent/lib/response.ts` | How a sync HTTP route answers: `{ wm_status_code, result }` (the body is `result` only). |
| `talent/schema.sql` | The `talent` schema: the n8n copy plus `crm_sync` (a test checks the n8n part is unchanged). |
| `talent/lib/{twenty,crm}.ts`, `run-sync-crm.ts` | Twenty's REST API, the talent→Twenty mapping and erasure, and the sync step by step. |
| `leads/scripts/*.ts`, `leads/lib/{lead,run-leads,sql}.ts`, `leads/schema.sql` | The lead inbox: intake checks business_enquiry.v1 and saves the lead, sync_crm files it in Twenty (company, contact, crew request, enquiry), each record found before it is created. |
| `talent/lib/run-dispatch.ts` | The one dispatcher: claims due `deliveries` rows (SKIP LOCKED, one run at a time by advisory lock) and runs the SMS, CRM, files and Chatwoot steps. |
| `talent/lib/run-files.ts` | The files step: an application's R2 files into Twenty as attachments on its Application (`twenty.ts` `twentyFilesClient` for the upload). |
| `platform/scripts/*.ts`, `platform/lib/*.ts` | The signed envelope route, the Idempotency-Key store and health. `signed.ts` checks `packages/contracts/src/signing.ts`'s HMAC over the raw body. |
| `notify/` | The notification hub (ntfy pushes, Resend email, daily digest): `docs/notification-hub.md`. Other scripts raise notifications with `notify/lib/emit.ts`. |
| `test-db.mts` | PGlite (Postgres in WebAssembly) for the tests that run the schemas and queries as SQL. |
| `scripts.mts` | The scripts: summary, argument schema, schedule, HTTP route. Shared by build and deploy. |
| `build.mts` | Generates `f/talent/<name>.ts` (one self-contained Bun file: relative imports inlined, npm imports kept) and `<name>.script.yaml`. |
| `f/talent/*`, `f/leads/*` | **Generated.** Never edit by hand. |
| `deploy.mts` | Pushes everything to Windmill over its API (below). |

```bash
pnpm windmill:check            # type-check the sources (part of pnpm type-check)
pnpm windmill:test             # intake, acknowledgement, deliver, retention, dispatch, lead inbox, signed route, generated files
pnpm windmill:build            # regenerate f/talent/*
pnpm windmill:build --check    # CI: fail if f/ is stale
pnpm windmill:deploy --dry-run # what deploy would change
pnpm windmill:deploy           # ship (kubectl access, WARP on)
```

## Variables (workspace `vspl`, folder `talent`)

Scripts read `f/talent/<name>` with `wmill.getVariable` (`talent/lib/config.ts`). `deploy.mts` fills them from the cluster; nothing is printed or written locally.

| Variable | Secret | Source (was the n8n credential) |
|---|---|---|
| `talent_pg_url` | yes | `data/pg-main-talent` password, as `postgres://talent:…@pg-main-rw.data.svc.cluster.local:5432/talent` (`talent-pg`) |
| `intake_webhook_secret` | yes | `TALENT_INTAKE_WEBHOOK_SECRET` (`vspl-talent-intake-webhook`) |
| `fast2sms_api_key` | yes | `FAST2SMS_API_KEY` (`fast2sms-vspl`) |
| `r2_read_key_id`, `r2_read_secret` | yes | `TALENT_R2_ACCESS_KEY_ID` / `_SECRET_ACCESS_KEY`, read-only on `vayasya-talent-intake` (`r2-talent-intake`) |
| `r2_erase_key_id`, `r2_erase_secret` | yes | `TALENT_R2_ERASE_*`, delete rights, retention only (`r2-talent-erase`) |
| `chatwoot_admin_token` | yes | `CHATWOOT_TALENT_ADMIN_TOKEN`, user "Automation (retention)" (`chatwoot-talent-admin`) |
| `chatwoot_inbox_identifier` | yes | Read from Chatwoot at deploy (was the deliver workflow's Settings node) |
| `chatwoot_base_url`, `chatwoot_account_id`, `r2_endpoint`, `r2_bucket` | no | Constants in `deploy.mts` |
| `twenty_api_key` | yes | `TWENTY_API_KEY` in `growth/twenty-api` (the workspace key "Windmill (automation)") |
| `twenty_base_url` | no | `http://twenty.growth.svc.cluster.local` |
| `lead_webhook_secret` | yes | `LEAD_WEBHOOK_SECRET` in `growth/windmill-leads`; the website has the same value as Vercel `LEAD_WEBHOOK_SECRET` |
| `leads_pg_url` | yes | `data/pg-main-leads` password (vayasya-infra, RUNBOOK "Leads inbox"), as `postgres://leads:…@pg-main-rw.data.svc.cluster.local:5432/leads` |
| `submission_signing_secret` | yes | `SUBMISSION_SIGNING_SECRET` in `growth/windmill-submission`; Vercel has the same value. Until that Secret exists, deploy sets a random value nobody knows, so the signed routes refuse everything |
| `fast2sms_dlr_secret` | yes | `FAST2SMS_DLR_SECRET` in `growth/windmill-fast2sms`; the `x-vspl-dlr-secret` header of the Fast2SMS webhook |

The `TALENT_*`, `FAST2SMS_*` and `CHATWOOT_*` keys are read from `growth/n8n-env` until n8n is retired; `--secrets-from=<secret>` reads another Secret in `growth` with the same keys. The API token is `SUPERADMIN_SECRET` in `growth/windmill-env`.

## Deploy

`pnpm windmill:build && pnpm windmill:deploy`:

1. reads the secrets and the inbox identifier from the cluster;
2. ensures workspace `vspl` and folder `talent`;
3. upserts the variables;
4. pushes each script as a new version only when its content or metadata changed;
5. runs `f/talent/setup` and waits for it;
6. creates or updates the schedules and the route `/api/r/webhook/vspl-talent-intake` (sync, no Windmill auth: the script checks the secret);
7. warms the route with a wrong secret and expects 403 (the first call after a new version installs dependencies, ~7.5 s).

**Schedules are created disabled.** `--enable-schedules` turns on `f/talent/dispatch` and `f/leads/sync_crm`; `--enable-retention` turns on retention (after a hand-run check, as with n8n). A later deploy without the flags leaves each schedule as it is. The schedules the dispatcher replaced (acknowledge, deliver, sync_crm, delivery_check) are turned off by every deploy; if any of them was on, the dispatcher and the lead sync are turned on in the same deploy, so deliveries never stop in between.

Cron is Windmill's six-field form (seconds first), timezone Asia/Kolkata: acknowledge and deliver `0 * * * * *`, sync_crm `30 * * * * *`, delivery_check `0 */15 * * * *`, retention `0 0 * * * *`.

## Behaviour (unchanged from n8n unless noted)

- **Intake** answers 202 `{ ok: true, ref }` once saved; a replayed reference answers 202 and saves and sends nothing. A wrong or missing secret answers **403**; an invalid payload answers **400** `{ ok: false, error: "Invalid submission: …" }` (n8n threw, which answered 500; the website treats any non-202 the same). The preprocessor passes only `authorized` and the body to `main`, so the secret never appears in job arguments.
- **SMS**: unchanged rules: `accepted` needs HTTP 200, `return: true` and a request ID; explicit 400/401 rejections are `failed`; 429 retries up to three attempts; everything else, and sends interrupted for five minutes, is `unknown` and never resent automatically. One SMS per run.
- **Deliver**: one submission per run; contact creation retries (3 × 5 s), messages never retry; a run that fails before "delivered" is recovered after 15 minutes, `failed` after three attempts. A failed attachment does not stop the others.
- **Retention**: R2 files, then Chatwoot contacts, then the person's Twenty records (each application's attachments, trashed ones too, and communications, then the application; the person's own attachments and the person), then rows; any R2, Chatwoot or Twenty failure stops the run before a row is deleted. The Twenty step and the row delete hold the dispatcher's advisory lock (waiting up to two minutes for a running dispatcher), so no attachment is added mid-erasure; `removed_crm_files` counts the attachments deleted. **Change:** a Chatwoot contact that is already gone (404) counts as deleted; n8n failed the erasure on it.
- **Connections**: one Postgres connection per run. The `talent` role is capped at 5 connections on pg-main, shared with n8n while both run.

- **CRM sync**: ten submissions a run (Twenty allows the API key 100 requests a minute, shared with the leads route); a 429 ends the run quietly and the rest go next minute. One failing submission is logged by reference and retried next run. A person is matched by phone; staff's worker status (callable, placed) is never downgraded, but a do-not-contact request always wins.
- **Delivery reports** (new, no n8n equivalent): `sms_acknowledgements.delivery_status` is `delivered`, `failed` or `pending`, with Fast2SMS's own status and text in `delivery_detail`; a late or repeated report never turns delivered back. Only accepted acknowledgements are touched; reports for other messages answer 200 `matched: 0` so Fast2SMS stops retrying. The preprocessor keeps only the request ID, status, text and time, so no phone number lands in job arguments. In Twenty the Communication's Delivery becomes **Delivered** or **Failed** (with the reason in Error). Fast2SMS keeps reports about 7 days: acknowledgements from before 11 October 2026 stay Sent.
- **The webhook** is made once in the Fast2SMS dashboard (its API answers 401 to creating one): `node integrations/windmill/fast2sms-webhook.mts` prints the values and confirms it exists; `--copy-secret` puts the header value on the clipboard.
- **Leads**: a replayed case ID answers 202 and changes nothing; errors answer a bare 500. The website posts in `after()`, so a slow or failing route never touches the form, and the email to the shared inbox stays the primary path.

## The WhatsApp acknowledgement (20 October 2026)

- **WhatsApp first.** The `sms` delivery sends the reference as the approved Utility template `vspl_application_received` (`_hinglish` for hi-Latn-IN) from the WhatsApp Business number, +91 78958 50598 (Fast2SMS, co-existence with the Business app), so an applicant who replies opens a chat the team answers in the app (`talent/lib/whatsapp-ack.ts`). One send per application, ever.
- **SMS as the fallback.** The dispatcher looks the WhatsApp report up each minute (`GET /dev/whatsapp/{request_id}`; there is no WhatsApp webhook). Delivered or read: done, and the SMS is `skipped`. A refused or unclear send, a failure report, or 10 minutes with neither delivered nor read: the DLT SMS goes as before. Waiting does not use the delivery's three attempts. A language without an approved template in `WA_TEMPLATES` gets the SMS straight away.
- **Columns.** `sms_acknowledgements.wa_status` (`sending`, `accepted`, `failed`, `unknown`, `skipped`), `wa_request_id`, `wa_delivery` (`read`, `delivered`, `failed`, `pending`) with Fast2SMS's text in `wa_detail`. In Twenty the WhatsApp message is its own Communication (channel WhatsApp, Delivery up to **Read**); the SMS has one only when it was sent.
- **Templates.** `node integrations/windmill/whatsapp-templates.mts` shows each language's status and Fast2SMS message id; `--create` submits any missing (submitted 20 Oct 2026). Put approved ids in `WA_TEMPLATES` and deploy. The WhatsApp apply chat that ran on this number (19 Oct 2026) was removed the same day, before its webhook existed; deploy deletes its route, script and variable.

## Deliveries and the lead inbox (roadmap 1F)

- **Deliveries.** Each application gets four rows (a trigger on `submissions`): `sms` (3 attempts), `chatwoot` (3), `crm` (8), `files` (8). A run works them in the order sms, crm, files, chatwoot. The dispatcher claims due rows with `FOR UPDATE SKIP LOCKED`; a failure waits 1, 2, 4… minutes (at most an hour), and at the cap the row is `dead`. An SMS whose send was ambiguous or interrupted is `unknown` and is never resent. When the acknowledgement's status changes (on WhatsApp or by SMS: accepted, delivered, read, failed), a trigger reopens the `crm` row so Twenty shows it. A `wait` (the WhatsApp report not in yet) puts the row back a minute later without counting an attempt. The older status columns are kept and still written; the view `delivery_status` shows the old statuses from the deliveries, and setup carried the existing statuses over once.
- **Connections.** The talent role has five. At most: one intake per request in flight, the dispatcher (one at a time, advisory lock; intake's targeted run exits at once if the dispatcher holds the lock), retention (hourly), a delivery report. The dispatcher replaced four every-minute schedules.
- **Lead inbox.** A lead is saved (inbox row and its `crm` delivery, one statement) before the route answers 202, then filed in Twenty by `f/leads/sync_crm`. A Twenty outage no longer loses a lead; it waits and retries.
- **Signed route.** `x-vspl-timestamp` (Unix seconds) and `x-vspl-signature: v1=<base64url HMAC-SHA256 of "v1:<timestamp>.<raw body>">`; more than five minutes off is refused. The route is created with `raw_string` so the body is checked exactly as signed.
- **Health.** `POST /api/w/vspl/jobs/run_wait_result/p/f/platform/health` with `{}` answers `{ ok, talent: { dead, unknown, stuck, overdue, erasureFailed }, leads: {…}, errors, notified }`. Each condition is a `platform.*` event in the notification hub when it starts firing and when it clears (`platform/lib/health-notify.ts`), not at every run. The CRM steps raise `application.received` and `lead.received` (`docs/notification-hub.md`, "Producers").

## Applicants' files into Twenty (the `files` target)

Since 18 October 2026 each application's photos and documents are copied from R2 (`vayasya-talent-intake`, where they expire after 90 days) into Twenty as attachments on its Application. Twenty stores files on R2 too (`STORAGE_TYPE=S_3`, bucket `vayasya-twenty`).

- **When.** A `files` row is claimable only once the CRM step has recorded `crm_sync.application_id`; until then it waits without spending attempts (and is not counted overdue: the CRM row is). One application's files per run; a 429 from Twenty (the key's 100 requests a minute are shared) ends the CRM and files work for that run.
- **How** (Twenty's direct upload, `talent/lib/twenty.ts`): `createFileUpload(filename, size, fileFolder: FilesField, fieldMetadataId)` on `/metadata`, with the attachment object's `file` field id (looked up once per run); `PUT` the bytes to the upload URL, its host swapped for `twenty_base_url` (Twenty builds it from `SERVER_URL`, behind Cloudflare Access), `Content-Type: application/octet-stream`, the body exactly the downloaded blob's size; `completeFileUpload(fileId)`; then `POST /rest/attachments` `{ name, file: [{ fileId, label }], fileCategory, targetApplicationId }`. The API key's role needs the **Upload files** permission (`UPLOAD_FILE`); without it the delivery's error says so.
- **Labels are neutral:** `VS-J-XXXXXX-<n>.<ext>` (n counts from 1), never the applicant's own file name.
- **Each file** (`attachments.crm_file_status`): `pending`; `done` (with `twenty_file_id`, `twenty_attachment_id`); `missing` (gone from R2: no retry spent); `skipped` (voice notes, kind `audio`, from before 16 Oct 2026, are not copied). `crm_file_error` keeps the last failure.
- **Retries.** The run first lists the application's attachments: a label already there is recorded, not attached again. A saved `twenty_file_id` is completed and attached rather than uploaded again (a reserved file whose bytes never arrived is started afresh). Failures back off like every target; at eight attempts the row is `dead`.
- **Backfill.** Setup queues a `files` row for every earlier application with files, oldest first and two minutes apart (re-running adds only what is missing). The first R2 files expire about 25 December 2026; the queue must drain before then (OPERATIONS.md).

## Operating it

The SQL for stuck work, SMS acknowledgements, the worker list, retention and erasure, and the DLT templates is in [OPERATIONS.md](OPERATIONS.md). Run history and errors are in Windmill (Runs, filter by `f/talent/`); job arguments include applicants' phone numbers, so keep Windmill's job retention short (instance setting).

Run a script by hand: Windmill UI, or `POST /api/w/vspl/jobs/run_wait_result/p/f/talent/<name>` with `{}`.

## Cutover

1. Deploy with schedules off; send a test application straight to `/api/r/webhook/vspl-talent-intake` (with the secret, `ref` `VS-J-TEST…`) and check: 202, the row, the SMS row `accepted`, and the people upsert. Run deliver by hand once and check Chatwoot.
2. Point Traefik's `hooks.vayasyaseva.com/webhook/vspl-talent-intake` at Windmill's `/api/r/webhook/vspl-talent-intake` (vayasya-infra, n8n webhook ingress). The website does not change.
3. Unpublish n8n's acknowledge and deliver, then `pnpm windmill:deploy --enable-schedules`. (Running both at once is safe for duplicates, since every claim is `SKIP LOCKED`, but shares the 5 talent connections.)
4. Hand-run retention once (queue a test request first), then `--enable-retention` and unpublish n8n's retention.
5. Done 17 October 2026: the talent secrets moved to `growth/windmill-talent` (vayasya-infra `apps/windmill/overlays/growth/secrets-talent.sops.yaml`, the deploy default) and `integrations/n8n` and its CI steps were removed. Deleting the n8n app itself (its database, `n8n-env`, the old webhook ingress) is the owner's step, after the rollback window.
