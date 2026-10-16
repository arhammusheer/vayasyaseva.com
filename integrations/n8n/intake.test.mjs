// Runs the generated "Validate submission" and "Compose note" Code nodes
// against old and new payload shapes: source "web" with a BCP 47 locale,
// cluster and page path (PLAN §1a, §8.2) is additive, and legacy payloads
// still pass unchanged.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const node = (workflow, name) =>
  JSON.parse(readFileSync(new URL(`./workflows/${workflow}.json`, import.meta.url))).nodes.find((n) => n.name === name).parameters.jsCode;

const validateCode = node("vspl-talent-intake", "Validate submission");
async function validate(body) {
  const [item] = await new AsyncFunction("$", validateCode)(() => ({ first: () => ({ json: { body } }) }));
  return item.json;
}

const composeCode = node("vspl-talent-deliver", "Compose note");
async function compose(submission) {
  const [item] = await new AsyncFunction("$", composeCode)(() => ({ first: () => ({ json: submission }) }));
  return item.json.note;
}

const base = {
  ref: "VS-J-TEST99",
  phone: "9876543210",
  adult: true,
  consent: { version: "2026-10-02", at: "2026-10-16T10:00:00Z" },
  text: null,
  attachments: [],
  form: "quick",
  applicantName: "Ravi",
  answers: { work: ["packing"], area: ["sidcul-bahadrabad"] },
};

test("consent versions are stored as given: the earlier dates and the website's v7", async () => {
  for (const version of ["2026-10-02", "2026-10-16", "2026-10-16-v7"]) {
    const out = await validate({ ...base, source: "web", locale: "en-IN", consent: { version, at: "2026-10-16T10:00:00Z" } });
    assert.equal(out.consentVersion, version);
  }
  await assert.rejects(validate({ ...base, source: "web", locale: "en-IN", consent: { at: "2026-10-16T10:00:00Z" } }), /consent/);
});

test("legacy page sources still pass and keep their short locale", async () => {
  const out = await validate({ ...base, source: "web_hinglish" });
  assert.equal(out.source, "web_hinglish");
  assert.equal(out.locale, "hinglish");
  assert.equal(out.cluster, null);
  assert.equal(out.pageCluster, null);
  assert.equal(out.pagePath, null);
});

test("web submissions carry a BCP 47 locale, cluster and page path", async () => {
  const out = await validate({ ...base, source: "web", locale: "hi-Latn-IN", cluster: "haridwar", pageCluster: "haridwar", pagePath: "/jobs/haridwar" });
  assert.equal(out.source, "web");
  assert.equal(out.locale, "hi-Latn-IN");
  assert.equal(out.cluster, "haridwar");
  assert.equal(out.pageCluster, "haridwar");
  assert.equal(out.pagePath, "/jobs/haridwar");
});

test("a web submission without a valid locale is rejected", async () => {
  await assert.rejects(validate({ ...base, source: "web" }), /locale/);
  await assert.rejects(validate({ ...base, source: "web", locale: "en" }), /locale/);
  await assert.rejects(validate({ ...base, source: "web_xx" }), /source/);
});

test("unknown page fields are dropped, not fatal", async () => {
  const out = await validate({ ...base, source: "web", locale: "en-IN", cluster: "mumbai", pageCluster: "Haridwar", pagePath: "/en-in/jobs?x=1" });
  assert.equal(out.cluster, null);
  assert.equal(out.pageCluster, null);
  assert.equal(out.pagePath, null);
});

test("the staff note names the page, its language and the cluster", async () => {
  const note = await compose({
    ref: "VS-J-TEST99", source: "web", locale: "hi-IN", channel: "web", form: "quick", applicantName: "Ravi",
    cluster: "haridwar", pageCluster: "haridwar", pagePath: "/jobs/haridwar", phone: "+919876543210",
    role: null, hub: null, agentName: null, answers: null, text: null, attachments: [],
  });
  assert.match(note, /हिंदी jobs page \(hi-IN\)/);
  assert.match(note, /on \/jobs\/haridwar/);
  assert.match(note, /\*\*Cluster:\*\* haridwar$/m);
  const legacy = await compose({
    ref: "VS-J-TEST98", source: "web_en", locale: "en", channel: "agent", form: null, applicantName: null,
    cluster: null, pageCluster: null, pagePath: null, phone: "+919876543210",
    role: null, hub: null, agentName: "Helper", answers: null, text: "Packing work", attachments: [],
  });
  assert.match(legacy, /AI agent \(English\)/);
  assert.doesNotMatch(legacy, /Cluster/);
});
