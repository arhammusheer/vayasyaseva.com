// The WhatsApp acknowledgement (talent/lib/whatsapp-ack.ts): the request, how
// Fast2SMS's answers and reports are read, and the dispatcher's sms step on a
// real Postgres (test-db.mts): WhatsApp first, the SMS when it fails or is not
// delivered in 10 minutes, no SMS when it is delivered.
import assert from "node:assert/strict";
import test from "node:test";
import { TALENT_SCHEMA, testDb } from "./test-db.mts";
import { runDispatch, type DispatchDeps } from "./talent/lib/run-dispatch.ts";
import { checkSubmission, saveSubmissionParams } from "./talent/lib/intake-payload.ts";
import { SAVE_SUBMISSION } from "./talent/lib/sql.ts";
import { ackSyncState, smsWasSent, whatsAppDeliveryStatus, whatsAppWasSent } from "./talent/lib/crm.ts";
import {
  WA_FALLBACK_MS,
  classifyWhatsApp,
  lookupWhatsAppReport,
  parseWhatsAppReport,
  sendWhatsAppAck,
  templateFor,
  whatsAppRequestUrl,
  type WhatsAppReport,
  type WhatsAppResponse,
} from "./talent/lib/whatsapp-ack.ts";
import type { Query } from "./talent/lib/db.ts";

test("the request is the approved template with the reference as its only variable", () => {
  const url = new URL(whatsAppRequestUrl({ ref: "VS-J-ABC234", phone: "+919876543210" }, 4321));
  assert.equal(url.origin + url.pathname, "https://www.fast2sms.com/dev/whatsapp");
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    message_id: "4321", phone_number_id: "1426644927192285", numbers: "9876543210", variables_values: "VS-J-ABC234", udf1: "VS-J-ABC234",
  });
});

test("templates are chosen by language, legacy codes included, and a missing one means SMS", () => {
  const templates = { "en-IN": 1, "hi-IN": 2, "hi-Latn-IN": 3 };
  assert.equal(templateFor("hi-IN", templates), 2);
  assert.equal(templateFor("hinglish", templates), 3);
  assert.equal(templateFor("en", templates), 1);
  assert.equal(templateFor(null, templates), 1);
  assert.equal(templateFor("kn-IN", templates), null);
});

test("only a request id with success is accepted; only an explicit 4xx refusal is a failure", () => {
  assert.deepEqual(classifyWhatsApp({ statusCode: 200, body: { status: true, request_id: "r1" } }), { status: "accepted", requestId: "r1", error: null });
  assert.equal(classifyWhatsApp({ statusCode: 200, body: { status: true } }).status, "unknown");
  const refused = classifyWhatsApp({ statusCode: 400, body: { status: false, message: "Invalid template" } });
  assert.equal(refused.status, "failed");
  assert.match(refused.error!, /Invalid template/);
  for (const r of [{ error: "request failed" }, { statusCode: 500, body: { status: false } }, { statusCode: 400, body: {} }, {}] as WhatsAppResponse[]) {
    assert.equal(classifyWhatsApp(r).status, "unknown");
  }
});

test("a report is the furthest event: read over delivered over sent; a failure wins", () => {
  const at = 1760950000;
  assert.deepEqual(parseWhatsAppReport({ success: true, data: [{ status: "sent", timestamp: String(at) }, { status: "delivered", timestamp: String(at + 5) }] }), {
    outcome: "delivered", detail: "delivered", at: new Date((at + 5) * 1000).toISOString(),
  });
  assert.equal(parseWhatsAppReport({ data: [{ status: "delivered" }, { status: "read" }] })?.outcome, "read");
  assert.deepEqual(parseWhatsAppReport({ data: [{ status: "failed", errors: "131026 Message undeliverable" }] }), {
    outcome: "failed", detail: "failed: 131026 Message undeliverable", at: null,
  });
  assert.equal(parseWhatsAppReport({ data: [{ status: "sent" }] })?.outcome, "pending");
  assert.equal(parseWhatsAppReport({ success: false, data: [] }), null);
  assert.equal(parseWhatsAppReport(null), null);
});

test("sends and lookups never throw, keep the key in Authorization and drop error details", async () => {
  let seen: { url: string; init: RequestInit } | undefined;
  const failing = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    throw new Error("connect ECONNREFUSED secret");
  }) as unknown as typeof fetch;
  assert.deepEqual(await sendWhatsAppAck({ ref: "VS-J-ABC234", phone: "+919876543210" }, 9, "key", failing), { error: "request failed" });
  assert.equal((seen!.init.headers as Record<string, string>).authorization, "key");
  assert.doesNotMatch(seen!.url, /key/);
  assert.equal(await lookupWhatsAppReport("r1", "key", failing), null);
  const ok = (async () => new Response(JSON.stringify({ success: true, data: [{ status: "read" }] }))) as unknown as typeof fetch;
  assert.equal((await lookupWhatsAppReport("r1", "key", ok))?.outcome, "read");
});

