# Job seeker intake: Windmill scripts

The VSPL talent pipeline, ported from n8n (`integrations/n8n`, which stays live until cutover) to the growth cluster's Windmill CE (v1.822.0), workspace **`vspl`**. Same SQL, same claims and retries, same retention order; the website does not change.

```
website ──POST──► hooks.vayasyaseva.com/webhook/vspl-talent-intake
                  (Traefik → Windmill /api/r/webhook/vspl-talent-intake)
                  f/talent/intake       checks x-vspl-intake-secret, validates, saves (talent DB),
                                        answers 202 { ok, ref }, starts the SMS acknowledgement
                  f/talent/acknowledge  started by intake for that submission; every minute for
                                        anything due, after flagging interrupted sends "unknown"
                  f/talent/deliver      every minute: Chatwoot contact + conversation in the
                                        "Jobs, website" inbox, the note, then each file
                  f/talent/retention    hourly: the 12-month rule and erasure requests,
                                        across R2, Chatwoot, Twenty CRM and the talent DB
                  f/talent/sync_crm     every minute (second 30): new applications into Twenty CRM
                                        as person + application + SMS acknowledgement; changed
                                        acknowledgements updated (crm_sync table)
                  f/talent/setup        the schema (talent/schema.sql), run by every deploy

Fast2SMS delivery reports ──POST──► hooks.vayasyaseva.com/api/r/webhook/fast2sms-dlr
                  f/talent/delivery_report  checks x-vspl-dlr-secret (or ?key=), marks the
                                        acknowledgement delivered / failed; sync_crm carries it
                  f/talent/delivery_check   every 15 minutes: looks up (DLR API) reports that
                                        never came, ten minutes to 7 days after acceptance

website /api/contact, /api/agent/contact ──POST (after the response)──►
                  hooks.vayasyaseva.com/api/r/webhook/vspl-lead
                  f/leads/intake        checks x-vspl-lead-secret, files the company, client
                                        contact, crew request and enquiry in Twenty, answers 202
```

Twenty's side (the model, views, setup) is `integrations/twenty/README.md`.

The Sarvam transcribe workflow is not ported (voice notes ended 16 October 2026).

## Layout

