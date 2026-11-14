// The lead's two emails (leads/lib/lead-mail.ts): queued with the lead,
// sent through Resend by f/leads/sync_crm, retried and capped, on real
// Postgres (test-db.mts).
import assert from "node:assert/strict";
import test from "node:test";
import { LEADS_SCHEMA, testDb } from "./test-db.mts";
import { saveLead } from "./leads/lib/run-leads.ts";
import { checkLead, type Lead } from "./leads/lib/lead.ts";
import { leadMailer, runLeadMail, type LeadEmail, type LeadMailDeps } from "./leads/lib/lead-mail.ts";
import type { SendResult } from "./notify/lib/ntfy.ts";
import type { EmitInput } from "./notify/lib/emit.ts";
import type { Query } from "./talent/lib/db.ts";

const lead: Lead = {
  caseId: "REQ-20261114-0A1B2C3D",
  receivedAt: "2026-11-14T05:00:00.000Z",
  channel: "web",
  name: "Asha Rawat",
  company: "Acme Foods",
  jobTitle: null,
  phone: "+91 98765 43210",
  email: "asha@acme.example",
  services: ["packing"],
  headcount: null,
  headcountBand: "50-99",
  site: "SIDCUL Haridwar, Uttarakhand",
  cluster: "haridwar",
  startWindow: null,
  targetStartDate: null,
  requestType: "crew",
  enquiry: "Case REQ-20261114-0A1B2C3D\nWork: Packing",
  sourcePath: null,
  mail: {
    staff: { subject: "Crew request: Asha Rawat, Acme Foods", text: "Crew request\n\nName: Asha Rawat", html: "<!doctype html><h1>Asha Rawat</h1>" },
    buyer: { subject: "We have your crew request (REQ-20261114-0A1B2C3D)", text: "Hello Asha," },
  },
};

/** The lead as an older sender sends it: no emails. */
const withoutMail = (l: Lead): Lead => Object.fromEntries(Object.entries(l).filter(([k]) => k !== "mail")) as Lead;

const senders = { staffFrom: "Website <website@notify.test>", buyerFrom: "VSPL <enquiries@notify.test>", inbox: "help@example.test" };

function deps(query: Query, answer: (email: LeadEmail) => SendResult = () => ({ ok: true, retryable: false })) {
  const sent: { email: LeadEmail; key: string }[] = [];
  const events: EmitInput[] = [];
  const d: LeadMailDeps = {
    query,
    ...senders,
    send: async (email, key) => {
      sent.push({ email, key });
      return answer(email);
    },
    notify: async (e) => (events.push(e), true),
    log: () => {},
  };
  return { d, sent, events };
}

const deliveries = async (query: Query) =>
  (await query<{ target: string; status: string; attempts: number }>(`SELECT target, status, attempts FROM deliveries ORDER BY target`)).map(
    (r) => `${r.target}:${r.status}/${r.attempts}`,
  );

test("the contract accepts a lead with its emails, and one without (older senders)", () => {
  assert.equal(checkLead(lead).ok, true);
  assert.equal(checkLead(withoutMail(lead)).ok, true);
  assert.equal(checkLead({ ...lead, mail: { staff: lead.mail!.staff } }).ok, false, "buyer is required (null for none)");
});

test("a lead queues its emails with the CRM delivery: a buyer copy only with an address", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  await saveLead(query, lead);
  assert.deepEqual(await deliveries(query), ["buyer_mail:pending/0", "crm:pending/0", "staff_mail:pending/0"]);
  const { query: q2 } = await testDb(LEADS_SCHEMA);
  await saveLead(q2, { ...lead, email: null });
  assert.deepEqual(await deliveries(q2), ["crm:pending/0", "staff_mail:pending/0"]);
  const { query: q3 } = await testDb(LEADS_SCHEMA);
  await saveLead(q3, withoutMail(lead));
  assert.deepEqual(await deliveries(q3), ["crm:pending/0"]);
});

test("the schema upgrades a database made when only 'crm' was allowed", async () => {
  const old = LEADS_SCHEMA.replace("CHECK (target IN ('crm', 'staff_mail', 'buyer_mail'))", "CHECK (target IN ('crm'))").replace(
    /ALTER TABLE deliveries[^\n]*\n/g,
    "",
  );
  const { query, exec } = await testDb(old);
  await assert.rejects(saveLead(query, lead));
  await exec(LEADS_SCHEMA);
  assert.equal((await saveLead(query, lead)).created, true);
});

