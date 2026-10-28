/**
 * Every query the talent scripts run, copied verbatim from the n8n
 * workflows (retired 17 Oct 2026; in git history) so behaviour is unchanged:
 * atomic claims with FOR UPDATE SKIP LOCKED, recovery of stuck rows,
 * attempt caps and the retention order. Parameters are $1..$n.
 */

/** Privacy notice §10: details are kept up to 12 months after the person last contacts us. */
export const RETENTION_MONTHS = 12;

// --- intake -------------------------------------------------------------------

/** $1..$18 from saveSubmissionParams (intake-payload.ts). A replayed ref inserts nothing and returns submission_id null. */
export const SAVE_SUBMISSION = `
WITH s AS (
  INSERT INTO submissions (ref, source, locale, phone, consent_version, consented_at, adult, text, role, hub, channel, agent_name, form, applicant_name, answers, cluster, page_cluster, page_path)
  VALUES ($1, $2, $3, $4, $5, $6::timestamptz, true, $7, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17, $18)
  ON CONFLICT (ref) DO NOTHING
  RETURNING id
), ack AS (
  INSERT INTO sms_acknowledgements (submission_id)
  SELECT id FROM s
  RETURNING 1
), person AS (
  -- The worker list (PLAN §8.2): an application is the person reaching us,
  -- so it renews last_contact_at. Lists merge; the newest name and language win.
  INSERT INTO people (phone, name, clusters, home_area, roles, locale, consent_version, last_applied_at, last_contact_at)
  SELECT $4, $14,
         CASE WHEN $16::text IS NULL THEN '{}'::text[] ELSE ARRAY[$16::text] END,
         -- Where they live: the exact place when they picked one (answers.home), else the area answer.
         coalesce($15::jsonb #>> '{home,0}', $15::jsonb #>> '{area,0}'),
         ARRAY(SELECT DISTINCT r FROM unnest(array_remove(ARRAY[$9::text], NULL) || ARRAY(SELECT jsonb_array_elements_text(coalesce($15::jsonb -> 'work', '[]'::jsonb)))) AS r),
         $3, $5, now(), now()
  FROM s
  ON CONFLICT (phone) DO UPDATE SET
    name = coalesce(EXCLUDED.name, people.name),
    clusters = ARRAY(SELECT DISTINCT c FROM unnest(people.clusters || EXCLUDED.clusters) AS c),
    home_area = coalesce(EXCLUDED.home_area, people.home_area),
    roles = ARRAY(SELECT DISTINCT r FROM unnest(people.roles || EXCLUDED.roles) AS r),
    locale = EXCLUDED.locale,
    consent_version = EXCLUDED.consent_version,
    status = CASE WHEN people.status = 'do-not-contact' THEN 'active' ELSE people.status END,
    last_applied_at = now(),
    last_contact_at = now(),
    updated_at = now()
  RETURNING 1
), a AS (
  INSERT INTO attachments (submission_id, position, kind, r2_key, mime, size_bytes, original_name, transcript_status)
  SELECT s.id, (x->>'position')::int, x->>'kind', x->>'key', x->>'mime', (x->>'size')::int, x->>'name',
         CASE WHEN x->>'kind' = 'audio' THEN 'pending' ELSE 'none' END
  FROM s, jsonb_array_elements($8::jsonb) AS x
  RETURNING 1
)
SELECT (SELECT id FROM s) AS submission_id, (SELECT count(*) FROM a) AS attachments, (SELECT count(*) FROM ack) AS acknowledgements, (SELECT count(*) FROM person) AS people;`;

// --- acknowledge ----------------------------------------------------------------

// Claims are shared by immediate intake and the scheduled recovery run.
// A timeout can mean the SMS was accepted: never automatically resend it.
const claimAcknowledgement = (filter: string) => `
WITH candidate AS (
  SELECT a.submission_id FROM sms_acknowledgements a
  JOIN submissions s ON s.id = a.submission_id
  WHERE a.status = 'pending' AND a.next_attempt_at <= now() AND a.attempts < 3 AND ${filter}
  ORDER BY a.created_at LIMIT 1 FOR UPDATE OF a SKIP LOCKED
), claimed AS (
  UPDATE sms_acknowledgements a SET status = 'sending', attempts = attempts + 1, updated_at = now()
  FROM candidate c WHERE a.submission_id = c.submission_id RETURNING a.*
)
SELECT c.submission_id, c.attempts, s.ref, s.phone FROM claimed c
JOIN submissions s ON s.id = c.submission_id;`;

