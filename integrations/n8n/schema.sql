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
  CREATE INDEX IF NOT EXISTS submissions_phone_idx ON submissions (phone);

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
END
$$;
