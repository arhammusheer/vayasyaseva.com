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
const MSG91 = { MSG91_AUTH_KEY: 'k', MSG91_DOMAIN: 'mail.test', MSG91_FROM_EMAIL: 'from@mail.test', MSG91_FROM_NAME: 'VSPL', MSG91_INTERNAL_TEMPLATE_ID: 'internal_tpl', CONTACT_INTERNAL_RECIPIENT_EMAIL: 'inbox@mail.test' };
Object.assign(process.env, MSG91);

const { NextRequest } = await import('next/server.js');
const { runSubmission, setDeferForTests } = await importTs('src/server/submissions/pipeline.ts');
const { setTransport } = await importTs('src/server/submissions/transport.ts');
const { setIdempotencyStore, memoryIdempotencyStore } = await importTs('src/server/submissions/policies/idempotency.ts');
const routes = {
  ...(await importTs('src/server/submissions/types/business-enquiry.ts')),
  ...(await importTs('src/server/submissions/types/job-application.ts')),
};
const { issueTicket } = await importTs('src/lib/talent-intake/server.ts');

// --- The outside world -------------------------------------------------------------

const world = { emails: 0, emailFails: false, uploads: new Map(), deleted: [], applications: [], leads: [], applicationFails: false };
const deferred = [];
setDeferForTests((task) => deferred.push(task));
setTransport({
  async application(payload, meta) {
    if (world.applicationFails) throw new Error('intake webhook answered 500');
    world.applications.push({ payload, meta });
  },
  async lead(payload, meta) {
    world.leads.push({ payload, meta });
    return true;
  },
});
globalThis.fetch = async (input, init = {}) => {
  const url = String(input instanceof Request ? input.url : input);
  const method = init.method ?? (input instanceof Request ? input.method : 'GET');
  if (url.startsWith('https://challenges.cloudflare.com/')) {
    return Response.json({ success: new URLSearchParams(String(init.body)).get('response') === 'pass' });
  }
  if (url.startsWith('https://control.msg91.com/')) {
    world.emails++;
    if (world.emailFails) return Response.json({ message: 'down' }, { status: 503 });
    return Response.json({ status: 'success', data: { unique_id: 'u1', message_id: 'm1', thread_id: 't1' } });
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
  Object.assign(world, { emails: 0, emailFails: false, deleted: [], applications: [], leads: [], applicationFails: false });
  world.uploads.clear();
  deferred.length = 0;
  setIdempotencyStore(memoryIdempotencyStore());
  Object.assign(process.env, MSG91);
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
  assert.equal(world.emails, 0);
});

test('contact form: 200 with a case ID; the staff email goes first, then the lead after the response', async () => {
  reset();
  const r = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders() });
  assert.equal(r.status, 200);
  assert.equal(r.json.success, true);
  assert.match(r.json.caseId, /^REQ-\d{8}-[0-9A-F]{8}$/);
  assert.equal(world.emails, 1);
  assert.equal(world.leads.length, 0, 'the lead waits for after()');
  await drain();
  assert.equal(world.leads.length, 1);
  assert.equal(world.leads[0].payload.caseId, r.json.caseId);
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

test('contact form: when the staff email fails the answer is still 500, but the lead is forwarded', async () => {
  reset();
  world.emailFails = true;
  const ip = freshIp();
  const key = 'contact-retry-key-0001';
  const r = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders({ 'idempotency-key': key }), ip });
  assert.equal(r.status, 500);
  assert.deepEqual(r.json, { error: 'Something went wrong. Please try again or contact us directly.' });
  await drain();
  assert.equal(world.leads.length, 1, 'forwardLead still runs');
  const firstCase = world.leads[0].payload.caseId;
  // The slot was given back, and the retry with the same key keeps the case ID (Windmill files it once).
  world.emailFails = false;
  const retry = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders({ 'idempotency-key': key }), ip });
  assert.equal(retry.status, 200);
  assert.equal(retry.json.caseId, firstCase);
  // MSG91 missing entirely (a configuration error) behaves the same way.
  reset();
  delete process.env.MSG91_AUTH_KEY;
  assert.equal((await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders() })).status, 500);
  await drain();
  assert.equal(world.leads.length, 1);
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
  assert.equal(world.emails, 1);
  const other = await post(routes.contactFormRoute, { body: { ...enquiry, company: 'Other' }, headers: formHeaders({ 'idempotency-key': key }) });
  assert.equal(other.status, 422);
  assert.deepEqual(other.json, { error: 'idempotency_key_reused' });
  const bad = await post(routes.contactFormRoute, { body: enquiry, headers: formHeaders({ 'idempotency-key': 'x' }) });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.json, { error: 'invalid_idempotency_key' });
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

test('agent contact: a failed staff email answers 500 and still forwards the lead', async () => {
  reset();
  world.emailFails = true;
  const r = await post(routes.agentContactRoute, { body: { ...enquiry, email: 'agent-fail@acme.example' } });
  assert.equal(r.status, 500);
  await drain();
  assert.equal(world.leads.length, 1);
  assert.match(world.leads[0].payload.caseId, /^AGT-/);
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