/** The scheduled run: the oldest due acknowledgement, if any. */
export const CLAIM_ACKNOWLEDGEMENT = claimAcknowledgement("true");
/** Right after intake: only that submission's ($1). */
export const CLAIM_ACKNOWLEDGEMENT_FOR = claimAcknowledgement("s.id = $1::uuid");

export const RECOVER_INTERRUPTED_SENDS = `
UPDATE sms_acknowledgements SET status = 'unknown',
  last_error = 'Interrupted send; check Fast2SMS delivery history before retrying', updated_at = now()
WHERE status = 'sending' AND updated_at < now() - interval '5 minutes';`;

/** $1 submission id, $2 status, $3 request id, $4 error (AcknowledgementResult). */
export const SAVE_ACKNOWLEDGEMENT_RESULT = `
UPDATE sms_acknowledgements
SET status = $2, request_id = $3, last_error = $4,
    accepted_at = CASE WHEN $2 = 'accepted' THEN now() ELSE accepted_at END,
    next_attempt_at = now() + interval '1 minute', updated_at = now()
WHERE submission_id = $1::uuid AND status = 'sending'
RETURNING submission_id, status;`;

// --- WhatsApp acknowledgement (whatsapp-ack.ts) ---------------------------------

/** $1 submission: the acknowledgement's state, with what the WhatsApp send needs. */
export const GET_ACKNOWLEDGEMENT = `
SELECT a.status, a.wa_status, a.wa_request_id, a.wa_sent_at, a.wa_delivery, a.wa_updated_at, s.ref, s.phone, s.locale
FROM sms_acknowledgements a JOIN submissions s ON s.id = a.submission_id
WHERE a.submission_id = $1::uuid;`;

/** $1 submission, $2 why: no WhatsApp message for it; the SMS goes. */
export const SKIP_WHATSAPP = `
UPDATE sms_acknowledgements SET wa_status = 'skipped', wa_error = $2, wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status IS NULL;`;

/** $1 submission. One WhatsApp send per application, ever. */
export const CLAIM_WHATSAPP_ACK = `
UPDATE sms_acknowledgements SET wa_status = 'sending', wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status IS NULL AND status = 'pending'
RETURNING submission_id;`;

/** $1 submission, $2 accepted|failed|unknown, $3 request id, $4 error. */
export const SAVE_WHATSAPP_RESULT = `
UPDATE sms_acknowledgements
SET wa_status = $2, wa_request_id = $3, wa_error = $4,
    wa_sent_at = CASE WHEN $2 = 'accepted' THEN now() ELSE wa_sent_at END,
    wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status = 'sending';`;

/** $1 submission: a send interrupted five minutes ago may have gone; the SMS goes too. */
export const RECOVER_WHATSAPP_SEND = `
UPDATE sms_acknowledgements
SET wa_status = 'unknown', wa_error = 'Interrupted WhatsApp send; the SMS goes instead', wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status = 'sending';`;

/**
 * $1 submission, $2 read|delivered|failed|pending, $3 Fast2SMS's status and
 * text, $4 when (null: now, for delivered or read). Never moves back from
 * read, or from delivered to anything but read.
 */
export const SAVE_WHATSAPP_REPORT = `
UPDATE sms_acknowledgements
SET wa_delivery = $2, wa_detail = $3,
    wa_delivered_at = CASE WHEN $2 IN ('delivered', 'read') THEN coalesce(wa_delivered_at, $4::timestamptz, now()) ELSE wa_delivered_at END,
    wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status = 'accepted'
  AND wa_delivery IS DISTINCT FROM 'read'
  AND (wa_delivery IS DISTINCT FROM 'delivered' OR $2 = 'read');`;

/** $1 submission: WhatsApp delivered it, so no SMS. */
export const SKIP_SMS = `
UPDATE sms_acknowledgements SET status = 'skipped', last_error = NULL, updated_at = now()
WHERE submission_id = $1::uuid AND status = 'pending';`;

// --- retention ------------------------------------------------------------------

