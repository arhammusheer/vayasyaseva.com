// Generated from integrations/windmill/talent/scripts/retention.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

import { AwsClient } from "aws4fetch";

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

// integrations/windmill/talent/lib/chatwoot.ts
const { createContact, createConversation, postMessage, attachFile, deleteContact } = (() => {
  const RETRY_TRIES = 3;
  const RETRY_WAIT_MS = 5_000;
  const TIMEOUT_MS = 30_000;
  async function inboxBase() {
      const [base, identifier] = await Promise.all([config("chatwoot_base_url"), config("chatwoot_inbox_identifier")]);
      return `${base.replace(/\/$/, "")}/public/api/v1/inboxes/${identifier}`;
  }
  async function retrying(fn, tries = RETRY_TRIES, waitMs = RETRY_WAIT_MS) {
      let last;
      for (let attempt = 1; attempt <= tries; attempt++) {
          try {
              return await fn();
          }
          catch (error) {
              last = error;
              if (attempt < tries)
                  await new Promise((r) => setTimeout(r, waitMs));
          }
      }
      throw last;
  }
  async function json(res, what) {
      if (!res.ok)
          throw new Error(`Chatwoot ${what}: HTTP ${res.status}`);
      return (await res.json());
  }
  async function createContact(phone, name) {
      const base = await inboxBase();
      return retrying(async () => json(await fetch(`${base}/contacts`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ source_id: `talent-${phone.replace("+", "")}`, name, phone_number: phone }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
      }), "contact"));
  }
  async function createConversation(sourceId, customAttributes) {
      const base = await inboxBase();
      return json(await fetch(`${base}/contacts/${sourceId}/conversations`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ custom_attributes: customAttributes }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
      }), "create conversation");
  }
  async function postMessage(sourceId, conversationId, content) {
      const base = await inboxBase();
      await json(await fetch(`${base}/contacts/${sourceId}/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
      }), "post message");
  }
  async function attachFile(sourceId, conversationId, label, file, fileName) {
      const base = await inboxBase();
      const form = new FormData();
      form.append("content", label);
      form.append("attachments[]", file, fileName);
      try {
          const res = await fetch(`${base}/contacts/${sourceId}/conversations/${conversationId}/messages`, {
              method: "POST",
              body: form,
              signal: AbortSignal.timeout(TIMEOUT_MS),
          });
          return res.ok;
      }
      catch {
          return false;
      }
  }
  async function deleteContact(contactId) {
      const [base, accountId, token] = await Promise.all([config("chatwoot_base_url"), config("chatwoot_account_id"), config("chatwoot_admin_token")]);
      await retrying(async () => {
          const res = await fetch(`${base.replace(/\/$/, "")}/api/v1/accounts/${accountId}/contacts/${contactId}`, {
              method: "DELETE",
              headers: { api_access_token: token },
              signal: AbortSignal.timeout(TIMEOUT_MS),
          });
          if (!res.ok && res.status !== 404)
              throw new Error(`Chatwoot delete contact ${contactId}: HTTP ${res.status}`);
      });
  }
  return { createContact, createConversation, postMessage, attachFile, deleteContact };
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

// integrations/windmill/talent/lib/r2.ts
const { downloadObject, downloadIfExists, deleteObject } = (() => {
  async function client(access) {
      const [accessKeyId, secretAccessKey, endpoint, bucket] = await Promise.all([
          config(access === "read" ? "r2_read_key_id" : "r2_erase_key_id"),
          config(access === "read" ? "r2_read_secret" : "r2_erase_secret"),
          config("r2_endpoint"),
          config("r2_bucket"),
      ]);
      const aws = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
      const url = (key) => `${endpoint.replace(/\/$/, "")}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
      return { aws, url };
  }
  async function downloadObject(key) {
      const { aws, url } = await client("read");
      const res = await aws.fetch(url(key), { method: "GET" });
      if (!res.ok)
          throw new Error(`R2 GET ${key}: HTTP ${res.status}`);
      return { data: await res.blob(), contentType: res.headers.get("content-type") ?? "application/octet-stream" };
  }
  async function downloadIfExists(key) {
      const { aws, url } = await client("read");
      const res = await aws.fetch(url(key), { method: "GET" });
      if (res.status === 404) {
          await res.body?.cancel().catch(() => { });
          return null;
      }
      if (!res.ok)
          throw new Error(`R2 GET ${key}: HTTP ${res.status}`);
      return res.blob();
  }
  async function deleteObject(key) {
      const { aws, url } = await client("erase");
      const res = await aws.fetch(url(key), { method: "DELETE" });
      if (!res.ok && res.status !== 404)
          throw new Error(`R2 DELETE ${key}: HTTP ${res.status}`);
  }
  return { downloadObject, downloadIfExists, deleteObject };
})();

