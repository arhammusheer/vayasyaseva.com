// Minimum wage rate alerts (rate_alert.v1): the subscriber list on real
// Postgres (test-db.mts), the emails, the signed route and the hand-run send.
import assert from "node:assert/strict";
import test from "node:test";
import { LEADS_SCHEMA, testDb } from "./test-db.mts";
import { ALERT_MAIL_GAP_MS, runAlertAction, runAlertSend } from "./leads/lib/run-alerts.ts";
import { alertConfirmEmail, alertMailer, alertRatesEmail, alertStateList, type AlertEmail, type AlertMailer } from "./leads/lib/alert-mail.ts";
import { runSubmission } from "./platform/lib/run-submission.ts";
import type { RateAlertCanonical } from "../../packages/contracts/src/rate-alert.v1.ts";
import type { EmitInput } from "./notify/lib/emit.ts";
import type { Query } from "./talent/lib/db.ts";
import { alertOf, ledeOf, longDate } from "./alerts-send.mts";

const TOKEN_A = "A".repeat(43);
const TOKEN_B = "B".repeat(43);
const at = "2026-11-10T09:30:00.000Z";
const subscribe = (over: Partial<Extract<RateAlertCanonical, { action: "subscribe" }>> = {}): RateAlertCanonical => ({
  action: "subscribe", ref: "ALR-20261110-0A1B2C3D", receivedAt: at, email: "hr@example.com", states: ["uttarakhand"], sourcePath: "/minimum-wages/uttarakhand", noticeVersion: "2026-11-10", ...over,
});
const confirm = (token: string): RateAlertCanonical => ({ action: "confirm", ref: "ALR-20261110-0A1B2C3E", receivedAt: at, token });
const unsubscribe = (token: string): RateAlertCanonical => ({ action: "unsubscribe", ref: "ALR-20261110-0A1B2C3F", receivedAt: at, token });

function outbox(result: () => { ok: boolean; retryable: boolean; error?: string } = () => ({ ok: true, retryable: false })) {
  const sent: { email: AlertEmail; key: string }[] = [];
  const mail: AlertMailer = {
    async send(email, key) {
      const r = result();
      if (r.ok) sent.push({ email, key });
      return r;
    },
  };
  return { sent, mail };
}

const rows = (query: Query) => query<{ email: string; status: string; states: string[]; token: string }>(`SELECT email, status, states, token FROM alert_subscribers ORDER BY email`);

test("subscribe saves a pending address and sends one confirmation; nothing else goes until it is confirmed", async () => {
  const { query } = await testDb(LEADS_SCHEMA, LEADS_SCHEMA);
  const { sent, mail } = outbox();
  let clock = Date.parse(at);
  const deps = { query, mail, now: () => new Date(clock), newToken: () => TOKEN_A };
  assert.deepEqual(await runAlertAction(subscribe(), deps), { wm_status_code: 202, result: { ok: true } });
  assert.deepEqual(await rows(query), [{ email: "hr@example.com", status: "pending", states: ["uttarakhand"], token: TOKEN_A }]);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].email.subject, "Confirm your minimum wage alerts");
  assert.match(sent[0].email.text, /minimum wage rates change in Uttarakhand\./);
  assert.ok(sent[0].email.text.includes(`https://www.vayasyaseva.com/en-in/alerts#confirm=${TOKEN_A}`));
  assert.equal(sent[0].email.headers, undefined, "nothing to unsubscribe from yet");
  assert.equal(sent[0].key, "alert-pending:ALR-20261110-0A1B2C3D");

  // Asked again a minute later, with another state: the state is added, no second email, the same link stays good.
  clock += 60_000;
  const again = await runAlertAction(subscribe({ ref: "ALR-20261110-0A1B2C40", states: ["punjab"] }), { ...deps, newToken: () => TOKEN_B });
  assert.equal(again.wm_status_code, 202);
  assert.equal(sent.length, 1);
  assert.deepEqual((await rows(query))[0], { email: "hr@example.com", status: "pending", states: ["punjab", "uttarakhand"], token: TOKEN_A });

  // After the gap a fresh confirmation goes, naming both states.
  clock += ALERT_MAIL_GAP_MS;
  await runAlertAction(subscribe({ ref: "ALR-20261110-0A1B2C41" }), deps);
  assert.equal(sent.length, 2);
  assert.match(sent[1].email.text, /Punjab and Uttarakhand/);

  // A pending address gets no alert.
  const send = await runAlertSend({ state: "uttarakhand", revision: "2026-10-01", subject: "s", lines: ["l"] }, { query, mail, pause: async () => {} });
  assert.deepEqual([send.due, send.sent], [0, 0]);
});

