// The deliveries model (roadmap 1F) on a real Postgres (test-db.mts): the
// migration of the existing statuses, the views, and the one dispatcher's
// SMS and CRM steps with backoff, caps, dead and unknown, and the retired
// Chatwoot target's clean-up.
import assert from "node:assert/strict";
import test from "node:test";
import { LEADS_SCHEMA, TALENT_SCHEMA, saveApplication as save, testDb } from "./test-db.mts";
import { BUDGET, backoffSeconds, runDispatch, type DispatchDeps } from "./talent/lib/run-dispatch.ts";
import { runHealth } from "./platform/lib/run-health.ts";
import type { Fast2SmsResponse } from "./talent/lib/types.ts";
import type { Twenty } from "./talent/lib/twenty.ts";
import type { Query } from "./talent/lib/db.ts";
import type { EmitInput } from "./notify/lib/emit.ts";

const deliveries = async (query: Query, id: string) =>
  Object.fromEntries((await query<{ target: string; status: string; attempts: number }>(`SELECT target, status, attempts FROM deliveries WHERE submission_id = $1::uuid`, [id])).map((r) => [r.target, `${r.status}/${r.attempts}`]));

/** A Twenty that remembers what was written. */
function fakeTwenty(fail?: () => Error | null): Twenty {
  const rows: Record<string, { id: string; [k: string]: unknown }[]> = {};
  let n = 0;
  return {
    async find(plural: string) {
      const err = fail?.();
      if (err) throw err;
      return rows[plural] ?? [];
    },
    async create(plural: string, _singular: string, body: Record<string, unknown>) {
      const row = { id: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`, ...body };
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
  } as unknown as Twenty;
}

function deps(query: Query, over: Partial<DispatchDeps> = {}): DispatchDeps & { sent: string[] } {
  const sent: string[] = [];
  return {
    sent,
    query,
    sendSms: async (claim) => (sent.push(claim.ref), { statusCode: 200, body: { return: true, request_id: `req-${claim.ref}` } }),
    crm: fakeTwenty(),
    lookupReport: async () => null,
    log: () => {},
    ...over,
  };
}

test("migration: existing statuses become deliveries, the old columns stay, and the view shows them", async () => {
  const marker = "  -- Roadmap 1F:";
  const before = TALENT_SCHEMA.slice(0, TALENT_SCHEMA.indexOf(marker)) + "END\n$$;\n";
  const { query, exec } = await testDb(before);
  const sent = await save(query, "VS-J-OLD001");
  const failed = await save(query, "VS-J-OLD002");
  await query(`UPDATE sms_acknowledgements SET status = 'accepted', accepted_at = now() WHERE submission_id = $1::uuid`, [sent]);
  await query(`INSERT INTO crm_sync (submission_id, ack_status) VALUES ($1::uuid, 'accepted')`, [sent]);
  await query(`UPDATE sms_acknowledgements SET status = 'unknown' WHERE submission_id = $1::uuid`, [failed]);
  await exec(TALENT_SCHEMA);
  await exec(TALENT_SCHEMA); // setup re-runs on every deploy
  assert.deepEqual(await deliveries(query, sent), { sms: "done/0", crm: "done/0" });
  assert.deepEqual(await deliveries(query, failed), { sms: "unknown/0", crm: "pending/0" });
  const [view] = await query<{ sms_status: string; crm_synced: boolean }>(`SELECT * FROM delivery_status WHERE ref = 'VS-J-OLD002'`);
  assert.deepEqual([view.sms_status, view.crm_synced], ["unknown", false]);
  // The old columns are still there and still read.
  const [old] = await query<{ status: string }>(`SELECT status FROM sms_acknowledgements WHERE submission_id = $1::uuid`, [sent]);
  assert.equal(old.status, "accepted");
});

test("Chatwoot's retirement: setup removes its deliveries and the submissions columns only it used", async () => {
  const { query, exec } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-CWOLD1");
  // A database from before 24 Oct 2026: the chatwoot target and its columns.
  await query(`ALTER TABLE submissions ADD COLUMN status text DEFAULT 'delivered', ADD COLUMN chatwoot_contact_id bigint`);
  await query(`ALTER TABLE deliveries DROP CONSTRAINT deliveries_target_check`);
  await query(`INSERT INTO deliveries (submission_id, target, status, max_attempts) VALUES ($1::uuid, 'chatwoot', 'done', 3)`, [id]);
  await exec(TALENT_SCHEMA);
  await exec(TALENT_SCHEMA);
  assert.deepEqual(await deliveries(query, id), { sms: "pending/0", crm: "pending/0", files: "pending/0" });
  const columns = (await query<{ column_name: string }>(`SELECT column_name FROM information_schema.columns WHERE table_name = 'submissions'`)).map((r) => r.column_name);
  for (const gone of ["status", "attempts", "last_error", "chatwoot_contact_id", "chatwoot_conversation_id"]) assert.ok(!columns.includes(gone), gone);
  await assert.rejects(query(`INSERT INTO deliveries (submission_id, target, max_attempts) VALUES ($1::uuid, 'chatwoot', 3)`, [id]));
});

test("a new application gets its three deliveries; one dispatcher run does them all", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-NEW001");
  assert.deepEqual(await deliveries(query, id), { sms: "pending/0", crm: "pending/0", files: "pending/0" });
  const d = deps(query, { files: { twenty: {} as never, download: async () => assert.fail("no files to download") } });
  const result = await runDispatch(d);
  assert.deepEqual(result.done, { sms: 1, crm: 1, files: 1 }, "no files: done once the application exists");
  assert.deepEqual(await deliveries(query, id), { sms: "done/1", crm: "done/1", files: "done/1" });
  const [old] = await query<{ sms: string }>(`SELECT a.status AS sms FROM sms_acknowledgements a`);
  assert.equal(old.sms, "accepted", "the SMS step still writes its own status");
  // Nothing left: a second run sends nothing.
  await runDispatch(d);
  assert.deepEqual(d.sent, ["VS-J-NEW001"]);
});

test("intake's targeted run sends only that application's SMS", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const a = await save(query, "VS-J-TGT001");
  const b = await save(query, "VS-J-TGT002");
  const d = deps(query);
  await runDispatch(d, { submissionId: b });
  assert.deepEqual(d.sent, ["VS-J-TGT002"]);
  assert.equal((await deliveries(query, a)).sms, "pending/0");
  assert.equal((await deliveries(query, b)).crm, "pending/0");
});

test("SMS: a rate limit retries with backoff and is dead at three; an ambiguous send is unknown and never resent", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-SMS001");
  const limited = deps(query, { sendSms: async () => ({ statusCode: 429 }) as Fast2SmsResponse });
  await runDispatch(limited, { submissionId: id });
  assert.equal((await deliveries(query, id)).sms, "pending/1");
  const [wait] = await query<{ seconds: number }>(`SELECT extract(epoch FROM next_attempt_at - now())::int AS seconds FROM deliveries WHERE submission_id = $1::uuid AND target = 'sms'`, [id]);
  assert.ok(wait.seconds > 50 && wait.seconds <= 60, `waits a minute (${wait.seconds}s)`);
  for (let i = 0; i < 2; i++) {
    await query(`UPDATE deliveries SET next_attempt_at = now() WHERE target = 'sms'`);
    await query(`UPDATE sms_acknowledgements SET next_attempt_at = now()`);
    await runDispatch(limited, { submissionId: id });
  }
  assert.equal((await deliveries(query, id)).sms, "dead/3");

  const other = await save(query, "VS-J-SMS002");
  const ambiguous = deps(query, { sendSms: async () => ({ error: "timeout" }) });
  await runDispatch(ambiguous, { submissionId: other });
  assert.equal((await deliveries(query, other)).sms, "unknown/1");
  await query(`UPDATE deliveries SET next_attempt_at = now() - interval '1 hour'`);
  const again = deps(query);
  await runDispatch(again, { submissionId: other });
  assert.deepEqual(again.sent, [], "unknown is never sent again");
  assert.equal(backoffSeconds(1), 60);
  assert.equal(backoffSeconds(3), 240);
  assert.equal(backoffSeconds(20), 3600);
});

test("CRM: Twenty's rate limit stops the run; a changed acknowledgement reopens the delivery", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-CRM001");
  let limited = true;
  const d = deps(query, { crm: fakeTwenty(() => (limited ? new Error("Twenty GET /people: HTTP 429") : null)) });
  await runDispatch(d);
  assert.equal((await deliveries(query, id)).crm, "pending/1");
  limited = false;
  await query(`UPDATE deliveries SET next_attempt_at = now()`);
  await runDispatch(d);
  assert.equal((await deliveries(query, id)).crm, "done/2");
  // Fast2SMS reports delivery: Twenty must show it, so the CRM delivery runs again.
  await query(`UPDATE sms_acknowledgements SET delivery_status = 'delivered' WHERE submission_id = $1::uuid`, [id]);
  assert.equal((await deliveries(query, id)).crm, "pending/0");
  await runDispatch(d);
  assert.equal((await deliveries(query, id)).crm, "done/1");
  assert.equal(BUDGET.crm, 10);
});

test("CRM: application.received is raised once the Twenty person exists, again on a retry, not on an acknowledgement update", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-NTF001");
  const raised: EmitInput[] = [];
  const notify = async (e: EmitInput) => (raised.push(e), true);
  // Twenty writes the person and application, then fails before crm_sync is recorded: the retry raises it again.
  let creates = 0;
  const base = fakeTwenty();
  const flaky = { ...base, create: async (p: string, s: string, b: Record<string, unknown>) => (p === "communications" && ++creates === 1 ? Promise.reject(new Error("Twenty POST /communications: HTTP 503")) : base.create(p, s, b)) } as Twenty;
  const d = deps(query, { crm: flaky, notify });
  await runDispatch(d);
  assert.equal((await deliveries(query, id)).crm, "pending/1");
  await query(`UPDATE deliveries SET next_attempt_at = now()`);
  await runDispatch(d);
  assert.equal((await deliveries(query, id)).crm, "done/2");
  assert.deepEqual(raised.map((e) => e.dedupeKey), ["application:VS-J-NTF001", "application:VS-J-NTF001"], "the hub's dedupeKey makes it one push");
  assert.equal(raised[0].pii?.phone, "+919876543210");
  assert.match(raised[0].link!.url, /^https:\/\/crm\.vayasyaseva\.com\/object\/person\/[0-9a-f-]+$/);
  assert.doesNotMatch(`${raised[0].title} ${raised[0].summary}`, /Two years packing|9876543210/, "never the applicant's text or number");
  // The acknowledgement's delivery report reruns the CRM step: no new notification.
  await query(`UPDATE sms_acknowledgements SET delivery_status = 'delivered' WHERE submission_id = $1::uuid`, [id]);
  await runDispatch(d);
  assert.equal(raised.length, 2);
});

test("a run interrupted for 15 minutes: SMS unknown, the rest back to pending", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-STK001");
  await query(`UPDATE deliveries SET status = 'running', attempts = 1, updated_at = now() - interval '20 minutes' WHERE submission_id = $1::uuid AND target IN ('sms', 'crm')`, [id]);
  const d = deps(query, { crm: null });
  const result = await runDispatch(d);
  assert.equal(result.recovered, 2);
  const now = await deliveries(query, id);
  assert.equal(now.sms, "unknown/1");
  assert.equal(now.crm, "pending/2", "picked up again, and waits for Twenty");
});

test("another dispatcher running: this run does nothing", async () => {
  const query = (async (text: string) => (/pg_try_advisory_lock/.test(text) ? [{ locked: false }] : assert.fail(`ran ${text.slice(0, 40)}`))) as Query;
  const result = await runDispatch(deps(query));
  assert.equal(result.skipped, "another dispatcher is running");
});

test("health counts dead, unknown and stuck work, and says when a database could not be read", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-HLT001");
  await query(`UPDATE deliveries SET status = 'dead' WHERE submission_id = $1::uuid AND target = 'crm'`, [id]);
  await query(`UPDATE deliveries SET status = 'unknown' WHERE submission_id = $1::uuid AND target = 'sms'`, [id]);
  const health = await runHealth({
    talent: (fn) => fn(query),
    leads: async () => {
      throw new Error("connection refused");
    },
  });
  assert.equal(health.ok, false);
  assert.deepEqual(health.talent?.dead, { crm: 1 });
  assert.deepEqual(health.talent?.unknown, { sms: 1 });
  assert.equal(health.talent?.erasureFailed, 0);
  assert.deepEqual(health.errors, ["leads: connection refused"]);
  const clean = await testDb(TALENT_SCHEMA);
  const leads = await testDb(LEADS_SCHEMA);
  const ok = await runHealth({ talent: (fn) => fn(clean.query), leads: (fn) => fn(leads.query) });
  assert.deepEqual([ok.ok, ok.errors], [true, []]);
});
