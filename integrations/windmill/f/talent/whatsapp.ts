// Generated from integrations/windmill/talent/scripts/whatsapp.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

import { Ajv2020 } from "ajv/dist/2020.js";

import { timingSafeEqual } from "node:crypto";

import { randomInt } from "node:crypto";

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
    fast2sms_whatsapp_secret: { secret: true },
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

// integrations/windmill/talent/lib/response.ts
const { respond, accepted, forbidden, invalid, failed } = (() => {
function respond(status, body) {
    return { wm_status_code: status, result: body };
}
const accepted = (ref) => respond(202, { ok: true, ref });
const forbidden = () => respond(403, { ok: false, error: "Forbidden" });
const invalid = (errors) => respond(400, { ok: false, error: `Invalid submission: ${errors.join(", ")}` });
const failed = () => respond(500, { ok: false, error: "Internal error" });
  return { respond, accepted, forbidden, invalid, failed };
})();

// integrations/windmill/talent/lib/sql.ts
const { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, CLAIM_SUBMISSION_FOR, RELEASE_SUBMISSION, SYNC_CANDIDATE_FOR, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, FILES_SUBMISSION, FILES_FOR, SAVE_FILE_ID, SETTLE_FILE, FILE_ERROR, CLEAR_FILE_ID, SEEN_WHATSAPP_MESSAGE, FORGET_WHATSAPP_MESSAGE, GET_WHATSAPP_CHAT, SAVE_WHATSAPP_CHAT, UPDATE_WHATSAPP_CHAT, DELETE_WHATSAPP_CHAT, PURGE_WHATSAPP } = (() => {
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
), chat AS (
  DELETE FROM whatsapp_chats WHERE phone = $2 RETURNING 1
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
       c.person_id, c.application_id, c.ack_status AS synced_ack_status, (c.submission_id IS NOT NULL) AS synced
FROM submissions s
LEFT JOIN people p ON p.phone = s.phone
LEFT JOIN sms_acknowledgements a ON a.submission_id = s.id
LEFT JOIN crm_sync c ON c.submission_id = s.id
WHERE c.submission_id IS NULL
   OR c.ack_status IS DISTINCT FROM (CASE WHEN a.delivery_status IS NULL THEN a.status ELSE a.status || ':' || a.delivery_status END)
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
SET status = CASE WHEN $3 = 'retry' THEN (CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END) ELSE $3 END,
    next_attempt_at = CASE WHEN $3 = 'retry' THEN now() + make_interval(secs => $5::int) ELSE next_attempt_at END,
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
const SYNC_CANDIDATE_FOR = SYNC_CANDIDATES.replace(/WHERE c\.submission_id IS NULL\n {3}OR c\.ack_status IS DISTINCT FROM \(CASE WHEN a\.delivery_status IS NULL THEN a\.status ELSE a\.status \|\| ':' \|\| a\.delivery_status END\)\nORDER BY s\.created_at\nLIMIT \$1;/, "WHERE s.id = $1::uuid;");
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
const SEEN_WHATSAPP_MESSAGE = `INSERT INTO whatsapp_messages (message_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING message_id;`;
const FORGET_WHATSAPP_MESSAGE = `DELETE FROM whatsapp_messages WHERE message_id = $1;`;
const GET_WHATSAPP_CHAT = `
SELECT phone, locale, step, answers, name, notes, consented_at AS "consentedAt", ref, version, updated_at AS "updatedAt"
FROM whatsapp_chats WHERE phone = $1;`;
const SAVE_WHATSAPP_CHAT = `
INSERT INTO whatsapp_chats AS c (phone, locale, step, answers, name, notes, consented_at, ref, version, updated_at)
SELECT $1, $2, $3, $4::jsonb, $5, $6, $7::timestamptz, $8, 1, now()
WHERE $9::int = 0
ON CONFLICT (phone) DO NOTHING
RETURNING version;`;
const UPDATE_WHATSAPP_CHAT = `
UPDATE whatsapp_chats
SET locale = $2, step = $3, answers = $4::jsonb, name = $5, notes = $6, consented_at = $7::timestamptz, ref = $8,
    version = version + 1, updated_at = now()
WHERE phone = $1 AND version = $9::int
RETURNING version;`;
const DELETE_WHATSAPP_CHAT = `DELETE FROM whatsapp_chats WHERE phone = $1 AND version = $2::int RETURNING phone;`;
const PURGE_WHATSAPP = `
WITH chats AS (
  DELETE FROM whatsapp_chats
  WHERE (consented_at IS NULL AND updated_at < now() - interval '1 day') OR updated_at < now() - interval '30 days'
  RETURNING 1
), messages AS (
  DELETE FROM whatsapp_messages WHERE received_at < now() - interval '3 days' RETURNING 1
)
SELECT (SELECT count(*) FROM chats) AS chats, (SELECT count(*) FROM messages) AS messages;`;
  return { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, CLAIM_SUBMISSION_FOR, RELEASE_SUBMISSION, SYNC_CANDIDATE_FOR, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, FILES_SUBMISSION, FILES_FOR, SAVE_FILE_ID, SETTLE_FILE, FILE_ERROR, CLEAR_FILE_ID, SEEN_WHATSAPP_MESSAGE, FORGET_WHATSAPP_MESSAGE, GET_WHATSAPP_CHAT, SAVE_WHATSAPP_CHAT, UPDATE_WHATSAPP_CHAT, DELETE_WHATSAPP_CHAT, PURGE_WHATSAPP };
})();

