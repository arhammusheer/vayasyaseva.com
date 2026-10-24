// Generated from integrations/windmill/leads/scripts/setup.ts by integrations/windmill/build.mts. Edit the source, not this.

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
const { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, GET_ACKNOWLEDGEMENT, SKIP_WHATSAPP, CLAIM_WHATSAPP_ACK, SAVE_WHATSAPP_RESULT, RECOVER_WHATSAPP_SEND, SAVE_WHATSAPP_REPORT, SKIP_SMS, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, SYNC_CANDIDATE_FOR, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, FILES_SUBMISSION, FILES_FOR, SAVE_FILE_ID, SETTLE_FILE, FILE_ERROR, CLEAR_FILE_ID } = (() => {
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
  coalesce((SELECT jsonb_agg(a.r2_key) FROM attachments a JOIN submissions s ON s.id = a.submission_id WHERE s.phone = c.phone), '[]'::jsonb) AS files
FROM claimed c;`;
const DELETE_ROWS = `
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
SELECT a.status AS sms, a.attempts AS sms_attempts, (c.submission_id IS NOT NULL) AS crm_synced
FROM submissions s
LEFT JOIN sms_acknowledgements a ON a.submission_id = s.id
LEFT JOIN crm_sync c ON c.submission_id = s.id
WHERE s.id = $1::uuid;`;
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
  return { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, GET_ACKNOWLEDGEMENT, SKIP_WHATSAPP, CLAIM_WHATSAPP_ACK, SAVE_WHATSAPP_RESULT, RECOVER_WHATSAPP_SEND, SAVE_WHATSAPP_REPORT, SKIP_SMS, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, SYNC_CANDIDATE_FOR, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, FILES_SUBMISSION, FILES_FOR, SAVE_FILE_ID, SETTLE_FILE, FILE_ERROR, CLEAR_FILE_ID };
})();

export async function main() {
    await withDatabase("leads_pg_url", (query) => query(schemaStatements("-- The lead inbox: the `leads` database on pg-main (vayasya-infra\n-- apps/pg-main), owned by the `leads` role. Applied by f/leads/setup (safe to\n-- re-run). See integrations/windmill/README.md.\nDO $$\nBEGIN\n  -- One row per business enquiry or compliance help request, saved before\n  -- f/leads/intake (or f/platform/submission) answers 202: the canonical lead\n  -- as the website sent it (packages/contracts business_enquiry.v1).\n  CREATE TABLE IF NOT EXISTS leads (\n    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n    case_id         text NOT NULL UNIQUE,\n    type            text NOT NULL CHECK (type IN ('business_enquiry.v1', 'compliance_help.v1')),\n    channel         text NOT NULL CHECK (channel IN ('web', 'agent')),\n    payload         jsonb NOT NULL,\n    idempotency_key text,\n    received_at     timestamptz NOT NULL,\n    created_at      timestamptz NOT NULL DEFAULT now()\n  );\n  CREATE INDEX IF NOT EXISTS leads_received_idx ON leads (received_at);\n\n  -- Where each lead still has to go: Twenty CRM (company, contact, crew\n  -- request, enquiry; f/leads/sync_crm). Retries back off 1, 2, 4… minutes,\n  -- at most an hour, and stop at max_attempts ('dead').\n  CREATE TABLE IF NOT EXISTS deliveries (\n    lead_id         uuid NOT NULL REFERENCES leads (id) ON DELETE CASCADE,\n    target          text NOT NULL CHECK (target IN ('crm')),\n    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'dead')),\n    attempts        int NOT NULL DEFAULT 0,\n    max_attempts    int NOT NULL DEFAULT 8,\n    next_attempt_at timestamptz NOT NULL DEFAULT now(),\n    last_error      text,\n    result          jsonb,\n    done_at         timestamptz,\n    created_at      timestamptz NOT NULL DEFAULT now(),\n    updated_at      timestamptz NOT NULL DEFAULT now(),\n    PRIMARY KEY (lead_id, target)\n  );\n  CREATE INDEX IF NOT EXISTS deliveries_due_idx ON deliveries (target, next_attempt_at) WHERE status = 'pending';\n\n  -- Dead rows, rows stuck running, and rows overdue by an hour (f/platform/health).\n  CREATE OR REPLACE VIEW deliveries_attention AS\n  SELECT d.*, l.case_id,\n         CASE WHEN d.status = 'dead' THEN 'dead'\n              WHEN d.status = 'running' AND d.updated_at < now() - interval '15 minutes' THEN 'stuck'\n              ELSE 'overdue' END AS reason\n  FROM deliveries d JOIN leads l ON l.id = d.lead_id\n  WHERE d.status = 'dead'\n     OR (d.status = 'running' AND d.updated_at < now() - interval '15 minutes')\n     OR (d.status = 'pending' AND d.next_attempt_at < now() - interval '1 hour');\n\n  -- Erasure of a business enquiry on request (privacy notice §10): by case ID\n  -- or by phone (every enquiry from that number). f/leads/erase removes the\n  -- enquiries from Twenty and this inbox, then clears case_id and phone here,\n  -- keeping only the counts. Queued by hand (integrations/windmill/OPERATIONS.md);\n  -- nothing is queued automatically.\n  CREATE TABLE IF NOT EXISTS erasure_requests (\n    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n    case_id               text,\n    phone                 text,\n    reason                text NOT NULL DEFAULT 'request' CHECK (reason IN ('request')),\n    status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),\n    attempts              int NOT NULL DEFAULT 0,\n    last_error            text,\n    removed_leads         int,\n    removed_opportunities int,\n    removed_people        int,\n    removed_companies     int,\n    removed_crm_files     int,\n    requested_at          timestamptz NOT NULL DEFAULT now(),\n    processed_at          timestamptz,\n    updated_at            timestamptz NOT NULL DEFAULT now(),\n    CHECK (status = 'done' OR case_id IS NOT NULL OR phone IS NOT NULL)\n  );\n  CREATE INDEX IF NOT EXISTS erasure_requests_pending_idx ON erasure_requests (status, requested_at);\n\n  -- Idempotency-Key answers of the contact routes (f/platform/idempotency). Kept a day.\n  CREATE TABLE IF NOT EXISTS idempotency_keys (\n    scope       text NOT NULL,\n    key         text NOT NULL,\n    fingerprint text NOT NULL,\n    state       text NOT NULL CHECK (state IN ('running', 'done', 'failed')),\n    answer      jsonb,\n    carry       jsonb,\n    updated_at  timestamptz NOT NULL DEFAULT now(),\n    PRIMARY KEY (scope, key)\n  );\n  CREATE INDEX IF NOT EXISTS idempotency_keys_updated_idx ON idempotency_keys (updated_at);\nEND\n$$;\n")));
    return { ok: true };
}

