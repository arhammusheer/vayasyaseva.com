// The submission routes through the edge pipeline (src/server/submissions),
// per channel: the website forms need Turnstile, the agent routes do not;
// the status codes and bodies each route has always answered (400, 403,
// 409, 410, 413, 429, 202/200, 500/502/503); Idempotency-Key replays; and a
// failed staff email that still forwards the lead.
import assert from 'node:assert/strict';
import test from 'node:test';
import { importTs } from '../scripts/lib/register-ts.mjs';

process.env.TALENT_INTAKE_WEBHOOK_SECRET = 'unit-webhook-secret';
process.env.TALENT_INTAKE_WEB_SOURCE = '1';
process.env.TALENT_R2_ACCESS_KEY_ID = 'unit-key';
process.env.TALENT_R2_SECRET_ACCESS_KEY = 'unit-secret';
process.env.TURNSTILE_SECRET_KEY = 'unit-turnstile';

const { NextRequest } = await import('next/server.js');
const { runSubmission, setDeferForTests } = await importTs('src/server/submissions/pipeline.ts');
const { setTransport } = await importTs('src/server/submissions/transport.ts');
const { setIdempotencyStore, memoryIdempotencyStore } = await importTs('src/server/submissions/policies/idempotency.ts');
const routes = {
  ...(await importTs('src/server/submissions/types/business-enquiry.ts')),
  ...(await importTs('src/server/submissions/types/job-application.ts')),
  ...(await importTs('src/server/submissions/types/rate-alert.ts')),
};
const { issueTicket } = await importTs('src/lib/talent-intake/server.ts');

// --- The outside world -------------------------------------------------------------

