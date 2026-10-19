# Operating the talent pipeline

The SQL and rules for running `f/talent/*` (see README.md for the layout and deploy). Moved here from the n8n README when `integrations/n8n` was removed (17 October 2026); the tables and statuses are the ones the n8n workflows used.

## Deliveries: stuck, dead and unknown work

Since roadmap 1F every application has a row in `deliveries` per
target (`sms`, `chatwoot`, `crm`, and since 18 Oct 2026 `files`), and one worker, `f/talent/dispatch`,
runs them every minute on one connection. A failed attempt waits 1, 2, 4…
minutes (at most an hour); at its cap (SMS 3, Chatwoot 3, CRM 8, files 8) the row is
`dead`. An SMS whose send was ambiguous or interrupted is `unknown` and is
never sent again automatically. The older columns (`submissions.status`,
`sms_acknowledgements.status`, `crm_sync`) are still written by each step;
the view `delivery_status` shows the old statuses from the deliveries.
`f/platform/health` counts what needs a person and, every 15 minutes, tells the notification hub when a count starts or stops (one push, then a daily reminder while it lasts).

```sql
-- In the talent database: everything that needs a person
SELECT ref, target, status, attempts, last_error, reason FROM deliveries_attention ORDER BY updated_at;

-- One application, every target, in the old words
SELECT * FROM delivery_status WHERE ref = 'VS-J-XXXXXX';

-- Retry a dead Chatwoot delivery (after fixing the cause)
UPDATE submissions SET status = 'received', attempts = 0, last_error = NULL WHERE ref = 'VS-J-XXXXXX';
UPDATE deliveries SET status = 'pending', attempts = 0, next_attempt_at = now(), last_error = NULL, updated_at = now()
WHERE target = 'chatwoot' AND submission_id = (SELECT id FROM submissions WHERE ref = 'VS-J-XXXXXX');

-- Settle a row by hand (done elsewhere, or not to be retried): it leaves the health counts
UPDATE deliveries SET status = 'done', last_error = 'Settled by hand: <why>', done_at = now(), updated_at = now()
WHERE target = 'sms' AND submission_id = (SELECT id FROM submissions WHERE ref = 'VS-J-XXXXXX');
```

Run history and errors are in Windmill (Runs, filter by `f/talent/dispatch`). Chatwoot can save a message and still answer 500, so a delivery that got as far as "delivered" is never posted again.

The lead inbox (the `leads` database) has the same shape: `leads` and
`deliveries` (target `crm`, eight attempts), worked by `f/leads/sync_crm`.

```sql
-- In the leads database
SELECT case_id, status, attempts, last_error, reason FROM deliveries_attention ORDER BY updated_at;
UPDATE deliveries SET status = 'pending', attempts = 0, next_attempt_at = now(), last_error = NULL, updated_at = now()
WHERE lead_id = (SELECT id FROM leads WHERE case_id = 'REQ-…');
```

## Applicants' files in Twenty

The `files` target copies each application's photos and documents from R2 into Twenty, as attachments on the Application named `VS-J-XXXXXX-<n>.<ext>` (README, "Applicants' files into Twenty"). R2 keeps files 90 days: the backfill of earlier applications must finish before about **25 December 2026**, when the first ones (from 26 September) expire.

```sql
-- Backfill progress, per file (pending: not yet copied; missing: gone from R2; skipped: voice notes)
SELECT crm_file_status, count(*) FROM attachments GROUP BY 1;

-- Per application: files deliveries by status, and the oldest still waiting
SELECT status, count(*), min(created_at) AS oldest FROM deliveries WHERE target = 'files' GROUP BY 1;

-- Waiting for the CRM step (no Twenty application yet): fix the crm row first
SELECT s.ref, d.attempts, d.last_error FROM deliveries d JOIN submissions s ON s.id = d.submission_id
LEFT JOIN crm_sync c ON c.submission_id = d.submission_id
WHERE d.target = 'files' AND d.status = 'pending' AND c.application_id IS NULL;

-- One application's files
SELECT position, kind, crm_file_status, crm_file_error, crm_file_at FROM attachments
WHERE submission_id = (SELECT id FROM submissions WHERE ref = 'VS-J-XXXXXX') ORDER BY position;

-- Retry a dead files delivery (after fixing the cause, e.g. the key's Upload files permission)
UPDATE deliveries SET status = 'pending', attempts = 0, next_attempt_at = now(), last_error = NULL, updated_at = now()
WHERE target = 'files' AND submission_id = (SELECT id FROM submissions WHERE ref = 'VS-J-XXXXXX');
```