export const QUEUE_EXPIRED_AND_RECOVER = `
WITH recovered AS (
  UPDATE erasure_requests
  SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END,
      last_error = coalesce(last_error, 'Interrupted; retried'), updated_at = now()
  WHERE status = 'running' AND updated_at < now() - interval '1 hour'
  RETURNING id
), expired AS (
  SELECT p.phone FROM people p
  WHERE greatest(coalesce(p.last_contact_at, p.created_at), coalesce(p.last_confirmed_at, p.created_at)) < now() - interval '${RETENTION_MONTHS} months'
  UNION
  -- Submissions from before the people table, with no row of their own.
  SELECT s.phone FROM submissions s
  WHERE NOT EXISTS (SELECT 1 FROM people p WHERE p.phone = s.phone)
  GROUP BY s.phone HAVING max(s.created_at) < now() - interval '${RETENTION_MONTHS} months'
), queued AS (
  INSERT INTO erasure_requests (phone, reason)
  SELECT phone, 'retention' FROM expired
  ON CONFLICT (phone) WHERE status IN ('pending', 'running') DO NOTHING
  RETURNING id
)
SELECT (SELECT count(*) FROM recovered) AS recovered, (SELECT count(*) FROM queued) AS queued;`;

export const CLAIM_ERASURE = `
WITH claimed AS (
  UPDATE erasure_requests e
  SET status = 'running', attempts = e.attempts + 1, last_error = NULL, updated_at = now()
  WHERE e.id = (
    SELECT id FROM erasure_requests WHERE status = 'pending' AND phone IS NOT NULL
    ORDER BY requested_at LIMIT 1 FOR UPDATE SKIP LOCKED)
  RETURNING e.id, e.phone, e.reason
)
SELECT c.id, c.phone, c.reason,
  coalesce((SELECT jsonb_agg(a.r2_key) FROM attachments a JOIN submissions s ON s.id = a.submission_id WHERE s.phone = c.phone), '[]'::jsonb) AS files
FROM claimed c;`;

/** $1 request id, $2 phone, $3 files removed, $4 Twenty attachments removed. Keeps counts only: phone and ref are cleared. */
export const DELETE_ROWS = `
WITH gone AS (
  DELETE FROM submissions WHERE phone = $2 RETURNING id
), person AS (
  DELETE FROM people WHERE phone = $2 RETURNING 1
)
UPDATE erasure_requests
SET status = 'done', processed_at = now(), updated_at = now(),
    removed_submissions = (SELECT count(*) FROM gone), removed_files = $3::int,
    removed_crm_files = $4::int, phone = NULL, ref = NULL
WHERE id = $1::uuid AND status = 'running'
RETURNING id, status, removed_submissions;`;

/** Strips whole-line comments, as the n8n setup workflow did before running the schema. */
export const schemaStatements = (schema: string) => schema.replace(/^--.*\n/gm, "");

// --- CRM sync (f/talent/sync_crm) -------------------------------------------------

/** Held for the run's connection: one sync at a time (the schedule can overlap a slow run). */
export const CRM_SYNC_LOCK = `SELECT pg_try_advisory_lock(hashtext('talent:crm_sync')) AS locked;`;

/**
 * $1 batch size. Submissions not yet in Twenty, and synced ones whose SMS
 * acknowledgement or its delivery changed since (the state is ackSyncState in crm.ts).
 */
export const SYNC_CANDIDATES = `
SELECT s.id, s.ref, s.source, s.channel, s.locale, s.phone, s.consent_version, s.consented_at, s.text, s.role,
       s.cluster, s.answers, s.page_path, s.applicant_name, s.created_at,
       p.name AS person_name, p.clusters AS person_clusters, p.roles AS person_roles, p.home_area,
       p.locale AS person_locale, p.status AS person_status, p.last_applied_at, p.last_contact_at, p.last_confirmed_at,
       a.status AS ack_status, a.request_id, a.last_error AS ack_error, a.accepted_at, a.updated_at AS ack_updated_at,
       a.delivery_status, a.delivery_detail, a.delivered_at,
       a.wa_status, a.wa_request_id, a.wa_error, a.wa_sent_at, a.wa_delivery, a.wa_detail, a.wa_delivered_at, a.wa_updated_at,
       c.person_id, c.application_id, c.ack_status AS synced_ack_status, (c.submission_id IS NOT NULL) AS synced
FROM submissions s
LEFT JOIN people p ON p.phone = s.phone
LEFT JOIN sms_acknowledgements a ON a.submission_id = s.id
LEFT JOIN crm_sync c ON c.submission_id = s.id
WHERE c.submission_id IS NULL
   OR c.ack_status IS DISTINCT FROM nullif(concat_ws(':', a.status, a.delivery_status, a.wa_status, a.wa_delivery), '')
ORDER BY s.created_at
LIMIT $1;`;

