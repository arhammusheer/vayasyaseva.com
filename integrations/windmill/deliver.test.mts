// Delivery to Chatwoot: the order of steps, the recorded ids, files after
// the note, and a failed attachment that does not stop the others.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { generated } from "./build.mts";
import { runDeliver } from "./talent/lib/run-deliver.ts";
import { CLAIM_SUBMISSION, MARK_DELIVERED, RECORD_CONVERSATION, RECOVER_STUCK_DELIVERIES } from "./talent/lib/sql.ts";

const submission = {
  id: "s1", ref: "VS-J-ABC234", source: "web", locale: "en-IN", channel: "web", form: "long", applicantName: null,
  cluster: "haridwar", pageCluster: null, pagePath: null, phone: "+919876543210", role: "packer", hub: null,
  agentName: null, answers: null, text: "Packing work",
  attachments: [
    { id: "a1", position: 0, kind: "image", key: "talent/VS-J-ABC234/0.jpg", mime: "image/jpeg", name: "me.jpg", transcript: null, transcriptStatus: "none" },
    { id: "a2", position: 1, kind: "document", key: "talent/VS-J-ABC234/1.pdf", mime: "application/pdf", name: null, transcript: null, transcriptStatus: "none" },
  ],
};

test("one submission becomes a contact, a conversation, a note, then each file", async () => {
  const log: string[] = [];
  const params: unknown[][] = [];
  const result = await runDeliver({
    query: (async (text: string, p: unknown[] = []) => {
      params.push(p);
      log.push(text === RECOVER_STUCK_DELIVERIES ? "recover" : text === CLAIM_SUBMISSION ? "claim" : text === RECORD_CONVERSATION ? "record" : text === MARK_DELIVERED ? "delivered" : "?");
      return text === CLAIM_SUBMISSION ? [submission] : [];
    }) as never,
    createContact: async (phone, name) => (log.push(`contact ${phone} ${name}`), { id: 7, source_id: "src" }),
    createConversation: async (_s, attrs) => (log.push(`conversation ${JSON.stringify(attrs)}`), { id: 99 }),
    postMessage: async (_s, id, content) => void log.push(`note ${id} ${content.split("\n")[0]}`),
    download: async (key) => (log.push(`download ${key}`), { data: new Blob(["x"]) }),
    attachFile: async (_s, _c, label, _f, name) => (log.push(`attach ${label} ${name}`), !label.startsWith("File 2")),
  });
  assert.deepEqual(log, [
    "recover",
    "claim",
    "contact +919876543210 Job seeker VS-J-ABC234",
    'conversation {"job_cluster":"haridwar","job_role":"packer","job_form":"long"}',
    "record",
    "note 99 **Job seeker VS-J-ABC234** · English jobs page (en-IN) · +919876543210",
    "delivered",
    "download talent/VS-J-ABC234/0.jpg",
    "attach File 1: photo (me.jpg) 0.jpg",
    "download talent/VS-J-ABC234/1.pdf",
    "attach File 2: document 1.pdf",
  ]);
  assert.deepEqual(params[2], ["s1", 7, 99]);
  assert.deepEqual(result, { ref: "VS-J-ABC234", conversationId: 99, files: 2, filesAttached: 1 });
});

test("nothing to deliver does nothing after recovery", async () => {
  const log: string[] = [];
  const out = await runDeliver({
    query: (async (text: string) => (log.push(text === RECOVER_STUCK_DELIVERIES ? "recover" : "claim"), [])) as never,
    createContact: async () => assert.fail(),
    createConversation: async () => assert.fail(),
    postMessage: async () => assert.fail(),
    download: async () => assert.fail(),
    attachFile: async () => assert.fail(),
  });
  assert.equal(out, null);
  assert.deepEqual(log, ["recover", "claim"]);
});

test("a stuck delivery goes back after 15 minutes and fails after three attempts", () => {
  assert.match(RECOVER_STUCK_DELIVERIES, /attempts >= 3 THEN 'failed'/);
  assert.match(RECOVER_STUCK_DELIVERIES, /interval '15 minutes'/);
  assert.match(CLAIM_SUBMISSION, /FOR UPDATE SKIP LOCKED/);
});

test("the generated Windmill scripts are up to date and self-contained", () => {
  for (const [file, content] of Object.entries(generated())) {
    assert.equal(readFileSync(new URL(file, import.meta.url), "utf8"), content, `${file} is stale: run pnpm windmill:build`);
    if (file.endsWith(".ts")) {
      assert.doesNotMatch(content, /from\s+"\.{1,2}\//, `${file} still has a relative import`);
      assert.match(content, /^export async function main\(/m);
    }
  }
});

test("the schema adds crm_sync to the talent tables", () => {
  const schema = readFileSync(new URL("talent/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /CREATE TABLE IF NOT EXISTS submissions/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS crm_sync/);
});