test("sends the staff email to the inbox (replies to the person) and the copy to the person (replies to the inbox), once", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  const { leadId } = await saveLead(query, lead);
  const { d, sent } = deps(query);
  assert.deepEqual(await runLeadMail(d, { leadId }), { sent: 2, retried: 0, dead: 0 });
  const staff = sent.find((s) => s.email.to === senders.inbox)!;
  assert.deepEqual(staff.email, { from: senders.staffFrom, to: senders.inbox, replyTo: "asha@acme.example", ...lead.mail!.staff });
  assert.equal(staff.key, "lead-mail:staff_mail:REQ-20261114-0A1B2C3D");
  const buyer = sent.find((s) => s.email.to === "asha@acme.example")!;
  assert.deepEqual(buyer.email, { from: senders.buyerFrom, to: "asha@acme.example", replyTo: senders.inbox, ...lead.mail!.buyer! });
  assert.deepEqual(await deliveries(query), ["buyer_mail:done/1", "crm:pending/0", "staff_mail:done/1"]);
  // Nothing due: nothing sent again.
  assert.deepEqual(await runLeadMail(d), { sent: 0, retried: 0, dead: 0 });
  assert.equal(sent.length, 2);
});

test("an agent's lead: the staff email replies to the inbox, not the address the agent gave", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  await saveLead(query, { ...lead, caseId: "AGT-20261114-0A1B2C3D", channel: "agent", mail: { ...lead.mail!, buyer: null } });
  const { d, sent } = deps(query);
  await runLeadMail(d);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].email.replyTo, senders.inbox);
});

test("a failure backs off and retries; at the cap the staff email raises lead.email_failed without personal data", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  await saveLead(query, { ...lead, email: null });
  const { d, events } = deps(query, () => ({ ok: false, retryable: true, error: "resend HTTP 503 down" }));
  assert.deepEqual(await runLeadMail(d), { sent: 0, retried: 1, dead: 0 });
  assert.deepEqual(await deliveries(query), ["crm:pending/0", "staff_mail:pending/1"]);
  // Not due yet: the backoff holds it.
  assert.deepEqual(await runLeadMail(d), { sent: 0, retried: 0, dead: 0 });
  await query(`UPDATE deliveries SET attempts = max_attempts - 1, next_attempt_at = now() WHERE target = 'staff_mail'`);
  assert.deepEqual(await runLeadMail(d), { sent: 0, retried: 0, dead: 1 });
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "lead.email_failed");
  assert.equal(events[0].dedupeKey, "lead-email:REQ-20261114-0A1B2C3D");
  assert.match(events[0].summary, /HTTP 503/);
  assert.doesNotMatch(JSON.stringify(events[0]), /Asha|Acme|98765|asha@|down/);
});

test("a refusal that will not change (422) is dead at once", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  await saveLead(query, lead);
  const { d, events } = deps(query, (email) => (email.to === senders.inbox ? { ok: true, retryable: false } : { ok: false, retryable: false, error: "resend HTTP 422 invalid to" }));
  assert.deepEqual(await runLeadMail(d), { sent: 1, retried: 0, dead: 1 });
  assert.equal(events.length, 0, "only the staff email raises a notification");
});

test("leadMailer: plain text through Resend with the Idempotency-Key; no key is retried later, not dropped", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fake = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ id: "m1" }), { status: 200 });
  }) as typeof fetch;
  const email: LeadEmail = { from: senders.staffFrom, to: senders.inbox, replyTo: "asha@acme.example", subject: "S", text: "T" };
  assert.deepEqual(await leadMailer("re_test", fake)(email, "k1"), { ok: true, retryable: false });
  assert.equal(calls[0].url, "https://api.resend.com/emails");
  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers["idempotency-key"], "k1");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { from: senders.staffFrom, to: [senders.inbox], reply_to: "asha@acme.example", subject: "S", text: "T" });
  // With an HTML part, both go (Resend sends multipart/alternative).
  await leadMailer("re_test", fake)({ ...email, html: "<p>H</p>" }, "k3");
  assert.equal(JSON.parse(String(calls[1].init.body)).html, "<p>H</p>");
  assert.equal((await leadMailer("set-by-owner", fake)(email, "k2")).retryable, true);
  assert.equal(calls.length, 2);
});
