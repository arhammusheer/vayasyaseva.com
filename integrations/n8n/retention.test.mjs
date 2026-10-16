// The retention workflow (privacy notice §10, PLAN §8.3) and the worker-list
// upsert in intake: runs the generated Code nodes and checks the SQL the
// generator writes, so a change to the 12-month rule or the erasure order
// shows up here.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const workflow = (name) => JSON.parse(readFileSync(new URL(`./workflows/${name}.json`, import.meta.url)));
const retention = workflow("vspl-talent-retention");
const node = (w, name) => w.nodes.find((n) => n.name === name);
const run = async (name, claimed) => {
  const items = await new AsyncFunction("$", node(retention, name).parameters.jsCode)(() => ({ first: () => ({ json: claimed }) }));
  return items.map((i) => i.json);
};
const claimed = { id: "req-1", phone: "+919876543210", reason: "request", files: [], contacts: [] };

test("every stored file is deleted once; no files still reaches the next step", async () => {
  assert.deepEqual(await run("Files to delete", { ...claimed, files: ["a/1.jpg", "a/1.jpg", "a/2.pdf"] }), [
    { requestId: "req-1", key: "a/1.jpg" },
    { requestId: "req-1", key: "a/2.pdf" },
  ]);
  assert.deepEqual(await run("Files to delete", claimed), [{ requestId: "req-1", key: null }]);
});

test("every Chatwoot contact is deleted once; none still reaches the rows", async () => {
  assert.deepEqual(await run("Contacts to delete", { ...claimed, contacts: [12, 12, 40] }), [
    { requestId: "req-1", contactId: 12 },
    { requestId: "req-1", contactId: 40 },
  ]);
  assert.deepEqual(await run("Contacts to delete", { ...claimed, contacts: [0, null] }), [{ requestId: "req-1", contactId: null }]);
});

test("files and contacts go before the rows, which go last", () => {
  const next = (from, output = 0) => retention.connections[from].main[output].map((c) => c.node);
  assert.deepEqual(next("Has file?"), ["R2: delete file"]);
  assert.deepEqual(next("Has file?", 1), ["Contacts to delete"]);
  assert.deepEqual(next("R2: delete file"), ["Contacts to delete"]);
  assert.deepEqual(next("Has contact?"), ["Chatwoot: delete contact"]);
  assert.deepEqual(next("Has contact?", 1), ["Delete rows"]);
  assert.deepEqual(next("Chatwoot: delete contact"), ["Delete rows"]);
  // R2 and Chatwoot failures stop the run before any row is deleted.
  assert.equal(node(retention, "R2: delete file").onError, undefined);
  assert.equal(node(retention, "Chatwoot: delete contact").onError, undefined);
});

test("the clock is 12 months from the person's own last contact", () => {
  const queue = node(retention, "Queue expired and recover").parameters.query;
  assert.match(queue, /last_contact_at/);
  assert.match(queue, /last_confirmed_at/);
  assert.match(queue, /interval '12 months'/);
  assert.doesNotMatch(queue, /last_applied_at|updated_at\) </);
});

test("a finished erasure keeps counts only: phone and reference are cleared", () => {
  const rows = node(retention, "Delete rows").parameters.query;
  assert.match(rows, /DELETE FROM submissions WHERE phone = \$2/);
  assert.match(rows, /DELETE FROM people WHERE phone = \$2/);
  assert.match(rows, /phone = NULL, ref = NULL/);
});

test("retention is never published by the deploy script", () => {
  const deploy = readFileSync(new URL("./deploy.mts", import.meta.url), "utf8");
  assert.match(deploy, /MANUAL_PUBLISH = new Set\(\["vspl-talent-retention"\]\)/);
});

test("intake upserts the worker list with each new submission", () => {
  const save = node(workflow("vspl-talent-intake"), "Save submission").parameters.query;
  assert.match(save, /INSERT INTO people/);
  assert.match(save, /FROM s\s+ON CONFLICT \(phone\) DO UPDATE/);
  assert.match(save, /last_contact_at = now\(\)/);
});
