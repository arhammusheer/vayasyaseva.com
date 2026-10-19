// Generated from integrations/windmill/talent/scripts/setup.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

// integrations/windmill/talent/lib/config.ts
const { VARIABLES, variablePath, setConfigForTests, config } = (() => {
const VARIABLES = {
    talent_pg_url: { secret: true },
    fast2sms_api_key: { secret: true },
    intake_webhook_secret: { secret: true },
    r2_read_key_id: { secret: true },
    r2_read_secret: { secret: true },
    r2_erase_key_id: { secret: true },
    r2_erase_secret: { secret: true },
    chatwoot_admin_token: { secret: true },
    chatwoot_inbox_identifier: { secret: true },
    chatwoot_base_url: { secret: false },
    chatwoot_account_id: { secret: false },
    r2_endpoint: { secret: false },
    r2_bucket: { secret: false },
    twenty_base_url: { secret: false },
    twenty_api_key: { secret: true },
    lead_webhook_secret: { secret: true },
    fast2sms_dlr_secret: { secret: true },
    leads_pg_url: { secret: true },
    submission_signing_secret: { secret: true },
};
const variablePath = (name) => `f/talent/${name}`;
let override = null;
function setConfigForTests(values) {
    override = values;
}
async function config(name) {
    if (override) {
        const value = override[name];
        if (value === undefined)
            throw new Error(`test config has no ${name}`);
        return value;
    }
    const value = await wmill.getVariable(variablePath(name));
    if (!value)
        throw new Error(`variable ${variablePath(name)} is empty`);
    return value;
}
  return { VARIABLES, variablePath, setConfigForTests, config };
})();

// integrations/windmill/talent/lib/db.ts
const { withTalentDb, withDatabase, queryWith } = (() => {
const passThroughJson = (oid) => ({
    to: oid,
    from: [oid],
    serialize: (value) => (typeof value === "string" ? value : JSON.stringify(value)),
    parse: (value) => JSON.parse(value),
});
async function withTalentDb(fn) {
    return withDatabase("talent_pg_url", fn);
}
async function withDatabase(url, fn) {
    const sql = postgres(await config(url), {
        max: 1,
        connect_timeout: 10,
        idle_timeout: 5,
        prepare: false,
        types: { json: passThroughJson(114), jsonb: passThroughJson(3802) },
        onnotice: () => { },
    });
    try {
        return await fn(queryWith(sql));
    }
    finally {
        await sql.end({ timeout: 5 });
    }
}
const queryWith = (sql) => async (text, params = []) => (await sql.unsafe(text, params));
  return { withTalentDb, withDatabase, queryWith };
})();

