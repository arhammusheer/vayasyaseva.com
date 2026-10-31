// Retention and erasure (ported from the retired n8n retention.test.mjs):
// the 12-month rule, the erasure order (R2, then Twenty CRM, then rows),
// stop-on-failure, and the worker-list upsert in intake.
import assert from "node:assert/strict";
import test from "node:test";
import { filesToDelete } from "./talent/lib/erasure.ts";
import { runRetention } from "./talent/lib/run-retention.ts";
import { CLAIM_ERASURE, DELETE_ROWS, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, QUEUE_EXPIRED_AND_RECOVER } from "./talent/lib/sql.ts";
import { TALENT_SCHEMA, saveApplication, testDb } from "./test-db.mts";

const claimed = { id: "req-1", phone: "+919876543210", reason: "request" as const, files: [] as string[] };

test("every stored file is deleted once; none means none", () => {
  assert.deepEqual(filesToDelete({ files: ["a/1.jpg", "a/1.jpg", "a/2.pdf"] }), ["a/1.jpg", "a/2.pdf"]);
  assert.deepEqual(filesToDelete({ files: [] }), []);
});

function retentionDb(claim: typeof claimed | null, dispatcherRuns = 0) {
  const log: string[] = [];
  const params: unknown[][] = [];
  let busy = dispatcherRuns;
  const query = (async (text: string, p: unknown[] = []) => {
    if (text === ERASURE_DISPATCH_LOCK) return busy-- > 0 ? (log.push("lock busy"), [{ locked: false }]) : (log.push("lock"), [{ locked: true }]);
    if (text === ERASURE_DISPATCH_UNLOCK) return (log.push("unlock"), [{ unlocked: true }]);
    params.push(p);
    if (text === QUEUE_EXPIRED_AND_RECOVER) return (log.push("queue"), [{ recovered: "1", queued: "2" }]);
    if (text === CLAIM_ERASURE) return (log.push("claim"), claim ? [claim] : []);
    if (text === DELETE_ROWS) return (log.push("rows"), [{ id: claim?.id, status: "done" }]);
    throw new Error(`unexpected query ${text.slice(0, 40)}`);
  }) as never;
  return { log, params, query };
}

test("files and CRM records go before the rows, which go last", async () => {
  const db = retentionDb({ ...claimed, files: ["a/1.jpg", "a/1.jpg"] });
  const result = await runRetention({
    query: db.query,
    deleteFile: async (key) => void db.log.push(`file ${key}`),
    eraseCrmPerson: async (phone) => (db.log.push(`crm ${phone}`), { people: 1, files: 3 }),
  });
  assert.deepEqual(db.log, ["queue", "claim", "file a/1.jpg", "lock", "crm +919876543210", "rows", "unlock"]);
  assert.deepEqual(db.params.at(-1), ["req-1", "+919876543210", 2, 3]);
  assert.deepEqual(result, { recovered: 1, queued: 2, erased: { requestId: "req-1", files: 2, crmPeople: 1, crmFiles: 3 } });
});

test("erasure waits for a running dispatcher before the Twenty step, and gives up for the run if it never stops", async () => {
  const db = retentionDb({ ...claimed }, 2);
  await runRetention({
    query: db.query,
    deleteFile: async () => {},
    eraseCrmPerson: async () => (db.log.push("crm"), { people: 1, files: 0 }),
    sleep: async () => {},
  });
  assert.deepEqual(db.log, ["queue", "claim", "lock busy", "lock busy", "lock", "crm", "rows", "unlock"]);
  const stuck = retentionDb({ ...claimed }, 1000);
  await assert.rejects(
    runRetention({ query: stuck.query, deleteFile: async () => {}, eraseCrmPerson: async () => assert.fail(), sleep: async () => {} }),
    /dispatcher kept running/,
  );
  assert.equal(stuck.log.includes("rows"), false);
});

test("an R2 or Twenty failure stops the run before any row is deleted", async () => {
  for (const failing of ["file", "crm"]) {
    const db = retentionDb({ ...claimed, files: ["a/1.jpg"] });
    await assert.rejects(
      runRetention({
        query: db.query,
        deleteFile: async () => {
          if (failing === "file") throw new Error("R2 down");
        },
        eraseCrmPerson: async () => {
          if (failing === "crm") throw new Error("Twenty down");
          return { people: 0, files: 0 };
        },
      }),
    );
    assert.equal(db.log.includes("rows"), false);
    if (failing === "crm") assert.equal(db.log.at(-1), "unlock", "the dispatcher's lock is released");
  }
});

