// Twenty CRM: the talent sync (people by phone, applications, SMS
// acknowledgements), erasure, and the website's leads. A fake Twenty keeps
// records in memory, with the REST client's filter strings.
import assert from "node:assert/strict";
import test from "node:test";
import {
  ANSWER_OPTIONS,
  ackFields,
  ackSyncState,
  applicationFields,
  clusterValue,
  deliveryStatus,
  erasePerson,
  languageValue,
  personFields,
  phoneDigits,
  roleValue,
  screeningFields,
  sourceValue,
  type SyncCandidate,
} from "./talent/lib/crm.ts";
import { runSyncCrm } from "./talent/lib/run-sync-crm.ts";
import { CRM_SYNC_LOCK, RECORD_CRM_SYNC, SYNC_CANDIDATES } from "./talent/lib/sql.ts";
import { twentyClient, type Twenty, type TwentyRecord } from "./talent/lib/twenty.ts";
import { checkLead, crewSize, opportunityName, recordLead, serviceValues } from "./leads/lib/lead.ts";
import { main as leadMain } from "./leads/scripts/intake.ts";
import { SCRIPTS } from "./scripts.mts";
import { INTAKE_CLUSTERS, JOB_ROLE_SLUGS, QUICK_ANSWERS } from "../../packages/contracts/src/rules.ts";

function fakeTwenty() {
  const store: Record<string, TwentyRecord[]> = { people: [], applications: [], communications: [], companies: [], opportunities: [] };
  let n = 0;
  const get = (r: TwentyRecord, path: string) => path.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown> | undefined)?.[k], r);
  const calls: string[] = [];
  const crm: Twenty = {
    async find(plural, filter) {
      const m = filter.match(/^(.+)\[eq\]:(".*")$/);
      if (!m) throw new Error(`bad filter ${filter}`);
      const value = JSON.parse(m[2]);
      return store[plural].filter((r) => get(r, m[1]) === value);
    },
    async create(plural, _singular, body) {
      calls.push(`create ${plural}`);
      const record = { id: `id-${++n}`, ...body } as TwentyRecord;
      store[plural].push(record);
      return record;
    },
    async update(plural, id, body) {
      calls.push(`update ${plural}`);
      const r = store[plural].find((x) => x.id === id)!;
      Object.assign(r, body);
    },
    async remove(plural, id) {
      calls.push(`remove ${plural}`);
      const before = store[plural].length;
      store[plural] = store[plural].filter((x) => x.id !== id);
      return store[plural].length < before;
    },
  };
  return { crm, store, calls };
}

const candidate = (over: Partial<SyncCandidate> = {}): SyncCandidate => ({
  id: "sub-1",
  ref: "VS-J-ABC234",
  source: "web",
  channel: "web",
  locale: "hi-IN",
  phone: "+919876543210",
  consent_version: "2026-10",
  consented_at: "2026-10-16T10:00:00Z",
  text: "Packing ka kaam chahiye",
  role: "packing",
  cluster: "haridwar",
  answers: { work: ["packing", "warehouse", "not-a-role"], area: ["sidcul-bahadrabad"] },
  page_path: "/jobs/packing",
  applicant_name: "Ravi",
  created_at: "2026-10-16T10:00:00Z",
  person_name: "Ravi Kumar",
  person_clusters: ["haridwar"],
  person_roles: ["packing"],
  home_area: "SIDCUL",
  person_locale: "hi-IN",
  person_status: "active",
  last_applied_at: "2026-10-16T10:00:00Z",
  last_contact_at: "2026-10-16T10:00:00Z",
  last_confirmed_at: null,
  ack_status: "accepted",
  request_id: "S6ueHX",
  ack_error: null,
  accepted_at: "2026-10-16T10:00:05Z",
  ack_updated_at: "2026-10-16T10:00:05Z",
  delivery_status: null,
  delivery_detail: null,
  delivered_at: null,
  person_id: null,
  application_id: null,
  synced_ack_status: null,
  synced: false,
  ...over,
});