test("confirm and unsubscribe work by token; an unknown token is 404; the hub hears of a new subscriber once, without the address", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  const { mail } = outbox();
  const events: EmitInput[] = [];
  const deps = { query, mail, newToken: () => TOKEN_A, notify: async (e: EmitInput) => (events.push(e), true) };
  await runAlertAction(subscribe({ states: ["uttarakhand", "punjab"] }), deps);
  assert.deepEqual(await runAlertAction(confirm(TOKEN_B), deps), { wm_status_code: 404, result: { ok: false, error: "unknown_token" } });
  assert.deepEqual(await runAlertAction(confirm(TOKEN_A), deps), { wm_status_code: 200, result: { ok: true, states: ["punjab", "uttarakhand"] } });
  assert.equal((await rows(query))[0].status, "confirmed");
  // The link opened twice is the same as once.
  assert.equal((await runAlertAction(confirm(TOKEN_A), deps)).wm_status_code, 200);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "alert.subscribed");
  assert.equal(events[0].title, "New rate alert subscriber: Punjab and Uttarakhand");
  assert.doesNotMatch(JSON.stringify(events[0]), /hr@example\.com/);

  assert.equal((await runAlertAction(unsubscribe(TOKEN_B), deps)).wm_status_code, 404);
  assert.deepEqual(await runAlertAction(unsubscribe(TOKEN_A), deps), { wm_status_code: 200, result: { ok: true, states: ["punjab", "uttarakhand"] } });
  assert.deepEqual(await rows(query), [], "unsubscribing deletes the row");
  assert.equal((await runAlertAction(unsubscribe(TOKEN_A), deps)).wm_status_code, 404);
});

test("a confirmed address that asks again gets a short note with the unsubscribe link, never a new confirmation", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  const { sent, mail } = outbox();
  let clock = Date.parse(at);
  const deps = { query, mail, now: () => new Date(clock), newToken: () => TOKEN_A };
  await runAlertAction(subscribe(), deps);
  await runAlertAction(confirm(TOKEN_A), deps);
  clock += ALERT_MAIL_GAP_MS;
  await runAlertAction(subscribe({ ref: "ALR-20261110-0A1B2C42", states: ["delhi"] }), deps);
  assert.equal(sent.length, 2);
  assert.equal(sent[1].email.subject, "Your minimum wage alerts");
  assert.match(sent[1].email.text, /now follows Delhi and Uttarakhand/);
  assert.ok(sent[1].email.text.includes(`/en-in/alerts#stop=${TOKEN_A}`));
  assert.equal(sent[1].email.headers?.["List-Unsubscribe"], `<https://www.vayasyaseva.com/api/alerts/unsubscribe?t=${TOKEN_A}>`);
  assert.equal(sent[1].email.headers?.["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  assert.equal((await rows(query))[0].status, "confirmed");
});

test("an email that cannot be sent answers 502 (try again) or 503 (not set up), and the next try still sends", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  let result = { ok: false, retryable: true, error: "resend HTTP 500 hr@example.com" };
  const { sent, mail } = outbox(() => result);
  const deps = { query, mail, newToken: () => TOKEN_A };
  assert.deepEqual(await runAlertAction(subscribe(), deps), { wm_status_code: 502, result: { ok: false, error: "email_not_sent" } });
  result = { ok: false, retryable: false, error: "resend is not configured" };
  assert.equal((await runAlertAction(subscribe(), deps)).wm_status_code, 503);
  result = { ok: true, retryable: false, error: "" };
  assert.equal((await runAlertAction(subscribe(), deps)).wm_status_code, 202);
  assert.equal(sent.length, 1, "no gap is counted for an email that never went");
});

test("an address never confirmed is deleted after seven days, when someone next subscribes", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  const { mail } = outbox();
  await runAlertAction(subscribe({ email: "old@example.com" }), { query, mail, newToken: () => TOKEN_A });
  await runAlertAction(subscribe({ email: "kept@example.com", ref: "ALR-20261110-0A1B2C43" }), { query, mail, newToken: () => TOKEN_B });
  await runAlertAction(confirm(TOKEN_B), { query, mail });
  await query(`UPDATE alert_subscribers SET created_at = now() - interval '8 days'`);
  await runAlertAction(subscribe({ email: "new@example.com", ref: "ALR-20261110-0A1B2C44" }), { query, mail, newToken: () => "C".repeat(43) });
  assert.deepEqual((await rows(query)).map((r) => r.email), ["kept@example.com", "new@example.com"]);
});