// integrations/windmill/talent/lib/erasure.ts
const { filesToDelete, contactsToDelete } = (() => {
  function filesToDelete(claimed) {
      return [...new Set(claimed.files.filter((key) => typeof key === "string" && key.length > 0))];
  }
  function contactsToDelete(claimed) {
      return [...new Set(claimed.contacts.filter((id) => Number.isInteger(id) && id > 0))];
  }
  return { filesToDelete, contactsToDelete };
})();

// integrations/windmill/talent/lib/sql.ts
const { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, CLAIM_SUBMISSION_FOR, RELEASE_SUBMISSION, SYNC_CANDIDATE_FOR, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, FILES_SUBMISSION, FILES_FOR, SAVE_FILE_ID, SETTLE_FILE, FILE_ERROR, CLEAR_FILE_ID } = (() => {
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
  return { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, CLAIM_SUBMISSION_FOR, RELEASE_SUBMISSION, SYNC_CANDIDATE_FOR, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, FILES_SUBMISSION, FILES_FOR, SAVE_FILE_ID, SETTLE_FILE, FILE_ERROR, CLEAR_FILE_ID };
})();

// integrations/windmill/talent/lib/run-retention.ts
const { DISPATCH_LOCK_TRIES, runRetention } = (() => {
  const DISPATCH_LOCK_TRIES = 60;
  const DISPATCH_LOCK_WAIT_MS = 2_000;
  async function lockDispatch(deps) {
      const sleep = deps.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
      for (let i = 0; i < DISPATCH_LOCK_TRIES; i++) {
          const [lock] = await deps.query(ERASURE_DISPATCH_LOCK);
          if (lock?.locked)
              return;
          await sleep(DISPATCH_LOCK_WAIT_MS);
      }
      throw new Error("The dispatcher kept running; erasure retried later");
  }
  async function runRetention(deps) {
      const [counts] = await deps.query(QUEUE_EXPIRED_AND_RECOVER);
      const result = { recovered: Number(counts?.recovered ?? 0), queued: Number(counts?.queued ?? 0), erased: null };
      const [claimed] = await deps.query(CLAIM_ERASURE);
      if (!claimed?.id)
          return result;
      for (const key of filesToDelete(claimed))
          await deps.deleteFile(key);
      for (const id of contactsToDelete(claimed))
          await deps.deleteContact(id);
      await lockDispatch(deps);
      try {
          const crm = await deps.eraseCrmPerson(claimed.phone);
          await deps.query(DELETE_ROWS, [claimed.id, claimed.phone, claimed.files.length, claimed.contacts.length, crm.files]);
          result.erased = { requestId: claimed.id, files: claimed.files.length, contacts: claimed.contacts.length, crmPeople: crm.people, crmFiles: crm.files };
      }
      finally {
          await deps.query(ERASURE_DISPATCH_UNLOCK);
      }
      return result;
  }
  return { DISPATCH_LOCK_TRIES, runRetention };
})();

