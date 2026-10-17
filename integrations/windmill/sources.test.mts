// Phase B of the notification hub: what each Windmill producer raises, and
// what the hub does with it (the store in memory, ntfy and Resend mocked).
//   talent    application.received from the CRM sync (name and full phone, Call)
//   leads     lead.received (masked phone; qualified higher), lead.forward_failed at the cap
//   platform  f/platform/health: platform.* once when firing starts, resolved when clear
// Made-up data only: the repository is public.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { LEADS_SCHEMA, testDb } from "./test-db.mts";
import { emit, type EmitInput } from "./notify/lib/emit.ts";
import { validateEvent } from "./notify/lib/event.ts";
import { memoryStore } from "./notify/lib/memory-store.ts";
import { runDispatch } from "./notify/lib/dispatch.ts";
import { ntfyClient } from "./notify/lib/ntfy.ts";
import { resendClient } from "./notify/lib/resend.ts";
import { DEFAULT_POLICY, resolveRoute } from "./notify/lib/policy.ts";
import { NOTIFY_KEY_STATUSES } from "./notify/lib/db.ts";
import { applicationEvent, roleLabel } from "./talent/lib/notify-application.ts";
import { runSyncCrm } from "./talent/lib/run-sync-crm.ts";
import { CRM_SYNC_LOCK, RECORD_CRM_SYNC, SYNC_CANDIDATES } from "./talent/lib/sql.ts";
import type { SyncCandidate } from "./talent/lib/crm.ts";
import { crewSummary, isQualified, leadForwardFailedEvent, leadReceivedEvent } from "./leads/lib/lead-notify.ts";
import { runLeadsSync, saveLead } from "./leads/lib/run-leads.ts";
import type { Lead } from "./leads/lib/lead.ts";
import { HEALTH_KEY_PREFIX, healthConditions, notifyHealth } from "./platform/lib/health-notify.ts";
import type { Health } from "./platform/lib/run-health.ts";
import type { Twenty } from "./talent/lib/twenty.ts";

const PHONE = "+919876543210";

function hub() {
  const mem = memoryStore();
  const pushes: Record<string, unknown>[] = [];
  const emails: Record<string, unknown>[] = [];
  const fake = (into: Record<string, unknown>[]) =>
    (async (_url: string | URL | Request, init?: RequestInit) => (into.push(JSON.parse(String(init?.body ?? "{}"))), new Response("{}", { status: 200 }))) as typeof fetch;
  let clock = new Date("2026-10-18T04:30:00.000Z");
  return {
    mem,
    pushes,
    emails,
    notify: async (e: EmitInput) => (await emit(e, { store: mem.store, now: clock }), true),
    dispatch: () =>
      runDispatch({
        store: mem.store,
        policy: DEFAULT_POLICY,
        ntfy: ntfyClient("http://ntfy.test", "tk_test", fake(pushes)),
        resend: resendClient("re_test", "VSPL <notify@notify.example>", "owner@example.com", fake(emails)),
        now: () => clock,
      }),
    advance: (minutes: number) => void (clock = new Date(clock.getTime() + minutes * 60_000)),
    now: () => clock,
  };
}

// --- Talent: application.received -------------------------------------------------------

const candidate = (over: Partial<SyncCandidate> = {}): SyncCandidate => ({
  id: "sub-1",
  ref: "VS-J-TEST01",
  source: "web",
  channel: "web",
  locale: "hi-IN",
  phone: PHONE,
  consent_version: "2026-10",
  consented_at: "2026-10-16T10:00:00Z",
  text: "Mera Aadhaar 2345 6789 0123 hai, packing chahiye",
  role: null,
  cluster: "haridwar",
  answers: { work: ["packing"], area: ["sidcul-bahadrabad"] },
  page_path: "/jobs/apply",
  applicant_name: "Test Applicant",
  created_at: "2026-10-16T10:00:00Z",
  person_name: null,
  person_clusters: null,
  person_roles: null,
  home_area: null,
  person_locale: "hi-IN",
  person_status: null,
  last_applied_at: null,
  last_contact_at: null,
  last_confirmed_at: null,
  ack_status: null,
  request_id: null,
  ack_error: null,
  accepted_at: null,
  ack_updated_at: null,
  delivery_status: null,
  delivery_detail: null,
  delivered_at: null,
  person_id: null,
  application_id: null,
  synced_ack_status: null,
  synced: false,
  ...over,
});

