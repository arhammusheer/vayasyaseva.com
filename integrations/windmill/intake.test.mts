// Intake and the staff note (ported from the retired n8n intake.test.mjs):
// old and new payload shapes, the secret check, the HTTP answers, and the
// SMS acknowledgement started after saving.
import assert from "node:assert/strict";
import test from "node:test";
import { setConfigForTests } from "./talent/lib/config.ts";
import { runIntake } from "./talent/lib/run-intake.ts";
import { SAVE_SUBMISSION } from "./talent/lib/sql.ts";
import { checkSubmission, saveSubmissionParams } from "./talent/lib/intake-payload.ts";
import { preprocessor } from "./talent/scripts/intake.ts";
import { secretMatches } from "./talent/lib/secret.ts";

function validate(body: unknown) {
  const out = checkSubmission(body);
  if (!out.ok) throw new Error(`Invalid submission: ${out.errors.join(", ")}`);
  return out.value;
}

// What the site sends: job_application.v1 canonical (packages/contracts).
const base = {
  ref: "VS-J-TEST99",
  source: "web",
  locale: "en-IN",
  cluster: null,
  pageCluster: null,
  pagePath: null,
  role: null,
  hub: null,
  channel: "web",
  agentName: null,
  phone: "+919876543210",
  adult: true,
  consent: { version: "2026-10-02", at: "2026-10-16T10:00:00Z" },
  text: null,
  attachments: [],
  form: "quick",
  applicantName: "Ravi",
  answers: { work: ["packing"], area: ["sidcul-bahadrabad"] },
};

test("consent versions are stored as given: the earlier dates and the website's v7", () => {
  for (const version of ["2026-10-02", "2026-10-16", "2026-10-16-v7"]) {
    const out = validate({ ...base, source: "web", locale: "en-IN", consent: { version, at: "2026-10-16T10:00:00Z" } });
    assert.equal(out.consentVersion, version);
  }
  assert.throws(() => validate({ ...base, source: "web", locale: "en-IN", consent: { at: "2026-10-16T10:00:00Z" } }), /consent/);
});

test("legacy page sources still pass and keep their short locale", () => {
  const out = validate({ ...base, source: "web_hinglish", locale: null });
  assert.equal(out.source, "web_hinglish");
  assert.equal(out.locale, "hinglish");
  assert.equal(out.cluster, null);
  assert.equal(out.pageCluster, null);
  assert.equal(out.pagePath, null);
});

test("web submissions carry a BCP 47 locale, cluster and page path", () => {
  const out = validate({ ...base, source: "web", locale: "hi-Latn-IN", cluster: "haridwar", pageCluster: "haridwar", pagePath: "/jobs/haridwar" });
  assert.equal(out.source, "web");
  assert.equal(out.locale, "hi-Latn-IN");
  assert.equal(out.cluster, "haridwar");
  assert.equal(out.pageCluster, "haridwar");
  assert.equal(out.pagePath, "/jobs/haridwar");
});

test("a web submission without a valid locale is rejected", () => {
  assert.throws(() => validate({ ...base, source: "web", locale: null }), /locale/);
  assert.throws(() => validate({ ...base, source: "web", locale: "en" }), /locale/);
  assert.throws(() => validate({ ...base, source: "web_xx" }), /source/);
});

test("page fields outside the contract are refused (the site sends only known ones)", () => {
  assert.throws(() => validate({ ...base, cluster: "mumbai" }), /cluster/);
  assert.throws(() => validate({ ...base, pageCluster: "Haridwar" }), /pageCluster/);
  assert.throws(() => validate({ ...base, pagePath: "/en-in/jobs?x=1" }), /pagePath/);
  assert.throws(() => validate({ ...base, phone: "9876543210" }), /phone/);
});

test("a file under another reference is refused", () => {
  const file = { kind: "image", key: "intake/2026/10/VS-J-OTHER1/0.jpg", mime: "image/jpeg", size: 10, name: null };
  assert.throws(() => validate({ ...base, attachments: [file] }), /attachments/);
  assert.equal(validate({ ...base, attachments: [{ ...file, key: "intake/2026/10/VS-J-TEST99/0.jpg" }] }).attachments[0].position, 0);
});

