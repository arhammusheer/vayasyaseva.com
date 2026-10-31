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
});

test('Statutory bonus: ₹7,000 or the minimum wage, whichever is higher; 8⅓% to 20%; nothing above ₹21,000', () => {
  // Haryana unskilled: the minimum wage is the base.
  const hr = c.bonus(15220.71, 15220.71);
  assert.deepEqual([hr.eligible, hr.base, hr.yearWages, hr.minimum, hr.maximum], [true, 15220.71, 182648.52, 15220.71, 36529.7]);
  // Above ₹7,000 with a minimum wage below it: worked out on ₹7,000.
  const low = c.bonus(15000, 6500);
  assert.deepEqual([low.base, low.minimum, low.maximum], [7000, 7000, 16800]);
  // A worker paid more than the minimum wage is still worked out on the minimum wage.
  assert.equal(c.bonus(18000, 15220.71).base, 15220.71);
  // At or below ₹7,000 the actual wage is the base.
  assert.equal(c.bonus(6000, 15220.71).base, 6000);
  assert.deepEqual([c.bonus(25000, 15220.71).eligible, c.bonus(25000, 15220.71).maximum], [false, 0]);
  assert.equal(c.bonus(21000, 15220.71).eligible, true);
});

test('Gratuity: 15/26 of monthly wages per year; 5 years (1 for fixed-term); a part over six months counts; ₹20 lakh cap', () => {
  assert.equal(c.gratuity(15220.71, 5, 0).amount, 43905.89);
  const ft = c.gratuity(18000, 1, 7, 'fixed-term');
  assert.deepEqual([ft.due, ft.counted, ft.amount], [true, 2, 20769.23]);
  // A regular worker at 4 years 7 months: not due on the Code's text.
  assert.deepEqual([c.gratuity(18000, 4, 7).due, c.gratuity(18000, 4, 7).amount], [false, 0]);
  // Exactly six months does not count as a year.
  assert.equal(c.gratuity(26000, 5, 6).counted, 5);
  assert.equal(c.gratuity(26000, 5, 7).counted, 6);
  // Fixed-term under a year: not due. Death: due at any length of service with a counted year.
  assert.equal(c.gratuity(18000, 0, 11, 'fixed-term').due, false);
  assert.equal(c.gratuity(18000, 2, 0, 'death').amount, 20769.23);
  const big = c.gratuity(200000, 30, 0);
  assert.deepEqual([big.amount, big.capped], [2000000, true]);
});

// The pay a jobs page states (src/content/pay.ts): Kapurthala's "₹600+ a day,
// including PF + ESI" must hold at the Punjab unskilled minimum, and the
// breakdown lines must add up as shown. A wage revision that breaks the
// claim fails here before the page or the ads say something untrue.
test('Pay breakdown: Punjab unskilled minimum plus employer PF and ESI is ₹600+ a day', async () => {
  const { payBreakdown } = await importTs('src/content/pay.ts');
  const { jobClusters } = await importTs('src/content/pages/job-clusters.ts');
  const b = payBreakdown({ state: 'punjab', skill: 'unskilled' });
  assert.deepEqual(b, { monthly: 13486, wage: 519, employerPf: 67, employerEsic: 17, employer: 84, total: 603, workerShare: 66, takeHome: 453 });
  for (const [locale, clusters] of Object.entries(jobClusters)) {
    for (const cluster of clusters) {
      if (!cluster.pay) continue;
      const floor = Number(cluster.pay.figure.match(/₹([\d,]+)\+/)?.[1].replace(/,/g, ''));
      assert.ok(floor > 0, `${locale} ${cluster.slug}: the figure names a ₹ amount with +`);
      assert.ok(payBreakdown(cluster.pay.basis).total >= floor, `${locale} ${cluster.slug}: ${cluster.pay.figure} is more than the breakdown supports`);
    }
  }
});