test("send: each confirmed follower of the state once per revision; a dry run only counts; a re-run skips who had it", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  const tokens = ["A", "B", "C", "D"].map((c) => c.repeat(43));
  let n = 0;
  const { mail } = outbox();
  const people: [string, string[], boolean][] = [
    ["a@example.com", ["uttarakhand"], true],
    ["b@example.com", ["uttarakhand", "punjab"], true],
    ["c@example.com", ["punjab"], true],
    ["d@example.com", ["uttarakhand"], false],
  ];
  for (const [email, states, confirmed] of people) {
    const token = tokens[n++];
    await runAlertAction(subscribe({ email, states, ref: `ALR-20261110-0000000${n}` }), { query, mail, newToken: () => token });
    if (confirmed) await runAlertAction(confirm(token), { query, mail });
  }
  const content = { state: "uttarakhand", revision: "2026-10-01", subject: "Uttarakhand minimum wages changed from 1 October 2026", lines: ["From 1 October 2026, an unskilled worker must get at least ₹13,134 a month."] };
  const out = outbox();
  const pauses: number[] = [];
  const deps = { query, mail: out.mail, pause: async (ms: number) => void pauses.push(ms) };

  const dry = await runAlertSend({ ...content, dryRun: true }, deps);
  assert.deepEqual([dry.dryRun, dry.due, dry.sent], [true, 2, 0]);
  assert.deepEqual(dry.subscribers, { punjab: 2, uttarakhand: 2 });
  assert.equal(out.sent.length, 0);

  const first = await runAlertSend(content, deps);
  assert.deepEqual([first.due, first.sent, first.failed], [2, 2, 0]);
  assert.deepEqual(out.sent.map((s) => s.email.to), ["a@example.com", "b@example.com"]);
  assert.equal(pauses.length, 1, "a pause between sends, not before the first");
  const mailA = out.sent[0].email;
  assert.equal(mailA.subject, content.subject);
  assert.ok(mailA.text.includes("₹13,134"));
  assert.ok(mailA.text.includes("https://www.vayasyaseva.com/en-in/minimum-wages/uttarakhand"));
  assert.ok(mailA.text.includes(`/en-in/alerts#stop=${tokens[0]}`), "each email carries its own unsubscribe link");
  assert.ok(mailA.headers?.["List-Unsubscribe"]?.includes(tokens[0]));

  const again = await runAlertSend(content, deps);
  assert.deepEqual([again.due, again.sent], [0, 0]);
  // The next revision goes to them again; someone who unsubscribed gets nothing.
  await runAlertAction(unsubscribe(tokens[0]), { query, mail });
  const next = await runAlertSend({ ...content, revision: "2027-04-01" }, deps);
  assert.deepEqual([next.due, next.sent], [1, 1]);
  assert.equal(out.sent.at(-1)?.email.to, "b@example.com");
});

test("send: a failed email stays due; a refusal that would repeat stops the run", async () => {
  const { query } = await testDb(LEADS_SCHEMA);
  const { mail } = outbox();
  for (const [i, email] of ["a@example.com", "b@example.com", "c@example.com"].entries()) {
    const token = String(i).repeat(43);
    await runAlertAction(subscribe({ email, ref: `ALR-20261110-1000000${i}` }), { query, mail, newToken: () => token });
    await runAlertAction(confirm(token), { query, mail });
  }
  const content = { state: "uttarakhand", revision: "2026-10-01", subject: "s", lines: ["l"] };
  let call = 0;
  const flaky = outbox(() => (++call === 2 ? { ok: false, retryable: true, error: "resend HTTP 500" } : { ok: true, retryable: false }));
  const first = await runAlertSend(content, { query, mail: flaky.mail, pause: async () => {} });
  assert.deepEqual([first.due, first.sent, first.failed], [3, 2, 1]);
  const second = await runAlertSend(content, { query, mail: flaky.mail, pause: async () => {} });
  assert.deepEqual([second.due, second.sent], [1, 1]);

  const off = outbox(() => ({ ok: false, retryable: false, error: "resend is not configured" }));
  const stopped = await runAlertSend({ ...content, revision: "2027-04-01" }, { query, mail: off.mail, pause: async () => {} });
  assert.deepEqual([stopped.due, stopped.sent, stopped.failed], [3, 0, 1]);
});

