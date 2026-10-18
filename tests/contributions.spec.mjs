// The calculators' arithmetic against the worked examples in the documents
// (EPFO's wage-ceiling FAQs Q12-Q13, rule 19's rounding, Haryana's cap,
// Karnataka's Schedule).
import assert from 'node:assert/strict';
import test from 'node:test';
import { importTs } from '../scripts/lib/register-ts.mjs';

const c = await importTs('src/content/contributions.ts');

test('EPF matches EPFO\'s examples at ₹20,000 and above the ceiling', () => {
  assert.deepEqual(c.epf(20000), { base: 20000, capped: false, worker: 2400, eps: 1666, employerEpf: 734, edli: 100, admin: 100, employerCost: 2600, total: 5000 });
  const high = c.epf(30000);
  assert.deepEqual([high.base, high.capped, high.worker, high.eps, high.employerEpf, high.edli, high.admin, high.employerCost, high.total], [25000, true, 3000, 2083, 917, 125, 125, 3250, 6250]);
  assert.deepEqual([c.epf(35000, false).eps, c.epf(35000, false).employerEpf], [0, 3000]);
});

test('ESIC rounds each share up to the next rupee', () => {
  assert.deepEqual(c.esic(18000), { withinLimit: true, worker: 135, employer: 585, total: 720 });
  assert.deepEqual(c.esic(18500), { withinLimit: true, worker: 139, employer: 602, total: 741 });
  assert.equal(c.esic(22000).withinLimit, false);
});

test('Haryana LWF is 0.2% to the ₹35 cap, the employer twice', () => {
  assert.deepEqual(c.haryanaLwf(15220.71), { worker: 30.44, employer: 60.88, month: 91.32, year: 1095.84, capped: false, capFrom: 17500 });
  const high = c.haryanaLwf(20000);
  assert.deepEqual([high.worker, high.employer, high.month, high.year, high.capped], [35, 70, 105, 1260, true]);
});

test('Delhi LWF is fixed per worker per half-year', () => {
  assert.deepEqual(c.delhiLwf(40), { workers: 30, employer: 90, deposit: 120, government: 60 });
});

test('Karnataka PT starts at ₹25,000: ₹200 a month, ₹300 in February, ₹2,500 a year', () => {
  assert.deepEqual(c.karnatakaPt(24999), { due: false, month: 0, february: 0, year: 0 });
  assert.deepEqual(c.karnatakaPt(25000), { due: true, month: 200, february: 300, year: 2500 });
  assert.equal(11 * 200 + 300, 2500);
});