test("site and database slugs become Twenty option values; unknown ones are dropped", () => {
  assert.equal(clusterValue("delhi-ncr"), "DELHI_NCR");
  assert.equal(clusterValue("mumbai"), null);
  assert.equal(roleValue("forklift-operator"), "FORKLIFT_OPERATOR");
  assert.equal(roleValue("iti-trades"), "ITI_TRADES");
  assert.equal(roleValue("astronaut"), null);
  assert.equal(languageValue("hi-Latn-IN"), "HI_LATN");
  assert.equal(languageValue("hinglish"), "HI_LATN");
  assert.equal(languageValue("en"), "EN");
  assert.equal(sourceValue({ source: "web_hi", channel: "web" }), "WEBSITE");
  assert.equal(sourceValue({ source: "web", channel: "agent" }), "AGENT");
  assert.equal(phoneDigits("+919876543210"), "9876543210");
  assert.deepEqual(["pending", "sending", "accepted", "failed", "unknown"].map((s) => deliveryStatus(s)), ["QUEUED", "QUEUED", "SENT", "FAILED", "UNKNOWN"]);
});

test("a new worker: phone as Twenty keeps it, type worker, status new, roles and clusters merged", () => {
  const f = personFields(candidate(), null);
  assert.deepEqual(f.phones, { primaryPhoneNumber: "9876543210", primaryPhoneCountryCode: "IN", primaryPhoneCallingCode: "+91" });
  assert.equal(f.personType, "WORKER");
  assert.equal(f.workerStatus, "NEW");
  assert.deepEqual(f.workRoles, ["PACKING", "WAREHOUSE"]);
  assert.deepEqual(f.clusters, ["HARIDWAR"]);
  assert.deepEqual(f.name, { firstName: "Ravi Kumar", lastName: "" });
  assert.equal(f.language, "HI");
});

test("an existing person keeps staff's status, name and type; lists union; do-not-contact always wins", () => {
  const existing = { id: "p", personType: "WORKER", workerStatus: "PLACED", workRoles: ["WELDER"], clusters: ["BENGALURU"], name: { firstName: "R.", lastName: "K." } };
  const f = personFields(candidate(), existing);
  assert.equal(f.workerStatus, undefined);
  assert.equal(f.personType, undefined);
  assert.equal(f.name, undefined);
  assert.equal(f.phones, undefined);
  assert.deepEqual(f.workRoles, ["WELDER", "PACKING", "WAREHOUSE"]);
  assert.deepEqual(f.clusters, ["BENGALURU", "HARIDWAR"]);
  assert.equal(personFields(candidate({ person_status: "do-not-contact" }), existing).workerStatus, "DO_NOT_CONTACT");
});

test("the application and the acknowledgement carry the submission's facts and sync keys", () => {
  const a = applicationFields(candidate(), "p1");
  assert.equal(a.name, "VS-J-ABC234");
  assert.equal(a.talentSubmissionId, "sub-1");
  assert.equal(a.jobRole, "PACKING");
  assert.equal(a.source, "WEBSITE");
  assert.equal(a.personId, "p1");
  assert.deepEqual(a.phone, { primaryPhoneNumber: "9876543210", primaryPhoneCountryCode: "IN", primaryPhoneCallingCode: "+91" });
  assert.deepEqual(a.workWanted, ["PACKING", "WAREHOUSE"]);
  const c = ackFields(candidate(), "p1", "a1");
  assert.equal(c.externalKey, "sms-ack:sub-1");
  assert.equal(c.deliveryStatus, "SENT");
  assert.equal(c.providerId, "S6ueHX");
  assert.match(String(c.body), /Ref VS-J-ABC234\./);
});

function syncDb(candidates: SyncCandidate[], locked = true) {
  const recorded: unknown[][] = [];
  const query = (async (text: string, p: unknown[] = []) => {
    if (text === CRM_SYNC_LOCK) return [{ locked }];
    if (text === SYNC_CANDIDATES) return candidates;
    if (text === RECORD_CRM_SYNC) return (recorded.push(p), []);
    throw new Error(`unexpected query ${text.slice(0, 40)}`);
  }) as never;
  return { query, recorded };
}