test("the emails: plain text and HTML agree, HTML is escaped, state lists read naturally", () => {
  assert.equal(alertStateList(["uttar-pradesh"]), "Uttar Pradesh");
  assert.equal(alertStateList(["punjab", "delhi", "andhra-pradesh"]), "Punjab, Delhi and Andhra Pradesh");
  const confirmMail = alertConfirmEmail("hr@example.com", ["punjab"], TOKEN_A);
  assert.ok(confirmMail.html.includes(`href="https://www.vayasyaseva.com/en-in/alerts#confirm=${TOKEN_A}"`));
  assert.match(confirmMail.text, /deleted after 7 days/);
  const rates = alertRatesEmail("hr@example.com", { state: "punjab", subject: "s", lines: ["Rates <rose> & more"] }, TOKEN_A);
  assert.ok(rates.html.includes("Rates &lt;rose&gt; &amp; more"));
  assert.ok(rates.text.includes("Rates <rose> & more"));
  assert.match(rates.text, /You get this because you asked for alerts on Punjab's minimum wages\./);
  assert.match(rates.text, /Stop these emails:\nhttps:\/\/www\.vayasyaseva\.com\/en-in\/alerts#stop=/);
});

test("the mailer posts to Resend with the Idempotency-Key and reply address; without a key it sends nothing", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => (calls.push({ url, init }), new Response("{}", { status: 200 }))) as unknown as typeof fetch;
  const email = alertConfirmEmail("hr@example.com", ["punjab"], TOKEN_A);
  const ok = await alertMailer("re_key", "Vayasya Seva <alerts@notify.vayasyaseva.com>", "help@vayasyaseva.com", fetchImpl).send(email, "alert-pending:ALR-1");
  assert.deepEqual(ok, { ok: true, retryable: false });
  assert.equal(calls[0].url, "https://api.resend.com/emails");
  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers["idempotency-key"], "alert-pending:ALR-1");
  const body = JSON.parse(String(calls[0].init.body));
  assert.deepEqual([body.from, body.to, body.reply_to, body.subject], ["Vayasya Seva <alerts@notify.vayasyaseva.com>", ["hr@example.com"], "help@vayasyaseva.com", email.subject]);
  assert.ok(body.html && body.text);
  for (const key of ["", "set-by-owner"]) {
    assert.deepEqual(await alertMailer(key, "f", "r", fetchImpl).send(email, "k"), { ok: false, retryable: false, error: "resend is not configured" });
  }
  assert.equal(calls.length, 1);
  const refused = (async () => new Response("bad", { status: 422 })) as unknown as typeof fetch;
  assert.deepEqual(await alertMailer("re_key", "f", "r", refused).send(email, "k"), { ok: false, retryable: false, error: "resend HTTP 422 bad" });
});

test("the signed route runs a rate alert action from its envelope, and refuses one filed under another id", async () => {
  const leads = await testDb(LEADS_SCHEMA);
  const { sent, mail } = outbox();
  const d = {
    talent: async <T,>(): Promise<T> => { throw new Error("the talent database is not used"); },
    leads: <T,>(fn: (q: Query) => Promise<T>) => fn(leads.query),
    startDispatch: async () => {},
    startLeadSync: async () => {},
    alertMail: async () => mail,
  };
  const envelope = (payload: RateAlertCanonical, id = payload.ref) => ({ v: 1, sentAt: "2026-11-10T09:30:01.000Z", idempotencyKey: null, type: "rate_alert.v1", id, payload });
  assert.deepEqual(await runSubmission(true, envelope(subscribe()), d), { wm_status_code: 202, result: { ok: true } });
  assert.equal(sent.length, 1);
  const [{ token }] = await rows(leads.query);
  assert.deepEqual(await runSubmission(true, envelope(confirm(token)), d), { wm_status_code: 200, result: { ok: true, states: ["uttarakhand"] } });
  assert.equal((await runSubmission(true, envelope(confirm(token), "ALR-20261110-FFFFFFFF"), d)).wm_status_code, 400);
  assert.equal((await runSubmission(true, envelope({ ...subscribe(), states: [] } as RateAlertCanonical), d)).wm_status_code, 400);
  assert.equal((await runSubmission(false, envelope(subscribe()), d)).wm_status_code, 403);
});

test("the send command: the revision is the headline table's in-force date; the line is the page's opening sentence", () => {
  const wages = { state: "uttarakhand", name: "Uttarakhand", tables: [{ effectiveFrom: "2026-04-01" }, { headline: true, effectiveFrom: "2026-10-01" }] };
  assert.deepEqual(alertOf(wages), { state: "uttarakhand", revision: "2026-10-01", subject: "Uttarakhand minimum wages changed: in force from 1 October 2026" });
  assert.equal(longDate("2025-04-01"), "1 April 2025");
  const html = `<h1 class="rise">Minimum wages in<!-- --> Uttarakhand</h1><p class="rise rise-2 mt-6">From 1 October 2026, an unskilled worker in most Uttarakhand factories must get at least ₹13,134 a month, or <span>₹505.16</span> a day. Delhi&#x27;s differ.</p><p>Updated</p>`;
  assert.equal(ledeOf(html), "From 1 October 2026, an unskilled worker in most Uttarakhand factories must get at least ₹13,134 a month, or ₹505.16 a day. Delhi’s differ.");
  assert.equal(ledeOf("<h1>Title</h1><p>Short</p>"), null);
  assert.equal(ledeOf("<main></main>"), null);
});