// packages/contracts/src/rules.ts
const { REF_PATTERN, INTAKE_SOURCES, WEB_SOURCE, WHATSAPP_SOURCE, isSubmissionSource, INTAKE_LOCALES, isIntakeLocale, LEGACY_SOURCE_LOCALES, INTAKE_CLUSTERS, isIntakeCluster, PAGE_PATH_PATTERN, MAX_PAGE_PATH_LENGTH, isPagePath, INTAKE_CHANNELS, AGENT_LANGUAGE_SOURCES, MAX_AGENT_NAME_LENGTH, JOB_ROLES, JOB_ROLE_SLUGS, isJobRole, JOB_HUBS, JOB_HUB_SLUGS, isJobHub, INTAKE_FORMS, INTAKE_FORM_KEYS, MAX_APPLICANT_NAME_LENGTH, QUICK_ANSWERS, AREA_CLUSTERS, submissionCluster, QUICK_QUESTIONS, cleanQuickAnswers, ATTACHMENT_KINDS, ATTACHMENT_MIME, INTAKE_LIMITS, attachmentKeyPrefix, isAttachmentKeyFor, normaliseIndianMobile } = (() => {
const REF_PATTERN = /^VS-J-[A-Z0-9]{6}$/;
const INTAKE_SOURCES = {
    web_en: "en",
    web_hi: "hi",
    web_hinglish: "hinglish",
};
const WEB_SOURCE = "web";
const WHATSAPP_SOURCE = "whatsapp";
function isSubmissionSource(value) {
    return value === WEB_SOURCE || (typeof value === "string" && Object.hasOwn(INTAKE_SOURCES, value));
}
const INTAKE_LOCALES = ["en-IN", "hi-IN", "hi-Latn-IN", "pa-IN", "kn-IN"];
function isIntakeLocale(value) {
    return typeof value === "string" && INTAKE_LOCALES.includes(value);
}
const LEGACY_SOURCE_LOCALES = { web_en: "en-IN", web_hi: "hi-IN", web_hinglish: "hi-Latn-IN" };
const INTAKE_CLUSTERS = ["haridwar", "uttarakhand", "delhi-ncr", "bengaluru", "jalandhar", "saharanpur", "other", "punjab", "dehradun"];
function isIntakeCluster(value) {
    return typeof value === "string" && INTAKE_CLUSTERS.includes(value);
}
const PAGE_PATH_PATTERN = /^\/([a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*)?$/;
const MAX_PAGE_PATH_LENGTH = 200;
function isPagePath(value) {
    return typeof value === "string" && value.length <= MAX_PAGE_PATH_LENGTH && PAGE_PATH_PATTERN.test(value);
}
const INTAKE_CHANNELS = ["web", "agent", "whatsapp"];
const AGENT_LANGUAGE_SOURCES = { en: "web_en", hi: "web_hi", hinglish: "web_hinglish" };
const MAX_AGENT_NAME_LENGTH = 100;
const JOB_ROLES = {
    "factory-helper": "Factory helper",
    packing: "Packing",
    "machine-operator": "Machine operator",
    warehouse: "Warehouse: loading, picking, packing",
    "forklift-operator": "Forklift operator",
    "data-entry-operator": "Data entry operator",
    housekeeping: "Housekeeping",
    "iti-trades": "ITI trades: welder, fitter, electrician",
    electrician: "Electrician",
    welder: "Welder",
    fitter: "Fitter",
};
const JOB_ROLE_SLUGS = Object.keys(JOB_ROLES);
function isJobRole(value) {
    return typeof value === "string" && Object.hasOwn(JOB_ROLES, value);
}
const JOB_HUBS = {
    freshers: "Freshers page",
    "10th-pass": "10th pass page",
    "12th-pass": "12th pass page",
};
const JOB_HUB_SLUGS = Object.keys(JOB_HUBS);
function isJobHub(value) {
    return typeof value === "string" && Object.hasOwn(JOB_HUBS, value);
}
const INTAKE_FORMS = {
    long: "Long form (/jobs and role pages)",
    quick: "Quick apply (/jobs/apply)",
};
const INTAKE_FORM_KEYS = Object.keys(INTAKE_FORMS);
const MAX_APPLICANT_NAME_LENGTH = 80;
const QUICK_ANSWERS = {
    work: {
        "factory-helper": "Factory helper", packing: "Packing", warehouse: "Warehouse / loading", "machine-operator": "Machine operator",
        "iti-trades": "ITI trade", housekeeping: "Housekeeping", "data-entry-operator": "Data entry", "forklift-operator": "Forklift operator",
        any: "Any work",
    },
    trade: { electrician: "Electrician", welder: "Welder", fitter: "Fitter", machinist: "Machinist / turner", "other-trade": "Other trade" },
    iti: { "iti-pass": "ITI passed", "iti-pursuing": "Studying / apprentice", "no-iti": "Experience, no ITI" },
    machines: {
        "packing-machine": "Packing machines", moulding: "Injection moulding", press: "Press / sheet metal", "cnc-vmc": "CNC / VMC",
        "other-machine": "Other machines",
    },
    forklift: { "licence-experience": "Licence and experience", "experience-only": "Experience, no licence", "want-to-learn": "Wants to learn" },
    computer: { typing: "Typing", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP" },
    experience: { fresher: "Fresher", "under-1": "Under 1 year", "1-3": "1 to 3 years", "3-plus": "3+ years" },
    education: { "below-10th": "Below 10th", "10th": "10th pass", "12th": "12th pass", "iti-diploma": "ITI / diploma", graduate: "Graduate" },
    shift: { day: "Day", night: "Night", rotating: "Rotating / any" },
    start: { now: "Immediately", week: "Within a week", month: "Within a month" },
    area: {
        "sidcul-bahadrabad": "SIDCUL / Bahadrabad", "haridwar-jwalapur": "Haridwar city / Jwalapur", "roorkee-bhagwanpur": "Roorkee / Bhagwanpur",
        laksar: "Laksar", outside: "Outside Haridwar",
        "bengaluru:north": "Bengaluru North / Peenya", "bengaluru:south": "Bengaluru South / Electronic City", "bengaluru:east": "Bengaluru East / Whitefield",
        "bengaluru:west": "Bengaluru West / Kengeri", "bengaluru:outside": "Outside Bengaluru",
        "jalandhar:kapurthala": "Kapurthala", "jalandhar:city": "Jalandhar city", "jalandhar:phagwara-goraya": "Phagwara / Goraya",
        "jalandhar:outside": "Outside Jalandhar and Kapurthala",
        "uttarakhand:haridwar": "Haridwar / Roorkee", "uttarakhand:dehradun-selaqui": "Dehradun / Selaqui",
        "uttarakhand:udham-singh-nagar": "Rudrapur / Kashipur / Sitarganj", "uttarakhand:other": "Elsewhere in Uttarakhand",
        "uttarakhand:outside": "Outside Uttarakhand",
        "punjab:jalandhar-kapurthala": "Jalandhar / Kapurthala", "punjab:ludhiana": "Ludhiana", "punjab:mohali": "Mohali / Kharar",
        "punjab:amritsar": "Amritsar", "punjab:other": "Elsewhere in Punjab", "punjab:outside": "Outside Punjab",
        "dehradun:selaqui-sahaspur": "Selaqui / Sahaspur", "dehradun:city": "Dehradun city", "dehradun:rishikesh-doiwala": "Rishikesh / Doiwala",
        "dehradun:vikasnagar": "Vikasnagar / Herbertpur", "dehradun:outside": "Outside Dehradun",
        "market:haridwar": "Haridwar / Roorkee", "market:uttarakhand": "Elsewhere in Uttarakhand", "market:jalandhar": "Jalandhar / Kapurthala",
        "market:punjab": "Elsewhere in Punjab", "market:bengaluru": "Bengaluru", "market:other": "Somewhere else",
        "market:dehradun": "Dehradun / Selaqui",
        "haridwar:rest-of-uttarakhand": "Elsewhere in Uttarakhand (Haridwar form)", "jalandhar:rest-of-punjab": "Elsewhere in Punjab (Jalandhar form)",
        "dehradun:rest-of-uttarakhand": "Elsewhere in Uttarakhand (Dehradun form)",
    },
};
const AREA_CLUSTERS = {
    "sidcul-bahadrabad": "haridwar",
    "haridwar-jwalapur": "haridwar",
    "roorkee-bhagwanpur": "haridwar",
    laksar: "haridwar",
    outside: null,
    "bengaluru:north": "bengaluru",
    "bengaluru:south": "bengaluru",
    "bengaluru:east": "bengaluru",
    "bengaluru:west": "bengaluru",
    "bengaluru:outside": null,
    "jalandhar:kapurthala": "jalandhar",
    "jalandhar:city": "jalandhar",
    "jalandhar:phagwara-goraya": "jalandhar",
    "jalandhar:outside": null,
    "uttarakhand:haridwar": "haridwar",
    "uttarakhand:dehradun-selaqui": "dehradun",
    "uttarakhand:udham-singh-nagar": "uttarakhand",
    "uttarakhand:other": "uttarakhand",
    "uttarakhand:outside": null,
    "punjab:jalandhar-kapurthala": "jalandhar",
    "punjab:ludhiana": "punjab",
    "punjab:mohali": "punjab",
    "punjab:amritsar": "punjab",
    "punjab:other": "punjab",
    "punjab:outside": null,
    "dehradun:selaqui-sahaspur": "dehradun",
    "dehradun:city": "dehradun",
    "dehradun:rishikesh-doiwala": "dehradun",
    "dehradun:vikasnagar": "dehradun",
    "dehradun:outside": null,
    "market:haridwar": "haridwar",
    "market:uttarakhand": "uttarakhand",
    "market:jalandhar": "jalandhar",
    "market:punjab": "punjab",
    "market:bengaluru": "bengaluru",
    "market:other": null,
    "market:dehradun": "dehradun",
    "haridwar:rest-of-uttarakhand": "uttarakhand",
    "jalandhar:rest-of-punjab": "punjab",
    "dehradun:rest-of-uttarakhand": "uttarakhand",
};
function submissionCluster(pageCluster, answers) {
    const area = answers?.area?.[0];
    const fromArea = area && Object.hasOwn(AREA_CLUSTERS, area) ? AREA_CLUSTERS[area] : null;
    return fromArea ?? pageCluster ?? "other";
}
const QUICK_QUESTIONS = {
    work: "Work", trade: "ITI trade", iti: "ITI", machines: "Machines", forklift: "Forklift", computer: "Computer skills",
    experience: "Experience", education: "Education", shift: "Shifts", start: "Can start", area: "Area",
};
function cleanQuickAnswers(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const out = {};
    for (const [question, options] of Object.entries(QUICK_ANSWERS)) {
        const values = raw[question];
        if (!Array.isArray(values))
            continue;
        const kept = [...new Set(values.filter((v) => typeof v === "string" && Object.hasOwn(options, v)))];
        if (kept.length)
            out[question] = kept;
    }
    return Object.keys(out).length ? out : null;
}
const ATTACHMENT_KINDS = ["image", "document"];
const ATTACHMENT_MIME = {
    image: /^image\/(jpeg|png|webp)$/,
    document: /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
};
const INTAKE_LIMITS = {
    maxAttachments: 8,
    maxTextLength: 4000,
    maxFileNameLength: 200,
    maxBytes: { image: 10 * 1024 * 1024, document: 20 * 1024 * 1024 },
};
function attachmentKeyPrefix(ref, at) {
    const month = String(at.getUTCMonth() + 1).padStart(2, "0");
    return `intake/${at.getUTCFullYear()}/${month}/${ref}/`;
}
function isAttachmentKeyFor(key, ref) {
    return key.startsWith("intake/") && key.includes(`/${ref}/`);
}
function normaliseIndianMobile(input) {
    const digits = input.replace(/\D/g, "");
    if (/^[6-9]\d{9}$/.test(digits))
        return `+91${digits}`;
    if (/^91[6-9]\d{9}$/.test(digits))
        return `+${digits}`;
    if (/^0[6-9]\d{9}$/.test(digits))
        return `+91${digits.slice(1)}`;
    return null;
}
  return { REF_PATTERN, INTAKE_SOURCES, WEB_SOURCE, WHATSAPP_SOURCE, isSubmissionSource, INTAKE_LOCALES, isIntakeLocale, LEGACY_SOURCE_LOCALES, INTAKE_CLUSTERS, isIntakeCluster, PAGE_PATH_PATTERN, MAX_PAGE_PATH_LENGTH, isPagePath, INTAKE_CHANNELS, AGENT_LANGUAGE_SOURCES, MAX_AGENT_NAME_LENGTH, JOB_ROLES, JOB_ROLE_SLUGS, isJobRole, JOB_HUBS, JOB_HUB_SLUGS, isJobHub, INTAKE_FORMS, INTAKE_FORM_KEYS, MAX_APPLICANT_NAME_LENGTH, QUICK_ANSWERS, AREA_CLUSTERS, submissionCluster, QUICK_QUESTIONS, cleanQuickAnswers, ATTACHMENT_KINDS, ATTACHMENT_MIME, INTAKE_LIMITS, attachmentKeyPrefix, isAttachmentKeyFor, normaliseIndianMobile };
})();

// integrations/windmill/contracts/validate.ts
const { check, SCHEMAS } = (() => {
const jobApplicationSchema = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://www.vayasyaseva.com/contracts/job_application.v1.canonical.schema.json","type":"object","properties":{"ref":{"type":"string","pattern":"^VS-J-[A-Z0-9]{6}$"},"source":{"anyOf":[{"type":"string","const":"web"},{"type":"string","const":"whatsapp"},{"type":"string","enum":["web_en","web_hi","web_hinglish"]}]},"locale":{"anyOf":[{"type":"string","enum":["en-IN","hi-IN","hi-Latn-IN","pa-IN","kn-IN"]},{"type":"null"}]},"cluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"pageCluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"pagePath":{"anyOf":[{"type":"string","maxLength":200,"pattern":"^\\/([a-z0-9]+(-[a-z0-9]+)*(\\/[a-z0-9]+(-[a-z0-9]+)*)*)?$"},{"type":"null"}]},"role":{"anyOf":[{"type":"string","enum":["factory-helper","packing","machine-operator","warehouse","forklift-operator","data-entry-operator","housekeeping","iti-trades","electrician","welder","fitter"]},{"type":"null"}]},"hub":{"anyOf":[{"type":"string","enum":["freshers","10th-pass","12th-pass"]},{"type":"null"}]},"channel":{"type":"string","enum":["web","agent","whatsapp"]},"agentName":{"anyOf":[{"type":"string","maxLength":100},{"type":"null"}]},"phone":{"type":"string","pattern":"^\\+91[6-9]\\d{9}$"},"adult":{"type":"boolean","const":true},"consent":{"type":"object","properties":{"version":{"type":"string","minLength":1,"maxLength":40},"at":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"}},"required":["version","at"],"additionalProperties":false},"text":{"anyOf":[{"type":"string","maxLength":4000},{"type":"null"}]},"attachments":{"maxItems":8,"type":"array","items":{"oneOf":[{"type":"object","properties":{"kind":{"type":"string","const":"image"},"key":{"type":"string","minLength":1,"maxLength":300},"mime":{"type":"string","pattern":"^image\\/(jpeg|png|webp)$"},"size":{"type":"integer","minimum":1,"maximum":10485760},"name":{"anyOf":[{"type":"string","maxLength":200},{"type":"null"}]}},"required":["kind","key","mime","size","name"],"additionalProperties":false},{"type":"object","properties":{"kind":{"type":"string","const":"document"},"key":{"type":"string","minLength":1,"maxLength":300},"mime":{"type":"string","pattern":"^application\\/(pdf|msword|vnd\\.openxmlformats-officedocument\\.wordprocessingml\\.document)$"},"size":{"type":"integer","minimum":1,"maximum":20971520},"name":{"anyOf":[{"type":"string","maxLength":200},{"type":"null"}]}},"required":["kind","key","mime","size","name"],"additionalProperties":false}]}},"form":{"anyOf":[{"type":"string","enum":["long","quick"]},{"type":"null"}]},"applicantName":{"anyOf":[{"type":"string","minLength":1,"maxLength":80},{"type":"null"}]},"answers":{"anyOf":[{"type":"object","properties":{"work":{"minItems":1,"type":"array","items":{"type":"string","enum":["factory-helper","packing","warehouse","machine-operator","iti-trades","housekeeping","data-entry-operator","forklift-operator","any"]},"uniqueItems":true},"trade":{"minItems":1,"type":"array","items":{"type":"string","enum":["electrician","welder","fitter","machinist","other-trade"]},"uniqueItems":true},"iti":{"minItems":1,"type":"array","items":{"type":"string","enum":["iti-pass","iti-pursuing","no-iti"]},"uniqueItems":true},"machines":{"minItems":1,"type":"array","items":{"type":"string","enum":["packing-machine","moulding","press","cnc-vmc","other-machine"]},"uniqueItems":true},"forklift":{"minItems":1,"type":"array","items":{"type":"string","enum":["licence-experience","experience-only","want-to-learn"]},"uniqueItems":true},"computer":{"minItems":1,"type":"array","items":{"type":"string","enum":["typing","excel","tally","sap-erp"]},"uniqueItems":true},"experience":{"minItems":1,"type":"array","items":{"type":"string","enum":["fresher","under-1","1-3","3-plus"]},"uniqueItems":true},"education":{"minItems":1,"type":"array","items":{"type":"string","enum":["below-10th","10th","12th","iti-diploma","graduate"]},"uniqueItems":true},"shift":{"minItems":1,"type":"array","items":{"type":"string","enum":["day","night","rotating"]},"uniqueItems":true},"start":{"minItems":1,"type":"array","items":{"type":"string","enum":["now","week","month"]},"uniqueItems":true},"area":{"minItems":1,"type":"array","items":{"type":"string","enum":["sidcul-bahadrabad","haridwar-jwalapur","roorkee-bhagwanpur","laksar","outside","bengaluru:north","bengaluru:south","bengaluru:east","bengaluru:west","bengaluru:outside","jalandhar:kapurthala","jalandhar:city","jalandhar:phagwara-goraya","jalandhar:outside","uttarakhand:haridwar","uttarakhand:dehradun-selaqui","uttarakhand:udham-singh-nagar","uttarakhand:other","uttarakhand:outside","punjab:jalandhar-kapurthala","punjab:ludhiana","punjab:mohali","punjab:amritsar","punjab:other","punjab:outside","dehradun:selaqui-sahaspur","dehradun:city","dehradun:rishikesh-doiwala","dehradun:vikasnagar","dehradun:outside","market:haridwar","market:uttarakhand","market:jalandhar","market:punjab","market:bengaluru","market:other","market:dehradun","haridwar:rest-of-uttarakhand","jalandhar:rest-of-punjab","dehradun:rest-of-uttarakhand"]},"uniqueItems":true}},"additionalProperties":false,"minProperties":1},{"type":"null"}]}},"required":["ref","source","locale","cluster","pageCluster","pagePath","role","hub","channel","agentName","phone","adult","consent","text","attachments","form","applicantName","answers"],"additionalProperties":false,"title":"job_application.v1 (canonical)","description":"A job application as the website forwards it to Windmill f/talent/intake.","allOf":[{"anyOf":[{"properties":{"text":{"type":"string","minLength":1}},"required":["text"]},{"properties":{"attachments":{"minItems":1}},"required":["attachments"]},{"properties":{"answers":{"type":"object"}},"required":["answers"]}]},{"if":{"properties":{"source":{"const":"web"}},"required":["source"]},"then":{"properties":{"locale":{"type":"string"}}}},{"if":{"properties":{"source":{"const":"whatsapp"}},"required":["source"]},"then":{"properties":{"channel":{"const":"whatsapp"},"locale":{"type":"string"}}}}]};
const businessEnquirySchema = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://www.vayasyaseva.com/contracts/business_enquiry.v1.canonical.schema.json","type":"object","properties":{"caseId":{"type":"string","pattern":"^(REQ|AGT)-\\d{8}-[0-9A-F]{8}$"},"receivedAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"channel":{"type":"string","enum":["web","agent"]},"name":{"type":"string","minLength":1,"maxLength":120},"company":{"anyOf":[{"type":"string","minLength":1,"maxLength":160},{"type":"null"}]},"jobTitle":{"anyOf":[{"type":"string","minLength":1,"maxLength":120},{"type":"null"}]},"phone":{"type":"string","maxLength":30,"pattern":"^\\D*(?:\\d\\D*){10,}$"},"email":{"anyOf":[{"type":"string","maxLength":200,"pattern":"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"},{"type":"null"}]},"services":{"maxItems":20,"type":"array","items":{"type":"string","minLength":1,"maxLength":40}},"headcount":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"headcountBand":{"anyOf":[{"type":"string","minLength":1,"maxLength":20},{"type":"null"}]},"site":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]},"cluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"startWindow":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"targetStartDate":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"requestType":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"enquiry":{"type":"string","minLength":1,"maxLength":8000},"sourcePath":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]}},"required":["caseId","receivedAt","channel","name","company","jobTitle","phone","email","services","headcount","headcountBand","site","cluster","startWindow","targetStartDate","requestType","enquiry","sourcePath"],"additionalProperties":false,"title":"business_enquiry.v1 (canonical)","description":"A business enquiry as the website forwards it to Windmill f/leads/intake."};
const envelopeSchema = {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://www.vayasyaseva.com/contracts/envelope.v1.canonical.schema.json","oneOf":[{"type":"object","properties":{"v":{"type":"number","const":1},"sentAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"idempotencyKey":{"anyOf":[{"type":"string","pattern":"^[A-Za-z0-9_.:-]{8,128}$"},{"type":"null"}]},"type":{"type":"string","const":"job_application.v1"},"id":{"type":"string","pattern":"^VS-J-[A-Z0-9]{6}$"},"payload":{"type":"object","properties":{"ref":{"type":"string","pattern":"^VS-J-[A-Z0-9]{6}$"},"source":{"anyOf":[{"type":"string","const":"web"},{"type":"string","const":"whatsapp"},{"type":"string","enum":["web_en","web_hi","web_hinglish"]}]},"locale":{"anyOf":[{"type":"string","enum":["en-IN","hi-IN","hi-Latn-IN","pa-IN","kn-IN"]},{"type":"null"}]},"cluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"pageCluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"pagePath":{"anyOf":[{"type":"string","maxLength":200,"pattern":"^\\/([a-z0-9]+(-[a-z0-9]+)*(\\/[a-z0-9]+(-[a-z0-9]+)*)*)?$"},{"type":"null"}]},"role":{"anyOf":[{"type":"string","enum":["factory-helper","packing","machine-operator","warehouse","forklift-operator","data-entry-operator","housekeeping","iti-trades","electrician","welder","fitter"]},{"type":"null"}]},"hub":{"anyOf":[{"type":"string","enum":["freshers","10th-pass","12th-pass"]},{"type":"null"}]},"channel":{"type":"string","enum":["web","agent","whatsapp"]},"agentName":{"anyOf":[{"type":"string","maxLength":100},{"type":"null"}]},"phone":{"type":"string","pattern":"^\\+91[6-9]\\d{9}$"},"adult":{"type":"boolean","const":true},"consent":{"type":"object","properties":{"version":{"type":"string","minLength":1,"maxLength":40},"at":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"}},"required":["version","at"],"additionalProperties":false},"text":{"anyOf":[{"type":"string","maxLength":4000},{"type":"null"}]},"attachments":{"maxItems":8,"type":"array","items":{"oneOf":[{"type":"object","properties":{"kind":{"type":"string","const":"image"},"key":{"type":"string","minLength":1,"maxLength":300},"mime":{"type":"string","pattern":"^image\\/(jpeg|png|webp)$"},"size":{"type":"integer","minimum":1,"maximum":10485760},"name":{"anyOf":[{"type":"string","maxLength":200},{"type":"null"}]}},"required":["kind","key","mime","size","name"],"additionalProperties":false},{"type":"object","properties":{"kind":{"type":"string","const":"document"},"key":{"type":"string","minLength":1,"maxLength":300},"mime":{"type":"string","pattern":"^application\\/(pdf|msword|vnd\\.openxmlformats-officedocument\\.wordprocessingml\\.document)$"},"size":{"type":"integer","minimum":1,"maximum":20971520},"name":{"anyOf":[{"type":"string","maxLength":200},{"type":"null"}]}},"required":["kind","key","mime","size","name"],"additionalProperties":false}]}},"form":{"anyOf":[{"type":"string","enum":["long","quick"]},{"type":"null"}]},"applicantName":{"anyOf":[{"type":"string","minLength":1,"maxLength":80},{"type":"null"}]},"answers":{"anyOf":[{"type":"object","properties":{"work":{"minItems":1,"type":"array","items":{"type":"string","enum":["factory-helper","packing","warehouse","machine-operator","iti-trades","housekeeping","data-entry-operator","forklift-operator","any"]},"uniqueItems":true},"trade":{"minItems":1,"type":"array","items":{"type":"string","enum":["electrician","welder","fitter","machinist","other-trade"]},"uniqueItems":true},"iti":{"minItems":1,"type":"array","items":{"type":"string","enum":["iti-pass","iti-pursuing","no-iti"]},"uniqueItems":true},"machines":{"minItems":1,"type":"array","items":{"type":"string","enum":["packing-machine","moulding","press","cnc-vmc","other-machine"]},"uniqueItems":true},"forklift":{"minItems":1,"type":"array","items":{"type":"string","enum":["licence-experience","experience-only","want-to-learn"]},"uniqueItems":true},"computer":{"minItems":1,"type":"array","items":{"type":"string","enum":["typing","excel","tally","sap-erp"]},"uniqueItems":true},"experience":{"minItems":1,"type":"array","items":{"type":"string","enum":["fresher","under-1","1-3","3-plus"]},"uniqueItems":true},"education":{"minItems":1,"type":"array","items":{"type":"string","enum":["below-10th","10th","12th","iti-diploma","graduate"]},"uniqueItems":true},"shift":{"minItems":1,"type":"array","items":{"type":"string","enum":["day","night","rotating"]},"uniqueItems":true},"start":{"minItems":1,"type":"array","items":{"type":"string","enum":["now","week","month"]},"uniqueItems":true},"area":{"minItems":1,"type":"array","items":{"type":"string","enum":["sidcul-bahadrabad","haridwar-jwalapur","roorkee-bhagwanpur","laksar","outside","bengaluru:north","bengaluru:south","bengaluru:east","bengaluru:west","bengaluru:outside","jalandhar:kapurthala","jalandhar:city","jalandhar:phagwara-goraya","jalandhar:outside","uttarakhand:haridwar","uttarakhand:dehradun-selaqui","uttarakhand:udham-singh-nagar","uttarakhand:other","uttarakhand:outside","punjab:jalandhar-kapurthala","punjab:ludhiana","punjab:mohali","punjab:amritsar","punjab:other","punjab:outside","dehradun:selaqui-sahaspur","dehradun:city","dehradun:rishikesh-doiwala","dehradun:vikasnagar","dehradun:outside","market:haridwar","market:uttarakhand","market:jalandhar","market:punjab","market:bengaluru","market:other","market:dehradun","haridwar:rest-of-uttarakhand","jalandhar:rest-of-punjab","dehradun:rest-of-uttarakhand"]},"uniqueItems":true}},"additionalProperties":false,"minProperties":1},{"type":"null"}]}},"required":["ref","source","locale","cluster","pageCluster","pagePath","role","hub","channel","agentName","phone","adult","consent","text","attachments","form","applicantName","answers"],"additionalProperties":false,"title":"job_application.v1 (canonical)","description":"A job application as the website forwards it to Windmill f/talent/intake.","allOf":[{"anyOf":[{"properties":{"text":{"type":"string","minLength":1}},"required":["text"]},{"properties":{"attachments":{"minItems":1}},"required":["attachments"]},{"properties":{"answers":{"type":"object"}},"required":["answers"]}]},{"if":{"properties":{"source":{"const":"web"}},"required":["source"]},"then":{"properties":{"locale":{"type":"string"}}}},{"if":{"properties":{"source":{"const":"whatsapp"}},"required":["source"]},"then":{"properties":{"channel":{"const":"whatsapp"},"locale":{"type":"string"}}}}]}},"required":["v","sentAt","idempotencyKey","type","id","payload"],"additionalProperties":false},{"type":"object","properties":{"v":{"type":"number","const":1},"sentAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"idempotencyKey":{"anyOf":[{"type":"string","pattern":"^[A-Za-z0-9_.:-]{8,128}$"},{"type":"null"}]},"type":{"type":"string","const":"business_enquiry.v1"},"id":{"type":"string","pattern":"^(REQ|AGT)-\\d{8}-[0-9A-F]{8}$"},"payload":{"type":"object","properties":{"caseId":{"type":"string","pattern":"^(REQ|AGT)-\\d{8}-[0-9A-F]{8}$"},"receivedAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"channel":{"type":"string","enum":["web","agent"]},"name":{"type":"string","minLength":1,"maxLength":120},"company":{"anyOf":[{"type":"string","minLength":1,"maxLength":160},{"type":"null"}]},"jobTitle":{"anyOf":[{"type":"string","minLength":1,"maxLength":120},{"type":"null"}]},"phone":{"type":"string","maxLength":30,"pattern":"^\\D*(?:\\d\\D*){10,}$"},"email":{"anyOf":[{"type":"string","maxLength":200,"pattern":"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"},{"type":"null"}]},"services":{"maxItems":20,"type":"array","items":{"type":"string","minLength":1,"maxLength":40}},"headcount":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"headcountBand":{"anyOf":[{"type":"string","minLength":1,"maxLength":20},{"type":"null"}]},"site":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]},"cluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"startWindow":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"targetStartDate":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"requestType":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"enquiry":{"type":"string","minLength":1,"maxLength":8000},"sourcePath":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]}},"required":["caseId","receivedAt","channel","name","company","jobTitle","phone","email","services","headcount","headcountBand","site","cluster","startWindow","targetStartDate","requestType","enquiry","sourcePath"],"additionalProperties":false,"title":"business_enquiry.v1 (canonical)","description":"A business enquiry as the website forwards it to Windmill f/leads/intake."}},"required":["v","sentAt","idempotencyKey","type","id","payload"],"additionalProperties":false},{"type":"object","properties":{"v":{"type":"number","const":1},"sentAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"idempotencyKey":{"anyOf":[{"type":"string","pattern":"^[A-Za-z0-9_.:-]{8,128}$"},{"type":"null"}]},"type":{"type":"string","const":"compliance_help.v1"},"id":{"type":"string","pattern":"^(REQ|AGT)-\\d{8}-[0-9A-F]{8}$"},"payload":{"type":"object","properties":{"caseId":{"type":"string","pattern":"^(REQ|AGT)-\\d{8}-[0-9A-F]{8}$"},"receivedAt":{"type":"string","format":"date-time","pattern":"^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"},"channel":{"type":"string","enum":["web","agent"]},"name":{"type":"string","minLength":1,"maxLength":120},"company":{"anyOf":[{"type":"string","minLength":1,"maxLength":160},{"type":"null"}]},"jobTitle":{"anyOf":[{"type":"string","minLength":1,"maxLength":120},{"type":"null"}]},"phone":{"type":"string","maxLength":30,"pattern":"^\\D*(?:\\d\\D*){10,}$"},"email":{"anyOf":[{"type":"string","maxLength":200,"pattern":"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"},{"type":"null"}]},"services":{"maxItems":20,"type":"array","items":{"type":"string","minLength":1,"maxLength":40}},"headcount":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"headcountBand":{"anyOf":[{"type":"string","minLength":1,"maxLength":20},{"type":"null"}]},"site":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]},"cluster":{"anyOf":[{"type":"string","enum":["haridwar","uttarakhand","delhi-ncr","bengaluru","jalandhar","saharanpur","other","punjab","dehradun"]},{"type":"null"}]},"startWindow":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"targetStartDate":{"anyOf":[{"type":"string","minLength":1,"maxLength":40},{"type":"null"}]},"requestType":{"type":"string","const":"compliance-help"},"enquiry":{"type":"string","minLength":1,"maxLength":8000},"sourcePath":{"anyOf":[{"type":"string","minLength":1,"maxLength":300},{"type":"null"}]}},"required":["caseId","receivedAt","channel","name","company","jobTitle","phone","email","services","headcount","headcountBand","site","cluster","startWindow","targetStartDate","requestType","enquiry","sourcePath"],"additionalProperties":false,"title":"compliance_help.v1 (canonical)","description":"A compliance help request: a lead with requestType compliance-help."}},"required":["v","sentAt","idempotencyKey","type","id","payload"],"additionalProperties":false}],"title":"envelope.v1","description":"One submission, as the site delivers it to Windmill webhook/vspl-submission."};
let ajv;
const compiled = new Map();
function validator(schema) {
    ajv ??= new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
    let validate = compiled.get(schema);
    if (!validate) {
        validate = ajv.compile(schema);
        compiled.set(schema, validate);
    }
    return validate;
}
function fieldsOf(validate) {
    const names = new Set();
    for (const e of validate.errors ?? []) {
        const top = e.instancePath.split("/")[1];
        if (top)
            names.add(top);
        else if (e.keyword === "required" || e.keyword === "additionalProperties") {
            const p = e.params;
            names.add(p.missingProperty ?? p.additionalProperty ?? "payload");
        }
        else
            names.add("payload");
    }
    return names.size ? [...names].sort() : ["payload"];
}
function check(schema, body) {
    const validate = validator(schema);
    return validate(body) ? { ok: true, value: body } : { ok: false, errors: fieldsOf(validate) };
}
const SCHEMAS = {
    "job_application.v1": jobApplicationSchema,
    "business_enquiry.v1": businessEnquirySchema,
    "envelope.v1": envelopeSchema,
};
  return { check, SCHEMAS };
})();

// integrations/windmill/talent/lib/mask.ts
const { maskIds, maskDeep } = (() => {
function maskIds(value) {
    return value
        .replace(/\b([2-9]\d{3})[ -]?(\d{4})[ -]?(\d{4})\b/g, (_m, _a, _b, last) => `XXXX XXXX ${last}`)
        .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[PAN removed]");
}
function maskDeep(value) {
    if (typeof value === "string")
        return maskIds(value);
    if (Array.isArray(value))
        return value.map(maskDeep);
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskDeep(v)]));
    }
    return value;
}
  return { maskIds, maskDeep };
})();

