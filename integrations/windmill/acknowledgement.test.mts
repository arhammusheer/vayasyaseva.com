// The Fast2SMS acknowledgement (ported from integrations/n8n/acknowledgement.test.mjs):
// acceptance, rejection, rate limits and ambiguity, and the run around them.
import assert from "node:assert/strict";
import test from "node:test";
import { runAcknowledge } from "./talent/lib/run-acknowledge.ts";
import { acknowledgementRequest, classifyAcknowledgement, sendAcknowledgement } from "./talent/lib/sms.ts";
import { CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT } from "./talent/lib/sql.ts";
import type { Fast2SmsResponse } from "./talent/lib/types.ts";

const classify = (response: Fast2SmsResponse, attempts = 1) => classifyAcknowledgement({ submission_id: "submission", attempts }, response);

test("acceptance requires both success and a provider request ID", () => {
  assert.deepEqual(classify({ statusCode: 200, body: { return: true, request_id: "request" } }), {
    submissionId: "submission", status: "accepted", requestId: "request", error: null,
  });
  assert.equal(classify({ statusCode: 200, body: { return: true } }).status, "unknown");
});

test("explicit rejection fails without repeating the request", () => {
  for (const statusCode of [400, 401]) {
    const result = classify({ statusCode, body: { return: false, status_code: 416 } });
    assert.equal(result.status, "failed");
    assert.equal(result.requestId, null);
    assert.match(result.error!, /416/);
  }
});

test("rate limits retry at most three attempts", () => {
  assert.equal(classify({ statusCode: 429 }, 1).status, "pending");
  assert.equal(classify({ statusCode: 429 }, 2).status, "pending");
  assert.equal(classify({ statusCode: 429 }, 3).status, "failed");
});

test("ambiguous responses never automatically resend or store raw errors", () => {
  for (const response of [
    { error: "timeout with sensitive request details" },
    { statusCode: 500, body: { return: false } },
    { statusCode: 200, body: { return: false } },
    { statusCode: 400, body: {} },
    {},
  ] as Fast2SmsResponse[]) {
    const result = classify(response);
    assert.equal(result.status, "unknown");
    assert.doesNotMatch(result.error!, /sensitive/);
  }
});

test("the request is the approved DLT template with the reference as its only variable", () => {
  assert.deepEqual(acknowledgementRequest({ ref: "VS-J-ABC234", phone: "+919876543210" }), {
    route: "dlt", sender_id: "VAYSPL", message: "227115", variables_values: "VS-J-ABC234",
    numbers: "9876543210", sms_details: "1", udf1: "VS-J-ABC234",
  });
});

test("a network error or unreadable body is reported without its details, and the key goes in Authorization", async () => {
  let seen: RequestInit | undefined;
  const failing = (async (_url: string, init: RequestInit) => {
    seen = init;
    throw new Error("connect ECONNREFUSED with secret detail");
  }) as unknown as typeof fetch;
  assert.deepEqual(await sendAcknowledgement({ ref: "VS-J-ABC234", phone: "+919876543210" }, "KEY", failing), { error: "request failed" });
  assert.equal((seen!.headers as Record<string, string>).authorization, "KEY");
  const html = (async () => new Response("<html>bad gateway</html>", { status: 502 })) as unknown as typeof fetch;
  const out = await sendAcknowledgement({ ref: "VS-J-ABC234", phone: "+919876543210" }, "KEY", html);
  assert.deepEqual(out, { statusCode: 502, body: undefined });
  assert.equal(classify(out).status, "unknown");
});

function fakeDb(claim: Record<string, unknown> | null) {
  const calls: { text: string; params: unknown[] }[] = [];
  const query = (async (text: string, params: unknown[] = []) => {
    calls.push({ text, params });
    if (text === CLAIM_ACKNOWLEDGEMENT || text === CLAIM_ACKNOWLEDGEMENT_FOR) return claim ? [claim] : [];
    return [];
  }) as never;
  return { calls, query };
}

test("the scheduled run flags interrupted sends, claims the oldest due one, sends once and saves the outcome", async () => {
  const db = fakeDb({ submission_id: "s1", attempts: 1, ref: "VS-J-ABC234", phone: "+919876543210" });
  let sends = 0;
  const result = await runAcknowledge(null, {
    query: db.query,
    send: async () => (sends++, { statusCode: 200, body: { return: true, request_id: "R1" } }),
  });
  assert.equal(sends, 1);
  assert.equal(result?.status, "accepted");
  assert.deepEqual(db.calls.map((c) => c.text), [RECOVER_INTERRUPTED_SENDS, CLAIM_ACKNOWLEDGEMENT, SAVE_ACKNOWLEDGEMENT_RESULT]);
  assert.deepEqual(db.calls[2].params, ["s1", "accepted", "R1", null]);
});

test("intake's run claims only its submission and skips recovery; nothing due sends nothing", async () => {
  const db = fakeDb({ submission_id: "s2", attempts: 1, ref: "VS-J-ABC235", phone: "+919876543210" });
  await runAcknowledge("s2", { query: db.query, send: async () => ({ statusCode: 429 }) });
  assert.deepEqual(db.calls.map((c) => c.text), [CLAIM_ACKNOWLEDGEMENT_FOR, SAVE_ACKNOWLEDGEMENT_RESULT]);
  assert.deepEqual(db.calls[0].params, ["s2"]);
  assert.equal(db.calls[1].params[1], "pending");

  const none = fakeDb(null);
  let sends = 0;
  assert.equal(await runAcknowledge(null, { query: none.query, send: async () => (sends++, {}) }), null);
  assert.equal(sends, 0);
});

test("claims are atomic and an interrupted send is never resent", () => {
  assert.match(CLAIM_ACKNOWLEDGEMENT, /FOR UPDATE OF a SKIP LOCKED/);
  assert.match(CLAIM_ACKNOWLEDGEMENT, /a\.attempts < 3/);
  assert.match(CLAIM_ACKNOWLEDGEMENT_FOR, /s\.id = \$1::uuid/);
  assert.match(RECOVER_INTERRUPTED_SENDS, /SET status = 'unknown'/);
  assert.match(SAVE_ACKNOWLEDGEMENT_RESULT, /AND status = 'sending'/);
});
