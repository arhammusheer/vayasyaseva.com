// Applicants' files into Twenty (the files delivery target): the claim that
// waits for the application, the three-step upload against a fake Twenty
// (its /metadata GraphQL, the /file-upload PUT and the REST attachments),
// retries after a crash at each step, R2 404s, voice notes, Twenty's rate
// limit, and the backfill. Made-up data only.
import assert from "node:assert/strict";
import test from "node:test";
import { TALENT_SCHEMA, testDb } from "./test-db.mts";
import { runDispatch, type DispatchDeps } from "./talent/lib/run-dispatch.ts";
import { fileCategory, fileLabel } from "./talent/lib/run-files.ts";
import { checkSubmission, saveSubmissionParams } from "./talent/lib/intake-payload.ts";
import { CLAIM_DELIVERY, SAVE_SUBMISSION } from "./talent/lib/sql.ts";
import { inClusterUploadUrl, twentyFilesClient, type Twenty, type TwentyRecord } from "./talent/lib/twenty.ts";
import type { Query } from "./talent/lib/db.ts";

const BASE = "http://twenty.growth.svc.cluster.local";
const PUBLIC = "https://crm.vayasyaseva.com";
const APPLICATION_ID = "00000000-0000-4000-8000-0000000000a1";

const application = (ref: string, files: { kind: string; mime: string; ext: string; name: string }[]) => ({
  ref,
  source: "web",
  locale: "en-IN",
  cluster: "haridwar",
  pageCluster: "haridwar",
  pagePath: "/jobs/haridwar",
  role: "packing",
  hub: null,
  channel: "web",
  agentName: null,
  phone: "+919876543210",
  adult: true,
  consent: { version: "2026-10-16-v7", at: "2026-10-17T09:30:00.000Z" },
  text: "Made-up test application.",
  attachments: files.map((f, i) => ({ kind: f.kind, key: `intake/2026/10/${ref}/${i}.${f.ext}`, mime: f.mime, size: 999, name: f.name })),
  form: "long",
  applicantName: null,
  answers: null,
});

const PHOTO = { kind: "image", mime: "image/jpeg", ext: "jpg", name: "Test Person aadhaar.jpg" };
const PDF = { kind: "document", mime: "application/pdf", ext: "pdf", name: "Test Person CV.pdf" };

async function save(query: Query, ref: string, files = [PHOTO, PDF]): Promise<string> {
  const checked = checkSubmission(application(ref, files));
  assert.ok(checked.ok, JSON.stringify(checked));
  const [row] = await query<{ submission_id: string }>(SAVE_SUBMISSION, saveSubmissionParams(checked.value));
  return row.submission_id;
}

/** The CRM step's result, as if it had run: the application exists in Twenty. Every other target is settled. */
async function synced(query: Query, id: string, applicationId = APPLICATION_ID) {
  await query(`INSERT INTO crm_sync (submission_id, application_id) VALUES ($1::uuid, $2::uuid)`, [id, applicationId]);
  await query(`UPDATE deliveries SET status = 'done' WHERE submission_id = $1::uuid AND target <> 'files'`, [id]);
}

const filesRow = async (query: Query, id: string) =>
  (await query<{ status: string; attempts: number; last_error: string | null }>(`SELECT status, attempts, last_error FROM deliveries WHERE submission_id = $1::uuid AND target = 'files'`, [id]))[0];

const fileRows = (query: Query, id: string) =>
  query<{ position: number; crm_file_status: string; twenty_file_id: string | null; twenty_attachment_id: string | null; crm_file_error: string | null }>(
    `SELECT position, crm_file_status, twenty_file_id, twenty_attachment_id, crm_file_error FROM attachments WHERE submission_id = $1::uuid ORDER BY position`,
    [id],
  );

const due = (query: Query) => query(`UPDATE deliveries SET next_attempt_at = now() WHERE target = 'files'`);

type Fault = "create" | "put" | "complete" | "attach" | "after-attach" | null;

