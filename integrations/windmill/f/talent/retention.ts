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
const { withTalentDb, queryWith } = (() => {
  async function withTalentDb(fn) {
      const sql = postgres(await config("talent_pg_url"), {
          max: 1,
          connect_timeout: 10,
          idle_timeout: 5,
          prepare: false,
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
  return { withTalentDb, queryWith };
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
const { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements } = (() => {
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
  return { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements };
})();

// integrations/windmill/talent/lib/run-retention.ts
const { runRetention } = (() => {
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
      await deps.query(DELETE_ROWS, [claimed.id, claimed.phone, claimed.files.length, claimed.contacts.length]);
      result.erased = { requestId: claimed.id, files: claimed.files.length, contacts: claimed.contacts.length };
      return result;
  }
  return { runRetention };
})();

export async function main() {
    return withTalentDb((query) => runRetention({ query, deleteFile: deleteObject, deleteContact }));
}