const world = { leadFails: false, uploads: new Map(), deleted: [], applications: [], leads: [], applicationFails: false, notified: [], alerts: [], alertAnswer: { status: 202 } };
const deferred = [];
setDeferForTests((task) => deferred.push(task));
setTransport({
  async application(payload, meta) {
    if (world.applicationFails) throw new Error('intake webhook answered 500');
    world.applications.push({ payload, meta });
  },
  async lead(payload, meta) {
    // Windmill not taking it: the transport has already retried and answers false.
    if (world.leadFails) return false;
    world.leads.push({ payload, meta });
    return true;
  },
  async alert(payload) {
    world.alerts.push(payload);
    return world.alertAnswer;
  },
});
globalThis.fetch = async (input, init = {}) => {
  const url = String(input instanceof Request ? input.url : input);
  const method = init.method ?? (input instanceof Request ? input.method : 'GET');
  if (url.startsWith('https://challenges.cloudflare.com/')) {
    return Response.json({ success: new URLSearchParams(String(init.body)).get('response') === 'pass' });
  }
  if (url === 'https://hooks.test/api/r/webhook/vspl-notify') {
    world.notified.push({ secret: init.headers['x-vspl-notify-secret'], event: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify({ ok: true }), { status: 202 });
  }
  if (url.includes('.r2.cloudflarestorage.com/')) {
    const key = decodeURIComponent(new URL(url).pathname.split('/').slice(2).join('/'));
    if (method === 'DELETE') return world.deleted.push(key), new Response(null, { status: 204 });
    const size = world.uploads.get(key);
    return size === undefined ? new Response(null, { status: 404 }) : new Response(null, { status: 200, headers: { 'content-length': String(size) } });
  }
  throw new Error(`unexpected fetch ${method} ${url}`);
};

async function drain() {
  while (deferred.length) await deferred.shift()();
}

let ipCounter = 0;
const freshIp = () => `203.0.113.${++ipCounter}`;

async function post(route, { body, headers = {}, ip = freshIp(), raw } = {}) {
  const request = new NextRequest(`https://www.vayasyaseva.com${route.name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...headers },
    body: raw ?? JSON.stringify(body),
  });
  const response = await runSubmission(route, request);
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: response.status, json, headers: response.headers };
}

function reset() {
  Object.assign(world, { leadFails: false, deleted: [], applications: [], leads: [], applicationFails: false, notified: [], alerts: [], alertAnswer: { status: 202 } });
  world.uploads.clear();
  deferred.length = 0;
  setIdempotencyStore(memoryIdempotencyStore());
}

const enquiry = { name: 'Asha Rawat', phone: '+91 98765 43210', email: 'asha@acme.example', company: 'Acme Foods', roles: ['packing'], headcountBand: '50-99', siteState: 'UK', siteCity: 'SIDCUL Haridwar', startWindow: '2-4-weeks', durationBand: 'ongoing' };
const formHeaders = (extra = {}) => ({ 'x-turnstile-token': 'pass', 'x-contact-form-started-at': String(Date.now() - 60_000), ...extra });

// --- /api/contact (website form: Turnstile) ----------------------------------------

test('contact form: 400 for a body that is not JSON or breaks the contract', async () => {
  reset();
  const notJson = await post(routes.contactFormRoute, { raw: '{', headers: formHeaders() });
  assert.equal(notJson.status, 400);
  assert.deepEqual(notJson.json, { error: 'Invalid form data.' });
  const invalid = await post(routes.contactFormRoute, { body: { name: 'A' }, headers: formHeaders() });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.json.error, 'Invalid form data.');
  assert.ok(Array.isArray(invalid.json.details));
});

test('contact form: Turnstile is required (403 without or with a failed token, 503 when not configured)', async () => {
  reset();
  for (const token of [undefined, 'fail']) {
    const r = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders({ 'x-turnstile-token': token ?? '' }) });
    assert.equal(r.status, 403);
    assert.deepEqual(r.json, { error: "We couldn't verify this browser. Please complete the check and try again, or call us.", agentRoute: '/api/agent/contact' });
  }
  delete process.env.TURNSTILE_SECRET_KEY;
  try {
    const r = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders() });
    assert.equal(r.status, 503);
  } finally {
    process.env.TURNSTILE_SECRET_KEY = 'unit-turnstile';
  }
  assert.equal(world.leads.length, 0);
});

test('contact form: 200 with a case ID once Windmill has the lead, its two emails inside', async () => {
  reset();
  const r = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders() });
  assert.equal(r.status, 200);
  assert.equal(r.json.success, true);
  assert.match(r.json.caseId, /^REQ-\d{8}-[0-9A-F]{8}$/);
  assert.equal(world.leads.length, 1, 'handed over before the answer');
  const { mail, caseId } = world.leads[0].payload;
  assert.equal(caseId, r.json.caseId);
  assert.equal(mail.staff.subject, 'Crew request: Asha Rawat, Acme Foods · 50 to 99 workers');
  assert.match(mail.staff.html, /^<!doctype html>/);
  assert.match(mail.staff.text, /^Crew request\n/);
  assert.match(mail.buyer.subject, /^We have your crew request \(REQ-/);
  assert.doesNotMatch(mail.buyer.text, /Qualified|Privacy notice/);
});

test('contact form: a call back (name, company, phone, workers) is a lead like any other, answered with its own promise', async () => {
  reset();
  const callback = { name: 'Asha Rawat', company: 'Acme Foods', phone: '+91 98765 43210', requestType: 'callback', headcountBand: '20-49', sourcePath: '/services/factory-labour' };
  const r = await post(routes.contactFormRoute, { body: callback, headers: formHeaders() });
  assert.equal(r.status, 200);
  assert.match(r.json.caseId, /^REQ-\d{8}-[0-9A-F]{8}$/);
  assert.equal(r.json.message, 'Call back requested. We aim to call you within one working day (Monday to Saturday, IST).');
  assert.equal(world.leads.length, 1);
  const lead = world.leads[0].payload;
  assert.equal(lead.mail.buyer, null, 'the staff email only: no address for a copy');
  assert.match(lead.mail.staff.text, /^Call back request\n\nPhone them within one working day\./);
  assert.equal(lead.requestType, 'callback');
  assert.equal(lead.headcountBand, '20-49');
  assert.equal(lead.email, null);
  assert.match(lead.enquiry, /Request: A call back/);
  assert.match(lead.enquiry, /Flags: call back requested \(phone within one working day\)/);
  // Without the number of workers it is not a request.
  const bare = await post(routes.contactFormRoute, { body: { ...callback, headcountBand: undefined }, headers: formHeaders() });
  assert.equal(bare.status, 400);
});

test('contact form: 429 for the honeypot, a form sent too fast, and a second enquiry from the same IP', async () => {
  reset();
  assert.equal((await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders({ 'x-contact-form-honeypot': 'bot' }) })).status, 429);
  assert.equal((await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders({ 'x-contact-form-started-at': String(Date.now()) }) })).status, 429);
  const ip = freshIp();
  assert.equal((await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders(), ip })).status, 200);
  const again = await post(routes.contactFormRoute, { body: { ...enquiry, email: 'other@acme.example' }, headers: formHeaders(), ip });
  assert.equal(again.status, 429);
  assert.deepEqual(again.json, { error: 'Too many submissions. Please try again shortly.' });
});

test('contact form: 500 when Windmill does not take the lead; the retry keeps the case ID', async () => {
  reset();
  world.leadFails = true;
  const ip = freshIp();
  const key = 'contact-retry-key-0001';
  const r = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders({ 'idempotency-key': key }), ip });
  assert.equal(r.status, 500);
  assert.deepEqual(r.json, { error: 'Something went wrong. Please try again or contact us directly.' });
  await drain();
  assert.equal(world.notified.length, 0, 'no hub configured: nothing sent');
  // The slot was given back, and the retry with the same key keeps the case ID (Windmill files it once).
  world.leadFails = false;
  const retry = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders({ 'idempotency-key': key }), ip });
  assert.equal(retry.status, 200);
  assert.equal(world.leads.length, 1);
  assert.equal(world.leads[0].payload.caseId, retry.json.caseId);
});

test('contact form: an Idempotency-Key replays the first answer; reused for another request it is 422', async () => {
  reset();
  const key = '0d5c6f8a-4b1e-4f3a-9c2d-7e6b5a4f3e2d';
  const first = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders({ 'idempotency-key': key }) });
  assert.equal(first.status, 200);
  // A new Turnstile token, another instance-minute: the same answer, no second email.
  const again = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders({ 'idempotency-key': key }) });
  assert.equal(again.status, 200);
  assert.equal(again.json.caseId, first.json.caseId);
  assert.equal(again.headers.get('idempotent-replayed'), 'true');
  assert.equal(world.leads.length, 1);
  const other = await post(routes.contactFormRoute, { body: { ...enquiry, company: 'Other' }, headers: formHeaders({ 'idempotency-key': key }) });
  assert.equal(other.status, 422);
  assert.deepEqual(other.json, { error: 'idempotency_key_reused' });
  const bad = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders({ 'idempotency-key': 'x' }) });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.json, { error: 'invalid_idempotency_key' });
});

test('contact routes: a lead Windmill did not take tells the notification hub after the response, without personal data', async () => {
  reset();
  process.env.NOTIFY_URL = 'https://hooks.test/api/r/webhook/vspl-notify';
  process.env.NOTIFY_INGEST_SECRET = 'unit-notify-secret';
  try {
    world.leadFails = true;
    const r = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders() });
    assert.equal(r.status, 500);
    assert.equal(world.notified.length, 0, 'waits for after()');
    await drain();
    assert.equal(world.notified.length, 1);
    const { secret, event } = world.notified[0];
    assert.equal(secret, 'unit-notify-secret');
    assert.equal(event.v, 1);
    assert.equal(event.source, 'website');
    assert.equal(event.type, 'lead.email_failed');
    assert.match(event.dedupeKey, /^lead-email:REQ-\d{8}-[0-9A-F]{8}$/);
    assert.equal(event.pii, undefined);
    assert.doesNotMatch(JSON.stringify(event), /Asha|Rawat|Acme|98765|asha@/);
    assert.match(event.summary, /\/api\/contact/);
    // The agent route too; a lead Windmill takes sends nothing.
    world.notified.length = 0;
    const agent = await post(routes.agentContactRoute, { body: enquiry });
    assert.equal(agent.status, 500);
    await drain();
    assert.equal(world.notified[0]?.event.type, 'lead.email_failed');
    assert.match(world.notified[0].event.summary, /\/api\/agent\/contact/);
    reset();
    process.env.NOTIFY_URL = 'https://hooks.test/api/r/webhook/vspl-notify';
    assert.equal((await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders() })).status, 200);
    await drain();
    assert.equal(world.notified.length, 0);
  } finally {
    delete process.env.NOTIFY_URL;
    delete process.env.NOTIFY_INGEST_SECRET;
  }
});

// --- /api/alerts/* (minimum wage rate alerts) ----------------------------------------

const ALERT_TOKEN = 'hT3kq9ZxW2mVb7PcJ4nRs8Ld6YfGa1Ue0oQiXyNzKw5';

test('rate alerts: subscribe needs Turnstile and a published state; the address is lower-cased; the answer says nothing of the list', async () => {
  reset();
  const body = { email: ' HR@Example.com ', states: ['uttarakhand'], sourcePath: '/minimum-wages/uttarakhand' };
  const noToken = await post(routes.alertSubscribeRoute, { body: { ...body, email: 'hr@example.com' }, headers: formHeaders({ 'x-turnstile-token': '' }) });
  assert.equal(noToken.status, 403);
  for (const bad of [{ ...body, email: 'not an address' }, { ...body, email: 'hr@example.com', states: [] }, { ...body, email: 'hr@example.com', states: ['atlantis'] }, { email: 'hr@example.com' }]) {
    assert.equal((await post(routes.alertSubscribeRoute, { body: bad, headers: formHeaders() })).status, 400);
  }
  assert.equal(world.alerts.length, 0);
  const ok = await post(routes.alertSubscribeRoute, { body: { ...body, email: 'HR@Example.com' }, headers: formHeaders() });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.json, { success: true });
  const [sent] = world.alerts;
  assert.equal(sent.action, 'subscribe');
  assert.match(sent.ref, /^ALR-\d{8}-[0-9A-F]{8}$/);
  assert.deepEqual([sent.email, sent.states, sent.sourcePath, sent.noticeVersion], ['hr@example.com', ['uttarakhand'], '/minimum-wages/uttarakhand', '2026-11-10']);
  // What the site forwards is the contract's canonical shape.
  const { rateAlertCanonicalSchema } = await import('@vspl/contracts/rate-alert');
  assert.equal(rateAlertCanonicalSchema.safeParse(sent).success, true);
});

test('rate alerts: 502 when the confirmation email could not go; 429 for the honeypot and a fourth try for one address', async () => {
  reset();
  const body = { email: 'limit@example.com', states: ['punjab'] };
  world.alertAnswer = { status: 502 };
  const failed = await post(routes.alertSubscribeRoute, { body, headers: formHeaders() });
  assert.equal(failed.status, 502);
  assert.equal(failed.json.error, 'We could not send the confirmation email. Please try again in a few minutes.');
  world.alertAnswer = { status: 202 };
  assert.equal((await post(routes.alertSubscribeRoute, { body, headers: formHeaders({ 'x-contact-form-honeypot': 'bot' }) })).status, 429);
  assert.equal((await post(routes.alertSubscribeRoute, { body, headers: formHeaders() })).status, 200);
  assert.equal((await post(routes.alertSubscribeRoute, { body, headers: formHeaders() })).status, 200);
  assert.equal((await post(routes.alertSubscribeRoute, { body, headers: formHeaders() })).status, 429, 'three an hour per address');
});

test('rate alerts: confirm and unsubscribe relay the token; a one-click unsubscribe carries it in the query; an unknown link is 404', async () => {
  reset();
  world.alertAnswer = { status: 200, states: ['punjab', 'uttarakhand'] };
  const confirmed = await post(routes.alertConfirmRoute, { body: { token: ALERT_TOKEN } });
  assert.equal(confirmed.status, 200);
  assert.deepEqual(confirmed.json, { success: true, states: ['punjab', 'uttarakhand'] });
  assert.deepEqual([world.alerts[0].action, world.alerts[0].token], ['confirm', ALERT_TOKEN]);
  // RFC 8058: the mail client posts "List-Unsubscribe=One-Click" as a form, with the token in the URL.
  const request = new NextRequest(`https://www.vayasyaseva.com/api/alerts/unsubscribe?t=${ALERT_TOKEN}`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': freshIp() }, body: 'List-Unsubscribe=One-Click',
  });
  const oneClick = await runSubmission(routes.alertUnsubscribeRoute, request);
  assert.equal(oneClick.status, 200);
  assert.deepEqual([world.alerts[1].action, world.alerts[1].token], ['unsubscribe', ALERT_TOKEN]);
  world.alertAnswer = { status: 404 };
  const gone = await post(routes.alertUnsubscribeRoute, { body: { token: ALERT_TOKEN } });
  assert.equal(gone.status, 404);
  assert.deepEqual(gone.json, { error: 'This link is no longer valid.' });
  assert.equal((await post(routes.alertConfirmRoute, { body: { token: 'short' } })).status, 400);
  assert.equal(world.alerts.length, 3, 'a malformed token is never forwarded');
  world.alertAnswer = { status: 503 };
  assert.equal((await post(routes.alertConfirmRoute, { body: { token: ALERT_TOKEN } })).status, 502);
});