/** A fake Twenty: /metadata (objects, createFileUpload, completeFileUpload), the /file-upload PUT, and REST attachments. */
function fakeTwenty() {
  const uploads = new Map<string, { size: number; bytes: number | null; completed: boolean }>();
  const attachments: TwentyRecord[] = [];
  const log: string[] = [];
  const state = { fault: null as Fault, limited: false, forbidden: false, n: 0 };
  const take = (f: Fault) => {
    if (state.fault !== f) return false;
    state.fault = null;
    return true;
  };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  const fetchImpl = (async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.origin, BASE, `only the in-cluster Twenty is called (${url.origin})`);
    if (url.pathname === "/metadata") {
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer test-key");
      const { query, variables } = JSON.parse(String(init?.body)) as { query: string; variables: Record<string, unknown> };
      if (state.limited) return json({ errors: [{ message: "Too many requests" }] }, 429);
      if (/objects\(/.test(query)) {
        log.push("objects");
        return json({ data: { objects: { edges: [
          { node: { id: "obj-person", nameSingular: "person", fields: { edges: [{ node: { id: "f-x", name: "avatarFile", type: "FILES" } }] } } },
          { node: { id: "obj-att", nameSingular: "attachment", fields: { edges: [{ node: { id: "f-name", name: "name", type: "TEXT" } }, { node: { id: "f-file", name: "file", type: "FILES" } }] } } },
        ] } } });
      }
      if (/createFileUpload\(/.test(query)) {
        if (state.forbidden) return json({ errors: [{ message: "Entity performing the request does not have permission", extensions: { code: "FORBIDDEN" } }] });
        assert.deepEqual([variables.fileFolder, variables.fieldMetadataId], ["FilesField", "f-file"]);
        assert.match(String(variables.filename), /^VS-J-[A-Z0-9]{6}-\d+\.(jpg|pdf)$/, "the neutral label, never the applicant's file name");
        const fileId = `00000000-0000-4000-9000-${String(++state.n).padStart(12, "0")}`;
        uploads.set(fileId, { size: Number(variables.size), bytes: null, completed: false });
        log.push(`create ${variables.filename} ${variables.size}`);
        if (take("create")) return new Response("upstream reset", { status: 502 });
        return json({ data: { createFileUpload: { fileId, uploadUrl: `${PUBLIC}/file-upload/${fileId}?token=tok-${fileId.slice(-4)}`, contentType: "application/octet-stream", expiresAt: "2026-10-18T12:15:00Z" } } });
      }
      if (/completeFileUpload\(/.test(query)) {
        const fileId = String(variables.fileId);
        const u = uploads.get(fileId);
        log.push(`complete ${fileId.slice(-2)}`);
        if (take("complete")) return new Response("bad gateway", { status: 502 });
        if (!u || u.bytes === null) return json({ errors: [{ message: `File not found: ${fileId}`, extensions: { code: "NOT_FOUND" } }] });
        u.completed = true;
        return json({ data: { completeFileUpload: { id: fileId } } });
      }
      throw new Error(`unexpected metadata query ${query.slice(0, 40)}`);
    }
    if (url.pathname.startsWith("/file-upload/") && init?.method === "PUT") {
      const fileId = url.pathname.split("/").pop()!;
      assert.equal(url.searchParams.get("token"), `tok-${fileId.slice(-4)}`, "the query is kept");
      assert.equal(new Headers(init.headers).get("content-type"), "application/octet-stream");
      assert.equal(new Headers(init.headers).get("authorization"), null, "the token in the URL authorises the upload; the key is not sent");
      const bytes = (init.body as Blob).size;
      const u = uploads.get(fileId)!;
      assert.equal(bytes, u.size, "the body is exactly the declared size");
      log.push(`put ${fileId.slice(-2)} ${bytes}`);
      if (take("put")) throw new TypeError("fetch failed");
      u.bytes = bytes;
      return new Response(null, { status: 200 });
    }
    throw new Error(`unexpected ${init?.method} ${url.pathname}`);
  }) as typeof fetch;

  const crm = {
    async find(plural: string, filter: string) {
      assert.equal(plural, "attachments");
      if (state.limited) throw new Error("Twenty GET /attachments: HTTP 429 Too many requests");
      const m = filter.match(/^targetApplicationId\[eq\]:(".*")$/)!;
      log.push("list");
      return attachments.filter((a) => a.targetApplicationId === JSON.parse(m[1]));
    },
    async create(plural: string, _singular: string, body: Record<string, unknown>) {
      assert.equal(plural, "attachments");
      if (take("attach")) throw new Error("Twenty POST /attachments: HTTP 503 unavailable");
      const [{ fileId }] = body.file as { fileId: string }[];
      assert.ok(uploads.get(fileId)?.completed, "only a completed file is attached");
      const record = { id: `00000000-0000-4000-a000-${String(attachments.length + 1).padStart(12, "0")}`, ...body };
      attachments.push(record);
      log.push(`attach ${body.name}`);
      if (take("after-attach")) throw new Error("Twenty POST /attachments: socket hang up");
      return record;
    },
    update: async () => assert.fail("no updates"),
    remove: async () => assert.fail("no removes"),
  } as unknown as Twenty;

  return { crm, files: twentyFilesClient(`${BASE}/`, "test-key", fetchImpl), uploads, attachments, log, state };
}

function deps(query: Query, twenty: ReturnType<typeof fakeTwenty>, download: (key: string) => Promise<Blob | null> = async (key) => new Blob([`bytes of ${key.split("/").pop()}`])): DispatchDeps {
  return {
    query,
    sendSms: async () => assert.fail("no SMS"),
    crm: twenty.crm,
    files: { twenty: twenty.files, download },
    lookupReport: async () => null,
    log: () => {},
  };
}

test("labels are neutral (reference and place from 1) and categories follow the type", () => {
  assert.equal(fileLabel("VS-J-7K2M9Q", { position: 0, r2_key: "intake/2026/10/VS-J-7K2M9Q/0.jpg", mime: "image/jpeg" }), "VS-J-7K2M9Q-1.jpg");
  assert.equal(fileLabel("VS-J-7K2M9Q", { position: 2, r2_key: "intake/2026/10/VS-J-7K2M9Q/2", mime: "application/pdf" }), "VS-J-7K2M9Q-3.pdf");
  assert.equal(fileLabel("VS-J-7K2M9Q", { position: 1, r2_key: "x/1", mime: "application/zip" }), "VS-J-7K2M9Q-2.bin");
  assert.equal(fileCategory({ kind: "image", mime: "image/png" }), "IMAGE");
  assert.equal(fileCategory({ kind: "document", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), "TEXT_DOCUMENT");
  assert.equal(fileCategory({ kind: "document", mime: "application/zip" }), "OTHER");
});

test("the upload URL keeps its path and query on the in-cluster host; a presigned bucket URL is left alone", () => {
  assert.equal(inClusterUploadUrl(`${PUBLIC}/file-upload/abc?token=t%2B1`, `${BASE}/`), `${BASE}/file-upload/abc?token=t%2B1`);
  const presigned = "https://acct.r2.cloudflarestorage.com/vayasya-twenty/workspace/files-field/x?X-Amz-Signature=s";
  assert.equal(inClusterUploadUrl(presigned, BASE), presigned);
});

test("the claim waits for the Twenty application without spending attempts", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-WAIT01");
  assert.deepEqual(await query(CLAIM_DELIVERY, ["files", null]), []);
  await query(`INSERT INTO crm_sync (submission_id) VALUES ($1::uuid)`, [id]);
  assert.deepEqual(await query(CLAIM_DELIVERY, ["files", null]), [], "a crm_sync row without the application is not enough");
  assert.deepEqual(await filesRow(query, id), { status: "pending", attempts: 0, last_error: null });
  await query(`UPDATE crm_sync SET application_id = $2::uuid WHERE submission_id = $1::uuid`, [id, APPLICATION_ID]);
  const [claim] = await query<{ submission_id: string; attempts: number }>(CLAIM_DELIVERY, ["files", null]);
  assert.deepEqual([claim.submission_id, claim.attempts], [id, 1]);
  // Waiting for the CRM is not overdue (the CRM row is what needs a person).
  const other = await save(query, "VS-J-WAIT02");
  await query(`UPDATE deliveries SET next_attempt_at = now() - interval '2 hours' WHERE submission_id = $1::uuid`, [other]);
  const attention = await query<{ target: string }>(`SELECT target FROM deliveries_attention WHERE submission_id = $1::uuid`, [other]);
  assert.deepEqual(attention.map((r) => r.target).sort(), ["crm", "sms"]);
});

test("a photo and a PDF: uploaded in three steps on the in-cluster host and attached to the application", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-FIL001");
  await synced(query, id);
  const t = fakeTwenty();
  const result = await runDispatch(deps(query, t));
  assert.equal(result.done.files, 1);
  assert.equal((await filesRow(query, id)).status, "done");
  // The declared size is the downloaded blob's (14 bytes), not the database's 999.
  assert.deepEqual(t.log, [
    "list",
    "objects",
    "create VS-J-FIL001-1.jpg 14",
    "put 01 14",
    "complete 01",
    "attach VS-J-FIL001-1.jpg",
    "create VS-J-FIL001-2.pdf 14",
    "put 02 14",
    "complete 02",
    "attach VS-J-FIL001-2.pdf",
  ]);
  assert.deepEqual(
    t.attachments.map((a) => [a.name, a.fileCategory, a.targetApplicationId, (a.file as { label: string }[])[0].label]),
    [
      ["VS-J-FIL001-1.jpg", "IMAGE", APPLICATION_ID, "VS-J-FIL001-1.jpg"],
      ["VS-J-FIL001-2.pdf", "TEXT_DOCUMENT", APPLICATION_ID, "VS-J-FIL001-2.pdf"],
    ],
  );
  assert.doesNotMatch(JSON.stringify(t.attachments), /Test Person/, "never the applicant's file name");
  const rows = await fileRows(query, id);
  assert.deepEqual(rows.map((r) => r.crm_file_status), ["done", "done"]);
  assert.deepEqual(rows.map((r) => r.twenty_attachment_id), t.attachments.map((a) => a.id));
  // Done: the next run does nothing.
  t.log.length = 0;
  await due(query);
  await runDispatch(deps(query, t));
  assert.deepEqual(t.log, []);
});