test("identity numbers in the message are masked before saving", () => {
  const out = validate({ ...base, source: "web", locale: "en-IN", answers: null, text: "Aadhaar 2345 6789 0123, PAN ABCDE1234F" });
  assert.equal(out.text, "Aadhaar XXXX XXXX 0123, PAN [PAN removed]");
});

test("the save parameters keep n8n's $1..$18 order", () => {
  const params = saveSubmissionParams(validate({ ...base, source: "web", locale: "en-IN", cluster: "haridwar" }));
  assert.equal(params.length, 18);
  assert.equal(params[0], "VS-J-TEST99");
  assert.equal(params[3], "+919876543210");
  assert.equal(params[7], "[]");
  assert.equal(params[14], JSON.stringify(base.answers));
  assert.equal(params[15], "haridwar");
});

function intakeDeps(submissionId: string | null, startFails = false) {
  const started: string[] = [];
  const queries: string[] = [];
  return {
    started,
    queries,
    deps: {
      query: (async (text: string) => {
        queries.push(text);
        return [{ submission_id: submissionId }];
      }) as never,
      startAcknowledgement: async (id: string) => {
        if (startFails) throw new Error("windmill down");
        started.push(id);
      },
    },
  };
}

test("a wrong or missing secret answers 403 and saves nothing", async () => {
  const t = intakeDeps("s1");
  assert.deepEqual(await runIntake(false, { ...base, source: "web", locale: "en-IN" }, t.deps), { wm_status_code: 403, result: { ok: false, error: "Forbidden" } });
  assert.deepEqual(t.queries, []);
});

test("an invalid payload answers 400 with the failing fields and saves nothing", async () => {
  const t = intakeDeps("s1");
  const out = await runIntake(true, { ...base, source: "web", locale: null }, t.deps);
  assert.equal(out.wm_status_code, 400);
  assert.match((out.result as { error: string }).error, /locale/);
  assert.deepEqual(t.queries, []);
});

test("a saved application answers 202 with its reference and starts the acknowledgement", async () => {
  const t = intakeDeps("s1");
  assert.deepEqual(await runIntake(true, { ...base, source: "web", locale: "en-IN" }, t.deps), { wm_status_code: 202, result: { ok: true, ref: "VS-J-TEST99" } });
  assert.deepEqual(t.queries, [SAVE_SUBMISSION]);
  assert.deepEqual(t.started, ["s1"]);
});

test("a replayed reference answers 202 again and sends nothing; a failed start still answers 202", async () => {
  const replay = intakeDeps(null);
  assert.equal((await runIntake(true, { ...base, source: "web", locale: "en-IN" }, replay.deps)).wm_status_code, 202);
  assert.deepEqual(replay.started, []);
  const down = intakeDeps("s1", true);
  assert.equal((await runIntake(true, { ...base, source: "web", locale: "en-IN" }, down.deps)).wm_status_code, 202);
});

test("the secret check is exact, and the secret never reaches main's arguments", async () => {
  assert.equal(secretMatches("abc", "abc"), true);
  assert.equal(secretMatches("abd", "abc"), false);
  assert.equal(secretMatches("abcd", "abc"), false);
  assert.equal(secretMatches(undefined, "abc"), false);
  assert.equal(secretMatches("", ""), false);
  setConfigForTests({ intake_webhook_secret: "s3cret" });
  try {
    const ok = await preprocessor({ headers: { "X-VSPL-Intake-Secret": "s3cret" }, body: { ref: "x" } });
    assert.deepEqual(ok, { authorized: true, body: { ref: "x" } });
    const bad = await preprocessor({ headers: { "x-vspl-intake-secret": "nope" }, body: { ref: "x" } });
    assert.deepEqual(bad, { authorized: false, body: null });
    assert.doesNotMatch(JSON.stringify(ok), /s3cret/);
  } finally {
    setConfigForTests(null);
  }
});
