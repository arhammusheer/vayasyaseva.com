/**
 * The Idempotency-Key store's queries (f/platform/idempotency). The same
 * idempotency_keys table is in the talent database (jobs routes) and the
 * lead inbox (contact routes); talent/schema.sql and leads/schema.sql.
 */

/** Answers are kept a day; a run that never finished frees its key after two minutes. */
export const IDEMPOTENCY_SWEEP = `DELETE FROM idempotency_keys WHERE updated_at < now() - interval '24 hours';`;

/**
 * $1 scope, $2 key, $3 fingerprint. Claims the key unless it is done or
 * running; returns the row as it was before (null when new).
 */
export const IDEMPOTENCY_BEGIN = `
WITH before AS (
  SELECT fingerprint, state, answer, carry, updated_at FROM idempotency_keys WHERE scope = $1 AND key = $2 FOR UPDATE
), claimed AS (
  INSERT INTO idempotency_keys (scope, key, fingerprint, state, carry, updated_at)
  VALUES ($1, $2, $3, 'running', NULL, now())
  ON CONFLICT (scope, key) DO UPDATE
  SET state = 'running', updated_at = now()
  WHERE idempotency_keys.fingerprint = $3
    AND (idempotency_keys.state = 'failed' OR (idempotency_keys.state = 'running' AND idempotency_keys.updated_at < now() - interval '2 minutes'))
  RETURNING 1
)
SELECT (SELECT row_to_json(before) FROM before) AS before, (SELECT count(*) FROM claimed) > 0 AS claimed;`;

/** $1 scope, $2 key, $3 answer (JSON). */
export const IDEMPOTENCY_COMPLETE = `
UPDATE idempotency_keys SET state = 'done', answer = $3::jsonb, carry = NULL, updated_at = now()
WHERE scope = $1 AND key = $2;`;

/** $1 scope, $2 key, $3 carry (JSON) or null: forgotten, or kept as failed with its carry. */
export const IDEMPOTENCY_ABANDON = `
WITH gone AS (
  DELETE FROM idempotency_keys WHERE scope = $1 AND key = $2 AND $3::jsonb IS NULL RETURNING 1
)
UPDATE idempotency_keys SET state = 'failed', carry = $3::jsonb, updated_at = now()
WHERE scope = $1 AND key = $2 AND $3::jsonb IS NOT NULL;`;
