// Enquiry erasure end to end (f/leads/erase): the lead inbox in PGlite, Twenty
// in memory. A lead is saved and synced as in production, then a request by
// case ID or phone removes it from Twenty and the inbox, keeping only counts.
// Made-up data only: the repository is public.
import assert from "node:assert/strict";
import test from "node:test";
import { LEADS_SCHEMA, testDb } from "./test-db.mts";
import { runLeadsSync, saveLead } from "./leads/lib/run-leads.ts";
import { runLeadErasure } from "./leads/lib/erase.ts";
import type { Lead } from "./leads/lib/lead.ts";
import type { Twenty, TwentyRecord } from "./talent/lib/twenty.ts";
import type { Query } from "./talent/lib/db.ts";

const PLURALS = ["people", "companies", "opportunities", "communications", "applications", "attachments", "noteTargets", "notes", "taskTargets", "tasks"];

function fakeTwenty() {
  const store: Record<string, TwentyRecord[]> = Object.fromEntries(PLURALS.map((p) => [p, []]));
  let n = 0;
  const get = (r: TwentyRecord, path: string) => path.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown> | undefined)?.[k], r);
  const crm: Twenty = {
    async find(plural, filter) {
      const trashed = filter.match(/^and\((.+),deletedAt\[is\]:NOT_NULL\)$/);
      const m = (trashed?.[1] ?? filter).match(/^(.+)\[eq\]:(".*")$/);
      if (!m) throw new Error(`bad filter ${filter}`);
      const value = JSON.parse(m[2]);
      return store[plural].filter((r) => get(r, m[1]) === value && Boolean(r.deletedAt) === Boolean(trashed));
    },
    async create(plural, _singular, body) {
      const record = { id: `${plural}-${++n}`, ...body } as TwentyRecord;
      store[plural].push(record);
      return record;
    },
    async update(plural, id, body) {
      Object.assign(store[plural].find((x) => x.id === id)!, body);
    },
    async remove(plural, id) {
      const before = store[plural].length;
      store[plural] = store[plural].filter((x) => x.id !== id);
      return store[plural].length < before;
    },
  };
  return { crm, store };
}

const lead = (over: Partial<Lead> = {}): Lead => ({
  caseId: "REQ-20261018-0A1B2C3D",
  receivedAt: "2026-10-18T05:00:00.000Z",
  channel: "web",
  name: "Test Buyer",
  company: "Example Industries",
  jobTitle: null,
  phone: "+91 98765 43211",
  email: "buyer@example.com",
  services: ["packing"],
  headcount: null,
  headcountBand: "50-99",
  site: "Plot 1, Example Estate",
  cluster: "haridwar",
  startWindow: "2-4-weeks",
  targetStartDate: null,
  requestType: "crew",
  enquiry: "Case REQ-20261018-0A1B2C3D\nWork: Packing",
  sourcePath: "/contact",
  ...over,
});

async function inbox(...leads: Lead[]) {
  const { query } = await testDb(LEADS_SCHEMA);
  const t = fakeTwenty();
  for (const l of leads) await saveLead(query, l);
  await runLeadsSync({ query, crm: t.crm, log: () => {} });
  return { query, t };
}

const request = (query: Query, by: { caseId?: string; phone?: string }) =>
  query(`INSERT INTO erasure_requests (case_id, phone) VALUES ($1, $2) RETURNING id`, [by.caseId ?? null, by.phone ?? null]);

const count = (t: ReturnType<typeof fakeTwenty>) => Object.fromEntries(PLURALS.map((p) => [p, t.store[p].length]).filter(([, c]) => c));

test("by case ID: crew request, enquiry, contact, company and the inbox row go; only counts stay", async () => {
  const { query, t } = await inbox(lead());
  assert.deepEqual(count(t), { people: 1, companies: 1, opportunities: 1, communications: 1 });
  const opp = t.store.opportunities[0];
  await t.crm.create("attachments", "Attachment", { name: "site-plan.pdf", targetOpportunityId: opp.id });
  const note = await t.crm.create("notes", "Note", { title: "Called back" });
  await t.crm.create("noteTargets", "NoteTarget", { noteId: note.id, targetOpportunityId: opp.id });
  await request(query, { caseId: "REQ-20261018-0A1B2C3D" });

  const r = await runLeadErasure({ query, crm: t.crm });
  assert.deepEqual(r.erased && { leads: r.erased.leads, opportunities: r.erased.opportunities, people: r.erased.people, companies: r.erased.companies, files: r.erased.files }, { leads: 1, opportunities: 1, people: 1, companies: 1, files: 1 });
  assert.deepEqual(count(t), {});
  assert.deepEqual(await query(`SELECT count(*)::int AS n FROM leads`), [{ n: 0 }]);
  assert.deepEqual(await query(`SELECT count(*)::int AS n FROM deliveries`), [{ n: 0 }]);
  const [done] = await query<Record<string, unknown>>(`SELECT status, case_id, phone, removed_leads, removed_opportunities, removed_people, removed_companies, removed_crm_files FROM erasure_requests`);
  assert.deepEqual(done, { status: "done", case_id: null, phone: null, removed_leads: 1, removed_opportunities: 1, removed_people: 1, removed_companies: 1, removed_crm_files: 1 });
  assert.equal((await runLeadErasure({ query, crm: t.crm })).erased, null, "nothing queued: nothing to do");
});