| Path | What |
|---|---|
| `talent/scripts/*.ts` | Script entries: `main` (and intake's `preprocessor`). Thin: they wire the real database, Fast2SMS, Chatwoot and R2 into `talent/lib/run-*.ts`. |
| `talent/lib/run-*.ts` | What each script does, step by step, with its outside world injected (the tests drive these). |
| `talent/lib/sql.ts` | Every query, copied verbatim from `integrations/n8n/build.mts`. |
| `talent/lib/{validate,sms,note,erasure,mask}.ts` | The n8n Code nodes, as plain functions. Validation reuses the website's `src/lib/talent-intake/rules.ts`. |
| `talent/lib/{config,db,r2,chatwoot}.ts` | Windmill variables, Postgres (`postgres` npm, one connection per run), R2 (`aws4fetch`), Chatwoot. |
| `talent/lib/response.ts` | How a sync HTTP route answers: `{ wm_status_code, result }` (the body is `result` only). |
| `talent/schema.sql` | The `talent` schema: the n8n copy plus `crm_sync` (a test checks the n8n part is unchanged). |
| `talent/lib/{twenty,crm}.ts`, `run-sync-crm.ts` | Twenty's REST API, the talent→Twenty mapping and erasure, and the sync step by step. |
| `leads/scripts/intake.ts`, `leads/lib/lead.ts` | The website's leads into Twenty (validation, company, contact, crew request, enquiry). |
| `scripts.mts` | The scripts: summary, argument schema, schedule, HTTP route. Shared by build and deploy. |
| `build.mts` | Generates `f/talent/<name>.ts` (one self-contained Bun file: relative imports inlined, npm imports kept) and `<name>.script.yaml`. |
| `f/talent/*`, `f/leads/*` | **Generated.** Never edit by hand. |
| `deploy.mts` | Pushes everything to Windmill over its API (below). |

```bash
pnpm windmill:check            # type-check the sources (part of pnpm type-check)
pnpm windmill:test             # intake, acknowledgement, deliver, retention, generated files
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

**Schedules are created disabled.** `--enable-schedules` turns on acknowledge, deliver, sync_crm and delivery_check; `--enable-retention` turns on retention (after a hand-run check, as with n8n). A later deploy without the flags leaves each schedule as it is.

Cron is Windmill's six-field form (seconds first), timezone Asia/Kolkata: acknowledge and deliver `0 * * * * *`, sync_crm `30 * * * * *`, delivery_check `0 */15 * * * *`, retention `0 0 * * * *`.

## Behaviour (unchanged from n8n unless noted)

- **Intake** answers 202 `{ ok: true, ref }` once saved; a replayed reference answers 202 and saves and sends nothing. A wrong or missing secret answers **403**; an invalid payload answers **400** `{ ok: false, error: "Invalid submission: …" }` (n8n threw, which answered 500; the website treats any non-202 the same). The preprocessor passes only `authorized` and the body to `main`, so the secret never appears in job arguments.
- **SMS**: unchanged rules: `accepted` needs HTTP 200, `return: true` and a request ID; explicit 400/401 rejections are `failed`; 429 retries up to three attempts; everything else, and sends interrupted for five minutes, is `unknown` and never resent automatically. One SMS per run.
- **Deliver**: one submission per run; contact creation retries (3 × 5 s), messages never retry; a run that fails before "delivered" is recovered after 15 minutes, `failed` after three attempts. A failed attachment does not stop the others.
- **Retention**: R2 files, then Chatwoot contacts, then the person's Twenty records (communications, applications, person), then rows; any R2, Chatwoot or Twenty failure stops the run before a row is deleted. **Change:** a Chatwoot contact that is already gone (404) counts as deleted; n8n failed the erasure on it.
- **Connections**: one Postgres connection per run. The `talent` role is capped at 5 connections on pg-main, shared with n8n while both run.

- **CRM sync**: ten submissions a run (Twenty allows the API key 100 requests a minute, shared with the leads route); a 429 ends the run quietly and the rest go next minute. One failing submission is logged by reference and retried next run. A person is matched by phone; staff's worker status (callable, placed) is never downgraded, but a do-not-contact request always wins.
- **Delivery reports** (new, no n8n equivalent): `sms_acknowledgements.delivery_status` is `delivered`, `failed` or `pending`, with Fast2SMS's own status and text in `delivery_detail`; a late or repeated report never turns delivered back. Only accepted acknowledgements are touched; reports for other messages answer 200 `matched: 0` so Fast2SMS stops retrying. The preprocessor keeps only the request ID, status, text and time, so no phone number lands in job arguments. In Twenty the Communication's Delivery becomes **Delivered** or **Failed** (with the reason in Error). Fast2SMS keeps reports about 7 days: acknowledgements from before 11 October 2026 stay Sent.
- **The webhook** is made once in the Fast2SMS dashboard (its API answers 401 to creating one): `node integrations/windmill/fast2sms-webhook.mts` prints the values and confirms it exists; `--copy-secret` puts the header value on the clipboard.
- **Leads**: a replayed case ID answers 202 and changes nothing; errors answer a bare 500. The website posts in `after()`, so a slow or failing route never touches the form, and the email to the shared inbox stays the primary path.

## Operating it

The SQL in `integrations/n8n/README.md` ("Operating it", "SMS acknowledgement", "Retention and erasure") applies unchanged: same tables and statuses. Run history and errors are in Windmill (Runs, filter by `f/talent/`); job arguments include applicants' phone numbers, so keep Windmill's job retention short (instance setting).

Run a script by hand: Windmill UI, or `POST /api/w/vspl/jobs/run_wait_result/p/f/talent/<name>` with `{}`.

## Cutover

1. Deploy with schedules off; send a test application straight to `/api/r/webhook/vspl-talent-intake` (with the secret, `ref` `VS-J-TEST…`) and check: 202, the row, the SMS row `accepted`, and the people upsert. Run deliver by hand once and check Chatwoot.
2. Point Traefik's `hooks.vayasyaseva.com/webhook/vspl-talent-intake` at Windmill's `/api/r/webhook/vspl-talent-intake` (vayasya-infra, n8n webhook ingress). The website does not change.
3. Unpublish n8n's acknowledge and deliver, then `pnpm windmill:deploy --enable-schedules`. (Running both at once is safe for duplicates, since every claim is `SKIP LOCKED`, but shares the 5 talent connections.)
4. Hand-run retention once (queue a test request first), then `--enable-retention` and unpublish n8n's retention.
5. Remove `integrations/n8n` and its CI steps; move the secrets to `windmill-env` and deploy with `--secrets-from=windmill-env`.