// --- /api/agent/contact (no Turnstile) --------------------------------------------------

test('agent contact: no Turnstile; 200 with an AGT- case ID, website-only fields dropped', async () => {
  reset();
  const r = await post(routes.agentContactRoute, { body: { ...enquiry, pageCluster: 'haridwar', agent: { name: 'Example Assistant' } } });
  assert.equal(r.status, 200);
  assert.match(r.json.caseId, /^AGT-/);
  await drain();
  assert.equal(world.leads[0].payload.channel, 'agent');
  assert.equal(world.leads[0].payload.sourcePath, null);
  assert.match(world.leads[0].payload.enquiry, /Sent by an AI agent \(Example Assistant\)/);
  // The staff email says so too, and no copy goes to an address an agent gave.
  assert.match(world.leads[0].payload.mail.staff.text, /Sent by an AI agent \(Example Assistant\) on their behalf/);
  assert.equal(world.leads[0].payload.mail.buyer, null);
});

test('agent contact: 400 with details (agent issues under agent.*), 429 for a repeated sender', async () => {
  reset();
  const bad = await post(routes.agentContactRoute, { body: { ...enquiry, agent: { name: '<b>' } } });
  assert.equal(bad.status, 400);
  assert.equal(bad.json.details[0].path[0], 'agent');
  const ip = freshIp();
  const sender = { ...enquiry, email: 'repeat@acme.example' };
  assert.equal((await post(routes.agentContactRoute, { body: sender, ip })).status, 200);
  const again = await post(routes.agentContactRoute, { body: { ...sender, phone: '9876543210' }, ip });
  assert.equal(again.status, 429);
  assert.equal(again.json.retryAfterSeconds, 600);
  assert.equal(again.headers.get('retry-after'), '600');
});

