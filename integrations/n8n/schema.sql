-- Talent intake schema for the `talent` database on pg-main.
-- Owned by the `talent` role; applied by the "VSPL talent · setup" workflow
-- (safe to re-run). See integrations/n8n/README.md.
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
    status                   text NOT NULL DEFAULT 'received'
                             CHECK (status IN ('received', 'delivering', 'delivered', 'failed')),
    attempts                 int NOT NULL DEFAULT 0,
    last_error               text,
    chatwoot_contact_id      bigint,
    chatwoot_conversation_id bigint,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
  );
  -- The role page it came from (JOB_ROLES in src/lib/talent-intake/rules.ts); null from /jobs.
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS role text;
  CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions (status, created_at);
  -- The hub page it came from (JOB_HUBS in rules.ts: /jobs/freshers…); null otherwise.
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS hub text;
  CREATE INDEX IF NOT EXISTS submissions_role_idx ON submissions (role, created_at);
  -- How it reached us (INTAKE_CHANNELS in rules.ts): the jobs form, or an AI agent through /api/agent/jobs.
  ALTER TABLE submissions ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'web';
  ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_channel_check;
  ALTER TABLE submissions ADD CONSTRAINT submissions_channel_check CHECK (channel IN ('web', 'agent'));
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

  -- Separate from Chatwoot delivery. Only new submissions are queued by intake;
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
  -- deletes their R2 files, Chatwoot contacts (with conversations) and rows,
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
END
$$;
