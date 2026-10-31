// SMS delivery reports: the Fast2SMS webhook (f/talent/delivery_report),
// the DLR lookup for reports that never came (f/talent/delivery_check),
// and the webhook registration's body.
import assert from "node:assert/strict";
import test from "node:test";
import { setConfigForTests } from "./talent/lib/config.ts";
import { lookupReport, outcomeOf, parseReport, runDeliveryCheck, unixToIso } from "./talent/lib/delivery.ts";
import { DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, SAVE_DELIVERY_REPORT } from "./talent/lib/sql.ts";
import { main, preprocessor } from "./talent/scripts/delivery_report.ts";
import { SCRIPTS } from "./scripts.mts";
import { TALENT_SCHEMA, saveApplication, testDb } from "./test-db.mts";

// The example of docs.fast2sms.com "SMS Webhook Overview".
const REPORT = {
  request_id: "Sabcdef12345678",
  route: "dlt",
  sender_id: "VAYSPL",
  mobile: "9999999999",
  status: "delivered",
  status_description: "Delivered successfully",
  udf1: "VS-J-ABC234",
  delivery_timestamp: 1718712002,
  failure_reason: "Delivered successfully",
  webhook_type: "status_update",
};

test("outcomes: delivered, the failure words, and anything else pending", () => {
  assert.deepEqual(["Delivered", "delivered"].map(outcomeOf), ["delivered", "delivered"]);
  assert.deepEqual(["Failed", "Undelivered", "Rejected", "Expired", "DND", "Blocked"].map(outcomeOf), Array(6).fill("failed"));
  assert.deepEqual(["Sent", "Pending", "Submitted", ""].map(outcomeOf), Array(4).fill("pending"));
});

test("a webhook report parses; the time is the delivery timestamp", () => {
  assert.deepEqual(parseReport(REPORT), {
    requestId: "Sabcdef12345678",
    outcome: "delivered",
    detail: "delivered: Delivered successfully",
    deliveredAt: new Date(1718712002 * 1000).toISOString(),
  });
  // The registered template sends every value as a string.
  assert.equal(parseReport({ ...REPORT, delivery_timestamp: "1718712002" })?.deliveredAt, new Date(1718712002 * 1000).toISOString());
  assert.equal(unixToIso(""), null);
  assert.equal(parseReport({ ...REPORT, status: "Failed", status_description: "Failed" })?.detail, "Failed");
  assert.equal(parseReport({ ...REPORT, status: "Failed" })?.deliveredAt, null);
});

test("reports without a request id or status, or with an odd id, are refused", () => {
  assert.equal(parseReport(null), null);
  assert.equal(parseReport({ ...REPORT, status: "" }), null);
  assert.equal(parseReport({ ...REPORT, request_id: "x'; drop" }), null);
  assert.equal(parseReport({ ...REPORT, request_id: "@{{request_id}}" }), null);
});

test("preprocessor: the secret is checked and only the report's own fields reach main (no phone)", async () => {
  setConfigForTests({ fast2sms_dlr_secret: "s3cret" });
  try {
    const ok = await preprocessor({ headers: { "X-Vspl-Dlr-Secret": "s3cret" }, body: REPORT });
    assert.equal(ok.authorized, true);
    assert.deepEqual(Object.keys(ok.body!).sort(), ["delivery_timestamp", "failure_reason", "request_id", "status", "status_description"]);
    assert.ok(!JSON.stringify(ok).includes("9999999999"));
    const bad = await preprocessor({ headers: { "x-vspl-dlr-secret": "nope" }, body: REPORT });
    assert.deepEqual(bad, { authorized: false, body: null });
  } finally {
    setConfigForTests(null);
  }
});

test("main: a wrong secret is 403 and a bad report 400, before any database work", async () => {
  assert.equal((await main(false, REPORT)).wm_status_code, 403);
  assert.equal((await main(true, { status: "delivered" })).wm_status_code, 400);
});

