// Retention and erasure (ported from the retired n8n retention.test.mjs):
// the 12-month rule, the erasure order (R2, then Twenty CRM, then rows),
// stop-on-failure, and the worker-list upsert in intake.
import assert from "node:assert/strict";
import test from "node:test";
import { filesToDelete } from "./talent/lib/erasure.ts";
import { runRetention } from "./talent/lib/run-retention.ts";
import { CLAIM_ERASURE, DELETE_ROWS, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, QUEUE_EXPIRED_AND_RECOVER, SAVE_SUBMISSION } from "./talent/lib/sql.ts";
import { SCRIPTS } from "./scripts.mts";

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

test("the clock is 12 months from the person's own last contact", () => {
  assert.match(QUEUE_EXPIRED_AND_RECOVER, /last_contact_at/);
  assert.match(QUEUE_EXPIRED_AND_RECOVER, /last_confirmed_at/);
  assert.match(QUEUE_EXPIRED_AND_RECOVER, /interval '12 months'/);
  assert.doesNotMatch(QUEUE_EXPIRED_AND_RECOVER, /last_applied_at|updated_at\) </);
  assert.match(CLAIM_ERASURE, /FOR UPDATE SKIP LOCKED/);
});

test("a finished erasure keeps counts only: phone and reference are cleared", () => {
  assert.match(DELETE_ROWS, /DELETE FROM submissions WHERE phone = \$2/);
  assert.match(DELETE_ROWS, /DELETE FROM people WHERE phone = \$2/);
  assert.match(DELETE_ROWS, /phone = NULL, ref = NULL/);
  assert.match(DELETE_ROWS, /removed_crm_files = \$4::int/);
});

test("retention runs hourly", () => {
  assert.equal(SCRIPTS.find((s) => s.name === "retention")?.schedule?.cron, "0 0 * * * *");
});

test("intake upserts the worker list with each new submission", () => {
  assert.match(SAVE_SUBMISSION, /INSERT INTO people/);
  assert.match(SAVE_SUBMISSION, /FROM s\s+ON CONFLICT \(phone\) DO UPDATE/);
  assert.match(SAVE_SUBMISSION, /last_contact_at = now\(\)/);
});