test("sync: a new submission makes person, application and acknowledgement, and is recorded", async () => {
  const t = fakeTwenty();
  const db = syncDb([candidate()]);
  const result = await runSyncCrm({ query: db.query, crm: t.crm });
  assert.deepEqual(result, { created: 1, updated: 0, failed: 0 });
  assert.equal(t.store.people.length, 1);
  assert.equal(t.store.applications.length, 1);
  assert.equal(t.store.communications.length, 1);
  assert.deepEqual(db.recorded[0], ["sub-1", t.store.people[0].id, t.store.applications[0].id, "accepted"]);
});

test("sync: a second application from the same phone reuses the person", async () => {
  const t = fakeTwenty();
  await runSyncCrm({ query: syncDb([candidate()]).query, crm: t.crm });
  await runSyncCrm({ query: syncDb([candidate({ id: "sub-2", ref: "VS-J-ABC235" })]).query, crm: t.crm });
  assert.equal(t.store.people.length, 1);
  assert.equal(t.store.applications.length, 2);
  assert.equal(t.store.communications.length, 2);
});

test("sync: a changed acknowledgement only updates the communication", async () => {
  const t = fakeTwenty();
  const first = syncDb([candidate({ ack_status: "pending", request_id: null })]);
  await runSyncCrm({ query: first.query, crm: t.crm });
  const [personId, appId] = [t.store.people[0].id, t.store.applications[0].id];
  t.calls.length = 0;
  const again = syncDb([candidate({ synced: true, person_id: personId, application_id: appId, synced_ack_status: "pending", ack_status: "failed", ack_error: "invalid number" })]);
  const result = await runSyncCrm({ query: again.query, crm: t.crm });
  assert.deepEqual(result, { created: 0, updated: 1, failed: 0 });
  assert.deepEqual(t.calls, ["update communications"]);
  assert.equal(t.store.communications[0].deliveryStatus, "FAILED");
  assert.equal(t.store.communications[0].error, "invalid number");
});

test("sync: an application created by a run that stopped early is found, not duplicated", async () => {
  const t = fakeTwenty();
  t.store.applications.push({ id: "a-old", talentSubmissionId: "sub-1" });
  await runSyncCrm({ query: syncDb([candidate()]).query, crm: t.crm });
  assert.equal(t.store.applications.length, 1);
});

test("sync: one failing submission is logged by reference and the rest go on", async () => {
  const t = fakeTwenty();
  const orig = t.crm.create;
  t.crm.create = async (plural, singular, body) => {
    if (plural === "applications" && body.talentSubmissionId === "sub-1") throw new Error("Twenty POST /applications: HTTP 500");
    return orig(plural, singular, body);
  };
  const logs: string[] = [];
  const db = syncDb([candidate(), candidate({ id: "sub-2", ref: "VS-J-ABC235", phone: "+919876543211" })]);
  const result = await runSyncCrm({ query: db.query, crm: t.crm, log: (m) => logs.push(m) });
  assert.deepEqual(result, { created: 1, updated: 0, failed: 1 });
  assert.equal(db.recorded.length, 1);
  assert.match(logs[0], /VS-J-ABC234/);
  assert.doesNotMatch(logs[0], /9876543210/);
});

test("sync: Twenty's rate limit stops the run without counting failures", async () => {
  const t = fakeTwenty();
  t.crm.find = async () => {
    throw new Error("Twenty GET /people: HTTP 429 Rate limit exceeded for apiKey: 100 requests per 60s.");
  };
  const logs: string[] = [];
  const db = syncDb([candidate(), candidate({ id: "sub-2", ref: "VS-J-ABC235" })]);
  const result = await runSyncCrm({ query: db.query, crm: t.crm, log: (m) => logs.push(m) });
  assert.deepEqual(result, { created: 0, updated: 0, failed: 0, rateLimited: true });
  assert.equal(logs.length, 0);
  assert.equal(db.recorded.length, 0);
});