test('agent contact: 500 when Windmill does not take the lead', async () => {
  reset();
  world.leadFails = true;
  const r = await post(routes.agentContactRoute, { body: { ...enquiry, email: 'agent-fail@acme.example' } });
  assert.equal(r.status, 500);
  await drain();
  assert.equal(world.leads.length, 0);
});

// --- /api/jobs/start and /submit (the jobs form: Turnstile on start) -------------------

const jobsStart = { source: 'web', locale: 'en-IN', pageCluster: 'haridwar', pagePath: '/jobs/haridwar', role: 'packing', hub: null, files: [{ kind: 'image', mime: 'image/jpeg', size: 1000, name: 'cv.jpg' }] };
const person = { phone: '9876543210', adult: true, consent: true, text: 'Two years packing.' };

test('jobs start: 400, 403 without Turnstile, 200 with the reference, upload URLs and a ticket', async () => {
  reset();
  assert.deepEqual((await post(routes.jobsStartRoute, { body: { source: 'web' } })).json, { error: 'invalid_request' });
  const refused = await post(routes.jobsStartRoute, { body: { ...jobsStart, turnstileToken: 'fail' } });
  assert.equal(refused.status, 403);
  assert.deepEqual(refused.json, { error: 'verification_failed', agentRoute: '/api/agent/jobs' });
  const ok = await post(routes.jobsStartRoute, { body: { ...jobsStart, turnstileToken: 'pass' } });
  assert.equal(ok.status, 200);
  assert.match(ok.json.ref, /^VS-J-[A-Z0-9]{6}$/);
  assert.equal(ok.json.uploads.length, 1);
  assert.match(ok.json.uploads[0].key, new RegExp(`/${ok.json.ref}/0\\.jpg$`));
  assert.ok(ok.json.ticket.includes('.'));
});