function fakeTwenty(): Twenty {
  const rows: Record<string, { id: string; [k: string]: unknown }[]> = {};
  let n = 0;
  return {
    find: async (plural: string) => rows[plural] ?? [],
    create: async (plural: string, _s: string, body: Record<string, unknown>) => {
      const row = { id: `0000000${++n}-0000-4000-8000-000000000000`, ...body };
      (rows[plural] ??= []).push(row);
      return row;
    },
    update: async (_p: string, id: string) => ({ id }),
    remove: async () => true,
  } as unknown as Twenty;
}

function syncDb(candidates: SyncCandidate[], recordFails = false) {
  return (async (text: string) => {
    if (text === CRM_SYNC_LOCK) return [{ locked: true }];
    if (text === SYNC_CANDIDATES) return candidates;
    if (text === RECORD_CRM_SYNC) {
      if (recordFails) throw new Error("connection reset");
      return [];
    }
    throw new Error(`unexpected query ${text.slice(0, 40)}`);
  }) as never;
}

test("application.received: role, area and cluster from the fixed lists; never the applicant's text", () => {
  const e = applicationEvent(candidate(), "person-1");
  assert.equal(e.dedupeKey, "application:VS-J-TEST01");
  assert.equal(e.title, "New job application: Packing, Haridwar");
  assert.equal(e.summary, "VS-J-TEST01 · Packing · SIDCUL / Bahadrabad · Haridwar · quick form · Hindi");
  assert.deepEqual(e.pii, { name: "Test Applicant", phone: PHONE });
  assert.deepEqual(e.link, { label: "View in Twenty", url: "https://crm.vayasyaseva.com/object/person/person-1" });
  assert.doesNotMatch(JSON.stringify(e), /Aadhaar|2345|chahiye/);
  assert.equal(roleLabel(candidate({ role: "forklift-operator" })), "Forklift operator");
  assert.equal(roleLabel(candidate({ answers: null })), "any work");
  assert.equal(applicationEvent(candidate({ applicant_name: null }), "p").pii?.name, undefined);
});

test("application.received: one push with name, full phone, Call and View in Twenty, even when the sync retries", async () => {
  const h = hub();
  const crm = fakeTwenty();
  const logs: string[] = [];
  // The first run writes Twenty, then fails to record it: the retry raises the event again.
  assert.equal((await runSyncCrm({ query: syncDb([candidate()], true), crm, notify: h.notify, log: (m) => logs.push(m) })).failed, 1);
  assert.equal((await runSyncCrm({ query: syncDb([candidate()]), crm, notify: h.notify })).created, 1);
  assert.equal(h.mem.events.length, 2);
  const out = await h.dispatch();
  assert.equal(out.duplicates, 1);
  assert.equal(h.pushes.length, 1, "one push per application");
  const push = h.pushes[0] as { topic: string; title: string; message: string; priority: number; actions: { label: string; url: string }[] };
  assert.equal(push.topic, "vspl-jobs");
  assert.equal(push.priority, 4);
  assert.match(push.message, /Test Applicant/);
  assert.match(push.message, /\+919876543210|98765 ?43210/);
  assert.deepEqual(push.actions.map((a) => a.label), ["Call", "View in Twenty"]);
  assert.equal(push.actions[0].url, "tel:+919876543210");
  assert.equal(h.emails.length, 0, "applications go to the digest, not an instant email");
  assert.equal(h.mem.events.filter((e) => e.pii).length, 0, "pii cleared once the push is sent");
  assert.doesNotMatch(logs.join("\n"), /9876543210|Test Applicant/);
});