// integrations/windmill/talent/lib/sql.ts
const { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, GET_ACKNOWLEDGEMENT, SKIP_WHATSAPP, CLAIM_WHATSAPP_ACK, SAVE_WHATSAPP_RESULT, RECOVER_WHATSAPP_SEND, SAVE_WHATSAPP_REPORT, SKIP_SMS, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, CLAIM_SUBMISSION_FOR, RELEASE_SUBMISSION, SYNC_CANDIDATE_FOR, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, FILES_SUBMISSION, FILES_FOR, SAVE_FILE_ID, SETTLE_FILE, FILE_ERROR, CLEAR_FILE_ID } = (() => {
const RETENTION_MONTHS = 12;
const SAVE_SUBMISSION = `
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
const claimAcknowledgement = (filter) => `
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
const CLAIM_ACKNOWLEDGEMENT = claimAcknowledgement("true");
const CLAIM_ACKNOWLEDGEMENT_FOR = claimAcknowledgement("s.id = $1::uuid");
const RECOVER_INTERRUPTED_SENDS = `
UPDATE sms_acknowledgements SET status = 'unknown',
  last_error = 'Interrupted send; check Fast2SMS delivery history before retrying', updated_at = now()
WHERE status = 'sending' AND updated_at < now() - interval '5 minutes';`;
const SAVE_ACKNOWLEDGEMENT_RESULT = `
UPDATE sms_acknowledgements
SET status = $2, request_id = $3, last_error = $4,
    accepted_at = CASE WHEN $2 = 'accepted' THEN now() ELSE accepted_at END,
    next_attempt_at = now() + interval '1 minute', updated_at = now()
WHERE submission_id = $1::uuid AND status = 'sending'
RETURNING submission_id, status;`;
const GET_ACKNOWLEDGEMENT = `
SELECT a.status, a.wa_status, a.wa_request_id, a.wa_sent_at, a.wa_delivery, a.wa_updated_at, s.ref, s.phone, s.locale
FROM sms_acknowledgements a JOIN submissions s ON s.id = a.submission_id
WHERE a.submission_id = $1::uuid;`;
const SKIP_WHATSAPP = `
UPDATE sms_acknowledgements SET wa_status = 'skipped', wa_error = $2, wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status IS NULL;`;
const CLAIM_WHATSAPP_ACK = `
UPDATE sms_acknowledgements SET wa_status = 'sending', wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status IS NULL AND status = 'pending'
RETURNING submission_id;`;
const SAVE_WHATSAPP_RESULT = `
UPDATE sms_acknowledgements
SET wa_status = $2, wa_request_id = $3, wa_error = $4,
    wa_sent_at = CASE WHEN $2 = 'accepted' THEN now() ELSE wa_sent_at END,
    wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status = 'sending';`;
const RECOVER_WHATSAPP_SEND = `
UPDATE sms_acknowledgements
SET wa_status = 'unknown', wa_error = 'Interrupted WhatsApp send; the SMS goes instead', wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status = 'sending';`;
const SAVE_WHATSAPP_REPORT = `
UPDATE sms_acknowledgements
SET wa_delivery = $2, wa_detail = $3,
    wa_delivered_at = CASE WHEN $2 IN ('delivered', 'read') THEN coalesce(wa_delivered_at, $4::timestamptz, now()) ELSE wa_delivered_at END,
    wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status = 'accepted'
  AND wa_delivery IS DISTINCT FROM 'read'
  AND (wa_delivery IS DISTINCT FROM 'delivered' OR $2 = 'read');`;
const SKIP_SMS = `
UPDATE sms_acknowledgements SET status = 'skipped', last_error = NULL, updated_at = now()
WHERE submission_id = $1::uuid AND status = 'pending';`;
const RECOVER_STUCK_DELIVERIES = `
UPDATE submissions
SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'received' END,
    last_error = coalesce(last_error, 'Timed out delivering to Chatwoot'),
    updated_at = now()
WHERE status = 'delivering' AND updated_at < now() - interval '15 minutes'
RETURNING id;`;
const CLAIM_SUBMISSION = `
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
const RECORD_CONVERSATION = `
UPDATE submissions
SET chatwoot_contact_id = $2, chatwoot_conversation_id = $3, updated_at = now()
WHERE id = $1::uuid
RETURNING id;`;
const MARK_DELIVERED = `UPDATE submissions SET status = 'delivered', last_error = NULL, updated_at = now() WHERE id = $1::uuid RETURNING id;`;
const QUEUE_EXPIRED_AND_RECOVER = `
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
const CLAIM_ERASURE = `
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
const DELETE_ROWS = `
WITH gone AS (
  DELETE FROM submissions WHERE phone = $2 RETURNING id
), person AS (
  DELETE FROM people WHERE phone = $2 RETURNING 1
)
UPDATE erasure_requests
SET status = 'done', processed_at = now(), updated_at = now(),
    removed_submissions = (SELECT count(*) FROM gone), removed_files = $3::int, removed_contacts = $4::int,
    removed_crm_files = $5::int, phone = NULL, ref = NULL
WHERE id = $1::uuid AND status = 'running'
RETURNING id, status, removed_submissions;`;
const schemaStatements = (schema) => schema.replace(/^--.*\n/gm, "");
const CRM_SYNC_LOCK = `SELECT pg_try_advisory_lock(hashtext('talent:crm_sync')) AS locked;`;
const SYNC_CANDIDATES = `
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
const RECORD_CRM_SYNC = `
INSERT INTO crm_sync (submission_id, person_id, application_id, ack_status, synced_at)
VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now())
ON CONFLICT (submission_id) DO UPDATE
SET person_id = EXCLUDED.person_id, application_id = EXCLUDED.application_id, ack_status = EXCLUDED.ack_status, synced_at = now();`;
const SAVE_DELIVERY_REPORT = `
UPDATE sms_acknowledgements
SET delivery_status = $2, delivery_detail = $3,
    delivered_at = CASE WHEN $2 = 'delivered' THEN coalesce($4::timestamptz, delivered_at, now()) ELSE delivered_at END,
    delivery_checked_at = now(), updated_at = now()
WHERE request_id = $1 AND status = 'accepted'
  AND (delivery_status IS DISTINCT FROM 'delivered' OR $2 = 'delivered')
RETURNING submission_id;`;
const DELIVERY_CHECK_DUE = `
SELECT submission_id, request_id
FROM sms_acknowledgements
WHERE status = 'accepted' AND request_id IS NOT NULL
  AND (delivery_status IS NULL OR delivery_status = 'pending')
  AND accepted_at < now() - interval '10 minutes'
  AND accepted_at > now() - interval '7 days'
  AND (delivery_checked_at IS NULL OR delivery_checked_at < now() - interval '1 hour')
ORDER BY accepted_at
LIMIT $1;`;
const MARK_DELIVERY_CHECKED = `UPDATE sms_acknowledgements SET delivery_checked_at = now() WHERE submission_id = $1::uuid;`;
const DISPATCH_LOCK = `SELECT pg_try_advisory_lock(hashtext('talent:dispatch')) AS locked;`;
const RECOVER_STUCK_DISPATCH = `
UPDATE deliveries
SET status = CASE WHEN target = 'sms' THEN 'unknown' WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END,
    last_error = coalesce(last_error, 'Interrupted; picked up again by the dispatcher'),
    next_attempt_at = now(), updated_at = now()
WHERE status = 'running' AND updated_at < now() - interval '15 minutes'
RETURNING submission_id, target, status;`;
const CLAIM_DELIVERY = `
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
const FINISH_DELIVERY = `
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
const LEGACY_STATUS = `
SELECT s.status AS chatwoot, a.status AS sms, a.attempts AS sms_attempts, (c.submission_id IS NOT NULL) AS crm_synced
FROM submissions s
LEFT JOIN sms_acknowledgements a ON a.submission_id = s.id
LEFT JOIN crm_sync c ON c.submission_id = s.id
WHERE s.id = $1::uuid;`;
const CLAIM_SUBMISSION_FOR = CLAIM_SUBMISSION.replace("WHERE c.status = 'received'", "WHERE c.status = 'received' AND c.id = $1::uuid");
const RELEASE_SUBMISSION = `
UPDATE submissions
SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'received' END, last_error = $2, updated_at = now()
WHERE id = $1::uuid AND status = 'delivering'
RETURNING status;`;
const SYNC_CANDIDATE_FOR = SYNC_CANDIDATES.replace(/WHERE c\.submission_id IS NULL\n {3}OR c\.ack_status IS DISTINCT FROM nullif\(concat_ws\(':', a\.status, a\.delivery_status, a\.wa_status, a\.wa_delivery\), ''\)\nORDER BY s\.created_at\nLIMIT \$1;/, "WHERE s.id = $1::uuid;");
if (SYNC_CANDIDATE_FOR === SYNC_CANDIDATES)
    throw new Error("SYNC_CANDIDATE_FOR: the WHERE clause was not replaced");
const ERASURE_DISPATCH_LOCK = DISPATCH_LOCK;
const ERASURE_DISPATCH_UNLOCK = `SELECT pg_advisory_unlock(hashtext('talent:dispatch')) AS unlocked;`;
const FILES_SUBMISSION = `
SELECT s.id, s.ref, c.application_id
FROM submissions s LEFT JOIN crm_sync c ON c.submission_id = s.id
WHERE s.id = $1::uuid;`;
const FILES_FOR = `
SELECT id, position, kind, r2_key, mime, size_bytes, twenty_file_id, twenty_attachment_id, crm_file_status
FROM attachments WHERE submission_id = $1::uuid ORDER BY position;`;
const SAVE_FILE_ID = `UPDATE attachments SET twenty_file_id = $2::uuid, crm_file_error = NULL, updated_at = now() WHERE id = $1::uuid;`;
const SETTLE_FILE = `
UPDATE attachments
SET crm_file_status = $2, twenty_attachment_id = coalesce($3::uuid, twenty_attachment_id),
    twenty_file_id = coalesce($4::uuid, twenty_file_id), crm_file_error = $5, crm_file_at = now(), updated_at = now()
WHERE id = $1::uuid;`;
const FILE_ERROR = `UPDATE attachments SET crm_file_error = $2, updated_at = now() WHERE id = $1::uuid;`;
const CLEAR_FILE_ID = `UPDATE attachments SET twenty_file_id = NULL, updated_at = now() WHERE id = $1::uuid;`;
  return { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, GET_ACKNOWLEDGEMENT, SKIP_WHATSAPP, CLAIM_WHATSAPP_ACK, SAVE_WHATSAPP_RESULT, RECOVER_WHATSAPP_SEND, SAVE_WHATSAPP_REPORT, SKIP_SMS, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, CLAIM_SUBMISSION_FOR, RELEASE_SUBMISSION, SYNC_CANDIDATE_FOR, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, FILES_SUBMISSION, FILES_FOR, SAVE_FILE_ID, SETTLE_FILE, FILE_ERROR, CLEAR_FILE_ID };
})();