/** $1 submission, $2 person, $3 application, $4 the acknowledgement state written (ackSyncState). */
export const RECORD_CRM_SYNC = `
INSERT INTO crm_sync (submission_id, person_id, application_id, ack_status, synced_at)
VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now())
ON CONFLICT (submission_id) DO UPDATE
SET person_id = EXCLUDED.person_id, application_id = EXCLUDED.application_id, ack_status = EXCLUDED.ack_status, synced_at = now();`;

// --- delivery reports -----------------------------------------------------------

/**
 * $1 Fast2SMS request id, $2 outcome (delivered, failed, pending), $3 its own
 * status and text, $4 when delivered (null: now). A late or repeated report
 * never turns delivered back into anything else.
 */
export const SAVE_DELIVERY_REPORT = `
UPDATE sms_acknowledgements
SET delivery_status = $2, delivery_detail = $3,
    delivered_at = CASE WHEN $2 = 'delivered' THEN coalesce($4::timestamptz, delivered_at, now()) ELSE delivered_at END,
    delivery_checked_at = now(), updated_at = now()
WHERE request_id = $1 AND status = 'accepted'
  AND (delivery_status IS DISTINCT FROM 'delivered' OR $2 = 'delivered')
RETURNING submission_id;`;

/**
 * $1 batch size. Accepted acknowledgements with no final outcome ten minutes
 * on (the report may be lost), each looked up at most hourly, for the 7 days
 * Fast2SMS keeps reports (older lookups answer "No DLR found").
 */
export const DELIVERY_CHECK_DUE = `
SELECT submission_id, request_id
FROM sms_acknowledgements
WHERE status = 'accepted' AND request_id IS NOT NULL
  AND (delivery_status IS NULL OR delivery_status = 'pending')
  AND accepted_at < now() - interval '10 minutes'
  AND accepted_at > now() - interval '7 days'
  AND (delivery_checked_at IS NULL OR delivery_checked_at < now() - interval '1 hour')
ORDER BY accepted_at
LIMIT $1;`;

/** $1 submission: looked up, nothing new. */
export const MARK_DELIVERY_CHECKED = `UPDATE sms_acknowledgements SET delivery_checked_at = now() WHERE submission_id = $1::uuid;`;

// --- dispatch (f/talent/dispatch, roadmap 1F) -----------------------------------
// The deliveries table schedules the work; each step still writes its own
// status columns (sms_acknowledgements, submissions, crm_sync) as before.

/** Held for the run's connection: one dispatcher at a time (the 5-connection cap). */
export const DISPATCH_LOCK = `SELECT pg_try_advisory_lock(hashtext('talent:dispatch')) AS locked;`;

/** Runs stuck for 15 minutes: an SMS becomes unknown (never resent); the rest retry, or are dead at their cap. */
export const RECOVER_STUCK_DISPATCH = `
UPDATE deliveries
SET status = CASE WHEN target = 'sms' THEN 'unknown' WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END,
    last_error = coalesce(last_error, 'Interrupted; picked up again by the dispatcher'),
    next_attempt_at = now(), updated_at = now()
WHERE status = 'running' AND updated_at < now() - interval '15 minutes'
RETURNING submission_id, target, status;`;

/**
 * $1 target, $2 submission id or null. The oldest due delivery, claimed. A
 * files delivery waits, without spending attempts, until the CRM step has
 * made the Twenty application (crm_sync.application_id).
 */
export const CLAIM_DELIVERY = `
WITH c AS (
  SELECT submission_id, target FROM deliveries d
  WHERE target = $1 AND status = 'pending' AND next_attempt_at <= now()
    AND ($2::uuid IS NULL OR submission_id = $2::uuid)
    AND ($1 <> 'files' OR EXISTS (
      SELECT 1 FROM crm_sync cs WHERE cs.submission_id = d.submission_id AND cs.application_id IS NOT NULL))
  ORDER BY next_attempt_at, created_at LIMIT 1 FOR UPDATE SKIP LOCKED
)
UPDATE deliveries d SET status = 'running', attempts = d.attempts + 1, updated_at = now()
FROM c WHERE d.submission_id = c.submission_id AND d.target = c.target
RETURNING d.submission_id, d.target, d.attempts, d.max_attempts;`;

/**
 * $1 submission, $2 target, $3 outcome (done, retry, wait, unknown, dead), $4
 * error, $5 seconds to wait before a retry. A retry at the cap is dead; a
 * wait (the WhatsApp acknowledgement's report) does not count as an attempt.
 */