test("nothing queued erases nothing", async () => {
  const db = retentionDb(null);
  const result = await runRetention({
    query: db.query,
    deleteFile: async () => assert.fail(),
    eraseCrmPerson: async () => assert.fail(),
  });
  assert.equal(result.erased, null);
  assert.deepEqual(db.log, ["queue", "claim"]);
});

const queuedPhones = async (query: Awaited<ReturnType<typeof testDb>>["query"]) =>
  (await query<{ phone: string }>(`SELECT phone FROM erasure_requests WHERE reason = 'retention' ORDER BY phone`)).map((r) => r.phone);

test("the clock is 12 months from the person's own last contact or confirmation", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  // Every row is two years old; only contact and confirmation dates differ.
  const person = (phone: string, contact: string | null, confirmed: string | null) =>
    query(`INSERT INTO people (phone, last_contact_at, last_confirmed_at, created_at) VALUES ($1, ${contact ?? "NULL"}, ${confirmed ?? "NULL"}, now() - interval '2 years')`, [phone]);
  await person("+919800000001", "now() - interval '13 months'", null);
  await person("+919800000002", "now() - interval '13 months'", "now() - interval '1 month'");
  await person("+919800000003", "now() - interval '11 months'", null);
  await person("+919800000004", null, null);
  // An application from before the people table, with no row of its own.
  await saveApplication(query, "VS-J-OLD001", { phone: "+919800000005" });
  await query(`DELETE FROM people WHERE phone = '+919800000005'`);
  await query(`UPDATE submissions SET created_at = now() - interval '13 months' WHERE ref = 'VS-J-OLD001'`);

  const [first] = await query<{ queued: string }>(QUEUE_EXPIRED_AND_RECOVER);
  assert.equal(Number(first.queued), 3);
  assert.deepEqual(await queuedPhones(query), ["+919800000001", "+919800000004", "+919800000005"]);
  // An open request is not queued twice.
  const [again] = await query<{ queued: string }>(QUEUE_EXPIRED_AND_RECOVER);
  assert.equal(Number(again.queued), 0);
});

test("erasure claims skip locked rows", () => {
  // PGlite has one connection, so this one is checked on the text.
  assert.match(CLAIM_ERASURE, /FOR UPDATE SKIP LOCKED/);
});

test("a finished erasure removes that person only and keeps counts: phone and reference are cleared", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  await saveApplication(query, "VS-J-ERA001", { phone: "+919800000011" });
  await saveApplication(query, "VS-J-ERA002", { phone: "+919800000012" });
  const [a] = await query<{ id: string }>(`INSERT INTO erasure_requests (phone, ref, reason, status) VALUES ('+919800000011', 'VS-J-ERA001', 'request', 'running') RETURNING id`);
  const [b] = await query<{ id: string }>(`INSERT INTO erasure_requests (phone, reason, status) VALUES ('+919800000012', 'retention', 'running') RETURNING id`);

  const [done] = await query<{ id: string; status: string }>(DELETE_ROWS, [a.id, "+919800000011", 2, 1]);
  assert.deepEqual([done.id, done.status], [a.id, "done"]);
  const requests = await query<Record<string, unknown>>(`SELECT id, status, phone, ref, removed_submissions, removed_files, removed_crm_files FROM erasure_requests ORDER BY status`);
  assert.deepEqual(requests, [
    { id: a.id, status: "done", phone: null, ref: null, removed_submissions: 1, removed_files: 2, removed_crm_files: 1 },
    { id: b.id, status: "running", phone: "+919800000012", ref: null, removed_submissions: null, removed_files: null, removed_crm_files: null },
  ]);
  assert.deepEqual((await query<{ phone: string }>(`SELECT phone FROM submissions`)).map((r) => r.phone), ["+919800000012"]);
  assert.deepEqual((await query<{ phone: string }>(`SELECT phone FROM people`)).map((r) => r.phone), ["+919800000012"]);
});

test("each new application renews the person's row: one row, roles merged, last contact moved", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  await saveApplication(query, "VS-J-PPL001", { role: "packing" });
  await query(`UPDATE people SET last_contact_at = now() - interval '6 months', last_applied_at = now() - interval '6 months'`);
  await saveApplication(query, "VS-J-PPL002", { role: "warehouse" });
  const people = await query<{ roles: string[]; recent: boolean }>(`SELECT roles, last_contact_at > now() - interval '1 minute' AS recent FROM people`);
  assert.equal(people.length, 1);
  assert.deepEqual([...people[0].roles].sort(), ["packing", "warehouse"]);
  assert.equal(people[0].recent, true);
});