// integrations/windmill/talent/lib/intake-payload.ts
const { checkSubmission, saveSubmissionParams } = (() => {
function checkSubmission(raw) {
    const checked = check(SCHEMAS["job_application.v1"], raw);
    if (!checked.ok)
        return checked;
    const p = checked.value;
    if (!p.attachments.every((a) => isAttachmentKeyFor(a.key, p.ref)))
        return { ok: false, errors: ["attachments"] };
    return {
        ok: true,
        value: {
            ref: p.ref,
            source: p.source,
            role: p.role,
            hub: p.hub,
            channel: p.channel,
            agentName: p.agentName?.trim() || null,
            form: p.form,
            applicantName: p.applicantName?.trim() || null,
            answers: p.answers,
            locale: p.locale ?? INTAKE_SOURCES[p.source],
            cluster: p.cluster,
            pageCluster: p.pageCluster,
            pagePath: p.pagePath,
            phone: p.phone,
            consentVersion: p.consent.version,
            consentedAt: new Date(p.consent.at).toISOString(),
            text: p.text?.trim() ? maskIds(p.text.trim()) : null,
            attachments: p.attachments.map((a, position) => ({ position, kind: a.kind, key: a.key, mime: a.mime, size: a.size, name: a.name })),
        },
    };
}
function saveSubmissionParams(s) {
    return [
        s.ref,
        s.source,
        s.locale,
        s.phone,
        s.consentVersion,
        s.consentedAt,
        s.text,
        JSON.stringify(s.attachments),
        s.role,
        s.hub,
        s.channel,
        s.agentName,
        s.form,
        s.applicantName,
        s.answers ? JSON.stringify(s.answers) : null,
        s.cluster,
        s.pageCluster,
        s.pagePath,
    ];
}
  return { checkSubmission, saveSubmissionParams };
})();

