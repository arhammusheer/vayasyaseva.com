-- The lead inbox: the `leads` database on pg-main (vayasya-infra
-- apps/pg-main), owned by the `leads` role. Applied by f/leads/setup (safe to
-- re-run). See integrations/windmill/README.md.
DO $$
BEGIN
  -- One row per business enquiry or compliance help request, saved before
  -- f/leads/intake (or f/platform/submission) answers 202: the canonical lead
  -- as the website sent it (packages/contracts business_enquiry.v1).
  CREATE TABLE IF NOT EXISTS leads (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id         text NOT NULL UNIQUE,
    type            text NOT NULL CHECK (type IN ('business_enquiry.v1', 'compliance_help.v1')),
    channel         text NOT NULL CHECK (channel IN ('web', 'agent')),
    payload         jsonb NOT NULL,
    idempotency_key text,
    received_at     timestamptz NOT NULL,
    created_at      timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS leads_received_idx ON leads (received_at);

  -- Where each lead still has to go: Twenty CRM (company, contact, crew
  -- request, enquiry; f/leads/sync_crm). Retries back off 1, 2, 4… minutes,
  -- at most an hour, and stop at max_attempts ('dead').
  CREATE TABLE IF NOT EXISTS deliveries (
    lead_id         uuid NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
    target          text NOT NULL CHECK (target IN ('crm')),
    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'dead')),
    attempts        int NOT NULL DEFAULT 0,
    max_attempts    int NOT NULL DEFAULT 8,
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    last_error      text,
    result          jsonb,
    done_at         timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (lead_id, target)
  );
  CREATE INDEX IF NOT EXISTS deliveries_due_idx ON deliveries (target, next_attempt_at) WHERE status = 'pending';

  -- Dead rows, rows stuck running, and rows overdue by an hour (f/platform/health).
  CREATE OR REPLACE VIEW deliveries_attention AS
  SELECT d.*, l.case_id,
         CASE WHEN d.status = 'dead' THEN 'dead'
              WHEN d.status = 'running' AND d.updated_at < now() - interval '15 minutes' THEN 'stuck'
              ELSE 'overdue' END AS reason
  FROM deliveries d JOIN leads l ON l.id = d.lead_id
  WHERE d.status = 'dead'
     OR (d.status = 'running' AND d.updated_at < now() - interval '15 minutes')
     OR (d.status = 'pending' AND d.next_attempt_at < now() - interval '1 hour');

  -- Erasure of a business enquiry on request (privacy notice §10): by case ID
  -- or by phone (every enquiry from that number). f/leads/erase removes the
  -- enquiries from Twenty and this inbox, then clears case_id and phone here,
  -- keeping only the counts. Queued by hand (integrations/windmill/OPERATIONS.md);
  -- nothing is queued automatically.
  CREATE TABLE IF NOT EXISTS erasure_requests (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id               text,
    phone                 text,
    reason                text NOT NULL DEFAULT 'request' CHECK (reason IN ('request')),
    status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
    attempts              int NOT NULL DEFAULT 0,
    last_error            text,
    removed_leads         int,
    removed_opportunities int,
    removed_people        int,
    removed_companies     int,
    removed_crm_files     int,
    requested_at          timestamptz NOT NULL DEFAULT now(),
    processed_at          timestamptz,
    updated_at            timestamptz NOT NULL DEFAULT now(),
    CHECK (status = 'done' OR case_id IS NOT NULL OR phone IS NOT NULL)
  );
  CREATE INDEX IF NOT EXISTS erasure_requests_pending_idx ON erasure_requests (status, requested_at);

  -- Idempotency-Key answers of the contact routes (f/platform/idempotency). Kept a day.
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

  -- Minimum wage rate alerts (rate_alert.v1, 10 Nov 2026): one row per email
  -- address, with the wage page states it follows. 'pending' until the link
  -- in the first email is opened; a pending row is deleted after 7 days.
  -- Unsubscribing deletes the row (and its sends). The token is the one in
  -- the confirm and unsubscribe links.
  CREATE TABLE IF NOT EXISTS alert_subscribers (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email          text NOT NULL UNIQUE,
    states         text[] NOT NULL,
    status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
    token          text NOT NULL UNIQUE,
    source_path    text,
    notice_version text NOT NULL,
    ref            text NOT NULL,
    last_mail_at   timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    confirmed_at   timestamptz,
    updated_at     timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS alert_subscribers_pending_idx ON alert_subscribers (created_at) WHERE status = 'pending';

  -- Which alert each subscriber has had: one per state and revision (the
  -- date the new rates are in force from), so f/leads/alerts_send can be
  -- run again after a failure without mailing anyone twice.
  CREATE TABLE IF NOT EXISTS alert_sends (
    subscriber_id uuid NOT NULL REFERENCES alert_subscribers (id) ON DELETE CASCADE,
    state         text NOT NULL,
    revision      text NOT NULL,
    sent_at       timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (subscriber_id, state, revision)
  );
END
$$;
