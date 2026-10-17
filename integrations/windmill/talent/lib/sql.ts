/**
 * Every query the talent scripts run, copied verbatim from the n8n
 * workflows (integrations/n8n/build.mts) so behaviour is unchanged:
 * atomic claims with FOR UPDATE SKIP LOCKED, recovery of stuck rows,
 * attempt caps and the retention order. Parameters are $1..$n.
 */

/** Privacy notice §10: details are kept up to 12 months after the person last contacts us. */
export const RETENTION_MONTHS = 12;

// --- intake -------------------------------------------------------------------

/** $1..$18 from saveSubmissionParams (validate.ts). A replayed ref inserts nothing and returns submission_id null. */
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
         $15::jsonb #>> '{area,0}',
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

// --- deliver --------------------------------------------------------------------

export const RECOVER_STUCK_DELIVERIES = `
UPDATE submissions
SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'received' END,
    last_error = coalesce(last_error, 'Timed out delivering to Chatwoot'),
    updated_at = now()
WHERE status = 'delivering' AND updated_at < now() - interval '15 minutes'
RETURNING id;`;

/** Waits until every voice note of a submission is transcribed (or failed). */
export const CLAIM_SUBMISSION = `
WITH claimed AS (
  UPDATE submissions s
  SET status = 'delivering', attempts = s.attempts + 1, updated_at = now()
  WHERE s.id = (
    SELECT c.id FROM submissions c
    WHERE c.status = 'received'
      AND NOT EXISTS (
        SELECT 1 FROM attachments a
        WHERE a.submission_id = c.id AND a.transcript_status IN ('pending', 'running'))
    ORDER BY c.created_at LIMIT 1 FOR UPDATE SKIP LOCKED)
  RETURNING s.id, s.ref, s.source, s.role, s.hub, s.channel, s.agent_name AS "agentName", s.form, s.applicant_name AS "applicantName", s.answers, s.locale, s.cluster, s.page_cluster AS "pageCluster", s.page_path AS "pagePath", s.phone, s.text
)
SELECT c.*, coalesce((
  SELECT jsonb_agg(jsonb_build_object(
    'id', a.id, 'position', a.position, 'kind', a.kind, 'key', a.r2_key, 'mime', a.mime,
    'name', a.original_name, 'transcript', a.transcript, 'transcriptStatus', a.transcript_status
  ) ORDER BY a.position)
  FROM attachments a WHERE a.submission_id = c.id), '[]'::jsonb) AS attachments
FROM claimed c;`;

/** $1 submission id, $2 Chatwoot contact id (or null), $3 conversation id. */
export const RECORD_CONVERSATION = `
UPDATE submissions
SET chatwoot_contact_id = $2, chatwoot_conversation_id = $3, updated_at = now()
WHERE id = $1::uuid
RETURNING id;`;

export const MARK_DELIVERED = `UPDATE submissions SET status = 'delivered', last_error = NULL, updated_at = now() WHERE id = $1::uuid RETURNING id;`;

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
  coalesce((SELECT jsonb_agg(a.r2_key) FROM attachments a JOIN submissions s ON s.id = a.submission_id WHERE s.phone = c.phone), '[]'::jsonb) AS files,
  coalesce((SELECT jsonb_agg(DISTINCT s.chatwoot_contact_id) FROM submissions s WHERE s.phone = c.phone AND s.chatwoot_contact_id IS NOT NULL), '[]'::jsonb) AS contacts
FROM claimed c;`;

/** $1 request id, $2 phone, $3 files removed, $4 contacts removed. Keeps counts only: phone and ref are cleared. */
export const DELETE_ROWS = `
WITH gone AS (
  DELETE FROM submissions WHERE phone = $2 RETURNING id
), person AS (
  DELETE FROM people WHERE phone = $2 RETURNING 1
)
UPDATE erasure_requests
SET status = 'done', processed_at = now(), updated_at = now(),
    removed_submissions = (SELECT count(*) FROM gone), removed_files = $3::int, removed_contacts = $4::int,
    phone = NULL, ref = NULL
WHERE id = $1::uuid AND status = 'running'
RETURNING id, status, removed_submissions;`;

/** Strips whole-line comments, as the n8n setup workflow did before running the schema. */
export const schemaStatements = (schema: string) => schema.replace(/^--.*\n/gm, "");

// --- CRM sync (f/talent/sync_crm) -------------------------------------------------

/** Held for the run's connection: one sync at a time (the schedule can overlap a slow run). */
export const CRM_SYNC_LOCK = `SELECT pg_try_advisory_lock(hashtext('talent:crm_sync')) AS locked;`;

/** $1 batch size. Submissions not yet in Twenty, and synced ones whose SMS acknowledgement changed since. */
export const SYNC_CANDIDATES = `
SELECT s.id, s.ref, s.source, s.channel, s.locale, s.phone, s.consent_version, s.consented_at, s.text, s.role,
       s.cluster, s.answers, s.page_path, s.applicant_name, s.created_at,
       p.name AS person_name, p.clusters AS person_clusters, p.roles AS person_roles, p.home_area,
       p.locale AS person_locale, p.status AS person_status, p.last_applied_at, p.last_contact_at, p.last_confirmed_at,
       a.status AS ack_status, a.request_id, a.last_error AS ack_error, a.accepted_at, a.updated_at AS ack_updated_at,
       c.person_id, c.application_id, c.ack_status AS synced_ack_status, (c.submission_id IS NOT NULL) AS synced
FROM submissions s
LEFT JOIN people p ON p.phone = s.phone
LEFT JOIN sms_acknowledgements a ON a.submission_id = s.id
LEFT JOIN crm_sync c ON c.submission_id = s.id
WHERE c.submission_id IS NULL OR c.ack_status IS DISTINCT FROM a.status
ORDER BY s.created_at
LIMIT $1;`;

/** $1 submission, $2 person, $3 application, $4 the acknowledgement status written. */
export const RECORD_CRM_SYNC = `
INSERT INTO crm_sync (submission_id, person_id, application_id, ack_status, synced_at)
VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now())
ON CONFLICT (submission_id) DO UPDATE
SET person_id = EXCLUDED.person_id, application_id = EXCLUDED.application_id, ack_status = EXCLUDED.ack_status, synced_at = now();`;