export async function main() {
    await withTalentDb((query) => query(schemaStatements("-- Talent intake schema for the `talent` database on pg-main.\n-- Owned by the `talent` role; applied by the Windmill script f/talent/setup\n-- (safe to re-run). See integrations/windmill/README.md.\nDO $$\nBEGIN\n  CREATE TABLE IF NOT EXISTS submissions (\n    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n    ref                      text NOT NULL UNIQUE,\n    source                   text NOT NULL CHECK (source IN ('web_en', 'web_hi', 'web_hinglish', 'whatsapp', 'phone', 'sms')),\n    locale                   text NOT NULL CHECK (locale IN ('en', 'hi', 'hinglish')),\n    phone                    text NOT NULL,\n    consent_version          text NOT NULL,\n    consented_at             timestamptz NOT NULL,\n    adult                    boolean NOT NULL,\n    text                     text,\n    status                   text NOT NULL DEFAULT 'received'\n                             CHECK (status IN ('received', 'delivering', 'delivered', 'failed')),\n    attempts                 int NOT NULL DEFAULT 0,\n    last_error               text,\n    chatwoot_contact_id      bigint,\n    chatwoot_conversation_id bigint,\n    created_at               timestamptz NOT NULL DEFAULT now(),\n    updated_at               timestamptz NOT NULL DEFAULT now()\n  );\n  -- The role page it came from (JOB_ROLES in src/lib/talent-intake/rules.ts); null from /jobs.\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS role text;\n  CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions (status, created_at);\n  -- The hub page it came from (JOB_HUBS in rules.ts: /jobs/freshers…); null otherwise.\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS hub text;\n  CREATE INDEX IF NOT EXISTS submissions_role_idx ON submissions (role, created_at);\n  -- How it reached us (INTAKE_CHANNELS in rules.ts): the jobs form, an AI agent through /api/agent/jobs,\n  -- or the WhatsApp apply chat (f/talent/whatsapp, 19 Oct 2026).\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'web';\n  ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_channel_check;\n  ALTER TABLE submissions ADD CONSTRAINT submissions_channel_check CHECK (channel IN ('web', 'agent', 'whatsapp'));\n  -- The name an agent gave for itself, if any.\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS agent_name text;\n  -- Which web form ('long' or 'quick'; INTAKE_FORMS in rules.ts), the name typed\n  -- on the quick form, and its answers by question (QUICK_ANSWERS ids).\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS form text;\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS applicant_name text;\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS answers jsonb;\n  CREATE INDEX IF NOT EXISTS submissions_phone_idx ON submissions (phone);\n  -- PLAN §1a and §8.2 (16 Oct 2026), additive: new web submissions arrive as\n  -- source 'web' with a BCP 47 locale. The legacy sources and short locales\n  -- stay valid for old rows and the agent routes. Deploy this before the\n  -- website starts sending 'web'.\n  ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_source_check;\n  ALTER TABLE submissions ADD CONSTRAINT submissions_source_check\n    CHECK (source IN ('web', 'web_en', 'web_hi', 'web_hinglish', 'whatsapp', 'phone', 'sms'));\n  ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_locale_check;\n  ALTER TABLE submissions ADD CONSTRAINT submissions_locale_check\n    CHECK (locale IN ('en-IN', 'hi-IN', 'hi-Latn-IN', 'pa-IN', 'kn-IN', 'en', 'hi', 'hinglish'));\n  -- The submission's cluster (INTAKE_CLUSTERS in rules.ts): the area chosen,\n  -- else the page's, else 'other'; the page's own cluster; and the page's\n  -- neutral path (/jobs/haridwar). All null on older rows.\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS cluster text;\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS page_cluster text;\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS page_path text;\n  CREATE INDEX IF NOT EXISTS submissions_cluster_idx ON submissions (cluster, created_at);\n\n  -- Separate from Chatwoot delivery. Only new submissions are queued by intake;\n  -- setup never backfills acknowledgements for historical applications.\n  CREATE TABLE IF NOT EXISTS sms_acknowledgements (\n    submission_id uuid PRIMARY KEY REFERENCES submissions (id) ON DELETE CASCADE,\n    status text NOT NULL DEFAULT 'pending'\n      CHECK (status IN ('pending', 'sending', 'accepted', 'failed', 'unknown')),\n    attempts int NOT NULL DEFAULT 0,\n    request_id text,\n    last_error text,\n    next_attempt_at timestamptz NOT NULL DEFAULT now(),\n    accepted_at timestamptz,\n    created_at timestamptz NOT NULL DEFAULT now(),\n    updated_at timestamptz NOT NULL DEFAULT now()\n  );\n  CREATE INDEX IF NOT EXISTS sms_acknowledgements_pending_idx\n    ON sms_acknowledgements (next_attempt_at, created_at) WHERE status = 'pending';\n\n  CREATE TABLE IF NOT EXISTS attachments (\n    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n    submission_id       uuid NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,\n    position            int NOT NULL,\n    kind                text NOT NULL CHECK (kind IN ('audio', 'image', 'document')),\n    r2_key              text NOT NULL UNIQUE,\n    mime                text NOT NULL,\n    size_bytes          int NOT NULL,\n    original_name       text,\n    transcript          text,\n    transcript_language text,\n    transcript_status   text NOT NULL DEFAULT 'none'\n                        CHECK (transcript_status IN ('none', 'pending', 'running', 'done', 'failed')),\n    transcript_attempts int NOT NULL DEFAULT 0,\n    transcript_error    text,\n    sarvam_job_id       text, -- Sarvam request id of the transcript\n    created_at          timestamptz NOT NULL DEFAULT now(),\n    updated_at          timestamptz NOT NULL DEFAULT now(),\n    UNIQUE (submission_id, position)\n  );\n  CREATE INDEX IF NOT EXISTS attachments_transcript_idx ON attachments (transcript_status, created_at);\n\n  -- The worker list (PLAN §8.2): one row per mobile number, upserted by the\n  -- intake workflow with each submission. Nullable and additive. The 12-month\n  -- retention clock (privacy notice §10) runs from last_contact_at, which\n  -- only something the person does renews: an application, a reply, or a\n  -- confirmation on a call (last_confirmed_at). Calls or SMS we send that go\n  -- unanswered never renew it.\n  CREATE TABLE IF NOT EXISTS people (\n    phone             text PRIMARY KEY,\n    name              text,\n    clusters          text[] NOT NULL DEFAULT '{}',\n    home_area         text,\n    relocate          boolean,\n    roles             text[] NOT NULL DEFAULT '{}',\n    locale            text,\n    status            text NOT NULL DEFAULT 'active'\n                      CHECK (status IN ('active', 'placed', 'not-looking', 'do-not-contact')),\n    consent_version   text,\n    last_applied_at   timestamptz,\n    last_confirmed_at timestamptz,\n    last_contact_at   timestamptz,\n    created_at        timestamptz NOT NULL DEFAULT now(),\n    updated_at        timestamptz NOT NULL DEFAULT now()\n  );\n  CREATE INDEX IF NOT EXISTS people_last_contact_idx ON people (last_contact_at);\n  -- First run: everyone who already applied, from their submissions.\n  INSERT INTO people (phone, name, clusters, roles, locale, consent_version, last_applied_at, last_contact_at, created_at)\n  SELECT s.phone,\n         (array_agg(s.applicant_name ORDER BY s.created_at DESC) FILTER (WHERE s.applicant_name IS NOT NULL))[1],\n         coalesce(array_agg(DISTINCT s.cluster) FILTER (WHERE s.cluster IS NOT NULL), '{}'),\n         coalesce(array_agg(DISTINCT s.role) FILTER (WHERE s.role IS NOT NULL), '{}'),\n         (array_agg(s.locale ORDER BY s.created_at DESC))[1],\n         (array_agg(s.consent_version ORDER BY s.created_at DESC))[1],\n         max(s.created_at), max(s.created_at), min(s.created_at)\n  FROM submissions s\n  GROUP BY s.phone\n  ON CONFLICT (phone) DO NOTHING;\n\n  -- Erasure: a person's request (by mobile number, checked against a\n  -- VS-J- reference) or the 12-month retention rule. The retention workflow\n  -- deletes their R2 files, Chatwoot contacts (with conversations) and rows,\n  -- then clears the phone and reference here, keeping only the counts.\n  CREATE TABLE IF NOT EXISTS erasure_requests (\n    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n    phone               text,\n    ref                 text,\n    reason              text NOT NULL CHECK (reason IN ('request', 'retention')),\n    status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),\n    attempts            int NOT NULL DEFAULT 0,\n    last_error          text,\n    removed_submissions int,\n    removed_files       int,\n    removed_contacts    int,\n    requested_at        timestamptz NOT NULL DEFAULT now(),\n    processed_at        timestamptz,\n    updated_at          timestamptz NOT NULL DEFAULT now()\n  );\n  CREATE INDEX IF NOT EXISTS erasure_requests_pending_idx ON erasure_requests (status, requested_at);\n  CREATE UNIQUE INDEX IF NOT EXISTS erasure_requests_open_phone_idx ON erasure_requests (phone) WHERE status IN ('pending', 'running');\n\n  -- What f/talent/sync_crm has written to Twenty (crm.vayasyaseva.com) for\n  -- each submission, and the SMS status it last wrote, so it syncs each\n  -- application once and the acknowledgement again only when it changes.\n  CREATE TABLE IF NOT EXISTS crm_sync (\n    submission_id  uuid PRIMARY KEY REFERENCES submissions (id) ON DELETE CASCADE,\n    person_id      uuid,\n    application_id uuid,\n    ack_status     text,\n    synced_at      timestamptz NOT NULL DEFAULT now()\n  );\n\n  -- Handset delivery of an accepted acknowledgement: Fast2SMS's delivery\n  -- report (f/talent/delivery_report), or its lookup API when no report came\n  -- (f/talent/delivery_check). delivery_status is the outcome (delivered,\n  -- failed, pending); delivery_detail is Fast2SMS's own status and text.\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivery_status text;\n  ALTER TABLE sms_acknowledgements DROP CONSTRAINT IF EXISTS sms_acknowledgements_delivery_status_check;\n  ALTER TABLE sms_acknowledgements ADD CONSTRAINT sms_acknowledgements_delivery_status_check\n    CHECK (delivery_status IN ('delivered', 'failed', 'pending'));\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivery_detail text;\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivered_at timestamptz;\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivery_checked_at timestamptz;\n  CREATE INDEX IF NOT EXISTS sms_acknowledgements_request_idx ON sms_acknowledgements (request_id);\n\n  -- The WhatsApp acknowledgement (20 Oct 2026, talent/lib/whatsapp-ack.ts):\n  -- sent first, from the WhatsApp Business number; the SMS is the fallback.\n  -- wa_status is the send (skipped: no approved template for the language),\n  -- wa_delivery its report. status 'skipped': WhatsApp delivered, no SMS.\n  ALTER TABLE sms_acknowledgements DROP CONSTRAINT IF EXISTS sms_acknowledgements_status_check;\n  ALTER TABLE sms_acknowledgements ADD CONSTRAINT sms_acknowledgements_status_check\n    CHECK (status IN ('pending', 'sending', 'accepted', 'failed', 'unknown', 'skipped'));\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_status text;\n  ALTER TABLE sms_acknowledgements DROP CONSTRAINT IF EXISTS sms_acknowledgements_wa_status_check;\n  ALTER TABLE sms_acknowledgements ADD CONSTRAINT sms_acknowledgements_wa_status_check\n    CHECK (wa_status IN ('sending', 'accepted', 'failed', 'unknown', 'skipped'));\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_request_id text;\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_error text;\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_sent_at timestamptz;\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_updated_at timestamptz;\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_delivery text;\n  ALTER TABLE sms_acknowledgements DROP CONSTRAINT IF EXISTS sms_acknowledgements_wa_delivery_check;\n  ALTER TABLE sms_acknowledgements ADD CONSTRAINT sms_acknowledgements_wa_delivery_check\n    CHECK (wa_delivery IN ('read', 'delivered', 'failed', 'pending'));\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_detail text;\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_delivered_at timestamptz;\n\n  -- Roadmap 1F: one deliveries row per submission and target (the SMS\n  -- acknowledgement, the Chatwoot conversation, the Twenty CRM records),\n  -- worked by the one dispatcher (f/talent/dispatch) with exponential backoff\n  -- and a cap on attempts, after which a row is 'dead'. An SMS whose send was\n  -- interrupted is 'unknown' and is never sent again automatically. The\n  -- older status columns (submissions.status, sms_acknowledgements.status,\n  -- crm_sync) are kept and still written by each step; the views below show\n  -- the old statuses from the deliveries.\n  CREATE TABLE IF NOT EXISTS deliveries (\n    submission_id   uuid NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,\n    target          text NOT NULL CHECK (target IN ('sms', 'chatwoot', 'crm', 'files')),\n    status          text NOT NULL DEFAULT 'pending'\n                    CHECK (status IN ('pending', 'running', 'done', 'unknown', 'dead')),\n    attempts        int NOT NULL DEFAULT 0,\n    max_attempts    int NOT NULL,\n    next_attempt_at timestamptz NOT NULL DEFAULT now(),\n    last_error      text,\n    done_at         timestamptz,\n    created_at      timestamptz NOT NULL DEFAULT now(),\n    updated_at      timestamptz NOT NULL DEFAULT now(),\n    PRIMARY KEY (submission_id, target)\n  );\n  CREATE INDEX IF NOT EXISTS deliveries_due_idx ON deliveries (target, next_attempt_at) WHERE status = 'pending';\n  CREATE INDEX IF NOT EXISTS deliveries_status_idx ON deliveries (status, updated_at);\n\n  -- The files target (18 Oct 2026): applicants' files copied from R2 into\n  -- Twenty as attachments on their application (talent/lib/run-files.ts).\n  ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_target_check;\n  ALTER TABLE deliveries ADD CONSTRAINT deliveries_target_check CHECK (target IN ('sms', 'chatwoot', 'crm', 'files'));\n\n  -- Every new submission gets its four deliveries (SMS: three attempts, as\n  -- before; Chatwoot: three; CRM: eight; files into Twenty: eight).\n  CREATE OR REPLACE FUNCTION queue_deliveries() RETURNS trigger LANGUAGE plpgsql AS $fn$\n  BEGIN\n    INSERT INTO deliveries (submission_id, target, max_attempts)\n    VALUES (NEW.id, 'sms', 3), (NEW.id, 'chatwoot', 3), (NEW.id, 'crm', 8), (NEW.id, 'files', 8)\n    ON CONFLICT DO NOTHING;\n    RETURN NEW;\n  END\n  $fn$;\n  DROP TRIGGER IF EXISTS submissions_queue_deliveries ON submissions;\n  CREATE TRIGGER submissions_queue_deliveries AFTER INSERT ON submissions FOR EACH ROW EXECUTE FUNCTION queue_deliveries();\n\n  -- Twenty shows the acknowledgement's status: when it changes (sent,\n  -- delivered, read, failed, on WhatsApp or by SMS), the CRM delivery runs again.\n  CREATE OR REPLACE FUNCTION reopen_crm_delivery() RETURNS trigger LANGUAGE plpgsql AS $fn$\n  BEGIN\n    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.delivery_status IS DISTINCT FROM NEW.delivery_status\n       OR OLD.wa_status IS DISTINCT FROM NEW.wa_status OR OLD.wa_delivery IS DISTINCT FROM NEW.wa_delivery THEN\n      UPDATE deliveries SET status = 'pending', attempts = 0, next_attempt_at = now(), last_error = NULL, updated_at = now()\n      WHERE submission_id = NEW.submission_id AND target = 'crm' AND status IN ('done', 'dead');\n    END IF;\n    RETURN NEW;\n  END\n  $fn$;\n  DROP TRIGGER IF EXISTS sms_acknowledgements_reopen_crm ON sms_acknowledgements;\n  CREATE TRIGGER sms_acknowledgements_reopen_crm AFTER UPDATE ON sms_acknowledgements FOR EACH ROW EXECUTE FUNCTION reopen_crm_delivery();\n\n  -- The existing statuses, carried over once (re-running adds only what is missing).\n  INSERT INTO deliveries (submission_id, target, status, attempts, max_attempts, next_attempt_at, last_error, done_at, created_at, updated_at)\n  SELECT a.submission_id, 'sms',\n         CASE a.status WHEN 'pending' THEN 'pending' WHEN 'sending' THEN 'running' WHEN 'accepted' THEN 'done'\n                       WHEN 'failed' THEN 'dead' ELSE 'unknown' END,\n         a.attempts, 3, a.next_attempt_at, a.last_error, a.accepted_at, a.created_at, a.updated_at\n  FROM sms_acknowledgements a\n  ON CONFLICT DO NOTHING;\n  INSERT INTO deliveries (submission_id, target, status, attempts, max_attempts, last_error, done_at, created_at, updated_at)\n  SELECT s.id, 'chatwoot',\n         CASE s.status WHEN 'received' THEN 'pending' WHEN 'delivering' THEN 'running' WHEN 'delivered' THEN 'done' ELSE 'dead' END,\n         s.attempts, 3, s.last_error, CASE WHEN s.status = 'delivered' THEN s.updated_at END, s.created_at, s.updated_at\n  FROM submissions s\n  ON CONFLICT DO NOTHING;\n  INSERT INTO deliveries (submission_id, target, status, max_attempts, done_at, created_at, updated_at)\n  SELECT s.id, 'crm', CASE WHEN c.submission_id IS NULL THEN 'pending' ELSE 'done' END, 8, c.synced_at, s.created_at, coalesce(c.synced_at, s.created_at)\n  FROM submissions s LEFT JOIN crm_sync c ON c.submission_id = s.id\n  ON CONFLICT DO NOTHING;\n\n  -- The old statuses, from the deliveries: Chatwoot as submissions.status\n  -- named them, the SMS as sms_acknowledgements.status, and whether the CRM\n  -- has it. One row per submission.\n  CREATE OR REPLACE VIEW delivery_status AS\n  SELECT s.id AS submission_id, s.ref, s.created_at,\n         CASE c.status WHEN 'pending' THEN 'received' WHEN 'running' THEN 'delivering' WHEN 'done' THEN 'delivered' ELSE 'failed' END AS chatwoot_status,\n         CASE m.status WHEN 'pending' THEN 'pending' WHEN 'running' THEN 'sending' WHEN 'done' THEN 'accepted'\n                       WHEN 'dead' THEN 'failed' ELSE 'unknown' END AS sms_status,\n         (r.status = 'done') AS crm_synced,\n         c.attempts AS chatwoot_attempts, m.attempts AS sms_attempts, r.attempts AS crm_attempts,\n         coalesce(c.last_error, m.last_error, r.last_error) AS last_error\n  FROM submissions s\n  LEFT JOIN deliveries c ON c.submission_id = s.id AND c.target = 'chatwoot'\n  LEFT JOIN deliveries m ON m.submission_id = s.id AND m.target = 'sms'\n  LEFT JOIN deliveries r ON r.submission_id = s.id AND r.target = 'crm';\n\n  -- Work that needs a person: dead rows, SMS of unknown fate, and rows stuck\n  -- running or overdue (f/platform/health counts these). A files row waiting\n  -- for its Twenty application is not overdue itself: the CRM row is.\n  CREATE OR REPLACE VIEW deliveries_attention AS\n  SELECT d.*, s.ref,\n         CASE WHEN d.status = 'dead' THEN 'dead'\n              WHEN d.status = 'unknown' THEN 'unknown'\n              WHEN d.status = 'running' AND d.updated_at < now() - interval '15 minutes' THEN 'stuck'\n              ELSE 'overdue' END AS reason\n  FROM deliveries d JOIN submissions s ON s.id = d.submission_id\n  WHERE d.status IN ('dead', 'unknown')\n     OR (d.status = 'running' AND d.updated_at < now() - interval '15 minutes')\n     OR (d.status = 'pending' AND d.next_attempt_at < now() - interval '1 hour'\n         AND (d.target <> 'files' OR EXISTS (\n           SELECT 1 FROM crm_sync c WHERE c.submission_id = d.submission_id AND c.application_id IS NOT NULL)));\n\n  -- Idempotency-Key answers of the jobs routes (the site's\n  -- src/server/submissions/policies/idempotency.ts, through\n  -- f/platform/idempotency). Kept a day.\n  CREATE TABLE IF NOT EXISTS idempotency_keys (\n    scope       text NOT NULL,\n    key         text NOT NULL,\n    fingerprint text NOT NULL,\n    state       text NOT NULL CHECK (state IN ('running', 'done', 'failed')),\n    answer      jsonb,\n    carry       jsonb,\n    updated_at  timestamptz NOT NULL DEFAULT now(),\n    PRIMARY KEY (scope, key)\n  );\n  CREATE INDEX IF NOT EXISTS idempotency_keys_updated_idx ON idempotency_keys (updated_at);\n\n  -- Applicants' files into Twenty (18 Oct 2026; the files delivery target,\n  -- talent/lib/run-files.ts). Per file: the Twenty file and attachment it\n  -- became, and where it stands: pending; done (attached); missing (gone\n  -- from R2, which keeps files 90 days); skipped (voice notes, from before\n  -- 16 Oct 2026, are not copied and are left to expire).\n  ALTER TABLE attachments ADD COLUMN IF NOT EXISTS twenty_file_id uuid;\n  ALTER TABLE attachments ADD COLUMN IF NOT EXISTS twenty_attachment_id uuid;\n  ALTER TABLE attachments ADD COLUMN IF NOT EXISTS crm_file_status text NOT NULL DEFAULT 'pending';\n  ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_crm_file_status_check;\n  ALTER TABLE attachments ADD CONSTRAINT attachments_crm_file_status_check\n    CHECK (crm_file_status IN ('pending', 'done', 'missing', 'skipped'));\n  ALTER TABLE attachments ADD COLUMN IF NOT EXISTS crm_file_error text;\n  ALTER TABLE attachments ADD COLUMN IF NOT EXISTS crm_file_at timestamptz;\n  -- How many Twenty attachments an erasure removed.\n  ALTER TABLE erasure_requests ADD COLUMN IF NOT EXISTS removed_crm_files int;\n\n  -- The backfill: a files delivery for every earlier application with files\n  -- (re-running adds only what is missing). Oldest first, two minutes apart,\n  -- so the first to expire from R2 (from 25 Dec 2026) go first and the\n  -- queue drains without counting as overdue.\n  INSERT INTO deliveries (submission_id, target, max_attempts, next_attempt_at, created_at, updated_at)\n  SELECT b.id, 'files', 8, now() + (b.n - 1) * interval '2 minutes', b.created_at, now()\n  FROM (\n    SELECT s.id, s.created_at, row_number() OVER (ORDER BY s.created_at, s.id) AS n\n    FROM submissions s\n    WHERE EXISTS (SELECT 1 FROM attachments a WHERE a.submission_id = s.id)\n      AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.submission_id = s.id AND d.target = 'files')\n  ) b\n  ON CONFLICT DO NOTHING;\n\n  -- The WhatsApp apply chat (19 Oct 2026) was removed the same day, before\n  -- its webhook was ever made: its two tables never held a row.\n  DROP TABLE IF EXISTS whatsapp_chats;\n  DROP TABLE IF EXISTS whatsapp_messages;\nEND\n$$;\n")));
    return { ok: true };
}

