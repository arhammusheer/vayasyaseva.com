/**
 * The lead inbox's queries (leads/schema.sql). Names start with LEADS_ so a
 * script that bundles the talent queries too keeps them apart.
 */

/**
 * $1 case ID, $2 type, $3 channel, $4 lead (JSON), $5 Idempotency-Key, $6
 * received at. A replayed case ID inserts nothing; either way the answer
 * says whether it was new.
 */
export const LEADS_SAVE = `
WITH l AS (
  INSERT INTO leads (case_id, type, channel, payload, idempotency_key, received_at)
  VALUES ($1, $2, $3, $4::jsonb, $5, $6::timestamptz)
  ON CONFLICT (case_id) DO NOTHING
  RETURNING id
), d AS (
  INSERT INTO deliveries (lead_id, target) SELECT id, 'crm' FROM l RETURNING 1
)
SELECT (SELECT id FROM l) AS lead_id, (SELECT count(*) FROM d) AS deliveries;`;

/** One CRM sync at a time (the schedule can overlap a slow run). */
export const LEADS_SYNC_LOCK = `SELECT pg_try_advisory_lock(hashtext('leads:sync_crm')) AS locked;`;

/** Runs stuck for 15 minutes go back, or are dead at their cap. */
export const LEADS_RECOVER_STUCK = `
UPDATE deliveries
SET status = CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END,
    last_error = coalesce(last_error, 'Interrupted; picked up again'), next_attempt_at = now(), updated_at = now()
WHERE status = 'running' AND updated_at < now() - interval '15 minutes'
RETURNING lead_id;`;

/** $1 lead id or null. The oldest due CRM delivery, claimed, with its lead. */
export const LEADS_CLAIM = `
WITH c AS (
  SELECT lead_id FROM deliveries
  WHERE target = 'crm' AND status = 'pending' AND next_attempt_at <= now() AND ($1::uuid IS NULL OR lead_id = $1::uuid)
  ORDER BY next_attempt_at, created_at LIMIT 1 FOR UPDATE SKIP LOCKED
), claimed AS (
  UPDATE deliveries d SET status = 'running', attempts = d.attempts + 1, updated_at = now()
  FROM c WHERE d.lead_id = c.lead_id AND d.target = 'crm'
  RETURNING d.lead_id, d.attempts
)
SELECT claimed.lead_id, claimed.attempts, l.case_id, l.payload
FROM claimed JOIN leads l ON l.id = claimed.lead_id;`;

/** $1 lead, $2 outcome (done, retry, dead), $3 error, $4 seconds before a retry, $5 result (JSON). */
export const LEADS_FINISH = `
UPDATE deliveries
SET status = CASE WHEN $2 = 'retry' THEN (CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END) ELSE $2 END,
    next_attempt_at = CASE WHEN $2 = 'retry' THEN now() + make_interval(secs => $4::int) ELSE next_attempt_at END,
    last_error = $3, result = coalesce($5::jsonb, result),
    done_at = CASE WHEN $2 = 'done' THEN now() ELSE done_at END, updated_at = now()
WHERE lead_id = $1::uuid AND target = 'crm' AND status = 'running'
RETURNING status;`;

// --- erasure (f/leads/erase, leads/lib/erase.ts) ------------------------------

/** Releases the sync lock taken with LEADS_SYNC_LOCK (erasure holds it so no sync runs in between). */
export const LEADS_SYNC_UNLOCK = `SELECT pg_advisory_unlock(hashtext('leads:sync_crm')) AS unlocked;`;

/** Requests stuck running for an hour go back, or fail at three attempts. */
export const LEADS_ERASURE_RECOVER = `
UPDATE erasure_requests
SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END,
    last_error = coalesce(last_error, 'Interrupted; picked up again'), updated_at = now()
WHERE status = 'running' AND updated_at < now() - interval '1 hour'
RETURNING id;`;

/**
 * Claims the oldest pending request, with every lead it covers: its case ID,
 * or every lead whose phone has the same last ten digits.
 */
export const LEADS_ERASURE_CLAIM = `
WITH claimed AS (
  UPDATE erasure_requests e
  SET status = 'running', attempts = e.attempts + 1, last_error = NULL, updated_at = now()
  WHERE e.id = (
    SELECT id FROM erasure_requests WHERE status = 'pending'
    ORDER BY requested_at LIMIT 1 FOR UPDATE SKIP LOCKED)
  RETURNING e.id, e.case_id, e.phone
)
SELECT c.id, c.case_id, c.phone,
  coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', l.id, 'caseId', l.case_id, 'company', l.payload->>'company', 'phone', l.payload->>'phone', 'opportunityId', d.result->>'opportunityId'))
    FROM leads l LEFT JOIN deliveries d ON d.lead_id = l.id AND d.target = 'crm'
    WHERE l.case_id = c.case_id
       OR (c.phone IS NOT NULL AND right(regexp_replace(l.payload->>'phone', '\\D', '', 'g'), 10) = right(regexp_replace(c.phone, '\\D', '', 'g'), 10))
  ), '[]'::jsonb) AS leads
FROM claimed c;`;

/**
 * $1 request, $2 lead ids (uuid[]), $3 opportunities, $4 people, $5 companies,
 * $6 attachments removed in Twenty. Deletes the leads (their deliveries go
 * with them) and keeps only the counts: case ID and phone are cleared.
 */
export const LEADS_ERASURE_DONE = `
WITH gone AS (
  DELETE FROM leads WHERE id = ANY($2::uuid[]) RETURNING id
)
UPDATE erasure_requests
SET status = 'done', processed_at = now(), updated_at = now(), case_id = NULL, phone = NULL,
    removed_leads = (SELECT count(*) FROM gone), removed_opportunities = $3::int, removed_people = $4::int,
    removed_companies = $5::int, removed_crm_files = $6::int
WHERE id = $1::uuid AND status = 'running'
RETURNING id, removed_leads;`;

/** $1 request, $2 error: back to pending (picked up next run), or failed at three attempts. */
export const LEADS_ERASURE_FAIL = `
UPDATE erasure_requests
SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END, last_error = $2, updated_at = now()
WHERE id = $1::uuid AND status = 'running';`;