export const FINISH_DELIVERY = `
UPDATE deliveries
SET status = CASE WHEN $3 = 'retry' THEN (CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END)
                  WHEN $3 = 'wait' THEN 'pending' ELSE $3 END,
    attempts = CASE WHEN $3 = 'wait' THEN greatest(attempts - 1, 0) ELSE attempts END,
    next_attempt_at = CASE WHEN $3 IN ('retry', 'wait') THEN now() + make_interval(secs => $5::int) ELSE next_attempt_at END,
    last_error = $4,
    done_at = CASE WHEN $3 = 'done' THEN now() ELSE done_at END,
    updated_at = now()
WHERE submission_id = $1::uuid AND target = $2 AND status = 'running'
RETURNING status;`;

/** $1 submission. Where the older status columns stand (to reconcile a step that found nothing to claim). */
export const LEGACY_STATUS = `
SELECT a.status AS sms, a.attempts AS sms_attempts, (c.submission_id IS NOT NULL) AS crm_synced
FROM submissions s
LEFT JOIN sms_acknowledgements a ON a.submission_id = s.id
LEFT JOIN crm_sync c ON c.submission_id = s.id
WHERE s.id = $1::uuid;`;

/** $1 submission: SYNC_CANDIDATES' columns for one submission, synced or not. */
export const SYNC_CANDIDATE_FOR = SYNC_CANDIDATES.replace(
  /WHERE c\.submission_id IS NULL\n {3}OR c\.ack_status IS DISTINCT FROM nullif\(concat_ws\(':', a\.status, a\.delivery_status, a\.wa_status, a\.wa_delivery\), ''\)\nORDER BY s\.created_at\nLIMIT \$1;/,
  "WHERE s.id = $1::uuid;",
);
// A replace that misses leaves LIMIT $1 bound to a uuid (every per-submission
// CRM delivery failed that way, 18 Oct 2026): fail at load instead.
if (SYNC_CANDIDATE_FOR === SYNC_CANDIDATES) throw new Error("SYNC_CANDIDATE_FOR: the WHERE clause was not replaced");

// --- files into Twenty (the files target, talent/lib/run-files.ts) -------------

/**
 * Erasure holds the dispatcher's lock (DISPATCH_LOCK's key) around its
 * Twenty step and the row delete, so no dispatch run adds an attachment
 * mid-erasure. A dispatcher that finds it held skips its run.
 */
export const ERASURE_DISPATCH_LOCK = DISPATCH_LOCK;
export const ERASURE_DISPATCH_UNLOCK = `SELECT pg_advisory_unlock(hashtext('talent:dispatch')) AS unlocked;`;

/** $1 submission: its reference and Twenty application. */
export const FILES_SUBMISSION = `
SELECT s.id, s.ref, c.application_id
FROM submissions s LEFT JOIN crm_sync c ON c.submission_id = s.id
WHERE s.id = $1::uuid;`;

/** $1 submission: its files, in order, with what Twenty has of each. */
export const FILES_FOR = `
SELECT id, position, kind, r2_key, mime, size_bytes, twenty_file_id, twenty_attachment_id, crm_file_status
FROM attachments WHERE submission_id = $1::uuid ORDER BY position;`;

/** $1 attachment, $2 Twenty file id: saved as soon as createFileUpload answers, so a retry completes it rather than uploading again. */
export const SAVE_FILE_ID = `UPDATE attachments SET twenty_file_id = $2::uuid, crm_file_error = NULL, updated_at = now() WHERE id = $1::uuid;`;

/** $1 attachment, $2 status (done, missing, skipped), $3 Twenty attachment id or null, $4 Twenty file id or null, $5 note. */
export const SETTLE_FILE = `
UPDATE attachments
SET crm_file_status = $2, twenty_attachment_id = coalesce($3::uuid, twenty_attachment_id),
    twenty_file_id = coalesce($4::uuid, twenty_file_id), crm_file_error = $5, crm_file_at = now(), updated_at = now()
WHERE id = $1::uuid;`;

/** $1 attachment, $2 error: it stays pending for the delivery's retry. */
export const FILE_ERROR = `UPDATE attachments SET crm_file_error = $2, updated_at = now() WHERE id = $1::uuid;`;

/** $1 attachment: its Twenty file could not be completed (never uploaded); the retry starts again. */
export const CLEAR_FILE_ID = `UPDATE attachments SET twenty_file_id = NULL, updated_at = now() WHERE id = $1::uuid;`;