test("application.received: a synced application (acknowledgement update) raises nothing", async () => {
  const raised: EmitInput[] = [];
  await runSyncCrm({
    query: syncDb([candidate({ synced: true, person_id: "p1", application_id: "a1", ack_status: "accepted", synced_ack_status: "pending" })]),
    crm: fakeTwenty(),
    notify: async (e) => (raised.push(e), true),
  });
  assert.equal(raised.length, 0);
});

// --- Leads: lead.received, lead.forward_failed -----------------------------------------------

const lead: Lead = {
  caseId: "REQ-20261018-0A1B2C3D",
  receivedAt: "2026-10-18T05:00:00.000Z",
  channel: "web",
  name: "Test Buyer",
  company: "Example Industries",
  jobTitle: null,
  phone: "+91 98765 43211",
  email: "buyer@example.com",
  services: ["packing", "loading-unloading"],
  headcount: null,
  headcountBand: "50-99",
  site: "Plot 1, Example Estate",
  cluster: "haridwar",
  startWindow: "2-4-weeks",
  targetStartDate: null,
  requestType: "crew",
  enquiry: "Case REQ-20261018-0A1B2C3D\nWork: Packing\nFlags: qualified (20+ workers, a month or more); starts soon\n\nPlease call 9876543211 about our plant",
  sourcePath: "/contact",
};

function twenty(fail: () => Error | null = () => null) {
  const rows: Record<string, { id: string; [k: string]: unknown }[]> = {};
  let n = 0;
  const crm = {
    async find(plural: string, filter: string) {
      const err = fail();
      if (err) throw err;
      const m = /^(\w+(?:\.\w+)?)\[eq\]:"?(.*?)"?$/.exec(filter);
      return (rows[plural] ?? []).filter((r) => !m || String(m[1].split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], r)) === m[2]);
    },
    async create(plural: string, _s: string, body: Record<string, unknown>) {
      const row = { id: `opp-${++n}`, ...body };
      (rows[plural] ??= []).push(row);
      return row;
    },
    async update(_p: string, id: string) {
      return { id };
    },
    async remove() {
      return true;
    },
  };
  return { crm: crm as unknown as Twenty, rows };
}

test("lead.received: qualified is notice, from the site's Flags line only; the title has no name, company or site", () => {
  assert.equal(isQualified(lead), true);
  assert.equal(isQualified({ enquiry: "Case X\nWork: Packing\n\nFlags: qualified, honestly" }), false, "the person's own text is not read");
  assert.equal(crewSummary(lead), "50-99 packers +1, Haridwar");
  assert.equal(crewSummary({ ...lead, requestType: "compliance-help" }), "compliance help, Haridwar");
  const e = leadReceivedEvent(lead, "opp-1");
  assert.equal(e.severity, "notice");
  assert.equal(e.title, "New crew request (qualified): 50-99 packers +1, Haridwar");
  assert.equal(e.summary, "REQ-20261018-0A1B2C3D · from /contact");
  assert.deepEqual(e.pii, { name: "Test Buyer", company: "Example Industries", phone: lead.phone });
  assert.equal(e.link?.url, "https://crm.vayasyaseva.com/object/opportunity/opp-1");
  assert.doesNotMatch(`${e.title} ${e.summary}`, /Test Buyer|Example|Plot|9876543211/);
  assert.equal(leadReceivedEvent({ ...lead, enquiry: "Case X" }, "opp-1").severity, "info");
});