test("the save query never turns delivered back and only touches accepted acknowledgements", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const accepted = await saveApplication(query, "VS-J-DLR001", { phone: "+919800000021" });
  const pending = await saveApplication(query, "VS-J-DLR002", { phone: "+919800000022" });
  await query(`UPDATE sms_acknowledgements SET status = 'accepted', request_id = 'R1' WHERE submission_id = $1::uuid`, [accepted]);
  await query(`UPDATE sms_acknowledgements SET request_id = 'R2' WHERE submission_id = $1::uuid`, [pending]);
  const report = (requestId: string, status: string) => query(SAVE_DELIVERY_REPORT, [requestId, status, status, null]);
  const statusOf = async (id: string) =>
    (await query<{ delivery_status: string | null }>(`SELECT delivery_status FROM sms_acknowledgements WHERE submission_id = $1::uuid`, [id]))[0].delivery_status;

  assert.equal((await report("R1", "delivered")).length, 1);
  assert.equal((await report("R1", "failed")).length, 0);
  assert.equal(await statusOf(accepted), "delivered");
  assert.equal((await report("R2", "delivered")).length, 0);
  assert.equal(await statusOf(pending), null);
});

function checkDb(due: { submission_id: string; request_id: string }[], matches = new Set<string>()) {
  const saved: unknown[][] = [];
  const marked: unknown[] = [];
  const query = (async (text: string, p: unknown[] = []) => {
    if (text === DELIVERY_CHECK_DUE) return due;
    if (text === SAVE_DELIVERY_REPORT) return (saved.push(p), matches.has(p[0] as string) ? [{ submission_id: "x" }] : []);
    if (text === MARK_DELIVERY_CHECKED) return (marked.push(p[0]), []);
    throw new Error(`unexpected query ${text.slice(0, 40)}`);
  }) as never;
  return { query, saved, marked };
}

test("delivery_check: found reports are saved; nothing found is marked checked", async () => {
  const db = checkDb(
    [
      { submission_id: "s1", request_id: "R1abc" },
      { submission_id: "s2", request_id: "R2abc" },
      { submission_id: "s3", request_id: "R3abc" },
    ],
    new Set(["R1abc", "R2abc"]),
  );
  const reports: Record<string, string> = { R1abc: "Delivered", R2abc: "Undelivered" };
  const result = await runDeliveryCheck({
    query: db.query,
    lookup: async (id) => (reports[id] ? parseReport({ status: reports[id] }, id) : null),
  });
  assert.deepEqual(result, { checked: 3, delivered: 1, failed: 1, pending: 1 });
  assert.deepEqual(db.marked, ["s3"]);
});

test("lookupReport reads the DLR API's answer and never throws", async () => {
  const answer = {
    success: true,
    data: [{ request_id: "SCW0cx", route: "dlt", delivery_status: [{ status: "Delivered", status_description: "Delivered successfully", delivery_timestamp: 1792214148 }] }],
  };
  const fake = (async () => new Response(JSON.stringify(answer))) as typeof fetch;
  assert.equal((await lookupReport("SCW0cx", "k", fake))?.outcome, "delivered");
  assert.equal(await lookupReport("other", "k", fake), null);
  assert.equal(await lookupReport("SCW0cx", "k", (async () => { throw new Error("down"); }) as typeof fetch), null);
  assert.equal(await lookupReport("SCW0cx", "k", (async () => new Response("no", { status: 500 })) as typeof fetch), null);
});

test("scripts: the report route is registered; the 15-minute check moved into the dispatcher", () => {
  const report = SCRIPTS.find((s) => s.name === "delivery_report")!;
  assert.deepEqual(report.route, { path: "webhook/fast2sms-dlr", method: "post", secretHeader: "x-vspl-dlr-secret" });
  // The 15-minute check now runs inside the dispatcher (f/talent/dispatch, minute % 15 === 0).
  assert.equal(SCRIPTS.find((s) => s.name === "delivery_check")?.retiredSchedule, true);
});

test("preprocessor: the secret may come as ?key= instead of the header", async () => {
  setConfigForTests({ fast2sms_dlr_secret: "s3cret" });
  try {
    assert.equal((await preprocessor({ query: { key: "s3cret" }, body: REPORT })).authorized, true);
    assert.equal((await preprocessor({ query: { key: "s3cre" }, body: REPORT })).authorized, false);
  } finally {
    setConfigForTests(null);
  }
});
