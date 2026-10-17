-- Notification hub schema for the `notify` database on pg-main.
-- Owned by the `notify` role; applied by the Windmill script f/notify/setup
-- (safe to re-run). See docs/notification-hub.md.
DO $$
BEGIN
  -- Every event any producer emitted (lib/event.ts, schema v1). title and
  -- summary carry no personal data; pii is cleared once its push is sent
  -- (or never needed), and after a day at the latest.
  CREATE TABLE IF NOT EXISTS notify_events (
    id           bigserial PRIMARY KEY,
    v            int NOT NULL DEFAULT 1,
    source       text NOT NULL,
    type         text NOT NULL,
    severity     text NOT NULL CHECK (severity IN ('info', 'notice', 'warning', 'critical')),
    dedupe_key   text NOT NULL,
    status       text CHECK (status IN ('firing', 'resolved')),
    occurred_at  timestamptz NOT NULL,
    received_at  timestamptz NOT NULL DEFAULT now(),
    title        text NOT NULL,
    summary      text NOT NULL,
    body         text,
    link         jsonb,
    pii          jsonb,
    -- Set by dispatch: when it was routed, by which rule, and its outcome.
    routed_at    timestamptz,
    rule         text,
    duplicate    boolean NOT NULL DEFAULT false,
    -- In the daily digest (email mode digest), and when it went out in one.
    digest       boolean NOT NULL DEFAULT false,
    digested_at  timestamptz
  );
  CREATE INDEX IF NOT EXISTS notify_events_unrouted_idx ON notify_events (id) WHERE routed_at IS NULL;
  CREATE INDEX IF NOT EXISTS notify_events_digest_idx ON notify_events (received_at) WHERE digest AND digested_at IS NULL;
  CREATE INDEX IF NOT EXISTS notify_events_pii_idx ON notify_events (received_at) WHERE pii IS NOT NULL;
  CREATE INDEX IF NOT EXISTS notify_events_key_idx ON notify_events (dedupe_key, id);

  -- What the hub remembers per dedupeKey: dedupe, firing/resolved, the
  -- daily reminder and hourly collapsing (lib/policy.ts KeyState).
  -- last_event_id: the event that opened the current episode (or the latest,
  -- for collapsed keys); reminders and summaries are rendered from it.
  CREATE TABLE IF NOT EXISTS notify_keys (
    dedupe_key     text PRIMARY KEY,
    status         text CHECK (status IN ('firing', 'resolved')),
    firing_pushed  boolean NOT NULL DEFAULT false,
    firing_emailed boolean NOT NULL DEFAULT false,
    last_push_at   timestamptz,
    pending_count  int NOT NULL DEFAULT 0,
    seen_count     int NOT NULL DEFAULT 0,
    last_event_id  bigint REFERENCES notify_events (id) ON DELETE SET NULL,
    updated_at     timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS notify_keys_sweep_idx ON notify_keys (last_push_at) WHERE status = 'firing' OR pending_count > 0;

  -- The outbox: one row per push or email to send. Claimed with FOR UPDATE
  -- SKIP LOCKED; four tries (the first and three retries), then failed. A
  -- failed push of a fallback severity (policy.fallbackEmail) queues an email.
  CREATE TABLE IF NOT EXISTS notify_deliveries (
    id              bigserial PRIMARY KEY,
    event_id        bigint NOT NULL REFERENCES notify_events (id) ON DELETE CASCADE,
    channel         text NOT NULL CHECK (channel IN ('push', 'email')),
    kind            text NOT NULL CHECK (kind IN ('event', 'resolved', 'reminder', 'collapsed', 'fallback')),
    count           int NOT NULL DEFAULT 1,
    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    attempts        int NOT NULL DEFAULT 0,
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    last_error      text,
    sent_at         timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS notify_deliveries_due_idx ON notify_deliveries (next_attempt_at, id) WHERE status = 'pending';
  CREATE INDEX IF NOT EXISTS notify_deliveries_sending_idx ON notify_deliveries (updated_at) WHERE status = 'sending';
  CREATE INDEX IF NOT EXISTS notify_deliveries_event_idx ON notify_deliveries (event_id);
END
$$;