test("lead.received: one instant push with a masked phone once the opportunity exists; qualified at priority 4", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  await saveLead(query, lead);
  const h = hub();
  let down = true;
  const t = twenty(() => (down ? new Error("Twenty GET /opportunities: HTTP 503") : null));
  await runLeadsSync({ query, crm: t.crm, notify: h.notify, log: () => {} });
  assert.equal(h.mem.events.length, 0, "nothing until the crew request is in Twenty");
  down = false;
  await query(`UPDATE deliveries SET next_attempt_at = now()`);
  await runLeadsSync({ query, crm: t.crm, notify: h.notify });
  await h.dispatch();
  assert.equal(h.pushes.length, 1);
  const push = h.pushes[0] as { topic: string; priority: number; message: string; actions: { label: string; url: string }[] };
  assert.equal(push.topic, "vspl-leads");
  assert.equal(push.priority, 4);
  assert.match(push.message, /Test Buyer/);
  assert.match(push.message, /Example Industries/);
  assert.match(push.message, /\+91 XXXXXX3211/);
  assert.doesNotMatch(push.message, /98765 ?43211/);
  assert.deepEqual(push.actions.map((a) => a.label), ["View in Twenty"]);
  assert.equal(push.actions[0].url, `https://crm.vayasyaseva.com/object/opportunity/${t.rows.opportunities[0].id}`);
  assert.equal(h.emails.length, 0, "the MSG91 shared-inbox mail stays the lead's email");
});

test("lead.forward_failed: raised once when a lead hits its cap, with the error's kind only", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  await saveLead(query, lead);
  const raised: EmitInput[] = [];
  const broken = twenty(() => new Error('Twenty POST /people: HTTP 400 {"message":"duplicate phone 9876543211 for Test Buyer"}'));
  for (let i = 0; i < 10; i++) {
    await query(`UPDATE deliveries SET next_attempt_at = now()`);
    await runLeadsSync({ query, crm: broken.crm, notify: async (e) => (raised.push(e), true), log: () => {} });
  }
  assert.deepEqual(raised.map((e) => e.type), ["lead.forward_failed"]);
  assert.equal(raised[0].dedupeKey, "lead-dead:REQ-20261018-0A1B2C3D");
  assert.match(raised[0].summary, /after 8 attempts \(last: HTTP 400\)/);
  assert.doesNotMatch(JSON.stringify(raised[0]), /Test Buyer|9876543211/);
  assert.equal(raised[0].pii, undefined);
  const route = resolveRoute(DEFAULT_POLICY, { source: "leads", type: "lead.forward_failed", severity: "warning" });
  assert.deepEqual([route.push, route.email, route.topic], ["instant", "instant", "vspl-leads"]);
  assert.equal(leadForwardFailedEvent("REQ-X", 8, null).summary.includes("no answer"), true);
});

// --- Platform: f/platform/health -------------------------------------------------------------

const health = (over: Partial<Health> = {}): Health => ({
  ok: false,
  checkedAt: "2026-10-18T04:30:00.000Z",
  talent: { dead: {}, unknown: { sms: 1 }, stuck: {}, overdue: {}, oldest: "2026-10-11T06:00:00.000Z", erasureFailed: 0 },
  leads: { dead: {}, unknown: {}, stuck: {}, overdue: {}, oldest: null },
  errors: [],
  ...over,
});

test("health: one key per condition; counts and the reason, no personal data", () => {
  const { firing } = healthConditions(health());
  assert.deepEqual(firing.map((c) => [c.key, c.type, c.severity]), [[`${HEALTH_KEY_PREFIX}talent:unknown:sms`, "platform.sms_unknown", "notice"]]);
  assert.match(firing[0].title, /SMS sends interrupted/);
  assert.match(firing[0].summary, /^1 now; the oldest open item in this database dates from 2026-10-11 06:00 UTC/);
  const down = healthConditions(health({ leads: null, talent: { ...health().talent!, erasureFailed: 2, overdue: { crm: 3 } } })).firing.map((c) => `${c.key}:${c.severity}`);
  assert.deepEqual(down, [
    `${HEALTH_KEY_PREFIX}talent:unknown:sms:notice`,
    `${HEALTH_KEY_PREFIX}talent:overdue:crm:critical`,
    `${HEALTH_KEY_PREFIX}leads:unreadable:critical`,
    `${HEALTH_KEY_PREFIX}talent:erasure_failed:warning`,
  ]);
});

