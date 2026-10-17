// Generated from integrations/windmill/talent/scripts/deliver.ts by integrations/windmill/build.mts. Edit the source, not this.

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
  const INTAKE_LOCALES = ["en-IN", "hi-IN", "hi-Latn-IN", "pa-IN"];
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
          "jalandhar:kapurthala": "Kapurthala", "jalandhar:city": "Jalandhar city", "jalandhar:phagwara-goraya": "Phagwara / Goraya",
          "jalandhar:outside": "Outside Jalandhar and Kapurthala",
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
      en: "English jobs page (en-IN)",
      hi: "हिंदी jobs page (hi-IN)",
      hinglish: "Hindi jobs page, Latin script (hi-Latn-IN)",
  };
  const AGENT_LANGUAGES = {
      "en-IN": "English",
      "hi-IN": "Hindi",
      "hi-Latn-IN": "Hindi, Latin script",
      "pa-IN": "Punjabi",
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

// integrations/windmill/talent/lib/run-deliver.ts
const { runDeliver } = (() => {
  async function runDeliver(deps) {
      await deps.query(RECOVER_STUCK_DELIVERIES);
      const [s] = await deps.query(CLAIM_SUBMISSION);
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

export async function main() {
    return withTalentDb((query) => runDeliver({ query, createContact, createConversation, postMessage, download: downloadObject, attachFile }));
}