test("sync: a run already in progress skips", async () => {
  const result = await runSyncCrm({ query: syncDb([candidate()], false).query, crm: fakeTwenty().crm });
  assert.equal(result.skipped, "another sync is running");
});

test("erasure removes the person's communications, applications and the person; none is fine", async () => {
  const t = fakeTwenty();
  await runSyncCrm({ query: syncDb([candidate()]).query, crm: t.crm });
  assert.equal(await erasePerson(t.crm, "+919876543210"), 1);
  assert.deepEqual([t.store.people.length, t.store.applications.length, t.store.communications.length], [0, 0, 0]);
  assert.equal(await erasePerson(t.crm, "+919876543210"), 0);
});

test("erasure keeps a client contact who shares the phone: only the worker side goes", async () => {
  const t = fakeTwenty();
  await runSyncCrm({ query: syncDb([candidate()]).query, crm: t.crm });
  // The same number then sends a business enquiry: the person becomes a lead's point of contact.
  const [person] = t.store.people;
  const opp = await t.crm.create("opportunities", "Opportunity", { caseId: "REQ-1", pointOfContactId: person.id });
  await t.crm.create("communications", "Communication", { externalKey: "lead:REQ-1", personId: person.id, opportunityId: opp.id });
  assert.equal(await erasePerson(t.crm, "+919876543210"), 1);
  assert.equal(t.store.people.length, 1);
  assert.equal(t.store.people[0].personType, "CLIENT_CONTACT");
  assert.deepEqual([t.store.people[0].clusters, t.store.people[0].workRoles, t.store.people[0].workerStatus], [[], [], null]);
  assert.equal(t.store.applications.length, 0);
  assert.deepEqual(t.store.communications.map((c) => c.externalKey), ["lead:REQ-1"]);
  assert.equal(t.store.opportunities.length, 1);
});

test("the REST client: filters quoted, 404 on delete is 'already gone', errors name status not values", async () => {
  const seen: string[] = [];
  const fetchFake = (async (url: string, init?: RequestInit) => {
    seen.push(`${init?.method} ${url}`);
    if (init?.method === "DELETE") return new Response("", { status: 404 });
    if (init?.method === "POST") return new Response(JSON.stringify({ statusCode: 400, messages: ["A duplicate entry was detected"] }), { status: 400 });
    return new Response(JSON.stringify({ data: { people: [{ id: "x" }] } }), { status: 200 });
  }) as typeof fetch;
  const client = twentyClient("http://twenty/", "key", fetchFake);
  assert.deepEqual(await client.find("people", 'phones.primaryPhoneNumber[eq]:"9876543210"'), [{ id: "x" }]);
  assert.match(seen[0], /^GET http:\/\/twenty\/rest\/people\?limit=60&filter=phones.primaryPhoneNumber%5Beq%5D%3A%229876543210%22$/);
  assert.equal(await client.remove("people", "x"), false);
  await assert.rejects(client.create("people", "Person", { phones: "9876543210" }), (e: Error) => /HTTP 400 A duplicate entry/.test(e.message) && !e.message.includes("9876543210"));
});

test("the CRM sync runs inside the dispatcher every minute; its own schedule is retired", () => {
  const sync = SCRIPTS.find((s) => s.name === "sync_crm" && (s.folder ?? "talent") === "talent");
  assert.equal(sync?.schedule, undefined);
  assert.equal(sync?.retiredSchedule, true);
  assert.equal(SCRIPTS.find((s) => s.name === "dispatch")?.schedule?.cron, "0 * * * * *");
});

// --- leads ---------------------------------------------------------------------------

const leadBody = {
  caseId: "REQ-20261017-0A1B2C3D",
  receivedAt: "2026-10-17T05:00:00Z",
  channel: "web",
  name: "Asha Rao",
  company: "Acme Foods",
  jobTitle: "Plant HR",
  phone: "+91 98765 43299",
  email: "asha@acme.example",
  services: ["packing", "loading-unloading", "gardening"],
  headcount: null,
  headcountBand: "20-49",
  site: "Haridwar, Uttarakhand, 249403",
  cluster: "haridwar",
  startWindow: "within-1-week",
  targetStartDate: null,
  requestType: "crew",
  enquiry: "Roles: Packing, Loading\nHeadcount: 20-49\n\nNeed a crew for the new line.",
  sourcePath: "/contact",
};

