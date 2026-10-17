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
const { withTalentDb, queryWith } = (() => {
  const passThroughJson = (oid) => ({
      to: oid,
      from: [oid],
      serialize: (value) => (typeof value === "string" ? value : JSON.stringify(value)),
      parse: (value) => JSON.parse(value),
  });
  async function withTalentDb(fn) {
      const sql = postgres(await config("talent_pg_url"), {
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
  return { withTalentDb, queryWith };
})();

// integrations/windmill/talent/lib/sql.ts
const { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED } = (() => {
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
  return { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, RECOVER_STUCK_DELIVERIES, CLAIM_SUBMISSION, RECORD_CONVERSATION, MARK_DELIVERED, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED };
})();

export async function main() {
    await withTalentDb((query) => query(schemaStatements("-- Talent intake schema for the `talent` database on pg-main.\n-- Owned by the `talent` role; applied by the Windmill script f/talent/setup\n-- (safe to re-run). See integrations/windmill/README.md.\nDO $$\nBEGIN\n  CREATE TABLE IF NOT EXISTS submissions (\n    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n    ref                      text NOT NULL UNIQUE,\n    source                   text NOT NULL CHECK (source IN ('web_en', 'web_hi', 'web_hinglish', 'whatsapp', 'phone', 'sms')),\n    locale                   text NOT NULL CHECK (locale IN ('en', 'hi', 'hinglish')),\n    phone                    text NOT NULL,\n    consent_version          text NOT NULL,\n    consented_at             timestamptz NOT NULL,\n    adult                    boolean NOT NULL,\n    text                     text,\n    status                   text NOT NULL DEFAULT 'received'\n                             CHECK (status IN ('received', 'delivering', 'delivered', 'failed')),\n    attempts                 int NOT NULL DEFAULT 0,\n    last_error               text,\n    chatwoot_contact_id      bigint,\n    chatwoot_conversation_id bigint,\n    created_at               timestamptz NOT NULL DEFAULT now(),\n    updated_at               timestamptz NOT NULL DEFAULT now()\n  );\n  -- The role page it came from (JOB_ROLES in src/lib/talent-intake/rules.ts); null from /jobs.\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS role text;\n  CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions (status, created_at);\n  -- The hub page it came from (JOB_HUBS in rules.ts: /jobs/freshers…); null otherwise.\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS hub text;\n  CREATE INDEX IF NOT EXISTS submissions_role_idx ON submissions (role, created_at);\n  -- How it reached us (INTAKE_CHANNELS in rules.ts): the jobs form, or an AI agent through /api/agent/jobs.\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'web';\n  ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_channel_check;\n  ALTER TABLE submissions ADD CONSTRAINT submissions_channel_check CHECK (channel IN ('web', 'agent'));\n  -- The name an agent gave for itself, if any.\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS agent_name text;\n  -- Which web form ('long' or 'quick'; INTAKE_FORMS in rules.ts), the name typed\n  -- on the quick form, and its answers by question (QUICK_ANSWERS ids).\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS form text;\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS applicant_name text;\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS answers jsonb;\n  CREATE INDEX IF NOT EXISTS submissions_phone_idx ON submissions (phone);\n  -- PLAN §1a and §8.2 (16 Oct 2026), additive: new web submissions arrive as\n  -- source 'web' with a BCP 47 locale. The legacy sources and short locales\n  -- stay valid for old rows and the agent routes. Deploy this before the\n  -- website starts sending 'web'.\n  ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_source_check;\n  ALTER TABLE submissions ADD CONSTRAINT submissions_source_check\n    CHECK (source IN ('web', 'web_en', 'web_hi', 'web_hinglish', 'whatsapp', 'phone', 'sms'));\n  ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_locale_check;\n  ALTER TABLE submissions ADD CONSTRAINT submissions_locale_check\n    CHECK (locale IN ('en-IN', 'hi-IN', 'hi-Latn-IN', 'pa-IN', 'kn-IN', 'en', 'hi', 'hinglish'));\n  -- The submission's cluster (INTAKE_CLUSTERS in rules.ts): the area chosen,\n  -- else the page's, else 'other'; the page's own cluster; and the page's\n  -- neutral path (/jobs/haridwar). All null on older rows.\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS cluster text;\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS page_cluster text;\n  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS page_path text;\n  CREATE INDEX IF NOT EXISTS submissions_cluster_idx ON submissions (cluster, created_at);\n\n  -- Separate from Chatwoot delivery. Only new submissions are queued by intake;\n  -- setup never backfills acknowledgements for historical applications.\n  CREATE TABLE IF NOT EXISTS sms_acknowledgements (\n    submission_id uuid PRIMARY KEY REFERENCES submissions (id) ON DELETE CASCADE,\n    status text NOT NULL DEFAULT 'pending'\n      CHECK (status IN ('pending', 'sending', 'accepted', 'failed', 'unknown')),\n    attempts int NOT NULL DEFAULT 0,\n    request_id text,\n    last_error text,\n    next_attempt_at timestamptz NOT NULL DEFAULT now(),\n    accepted_at timestamptz,\n    created_at timestamptz NOT NULL DEFAULT now(),\n    updated_at timestamptz NOT NULL DEFAULT now()\n  );\n  CREATE INDEX IF NOT EXISTS sms_acknowledgements_pending_idx\n    ON sms_acknowledgements (next_attempt_at, created_at) WHERE status = 'pending';\n\n  CREATE TABLE IF NOT EXISTS attachments (\n    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n    submission_id       uuid NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,\n    position            int NOT NULL,\n    kind                text NOT NULL CHECK (kind IN ('audio', 'image', 'document')),\n    r2_key              text NOT NULL UNIQUE,\n    mime                text NOT NULL,\n    size_bytes          int NOT NULL,\n    original_name       text,\n    transcript          text,\n    transcript_language text,\n    transcript_status   text NOT NULL DEFAULT 'none'\n                        CHECK (transcript_status IN ('none', 'pending', 'running', 'done', 'failed')),\n    transcript_attempts int NOT NULL DEFAULT 0,\n    transcript_error    text,\n    sarvam_job_id       text, -- Sarvam request id of the transcript\n    created_at          timestamptz NOT NULL DEFAULT now(),\n    updated_at          timestamptz NOT NULL DEFAULT now(),\n    UNIQUE (submission_id, position)\n  );\n  CREATE INDEX IF NOT EXISTS attachments_transcript_idx ON attachments (transcript_status, created_at);\n\n  -- The worker list (PLAN §8.2): one row per mobile number, upserted by the\n  -- intake workflow with each submission. Nullable and additive. The 12-month\n  -- retention clock (privacy notice §10) runs from last_contact_at, which\n  -- only something the person does renews: an application, a reply, or a\n  -- confirmation on a call (last_confirmed_at). Calls or SMS we send that go\n  -- unanswered never renew it.\n  CREATE TABLE IF NOT EXISTS people (\n    phone             text PRIMARY KEY,\n    name              text,\n    clusters          text[] NOT NULL DEFAULT '{}',\n    home_area         text,\n    relocate          boolean,\n    roles             text[] NOT NULL DEFAULT '{}',\n    locale            text,\n    status            text NOT NULL DEFAULT 'active'\n                      CHECK (status IN ('active', 'placed', 'not-looking', 'do-not-contact')),\n    consent_version   text,\n    last_applied_at   timestamptz,\n    last_confirmed_at timestamptz,\n    last_contact_at   timestamptz,\n    created_at        timestamptz NOT NULL DEFAULT now(),\n    updated_at        timestamptz NOT NULL DEFAULT now()\n  );\n  CREATE INDEX IF NOT EXISTS people_last_contact_idx ON people (last_contact_at);\n  -- First run: everyone who already applied, from their submissions.\n  INSERT INTO people (phone, name, clusters, roles, locale, consent_version, last_applied_at, last_contact_at, created_at)\n  SELECT s.phone,\n         (array_agg(s.applicant_name ORDER BY s.created_at DESC) FILTER (WHERE s.applicant_name IS NOT NULL))[1],\n         coalesce(array_agg(DISTINCT s.cluster) FILTER (WHERE s.cluster IS NOT NULL), '{}'),\n         coalesce(array_agg(DISTINCT s.role) FILTER (WHERE s.role IS NOT NULL), '{}'),\n         (array_agg(s.locale ORDER BY s.created_at DESC))[1],\n         (array_agg(s.consent_version ORDER BY s.created_at DESC))[1],\n         max(s.created_at), max(s.created_at), min(s.created_at)\n  FROM submissions s\n  GROUP BY s.phone\n  ON CONFLICT (phone) DO NOTHING;\n\n  -- Erasure: a person's request (by mobile number, checked against a\n  -- VS-J- reference) or the 12-month retention rule. The retention workflow\n  -- deletes their R2 files, Chatwoot contacts (with conversations) and rows,\n  -- then clears the phone and reference here, keeping only the counts.\n  CREATE TABLE IF NOT EXISTS erasure_requests (\n    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n    phone               text,\n    ref                 text,\n    reason              text NOT NULL CHECK (reason IN ('request', 'retention')),\n    status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),\n    attempts            int NOT NULL DEFAULT 0,\n    last_error          text,\n    removed_submissions int,\n    removed_files       int,\n    removed_contacts    int,\n    requested_at        timestamptz NOT NULL DEFAULT now(),\n    processed_at        timestamptz,\n    updated_at          timestamptz NOT NULL DEFAULT now()\n  );\n  CREATE INDEX IF NOT EXISTS erasure_requests_pending_idx ON erasure_requests (status, requested_at);\n  CREATE UNIQUE INDEX IF NOT EXISTS erasure_requests_open_phone_idx ON erasure_requests (phone) WHERE status IN ('pending', 'running');\n\n  -- What f/talent/sync_crm has written to Twenty (crm.vayasyaseva.com) for\n  -- each submission, and the SMS status it last wrote, so it syncs each\n  -- application once and the acknowledgement again only when it changes.\n  CREATE TABLE IF NOT EXISTS crm_sync (\n    submission_id  uuid PRIMARY KEY REFERENCES submissions (id) ON DELETE CASCADE,\n    person_id      uuid,\n    application_id uuid,\n    ack_status     text,\n    synced_at      timestamptz NOT NULL DEFAULT now()\n  );\n\n  -- Handset delivery of an accepted acknowledgement: Fast2SMS's delivery\n  -- report (f/talent/delivery_report), or its lookup API when no report came\n  -- (f/talent/delivery_check). delivery_status is the outcome (delivered,\n  -- failed, pending); delivery_detail is Fast2SMS's own status and text.\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivery_status text;\n  ALTER TABLE sms_acknowledgements DROP CONSTRAINT IF EXISTS sms_acknowledgements_delivery_status_check;\n  ALTER TABLE sms_acknowledgements ADD CONSTRAINT sms_acknowledgements_delivery_status_check\n    CHECK (delivery_status IN ('delivered', 'failed', 'pending'));\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivery_detail text;\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivered_at timestamptz;\n  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivery_checked_at timestamptz;\n  CREATE INDEX IF NOT EXISTS sms_acknowledgements_request_idx ON sms_acknowledgements (request_id);\nEND\n$$;\n")));
    return { ok: true };
}

