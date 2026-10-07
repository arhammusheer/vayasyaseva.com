import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = JSON.parse(readFileSync(new URL("./workflows/vspl-talent-acknowledge.json", import.meta.url)));
const source = workflow.nodes.find((n) => n.name === "Acknowledgement result").parameters.jsCode;
const run = new (Object.getPrototypeOf(async function () {}).constructor)("$", "$input", source);
async function classify(response, attempts = 1) {
  const [item] = await run(
    () => ({ first: () => ({ json: { submission_id: "submission", attempts } }) }),
    { first: () => ({ json: response }) },
  );
  return item.json;
}

test("acceptance requires both success and a provider request ID", async () => {
  assert.deepEqual(await classify({ statusCode: 200, body: { return: true, request_id: "request" } }), {
    submissionId: "submission", status: "accepted", requestId: "request", error: null,
  });
  assert.equal((await classify({ statusCode: 200, body: { return: true } })).status, "unknown");
});

test("explicit rejection fails without repeating the request", async () => {
  for (const statusCode of [400, 401]) {
    const result = await classify({ statusCode, body: { return: false, status_code: 416 } });
    assert.equal(result.status, "failed");
    assert.equal(result.requestId, null);
    assert.match(result.error, /416/);
  }
});

test("rate limits retry at most three attempts", async () => {
  assert.equal((await classify({ statusCode: 429 }, 1)).status, "pending");
  assert.equal((await classify({ statusCode: 429 }, 2)).status, "pending");
  assert.equal((await classify({ statusCode: 429 }, 3)).status, "failed");
});

test("ambiguous responses never automatically resend or store raw errors", async () => {
  for (const response of [
    { error: "timeout with sensitive request details" },
    { statusCode: 500, body: { return: false } },
    { statusCode: 200, body: { return: false } },
    { statusCode: 400, body: {} },
    {},
  ]) {
    const result = await classify(response);
    assert.equal(result.status, "unknown");
    assert.doesNotMatch(result.error, /sensitive/);
  }
});

test("native HTTP retries are disabled and API key stays in the credential", () => {
  const send = workflow.nodes.find((n) => n.name === "Fast2SMS: acknowledgement");
  assert.equal(send.retryOnFail, undefined);
  assert.equal(send.credentials.httpHeaderAuth.name, "fast2sms-vspl");
  assert.equal(send.parameters.authentication, "genericCredentialType");
});