test("a lead is checked against the canonical schema (business_enquiry.v1); the errors name the fields", () => {
  assert.equal(checkLead(leadBody).ok, true);
  const bad = checkLead({ ...leadBody, caseId: "nope", phone: "12", email: "x" });
  assert.deepEqual(bad.ok ? [] : bad.errors, ["caseId", "email", "phone"]);
  const extra = checkLead({ ...leadBody, extra: "not in the contract" });
  assert.deepEqual(extra.ok ? [] : extra.errors, ["extra"]);
  assert.deepEqual(serviceValues(["packing", "loading-unloading", "gardening", "astronaut"]), ["FACTORY_LABOUR", "LOADING_UNLOADING", "HOUSEKEEPING", "OTHER"]);
  assert.equal(crewSize({ headcount: "about 35 people", headcountBand: null }), 35);
  assert.equal(crewSize({ headcount: null, headcountBand: "250+" }), 250);
});

test("a lead becomes company, client contact, crew request at New, and the enquiry; replay changes nothing", async () => {
  const t = fakeTwenty();
  const v = checkLead(leadBody);
  assert.ok(v.ok);
  if (!v.ok) return;
  const first = await recordLead(t.crm, v.lead);
  assert.equal(first.created, true);
  assert.equal(t.store.companies[0].name, "Acme Foods");
  const person = t.store.people[0];
  assert.equal(person.personType, "CLIENT_CONTACT");
  assert.equal(person.companyId, t.store.companies[0].id);
  const opp = t.store.opportunities[0];
  assert.equal(opp.stage, "NEW");
  assert.equal(opp.caseId, "REQ-20261017-0A1B2C3D");
  assert.equal(opp.crewSize, 20);
  assert.equal(opp.cluster, "HARIDWAR");
  assert.equal(opp.pointOfContactId, person.id);
  assert.equal(opp.name, opportunityName(v.lead));
  assert.equal(t.store.communications[0].externalKey, "lead:REQ-20261017-0A1B2C3D");
  assert.equal(t.store.communications[0].opportunityId, opp.id);
  const again = await recordLead(t.crm, v.lead);
  assert.equal(again.created, false);
  assert.deepEqual([t.store.companies.length, t.store.people.length, t.store.opportunities.length, t.store.communications.length], [1, 1, 1, 1]);
});

test("a replay after a write interrupted before the enquiry adds the enquiry once", async () => {
  const t = fakeTwenty();
  const v = checkLead(leadBody);
  if (!v.ok) return assert.fail();
  const create = t.crm.create;
  t.crm.create = async (plural, singular, body) => {
    if (plural === "communications") throw new Error("Twenty POST /communications: HTTP 503");
    return create(plural, singular, body);
  };
  await assert.rejects(recordLead(t.crm, v.lead));
  assert.deepEqual([t.store.opportunities.length, t.store.communications.length], [1, 0]);
  t.crm.create = create;
  assert.equal((await recordLead(t.crm, v.lead)).created, false);
  assert.equal(t.store.communications.length, 1);
  assert.equal(t.store.communications[0].opportunityId, t.store.opportunities[0].id);
  assert.equal(t.store.communications[0].personId, t.store.people[0].id);
  await recordLead(t.crm, v.lead);
  assert.equal(t.store.communications.length, 1);
});

test("a lead from a known worker's phone reuses the person without changing their type", async () => {
  const t = fakeTwenty();
  t.store.people.push({ id: "w1", personType: "WORKER", phones: { primaryPhoneNumber: "9876543299" } });
  const v = checkLead(leadBody);
  if (!v.ok) return assert.fail();
  await recordLead(t.crm, v.lead);
  assert.equal(t.store.people.length, 1);
  assert.equal(t.store.people[0].personType, "WORKER");
});