test("health: the old unknown SMS fires once, not every 15 minutes; it resolves when settled", async () => {
  const h = hub();
  const first = await notifyHealth(health(), h.mem.store, h.now());
  assert.deepEqual(first.fired, [`${HEALTH_KEY_PREFIX}talent:unknown:sms`]);
  // The next check comes before dispatch has routed the first event: still nothing new.
  h.advance(15);
  assert.deepEqual((await notifyHealth(health(), h.mem.store, h.now())).fired, []);
  await h.dispatch();
  assert.equal(h.pushes.length, 1);
  assert.equal(h.emails.length, 0, "platform.* goes to the digest; only critical ones email");
  for (let i = 0; i < 8; i++) {
    h.advance(15);
    const r = await notifyHealth(health(), h.mem.store, h.now());
    assert.deepEqual([r.fired, r.resolved, r.unchanged], [[], [], 1]);
    await h.dispatch();
  }
  assert.equal(h.pushes.length, 1, "two hours of checks, one push");
  assert.equal(h.mem.events.length, 1, "and no stored duplicates");
  // A day later the routing table's reminder comes, from the hub, not from health.
  h.advance(24 * 60);
  await h.dispatch();
  assert.equal(h.pushes.length, 2);
  assert.match(String((h.pushes[1] as { title: string }).title), /^Still firing:/);
  // Settled by hand: resolved, once.
  const clear = health({ talent: { ...health().talent!, unknown: {} } });
  assert.deepEqual((await notifyHealth(clear, h.mem.store, h.now())).resolved, [`${HEALTH_KEY_PREFIX}talent:unknown:sms`]);
  await h.dispatch();
  assert.match(String((h.pushes[2] as { title: string }).title), /^Resolved: /);
  h.advance(15);
  assert.deepEqual(await notifyHealth(clear, h.mem.store, h.now()), { fired: [], resolved: [], unchanged: 0 });
});

test("health: a database it cannot read fires critical, and its conditions are not resolved meanwhile", async () => {
  const h = hub();
  await notifyHealth(health({ leads: { dead: { crm: 1 }, unknown: {}, stuck: {}, overdue: {}, oldest: null } }), h.mem.store, h.now());
  await h.dispatch();
  const blind = await notifyHealth(health({ leads: null, errors: ["leads: connection refused"] }), h.mem.store, h.now());
  assert.deepEqual(blind.fired, [`${HEALTH_KEY_PREFIX}leads:unreadable`]);
  assert.deepEqual(blind.resolved, [], "leads' dead count is unknown, not zero");
  await h.dispatch();
  assert.equal(h.emails.length, 1, "critical: an instant email too");
});

test("the key-status query (Postgres) reads the key's state with an unrouted event over it", async () => {
  const { query } = await testDb(readFileSync(new URL("notify/schema.sql", import.meta.url), "utf8"));
  const insert = (key: string, status: string, routed: boolean) =>
    query(
      `INSERT INTO notify_events (source, type, severity, dedupe_key, status, occurred_at, title, summary, routed_at) VALUES ('platform', 'platform.x', 'notice', $1, $2, now(), 't', 's', ${routed ? "now()" : "NULL"})`,
      [key, status],
    );
  await query(`INSERT INTO notify_keys (dedupe_key, status) VALUES ('platform:health:a', 'firing'), ('platform:health:b', 'firing'), ('other:c', 'firing')`);
  await insert("platform:health:b", "resolved", false);
  await insert("platform:health:d", "firing", false);
  await insert("platform:health:e", "firing", true);
  const rows = await query<{ dedupe_key: string; status: string }>(NOTIFY_KEY_STATUSES, [HEALTH_KEY_PREFIX]);
  assert.deepEqual(Object.fromEntries(rows.map((r) => [r.dedupe_key, r.status])), { "platform:health:a": "firing", "platform:health:b": "resolved", "platform:health:d": "firing" });
  const ok = validateEvent({ v: 1, source: "platform", type: "platform.sms_unknown", severity: "notice", dedupeKey: `${HEALTH_KEY_PREFIX}x`, status: "firing", title: "t", summary: "s" });
  assert.ok(ok.ok);
});
