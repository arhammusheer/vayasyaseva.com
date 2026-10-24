// The lead inbox, the signed envelope route and the durable Idempotency-Key
// store (roadmap 1F), on real Postgres (test-db.mts).
import assert from "node:assert/strict";
import test from "node:test";
import { signRequest } from "../../packages/contracts/src/signing.ts";
import { LEADS_SCHEMA, TALENT_SCHEMA, testDb } from "./test-db.mts";
import { setConfigForTests } from "./talent/lib/config.ts";
import { runLeadsSync, saveLead } from "./leads/lib/run-leads.ts";
import { checkLead, type Lead } from "./leads/lib/lead.ts";
import { runSubmission } from "./platform/lib/run-submission.ts";
import { runIdempotency, storeFor } from "./platform/lib/run-idempotency.ts";
import { signedPreprocessor } from "./platform/lib/signed.ts";
import type { Twenty } from "./talent/lib/twenty.ts";
import type { Query } from "./talent/lib/db.ts";

const lead: Lead = {
  caseId: "REQ-20261018-0A1B2C3D",
  receivedAt: "2026-10-18T05:00:00.000Z",
  channel: "web",
  name: "Asha Rawat",
  company: "Acme Foods",
  jobTitle: null,
  phone: "+91 98765 43210",
  email: "asha@acme.example",
  services: ["packing"],
  headcount: null,
  headcountBand: "50-99",
  site: "SIDCUL Haridwar, Uttarakhand",
  cluster: "haridwar",
  startWindow: "2-4-weeks",
  targetStartDate: null,
  requestType: "crew",
  enquiry: "Case REQ-20261018-0A1B2C3D\nWork: Packing",
  sourcePath: "/contact",
};

function twenty(fail: () => Error | null = () => null) {
  const rows: Record<string, { id: string; [k: string]: unknown }[]> = {};
  let n = 0;
  const crm = {
    async find(plural: string, filter: string) {
      const err = fail();
      if (err) throw err;
      const m = /^(\w+(?:\.\w+)?)\[eq\]:"?(.*?)"?$/.exec(filter);
      return (rows[plural] ?? []).filter((r) => !m || String(m[1].split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], r)) === m[2]);
    },
    async create(plural: string, _s: string, body: Record<string, unknown>) {
      const row = { id: `id-${++n}`, ...body };
      (rows[plural] ??= []).push(row);
      return row;
    },
    async update(plural: string, id: string, patch: Record<string, unknown>) {
      const row = rows[plural]?.find((r) => r.id === id);
      if (row) Object.assign(row, patch);
      return row ?? { id };
    },
    async remove() {
      return true;
    },
  };
  return { crm: crm as unknown as Twenty, rows };
}

const leadDeliveries = async (query: Query) =>
  (await query<{ case_id: string; status: string; attempts: number }>(`SELECT l.case_id, d.status, d.attempts FROM deliveries d JOIN leads l ON l.id = d.lead_id ORDER BY l.case_id`)).map((r) => `${r.case_id}:${r.status}/${r.attempts}`);

// --- The lead inbox ---------------------------------------------------------------

test("a lead is saved once with its CRM delivery; a replayed case ID saves nothing", async () => {
  const { query } = await testDb(LEADS_SCHEMA, LEADS_SCHEMA);
  const first = await saveLead(query, lead, "key-0000-0001");
  assert.equal(first.created, true);
  const again = await saveLead(query, lead);
  assert.deepEqual(again, { leadId: null, created: false });
  assert.deepEqual(await leadDeliveries(query), ["REQ-20261018-0A1B2C3D:pending/0"]);
  const [row] = await query<{ type: string; payload: Lead; idempotency_key: string }>(`SELECT type, payload, idempotency_key FROM leads`);
  assert.deepEqual([row.type, row.payload.name, row.idempotency_key], ["business_enquiry.v1", "Asha Rawat", "key-0000-0001"]);
  await saveLead(query, { ...lead, caseId: "REQ-20261018-C0FFEE00", requestType: "compliance-help" });
  const types = await query<{ type: string }>(`SELECT type FROM leads ORDER BY case_id`);
  assert.deepEqual(types.map((t) => t.type), ["business_enquiry.v1", "compliance_help.v1"]);
});

test("the sync files the lead in Twenty once; a Twenty outage keeps it in the inbox and retries with backoff", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  await saveLead(query, lead);
  let down = true;
  const t = twenty(() => (down ? new Error("Twenty GET /opportunities: HTTP 503") : null));
  const failed = await runLeadsSync({ query, crm: t.crm, log: () => {} });
  assert.equal(failed.retried, 1);
  assert.deepEqual(await leadDeliveries(query), ["REQ-20261018-0A1B2C3D:pending/1"]);
  down = false;
  await query(`UPDATE deliveries SET next_attempt_at = now()`);
  const ok = await runLeadsSync({ query, crm: t.crm });
  assert.equal(ok.done, 1);
  assert.equal(t.rows.opportunities.length, 1);
  assert.equal(t.rows.communications.length, 1);
  const [d] = await query<{ result: { opportunityId: string } }>(`SELECT result FROM deliveries`);
  assert.equal(d.result.opportunityId, t.rows.opportunities[0].id);
  // Nothing due any more; and replaying the lead by hand adds nothing to Twenty.
  await runLeadsSync({ query, crm: t.crm });
  assert.equal(t.rows.opportunities.length, 1);
});