test('jobs start: a retry with the same Idempotency-Key and a fresh Turnstile token keeps the reference', async () => {
  reset();
  const headers = { 'idempotency-key': 'jobs-start-key-0001' };
  const first = await post(routes.jobsStartRoute, { body: { ...jobsStart, turnstileToken: 'pass' }, headers });
  const again = await post(routes.jobsStartRoute, { body: { ...jobsStart, turnstileToken: 'pass' }, headers });
  assert.equal(again.json.ref, first.json.ref);
  assert.equal(again.headers.get('idempotent-replayed'), 'true');
});

async function started(route = routes.jobsStartRoute, body = { ...jobsStart, turnstileToken: 'pass' }) {
  const r = await post(route, { body });
  assert.equal(r.status, 200);
  return r.json;
}

test('jobs submit: 410 for an expired or forged ticket, 409 for a missing upload, 413 for an oversized one', async () => {
  reset();
  const forged = await post(routes.jobsSubmitRoute, { body: { ...person, ticket: 'abc.def' } });
  assert.equal(forged.status, 410);
  assert.deepEqual(forged.json, { error: 'expired' });
  const s = await started();
  const missing = await post(routes.jobsSubmitRoute, { body: { ...person, ticket: s.ticket } });
  assert.equal(missing.status, 409);
  assert.equal(missing.json.error, 'upload_missing');
  world.uploads.set(s.uploads[0].key, 5000);
  const large = await post(routes.jobsSubmitRoute, { body: { ...person, ticket: s.ticket } });
  assert.equal(large.status, 413);
  assert.equal(large.json.error, 'upload_too_large');
  assert.deepEqual(world.deleted, [s.uploads[0].key]);
  assert.equal(world.applications.length, 0);
});

