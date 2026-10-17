// Generated from integrations/windmill/talent/scripts/dispatch.ts by integrations/windmill/build.mts. Edit the source, not this.

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

// integrations/windmill/talent/lib/sql.ts
const { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, CLAIM_SUBMISSION_FOR, RELEASE_SUBMISSION, SYNC_CANDIDATE_FOR } = (() => {
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
      phone = NULL, ref = NULL
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
    SELECT submission_id, target FROM deliveries
    WHERE target = $1 AND status = 'pending' AND next_attempt_at <= now()
      AND ($2::uuid IS NULL OR submission_id = $2::uuid)
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
  return { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, CLAIM_SUBMISSION_FOR, RELEASE_SUBMISSION, SYNC_CANDIDATE_FOR };
})();

// integrations/windmill/talent/lib/delivery.ts
const { DLR_URL, DLR_TIMEOUT_MS, CHECK_BATCH, outcomeOf, unixToIso, parseReport, saveReport, lookupReport, runDeliveryCheck } = (() => {
  const DLR_URL = "https://www.fast2sms.com/dev/dlr/";
  const DLR_TIMEOUT_MS = 15_000;
  const CHECK_BATCH = 20;
  function outcomeOf(status) {
      const s = status.trim().toLowerCase();
      if (s === "delivered")
          return "delivered";
      if (/fail|undeliv|reject|expire|dnd|block|invalid|error/.test(s))
          return "failed";
      return "pending";
  }
  const text = (v) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
  function unixToIso(v) {
      const n = typeof v === "number" ? v : /^\d+$/.test(text(v)) ? Number(text(v)) : NaN;
      return Number.isFinite(n) && n > 1_000_000_000 ? new Date(n * 1000).toISOString() : null;
  }
  function parseReport(raw, requestId) {
      if (!raw || typeof raw !== "object")
          return null;
      const r = raw;
      const id = requestId ?? text(r.request_id);
      const status = text(r.status);
      if (!/^[A-Za-z0-9_-]{4,64}$/.test(id) || !status)
          return null;
      const outcome = outcomeOf(status);
      const description = text(r.status_description) || text(r.failure_reason) || text(r.description);
      return {
          requestId: id,
          outcome,
          detail: (description && description.toLowerCase() !== status.toLowerCase() ? `${status}: ${description}` : status).slice(0, 300),
          deliveredAt: outcome === "delivered" ? unixToIso(r.delivery_timestamp) : null,
      };
  }
  async function saveReport(query, report) {
      const rows = await query(SAVE_DELIVERY_REPORT, [report.requestId, report.outcome, report.detail, report.deliveredAt]);
      return rows.length;
  }
  async function lookupReport(requestId, apiKey, fetchImpl = fetch) {
      try {
          const res = await fetchImpl(DLR_URL + encodeURIComponent(requestId), {
              headers: { authorization: apiKey },
              signal: AbortSignal.timeout(DLR_TIMEOUT_MS),
          });
          if (!res.ok)
              return null;
          const body = (await res.json());
          const entry = body?.data?.find((d) => d?.request_id === requestId)?.delivery_status?.[0];
          return body?.success ? parseReport(entry, requestId) : null;
      }
      catch {
          return null;
      }
  }
  async function runDeliveryCheck(deps, batch = CHECK_BATCH) {
      const result = { checked: 0, delivered: 0, failed: 0, pending: 0 };
      const due = await deps.query(DELIVERY_CHECK_DUE, [batch]);
      for (const row of due) {
          result.checked++;
          const report = await deps.lookup(row.request_id);
          if (report && (await saveReport(deps.query, report)))
              result[report.outcome]++;
          else {
              await deps.query(MARK_DELIVERY_CHECKED, [row.submission_id]);
              result.pending++;
          }
      }
      return result;
  }
  return { DLR_URL, DLR_TIMEOUT_MS, CHECK_BATCH, outcomeOf, unixToIso, parseReport, saveReport, lookupReport, runDeliveryCheck };
})();

// integrations/windmill/talent/lib/r2.ts
const { downloadObject, deleteObject } = (() => {
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
  async function deleteObject(key) {
      const { aws, url } = await client("erase");
      const res = await aws.fetch(url(key), { method: "DELETE" });
      if (!res.ok && res.status !== 404)
          throw new Error(`R2 DELETE ${key}: HTTP ${res.status}`);
  }
  return { downloadObject, deleteObject };
})();