test("a lead that never reaches Twenty is dead at eight attempts; a 429 ends the run", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  await saveLead(query, lead);
  await saveLead(query, { ...lead, caseId: "REQ-20261018-0A1B2C3E" });
  const limited = twenty(() => new Error("Twenty GET /opportunities: HTTP 429"));
  const r = await runLeadsSync({ query, crm: limited.crm });
  assert.equal(r.rateLimited, true);
  assert.equal(r.retried, 1, "the second lead waits for the next run");
  const broken = twenty(() => new Error("Twenty POST /people: HTTP 400"));
  for (let i = 0; i < 9; i++) {
    await query(`UPDATE deliveries SET next_attempt_at = now()`);
    await runLeadsSync({ query, crm: broken.crm, log: () => {} });
  }
  assert.deepEqual(await leadDeliveries(query), ["REQ-20261018-0A1B2C3D:dead/8", "REQ-20261018-0A1B2C3E:dead/8"]);
});

// --- The signed route -------------------------------------------------------------

test("the signature: right secret and fresh timestamp only, over the raw body", async () => {
  setConfigForTests({ submission_signing_secret: "s3cret" });
  try {
    const raw = JSON.stringify({ v: 1 });
    const now = 1_792_000_000;
    const ok = await signedPreprocessor({ headers: signRequest("s3cret", raw, now), raw_string: raw }, now);
    assert.deepEqual(ok, { authorized: true, body: { v: 1 } });
    assert.equal((await signedPreprocessor({ headers: signRequest("other", raw, now), raw_string: raw }, now)).authorized, false);
    assert.equal((await signedPreprocessor({ headers: signRequest("s3cret", raw, now - 301), raw_string: raw }, now)).authorized, false, "older than five minutes");
    assert.equal((await signedPreprocessor({ headers: signRequest("s3cret", raw, now), raw_string: `${raw} ` }, now)).authorized, false, "another body");
    assert.equal((await signedPreprocessor({ headers: signRequest("s3cret", raw, now), body: { v: 1 } }, now)).authorized, false, "no raw body: refused");
    assert.doesNotMatch(JSON.stringify(ok), /s3cret/);
  } finally {
    setConfigForTests(null);
  }
  setConfigForTests({});
  try {
    const raw = "{}";
    assert.equal((await signedPreprocessor({ headers: signRequest("", raw), raw_string: raw })).authorized, false, "no secret configured");
  } finally {
    setConfigForTests(null);
  }
});

const job = {
  ref: "VS-J-ENV001", source: "web", locale: "en-IN", cluster: "haridwar", pageCluster: "haridwar", pagePath: "/jobs/haridwar",
  role: null, hub: null, channel: "web", agentName: null, phone: "+919876543210", adult: true,
  consent: { version: "2026-10-16-v7", at: "2026-10-17T09:30:00.000Z" }, text: "Packing.", attachments: [], form: "long", applicantName: null, answers: null,
};
const envelope = (type: string, id: string, payload: unknown) => ({ v: 1, sentAt: "2026-10-18T05:00:01.000Z", idempotencyKey: null, type, id, payload });

test("the envelope route saves a job application in the talent database and a lead in the inbox", async () => {
  const talent = await testDb(TALENT_SCHEMA);
  const leads = await testDb(LEADS_SCHEMA);
  const started: string[] = [];
  const d = {
    talent: <T,>(fn: (q: Query) => Promise<T>) => fn(talent.query),
    leads: <T,>(fn: (q: Query) => Promise<T>) => fn(leads.query),
    startDispatch: async (id: string) => void started.push(`dispatch:${id}`),
    startLeadSync: async (id: string) => void started.push(`leads:${id}`),
  };
  assert.deepEqual(await runSubmission(false, {}, d), { wm_status_code: 403, result: { ok: false, error: "Forbidden" } });
  const accepted = await runSubmission(true, envelope("job_application.v1", "VS-J-ENV001", job), d);
  assert.deepEqual(accepted, { wm_status_code: 202, result: { ok: true, ref: "VS-J-ENV001" } });
  const [row] = await talent.query<{ n: number }>(`SELECT count(*)::int AS n FROM deliveries`);
  assert.equal(row.n, 3, "sms, crm, files");
  const enquiry = await runSubmission(true, envelope("business_enquiry.v1", lead.caseId, lead), d);
  assert.deepEqual(enquiry, { wm_status_code: 202, result: { ok: true, caseId: lead.caseId, created: true } });
  assert.deepEqual(started.map((s) => s.split(":")[0]), ["dispatch", "leads"]);
  const replay = await runSubmission(true, envelope("business_enquiry.v1", lead.caseId, lead), d);
  assert.equal((replay.result as { created: boolean }).created, false);
  // The id must be the payload's own reference; the payload must match its type.
  assert.equal((await runSubmission(true, envelope("job_application.v1", "VS-J-OTHER1", job), d)).wm_status_code, 400);
  assert.equal((await runSubmission(true, envelope("job_application.v1", lead.caseId, lead), d)).wm_status_code, 400);
  assert.equal((await runSubmission(true, { ...envelope("business_enquiry.v1", lead.caseId, lead), v: 2 }, d)).wm_status_code, 400);
  assert.ok(checkLead(lead).ok);
});