test('jobs submit: 202 with the reference once forwarded; 400 for an invalid body; 502 when Windmill fails', async () => {
  reset();
  const s = await started();
  world.uploads.set(s.uploads[0].key, 1000);
  const ok = await post(routes.jobsSubmitRoute, { body: { ...person, ticket: s.ticket } });
  assert.equal(ok.status, 202);
  assert.deepEqual(ok.json, { ref: s.ref });
  assert.equal(world.applications[0].payload.ref, s.ref);
  assert.equal(world.applications[0].payload.phone, '+919876543210');
  const invalid = await post(routes.jobsSubmitRoute, { body: { ticket: s.ticket } });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.json.error, 'invalid_request');
  world.applicationFails = true;
  const down = await post(routes.jobsSubmitRoute, { body: { ...person, ticket: s.ticket } });
  assert.equal(down.status, 502);
  assert.deepEqual(down.json, { error: 'unavailable' });
});

// --- /api/agent/jobs* (no Turnstile, rate limited) -----------------------------------

const agentApplication = { language: 'hi', phone: '98765 43211', adult: true, consent: true, text: 'Naam Ravi. Packing ka kaam.' };
const agentPerson = { phone: '98765 43211', adult: true, consent: true };

test('agent jobs: no Turnstile; 202 with a reference; 400 lists each issue', async () => {
  reset();
  const ok = await post(routes.agentJobsRoute, { body: agentApplication });
  assert.equal(ok.status, 202);
  assert.match(ok.json.ref, /^VS-J-/);
  assert.equal(world.applications[0].payload.channel, 'agent');
  assert.equal(world.applications[0].payload.source, 'web_hi');
  const bad = await post(routes.agentJobsRoute, { body: { ...agentApplication, adult: false } });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.json.fields.map((f) => f.path), ['adult']);
});

test('agent jobs: a retry with the same Idempotency-Key returns the first reference and files once', async () => {
  reset();
  const headers = { 'idempotency-key': 'agent-retry-0000-0001' };
  const ip = freshIp();
  const first = await post(routes.agentJobsRoute, { body: agentApplication, headers, ip });
  const again = await post(routes.agentJobsRoute, { body: agentApplication, headers, ip });
  assert.equal(again.status, 202);
  assert.equal(again.json.ref, first.json.ref);
  assert.equal(world.applications.length, 1);
  assert.equal(world.applications[0].meta.idempotencyKey, 'agent-retry-0000-0001');
  // A failure on our side gives the slot back and keeps the reference for the retry.
  world.applicationFails = true;
  const key2 = { 'idempotency-key': 'agent-retry-0000-0002' };
  const failed = await post(routes.agentJobsRoute, { body: { ...agentApplication, phone: '98765 43219' }, headers: key2 });
  assert.equal(failed.status, 502);
  world.applicationFails = false;
  const retried = await post(routes.agentJobsRoute, { body: { ...agentApplication, phone: '98765 43219' }, headers: key2 });
  assert.equal(retried.status, 202);
  assert.equal(world.applications.length, 2);
});

test('agent jobs: 429 after three applications for one phone in an hour', async () => {
  reset();
  const body = { ...agentApplication, phone: '98765 43212' };
  for (let i = 0; i < 3; i++) assert.equal((await post(routes.agentJobsRoute, { body })).status, 202);
  const limited = await post(routes.agentJobsRoute, { body });
  assert.equal(limited.status, 429);
  assert.deepEqual(limited.json, { error: 'rate_limited', retryAfterSeconds: 600 });
});

test('agent jobs with files: start 200, submit 202; a form ticket on the agent route is 400', async () => {
  reset();
  const s = await started(routes.agentJobsStartRoute, { language: 'en', files: [{ kind: 'document', mime: 'application/pdf', size: 900, name: 'cv.pdf' }] });
  world.uploads.set(s.uploads[0].key, 900);
  const ok = await post(routes.agentJobsSubmitRoute, { body: { ...agentPerson, phone: '98765 43213', ticket: s.ticket, text: null } });
  assert.equal(ok.status, 202);
  assert.equal(world.applications[0].payload.attachments[0].kind, 'document');
  const webTicket = issueTicket({ ref: 'VS-J-WEBTK1', source: 'web', locale: 'en-IN', files: [] });
  const wrong = await post(routes.agentJobsSubmitRoute, { body: { ...agentPerson, phone: '98765 43214', ticket: webTicket } });
  assert.equal(wrong.status, 400);
  assert.deepEqual(wrong.json, { error: 'invalid_request', fields: ['ticket'] });
  const noFiles = await post(routes.agentJobsStartRoute, { body: { language: 'en', files: [] } });
  assert.equal(noFiles.status, 400);
});

