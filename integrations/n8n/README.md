# Job seeker intake: n8n workflows

The `/jobs` pages on the website collect a phone number, consent and whatever a person wants to send: a voice note, photos, PDF or Word files, or a typed message. These workflows take it from there. No AI reads it; staff see the originals in Chatwoot.

```
website ──POST──► VSPL talent · intake      checks and saves the submission (talent DB), answers 202
                  after 202: Fast2SMS DLT acknowledgement with the reference
                  VSPL talent · acknowledge every minute: picks up queued SMS, flags interrupted sends
                  VSPL talent · transcribe  every minute: voice notes → Sarvam saaras:v4 → transcript
                  VSPL talent · deliver     every minute: Chatwoot contact + conversation in the
                                            "Jobs, website" inbox, message with text and transcripts,
                                            then each file attached
```

Live since 26 September 2026 on the growth cluster's n8n (verified end to end, including a 10-second note through REST and a 35-second note through Batch). Infrastructure is in `vayasya-infra`, RUNBOOK section "Talent intake".

## The website side (`/api/jobs/*`)

1. `POST /api/jobs/start` `{ source, turnstileToken, files: [{ kind, mime, size, name }] }`:
   - checks Turnstile;
   - issues the reference (`VS-J-` plus 6 characters, with no 0/O or 1/I, since it's read out on the phone);
   - returns one presigned R2 `PUT` URL per file, valid for 15 minutes, with `Content-Type` signed in;
   - returns a signed ticket, valid for an hour, that binds the reference, source and declared files.
2. The browser uploads each file straight to R2 with the given headers.
3. `POST /api/jobs/submit` `{ ticket, phone, adult: true, consent: true, text }`:
   - checks the ticket;
   - `HEAD`s every upload: a missing one gets 409, and one larger than declared is deleted and gets 413;
   - takes the attachment list from the ticket, never from the browser;
   - stamps the consent version and time on the server;
   - validates everything against `talentIntakeSchema` and forwards it to the n8n webhook. n8n answers 202.

AI agents have their own open routes with no Turnstile, documented in `/openapi/v1.json` and `/llms.txt`: `POST /api/agent/jobs` sends a text-only application in one request, and `/api/agent/jobs/start` plus `/api/agent/jobs/submit` work like the two steps above when there are files. Their payloads carry `channel: "agent"` and the agent's name if it gave one; n8n saves them in `submissions.channel` and `agent_name`, the Chatwoot note says an agent sent it, and the conversation gets `submitted_via: agent`. They are rate limited per IP and per phone number (`src/lib/talent-intake/agent.ts`).

Code: `src/lib/talent-intake/{rules,contract,server,submit,agent}.ts`, `src/app/api/jobs/{start,submit}/route.ts` and `src/app/api/agent/jobs/**/route.ts`. Tested locally against the real R2, n8n, Sarvam and Chatwoot: the full flow worked. A forged ticket, a submit before upload, a wrong `Content-Type` on the upload, an oversized upload and a disallowed file type were all rejected.



| Path | What |
|---|---|
| `src/nodes/*.ts` | Code-node sources, in TypeScript. `$("Node")` is typed by `src/n8n-globals.d.ts`. |
| `src/types.ts` | Row and node-output types, mirroring `schema.sql`. |
| `../../src/lib/talent-intake/` | The website's Zod contract (`contract.ts`) and the rules shared with n8n (`rules.ts`). |
| `build.mts` | Generates `workflows/*.json`: compiles the nodes, inlines their imports, checks node references. |
| `deploy.mts` | Imports credentials and workflows into n8n over kubectl, runs setup, publishes, restarts n8n. |
| `workflows/*.json` | **Generated.** Never edit by hand. |
| `schema.sql` | The `talent` database schema, applied by the setup workflow (safe to re-run). |

```bash
pnpm n8n:check           # type-check the sources
pnpm n8n:test            # SMS acceptance, rejection, ambiguity and retry limits
pnpm n8n:build           # regenerate workflows/*.json
pnpm n8n:build --check   # CI: fail if the JSON is stale
pnpm n8n:deploy          # ship to n8n (needs kubectl access to the cluster, WARP on)
pnpm talent:sync-secrets # copy the jobs form's secrets into Vercel (production + preview)
```

`talent:sync-secrets` sets `TALENT_R2_ACCESS_KEY_ID` / `TALENT_R2_SECRET_ACCESS_KEY` (write-only token, from `vayasya-infra/vercel/vayasyaseva.com.sops.yaml`), `TALENT_INTAKE_WEBHOOK_SECRET` (from `growth/n8n-env`) and `TURNSTILE_SECRET_KEY` (OpenTofu output). They are sensitive Vercel variables, which Vercel doesn't allow for Development, so local development uses Cloudflare's Turnstile test keys. It needs a logged-in, linked Vercel CLI. Re-run it after rotating any of them.

`n8n:deploy` is idempotent: workflows and credentials keep fixed ids. It reads every secret from the cluster and pipes it into the n8n pod; nothing is printed or written locally.

| n8n credential | Source |
|---|---|
| `talent-pg` | Secret `data/pg-main-talent` (talent role on pg-main) |
| `r2-talent-intake` | `TALENT_R2_*` in `growth/n8n-env`: read-only token scoped to `vayasya-talent-intake` |
| `vspl-talent-intake-webhook` | `TALENT_INTAKE_WEBHOOK_SECRET` in `growth/n8n-env`, sent as `x-vspl-intake-secret` |
| `fast2sms-vspl` | Header Auth (`Authorization`), `FAST2SMS_API_KEY` in `growth/n8n-env`; encrypted source: infra `apps/n8n/overlays/growth/secrets.sops.yaml` |
| `sarvam-vspl` | Made by hand in n8n (Header Auth, `api-subscription-key`) |

Chatwoot needs no credential. The deliver workflow uses Chatwoot's public API for the "Jobs, website" API inbox (account 1, inbox 2), which is authorised by the inbox identifier. The deploy script reads that identifier from Chatwoot and fills it into the workflow's **Settings** node, so it is not in git.

## How voice notes are transcribed (checked by hand against Sarvam)

- **Model:** `saaras:v4`. There's no `mode` setting; that exists only on v3. The hi-IN and hi-Latn-IN pages send `language_code: hi-IN`, and the English page sends `unknown`. Auto-detection identified a Hindi clip (0.997) and an English clip (1.0) correctly.
- **REST first:** `POST /speech-to-text`, multipart. It answers in about 0.6 seconds, but audio longer than **30 seconds** gets HTTP 400: "Audio duration exceeds the maximum limit of 30 seconds…"
- **Batch for longer notes:**
  1. Create the job.
  2. Get an upload URL (`upload-files`); it is an Azure blob SAS URL.
  3. `PUT` the audio with `x-ms-blob-type: BlockBlob` (answers 201).
  4. Start the job.
  5. Poll the status (a 35-second note finished in about 7 seconds).
  6. Call `download-files`, then fetch `0.json`. It's served as `application/octet-stream`, so read it as JSON.
- **`keyterms: ["SIDCUL"]` only.** Without it, "SIDCUL" came out as "CIDCO". With a longer list of local names, it came out as "Bahadrabad", which is worse. Recheck this on real voice notes.
- Spoken numbers come back as digits (e.g. a phone number), so ID-number masking applies to transcripts too.

## Check it end to end

```bash
kubectl -n growth get secret n8n-env -o jsonpath='{.data.TALENT_INTAKE_WEBHOOK_SECRET}' | base64 -d \
  | awk '{printf "x-vspl-intake-secret: %s\n", $0}' \
  | curl -s https://hooks.vayasyaseva.com/webhook/vspl-talent-intake -H @- -H 'content-type: application/json' \
      -d '{"ref":"VS-J-TEST99","source":"web_en","phone":"9999900001","adult":true,
           "consent":{"version":"2026-09","at":"2026-09-26T10:00:00Z"},
           "text":"Test submission, please ignore","attachments":[]}'
```

Expect `202` with the reference; a request without the header gets `403`. Within a minute or two, a conversation appears in the "Jobs, website" inbox.

## Operating it

```sql
-- In the talent database: anything stuck or failed
SELECT ref, status, attempts, last_error, created_at FROM submissions
WHERE status IN ('failed', 'delivering') ORDER BY created_at DESC;

SELECT s.ref, a.position, a.transcript_status, a.transcript_error
FROM attachments a JOIN submissions s ON s.id = a.submission_id
WHERE a.transcript_status IN ('failed', 'running');

-- Retry a failed delivery
UPDATE submissions SET status = 'received', attempts = 0, last_error = NULL WHERE ref = 'VS-J-XXXXXX';
```

Execution errors are in the n8n database (`execution_entity`, `execution_data`); successful runs are not kept. Each stage retries up to three times, via its "Recover stuck" step. A voice note that still fails is delivered without a transcript, and the message says so. A Sarvam balance that runs out shows up as HTTP 402 ("No credits available") on the transcribe steps.

**Lessons from bring-up:**
- An n8n Postgres query that returns no rows still outputs one `{success: true}` item, hence the "Claimed any?" checks.
- Chatwoot can save a message and still answer 500, so the nodes that create messages don't retry.


## SMS acknowledgement (Fast2SMS)

Every newly saved application, including quick/long forms and agent submissions,
queues one row in `sms_acknowledgements` in the same database statement as the
application. After answering HTTP 202, intake claims and sends it immediately;
the scheduled **VSPL talent · acknowledge** workflow picks up pending rows if
intake stops before sending. Neither transcription nor Chatwoot delivery waits
for SMS. Setup does not queue historical applications.

The account's existing approved DLT sender **VAYSPL** and Fast2SMS message ID
**227115** are used with the reference as the only variable:

> Vayasya Seva received your job application. Ref {#VAR#}. We will contact you on this number about work.

All locales currently receive this approved English text. New language versions
need their own approved DLT templates before changing the workflow. Requests use
`POST https://www.fast2sms.com/dev/bulkV2`, route `dlt`, a ten-digit Indian number,
`variables_values` = reference, and `udf1` = reference. The API key is only in the
n8n Header Auth credential, never in workflow JSON, browser code or Vercel.

The database row is unique per application. Atomic claims with `SKIP LOCKED`
prevent concurrent executions from sending it twice. `accepted` means Fast2SMS
accepted the request and returned a request ID; it does not prove handset delivery.
Explicit API rejections are `failed`; rate limits retry after a minute, at most
three attempts. Network timeouts, server errors, malformed responses and sends
interrupted for five minutes become `unknown` and are not automatically resent,
because Fast2SMS may already have accepted them.

```sql
SELECT s.ref, a.status, a.attempts, a.request_id, a.last_error, a.accepted_at
FROM sms_acknowledgements a JOIN submissions s ON s.id = a.submission_id
WHERE a.status <> 'accepted' ORDER BY a.created_at DESC;

-- After correcting the cause and checking Fast2SMS history to ensure no SMS
-- was already accepted, explicitly retry one application:
UPDATE sms_acknowledgements SET status = 'pending', attempts = 0,
  next_attempt_at = now(), last_error = NULL, updated_at = now()
WHERE submission_id = (SELECT id FROM submissions WHERE ref = 'VS-J-XXXXXX')
  AND status IN ('failed', 'unknown');
```

Fast2SMS's DLT Manager API can list templates and import an already approved DLT
content template (`/dev/dlt_manager/add_template`). Import requires the principal
entity ID, approved sender, DLT template ID, exact approved text, template type and
a hosted screenshot proving approval. It does not obtain telecom DLT approval.
The acknowledgement template is already approved and mapped, so no separate
assets are needed for the current workflow.

Verified live on 7 October 2026: application `VS-J-SMS7A2` returned HTTP 202,
Fast2SMS accepted request `S6ueHXZGarwwIAh`, and its SMS Logs API reported
**Delivered** (one English SMS, INR 0.25). Replaying the same application
returned 202 again and kept the same provider request ID with one send attempt.