test("no files: done without calling Twenty", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-NONE01", []);
  await synced(query, id);
  const t = fakeTwenty();
  await runDispatch(deps(query, t));
  assert.equal((await filesRow(query, id)).status, "done");
  assert.deepEqual(t.log, []);
});

test("a voice note is skipped, never copied", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-AUD001", [PHOTO]);
  await query(
    `INSERT INTO attachments (submission_id, position, kind, r2_key, mime, size_bytes) VALUES ($1::uuid, 1, 'audio', 'intake/2026/10/VS-J-AUD001/1.webm', 'audio/webm', 4000)`,
    [id],
  );
  await synced(query, id);
  const t = fakeTwenty();
  const downloaded: string[] = [];
  await runDispatch(deps(query, t, async (key) => (downloaded.push(key), new Blob(["x"]))));
  assert.deepEqual((await fileRows(query, id)).map((r) => r.crm_file_status), ["done", "skipped"]);
  assert.deepEqual(downloaded, ["intake/2026/10/VS-J-AUD001/0.jpg"]);
  assert.equal((await filesRow(query, id)).status, "done");
});

test("a file gone from R2 is missing, without spending a retry; the rest are attached", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-MIS001");
  await synced(query, id);
  const t = fakeTwenty();
  await runDispatch(deps(query, t, async (key) => (key.endsWith(".jpg") ? null : new Blob(["pdf"]))));
  assert.deepEqual((await fileRows(query, id)).map((r) => r.crm_file_status), ["missing", "done"]);
  assert.deepEqual(await filesRow(query, id), { status: "done", attempts: 1, last_error: null });
  assert.deepEqual(t.attachments.map((a) => a.name), ["VS-J-MIS001-2.pdf"]);
});