// integrations/windmill/talent/lib/twenty.ts
const { eq, twentyClient, twentyFromConfig, TwentyGraphqlError, inClusterUploadUrl, twentyFilesClient, twentyFilesFromConfig } = (() => {
  const eq = (field, value) => `${field}[eq]:${JSON.stringify(value)}`;
  function twentyClient(baseUrl, apiKey, fetchImpl = fetch) {
      const base = baseUrl.replace(/\/$/, "");
      async function call(method, path, body) {
          const res = await fetchImpl(`${base}/rest${path}`, {
              method,
              headers: { authorization: `Bearer ${apiKey}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
              body: body === undefined ? undefined : JSON.stringify(body),
              signal: AbortSignal.timeout(30_000),
          });
          const text = await res.text();
          let json = null;
          try {
              json = text ? JSON.parse(text) : null;
          }
          catch { }
          if (!res.ok && !(method === "DELETE" && res.status === 404)) {
              const messages = json?.messages?.join("; ") ?? text.slice(0, 200);
              throw new Error(`Twenty ${method} ${path.split("?")[0]}: HTTP ${res.status} ${messages}`);
          }
          return { status: res.status, json };
      }
      return {
          async find(plural, filter) {
              const { json } = await call("GET", `/${plural}?limit=60&filter=${encodeURIComponent(filter)}`);
              return (json.data[plural] ?? []);
          },
          async create(plural, singular, body) {
              const { json } = await call("POST", `/${plural}`, body);
              const created = json.data[`create${singular}`];
              if (!created?.id)
                  throw new Error(`Twenty POST /${plural}: no record in the answer`);
              return created;
          },
          async update(plural, id, body) {
              await call("PATCH", `/${plural}/${id}`, body);
          },
          async remove(plural, id) {
              const { status } = await call("DELETE", `/${plural}/${id}`);
              return status !== 404;
          },
      };
  }
  async function twentyFromConfig() {
      return twentyClient(await config("twenty_base_url"), await config("twenty_api_key"));
  }
  class TwentyGraphqlError extends Error {
      codes;
      constructor(message, codes) {
          super(message);
          this.codes = codes;
      }
  }
  const FILE_UPLOAD_PATH = "/file-upload/";
  function inClusterUploadUrl(uploadUrl, baseUrl) {
      const url = new URL(uploadUrl);
      if (!url.pathname.startsWith(FILE_UPLOAD_PATH))
          return uploadUrl;
      return `${baseUrl.replace(/\/$/, "")}${url.pathname}${url.search}`;
  }
  const isPermissionError = (messages, codes) => codes.includes("FORBIDDEN") || codes.includes("PERMISSION_DENIED") || messages.some((m) => /permission/i.test(m));
  function twentyFilesClient(baseUrl, apiKey, fetchImpl = fetch) {
      const base = baseUrl.replace(/\/$/, "");
      let fieldId = null;
      async function gql(operation, query, variables = {}) {
          const res = await fetchImpl(`${base}/metadata`, {
              method: "POST",
              headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
              body: JSON.stringify({ query, variables }),
              signal: AbortSignal.timeout(30_000),
          });
          const text = await res.text();
          let json = null;
          try {
              json = text ? JSON.parse(text) : null;
          }
          catch { }
          const errors = json?.errors ?? [];
          if (errors.length) {
              const messages = errors.map((e) => e.message);
              const codes = errors.map((e) => e.extensions?.code ?? "").filter(Boolean);
              if (isPermissionError(messages, codes)) {
                  throw new TwentyGraphqlError(`Twenty ${operation}: refused for permissions; the API key's role needs the Upload files permission (UPLOAD_FILE). ${messages.join("; ").slice(0, 200)}`, codes);
              }
              const limited = !res.ok ? res.status === 429 : messages.some((m) => /too many requests|rate limit|limit reached/i.test(m));
              const status = limited ? "HTTP 429 " : res.ok ? "" : `HTTP ${res.status} `;
              throw new TwentyGraphqlError(`Twenty ${operation}: ${status}${messages.join("; ").slice(0, 300)}`, codes);
          }
          if (!res.ok)
              throw new Error(`Twenty ${operation}: HTTP ${res.status} ${text.slice(0, 200)}`);
          if (!json?.data)
              throw new Error(`Twenty ${operation}: no data in the answer`);
          return json.data;
      }
      return {
          attachmentFileFieldId() {
              fieldId ??= gql("objects", `{ objects(paging:{first:500}) { edges { node { id nameSingular fields(paging:{first:500}) { edges { node { id name type } } } } } } }`)
                  .then((data) => {
                  const attachment = data.objects.edges.map((e) => e.node).find((o) => o.nameSingular === "attachment");
                  const field = attachment?.fields.edges.map((e) => e.node).find((f) => f.name === "file" && f.type === "FILES");
                  if (!field)
                      throw new Error("Twenty has no attachment.file (FILES) field");
                  return field.id;
              })
                  .catch((err) => {
                  fieldId = null;
                  throw err;
              });
              return fieldId;
          },
          async createFileUpload(filename, size, fieldMetadataId) {
              const data = await gql("createFileUpload", `mutation CreateFileUpload($filename: String!, $size: Float!, $fileFolder: FileFolder!, $fieldMetadataId: String) {
    createFileUpload(filename: $filename, size: $size, fileFolder: $fileFolder, fieldMetadataId: $fieldMetadataId) { fileId uploadUrl contentType expiresAt }
  }`, { filename, size, fileFolder: "FilesField", fieldMetadataId });
              const target = data.createFileUpload;
              if (!target?.fileId || !target.uploadUrl)
                  throw new Error("Twenty createFileUpload: no upload target in the answer");
              return target;
          },
          async put(uploadUrl, data) {
              const res = await fetchImpl(inClusterUploadUrl(uploadUrl, base), {
                  method: "PUT",
                  headers: { "content-type": "application/octet-stream" },
                  body: data,
                  signal: AbortSignal.timeout(120_000),
              });
              if (!res.ok)
                  throw new Error(`Twenty PUT /file-upload: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
              await res.body?.cancel().catch(() => { });
          },
          async completeFileUpload(fileId) {
              await gql("completeFileUpload", `mutation CompleteFileUpload($fileId: String!) { completeFileUpload(fileId: $fileId) { id } }`, { fileId });
          },
      };
  }
  async function twentyFilesFromConfig() {
      return twentyFilesClient(await config("twenty_base_url"), await config("twenty_api_key"));
  }
  return { eq, twentyClient, twentyFromConfig, TwentyGraphqlError, inClusterUploadUrl, twentyFilesClient, twentyFilesFromConfig };
})();

// integrations/windmill/talent/lib/crm.ts
const { optionValue, clusterValue, roleValue, languageValue, sourceValue, phoneDigits, workRoles, clusters, personFields, ANSWER_OPTIONS, screeningFields, phoneValue, applicationFields, ACK_TEMPLATE, ackText, deliveryStatus, ackSyncState, ackKey, ackFields, upsertPerson, ensureApplication, upsertAcknowledgement, erasePerson } = (() => {
  const CLUSTER_VALUES = new Set(["HARIDWAR", "UTTARAKHAND", "DELHI_NCR", "BENGALURU", "JALANDHAR", "SAHARANPUR", "OTHER", "PUNJAB"]);
  const ROLE_VALUES = new Set([
      "FACTORY_HELPER", "PACKING", "MACHINE_OPERATOR", "WAREHOUSE", "FORKLIFT_OPERATOR", "DATA_ENTRY_OPERATOR",
      "HOUSEKEEPING", "ITI_TRADES", "ELECTRICIAN", "WELDER", "FITTER", "ANY",
  ]);
  const optionValue = (slug) => slug.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  function clusterValue(slug) {
      if (!slug)
          return null;
      const v = optionValue(slug);
      return CLUSTER_VALUES.has(v) ? v : null;
  }
  function roleValue(slug) {
      if (!slug)
          return null;
      const v = optionValue(slug);
      return ROLE_VALUES.has(v) ? v : null;
  }
  const unique = (values) => [...new Set(values.filter((v) => Boolean(v)))];
  function languageValue(locale) {
      switch (locale) {
          case "en":
          case "en-IN":
              return "EN";
          case "hi":
          case "hi-IN":
              return "HI";
          case "hinglish":
          case "hi-Latn-IN":
              return "HI_LATN";
          case "pa-IN":
              return "PA";
          case "kn-IN":
              return "KN";
          default:
              return null;
      }
  }
  function sourceValue(c) {
      if (c.channel === "agent")
          return "AGENT";
      if (c.source === "web" || c.source.startsWith("web_"))
          return "WEBSITE";
      if (c.source === "whatsapp")
          return "WHATSAPP";
      if (c.source === "phone")
          return "PHONE";
      return "OTHER";
  }
  function phoneDigits(phone) {
      const digits = phone.replace(/\D/g, "");
      return digits.length > 10 ? digits.slice(-10) : digits;
  }
  const iso = (value) => (value ? new Date(value).toISOString() : null);
  function workRoles(c) {
      const work = Array.isArray(c.answers?.work) ? c.answers.work : [];
      return unique([...(c.person_roles ?? []), c.role, ...work].map(roleValue));
  }
  function clusters(c) {
      return unique([...(c.person_clusters ?? []), c.cluster].map(clusterValue));
  }
  function personFields(c, existing) {
      const has = (field) => existing && existing[field] !== null && existing[field] !== undefined && existing[field] !== "";
      const existingList = (field) => (Array.isArray(existing?.[field]) ? existing[field] : []);
      const name = c.person_name ?? c.applicant_name;
      const lastContact = [c.last_contact_at, c.last_confirmed_at].filter(Boolean).map((d) => new Date(d).getTime());
      const fields = {
          clusters: unique([...existingList("clusters"), ...clusters(c)]),
          workRoles: unique([...existingList("workRoles"), ...workRoles(c)]),
          lastAppliedAt: iso(c.last_applied_at ?? c.created_at),
          lastContactAt: lastContact.length ? new Date(Math.max(...lastContact)).toISOString() : iso(c.created_at),
          consentVersion: c.consent_version,
          consentedAt: iso(c.consented_at),
      };
      const language = languageValue(c.person_locale ?? c.locale);
      if (language)
          fields.language = language;
      if (c.home_area)
          fields.homeArea = c.home_area;
      if (!has("personType"))
          fields.personType = "WORKER";
      if (c.person_status === "do-not-contact")
          fields.workerStatus = "DO_NOT_CONTACT";
      else if (!has("workerStatus"))
          fields.workerStatus = "NEW";
      const currentName = existing?.name;
      if (name && !currentName?.firstName && !currentName?.lastName)
          fields.name = { firstName: name, lastName: "" };
      if (!existing) {
          fields.phones = phoneValue(c.phone);
          if (!fields.name)
              fields.name = { firstName: `Applicant ${c.ref}`, lastName: "" };
      }
      return fields;
  }
  const ANSWER_OPTIONS = {
      experience: {
          fresher: ["FRESHER", "Fresher"],
          "under-1": ["UNDER_1_YEAR", "Under 1 year"],
          "1-3": ["YEARS_1_TO_3", "1 to 3 years"],
          "3-plus": ["YEARS_3_PLUS", "3+ years"],
      },
      education: {
          "below-10th": ["BELOW_CLASS_10", "Below 10th"],
          "10th": ["CLASS_10", "10th pass"],
          "12th": ["CLASS_12", "12th pass"],
          "iti-diploma": ["ITI_DIPLOMA", "ITI / diploma"],
          graduate: ["GRADUATE", "Graduate"],
      },
      start: { now: ["NOW", "Immediately"], week: ["WITHIN_WEEK", "Within a week"], month: ["WITHIN_MONTH", "Within a month"] },
      shift: { day: ["DAY", "Day"], night: ["NIGHT", "Night"], rotating: ["ROTATING", "Rotating / any"] },
      area: {
          "sidcul-bahadrabad": ["SIDCUL_BAHADRABAD", "SIDCUL / Bahadrabad"],
          "haridwar-jwalapur": ["HARIDWAR_JWALAPUR", "Haridwar city / Jwalapur"],
          "roorkee-bhagwanpur": ["ROORKEE_BHAGWANPUR", "Roorkee / Bhagwanpur"],
          laksar: ["LAKSAR", "Laksar"],
          outside: ["OUTSIDE_HARIDWAR", "Outside Haridwar"],
          "bengaluru:north": ["BENGALURU_NORTH", "Bengaluru North / Peenya"],
          "bengaluru:south": ["BENGALURU_SOUTH", "Bengaluru South / Electronic City"],
          "bengaluru:east": ["BENGALURU_EAST", "Bengaluru East / Whitefield"],
          "bengaluru:west": ["BENGALURU_WEST", "Bengaluru West / Kengeri"],
          "bengaluru:outside": ["OUTSIDE_BENGALURU", "Outside Bengaluru"],
          "jalandhar:kapurthala": ["KAPURTHALA", "Kapurthala"],
          "jalandhar:city": ["JALANDHAR_CITY", "Jalandhar city"],
          "jalandhar:phagwara-goraya": ["PHAGWARA_GORAYA", "Phagwara / Goraya"],
          "jalandhar:outside": ["OUTSIDE_JALANDHAR", "Outside Jalandhar and Kapurthala"],
          "uttarakhand:haridwar": ["UK_HARIDWAR_ROORKEE", "Haridwar / Roorkee (Uttarakhand form)"],
          "uttarakhand:dehradun-selaqui": ["DEHRADUN_SELAQUI", "Dehradun / Selaqui"],
          "uttarakhand:udham-singh-nagar": ["UDHAM_SINGH_NAGAR", "Rudrapur / Kashipur / Sitarganj"],
          "uttarakhand:other": ["ELSEWHERE_UTTARAKHAND", "Elsewhere in Uttarakhand"],
          "uttarakhand:outside": ["OUTSIDE_UTTARAKHAND", "Outside Uttarakhand"],
          "punjab:jalandhar-kapurthala": ["PB_JALANDHAR_KAPURTHALA", "Jalandhar / Kapurthala (Punjab form)"],
          "punjab:ludhiana": ["LUDHIANA", "Ludhiana"],
          "punjab:mohali": ["MOHALI_KHARAR", "Mohali / Kharar"],
          "punjab:amritsar": ["AMRITSAR", "Amritsar"],
          "punjab:other": ["ELSEWHERE_PUNJAB", "Elsewhere in Punjab"],
          "punjab:outside": ["OUTSIDE_PUNJAB", "Outside Punjab"],
          "market:haridwar": ["MARKET_HARIDWAR", "Haridwar / Roorkee (market)"],
          "market:uttarakhand": ["MARKET_UTTARAKHAND", "Elsewhere in Uttarakhand (market)"],
          "market:jalandhar": ["MARKET_JALANDHAR", "Jalandhar / Kapurthala (market)"],
          "market:punjab": ["MARKET_PUNJAB", "Elsewhere in Punjab (market)"],
          "market:bengaluru": ["MARKET_BENGALURU", "Bengaluru (market)"],
          "market:other": ["MARKET_OTHER", "Somewhere else"],
          "haridwar:rest-of-uttarakhand": ["HW_REST_OF_UTTARAKHAND", "Elsewhere in Uttarakhand (Haridwar form)"],
          "jalandhar:rest-of-punjab": ["JL_REST_OF_PUNJAB", "Elsewhere in Punjab (Jalandhar form)"],
      },
  };
  const SKILL_LABELS = {
      iti: { "iti-pass": "ITI passed", "iti-pursuing": "ITI studying / apprentice", "no-iti": "Experience, no ITI" },
      trade: { electrician: "Electrician", welder: "Welder", fitter: "Fitter", machinist: "Machinist / turner", "other-trade": "Other trade" },
      machines: {
          "packing-machine": "Packing machines", moulding: "Injection moulding", press: "Press / sheet metal", "cnc-vmc": "CNC / VMC",
          "other-machine": "Other machines",
      },
      forklift: { "licence-experience": "Forklift licence and experience", "experience-only": "Forklift experience, no licence", "want-to-learn": "Wants to learn forklift" },
      computer: { typing: "Typing", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP" },
  };
  const answerList = (answers, question) => {
      const v = answers?.[question];
      return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  };
  function answerOption(answers, question) {
      const options = ANSWER_OPTIONS[question];
      const id = answerList(answers, question).find((a) => Object.hasOwn(options, a));
      return id ? options[id][0] : null;
  }
  function screeningFields(answers) {
      const shifts = ANSWER_OPTIONS.shift;
      const skills = Object.entries(SKILL_LABELS).flatMap(([q, labels]) => answerList(answers, q).map((a) => labels[a]).filter(Boolean));
      return {
          experience: answerOption(answers, "experience"),
          education: answerOption(answers, "education"),
          canStart: answerOption(answers, "start"),
          area: answerOption(answers, "area"),
          shifts: unique(answerList(answers, "shift").map((a) => shifts[a]?.[0] ?? null)),
          workWanted: unique(answerList(answers, "work").map(roleValue)),
          skills: skills.join(" · "),
      };
  }
  const phoneValue = (phone) => ({ primaryPhoneNumber: phoneDigits(phone), primaryPhoneCountryCode: "IN", primaryPhoneCallingCode: "+91" });
  function applicationFields(c, personId) {
      return {
          ...screeningFields(c.answers),
          phone: phoneValue(c.phone),
          name: c.ref,
          status: "NEW",
          source: sourceValue(c),
          jobRole: roleValue(c.role),
          cluster: clusterValue(c.cluster),
          message: c.text ?? "",
          answers: c.answers ?? null,
          submittedAt: iso(c.created_at),
          consentVersion: c.consent_version,
          pagePath: c.page_path ?? "",
          talentSubmissionId: c.id,
          personId,
      };
  }
  const ACK_TEMPLATE = "Job application received (DLT 1677100000000394062)";
  const ackText = (ref) => `Vayasya Seva received your job application. Ref ${ref}. We will contact you on this number about work.`;
  function deliveryStatus(ackStatus, delivery = null) {
      if (ackStatus === "accepted" && delivery === "delivered")
          return "DELIVERED";
      if (ackStatus === "accepted" && delivery === "failed")
          return "FAILED";
      switch (ackStatus) {
          case "accepted":
              return "SENT";
          case "failed":
              return "FAILED";
          case "unknown":
              return "UNKNOWN";
          default:
              return "QUEUED";
      }
  }
  const ackSyncState = (c) => c.ack_status && c.delivery_status ? `${c.ack_status}:${c.delivery_status}` : c.ack_status;
  const ackKey = (submissionId) => `sms-ack:${submissionId}`;
  function ackFields(c, personId, applicationId) {
      return {
          name: `SMS · application received · ${c.ref}`,
          channel: "SMS",
          direction: "OUTBOUND",
          deliveryStatus: deliveryStatus(c.ack_status, c.delivery_status),
          template: ACK_TEMPLATE,
          body: ackText(c.ref),
          provider: "Fast2SMS",
          providerId: c.request_id ?? "",
          statusAt: iso(c.delivered_at ?? c.accepted_at ?? c.ack_updated_at),
          error: c.delivery_status === "failed" ? (c.delivery_detail ?? "") : (c.ack_error ?? ""),
          externalKey: ackKey(c.id),
          personId,
          applicationId,
      };
  }
  async function upsertPerson(crm, c) {
      const [existing] = await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(c.phone)));
      const fields = personFields(c, existing ?? null);
      if (existing) {
          await crm.update("people", existing.id, fields);
          return existing.id;
      }
      return (await crm.create("people", "Person", fields)).id;
  }
  async function ensureApplication(crm, c, personId) {
      const [existing] = await crm.find("applications", eq("talentSubmissionId", c.id));
      if (existing)
          return existing.id;
      return (await crm.create("applications", "Application", applicationFields(c, personId))).id;
  }
  async function upsertAcknowledgement(crm, c, personId, applicationId) {
      const fields = ackFields(c, personId, applicationId);
      const [existing] = await crm.find("communications", eq("externalKey", ackKey(c.id)));
      if (existing)
          await crm.update("communications", existing.id, fields);
      else
          await crm.create("communications", "Communication", fields);
  }
  const WORKER_FIELDS_CLEARED = {
      personType: "CLIENT_CONTACT",
      workerStatus: null,
      clusters: [],
      workRoles: [],
      homeArea: "",
      language: null,
      consentVersion: "",
      consentedAt: null,
      lastAppliedAt: null,
      lastContactAt: null,
  };
  async function attachmentsOf(crm, field, id) {
      const live = await crm.find("attachments", eq(field, id));
      const trashed = await crm.find("attachments", `and(${eq(field, id)},deletedAt[is]:NOT_NULL)`);
      return [...new Map([...live, ...trashed].map((r) => [r.id, r])).values()];
  }
  async function removeAttachments(crm, field, id) {
      let removed = 0;
      for (const a of await attachmentsOf(crm, field, id))
          if (await crm.remove("attachments", a.id))
              removed++;
      return removed;
  }
  async function erasePerson(crm, phone) {
      const people = await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(phone)));
      let files = 0;
      for (const person of people) {
          for (const app of await crm.find("applications", eq("personId", person.id))) {
              files += await removeAttachments(crm, "targetApplicationId", app.id);
              for (const comm of await crm.find("communications", eq("applicationId", app.id)))
                  await crm.remove("communications", comm.id);
              await crm.remove("applications", app.id);
          }
          const clientContact = person.personType === "CLIENT_CONTACT" || (await crm.find("opportunities", eq("pointOfContactId", person.id))).length > 0;
          for (const comm of await crm.find("communications", eq("personId", person.id))) {
              if (!clientContact || !comm.opportunityId)
                  await crm.remove("communications", comm.id);
          }
          if (clientContact)
              await crm.update("people", person.id, WORKER_FIELDS_CLEARED);
          else {
              files += await removeAttachments(crm, "targetPersonId", person.id);
              await crm.remove("people", person.id);
          }
      }
      return { people: people.length, files };
  }
  return { optionValue, clusterValue, roleValue, languageValue, sourceValue, phoneDigits, workRoles, clusters, personFields, ANSWER_OPTIONS, screeningFields, phoneValue, applicationFields, ACK_TEMPLATE, ackText, deliveryStatus, ackSyncState, ackKey, ackFields, upsertPerson, ensureApplication, upsertAcknowledgement, erasePerson };
})();

export async function main() {
    const crm = await twentyFromConfig();
    return withTalentDb((query) => runRetention({ query, deleteFile: deleteObject, deleteContact, eraseCrmPerson: (phone) => erasePerson(crm, phone) }));
}