// integrations/windmill/talent/lib/twenty.ts
const { eq, twentyClient, twentyFromConfig } = (() => {
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
  return { eq, twentyClient, twentyFromConfig };
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
  async function erasePerson(crm, phone) {
      const people = await crm.find("people", eq("phones.primaryPhoneNumber", phoneDigits(phone)));
      for (const person of people) {
          for (const app of await crm.find("applications", eq("personId", person.id))) {
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
          else
              await crm.remove("people", person.id);
      }
      return people.length;
  }
  return { optionValue, clusterValue, roleValue, languageValue, sourceValue, phoneDigits, workRoles, clusters, personFields, ANSWER_OPTIONS, screeningFields, phoneValue, applicationFields, ACK_TEMPLATE, ackText, deliveryStatus, ackSyncState, ackKey, ackFields, upsertPerson, ensureApplication, upsertAcknowledgement, erasePerson };
})();

// packages/contracts/src/rules.ts
const { REF_PATTERN, INTAKE_SOURCES, WEB_SOURCE, isSubmissionSource, INTAKE_LOCALES, isIntakeLocale, LEGACY_SOURCE_LOCALES, INTAKE_CLUSTERS, isIntakeCluster, PAGE_PATH_PATTERN, MAX_PAGE_PATH_LENGTH, isPagePath, INTAKE_CHANNELS, AGENT_LANGUAGE_SOURCES, MAX_AGENT_NAME_LENGTH, JOB_ROLES, JOB_ROLE_SLUGS, isJobRole, JOB_HUBS, JOB_HUB_SLUGS, isJobHub, INTAKE_FORMS, INTAKE_FORM_KEYS, MAX_APPLICANT_NAME_LENGTH, QUICK_ANSWERS, AREA_CLUSTERS, submissionCluster, QUICK_QUESTIONS, cleanQuickAnswers, ATTACHMENT_KINDS, ATTACHMENT_MIME, INTAKE_LIMITS, attachmentKeyPrefix, isAttachmentKeyFor, normaliseIndianMobile } = (() => {
  const REF_PATTERN = /^VS-J-[A-Z0-9]{6}$/;
  const INTAKE_SOURCES = {
      web_en: "en",
      web_hi: "hi",
      web_hinglish: "hinglish",
  };
  const WEB_SOURCE = "web";
  function isSubmissionSource(value) {
      return value === WEB_SOURCE || (typeof value === "string" && Object.hasOwn(INTAKE_SOURCES, value));
  }
  const INTAKE_LOCALES = ["en-IN", "hi-IN", "hi-Latn-IN", "pa-IN", "kn-IN"];
  function isIntakeLocale(value) {
      return typeof value === "string" && INTAKE_LOCALES.includes(value);
  }
  const LEGACY_SOURCE_LOCALES = { web_en: "en-IN", web_hi: "hi-IN", web_hinglish: "hi-Latn-IN" };
  const INTAKE_CLUSTERS = ["haridwar", "uttarakhand", "delhi-ncr", "bengaluru", "jalandhar", "saharanpur", "other", "punjab"];
  function isIntakeCluster(value) {
      return typeof value === "string" && INTAKE_CLUSTERS.includes(value);
  }
  const PAGE_PATH_PATTERN = /^\/([a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*)?$/;
  const MAX_PAGE_PATH_LENGTH = 200;
  function isPagePath(value) {
      return typeof value === "string" && value.length <= MAX_PAGE_PATH_LENGTH && PAGE_PATH_PATTERN.test(value);
  }
  const INTAKE_CHANNELS = ["web", "agent"];
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
          "market:haridwar": "Haridwar / Roorkee", "market:uttarakhand": "Elsewhere in Uttarakhand", "market:jalandhar": "Jalandhar / Kapurthala",
          "market:punjab": "Elsewhere in Punjab", "market:bengaluru": "Bengaluru", "market:other": "Somewhere else",
          "haridwar:rest-of-uttarakhand": "Elsewhere in Uttarakhand (Haridwar form)", "jalandhar:rest-of-punjab": "Elsewhere in Punjab (Jalandhar form)",
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
      "uttarakhand:dehradun-selaqui": "uttarakhand",
      "uttarakhand:udham-singh-nagar": "uttarakhand",
      "uttarakhand:other": "uttarakhand",
      "uttarakhand:outside": null,
      "punjab:jalandhar-kapurthala": "jalandhar",
      "punjab:ludhiana": "punjab",
      "punjab:mohali": "punjab",
      "punjab:amritsar": "punjab",
      "punjab:other": "punjab",
      "punjab:outside": null,
      "market:haridwar": "haridwar",
      "market:uttarakhand": "uttarakhand",
      "market:jalandhar": "jalandhar",
      "market:punjab": "punjab",
      "market:bengaluru": "bengaluru",
      "market:other": null,
      "haridwar:rest-of-uttarakhand": "uttarakhand",
      "jalandhar:rest-of-punjab": "punjab",
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
  return { REF_PATTERN, INTAKE_SOURCES, WEB_SOURCE, isSubmissionSource, INTAKE_LOCALES, isIntakeLocale, LEGACY_SOURCE_LOCALES, INTAKE_CLUSTERS, isIntakeCluster, PAGE_PATH_PATTERN, MAX_PAGE_PATH_LENGTH, isPagePath, INTAKE_CHANNELS, AGENT_LANGUAGE_SOURCES, MAX_AGENT_NAME_LENGTH, JOB_ROLES, JOB_ROLE_SLUGS, isJobRole, JOB_HUBS, JOB_HUB_SLUGS, isJobHub, INTAKE_FORMS, INTAKE_FORM_KEYS, MAX_APPLICANT_NAME_LENGTH, QUICK_ANSWERS, AREA_CLUSTERS, submissionCluster, QUICK_QUESTIONS, cleanQuickAnswers, ATTACHMENT_KINDS, ATTACHMENT_MIME, INTAKE_LIMITS, attachmentKeyPrefix, isAttachmentKeyFor, normaliseIndianMobile };
})();

// integrations/windmill/talent/lib/note.ts
const { composeNote, filesToAttach, conversationAttributes } = (() => {
  const PAGES = {
      "en-IN": "English jobs page (en-IN)",
      "hi-IN": "हिंदी jobs page (hi-IN)",
      "hi-Latn-IN": "Hindi jobs page, Latin script (hi-Latn-IN)",
      "pa-IN": "ਪੰਜਾਬੀ jobs page (pa-IN)",
      "kn-IN": "ಕನ್ನಡ jobs page (kn-IN)",
      en: "English jobs page (en-IN)",
      hi: "हिंदी jobs page (hi-IN)",
      hinglish: "Hindi jobs page, Latin script (hi-Latn-IN)",
  };
  const AGENT_LANGUAGES = {
      "en-IN": "English",
      "hi-IN": "Hindi",
      "hi-Latn-IN": "Hindi, Latin script",
      "pa-IN": "Punjabi",
      "kn-IN": "Kannada",
      en: "English",
      hi: "Hindi",
      hinglish: "Hindi, Latin script",
  };
  const KIND = { audio: "voice note", image: "photo", document: "document" };
  function composeNote(s) {
      const page = s.channel === "agent" ? `AI agent (${AGENT_LANGUAGES[s.locale] ?? s.locale})` : (PAGES[s.locale] ?? s.locale);
      const lines = [`**${s.applicantName ? `${s.applicantName} · ` : ""}Job seeker ${s.ref}** · ${page} · ${s.phone}`];
      if (s.form)
          lines.push(`**Form:** ${INTAKE_FORMS[s.form] ?? s.form}${s.pagePath ? ` on ${s.pagePath}` : ""}`);
      if (s.cluster) {
          const pageNote = s.pageCluster && s.pageCluster !== s.cluster ? ` (page: ${s.pageCluster})` : "";
          lines.push(`**Cluster:** ${s.cluster}${pageNote}`);
      }
      if (s.channel === "agent") {
          lines.push(`**Sent by an AI agent${s.agentName ? ` (${s.agentName})` : ""}** on the person's behalf, not through the form. Confirm the details and their consent when you call.`);
      }
      if (s.role)
          lines.push(`**Asked about:** ${JOB_ROLES[s.role] ?? s.role}`);
      if (s.hub)
          lines.push(`**Came from:** ${JOB_HUBS[s.hub] ?? s.hub}`);
      if (s.answers) {
          lines.push("", "**Their answers:**");
          for (const [question, ids] of Object.entries(s.answers)) {
              const labels = QUICK_ANSWERS[question];
              lines.push(`- ${QUICK_QUESTIONS[question] ?? question}: ${ids.map((id) => labels?.[id] ?? id).join(", ")}`);
          }
      }
      if (s.text)
          lines.push("", "**Their message:**", s.text);
      for (const [n, a] of s.attachments.entries()) {
          if (a.kind !== "audio")
              continue;
          const transcript = a.transcriptStatus === "done" && a.transcript
              ? a.transcript
              : "_Could not be transcribed. Listen to the attachment._";
          lines.push("", `**Voice note (file ${n + 1}), automatic transcript:**`, transcript);
      }
      if (s.attachments.length) {
          lines.push("", `**Files (${s.attachments.length}):** ${s.attachments
              .map((a, n) => `${n + 1}. ${KIND[a.kind] ?? "file"}${a.name ? ` (${a.name})` : ""}`)
              .join(" · ")}`);
      }
      return { contactName: s.applicantName ?? `Job seeker ${s.ref}`, note: lines.join("\n") };
  }
  function filesToAttach(s) {
      return s.attachments.map((a, n) => ({
          key: a.key,
          label: `File ${n + 1}: ${KIND[a.kind] ?? "file"}${a.name ? ` (${a.name})` : ""}`,
      }));
  }
  function conversationAttributes(s) {
      return {
          ...(s.cluster ? { job_cluster: s.cluster } : {}),
          ...(s.role ? { job_role: s.role } : {}),
          ...(s.hub ? { job_hub: s.hub } : {}),
          ...(s.channel === "agent" ? { submitted_via: "agent" } : {}),
          ...(s.form ? { job_form: s.form } : {}),
      };
  }
  return { composeNote, filesToAttach, conversationAttributes };
})();

// integrations/windmill/talent/lib/run-deliver.ts
const { runDeliver } = (() => {
  async function runDeliver(deps, submissionId = null) {
      await deps.query(RECOVER_STUCK_DELIVERIES);
      const [s] = submissionId
          ? await deps.query(CLAIM_SUBMISSION_FOR, [submissionId])
          : await deps.query(CLAIM_SUBMISSION);
      if (!s?.id)
          return null;
      const { contactName, note } = composeNote(s);
      const contact = await deps.createContact(s.phone, contactName);
      const conversation = await deps.createConversation(contact.source_id, conversationAttributes(s));
      await deps.query(RECORD_CONVERSATION, [s.id, contact.id ?? null, conversation.id]);
      await deps.postMessage(contact.source_id, conversation.id, note);
      await deps.query(MARK_DELIVERED, [s.id]);
      let filesAttached = 0;
      const files = filesToAttach(s);
      for (const file of files) {
          const { data } = await deps.download(file.key);
          if (await deps.attachFile(contact.source_id, conversation.id, file.label, data, file.key.split("/").pop() || "file"))
              filesAttached++;
      }
      return { ref: s.ref, conversationId: conversation.id, files: files.length, filesAttached };
  }
  return { runDeliver };
})();

// integrations/windmill/talent/lib/sms.ts
const { FAST2SMS_URL, FAST2SMS_TIMEOUT_MS, MAX_ATTEMPTS, acknowledgementRequest, classifyAcknowledgement, sendAcknowledgement } = (() => {
  const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";
  const FAST2SMS_TIMEOUT_MS = 15_000;
  const MAX_ATTEMPTS = 3;
  function acknowledgementRequest(claim) {
      return {
          route: "dlt",
          sender_id: "VAYSPL",
          message: "227115",
          variables_values: claim.ref,
          numbers: claim.phone.slice(-10),
          sms_details: "1",
          udf1: claim.ref,
      };
  }
  function classifyAcknowledgement(claim, response) {
      const body = response.body;
      const accepted = response.statusCode === 200 && body?.return === true
          && typeof body.request_id === "string" && body.request_id.length > 0;
      const rejected = (response.statusCode === 400 || response.statusCode === 401) && body?.return === false;
      const limited = response.statusCode === 429;
      const status = accepted ? "accepted"
          : limited && claim.attempts < MAX_ATTEMPTS ? "pending"
              : rejected || limited ? "failed" : "unknown";
      return {
          submissionId: claim.submission_id,
          status,
          requestId: accepted ? body.request_id : null,
          error: accepted ? null
              : rejected ? `Fast2SMS rejected request (HTTP ${response.statusCode}, code ${body?.status_code ?? "unspecified"})`
                  : limited ? "Fast2SMS rate limit"
                      : "Send outcome uncertain; check Fast2SMS delivery history before retrying",
      };
  }
  async function sendAcknowledgement(claim, apiKey, fetchImpl = fetch) {
      try {
          const res = await fetchImpl(FAST2SMS_URL, {
              method: "POST",
              headers: { "content-type": "application/json", authorization: apiKey },
              body: JSON.stringify(acknowledgementRequest(claim)),
              signal: AbortSignal.timeout(FAST2SMS_TIMEOUT_MS),
          });
          let body;
          try {
              body = (await res.json());
          }
          catch {
              body = undefined;
          }
          return { statusCode: res.status, body };
      }
      catch {
          return { error: "request failed" };
      }
  }
  return { FAST2SMS_URL, FAST2SMS_TIMEOUT_MS, MAX_ATTEMPTS, acknowledgementRequest, classifyAcknowledgement, sendAcknowledgement };
})();

// integrations/windmill/talent/lib/run-acknowledge.ts
const { runAcknowledge } = (() => {
  async function runAcknowledge(submissionId, deps) {
      if (!submissionId)
          await deps.query(RECOVER_INTERRUPTED_SENDS);
      const [claim] = submissionId
          ? await deps.query(CLAIM_ACKNOWLEDGEMENT_FOR, [submissionId])
          : await deps.query(CLAIM_ACKNOWLEDGEMENT);
      if (!claim?.submission_id)
          return null;
      const result = classifyAcknowledgement(claim, await deps.send(claim));
      await deps.query(SAVE_ACKNOWLEDGEMENT_RESULT, [result.submissionId, result.status, result.requestId, result.error]);
      return result;
  }
  return { runAcknowledge };
})();

// integrations/windmill/talent/lib/run-sync-crm.ts
const { SYNC_BATCH, syncOne, runSyncCrm } = (() => {
  const SYNC_BATCH = 10;
  async function syncOne(deps, c) {
      let personId = c.person_id;
      let applicationId = c.application_id;
      if (!c.synced || !personId || !applicationId) {
          personId = await upsertPerson(deps.crm, c);
          applicationId = await ensureApplication(deps.crm, c, personId);
      }
      if (c.ack_status)
          await upsertAcknowledgement(deps.crm, c, personId, applicationId);
      await deps.query(RECORD_CRM_SYNC, [c.id, personId, applicationId, ackSyncState(c)]);
  }
  async function runSyncCrm(deps, batch = SYNC_BATCH) {
      const log = deps.log ?? ((m) => console.error(m));
      const result = { created: 0, updated: 0, failed: 0 };
      const [lock] = await deps.query(CRM_SYNC_LOCK);
      if (!lock?.locked)
          return { ...result, skipped: "another sync is running" };
      const candidates = await deps.query(SYNC_CANDIDATES, [batch]);
      for (const c of candidates) {
          try {
              await syncOne(deps, c);
              if (c.synced)
                  result.updated++;
              else
                  result.created++;
          }
          catch (err) {
              const message = err instanceof Error ? err.message : "unknown error";
              if (/HTTP 429/.test(message)) {
                  result.rateLimited = true;
                  break;
              }
              log(`sync ${c.ref} failed: ${message}`);
              result.failed++;
          }
      }
      return result;
  }
  return { SYNC_BATCH, syncOne, runSyncCrm };
})();

// integrations/windmill/talent/lib/run-dispatch.ts
const { BUDGET, backoffSeconds, runDispatch } = (() => {
  const BUDGET = { sms: 5, chatwoot: 1, crm: 10 };
  const backoffSeconds = (attempts) => Math.min(60 * 2 ** Math.max(0, attempts - 1), 3600);
  const message = (err) => (err instanceof Error ? err.message : "unknown error").slice(0, 500);
  async function legacy(query, submissionId) {
      return (await query(LEGACY_STATUS, [submissionId]))[0];
  }
  async function sms(deps, submissionId) {
      const result = await runAcknowledge(submissionId, { query: deps.query, send: deps.sendSms });
      if (result) {
          if (result.status === "accepted")
              return { kind: "done" };
          if (result.status === "failed")
              return { kind: "dead", error: result.error };
          if (result.status === "unknown")
              return { kind: "unknown", error: result.error };
          return { kind: "retry", error: result.error };
      }
      const now = await legacy(deps.query, submissionId);
      if (now?.sms === "accepted")
          return { kind: "done" };
      if (now?.sms === "failed")
          return { kind: "dead", error: "Rejected by Fast2SMS" };
      if (now?.sms === "unknown")
          return { kind: "unknown", error: "Interrupted send; check Fast2SMS delivery history before retrying" };
      if (now?.sms === "pending" && (now.sms_attempts ?? 0) >= 3)
          return { kind: "dead", error: "Three attempts" };
      return { kind: "retry", error: now ? `Acknowledgement is ${now.sms}` : "No acknowledgement row" };
  }
  async function chatwoot(deps, submissionId) {
      try {
          const result = await runDeliver({ query: deps.query, ...deps.chatwoot }, submissionId);
          if (result)
              return { kind: "done" };
      }
      catch (err) {
          const now = await legacy(deps.query, submissionId);
          if (now?.chatwoot === "delivered")
              return { kind: "done", error: message(err) };
          const [released] = await deps.query(RELEASE_SUBMISSION, [submissionId, message(err)]);
          return released?.status === "failed" ? { kind: "dead", error: message(err) } : { kind: "retry", error: message(err) };
      }
      const now = await legacy(deps.query, submissionId);
      if (now?.chatwoot === "delivered")
          return { kind: "done" };
      if (now?.chatwoot === "failed")
          return { kind: "dead", error: "Failed three times" };
      return { kind: "retry", error: now ? `Submission is ${now.chatwoot}` : "No submission" };
  }
  class RateLimited extends Error {
  }
  async function crm(deps, submissionId) {
      if (!deps.crm)
          return { kind: "retry", error: "Twenty is not configured" };
      const [c] = await deps.query(SYNC_CANDIDATE_FOR, [submissionId]);
      if (!c)
          return { kind: "dead", error: "No submission" };
      if (c.synced && c.person_id && c.application_id && c.synced_ack_status === ackSyncState(c))
          return { kind: "done" };
      try {
          await syncOne({ query: deps.query, crm: deps.crm }, c);
          return { kind: "done" };
      }
      catch (err) {
          if (/HTTP 429/.test(message(err)))
              throw new RateLimited(message(err));
          return { kind: "retry", error: message(err) };
      }
  }
  const STEPS = { sms, chatwoot, crm };
  async function runDispatch(deps, options = {}) {
      const log = deps.log ?? ((m) => console.error(m));
      const zero = () => ({ sms: 0, chatwoot: 0, crm: 0 });
      const result = { recovered: 0, done: zero(), retried: zero(), failed: zero() };
      const [lock] = await deps.query(DISPATCH_LOCK);
      if (!lock?.locked)
          return { ...result, skipped: "another dispatcher is running" };
      if (!options.submissionId) {
          await deps.query(RECOVER_INTERRUPTED_SENDS);
          result.recovered = (await deps.query(RECOVER_STUCK_DISPATCH)).length;
      }
      const targets = options.submissionId ? ["sms"] : ["sms", "chatwoot", "crm"];
      for (const target of targets) {
          for (let n = 0; n < (options.submissionId ? 1 : BUDGET[target]); n++) {
              const [claim] = await deps.query(CLAIM_DELIVERY, [
                  target,
                  options.submissionId ?? null,
              ]);
              if (!claim)
                  break;
              let outcome;
              let stop = false;
              try {
                  outcome = await STEPS[target](deps, claim.submission_id);
              }
              catch (err) {
                  stop = err instanceof RateLimited;
                  outcome = { kind: "retry", error: message(err) };
                  if (!stop)
                      log(`${target} ${claim.submission_id} failed: ${message(err)}`);
              }
              const [finished] = await deps.query(FINISH_DELIVERY, [
                  claim.submission_id,
                  target,
                  outcome.kind,
                  outcome.error ?? null,
                  backoffSeconds(claim.attempts),
              ]);
              if (finished?.status === "done")
                  result.done[target]++;
              else if (finished?.status === "pending")
                  result.retried[target]++;
              else
                  result.failed[target]++;
              if (stop)
                  break;
          }
      }
      if (options.deliveryCheck && !options.submissionId) {
          result.deliveryCheck = await runDeliveryCheck({ query: deps.query, lookup: deps.lookupReport });
      }
      return result;
  }
  return { BUDGET, backoffSeconds, runDispatch };
})();

export async function main(submission_id) {
    const apiKey = await config("fast2sms_api_key");
    const crm = submission_id ? null : await twentyFromConfig().catch(() => null);
    const deliveryCheck = !submission_id && new Date().getUTCMinutes() % 15 === 0;
    return withTalentDb((query) => runDispatch({
        query,
        sendSms: (claim) => sendAcknowledgement(claim, apiKey),
        chatwoot: { createContact, createConversation, postMessage, download: downloadObject, attachFile },
        crm,
        lookupReport: (id) => lookupReport(id, apiKey),
    }, { submissionId: submission_id || null, deliveryCheck }));
}