// --- Ticket keys (TICKET_SIGNING_KEY) ------------------------------------------------

test('tickets: without TICKET_SIGNING_KEY they are signed as before; with it, old tickets work until they expire', async () => {
  const { readTicket } = await importTs('src/lib/talent-intake/server.ts');
  const { createHmac } = await import('node:crypto');
  const draft = { ref: 'VS-J-TICKT1', source: 'web', locale: 'en-IN', files: [] };
  delete process.env.TICKET_SIGNING_KEY;
  const legacy = issueTicket(draft);
  const [body, signature] = legacy.split('.');
  const derived = createHmac('sha256', createHmac('sha256', 'unit-webhook-secret').update('jobs-ticket-v1').digest()).update(body).digest('base64url');
  assert.equal(signature, derived, 'the old derivation, unchanged');
  assert.equal(readTicket(legacy).ref, 'VS-J-TICKT1');
  process.env.TICKET_SIGNING_KEY = 'unit-ticket-key';
  try {
    const fresh = issueTicket(draft);
    assert.notEqual(fresh.split('.')[1], derived);
    assert.equal(readTicket(fresh).ref, 'VS-J-TICKT1');
    assert.equal(readTicket(legacy).ref, 'VS-J-TICKT1', 'a ticket from before the key still works');
    // Never longer than a ticket's hour, whichever key signed it.
    const longBody = Buffer.from(JSON.stringify({ ...draft, exp: Math.floor(Date.now() / 1000) + 3 * 3600 })).toString('base64url');
    const longLegacy = `${longBody}.${createHmac('sha256', createHmac('sha256', 'unit-webhook-secret').update('jobs-ticket-v1').digest()).update(longBody).digest('base64url')}`;
    assert.equal(readTicket(longLegacy), null);
    assert.equal(readTicket(`${body}.${'A'.repeat(signature.length)}`), null);
  } finally {
    delete process.env.TICKET_SIGNING_KEY;
  }
  // A ticket signed with the new key does not pass once the key is gone.
  process.env.TICKET_SIGNING_KEY = 'unit-ticket-key';
  const keyed = issueTicket(draft);
  delete process.env.TICKET_SIGNING_KEY;
  assert.equal(readTicket(keyed), null);
});

// --- The signed envelope route and the durable store (1F) ---------------------------

