/**
 * The rate alert subscriber list's queries (leads/schema.sql,
 * alert_subscribers and alert_sends). Names start with ALERTS_.
 */

/** Addresses never confirmed, a week on. */
export const ALERTS_PURGE_PENDING = `DELETE FROM alert_subscribers WHERE status = 'pending' AND created_at < now() - interval '7 days' RETURNING id;`;

/** $1 email (lower-cased). */
export const ALERTS_BY_EMAIL = `SELECT id, status, states, token, last_mail_at FROM alert_subscribers WHERE email = $1;`;

/**
 * $1 email, $2 states (a JSON array), $3 a fresh token (kept only for a new
 * row: an earlier email's links stay good), $4 source path, $5 notice
 * version, $6 reference. A known address gains the new states.
 */
export const ALERTS_UPSERT = `
INSERT INTO alert_subscribers AS s (email, states, token, source_path, notice_version, ref)
VALUES ($1, ARRAY(SELECT jsonb_array_elements_text($2::jsonb) ORDER BY 1), $3, $4, $5, $6)
ON CONFLICT (email) DO UPDATE
  SET states = ARRAY(SELECT DISTINCT e FROM unnest(s.states || EXCLUDED.states) AS e ORDER BY 1),
      notice_version = EXCLUDED.notice_version,
      updated_at = now()
RETURNING s.id, s.status, s.states, s.token, s.last_mail_at;`;

/** $1 subscriber id, $2 when: an email went out. */
export const ALERTS_MAILED = `UPDATE alert_subscribers SET last_mail_at = $2::timestamptz WHERE id = $1;`;

/** $1 token. Confirming twice is the same as once. */
export const ALERTS_CONFIRM = `
WITH before AS (
  SELECT id, confirmed_at IS NULL AS first_time FROM alert_subscribers WHERE token = $1 FOR UPDATE
)
UPDATE alert_subscribers s SET status = 'confirmed', confirmed_at = coalesce(s.confirmed_at, now()), updated_at = now()
FROM before WHERE s.id = before.id
RETURNING s.id, s.states, before.first_time;`;

/** $1 token. The row and, by cascade, its sends. */
export const ALERTS_UNSUBSCRIBE = `DELETE FROM alert_subscribers WHERE token = $1 RETURNING states;`;

/** $1 state, $2 revision, $3 how many. Confirmed followers of the state who have not had this revision. */
export const ALERTS_DUE = `
SELECT s.id, s.email, s.token
FROM alert_subscribers s
WHERE s.status = 'confirmed' AND $1 = ANY (s.states)
  AND NOT EXISTS (SELECT 1 FROM alert_sends x WHERE x.subscriber_id = s.id AND x.state = $1 AND x.revision = $2)
ORDER BY s.confirmed_at, s.id
LIMIT $3;`;

/** $1 subscriber id, $2 state, $3 revision. */
export const ALERTS_SENT = `INSERT INTO alert_sends (subscriber_id, state, revision) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`;

/** Confirmed subscribers per state, for the send command's summary. */
export const ALERTS_COUNTS = `
SELECT e AS state, count(*)::int AS subscribers
FROM alert_subscribers s, unnest(s.states) AS e
WHERE s.status = 'confirmed'
GROUP BY e ORDER BY e;`;
