/**
 * The crew offers' queries (talent/lib/run-crew.ts, crew-inbound.ts), on
 * the talent database's crew_messages and crew_replies (talent/schema.sql).
 */

/**
 * f/talent/crew holds the dispatcher's lock (sql.ts DISPATCH_LOCK) for its
 * run: one of them at a time, and erasure (which waits for that lock) never
 * runs while a crew message is being sent or written to Twenty.
 */
import { DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK } from "./sql.ts";

export const CREW_LOCK = DISPATCH_LOCK;
export const CREW_UNLOCK = ERASURE_DISPATCH_UNLOCK;

/** $1 crew member ids: what each has been sent, and whether the worker answered it. */
export const CREW_LEDGER = `
SELECT m.id, m.crew_member_id, m.kind, m.status, m.sent_at, m.delivery,
       EXISTS (SELECT 1 FROM crew_replies r WHERE r.message_id = m.id) AS replied,
       EXISTS (SELECT 1 FROM crew_replies r WHERE r.message_id = m.id AND r.answer = 'yes') AS said_yes
FROM crew_messages m
WHERE m.crew_member_id = ANY($1::uuid[]);`;

/**
 * $1 crew member, $2 kind, $3 phone, $4 person, $5 crew request, $6 locale,
 * $7 template id, $8 variables (JSON). The claim: nothing comes back when the
 * message was claimed before (sent, or being sent), so it never goes twice.
 */
export const CLAIM_CREW_MESSAGE = `
INSERT INTO crew_messages (crew_member_id, kind, phone, person_id, opportunity_id, locale, template_id, variables)
VALUES ($1::uuid, $2, $3, $4::uuid, $5::uuid, $6, $7::int, $8::jsonb)
ON CONFLICT (crew_member_id, kind) DO NOTHING
RETURNING id;`;

/** $1 id, $2 accepted / failed / unknown, $3 Fast2SMS request id, $4 error. */
export const SAVE_CREW_SEND = `
UPDATE crew_messages
SET status = $2, request_id = $3, error = $4,
    sent_at = CASE WHEN $2 = 'accepted' THEN now() ELSE sent_at END, updated_at = now()
WHERE id = $1::uuid AND status = 'sending';`;

/** A send cut off (the run died between the claim and the result) may have gone: unknown, never resent. */
export const RECOVER_CREW_SENDING = `
UPDATE crew_messages
SET status = 'unknown', error = 'Interrupted while sending: it may or may not have gone', updated_at = now()
WHERE status = 'sending' AND updated_at < now() - interval '5 minutes';`;

/**
 * $1 batch size. Accepted messages whose report is not in, for two days
 * (Fast2SMS keeps them about a week): every minute for the first half hour,
 * then every 15 minutes.
 */
export const CREW_REPORTS_DUE = `
SELECT id, request_id
FROM crew_messages
WHERE status = 'accepted' AND request_id IS NOT NULL
  AND (delivery IS NULL OR delivery IN ('pending', 'delivered'))
  AND sent_at > now() - interval '2 days'
  AND (checked_at IS NULL
       OR (sent_at > now() - interval '30 minutes' AND checked_at < now() - interval '50 seconds')
       OR checked_at < now() - interval '15 minutes')
ORDER BY checked_at NULLS FIRST, sent_at
LIMIT $1;`;

/** $1 id: looked up, nothing new. */
export const CREW_REPORT_CHECKED = `UPDATE crew_messages SET checked_at = now() WHERE id = $1::uuid;`;

/**
 * $1 id, $2 outcome (read, delivered, failed, pending), $3 Fast2SMS's status
 * and text, $4 when. Read never goes back to delivered, nor either to pending.
 */
export const SAVE_CREW_REPORT = `
UPDATE crew_messages
SET delivery = $2, delivery_detail = $3, checked_at = now(),
    delivered_at = CASE WHEN $2 IN ('delivered', 'read') THEN coalesce(delivered_at, $4::timestamptz, now()) ELSE delivered_at END,
    updated_at = now()
WHERE id = $1::uuid AND status = 'accepted'
  AND delivery IS DISTINCT FROM 'read'
  AND (delivery IS DISTINCT FROM 'delivered' OR $2 = 'read');`;

/** What the CRM step last wrote (crm_state): the send's status and its delivery. */
export const CREW_CRM_STATE = `concat_ws(':', m.status, m.delivery)`;

/** $1 batch size. Messages whose state is not yet in Twenty. */
export const CREW_CRM_DUE = `
SELECT m.id, m.crew_member_id, m.kind, m.person_id, m.opportunity_id, m.locale, m.template_id, m.variables,
       m.status, m.request_id, m.error, m.sent_at, m.delivery, m.delivery_detail, m.delivered_at,
       m.communication_id, m.updated_at, ${CREW_CRM_STATE} AS state
FROM crew_messages m
WHERE m.status <> 'sending' AND m.crm_state IS DISTINCT FROM ${CREW_CRM_STATE}
ORDER BY m.updated_at
LIMIT $1;`;

/** $1 id, $2 the Communication, $3 the state written. Kept for the next run if the row changed meanwhile. */
export const MARK_CREW_CRM = `
UPDATE crew_messages m SET communication_id = $2::uuid, crm_state = $3
WHERE m.id = $1::uuid AND ${CREW_CRM_STATE} = $3;`;

// --- replies ----------------------------------------------------------------------

/** $1 phone: the latest message the worker can be answering (accepted, in the last 7 days). */
export const OPEN_CREW_MESSAGE = `
SELECT id, kind, crew_member_id
FROM crew_messages
WHERE phone = $1 AND status = 'accepted' AND sent_at > now() - interval '7 days'
ORDER BY sent_at DESC
LIMIT 1;`;

/**
 * $1 key, $2 phone, $3 message, $4 answer, $5 message type, $6 text. Saved
 * once per key; a reply renews the person's retention clock (schema.sql people).
 */
export const SAVE_CREW_REPLY = `
WITH saved AS (
  INSERT INTO crew_replies (key, phone, message_id, answer, message_type, body)
  VALUES ($1, $2, $3::uuid, $4, $5, $6)
  ON CONFLICT (key) DO NOTHING
  RETURNING key
), renewed AS (
  UPDATE people SET last_contact_at = now(), updated_at = now()
  WHERE phone = $2 AND EXISTS (SELECT 1 FROM saved)
  RETURNING 1
)
SELECT key FROM saved;`;

/** $1 batch size. Replies to write to Twenty, oldest first, with the message they answer. */
export const CREW_REPLIES_DUE = `
SELECT r.key, r.phone, r.answer, r.message_type, r.body, r.received_at, r.attempts,
       m.id AS message_id, m.kind, m.crew_member_id, m.person_id, m.opportunity_id
FROM crew_replies r JOIN crew_messages m ON m.id = r.message_id
WHERE r.status = 'pending'
ORDER BY r.received_at
LIMIT $1;`;

/** $1 key: written to Twenty; the text goes (Twenty keeps it). */
export const CREW_REPLY_DONE = `
UPDATE crew_replies SET status = 'done', applied_at = now(), body = NULL, last_error = NULL WHERE key = $1;`;

/** $1 key, $2 error. After eight tries the reply is 'failed' (and its text goes). */
export const CREW_REPLY_FAILED = `
UPDATE crew_replies
SET attempts = attempts + 1, last_error = $2,
    status = CASE WHEN attempts + 1 >= 8 THEN 'failed' ELSE status END,
    body = CASE WHEN attempts + 1 >= 8 THEN NULL ELSE body END
WHERE key = $1;`;
