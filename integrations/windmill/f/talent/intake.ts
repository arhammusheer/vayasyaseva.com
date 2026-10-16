// Generated from integrations/windmill/talent/scripts/intake.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

import { timingSafeEqual } from "node:crypto";

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

// src/lib/talent-intake/rules.ts
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
  const INTAKE_LOCALES = ["en-IN", "hi-IN", "hi-Latn-IN"];
  function isIntakeLocale(value) {
      return typeof value === "string" && INTAKE_LOCALES.includes(value);
  }
  const LEGACY_SOURCE_LOCALES = { web_en: "en-IN", web_hi: "hi-IN", web_hinglish: "hi-Latn-IN" };
  const INTAKE_CLUSTERS = ["haridwar", "uttarakhand", "delhi-ncr", "bengaluru", "jalandhar", "saharanpur", "other"];
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

// integrations/windmill/talent/lib/validate.ts
const { validateSubmission, saveSubmissionParams } = (() => {
  function validateSubmission(raw) {
      const body = (raw && typeof raw === "object" ? raw : {});
      const errors = new Set();
      const ref = String(body.ref ?? "");
      if (!REF_PATTERN.test(ref))
          errors.add("ref");
      const source = isSubmissionSource(body.source) ? body.source : null;
      if (!source)
          errors.add("source");
      const locale = isIntakeLocale(body.locale)
          ? body.locale
          : source && source !== WEB_SOURCE
              ? INTAKE_SOURCES[source]
              : null;
      if (source && !locale)
          errors.add("locale");
      const cluster = isIntakeCluster(body.cluster) ? body.cluster : null;
      const pageCluster = isIntakeCluster(body.pageCluster) ? body.pageCluster : null;
      const pagePath = isPagePath(body.pagePath) ? body.pagePath : null;
      const role = isJobRole(body.role) ? body.role : null;
      const hub = isJobHub(body.hub) ? body.hub : null;
      const channel = body.channel === "agent" ? "agent" : "web";
      const agentName = channel === "agent" && typeof body.agentName === "string" && body.agentName.trim()
          ? body.agentName.trim().slice(0, MAX_AGENT_NAME_LENGTH)
          : null;
      const phone = normaliseIndianMobile(String(body.phone ?? ""));
      if (!phone)
          errors.add("phone");
      if (body.adult !== true)
          errors.add("adult");
      const consentAt = Date.parse(body.consent?.at ?? "");
      if (!body.consent?.version || Number.isNaN(consentAt))
          errors.add("consent");
      const rawText = typeof body.text === "string" ? body.text.trim() : "";
      const text = rawText ? maskIds(rawText.slice(0, INTAKE_LIMITS.maxTextLength)) : null;
      const attachments = (Array.isArray(body.attachments) ? body.attachments : [])
          .slice(0, INTAKE_LIMITS.maxAttachments)
          .map((a, position) => ({
          position,
          kind: String(a?.kind ?? ""),
          key: String(a?.key ?? ""),
          mime: String(a?.mime ?? ""),
          size: Math.max(0, Math.trunc(Number(a?.size) || 0)),
          name: a?.name ? String(a.name).slice(0, INTAKE_LIMITS.maxFileNameLength) : null,
      }));
      for (const a of attachments) {
          if (!(a.kind in ATTACHMENT_MIME) || !ATTACHMENT_MIME[a.kind].test(a.mime))
              errors.add("attachment type");
          else if (a.size > INTAKE_LIMITS.maxBytes[a.kind])
              errors.add("attachment size");
          if (!isAttachmentKeyFor(a.key, ref))
              errors.add("attachment key");
      }
      const form = channel === "web" ? (body.form === "quick" ? "quick" : "long") : null;
      const applicantName = typeof body.applicantName === "string" && body.applicantName.trim() ? body.applicantName.trim().slice(0, MAX_APPLICANT_NAME_LENGTH) : null;
      const answers = cleanQuickAnswers(body.answers);
      if (!text && attachments.length === 0 && !answers)
          errors.add("empty");
      if (errors.size || !source || !locale || !phone || !body.consent) {
          return { ok: false, errors: errors.size ? [...errors] : ["payload"] };
      }
      return {
          ok: true,
          value: {
              ref,
              source,
              role,
              hub,
              channel,
              agentName,
              form,
              applicantName,
              answers,
              locale,
              cluster,
              pageCluster,
              pagePath,
              phone,
              consentVersion: String(body.consent.version).slice(0, 40),
              consentedAt: new Date(consentAt).toISOString(),
              text,
              attachments,
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
  return { validateSubmission, saveSubmissionParams };
})();

// integrations/windmill/talent/lib/run-intake.ts
const { runIntake } = (() => {
  async function runIntake(authorized, body, deps) {
      if (!authorized)
          return forbidden();
      const checked = validateSubmission(body);
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
                await wmill.runScriptByPathAsync("f/talent/acknowledge", { submission_id: submissionId });
            },
        }));
    }
    catch (err) {
        console.error("intake failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown error");
        return failed();
    }
}