test("by phone: every enquiry from that number goes, whatever its format; another number's stays", async () => {
  const { query, t } = await inbox(
    lead(),
    lead({ caseId: "REQ-20261018-0B1B2C3D", phone: "09876543211", company: null }),
    lead({ caseId: "REQ-20261018-0C1B2C3D", phone: "+91 91234 56789", name: "Other Buyer", company: "Other Works", email: null }),
  );
  await request(query, { phone: "+919876543211" });
  const r = await runLeadErasure({ query, crm: t.crm });
  assert.equal(r.erased?.leads, 2);
  assert.deepEqual((await query<{ case_id: string }>(`SELECT case_id FROM leads`)).map((l) => l.case_id), ["REQ-20261018-0C1B2C3D"]);
  assert.deepEqual(t.store.opportunities.map((o) => o.caseId), ["REQ-20261018-0C1B2C3D"]);
  assert.deepEqual(t.store.companies.map((c) => c.name), ["Other Works"]);
  assert.deepEqual(t.store.people.map((p) => (p.name as { firstName: string }).firstName), ["Other Buyer"]);
});

test("by case ID, one of two enquiries from a contact: the contact and company stay for the other", async () => {
  const { query, t } = await inbox(lead(), lead({ caseId: "REQ-20261018-0B1B2C3D" }));
  await request(query, { caseId: "REQ-20261018-0A1B2C3D" });
  const r = await runLeadErasure({ query, crm: t.crm });
  assert.deepEqual([r.erased?.opportunities, r.erased?.people, r.erased?.companies], [1, 0, 0]);
  assert.deepEqual(count(t), { people: 1, companies: 1, opportunities: 1, communications: 1 });
});

test("a company someone else is on, or with staff notes, stays; a note linked elsewhere too stays", async () => {
  const { query, t } = await inbox(lead());
  const [company] = t.store.companies;
  const colleague = await t.crm.create("people", "Person", { name: { firstName: "Colleague" }, companyId: company.id, personType: "CLIENT_CONTACT" });
  const shared = await t.crm.create("notes", "Note", { title: "Visit plan" });
  await t.crm.create("noteTargets", "NoteTarget", { noteId: shared.id, targetOpportunityId: t.store.opportunities[0].id });
  await t.crm.create("noteTargets", "NoteTarget", { noteId: shared.id, targetPersonId: colleague.id });
  await request(query, { caseId: "REQ-20261018-0A1B2C3D" });
  await runLeadErasure({ query, crm: t.crm });
  assert.deepEqual(t.store.companies.map((c) => c.id), [company.id]);
  assert.deepEqual(t.store.people.map((p) => p.id), [colleague.id]);
  assert.deepEqual(t.store.notes.map((n) => n.id), [shared.id], "still linked to the colleague");
  assert.equal(t.store.noteTargets.length, 1);
});

test("a contact who is also an applicant keeps the worker side, under the applicant's name", async () => {
  const { query, t } = await inbox(lead());
  const [person] = t.store.people;
  await t.crm.create("applications", "Application", { name: "VS-J-ABC234", personId: person.id });
  await request(query, { caseId: "REQ-20261018-0A1B2C3D" });
  const r = await runLeadErasure({ query, crm: t.crm });
  assert.equal(r.erased?.people, 0);
  assert.equal(t.store.people.length, 1);
  assert.deepEqual(
    [t.store.people[0].personType, t.store.people[0].companyId, t.store.people[0].jobTitle, t.store.people[0].name],
    ["WORKER", null, "", { firstName: "Applicant VS-J-ABC234", lastName: "" }],
  );
  assert.deepEqual((t.store.people[0].emails as { primaryEmail: string }).primaryEmail, "");
  assert.equal(t.store.applications.length, 1);
  assert.equal(t.store.companies.length, 0);
});

test("a lead not yet in Twenty is erased from the inbox, and its delivery with it", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  const t = fakeTwenty();
  await saveLead(query, lead());
  await request(query, { caseId: "REQ-20261018-0A1B2C3D" });
  assert.equal((await runLeadErasure({ query, crm: t.crm })).erased?.leads, 1);
  assert.deepEqual(await query(`SELECT count(*)::int AS n FROM deliveries`), [{ n: 0 }]);
});

test("a Twenty failure keeps every row; the request retries, then fails at three attempts", async () => {
  const { query, t } = await inbox(lead());
  const broken: Twenty = { ...t.crm, remove: async () => { throw new Error("Twenty DELETE /opportunities: HTTP 503"); } };
  await request(query, { caseId: "REQ-20261018-0A1B2C3D" });
  for (let i = 1; i <= 3; i++) {
    await assert.rejects(runLeadErasure({ query, crm: broken }), /HTTP 503/);
    const [r] = await query<{ status: string; attempts: number; last_error: string }>(`SELECT status, attempts, last_error FROM erasure_requests`);
    assert.deepEqual([r.status, r.attempts], [i < 3 ? "pending" : "failed", i]);
    assert.match(r.last_error, /HTTP 503/);
  }
  assert.deepEqual(await query(`SELECT count(*)::int AS n FROM leads`), [{ n: 1 }]);
});

test("a run while the lead sync holds its lock waits for the next run", async () => {
  const { query, t } = await inbox(lead());
  await request(query, { caseId: "REQ-20261018-0A1B2C3D" });
  const r = await runLeadErasure({ query: (async (text: string, params?: unknown[]) => (/pg_try_advisory_lock/.test(text) ? [{ locked: false }] : query(text, params))) as Query, crm: t.crm });
  assert.equal(r.skipped, "the lead sync is running");
  assert.deepEqual(await query(`SELECT status, attempts FROM erasure_requests`), [{ status: "pending", attempts: 0 }]);
});

test("a request needs a case ID or a phone", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  await assert.rejects(query(`INSERT INTO erasure_requests (case_id, phone) VALUES (NULL, NULL)`), /check/i);
});