test("Twenty: the WhatsApp message and the SMS each get a Communication only once sent", () => {
  assert.equal(whatsAppWasSent({ wa_status: "skipped" }), false);
  assert.equal(whatsAppWasSent({ wa_status: "accepted" }), true);
  assert.equal(smsWasSent({ ack_status: "pending" }), false);
  assert.equal(smsWasSent({ ack_status: "skipped" }), false);
  assert.equal(smsWasSent({ ack_status: "accepted" }), true);
  assert.deepEqual(
    [["accepted", "read"], ["accepted", "delivered"], ["accepted", null], ["failed", null], ["unknown", null], ["sending", null]].map(([s, d]) => whatsAppDeliveryStatus(s, d)),
    ["READ", "DELIVERED", "SENT", "FAILED", "UNKNOWN", "QUEUED"],
  );
  // Rows from before WhatsApp keep the state crm_sync already holds.
  assert.equal(ackSyncState({ ack_status: "accepted", delivery_status: "delivered", wa_status: null, wa_delivery: null }), "accepted:delivered");
  assert.equal(ackSyncState({ ack_status: null, delivery_status: null, wa_status: null, wa_delivery: null }), null);
  assert.equal(ackSyncState({ ack_status: "skipped", delivery_status: null, wa_status: "accepted", wa_delivery: "read" }), "skipped:accepted:read");
});

// --- The step, on Postgres -------------------------------------------------------------

const application = (ref: string, locale = "en-IN") => ({
  ref, source: "web", locale, cluster: "haridwar", pageCluster: "haridwar", pagePath: "/jobs/haridwar", role: "packing", hub: null,
  channel: "web", agentName: null, phone: "+919876543210", adult: true, consent: { version: "2026-10-19-v8", at: "2026-10-20T09:30:00.000Z" },
  text: null, attachments: [], form: "quick", applicantName: "Ravi", answers: { work: ["packing"], area: ["market:haridwar"] },
});

async function save(query: Query, ref: string, locale?: string): Promise<string> {
  const checked = checkSubmission(application(ref, locale));
  assert.ok(checked.ok);
  const [row] = await query<{ submission_id: string }>(SAVE_SUBMISSION, saveSubmissionParams(checked.value));
  return row.submission_id;
}

interface Fixture {
  deps: DispatchDeps;
  sms: string[];
  whatsapp: string[];
  report: { value: WhatsAppReport | null };
  advance: (ms: number) => void;
}

function fixture(query: Query, send: WhatsAppResponse = { statusCode: 200, body: { status: true, request_id: "wa-1" } }): Fixture {
  const sms: string[] = [];
  const whatsapp: string[] = [];
  const report = { value: null as WhatsAppReport | null };
  let clock = Date.now();
  return {
    sms, whatsapp, report,
    advance: (ms) => void (clock += ms),
    deps: {
      query,
      sendSms: async (claim) => (sms.push(claim.ref), { statusCode: 200, body: { return: true, request_id: `sms-${claim.ref}` } }),
      whatsapp: {
        sendWhatsApp: async (claim, id) => (whatsapp.push(`${claim.ref}#${id}`), send),
        lookupWhatsApp: async () => report.value,
        templates: { "en-IN": 11, "hi-IN": 12 },
        now: () => new Date(clock),
      },
      chatwoot: { createContact: async () => ({ id: 1, source_id: "s" }), createConversation: async () => ({ id: 1 }), postMessage: async () => {}, download: async () => ({ data: new Blob(["x"]) }), attachFile: async () => true },
      crm: null,
      lookupReport: async () => null,
      log: () => {},
    },
  };
}

const state = async (query: Query, id: string) =>
  (await query<{ status: string; wa_status: string | null; wa_delivery: string | null; d: string }>(
    `SELECT a.status, a.wa_status, a.wa_delivery, d.status || '/' || d.attempts AS d
     FROM sms_acknowledgements a JOIN deliveries d ON d.submission_id = a.submission_id AND d.target = 'sms' WHERE a.submission_id = $1::uuid`,
    [id],
  ))[0];

/** Makes the sms delivery due now, as the next minute's run would find it. */
const due = (query: Query, id: string) => query(`UPDATE deliveries SET next_attempt_at = now() WHERE submission_id = $1::uuid AND target = 'sms'`, [id]);

