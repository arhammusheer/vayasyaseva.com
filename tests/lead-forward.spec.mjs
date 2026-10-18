import { registerHooks } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
registerHooks({
  resolve(specifier, context, next) {
    const base = specifier.startsWith('@/') ? resolve(root, 'src', specifier.slice(2)) : specifier.startsWith('.') && context.parentURL?.endsWith('.ts') ? resolve(dirname(fileURLToPath(context.parentURL)), specifier) : null;
    if (base && base.endsWith('.json') && existsSync(base)) return { url: pathToFileURL(base).href, shortCircuit: true };
    return next(base && existsSync(base + '.ts') ? pathToFileURL(base + '.ts').href : specifier, context);
  },
  // The app imports JSON without import attributes (the bundler allows it); serve it as a module.
  load(url, context, next) {
    if (url.endsWith('.json')) return { format: 'module', source: `export default ${readFileSync(fileURLToPath(url), 'utf8')};`, shortCircuit: true };
    return next(url, context);
  },
});
const { buildLeadPayload, forwardLead } = await import('../src/lib/lead-forward.ts');

const data = {
  name: 'Asha Rawat',
  phone: '+91 98765 43210',
  company: 'Acme Foods',
  role: 'Plant HR',
  email: 'asha@acme.example',
  roles: ['packing', 'loading-unloading'],
  headcountBand: '50-99',
  siteState: 'UK',
  siteCity: 'Haridwar',
  startWindow: 'within-1-week',
  durationBand: 'ongoing',
  pageCluster: 'bengaluru',
  sourcePath: '/contact',
  details: 'New packing line from November.',
};

test('the lead carries the form, the site\'s market, and the whole enquiry', () => {
  const lead = buildLeadPayload(data, { caseId: 'REQ-20261017-0A1B2C3D', channel: 'web', receivedAt: new Date('2026-10-17T05:00:00Z') });
  assert.equal(lead.caseId, 'REQ-20261017-0A1B2C3D');
  assert.equal(lead.receivedAt, '2026-10-17T05:00:00.000Z');
  // The city names the market inside the state (src/markets siteMarket).
  assert.equal(lead.cluster, 'haridwar');
  assert.deepEqual(lead.services, ['packing', 'loading-unloading']);
  assert.equal(lead.headcountBand, '50-99');
  assert.equal(lead.jobTitle, 'Plant HR');
  assert.match(lead.enquiry, /^Case REQ-20261017-0A1B2C3D\n/);
  assert.match(lead.enquiry, /Work: Packing/);
  assert.match(lead.enquiry, /Flags: qualified/);
  assert.match(lead.enquiry, /New packing line from November\.$/);
  assert.equal(buildLeadPayload({ ...data, siteState: undefined }, { caseId: 'x', channel: 'web' }).cluster, 'bengaluru');
});

test('forwarding posts with the secret, is true only on 202, and never throws', async (t) => {
  t.mock.method(console, 'info', () => {});
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'warn', () => {});
  const lead = buildLeadPayload(data, { caseId: 'REQ-20261017-0A1B2C3D', channel: 'web' });
  const saved = { ...process.env };
  try {
    delete process.env.LEAD_WEBHOOK_SECRET;
    assert.equal(await forwardLead(lead, async () => assert.fail('no secret: no request')), false);
    process.env.LEAD_WEBHOOK_SECRET = 's3cret';
    process.env.LEAD_WEBHOOK_URL = 'https://hooks.test/api/r/webhook/vspl-lead';
    let seen;
    assert.equal(await forwardLead(lead, async (url, init) => ((seen = { url, init }), new Response('{}', { status: 202 }))), true);
    assert.equal(seen.url, 'https://hooks.test/api/r/webhook/vspl-lead');
    assert.equal(seen.init.headers['x-vspl-lead-secret'], 's3cret');
    assert.equal(JSON.parse(seen.init.body).caseId, 'REQ-20261017-0A1B2C3D');
    // A 5xx, 429 or network error is tried three times in all; a 4xx once.
    const counting = (answer) => { const f = async () => (f.calls++, answer()); f.calls = 0; return f; };
    const down = counting(() => new Response('', { status: 500 }));
    assert.equal(await forwardLead(lead, down, [0, 0]), false);
    assert.equal(down.calls, 3);
    const offline = counting(() => { throw new Error('network down'); });
    assert.equal(await forwardLead(lead, offline, [0, 0]), false);
    assert.equal(offline.calls, 3);
    const refused = counting(() => new Response('', { status: 403 }));
    assert.equal(await forwardLead(lead, refused, [0, 0]), false);
    assert.equal(refused.calls, 1);
    let tries = 0;
    assert.equal(await forwardLead(lead, async () => new Response('', { status: ++tries < 3 ? 503 : 202 }), [0, 0]), true);
    assert.equal(tries, 3);
  } finally {
    process.env = saved;
  }
});

test('the lead is business_enquiry.v1 canonical: long values are cut, an unknown market is not sent', async () => {
  const { leadCanonicalSchema, LEAD_LIMITS } = await import('@vspl/contracts/business-enquiry');
  const opts = { caseId: 'REQ-20261017-0A1B2C3D', channel: 'web' };
  assert.ok(leadCanonicalSchema.safeParse(buildLeadPayload(data, opts)).success);
  const long = buildLeadPayload({ ...data, name: 'A'.repeat(500), company: 'B'.repeat(500), details: 'x'.repeat(10_000) }, opts);
  assert.equal(long.name.length, LEAD_LIMITS.name);
  assert.equal(long.company.length, LEAD_LIMITS.company);
  assert.equal(long.enquiry.length, LEAD_LIMITS.enquiry);
  assert.ok(leadCanonicalSchema.safeParse(long).success);
  const minimal = buildLeadPayload({ name: 'Asha', phone: '9876543210', details: 'Need 30 packers.' }, { caseId: 'AGT-20261017-0A1B2C3D', channel: 'agent' });
  assert.ok(leadCanonicalSchema.safeParse(minimal).success, JSON.stringify(leadCanonicalSchema.safeParse(minimal).error?.issues));
});