// integrations/windmill/talent/lib/run-intake.ts
const { runIntake } = (() => {
async function runIntake(authorized, body, deps) {
    if (!authorized)
        return forbidden();
    const checked = checkSubmission(body);
    if (!checked.ok)
        return invalid(checked.errors);
    const [saved] = await deps.query(SAVE_SUBMISSION, saveSubmissionParams(checked.value));
    if (saved?.submission_id) {
        try {
            await deps.startAcknowledgement(saved.submission_id);
        }
        catch {
        }
    }
    return accepted(checked.value.ref);
}
  return { runIntake };
})();

// integrations/windmill/talent/lib/whatsapp.ts
const { CHAT_IDLE_MS, normalise, scriptLocale, readPrefill, applicationOf, advance, parseInbound } = (() => {
const COPY = {"$comment":"Generated by scripts/whatsapp-copy.mjs from src/content. Edit those files and run pnpm whatsapp:copy.","consentVersion":"2026-10-19-wa1","prefillTag":"VS","languagePrompt":"Namaste! Vayasya Seva job applications. Choose your language, reply with the number:","languages":[{"locale":"en-IN","label":"English"},{"locale":"hi-IN","label":"हिंदी"},{"locale":"hi-Latn-IN","label":"Hindi (English letters)"},{"locale":"pa-IN","label":"ਪੰਜਾਬੀ"},{"locale":"kn-IN","label":"ಕನ್ನಡ"}],"locales":{"en-IN":{"welcome":"Namaste! This chat takes job applications for Vayasya Seva. Messages only: this number does not take calls.","consent":{"agree":"I am 18 or older. Vayasya Seva may keep my details and contact me about work.","keep":"We keep your details for 12 months.","privacy":"How we use your details","privacyUrl":"https://www.vayasyaseva.com/en-in/jobs/privacy","reply":"Reply 1 for YES, 2 for NO."},"declined":"Okay. We have not kept your details. Send any message if you change your mind.","pick":{"one":"Reply with the number.","many":"Reply with the numbers, for example 1 3."},"work":{"question":"What work are you looking for?","options":[{"id":"factory-helper","label":"Factory helper"},{"id":"packing","label":"Packing"},{"id":"warehouse","label":"Warehouse / loading"},{"id":"machine-operator","label":"Machine operator"},{"id":"iti-trades","label":"ITI trade"},{"id":"housekeeping","label":"Housekeeping"},{"id":"data-entry-operator","label":"Data entry"},{"id":"forklift-operator","label":"Forklift operator"},{"id":"any","label":"Any work"}]},"area":{"question":"Where do you live?","options":[{"id":"market:bengaluru","label":"Bengaluru"},{"id":"market:dehradun","label":"Dehradun / Selaqui"},{"id":"market:haridwar","label":"Haridwar / Roorkee"},{"id":"market:jalandhar","label":"Jalandhar / Kapurthala"},{"id":"market:punjab","label":"Elsewhere in Punjab"},{"id":"market:uttarakhand","label":"Elsewhere in Uttarakhand"},{"id":"market:other","label":"Somewhere else"}]},"name":{"question":"Your name?","skip":"Reply 0 to skip."},"done":{"title":"Received. Thank you.","refLabel":"Your reference","body":"We will SMS this reference from VAYSPL. Keep the SMS. If the work fits, we call you.","noFee":"No fee to apply.","calls":"This number does not take calls. Our team calls you on this number."},"invalid":"Sorry, we could not read that. Please reply with a number from the list.","media":"Thank you, our team will see this. Please also answer the question:","already":"We have your application, reference {ref}. If the work fits, we call you. To apply again, send NEW.","restart":"Let's start again.","stopped":"Okay, we will stop. Send any message to apply later."},"hi-IN":{"welcome":"नमस्ते! इस चैट में Vayasya Seva के लिए नौकरी के आवेदन लिए जाते हैं। सिर्फ़ मैसेज: इस नंबर पर कॉल नहीं ली जाती।","consent":{"agree":"मेरी उम्र 18 साल या उससे ज़्यादा है। Vayasya Seva मेरी जानकारी रख सकती है और काम के लिए मुझसे संपर्क कर सकती है।","keep":"हम आपकी जानकारी 12 महीने तक रखते हैं।","privacy":"हम आपकी जानकारी कैसे इस्तेमाल करते हैं","privacyUrl":"https://www.vayasyaseva.com/hi-in/jobs/privacy","reply":"हाँ के लिए 1, ना के लिए 2 भेजें।"},"declined":"ठीक है। हमने आपकी जानकारी नहीं रखी है। मन बदले तो कोई भी मैसेज भेजें।","pick":{"one":"नंबर भेजें।","many":"नंबर भेजें, जैसे 1 3।"},"work":{"question":"आपको कौन-सा काम चाहिए?","options":[{"id":"factory-helper","label":"फ़ैक्टरी हेल्पर"},{"id":"packing","label":"पैकिंग"},{"id":"warehouse","label":"वेयरहाउस / लोडिंग"},{"id":"machine-operator","label":"मशीन ऑपरेटर"},{"id":"iti-trades","label":"ITI ट्रेड"},{"id":"housekeeping","label":"हाउसकीपिंग"},{"id":"data-entry-operator","label":"डेटा एंट्री"},{"id":"forklift-operator","label":"फ़ोर्कलिफ़्ट ऑपरेटर"},{"id":"any","label":"कोई भी काम"}]},"area":{"question":"आप कहाँ रहते हैं?","options":[{"id":"market:bengaluru","label":"बेंगलुरु"},{"id":"market:dehradun","label":"देहरादून / सेलाकुई"},{"id":"market:haridwar","label":"हरिद्वार / रुड़की"},{"id":"market:jalandhar","label":"जालंधर / कपूरथला"},{"id":"market:punjab","label":"पंजाब में कहीं और"},{"id":"market:uttarakhand","label":"उत्तराखंड में कहीं और"},{"id":"market:other","label":"कहीं और"}]},"name":{"question":"आपका नाम?","skip":"छोड़ने के लिए 0 भेजें।"},"done":{"title":"मिल गया, धन्यवाद।","refLabel":"आपका रेफ़रेंस नंबर","body":"हम यह रेफ़रेंस VAYSPL से SMS करेंगे। यह SMS संभालकर रखिए। काम आपके लायक हुआ, तो हम कॉल करेंगे।","noFee":"आवेदन की कोई फ़ीस नहीं।","calls":"इस नंबर पर कॉल नहीं ली जाती। हमारी टीम आपको इसी नंबर पर कॉल करेगी।"},"invalid":"माफ़ कीजिए, हम समझ नहीं पाए। कृपया सूची में से नंबर भेजें।","media":"धन्यवाद, हमारी टीम इसे देखेगी। कृपया सवाल का जवाब भी दीजिए:","already":"आपका आवेदन हमारे पास है, रेफ़रेंस {ref}। काम आपके लायक हुआ, तो हम कॉल करेंगे। दोबारा आवेदन के लिए NEW भेजें।","restart":"चलिए, फिर से शुरू करते हैं।","stopped":"ठीक है, हम रुक जाते हैं। बाद में आवेदन के लिए कोई भी मैसेज भेजें।"},"hi-Latn-IN":{"welcome":"Namaste! Is chat mein Vayasya Seva ke liye job applications li jaati hain. Sirf message: is number par call nahi li jaati.","consent":{"agree":"Meri umar 18 saal ya usse zyada hai. Vayasya Seva meri jaankari rakh sakti hai aur kaam ke liye mujhse contact kar sakti hai.","keep":"Hum aapki jaankari 12 mahine tak rakhte hain.","privacy":"Hum aapki jaankari kaise use karte hain","privacyUrl":"https://www.vayasyaseva.com/hi-latn-in/jobs/privacy","reply":"Haan ke liye 1, na ke liye 2 bhejein."},"declined":"Theek hai. Humne aapki jaankari nahi rakhi hai. Mann badle to koi bhi message bhejein.","pick":{"one":"Number bhejein.","many":"Number bhejein, jaise 1 3."},"work":{"question":"Aapko kaun-sa kaam chahiye?","options":[{"id":"factory-helper","label":"Factory helper"},{"id":"packing","label":"Packing"},{"id":"warehouse","label":"Warehouse / loading"},{"id":"machine-operator","label":"Machine operator"},{"id":"iti-trades","label":"ITI trade"},{"id":"housekeeping","label":"Housekeeping"},{"id":"data-entry-operator","label":"Data entry"},{"id":"forklift-operator","label":"Forklift operator"},{"id":"any","label":"Koi bhi kaam"}]},"area":{"question":"Aap kahan rehte hain?","options":[{"id":"market:bengaluru","label":"Bengaluru"},{"id":"market:dehradun","label":"Dehradun / Selaqui"},{"id":"market:haridwar","label":"Haridwar / Roorkee"},{"id":"market:jalandhar","label":"Jalandhar / Kapurthala"},{"id":"market:punjab","label":"Punjab mein kahin aur"},{"id":"market:uttarakhand","label":"Uttarakhand mein kahin aur"},{"id":"market:other","label":"Kahin aur"}]},"name":{"question":"Aapka naam?","skip":"Chhodne ke liye 0 bhejein."},"done":{"title":"Mil gaya, dhanyavaad.","refLabel":"Aapka reference number","body":"Hum yeh reference VAYSPL se SMS karenge. Yeh SMS sambhaal kar rakhiye. Kaam aapke laayak hua, to hum call karenge.","noFee":"Apply ki koi fee nahi.","calls":"Is number par call nahi li jaati. Hamari team aapko isi number par call karegi."},"invalid":"Maaf kijiye, hum samajh nahi paaye. Please list mein se number bhejein.","media":"Dhanyavaad, hamari team ise dekhegi. Please sawaal ka jawaab bhi dijiye:","already":"Aapka application hamare paas hai, reference {ref}. Kaam aapke laayak hua, to hum call karenge. Dobara apply ke liye NEW bhejein.","restart":"Chaliye, phir se shuru karte hain.","stopped":"Theek hai, hum ruk jaate hain. Baad mein apply ke liye koi bhi message bhejein."},"pa-IN":{"welcome":"ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਇਸ ਚੈਟ ਵਿੱਚ Vayasya Seva ਲਈ ਨੌਕਰੀ ਦੀਆਂ ਅਰਜ਼ੀਆਂ ਲਈਆਂ ਜਾਂਦੀਆਂ ਹਨ। ਸਿਰਫ਼ ਮੈਸੇਜ: ਇਸ ਨੰਬਰ 'ਤੇ ਕਾਲ ਨਹੀਂ ਲਈ ਜਾਂਦੀ।","consent":{"agree":"ਮੇਰੀ ਉਮਰ 18 ਸਾਲ ਜਾਂ ਇਸ ਤੋਂ ਵੱਧ ਹੈ। Vayasya Seva ਮੇਰੀ ਜਾਣਕਾਰੀ ਰੱਖ ਸਕਦੀ ਹੈ ਅਤੇ ਕੰਮ ਲਈ ਮੇਰੇ ਨਾਲ ਸੰਪਰਕ ਕਰ ਸਕਦੀ ਹੈ।","keep":"ਅਸੀਂ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ 12 ਮਹੀਨੇ ਤੱਕ ਰੱਖਦੇ ਹਾਂ।","privacy":"ਅਸੀਂ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਕਿਵੇਂ ਵਰਤਦੇ ਹਾਂ","privacyUrl":"https://www.vayasyaseva.com/pa-in/jobs/privacy","reply":"ਹਾਂ ਲਈ 1, ਨਾਂਹ ਲਈ 2 ਭੇਜੋ।"},"declined":"ਠੀਕ ਹੈ। ਅਸੀਂ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਨਹੀਂ ਰੱਖੀ। ਮਨ ਬਦਲੇ ਤਾਂ ਕੋਈ ਵੀ ਮੈਸੇਜ ਭੇਜੋ।","pick":{"one":"ਨੰਬਰ ਭੇਜੋ।","many":"ਨੰਬਰ ਭੇਜੋ, ਜਿਵੇਂ 1 3।"},"work":{"question":"ਤੁਹਾਨੂੰ ਕਿਹੜਾ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?","options":[{"id":"factory-helper","label":"ਫ਼ੈਕਟਰੀ ਹੈਲਪਰ"},{"id":"packing","label":"ਪੈਕਿੰਗ"},{"id":"warehouse","label":"ਵੇਅਰਹਾਊਸ / ਲੋਡਿੰਗ"},{"id":"machine-operator","label":"ਮਸ਼ੀਨ ਆਪਰੇਟਰ"},{"id":"iti-trades","label":"ITI ਟ੍ਰੇਡ"},{"id":"housekeeping","label":"ਹਾਊਸਕੀਪਿੰਗ"},{"id":"data-entry-operator","label":"ਡਾਟਾ ਐਂਟਰੀ"},{"id":"forklift-operator","label":"ਫ਼ੋਰਕਲਿਫ਼ਟ ਆਪਰੇਟਰ"},{"id":"any","label":"ਕੋਈ ਵੀ ਕੰਮ"}]},"area":{"question":"ਤੁਸੀਂ ਕਿੱਥੇ ਰਹਿੰਦੇ ਹੋ?","options":[{"id":"market:bengaluru","label":"ਬੈਂਗਲੁਰੂ"},{"id":"market:dehradun","label":"ਦੇਹਰਾਦੂਨ / ਸੇਲਾਕੁਈ"},{"id":"market:haridwar","label":"ਹਰਿਦੁਆਰ / ਰੁੜਕੀ"},{"id":"market:jalandhar","label":"ਜਲੰਧਰ / ਕਪੂਰਥਲਾ"},{"id":"market:punjab","label":"ਪੰਜਾਬ ਵਿੱਚ ਕਿਤੇ ਹੋਰ"},{"id":"market:uttarakhand","label":"ਉੱਤਰਾਖੰਡ ਵਿੱਚ ਕਿਤੇ ਹੋਰ"},{"id":"market:other","label":"ਕਿਤੇ ਹੋਰ"}]},"name":{"question":"ਤੁਹਾਡਾ ਨਾਮ?","skip":"ਛੱਡਣ ਲਈ 0 ਭੇਜੋ।"},"done":{"title":"ਮਿਲ ਗਿਆ, ਧੰਨਵਾਦ।","refLabel":"ਤੁਹਾਡਾ ਰੈਫ਼ਰੈਂਸ ਨੰਬਰ","body":"ਅਸੀਂ ਇਹ ਰੈਫ਼ਰੈਂਸ VAYSPL ਤੋਂ SMS ਕਰਾਂਗੇ। ਇਹ SMS ਸੰਭਾਲ ਕੇ ਰੱਖੋ। ਕੰਮ ਤੁਹਾਡੇ ਲਾਇਕ ਹੋਇਆ ਤਾਂ ਅਸੀਂ ਕਾਲ ਕਰਾਂਗੇ।","noFee":"ਅਪਲਾਈ ਕਰਨ ਦੀ ਕੋਈ ਫ਼ੀਸ ਨਹੀਂ।","calls":"ਇਸ ਨੰਬਰ 'ਤੇ ਕਾਲ ਨਹੀਂ ਲਈ ਜਾਂਦੀ। ਸਾਡੀ ਟੀਮ ਤੁਹਾਨੂੰ ਇਸੇ ਨੰਬਰ 'ਤੇ ਕਾਲ ਕਰੇਗੀ।"},"invalid":"ਮਾਫ਼ ਕਰਨਾ, ਅਸੀਂ ਸਮਝ ਨਹੀਂ ਸਕੇ। ਕਿਰਪਾ ਕਰਕੇ ਸੂਚੀ ਵਿੱਚੋਂ ਨੰਬਰ ਭੇਜੋ।","media":"ਧੰਨਵਾਦ, ਸਾਡੀ ਟੀਮ ਇਸ ਨੂੰ ਦੇਖੇਗੀ। ਕਿਰਪਾ ਕਰਕੇ ਸਵਾਲ ਦਾ ਜਵਾਬ ਵੀ ਦਿਓ:","already":"ਤੁਹਾਡੀ ਅਰਜ਼ੀ ਸਾਡੇ ਕੋਲ ਹੈ, ਰੈਫ਼ਰੈਂਸ {ref}। ਕੰਮ ਤੁਹਾਡੇ ਲਾਇਕ ਹੋਇਆ ਤਾਂ ਅਸੀਂ ਕਾਲ ਕਰਾਂਗੇ। ਦੁਬਾਰਾ ਅਪਲਾਈ ਕਰਨ ਲਈ NEW ਭੇਜੋ।","restart":"ਚਲੋ, ਫਿਰ ਤੋਂ ਸ਼ੁਰੂ ਕਰੀਏ।","stopped":"ਠੀਕ ਹੈ, ਅਸੀਂ ਰੁਕ ਜਾਂਦੇ ਹਾਂ। ਬਾਅਦ ਵਿੱਚ ਅਪਲਾਈ ਕਰਨ ਲਈ ਕੋਈ ਵੀ ਮੈਸੇਜ ਭੇਜੋ।"},"kn-IN":{"welcome":"ನಮಸ್ಕಾರ! ಈ ಚಾಟ್‌ನಲ್ಲಿ Vayasya Seva ಗಾಗಿ ಕೆಲಸದ ಅರ್ಜಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲಾಗುತ್ತದೆ. ಮೆಸೇಜ್ ಮಾತ್ರ: ಈ ನಂಬರ್‌ಗೆ ಕರೆಗಳನ್ನು ಸ್ವೀಕರಿಸುವುದಿಲ್ಲ.","consent":{"agree":"ನನಗೆ 18 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು. Vayasya Seva ನನ್ನ ಮಾಹಿತಿಯನ್ನು ಇಟ್ಟುಕೊಂಡು ಕೆಲಸದ ಬಗ್ಗೆ ನನ್ನನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.","keep":"ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ನಾವು 12 ತಿಂಗಳು ಇಟ್ಟುಕೊಳ್ಳುತ್ತೇವೆ.","privacy":"ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ನಾವು ಹೇಗೆ ಬಳಸುತ್ತೇವೆ","privacyUrl":"https://www.vayasyaseva.com/kn-in/jobs/privacy","reply":"ಹೌದು ಎಂದರೆ 1, ಇಲ್ಲ ಎಂದರೆ 2 ಕಳುಹಿಸಿ."},"declined":"ಸರಿ. ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ನಾವು ಇಟ್ಟುಕೊಂಡಿಲ್ಲ. ಮನಸ್ಸು ಬದಲಾದರೆ ಯಾವುದೇ ಮೆಸೇಜ್ ಕಳುಹಿಸಿ.","pick":{"one":"ನಂಬರ್ ಕಳುಹಿಸಿ.","many":"ನಂಬರ್‌ಗಳನ್ನು ಕಳುಹಿಸಿ, ಉದಾಹರಣೆಗೆ 1 3."},"work":{"question":"ನಿಮಗೆ ಯಾವ ಕೆಲಸ ಬೇಕು?","options":[{"id":"factory-helper","label":"ಫ್ಯಾಕ್ಟರಿ ಹೆಲ್ಪರ್"},{"id":"packing","label":"ಪ್ಯಾಕಿಂಗ್"},{"id":"warehouse","label":"ವೇರ್‌ಹೌಸ್ / ಲೋಡಿಂಗ್"},{"id":"machine-operator","label":"ಮೆಷಿನ್ ಆಪರೇಟರ್"},{"id":"iti-trades","label":"ITI ಟ್ರೇಡ್"},{"id":"housekeeping","label":"ಹೌಸ್‌ಕೀಪಿಂಗ್"},{"id":"data-entry-operator","label":"ಡೇಟಾ ಎಂಟ್ರಿ"},{"id":"forklift-operator","label":"ಫೋರ್ಕ್‌ಲಿಫ್ಟ್ ಆಪರೇಟರ್"},{"id":"any","label":"ಯಾವುದೇ ಕೆಲಸ"}]},"area":{"question":"ನೀವು ಎಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?","options":[{"id":"market:bengaluru","label":"ಬೆಂಗಳೂರು"},{"id":"market:dehradun","label":"ಡೆಹ್ರಾಡೂನ್ / ಸೆಲಾಕುಯಿ"},{"id":"market:haridwar","label":"ಹರಿದ್ವಾರ / ರೂರ್ಕಿ"},{"id":"market:jalandhar","label":"ಜಲಂಧರ್ / ಕಪೂರ್ಥಲಾ"},{"id":"market:punjab","label":"ಪಂಜಾಬ್‌ನಲ್ಲಿ ಬೇರೆಡೆ"},{"id":"market:uttarakhand","label":"ಉತ್ತರಾಖಂಡದಲ್ಲಿ ಬೇರೆಡೆ"},{"id":"market:other","label":"ಬೇರೆಲ್ಲೋ"}]},"name":{"question":"ನಿಮ್ಮ ಹೆಸರು?","skip":"ಬಿಡಲು 0 ಕಳುಹಿಸಿ."},"done":{"title":"ಸ್ವೀಕರಿಸಲಾಗಿದೆ, ಧನ್ಯವಾದಗಳು.","refLabel":"ನಿಮ್ಮ ರೆಫರೆನ್ಸ್ ಸಂಖ್ಯೆ","body":"ಈ ರೆಫರೆನ್ಸ್ ಅನ್ನು ನಾವು VAYSPL ಇಂದ SMS ಮಾಡುತ್ತೇವೆ. ಆ SMS ಅನ್ನು ಉಳಿಸಿಕೊಳ್ಳಿ. ಕೆಲಸ ಸರಿಹೊಂದಿದರೆ, ನಾವು ಕರೆ ಮಾಡುತ್ತೇವೆ.","noFee":"ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಯಾವುದೇ ಶುಲ್ಕವಿಲ್ಲ.","calls":"ಈ ನಂಬರ್‌ಗೆ ಕರೆಗಳನ್ನು ಸ್ವೀಕರಿಸುವುದಿಲ್ಲ. ನಮ್ಮ ತಂಡ ನಿಮಗೆ ಇದೇ ನಂಬರ್‌ಗೆ ಕರೆ ಮಾಡುತ್ತದೆ."},"invalid":"ಕ್ಷಮಿಸಿ, ನಮಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಪಟ್ಟಿಯಿಂದ ನಂಬರ್ ಕಳುಹಿಸಿ.","media":"ಧನ್ಯವಾದಗಳು, ನಮ್ಮ ತಂಡ ಇದನ್ನು ನೋಡುತ್ತದೆ. ದಯವಿಟ್ಟು ಪ್ರಶ್ನೆಗೂ ಉತ್ತರಿಸಿ:","already":"ನಿಮ್ಮ ಅರ್ಜಿ ನಮ್ಮ ಬಳಿ ಇದೆ, ರೆಫರೆನ್ಸ್ {ref}. ಕೆಲಸ ಸರಿಹೊಂದಿದರೆ, ನಾವು ಕರೆ ಮಾಡುತ್ತೇವೆ. ಮತ್ತೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು NEW ಕಳುಹಿಸಿ.","restart":"ಮತ್ತೆ ಮೊದಲಿನಿಂದ ಶುರು ಮಾಡೋಣ.","stopped":"ಸರಿ, ನಾವು ನಿಲ್ಲಿಸುತ್ತೇವೆ. ನಂತರ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಯಾವುದೇ ಮೆಸೇಜ್ ಕಳುಹಿಸಿ."}}};
const copyFor = (locale) => COPY.locales[(locale ?? "en-IN")];
const CHAT_IDLE_MS = 24 * 60 * 60 * 1000;
const MAX_NOTES = INTAKE_LIMITS.maxTextLength;
const INDIC_DIGITS = [
    [0x0966, 0x096f],
    [0x0a66, 0x0a6f],
    [0x0ce6, 0x0cef],
];
function normalise(text) {
    let out = "";
    for (const ch of text.normalize("NFC")) {
        const code = ch.codePointAt(0);
        const range = INDIC_DIGITS.find(([from, to]) => code >= from && code <= to);
        out += range ? String(code - range[0]) : ch;
    }
    return out.trim().toLowerCase();
}
const words = (list) => new Set(list);
const YES = words(["1", "yes", "y", "ok", "okay", "haan", "han", "ha", "haa", "ji", "ji haan", "हाँ", "हां", "हा", "जी", "जी हाँ", "ਹਾਂ", "ਜੀ", "ಹೌದು", "ಸರಿ"]);
const NO = words(["2", "no", "n", "nahi", "nahin", "na", "नहीं", "नही", "ना", "ਨਹੀਂ", "ਨਾਂਹ", "ಇಲ್ಲ"]);
const STOP = words(["stop", "band", "band karo", "बंद", "बंद करो", "ਬੰਦ", "ನಿಲ್ಲಿಸಿ", "unsubscribe"]);
const RESTART = words(["new", "naya", "नया", "ਨਵਾਂ", "ಹೊಸ", "restart", "start"]);
const bare = (text) => normalise(text).replace(/[.!?।,]+$/u, "").trim();
function numbersIn(text) {
    const t = normalise(text);
    if (!/^[\d\s,.&+-]+$/.test(t))
        return null;
    const found = t.match(/\d+/g);
    return found ? found.map(Number) : null;
}
function scriptLocale(text) {
    if (/[਀-੿]/u.test(text))
        return "pa-IN";
    if (/[ಀ-೿]/u.test(text))
        return "kn-IN";
    if (/[ऀ-ॿ]/u.test(text))
        return "hi-IN";
    return null;
}
const isLocale = (v) => INTAKE_LOCALES.includes(v);
const has = (o, k) => Object.hasOwn(o, k);
function readPrefill(text) {
    const match = text.match(new RegExp(`\\[${COPY.prefillTag}\\|([^\\]]*)\\]`, "i"));
    const answers = {};
    let locale = null;
    for (const token of match?.[1]?.split("|").map((t) => t.trim()) ?? []) {
        if (isLocale(token))
            locale = token;
        else if (has(QUICK_ANSWERS.work, token))
            answers.work = [token];
        else if (has(QUICK_ANSWERS.trade, token))
            Object.assign(answers, { work: ["iti-trades"], trade: [token] });
        else if (has(QUICK_ANSWERS.area, token))
            answers.area = [token];
    }
    return { locale, answers };
}
const withoutPrefill = (text) => text.replace(new RegExp(`\\s*\\[${COPY.prefillTag}\\|[^\\]]*\\]`, "gi"), "").trim();
const MEDIA_LABEL = { audio: "voice note", voice: "voice note", image: "photo", document: "document", video: "video" };
const list = (options) => options.map((o, i) => `${i + 1}. ${o.label}`).join("\n");
function languageMenu() {
    return `${COPY.languagePrompt}\n\n${list(COPY.languages)}`;
}
function consentMessage(c) {
    return `${c.welcome}\n\n${c.consent.agree} ${c.consent.keep}\n${c.consent.privacy}: ${c.consent.privacyUrl}\n\n${c.consent.reply}`;
}
function question(step, c) {
    if (step === "work")
        return `${c.work.question}\n\n${list(c.work.options)}\n\n${c.pick.many}`;
    if (step === "area")
        return `${c.area.question}\n\n${list(c.area.options)}\n\n${c.pick.one}`;
    if (step === "name")
        return `${c.name.question} ${c.name.skip}`;
    if (step === "consent")
        return consentMessage(c);
    return languageMenu();
}
function doneMessage(c, ref) {
    return `${c.done.title}\n${c.done.refLabel}: ${ref}\n\n${c.done.body}\n\n${c.done.calls}\n${c.done.noFee}`;
}
function nextAfterConsent(chat) {
    if (!chat.answers.work?.length)
        return "work";
    if (!chat.answers.area?.length)
        return "area";
    return "name";
}
function addNote(chat, note) {
    const trimmed = note.trim();
    if (!trimmed)
        return chat;
    const notes = chat.notes ? `${chat.notes}\n${trimmed}` : trimmed;
    return { ...chat, notes: notes.slice(0, MAX_NOTES) };
}
function freshChat(phone, now, locale, answers, version) {
    return { phone, locale, step: locale ? "consent" : "language", answers, name: null, notes: null, consentedAt: null, ref: null, version, updatedAt: now.toISOString() };
}
function roleOf(answers) {
    const trade = answers.trade?.find((t) => has(JOB_ROLES, t));
    if (trade)
        return trade;
    const work = answers.work?.find((w) => w !== "any" && has(JOB_ROLES, w));
    return work ?? null;
}
function applicationOf(chat) {
    const answers = cleanQuickAnswers(chat.answers);
    return {
        ref: chat.ref,
        source: WHATSAPP_SOURCE,
        locale: chat.locale ?? "en-IN",
        cluster: submissionCluster(null, answers),
        pageCluster: null,
        pagePath: null,
        role: roleOf(chat.answers),
        hub: null,
        channel: "whatsapp",
        agentName: null,
        phone: chat.phone,
        adult: true,
        consent: { version: COPY.consentVersion, at: chat.consentedAt },
        text: chat.notes,
        attachments: [],
        form: null,
        applicantName: chat.name,
        answers,
    };
}
function advance(saved, msg, now, newRef) {
    const text = msg.body ?? "";
    const word = bare(text);
    const media = MEDIA_LABEL[msg.type];
    if (!media && msg.type !== "text")
        return { chat: saved, replies: [], application: null };
    if (STOP.has(word))
        return { chat: null, replies: [copyFor(saved?.locale ?? scriptLocale(text)).stopped], application: null };
    const stale = saved && saved.step !== "done" && now.getTime() - new Date(saved.updatedAt).getTime() > CHAT_IDLE_MS;
    const version = saved?.version ?? 0;
    if (!saved || stale) {
        const prefill = readPrefill(text);
        const locale = prefill.locale ?? scriptLocale(text) ?? (stale ? saved.locale : null);
        let chat = freshChat(msg.phone, now, locale, prefill.answers, version);
        const note = withoutPrefill(text);
        if (media)
            chat = addNote(chat, `Sent a ${media} on WhatsApp (see the chat in the Business app).`);
        else if (!prefill.locale && note.length >= 25)
            chat = addNote(chat, note);
        return { chat, replies: [question(chat.step, copyFor(chat.locale))], application: null };
    }
    let chat = { ...saved, updatedAt: now.toISOString() };
    const c = copyFor(chat.locale);
    if (chat.step === "done") {
        if (RESTART.has(word)) {
            const fresh = freshChat(msg.phone, now, chat.locale, {}, version);
            return { chat: fresh, replies: [`${c.restart}\n\n${question(fresh.step, c)}`], application: null };
        }
        return { chat, replies: [c.already.replace("{ref}", chat.ref ?? "")], application: null };
    }
    if (RESTART.has(word)) {
        const fresh = freshChat(msg.phone, now, chat.locale, {}, version);
        return { chat: fresh, replies: [`${copyFor(fresh.locale).restart}\n\n${question(fresh.step, copyFor(fresh.locale))}`], application: null };
    }
    if (media) {
        chat = addNote(chat, `Sent a ${media} on WhatsApp (see the chat in the Business app).`);
        return { chat, replies: [`${c.media}\n\n${question(chat.step, c)}`], application: null };
    }
    const numbers = numbersIn(text);
    const again = (prefix) => ({ chat, replies: [`${prefix}\n\n${question(chat.step, copyFor(chat.locale))}`], application: null });
    const notAnAnswer = () => {
        if (word.length >= 15 && /\p{L}/u.test(word)) {
            chat = addNote(chat, text);
            return again(c.media);
        }
        return again(c.invalid);
    };
    switch (chat.step) {
        case "language": {
            const pick = numbers?.length === 1 ? COPY.languages[numbers[0] - 1] : undefined;
            const locale = pick?.locale ?? scriptLocale(text);
            if (!locale)
                return again(c.invalid);
            chat = { ...chat, locale, step: "consent" };
            return { chat, replies: [question("consent", copyFor(locale))], application: null };
        }
        case "consent": {
            if (NO.has(word))
                return { chat: null, replies: [c.declined], application: null };
            if (!YES.has(word))
                return notAnAnswer();
            chat = { ...chat, consentedAt: now.toISOString() };
            chat = { ...chat, step: nextAfterConsent(chat) };
            return { chat, replies: [question(chat.step, c)], application: null };
        }
        case "work": {
            const options = c.work.options;
            if (!numbers?.length || numbers.some((n) => n < 1 || n > options.length))
                return notAnAnswer();
            const work = [...new Set(numbers.map((n) => options[n - 1].id))];
            chat = { ...chat, answers: { ...chat.answers, work }, step: chat.answers.area?.length ? "name" : "area" };
            return { chat, replies: [question(chat.step, c)], application: null };
        }
        case "area": {
            const options = c.area.options;
            if (numbers?.length !== 1 || numbers[0] < 1 || numbers[0] > options.length)
                return notAnAnswer();
            chat = { ...chat, answers: { ...chat.answers, area: [options[numbers[0] - 1].id] }, step: "name" };
            return { chat, replies: [question("name", c)], application: null };
        }
        case "name": {
            const skip = numbers?.length === 1 && numbers[0] === 0;
            const name = text.replace(/\s+/g, " ").trim();
            if (!skip && !(name.length >= 2 && name.length <= MAX_APPLICANT_NAME_LENGTH && /\p{L}/u.test(name) && !/\d/.test(name)))
                return again(c.invalid);
            chat = { ...chat, name: skip ? null : name, ref: newRef(), step: "done" };
            return { chat, replies: [doneMessage(c, chat.ref)], application: applicationOf(chat) };
        }
    }
}
function parseInbound(body) {
    if (!body || typeof body !== "object")
        return null;
    const b = body;
    const str = (k) => (typeof b[k] === "string" ? b[k] : "");
    if (str("webhook_type") && str("webhook_type") !== "incoming_message")
        return null;
    const messageId = str("message_id");
    const phone = normaliseIndianMobile(str("from"));
    if (!messageId || messageId.includes("{{") || messageId.length > 200 || !phone)
        return null;
    return { messageId, phone, type: str("message_type").toLowerCase() || "text", body: str("body").slice(0, 4000) };
}
  return { CHAT_IDLE_MS, normalise, scriptLocale, readPrefill, applicationOf, advance, parseInbound };
})();

