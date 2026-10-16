// "What we hold" shows a registration only from its sign-off date until the
// day before it expires (src/content/registry/clusters.ts liveRegistrations).
import { registerHooks } from 'node:module';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
registerHooks({ resolve(specifier, context, next) {
  const base = specifier.startsWith('@/') ? resolve(root, 'src', specifier.slice(2)) : specifier.startsWith('.') && context.parentURL?.endsWith('.ts') ? resolve(dirname(fileURLToPath(context.parentURL)), specifier) : null;
  const file = base && (existsSync(base + '.ts') ? base + '.ts' : existsSync(resolve(base, 'index.ts')) ? resolve(base, 'index.ts') : null);
  return next(file ? pathToFileURL(file).href : specifier, context);
} });
const { liveRegistrations, clusters } = await import('../src/content/registry/clusters.ts');

const reg = (signedOffOn, expires) => ({ name: { 'en-IN': 'Licence' }, issuedBy: { 'en-IN': 'Labour Department' }, signedOffOn, expires });
const cluster = { ...clusters[0], registrations: [reg('2026-04-01', '2026-10-01'), reg('2026-10-01', '2027-04-01'), reg('2026-11-01', '2027-05-01')] };

test('expired, live and not-yet-signed-off registrations', () => {
  const live = liveRegistrations(cluster, '2026-10-16');
  assert.deepEqual(live.map((r) => r.signedOffOn), ['2026-10-01']);
});

test('boundaries: shows on the sign-off day, hides on the expiry day', () => {
  assert.deepEqual(liveRegistrations(cluster, '2026-10-01').map((r) => r.signedOffOn), ['2026-10-01']);
  assert.deepEqual(liveRegistrations(cluster, '2026-09-30').map((r) => r.signedOffOn), ['2026-04-01']);
  assert.deepEqual(liveRegistrations(cluster, '2027-04-01').map((r) => r.signedOffOn), ['2026-11-01']);
});
