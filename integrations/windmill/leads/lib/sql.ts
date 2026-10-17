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