test("delivered on WhatsApp: no SMS, and the waiting used no attempts", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-WA0001");
  const f = fixture(query);
  await runDispatch(f.deps, { submissionId: id });
  assert.deepEqual(f.whatsapp, ["VS-J-WA0001#11"]);
  assert.deepEqual(await state(query, id), { status: "pending", wa_status: "accepted", wa_delivery: null, d: "pending/0" });
  await due(query, id);
  await runDispatch(f.deps, { submissionId: id }); // no report yet
  assert.equal((await state(query, id)).d, "pending/0");
  f.report.value = { outcome: "read", detail: "read", at: null };
  await due(query, id);
  await runDispatch(f.deps, { submissionId: id });
  assert.deepEqual(await state(query, id), { status: "skipped", wa_status: "accepted", wa_delivery: "read", d: "done/1" });
  assert.deepEqual(f.sms, []);
  assert.deepEqual(f.whatsapp, ["VS-J-WA0001#11"]); // sent once
});

test("not delivered in 10 minutes: the SMS goes", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-WA0002");
  const f = fixture(query);
  await runDispatch(f.deps, { submissionId: id });
  // wa_sent_at is the database's now(); the clock moves past the fallback.
  f.advance(WA_FALLBACK_MS + 1000);
  await due(query, id);
  await runDispatch(f.deps, { submissionId: id });
  assert.deepEqual(f.sms, ["VS-J-WA0002"]);
  assert.deepEqual(await state(query, id), { status: "accepted", wa_status: "accepted", wa_delivery: "pending", d: "done/1" });
});

test("a WhatsApp failure report, a refused send or an unclear one: the SMS goes at once", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const reported = await save(query, "VS-J-WA0003");
  const f = fixture(query);
  await runDispatch(f.deps, { submissionId: reported });
  f.report.value = { outcome: "failed", detail: "failed: 131026", at: null };
  await due(query, reported);
  await runDispatch(f.deps, { submissionId: reported });
  assert.deepEqual(await state(query, reported), { status: "accepted", wa_status: "accepted", wa_delivery: "failed", d: "done/1" });

  for (const [ref, send, wa] of [
    ["VS-J-WA0004", { statusCode: 400, body: { status: false, message: "Invalid number" } }, "failed"],
    ["VS-J-WA0005", { error: "request failed" }, "unknown"],
  ] as const) {
    const id = await save(query, ref);
    const g = fixture(query, send);
    await runDispatch(g.deps, { submissionId: id });
    assert.deepEqual(g.sms, [ref]);
    assert.deepEqual(await state(query, id), { status: "accepted", wa_status: wa, wa_delivery: null, d: "done/1" });
  }
});

test("a language without an approved template, or no WhatsApp set up: SMS only", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const kannada = await save(query, "VS-J-WA0006", "kn-IN");
  const f = fixture(query);
  await runDispatch(f.deps, { submissionId: kannada });
  assert.deepEqual([f.whatsapp, f.sms], [[], ["VS-J-WA0006"]]);
  assert.deepEqual(await state(query, kannada), { status: "accepted", wa_status: "skipped", wa_delivery: null, d: "done/1" });

  const plain = await save(query, "VS-J-WA0007");
  const g = fixture(query);
  await runDispatch({ ...g.deps, whatsapp: null }, { submissionId: plain });
  assert.deepEqual(g.sms, ["VS-J-WA0007"]);
  assert.equal((await state(query, plain)).wa_status, null);
});

test("an SMS rate-limited after the fallback is not doubled if WhatsApp then delivers", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-WA0008");
  const f = fixture(query);
  await runDispatch(f.deps, { submissionId: id });
  f.advance(WA_FALLBACK_MS + 1000);
  await due(query, id);
  const limited = { ...f.deps, sendSms: async () => ({ statusCode: 429 }) };
  await runDispatch(limited, { submissionId: id });
  assert.equal((await state(query, id)).status, "pending");
  f.report.value = { outcome: "delivered", detail: "delivered", at: null };
  await due(query, id);
  await runDispatch(f.deps, { submissionId: id });
  assert.deepEqual(f.sms, []);
  assert.equal((await state(query, id)).status, "skipped");
});

test("a status change on WhatsApp reopens the CRM delivery", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-WA0009");
  await query(`UPDATE deliveries SET status = 'done' WHERE submission_id = $1::uuid AND target = 'crm'`, [id]);
  await query(`UPDATE sms_acknowledgements SET wa_status = 'accepted' WHERE submission_id = $1::uuid`, [id]);
  const [crm] = await query<{ status: string }>(`SELECT status FROM deliveries WHERE submission_id = $1::uuid AND target = 'crm'`, [id]);
  assert.equal(crm.status, "pending");
});