for (const [fault, uploadsAfter] of [
  ["create", 2], // createFileUpload reserved a file but the answer was lost: a fresh one
  ["put", 2], // the file id was saved, its bytes never arrived: completion fails, start that file again
  ["complete", 1], // uploaded, completion failed: the retry completes the same file
  ["attach", 1], // completed, the attachment failed: completed again (idempotent) and attached
  ["after-attach", 1], // attached, the answer was lost: found by its label, not attached twice
] as const) {
  test(`a crash at "${fault}" retries without duplicates`, async () => {
    const { query } = await testDb(TALENT_SCHEMA);
    const id = await save(query, `VS-J-CR${fault === "after-attach" ? "AA" : fault.slice(0, 2).toUpperCase()}01`, [PHOTO]);
    await synced(query, id);
    const t = fakeTwenty();
    t.state.fault = fault;
    await runDispatch(deps(query, t));
    const first = await filesRow(query, id);
    assert.deepEqual([first.status, first.attempts], ["pending", 1]);
    const [row] = await fileRows(query, id);
    assert.equal(row.crm_file_status, "pending");
    assert.ok(row.crm_file_error, "the file says why");
    if (fault !== "create") assert.ok(row.twenty_file_id, "the file id was saved as soon as Twenty answered");
    await due(query);
    await runDispatch(deps(query, t));
    assert.equal((await filesRow(query, id)).status, "done");
    assert.equal(t.uploads.size, uploadsAfter);
    assert.equal(t.attachments.length, 1, "one attachment");
    const [done] = await fileRows(query, id);
    assert.deepEqual([done.crm_file_status, done.twenty_attachment_id, done.crm_file_error], ["done", t.attachments[0].id, null]);
    assert.equal(done.twenty_file_id, (t.attachments[0].file as { fileId: string }[])[0].fileId);
  });
}