// integrations/windmill/talent/lib/run-whatsapp.ts
const { runWhatsApp, FAST2SMS_SESSION_URL, sendSessionText } = (() => {
const SAVE_TRIES = 3;
const chatOf = (row) => row
    ? {
        ...row,
        answers: row.answers ?? {},
        consentedAt: row.consentedAt ? new Date(row.consentedAt).toISOString() : null,
        updatedAt: new Date(row.updatedAt).toISOString(),
        version: Number(row.version),
    }
    : null;
const chatParams = (chat, readVersion) => [
    chat.phone,
    chat.locale,
    chat.step,
    JSON.stringify(chat.answers),
    chat.name,
    chat.notes,
    chat.consentedAt,
    chat.ref,
    readVersion,
];
async function runWhatsApp(msg, deps) {
    const [first] = await deps.query(SEEN_WHATSAPP_MESSAGE, [msg.messageId]);
    if (!first)
        return { duplicate: true, step: null, ref: null, filed: false, replies: 0, failedReplies: 0 };
    try {
        return await handle(msg, deps);
    }
    catch (err) {
        await deps.query(FORGET_WHATSAPP_MESSAGE, [msg.messageId]).catch(() => { });
        throw err;
    }
}
async function handle(msg, deps) {
    const now = deps.now?.() ?? new Date();
    let ref = null;
    const newRef = () => (ref ??= deps.newRef());
    let filed = false;
    for (let attempt = 0; attempt < SAVE_TRIES; attempt++) {
        const [row] = await deps.query(GET_WHATSAPP_CHAT, [msg.phone]);
        const saved = chatOf(row);
        const readVersion = saved?.version ?? 0;
        const turn = advance(saved, msg, now, newRef);
        if (turn.application && !filed) {
            const answer = await runIntake(true, turn.application, { query: deps.query, startAcknowledgement: deps.startAcknowledgement });
            filed = answer.wm_status_code === 202;
            if (!filed)
                console.error("whatsapp application refused:", turn.application.ref, JSON.stringify(answer.result));
        }
        let stored;
        if (!turn.chat)
            stored = saved ? await deps.query(DELETE_WHATSAPP_CHAT, [msg.phone, readVersion]) : [{}];
        else if (turn.chat === saved)
            stored = [{}];
        else
            stored = await deps.query(readVersion === 0 ? SAVE_WHATSAPP_CHAT : UPDATE_WHATSAPP_CHAT, chatParams(turn.chat, readVersion));
        if (!stored.length)
            continue;
        let failedReplies = 0;
        for (const text of turn.replies) {
            const sent = await deps.reply(msg.phone, text);
            if (!sent.ok)
                failedReplies++;
        }
        return {
            step: turn.chat ? turn.chat.step : "deleted",
            ref: turn.chat?.ref ?? null,
            filed,
            replies: turn.replies.length,
            failedReplies,
        };
    }
    throw new Error("WhatsApp chat changed while saving; Fast2SMS retries the webhook");
}
const FAST2SMS_SESSION_URL = "https://www.fast2sms.com/dev/whatsapp-session";
const TIMEOUT_MS = 15_000;
async function sendSessionText(phoneNumberId, to, text, apiKey, fetchImpl = fetch) {
    const url = `${FAST2SMS_SESSION_URL}?phone_number_id=${encodeURIComponent(phoneNumberId)}&to=${encodeURIComponent(to.replace(/\D/g, ""))}`;
    try {
        const res = await fetchImpl(url, {
            method: "POST",
            headers: { authorization: apiKey, "content-type": "application/json" },
            body: JSON.stringify({ type: "text", text }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const body = (await res.json().catch(() => null));
        const ok = res.ok && body?.return !== false && body?.status !== "error" && body?.status !== false;
        if (!ok)
            console.error("whatsapp reply not accepted:", res.status, typeof body?.status === "string" ? body.status : "");
        return { ok, status: res.status };
    }
    catch (err) {
        console.error("whatsapp reply failed:", err instanceof Error ? err.name : "unknown error");
        return { ok: false, status: 0 };
    }
}
  return { runWhatsApp, FAST2SMS_SESSION_URL, sendSessionText };
})();

// integrations/windmill/talent/scripts/intake.ts
const {  } = (() => {
export const SECRET_HEADER = "x-vspl-intake-secret";
export function secretMatches(given, expected) {
    if (!given || !expected)
        return false;
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}
export async function preprocessor(event) {
    const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    const authorized = secretMatches(headers[SECRET_HEADER], await config("intake_webhook_secret"));
    return { authorized, body: authorized ? (event.body ?? null) : null };
}
export async function main(authorized, body) {
    try {
        return await withTalentDb((query) => runIntake(authorized, body, {
            query,
            startAcknowledgement: async (submissionId) => {
                await wmill.runScriptByPathAsync("f/talent/dispatch", { submission_id: submissionId });
            },
        }));
    }
    catch (err) {
        console.error("intake failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
        return failed();
    }
}
  return {  };
})();

export const SECRET_HEADER = "x-vspl-wa-secret";
const KEPT = ["webhook_type", "from", "message_type", "body", "message_id", "phone_number_id"];
export async function preprocessor(event) {
    const headers = Object.fromEntries(Object.entries(event.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
    const authorized = secretMatches(headers[SECRET_HEADER], await config("fast2sms_whatsapp_secret"));
    const raw = authorized && event.body && typeof event.body === "object" ? event.body : null;
    const body = raw ? Object.fromEntries(KEPT.filter((k) => k in raw).map((k) => [k, raw[k]])) : null;
    return { authorized, body };
}
const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function newRef() {
    let s = "";
    for (let i = 0; i < 6; i++)
        s += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
    return `VS-J-${s}`;
}
export async function main(authorized, body) {
    if (!authorized)
        return forbidden();
    const msg = parseInbound(body);
    if (!msg)
        return respond(200, { ok: true, ignored: true });
    const phoneNumberId = String(body.phone_number_id ?? "");
    if (!/^\d{5,20}$/.test(phoneNumberId))
        return respond(400, { ok: false, error: "No phone_number_id" });
    try {
        const apiKey = await config("fast2sms_api_key");
        const result = await withTalentDb((query) => runWhatsApp(msg, {
            query,
            reply: (to, text) => sendSessionText(phoneNumberId, to, text, apiKey),
            startAcknowledgement: async (submissionId) => {
                await wmill.runScriptByPathAsync("f/talent/dispatch", { submission_id: submissionId });
            },
            newRef,
        }));
        return respond(200, { ok: true, ...result });
    }
    catch (err) {
        console.error("whatsapp failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
        return failed();
    }
}

