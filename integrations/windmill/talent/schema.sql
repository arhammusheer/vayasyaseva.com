-- Talent intake schema for the `talent` database on pg-main.
-- Owned by the `talent` role; applied by the Windmill script f/talent/setup
-- (safe to re-run). See integrations/windmill/README.md.
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS submissions (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ref                      text NOT NULL UNIQUE,
    source                   text NOT NULL CHECK (source IN ('web_en', 'web_hi', 'web_hinglish', 'whatsapp', 'phone', 'sms')),
    locale                   text NOT NULL CHECK (locale IN ('en', 'hi', 'hinglish')),
    phone                    text NOT NULL,
    consent_version          text NOT NULL,
    consented_at             timestamptz NOT NULL,
    adult                    boolean NOT NULL,
    text                     text,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
  );
  -- The role page it came from (JOB_ROLES in src/lib/talent-intake/rules.ts); null from /jobs.
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS role text;
  -- The hub page it came from (JOB_HUBS in rules.ts: /jobs/freshers…); null otherwise.
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS hub text;
  CREATE INDEX IF NOT EXISTS submissions_role_idx ON submissions (role, created_at);
  -- How it reached us (INTAKE_CHANNELS in rules.ts): the jobs form, an AI agent through /api/agent/jobs,
  -- or the WhatsApp apply chat (f/talent/whatsapp, 19 Oct 2026).
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'web';
  ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_channel_check;
  ALTER TABLE submissions ADD CONSTRAINT submissions_channel_check CHECK (channel IN ('web', 'agent', 'whatsapp'));
  -- The name an agent gave for itself, if any.
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS agent_name text;
  -- Which web form ('long' or 'quick'; INTAKE_FORMS in rules.ts), the name typed
  -- on the quick form, and its answers by question (QUICK_ANSWERS ids).
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS form text;
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS applicant_name text;
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS answers jsonb;
  CREATE INDEX IF NOT EXISTS submissions_phone_idx ON submissions (phone);
  -- PLAN §1a and §8.2 (16 Oct 2026), additive: new web submissions arrive as
  -- source 'web' with a BCP 47 locale. The legacy sources and short locales
  -- stay valid for old rows and the agent routes. Deploy this before the
  -- website starts sending 'web'.
  ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_source_check;
  ALTER TABLE submissions ADD CONSTRAINT submissions_source_check
    CHECK (source IN ('web', 'web_en', 'web_hi', 'web_hinglish', 'whatsapp', 'phone', 'sms'));
  ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_locale_check;
  ALTER TABLE submissions ADD CONSTRAINT submissions_locale_check
    CHECK (locale IN ('en-IN', 'hi-IN', 'hi-Latn-IN', 'pa-IN', 'kn-IN', 'en', 'hi', 'hinglish'));
  -- The submission's cluster (INTAKE_CLUSTERS in rules.ts): the area chosen,
  -- else the page's, else 'other'; the page's own cluster; and the page's
  -- neutral path (/jobs/haridwar). All null on older rows.
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS cluster text;
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS page_cluster text;
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS page_path text;
  CREATE INDEX IF NOT EXISTS submissions_cluster_idx ON submissions (cluster, created_at);

  -- Only new submissions are queued by intake;
  -- setup never backfills acknowledgements for historical applications.
  CREATE TABLE IF NOT EXISTS sms_acknowledgements (
    submission_id uuid PRIMARY KEY REFERENCES submissions (id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'sending', 'accepted', 'failed', 'unknown')),
    attempts int NOT NULL DEFAULT 0,
    request_id text,
    last_error text,
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    accepted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS sms_acknowledgements_pending_idx
    ON sms_acknowledgements (next_attempt_at, created_at) WHERE status = 'pending';

  CREATE TABLE IF NOT EXISTS attachments (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id       uuid NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,
    position            int NOT NULL,
    kind                text NOT NULL CHECK (kind IN ('audio', 'image', 'document')),
    r2_key              text NOT NULL UNIQUE,
    mime                text NOT NULL,
    size_bytes          int NOT NULL,
    original_name       text,
    transcript          text,
    transcript_language text,
    transcript_status   text NOT NULL DEFAULT 'none'
                        CHECK (transcript_status IN ('none', 'pending', 'running', 'done', 'failed')),
    transcript_attempts int NOT NULL DEFAULT 0,
    transcript_error    text,
    sarvam_job_id       text, -- Sarvam request id of the transcript
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (submission_id, position)
  );
  CREATE INDEX IF NOT EXISTS attachments_transcript_idx ON attachments (transcript_status, created_at);

  -- The worker list (PLAN §8.2): one row per mobile number, upserted by the
  -- intake workflow with each submission. Nullable and additive. The 12-month
  -- retention clock (privacy notice §10) runs from last_contact_at, which
  -- only something the person does renews: an application, a reply, or a
  -- confirmation on a call (last_confirmed_at). Calls or SMS we send that go
  -- unanswered never renew it.
  CREATE TABLE IF NOT EXISTS people (
    phone             text PRIMARY KEY,
    name              text,
    clusters          text[] NOT NULL DEFAULT '{}',
    home_area         text,
    relocate          boolean,
    roles             text[] NOT NULL DEFAULT '{}',
    locale            text,
    status            text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'placed', 'not-looking', 'do-not-contact')),
    consent_version   text,
    last_applied_at   timestamptz,
    last_confirmed_at timestamptz,
    last_contact_at   timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS people_last_contact_idx ON people (last_contact_at);
  -- First run: everyone who already applied, from their submissions.
  INSERT INTO people (phone, name, clusters, roles, locale, consent_version, last_applied_at, last_contact_at, created_at)
  SELECT s.phone,
         (array_agg(s.applicant_name ORDER BY s.created_at DESC) FILTER (WHERE s.applicant_name IS NOT NULL))[1],
         coalesce(array_agg(DISTINCT s.cluster) FILTER (WHERE s.cluster IS NOT NULL), '{}'),
         coalesce(array_agg(DISTINCT s.role) FILTER (WHERE s.role IS NOT NULL), '{}'),
         (array_agg(s.locale ORDER BY s.created_at DESC))[1],
         (array_agg(s.consent_version ORDER BY s.created_at DESC))[1],
         max(s.created_at), max(s.created_at), min(s.created_at)
  FROM submissions s
  GROUP BY s.phone
  ON CONFLICT (phone) DO NOTHING;

  -- Erasure: a person's request (by mobile number, checked against a
  -- VS-J- reference) or the 12-month retention rule. The retention workflow
  -- deletes their R2 files, Twenty records and rows,
  -- then clears the phone and reference here, keeping only the counts.
  CREATE TABLE IF NOT EXISTS erasure_requests (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone               text,
    ref                 text,
    reason              text NOT NULL CHECK (reason IN ('request', 'retention')),
    status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
    attempts            int NOT NULL DEFAULT 0,
    last_error          text,
    removed_submissions int,
    removed_files       int,
    removed_contacts    int,
    requested_at        timestamptz NOT NULL DEFAULT now(),
    processed_at        timestamptz,
    updated_at          timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS erasure_requests_pending_idx ON erasure_requests (status, requested_at);
  CREATE UNIQUE INDEX IF NOT EXISTS erasure_requests_open_phone_idx ON erasure_requests (phone) WHERE status IN ('pending', 'running');

  -- What f/talent/sync_crm has written to Twenty (crm.vayasyaseva.com) for
  -- each submission, and the SMS status it last wrote, so it syncs each
  -- application once and the acknowledgement again only when it changes.
  CREATE TABLE IF NOT EXISTS crm_sync (
    submission_id  uuid PRIMARY KEY REFERENCES submissions (id) ON DELETE CASCADE,
    person_id      uuid,
    application_id uuid,
    ack_status     text,
    synced_at      timestamptz NOT NULL DEFAULT now()
  );

  -- Handset delivery of an accepted acknowledgement: Fast2SMS's delivery
  -- report (f/talent/delivery_report), or its lookup API when no report came
  -- (f/talent/delivery_check). delivery_status is the outcome (delivered,
  -- failed, pending); delivery_detail is Fast2SMS's own status and text.
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivery_status text;
  ALTER TABLE sms_acknowledgements DROP CONSTRAINT IF EXISTS sms_acknowledgements_delivery_status_check;
  ALTER TABLE sms_acknowledgements ADD CONSTRAINT sms_acknowledgements_delivery_status_check
    CHECK (delivery_status IN ('delivered', 'failed', 'pending'));
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivery_detail text;
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS delivery_checked_at timestamptz;
  CREATE INDEX IF NOT EXISTS sms_acknowledgements_request_idx ON sms_acknowledgements (request_id);

  -- The WhatsApp acknowledgement (20 Oct 2026, talent/lib/whatsapp-ack.ts):
  -- sent first, from the WhatsApp Business number; the SMS is the fallback.
  -- wa_status is the send (skipped: no approved template for the language),
  -- wa_delivery its report. status 'skipped': WhatsApp delivered, no SMS.
  ALTER TABLE sms_acknowledgements DROP CONSTRAINT IF EXISTS sms_acknowledgements_status_check;
  ALTER TABLE sms_acknowledgements ADD CONSTRAINT sms_acknowledgements_status_check
    CHECK (status IN ('pending', 'sending', 'accepted', 'failed', 'unknown', 'skipped'));
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_status text;
  ALTER TABLE sms_acknowledgements DROP CONSTRAINT IF EXISTS sms_acknowledgements_wa_status_check;
  ALTER TABLE sms_acknowledgements ADD CONSTRAINT sms_acknowledgements_wa_status_check
    CHECK (wa_status IN ('sending', 'accepted', 'failed', 'unknown', 'skipped'));
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_request_id text;
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_error text;
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_sent_at timestamptz;
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_updated_at timestamptz;
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_delivery text;
  ALTER TABLE sms_acknowledgements DROP CONSTRAINT IF EXISTS sms_acknowledgements_wa_delivery_check;
  ALTER TABLE sms_acknowledgements ADD CONSTRAINT sms_acknowledgements_wa_delivery_check
    CHECK (wa_delivery IN ('read', 'delivered', 'failed', 'pending'));
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_detail text;
  ALTER TABLE sms_acknowledgements ADD COLUMN IF NOT EXISTS wa_delivered_at timestamptz;

  -- Roadmap 1F: one deliveries row per submission and target (the SMS
  -- acknowledgement, the Twenty CRM records, the files into Twenty),
  -- worked by the one dispatcher (f/talent/dispatch) with exponential backoff
  -- and a cap on attempts, after which a row is 'dead'. An SMS whose send was
  -- interrupted is 'unknown' and is never sent again automatically. The
  -- older status columns (sms_acknowledgements.status, crm_sync) are kept
  -- and still written by each step; the views below show the old statuses
  -- from the deliveries.
  CREATE TABLE IF NOT EXISTS deliveries (
    submission_id   uuid NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,
    target          text NOT NULL CHECK (target IN ('sms', 'crm', 'files')),
    status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'done', 'unknown', 'dead')),
    attempts        int NOT NULL DEFAULT 0,
    max_attempts    int NOT NULL,
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    last_error      text,
    done_at         timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (submission_id, target)
  );
  CREATE INDEX IF NOT EXISTS deliveries_due_idx ON deliveries (target, next_attempt_at) WHERE status = 'pending';
  CREATE INDEX IF NOT EXISTS deliveries_status_idx ON deliveries (status, updated_at);

  -- The files target (18 Oct 2026): applicants' files copied from R2 into
  -- Twenty as attachments on their application (talent/lib/run-files.ts).
  -- The chatwoot target retired with Chatwoot (24 Oct 2026): its rows, and
  -- the submissions columns only it used, go.
  DELETE FROM deliveries WHERE target = 'chatwoot';
  ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_target_check;
  ALTER TABLE deliveries ADD CONSTRAINT deliveries_target_check CHECK (target IN ('sms', 'crm', 'files'));
  DROP VIEW IF EXISTS delivery_status;
  ALTER TABLE submissions DROP COLUMN IF EXISTS status, DROP COLUMN IF EXISTS attempts, DROP COLUMN IF EXISTS last_error,
    DROP COLUMN IF EXISTS chatwoot_contact_id, DROP COLUMN IF EXISTS chatwoot_conversation_id;

  -- Every new submission gets its three deliveries (SMS: three attempts, as
  -- before; CRM: eight; files into Twenty: eight).
  CREATE OR REPLACE FUNCTION queue_deliveries() RETURNS trigger LANGUAGE plpgsql AS $fn$
  BEGIN
    INSERT INTO deliveries (submission_id, target, max_attempts)
    VALUES (NEW.id, 'sms', 3), (NEW.id, 'crm', 8), (NEW.id, 'files', 8)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END
  $fn$;
  DROP TRIGGER IF EXISTS submissions_queue_deliveries ON submissions;
  CREATE TRIGGER submissions_queue_deliveries AFTER INSERT ON submissions FOR EACH ROW EXECUTE FUNCTION queue_deliveries();

  -- Twenty shows the acknowledgement's status: when it changes (sent,
  -- delivered, read, failed, on WhatsApp or by SMS), the CRM delivery runs again.
  CREATE OR REPLACE FUNCTION reopen_crm_delivery() RETURNS trigger LANGUAGE plpgsql AS $fn$
  BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.delivery_status IS DISTINCT FROM NEW.delivery_status
       OR OLD.wa_status IS DISTINCT FROM NEW.wa_status OR OLD.wa_delivery IS DISTINCT FROM NEW.wa_delivery THEN
      UPDATE deliveries SET status = 'pending', attempts = 0, next_attempt_at = now(), last_error = NULL, updated_at = now()
      WHERE submission_id = NEW.submission_id AND target = 'crm' AND status IN ('done', 'dead');
    END IF;
    RETURN NEW;
  END
  $fn$;
  DROP TRIGGER IF EXISTS sms_acknowledgements_reopen_crm ON sms_acknowledgements;
  CREATE TRIGGER sms_acknowledgements_reopen_crm AFTER UPDATE ON sms_acknowledgements FOR EACH ROW EXECUTE FUNCTION reopen_crm_delivery();

  -- The existing statuses, carried over once (re-running adds only what is missing).
  INSERT INTO deliveries (submission_id, target, status, attempts, max_attempts, next_attempt_at, last_error, done_at, created_at, updated_at)
  SELECT a.submission_id, 'sms',
         CASE a.status WHEN 'pending' THEN 'pending' WHEN 'sending' THEN 'running' WHEN 'accepted' THEN 'done'
                       WHEN 'failed' THEN 'dead' ELSE 'unknown' END,
         a.attempts, 3, a.next_attempt_at, a.last_error, a.accepted_at, a.created_at, a.updated_at
  FROM sms_acknowledgements a
  ON CONFLICT DO NOTHING;
  INSERT INTO deliveries (submission_id, target, status, max_attempts, done_at, created_at, updated_at)
  SELECT s.id, 'crm', CASE WHEN c.submission_id IS NULL THEN 'pending' ELSE 'done' END, 8, c.synced_at, s.created_at, coalesce(c.synced_at, s.created_at)
  FROM submissions s LEFT JOIN crm_sync c ON c.submission_id = s.id
  ON CONFLICT DO NOTHING;

  -- The old statuses, from the deliveries: the SMS as
  -- sms_acknowledgements.status names them, and whether the CRM has it.
  -- One row per submission.
  CREATE OR REPLACE VIEW delivery_status AS
  SELECT s.id AS submission_id, s.ref, s.created_at,
         CASE m.status WHEN 'pending' THEN 'pending' WHEN 'running' THEN 'sending' WHEN 'done' THEN 'accepted'
                       WHEN 'dead' THEN 'failed' ELSE 'unknown' END AS sms_status,
         (r.status = 'done') AS crm_synced,
         m.attempts AS sms_attempts, r.attempts AS crm_attempts,
         coalesce(m.last_error, r.last_error) AS last_error
  FROM submissions s
  LEFT JOIN deliveries m ON m.submission_id = s.id AND m.target = 'sms'
  LEFT JOIN deliveries r ON r.submission_id = s.id AND r.target = 'crm';

  -- Work that needs a person: dead rows, SMS of unknown fate, and rows stuck
  -- running or overdue (f/platform/health counts these). A files row waiting
  -- for its Twenty application is not overdue itself: the CRM row is.
  CREATE OR REPLACE VIEW deliveries_attention AS
  SELECT d.*, s.ref,
         CASE WHEN d.status = 'dead' THEN 'dead'
              WHEN d.status = 'unknown' THEN 'unknown'
              WHEN d.status = 'running' AND d.updated_at < now() - interval '15 minutes' THEN 'stuck'
              ELSE 'overdue' END AS reason
  FROM deliveries d JOIN submissions s ON s.id = d.submission_id
  WHERE d.status IN ('dead', 'unknown')
     OR (d.status = 'running' AND d.updated_at < now() - interval '15 minutes')
     OR (d.status = 'pending' AND d.next_attempt_at < now() - interval '1 hour'
         AND (d.target <> 'files' OR EXISTS (
           SELECT 1 FROM crm_sync c WHERE c.submission_id = d.submission_id AND c.application_id IS NOT NULL)));

  -- Idempotency-Key answers of the jobs routes (the site's
  -- src/server/submissions/policies/idempotency.ts, through
  -- f/platform/idempotency). Kept a day.
  CREATE TABLE IF NOT EXISTS idempotency_keys (
    scope       text NOT NULL,
    key         text NOT NULL,
    fingerprint text NOT NULL,
    state       text NOT NULL CHECK (state IN ('running', 'done', 'failed')),
    answer      jsonb,
    carry       jsonb,
    updated_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (scope, key)
  );
  CREATE INDEX IF NOT EXISTS idempotency_keys_updated_idx ON idempotency_keys (updated_at);

  -- Applicants' files into Twenty (18 Oct 2026; the files delivery target,
  -- talent/lib/run-files.ts). Per file: the Twenty file and attachment it
  -- became, and where it stands: pending; done (attached); missing (gone
  -- from R2, which keeps files 90 days); skipped (voice notes, from before
  -- 16 Oct 2026, are not copied and are left to expire).
  ALTER TABLE attachments ADD COLUMN IF NOT EXISTS twenty_file_id uuid;
  ALTER TABLE attachments ADD COLUMN IF NOT EXISTS twenty_attachment_id uuid;
  ALTER TABLE attachments ADD COLUMN IF NOT EXISTS crm_file_status text NOT NULL DEFAULT 'pending';
  ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_crm_file_status_check;
  ALTER TABLE attachments ADD CONSTRAINT attachments_crm_file_status_check
    CHECK (crm_file_status IN ('pending', 'done', 'missing', 'skipped'));
  ALTER TABLE attachments ADD COLUMN IF NOT EXISTS crm_file_error text;
  ALTER TABLE attachments ADD COLUMN IF NOT EXISTS crm_file_at timestamptz;
  -- How many Twenty attachments an erasure removed.
  ALTER TABLE erasure_requests ADD COLUMN IF NOT EXISTS removed_crm_files int;

  -- The backfill: a files delivery for every earlier application with files
  -- (re-running adds only what is missing). Oldest first, two minutes apart,
  -- so the first to expire from R2 (from 25 Dec 2026) go first and the
  -- queue drains without counting as overdue.
  INSERT INTO deliveries (submission_id, target, max_attempts, next_attempt_at, created_at, updated_at)
  SELECT b.id, 'files', 8, now() + (b.n - 1) * interval '2 minutes', b.created_at, now()
  FROM (
    SELECT s.id, s.created_at, row_number() OVER (ORDER BY s.created_at, s.id) AS n
    FROM submissions s
    WHERE EXISTS (SELECT 1 FROM attachments a WHERE a.submission_id = s.id)
      AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.submission_id = s.id AND d.target = 'files')
  ) b
  ON CONFLICT DO NOTHING;

  -- The WhatsApp apply chat (19 Oct 2026) was removed the same day, before
  -- its webhook was ever made: its two tables never held a row.
  DROP TABLE IF EXISTS whatsapp_chats;
  DROP TABLE IF EXISTS whatsapp_messages;
END
$$;
