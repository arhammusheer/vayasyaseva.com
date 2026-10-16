// The jobs intake sends source "web" with the page's BCP 47 locale, cluster
// and page path (PLAN §1a, §8.2). Additive: tickets and requests from pages
// built before it, and the agent routes, keep working.
import { registerHooks } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'next/server') return next('next/server.js', context);
  const base = specifier.startsWith('@/') ? resolve(root, 'src', specifier.slice(2)) : specifier.startsWith('.') && context.parentURL?.endsWith('.ts') ? resolve(dirname(fileURLToPath(context.parentURL)), specifier) : null;
  return next(base && existsSync(base + '.ts') ? pathToFileURL(base + '.ts').href : specifier, context);
} });
process.env.TALENT_INTAKE_WEBHOOK_SECRET = 'local-unit-test';
process.env.TALENT_INTAKE_WEB_SOURCE = '1';
const { jobsStartRequestSchema, talentIntakeSchema } = await import('../src/lib/talent-intake/contract.ts');
const { forwardSubmission } = await import('../src/lib/talent-intake/submit.ts');
const { TALENT_CONSENT_VERSION } = await import('../src/lib/talent-intake/server.ts');
const { submissionCluster, INTAKE_LOCALES, INTAKE_CLUSTERS } = await import('../src/lib/talent-intake/rules.ts');
const { LOCALE_TAGS, CLUSTER_IDS } = await import('../src/content/registry/identifiers.ts');

/** Captures what would be sent to n8n. */
async function forwarded(draft, extras, text = null) {
  const sent = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sent.push(JSON.parse(init.body)); return new Response('{}', { status: 202 }); };
  try {
    const response = await forwardSubmission({ ref: 'VS-J-UNIT01', files: [], ...draft }, '9876543210', text, extras);
    assert.equal(response.status, 202);
  } finally { globalThis.fetch = realFetch; }
  return sent[0];
}

const answers = { work: ['packing'], area: ['laksar'] };

test('rules mirror the canonical locale and cluster ids', () => {
  assert.deepEqual([...INTAKE_LOCALES], [...LOCALE_TAGS]);
  assert.deepEqual([...INTAKE_CLUSTERS], [...CLUSTER_IDS]);
});

test('start request: "web" needs a locale; legacy sources still parse', () => {
  const files = [];
  const ok = jobsStartRequestSchema.safeParse({ source: 'web', locale: 'hi-IN', pageCluster: 'haridwar', pagePath: '/jobs/haridwar', turnstileToken: 't', files });
  assert.ok(ok.success);
  assert.equal(ok.data.pagePath, '/jobs/haridwar');
  assert.equal(jobsStartRequestSchema.safeParse({ source: 'web', turnstileToken: 't', files }).success, false);
  const legacy = jobsStartRequestSchema.safeParse({ source: 'web_hi', turnstileToken: 't', files });
  assert.ok(legacy.success);
  assert.equal(legacy.data.pageCluster, null);
  assert.equal(jobsStartRequestSchema.safeParse({ source: 'web', locale: 'hi-IN', pagePath: '/hi-in/jobs?x', turnstileToken: 't', files }).success, false);
  assert.equal(jobsStartRequestSchema.safeParse({ source: 'web', locale: 'hi-IN', pageCluster: 'mumbai', turnstileToken: 't', files }).success, false);
});

test('a web application from /jobs/haridwar forwards web + locale + cluster + page', async () => {
  const body = await forwarded({ source: 'web', locale: 'hi-Latn-IN', pageCluster: 'haridwar', pagePath: '/jobs/haridwar' }, { form: 'quick', applicantName: 'Ravi', answers });
  assert.equal(body.source, 'web');
  assert.equal(body.locale, 'hi-Latn-IN');
  assert.equal(body.cluster, 'haridwar');
  assert.equal(body.pageCluster, 'haridwar');
  assert.equal(body.pagePath, '/jobs/haridwar');
  assert.equal(body.channel, 'web');
});

test('applications carry consent v7 (the /jobs/privacy notice), within the 40 characters n8n stores', async () => {
  const body = await forwarded({ source: 'web', locale: 'en-IN', pageCluster: null, pagePath: '/jobs/apply' }, { form: 'quick', applicantName: 'Ravi', answers });
  assert.equal(TALENT_CONSENT_VERSION, '2026-10-16-v7');
  assert.equal(body.consent.version, TALENT_CONSENT_VERSION);
  assert.ok(TALENT_CONSENT_VERSION.length <= 40);
  assert.ok(!Number.isNaN(Date.parse(body.consent.at)));
});

test('an older ticket with a legacy source forwards as web with the implied locale', async () => {
  const body = await forwarded({ source: 'web_hi' }, { form: 'quick', answers: { work: ['packing'] } });
  assert.equal(body.source, 'web');
  assert.equal(body.locale, 'hi-IN');
  assert.equal(body.cluster, 'other');
  assert.equal(body.pagePath, null);
});

test('until n8n accepts "web", web applications keep the legacy source', async () => {
  process.env.TALENT_INTAKE_WEB_SOURCE = '';
  try {
    for (const [locale, legacy] of [['en-IN', 'web_en'], ['hi-IN', 'web_hi'], ['hi-Latn-IN', 'web_hinglish']]) {
      const body = await forwarded({ source: 'web', locale, pageCluster: 'haridwar', pagePath: '/jobs/haridwar' }, { form: 'quick', answers });
      assert.equal(body.source, legacy);
      assert.equal(body.locale, locale);
      assert.equal(body.cluster, 'haridwar');
    }
    const older = await forwarded({ source: 'web_hi' }, { form: 'quick', answers: { work: ['packing'] } });
    assert.equal(older.source, 'web_hi');
    const agent = await forwarded({ source: 'web_en', channel: 'agent', agentName: 'Helper' }, {}, 'Packing work');
    assert.equal(agent.source, 'web_en');
  } finally {
    process.env.TALENT_INTAKE_WEB_SOURCE = '1';
  }
});

test('agent applications keep their legacy source and gain the locale', async () => {
  const body = await forwarded({ source: 'web_en', channel: 'agent', agentName: 'Helper' }, {}, 'Packing work');
  assert.equal(body.source, 'web_en');
  assert.equal(body.locale, 'en-IN');
  assert.equal(body.form, null);
});

test('the area answer decides the cluster, else the page', () => {
  assert.equal(submissionCluster('haridwar', { area: ['outside'] }), 'haridwar');
  assert.equal(submissionCluster(null, { area: ['roorkee-bhagwanpur'] }), 'haridwar');
  assert.equal(submissionCluster(null, { area: ['outside'] }), 'other');
  assert.equal(submissionCluster(null, null), 'other');
  assert.equal(submissionCluster('haridwar', null), 'haridwar');
});

test('the n8n payload schema rejects "web" without a locale', () => {
  const payload = { ref: 'VS-J-UNIT02', source: 'web', role: null, hub: null, channel: 'web', agentName: null, phone: '9876543210', adult: true,
    consent: { version: 'x', at: '2026-10-16T10:00:00.000Z' }, text: 'hello', attachments: [], form: 'quick', applicantName: null, answers: null };
  assert.equal(talentIntakeSchema.safeParse(payload).success, false);
  assert.ok(talentIntakeSchema.safeParse({ ...payload, locale: 'en-IN' }).success);
  assert.ok(talentIntakeSchema.safeParse({ ...payload, source: 'web_en' }).success);
});