test('envelope transport: signed envelope.v1 to webhook/vspl-submission; the older routes until the secret is set', async (t) => {
  t.mock.method(console, 'info', () => {});
  t.mock.method(console, 'error', () => {});
  const { envelopeTransport, transport, webhookTransport, setTransport: set } = await importTs('src/server/submissions/transport.ts');
  const { checkSignature } = await import('@vspl/contracts/signing');
  const { talentIntakeSchema } = await importTs('src/lib/talent-intake/contract.ts');
  const { buildLeadPayload } = await importTs('src/lib/lead-forward.ts');
  set(null);
  try {
    delete process.env.SUBMISSION_SIGNING_SECRET;
    assert.equal(transport(), webhookTransport);
    process.env.SUBMISSION_SIGNING_SECRET = 'unit-signing';
    assert.notEqual(transport(), webhookTransport);
    const sent = [];
    let answer = 202;
    const fetchImpl = async (url, init) => (sent.push({ url, init }), new Response('{}', { status: answer }));
    const payload = talentIntakeSchema.parse({
      ref: 'VS-J-ENVLP1', source: 'web', locale: 'en-IN', cluster: 'haridwar', pageCluster: 'haridwar', pagePath: '/jobs/haridwar', role: null, hub: null,
      channel: 'web', agentName: null, phone: '9876543210', adult: true, consent: { version: 'v', at: '2026-10-18T05:00:00.000Z' },
      text: 'Packing.', attachments: [], form: 'long', applicantName: null, answers: null,
    });
    const envelope = envelopeTransport(fetchImpl, [0, 0]);
    await envelope.application(payload, { idempotencyKey: 'key-0000-0001' });
    const { url, init } = sent[0];
    assert.equal(url, 'https://hooks.vayasyaseva.com/api/r/webhook/vspl-submission');
    assert.equal(checkSignature('unit-signing', init.headers, init.body), 'ok');
    const body = JSON.parse(init.body);
    assert.deepEqual([body.v, body.type, body.id, body.idempotencyKey, body.payload.phone], [1, 'job_application.v1', 'VS-J-ENVLP1', 'key-0000-0001', '+919876543210']);
    answer = 500;
    await assert.rejects(envelope.application(payload, { idempotencyKey: null }), /answered 500/);
    // A compliance help lead: its own type; a 503 then 202 is delivered on the second try.
    sent.length = 0;
    let tries = 0;
    const flaky = envelopeTransport(async (u, i) => (sent.push({ u, i }), new Response('{}', { status: ++tries < 2 ? 503 : 202 })), [0, 0]);
    const lead = buildLeadPayload({ name: 'Asha', phone: '9876543210', details: 'Help with PF.', requestType: 'compliance-help' }, { caseId: 'REQ-20261018-0A1B2C3D', channel: 'web' });
    assert.equal(await flaky.lead(lead, { idempotencyKey: null }), true);
    assert.equal(tries, 2);
    assert.equal(JSON.parse(sent[0].i.body).type, 'compliance_help.v1');
    // A rate alert action: its own type, the answer's status and states; the older routes cannot carry it.
    const alertSent = [];
    const alerts = envelopeTransport(async (u, i) => (alertSent.push(JSON.parse(i.body)), Response.json({ ok: true, states: ['punjab'] }, { status: 200 })), [0, 0]);
    const confirm = { action: 'confirm', ref: 'ALR-20261110-0A1B2C3D', receivedAt: '2026-11-10T09:30:00.000Z', token: 'hT3kq9ZxW2mVb7PcJ4nRs8Ld6YfGa1Ue0oQiXyNzKw5' };
    assert.deepEqual(await alerts.alert(confirm), { status: 200, states: ['punjab'] });
    assert.deepEqual([alertSent[0].type, alertSent[0].id, alertSent[0].payload.action], ['rate_alert.v1', 'ALR-20261110-0A1B2C3D', 'confirm']);
    assert.deepEqual(await envelopeTransport(async () => { throw new Error('down'); }, [0, 0]).alert(confirm), { status: 502 });
    assert.deepEqual(await webhookTransport.alert(confirm), { status: 503 });
    // A lead the contract refuses is never sent, and never retried.
    assert.equal(await flaky.lead({ ...lead, caseId: 'nope' }, { idempotencyKey: null }), false);
    assert.equal(tries, 2);
  } finally {
    delete process.env.SUBMISSION_SIGNING_SECRET;
  }
});

test('durable Idempotency-Key store: Windmill answers; when it cannot, this instance remembers', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const { windmillIdempotencyStore, memoryIdempotencyStore: memoryStore } = await importTs('src/server/submissions/policies/idempotency.ts');
  const { checkSignature } = await import('@vspl/contracts/signing');
  process.env.SUBMISSION_SIGNING_SECRET = 'unit-signing';
  try {
    const calls = [];
    let up = true;
    const fetchImpl = async (url, init) => {
      calls.push(JSON.parse(init.body));
      assert.equal(checkSignature('unit-signing', init.headers, init.body), 'ok');
      if (!up) throw new Error('connect ECONNREFUSED');
      const op = JSON.parse(init.body).op;
      return Response.json(op === 'begin' ? { state: 'replay', answer: { status: 202, body: { ref: 'VS-J-REPLAY' } } } : { ok: true });
    };
    const store = windmillIdempotencyStore(memoryStore(), fetchImpl);
    assert.deepEqual(await store.begin('/api/agent/jobs', 'key-0000-0001', 'fp'), { state: 'replay', answer: { status: 202, body: { ref: 'VS-J-REPLAY' } } });
    assert.equal(calls[0].op, 'begin');
    up = false;
    assert.deepEqual(await store.begin('/api/agent/jobs', 'key-0000-0002', 'fp'), { state: 'new' }, 'falls back to memory');
    await store.complete('/api/agent/jobs', 'key-0000-0002', { status: 202, body: { ref: 'VS-J-MEMORY' } });
    assert.equal((await store.begin('/api/agent/jobs', 'key-0000-0002', 'fp')).state, 'replay', 'memory kept the answer');
  } finally {
    delete process.env.SUBMISSION_SIGNING_SECRET;
  }
});