An error naming the **Upload files permission (UPLOAD_FILE)** means the Windmill API key's role in Twenty lacks it (Settings → Roles).

## SMS acknowledgement (Fast2SMS)

Since 20 October 2026 the acknowledgement goes on WhatsApp first and this SMS
is the fallback (README, "The WhatsApp acknowledgement"). To see both:

```sql
SELECT s.ref, s.locale, a.wa_status, a.wa_delivery, a.wa_detail, a.status AS sms, a.delivery_status AS sms_delivery
FROM sms_acknowledgements a JOIN submissions s ON s.id = a.submission_id
ORDER BY a.created_at DESC LIMIT 20;
```

Every newly saved application, including quick/long forms and agent submissions,
queues one row in `sms_acknowledgements` in the same database statement as the
application. After answering HTTP 202, intake starts `f/talent/dispatch` for that
application's SMS; the every-minute dispatcher picks up pending rows if that
run does not get to it. Chatwoot delivery does not wait for SMS. Setup does not queue historical applications.

The account's existing approved DLT sender **VAYSPL** and Fast2SMS message ID
**227115** are used with the reference as the only variable:

> Vayasya Seva received your job application. Ref {#VAR#}. We will contact you on this number about work.

All locales currently receive this approved English text. New language versions
need their own approved DLT templates before changing the acknowledgement
(`talent/lib/sms.ts`). Requests use
`POST https://www.fast2sms.com/dev/bulkV2`, route `dlt`, a ten-digit Indian number,
`variables_values` = reference, and `udf1` = reference. The API key is only in the
secret Windmill variable `f/talent/fast2sms_api_key`, never in code, the browser or Vercel.

The database row is unique per application. Atomic claims with `SKIP LOCKED`
prevent concurrent runs from sending it twice. `accepted` means Fast2SMS
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
UPDATE deliveries SET status = 'pending', attempts = 0, next_attempt_at = now(), last_error = NULL, updated_at = now()
WHERE target = 'sms' AND submission_id = (SELECT id FROM submissions WHERE ref = 'VS-J-XXXXXX');
```

Fast2SMS's DLT Manager API can list templates and import an already approved DLT
content template (`/dev/dlt_manager/add_template`). Import requires the principal
entity ID, approved sender, DLT template ID, exact approved text, template type and
a hosted screenshot proving approval. It does not obtain telecom DLT approval.
The acknowledgement template is already approved and mapped, so no separate
assets are needed for the current acknowledgement.

Verified live on 7 October 2026: application `VS-J-SMS7A2` returned HTTP 202,
Fast2SMS accepted request `S6ueHXZGarwwIAh`, and its SMS Logs API reported
**Delivered** (one English SMS, INR 0.25). Replaying the same application
returned 202 again and kept the same provider request ID with one send attempt.


## The worker list (`people`)

Intake upserts one `people` row per mobile number with every new submission (PLAN §8.2): name, clusters, home area, roles (the role page and the work answers), language, consent version, `last_applied_at` and `last_contact_at`. `f/talent/setup` creates the table (it filled it once from existing submissions). Lists merge; the newest name and language win.

`last_contact_at` is the retention clock. Only something the person does renews it: a new application, a reply, or a confirmation on a call. Calls or SMS we send that go unanswered never renew it. When a person confirms on a call, record it:

```sql
UPDATE people SET last_confirmed_at = now(), last_contact_at = now(), updated_at = now()
WHERE phone = '+91XXXXXXXXXX';
```

## Retention and erasure

`f/talent/retention` runs hourly. Each run:

1. queues everyone whose last contact (`last_contact_at` or `last_confirmed_at`) is more than 12 months old, plus older submissions with no `people` row, as `erasure_requests` with reason `retention`;
2. takes one queued request and deletes, in this order: the person's R2 files, their Chatwoot contacts (which deletes their conversations), their applicant records in Twenty (each application's attachments, trashed ones too, before the application, since deleting an application only unlinks them; the person's own attachments with the person), then their submissions (attachments and SMS rows go with them) and their `people` row. The Twenty step and the row delete hold the dispatcher's lock, so the dispatcher skips those runs;
3. marks the request `done`, keeping only the counts: the phone and reference are cleared.

An R2 or Chatwoot failure stops the run before any row is deleted; the request goes back to `pending` after an hour and fails after three attempts. One request per run keeps each run short; raise the schedule if the queue grows.

**A person's own request** (privacy notice §10: an email with their mobile number and reference). Check the reference matches the number, then queue it:

```sql
INSERT INTO erasure_requests (phone, ref, reason)
SELECT phone, ref, 'request' FROM submissions
WHERE ref = 'VS-J-XXXXXX' AND phone = '+91XXXXXXXXXX'
LIMIT 1
ON CONFLICT (phone) WHERE status IN ('pending', 'running') DO NOTHING;

-- Progress
SELECT reason, status, attempts, last_error, removed_submissions, removed_files, removed_contacts, removed_crm_files, requested_at, processed_at
FROM erasure_requests ORDER BY requested_at DESC LIMIT 20;
```

Reply to the person once the request shows `done`.

**Switching it on** was done at cutover: hand-run `f/talent/retention` once with a test request queued, check R2, Chatwoot, Twenty and the tables, then `pnpm windmill:deploy --enable-retention`. Erasure also removes the applicant side in Twenty (`erasePerson`), keeping a client contact who shares the number. An enquiry never reuses an applicant's record (`recordLead` creates its own client contact), so the applicant's name goes with the worker record; a kept contact still typed worker, or named `Applicant VS-J-…`, is renamed "Client contact".

## Enquiry erasure

A business enquiry (crew request, site assessment, compliance help) is erased on request by `f/leads/erase`, hourly at :30 and by hand. Nothing is queued automatically: enquiry retention is still to be decided (docs/architecture-roadmap.md). Queue a request in the `leads` database by case ID, or by phone for every enquiry from that number:

```sql
INSERT INTO erasure_requests (case_id) VALUES ('REQ-20261018-XXXXXXXX');
INSERT INTO erasure_requests (phone) VALUES ('+91XXXXXXXXXX');

-- Progress
SELECT status, attempts, last_error, removed_leads, removed_opportunities, removed_people, removed_companies, removed_crm_files, requested_at, processed_at
FROM erasure_requests ORDER BY requested_at DESC LIMIT 20;
```

Each run takes one request and, holding the lead sync's lock:

1. in Twenty, deletes each enquiry's crew request (opportunity) with its enquiry communications, files, notes and tasks (a note or task linked to another record stays, without its link);
2. deletes the contact unless another crew request still names them; a contact who is also an applicant keeps the worker side, renamed `Applicant VS-J-…` and without company, job title or email; by phone, client contacts on the number go too;
3. deletes the company only when no person, crew request, note or task is left on it;
4. deletes the inbox rows (their deliveries go with them) and marks the request `done`, keeping only the counts: case ID and phone are cleared.

A Twenty failure stops the run before any row is deleted; the request goes back to `pending` and fails after three attempts, which `f/platform/health` reports (`platform.erasure_failed`, leads). The staff email already sent and the hub's event (case ID and counts; its `pii` is cleared within a day) are not touched. An applicant erasure for the same number is separate: queue it in `talent` (above).

## SMS templates (DLT)

Sender `VAYSPL`, entity 1601762179117932232, all Service Implicit. The account holds 18 templates (export of 16 October 2026); keep the total under 20.

- **Active:** Job Application Received - English (`1677100000000394062`, Fast2SMS message 227115, the only one wired in), Interview Scheduled, Joining Details, Shift Change.
- **Sent for modification:** 14 more (missed call, still looking, details deleted, position filled, verification code, documents, wages, PF/ESI numbers, absence, client enquiry, deployment, invoice, payment). Edit and resubmit these in the DLT portal rather than adding new ones. For job seekers, drop the "call us on {#var#}" variables (seekers are not offered the business phone).
- **Submitted 16 October 2026 (bulk content template):** the Hinglish and Hindi application acknowledgements:

| Language | Text |
|---|---|
| Hinglish (hi-Latn-IN) | Vayasya Seva ko aapka job application mila. Ref {#var#}. Aapke area mein kaam hone par hum isi number par call karenge. Koi fee nahi lagti. |
| Hindi (hi-IN) | Vayasya Seva को आपका नौकरी का आवेदन मिला। Ref {#var#}। आपके इलाके में काम होने पर हम इसी नंबर पर कॉल करेंगे। कोई फ़ीस नहीं लगती। |

The Hindi template is Unicode SMS (70 characters a part), so it is sent and billed as two parts. Once both are approved and imported into Fast2SMS, pick the message id by the submission's `locale` in the acknowledgement (`talent/lib/sms.ts`) (`hi-IN`, `hi-Latn-IN`/`hinglish`, else 227115). Delete the duplicate "Job Application Received - English v2" to stay at 19.