test("Twenty's 429 stops the Twenty work for the run", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const a = await save(query, "VS-J-LIM001");
  const b = await save(query, "VS-J-LIM002");
  await synced(query, a);
  await synced(query, b, "00000000-0000-4000-8000-0000000000a2");
  const t = fakeTwenty();
  t.state.limited = true;
  const result = await runDispatch(deps(query, t));
  assert.deepEqual([result.retried.files, result.done.files], [1, 0]);
  assert.equal((await filesRow(query, a)).attempts, 1);
  assert.equal((await filesRow(query, b)).attempts, 0, "the next application waits for the next run");
});

test("a key without the Upload files permission says so", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const id = await save(query, "VS-J-PRM001", [PHOTO]);
  await synced(query, id);
  const t = fakeTwenty();
  t.state.forbidden = true;
  await runDispatch(deps(query, t));
  const row = await filesRow(query, id);
  assert.equal(row.status, "pending");
  assert.match(row.last_error ?? "", /Upload files permission \(UPLOAD_FILE\)/);
});

test("the backfill queues earlier applications with files, oldest first, and re-runs add nothing", async () => {
  const { query, exec } = await testDb(TALENT_SCHEMA);
  const newer = await save(query, "VS-J-BKF002");
  const older = await save(query, "VS-J-BKF001");
  const none = await save(query, "VS-J-BKF003", []);
  const settled = await save(query, "VS-J-BKF004", [PHOTO]);
  await query(`UPDATE submissions SET created_at = '2026-09-27T10:00:00Z' WHERE id = $1::uuid`, [older]);
  await query(`UPDATE submissions SET created_at = '2026-10-01T10:00:00Z' WHERE id = $1::uuid`, [newer]);
  // Before this change: no files deliveries, except one settled by hand since.
  await query(`DELETE FROM deliveries WHERE target = 'files' AND submission_id <> $1::uuid`, [settled]);
  await query(`UPDATE deliveries SET status = 'done' WHERE target = 'files'`);
  await exec(TALENT_SCHEMA);
  await exec(TALENT_SCHEMA); // setup re-runs on every deploy
  const rows = await query<{ submission_id: string; status: string; max_attempts: number; gap: number }>(
    `SELECT submission_id, status, max_attempts,
            extract(epoch FROM next_attempt_at - min(next_attempt_at) OVER (PARTITION BY status))::int AS gap
     FROM deliveries WHERE target = 'files' ORDER BY status, next_attempt_at`,
  );
  assert.deepEqual(
    rows.map((r) => [r.submission_id, r.status, r.max_attempts, r.gap]),
    [
      [settled, "done", 8, 0],
      [older, "pending", 8, 0],
      [newer, "pending", 8, 120],
    ],
    "oldest first, two minutes apart; the settled row untouched",
  );
  assert.equal(rows.some((r) => r.submission_id === none), false, "no files, nothing to backfill");
});