test("scripts: the signed routes take the raw body; one dispatcher per database; the replaced schedules are retired", async () => {
  const { SCRIPTS } = await import("./scripts.mts");
  const find = (folder: string, name: string) => SCRIPTS.find((s) => (s.folder ?? "talent") === folder && s.name === name);
  assert.deepEqual(find("platform", "submission")?.route, { path: "webhook/vspl-submission", method: "post", secretHeader: "x-vspl-signature", rawBody: true });
  assert.equal(find("platform", "idempotency")?.route?.rawBody, true);
  assert.equal(find("platform", "health")?.schedule?.cron, "0 */15 * * * *", "health reports to the hub every 15 minutes");
  assert.equal(find("platform", "health")?.notifySchedule, true, "turned on with --enable-notify only");
  assert.equal(find("talent", "dispatch")?.schedule?.cron, "0 * * * * *");
  assert.equal(find("leads", "sync_crm")?.schedule?.cron, "15 * * * * *");
  for (const name of ["acknowledge", "sync_crm", "delivery_check"]) assert.equal(find("talent", name)?.retiredSchedule, true, name);
  const scheduled = SCRIPTS.filter((s) => s.schedule && (s.folder ?? "talent") === "talent").map((s) => s.name);
  assert.deepEqual(scheduled.sort(), ["dispatch", "retention"]);
});

// --- The durable Idempotency-Key store ----------------------------------------------------

test("idempotency: keys of the jobs routes in the talent database, of the contact routes in the inbox", () => {
  assert.equal(storeFor("/api/agent/jobs"), "talent");
  assert.equal(storeFor("/api/jobs/start"), "talent");
  assert.equal(storeFor("/api/contact"), "leads");
  assert.equal(storeFor("/api/agent/contact"), "leads");
  assert.equal(storeFor("/api/umami-recorder"), null);
});

test("idempotency: new, in progress, replay, mismatch, and a failed run's carry for the retry", async () => {
  const talent = await testDb(TALENT_SCHEMA);
  const leads = await testDb(LEADS_SCHEMA);
  const db = (store: "talent" | "leads", fn: (q: Query) => Promise<unknown>) => fn(store === "talent" ? talent.query : leads.query);
  const call = async (body: Record<string, unknown>) => (await runIdempotency(true, body, db)).result as Record<string, unknown>;
  const k = { scope: "/api/agent/jobs", key: "agent-key-000001" };
  assert.deepEqual(await call({ op: "begin", ...k, fingerprint: "fp-aaaaaaaaaa" }), { state: "new" });
  assert.deepEqual(await call({ op: "begin", ...k, fingerprint: "fp-aaaaaaaaaa" }), { state: "in_progress" });
  assert.deepEqual(await call({ op: "begin", ...k, fingerprint: "fp-bbbbbbbbbb" }), { state: "mismatch" });
  await call({ op: "complete", ...k, answer: { status: 202, body: { ref: "VS-J-ABCDEF" } } });
  assert.deepEqual(await call({ op: "begin", ...k, fingerprint: "fp-aaaaaaaaaa" }), { state: "replay", answer: { status: 202, body: { ref: "VS-J-ABCDEF" } } });
  const c = { scope: "/api/contact", key: "contact-key-0001" };
  assert.deepEqual(await call({ op: "begin", ...c, fingerprint: "fp-cccccccccc" }), { state: "new" });
  await call({ op: "abandon", ...c, carry: { caseId: "REQ-20261018-0A1B2C3D" } });
  assert.deepEqual(await call({ op: "begin", ...c, fingerprint: "fp-cccccccccc" }), { state: "new", carry: { caseId: "REQ-20261018-0A1B2C3D" } });
  await call({ op: "abandon", ...c });
  assert.deepEqual(await call({ op: "begin", ...c, fingerprint: "fp-dddddddddd" }), { state: "new" }, "forgotten entirely");
  const [{ n }] = await leads.query<{ n: number }>(`SELECT count(*)::int AS n FROM idempotency_keys`);
  assert.equal(n, 1, "contact keys are in the inbox");
  assert.equal((await runIdempotency(true, { op: "begin", scope: "/api/other", key: "x".repeat(10), fingerprint: "fp-aaaaaaaaaa" }, db)).wm_status_code, 400);
  assert.equal((await runIdempotency(false, {}, db)).wm_status_code, 403);
});