test("the lead route: 403 without the secret, 400 for a bad lead, never error details", async () => {
  assert.deepEqual(await leadMain(false, leadBody), { wm_status_code: 403, result: { ok: false, error: "Forbidden" } });
  const bad = await leadMain(true, { caseId: "x" });
  assert.equal(bad.wm_status_code, 400);
  assert.match(String((bad.result as { error: string }).error), /^Invalid lead: /);
});

test("sync: a delivery report turns Sent into Delivered, and the state recorded carries it", async () => {
  assert.equal(deliveryStatus("accepted", "delivered"), "DELIVERED");
  assert.equal(deliveryStatus("accepted", "failed"), "FAILED");
  assert.equal(deliveryStatus("accepted", "pending"), "SENT");
  assert.equal(ackSyncState(candidate()), "accepted");
  const t = fakeTwenty();
  await runSyncCrm({ query: syncDb([candidate()]).query, crm: t.crm });
  const [personId, appId] = [t.store.people[0].id, t.store.applications[0].id];
  t.calls.length = 0;
  const delivered = candidate({
    synced: true, person_id: personId, application_id: appId, synced_ack_status: "accepted",
    delivery_status: "delivered", delivery_detail: "Delivered: Delivered successfully", delivered_at: "2026-10-16T10:00:08Z",
  });
  const db = syncDb([delivered]);
  await runSyncCrm({ query: db.query, crm: t.crm });
  assert.deepEqual(t.calls, ["update communications"]);
  assert.equal(t.store.communications[0].deliveryStatus, "DELIVERED");
  assert.equal(t.store.communications[0].statusAt, "2026-10-16T10:00:08.000Z");
  assert.equal(t.store.communications[0].error, "");
  assert.equal(db.recorded[0][3], "accepted:delivered");
});

test("sync: a failed delivery shows Fast2SMS's reason", () => {
  const c = ackFields(candidate({ delivery_status: "failed", delivery_detail: "Undelivered: DND number" }), "p", "a");
  assert.equal(c.deliveryStatus, "FAILED");
  assert.equal(c.error, "Undelivered: DND number");
});

test("screening answers become the application's own fields; unknown answers are dropped", () => {
  const f = screeningFields({
    work: ["iti-trades", "nope"], trade: ["fitter"], iti: ["iti-pass"], machines: ["cnc-vmc"],
    experience: ["1-3"], education: ["iti-diploma"], shift: ["day", "night", "x"], start: ["now"], area: ["outside"],
  });
  assert.deepEqual(f, {
    experience: "YEARS_1_TO_3",
    education: "ITI_DIPLOMA",
    canStart: "NOW",
    area: "OUTSIDE_HARIDWAR",
    shifts: ["DAY", "NIGHT"],
    workWanted: ["ITI_TRADES"],
    skills: "ITI passed · Fitter · CNC / VMC",
  });
  assert.deepEqual(screeningFields(null), { experience: null, education: null, canStart: null, area: null, shifts: [], workWanted: [], skills: "" });
  assert.equal(screeningFields({ area: ["bengaluru:east"] }).area, "BENGALURU_EAST");
});

// Twenty's select options are stored values built from these maps
// (integrations/twenty/setup.mts). The website's rules.ts is the source of
// the ids; nothing else ties the two, so a new id with no option would be
// filed as null without a word.
test("every cluster, role and quick answer the website can send has a Twenty option", () => {
  for (const id of INTAKE_CLUSTERS) assert.notEqual(clusterValue(id), null, `cluster ${id}`);
  for (const id of [...JOB_ROLE_SLUGS, ...Object.keys(QUICK_ANSWERS.work)]) assert.notEqual(roleValue(id), null, `role ${id}`);
  for (const [group, options] of Object.entries(ANSWER_OPTIONS)) {
    const answers = QUICK_ANSWERS[group as keyof typeof QUICK_ANSWERS];
    assert.ok(answers, `ANSWER_OPTIONS.${group} has no QUICK_ANSWERS group`);
    assert.deepEqual(Object.keys(options).sort(), Object.keys(answers).sort(), `ANSWER_OPTIONS.${group} vs QUICK_ANSWERS.${group}`);
  }
});
