// The minimum wage dataset and the staleness rule (PLAN §5.5):
// src/content/wages/index.ts and schema.ts.
import assert from 'node:assert/strict';
import test from 'node:test';
import { importTs } from '../scripts/lib/register-ts.mjs';

const { wageStates, wageStatus, wageRecords, dailyFromMonthly, formatRupees, headlineRate, headlineRange, checkedByLine, unpublishedRevisions, formatSize } = await importTs('src/content/wages/index.ts');
const { wageStateSchema, wageIntegrityProblems } = await importTs('src/content/wages/schema.ts');
const { pathAliases, statusOf } = await importTs('src/content/registry/index.ts');

const base = wageStates[0];
const withDates = (expected, checkedOn) => ({ ...base, nextRevision: { ...base.nextRevision, expected }, checked: { ...base.checked, on: checkedOn } });

test('every wage file is valid and internally consistent', () => {
  for (const state of wageStates) {
    const parsed = wageStateSchema.safeParse(state);
    assert.ok(parsed.success, `${state.state}: ${parsed.error?.message}`);
    assert.deepEqual(wageIntegrityProblems(state), [], state.state);
  }
});

test('stale only after 14 full days past the expected revision', () => {
  const s = withDates('2026-10-01', '2026-09-20');
  assert.equal(wageStatus(s, '2026-09-30').revisionDue, false);
  assert.equal(wageStatus(s, '2026-10-01').revisionDue, true);
  assert.equal(wageStatus(s, '2026-10-15').stale, false);
  assert.equal(wageStatus(s, '2026-10-16').stale, true);
});

test('a check after the expected date counts as newer, for another 14 days', () => {
  const s = withDates('2026-10-01', '2026-10-16');
  assert.equal(wageStatus(s, '2026-10-20').stale, false);
  assert.equal(wageStatus(s, '2026-10-30').stale, false);
  assert.equal(wageStatus(s, '2026-10-31').stale, true);
});

test('daily rate under a 1/26 rule rounds up to the paisa', () => {
  assert.equal(dailyFromMonthly(13690), 526.54);
  assert.equal(dailyFromMonthly(13018), 500.7);
  assert.equal(dailyFromMonthly(2600), 100);
});

test('rupee formatting: whole rupees plain, paise with two digits', () => {
  assert.equal(formatRupees(13690), '₹13,690');
  assert.equal(formatRupees(500.7), '₹500.70');
});

test('every record carries the fields PLAN §5.5 asks for', () => {
  for (const state of wageStates) {
    for (const record of wageRecords(state)) {
      for (const key of ['zone', 'skill', 'monthly', 'basic', 'vda', 'notificationNumber', 'notificationDate', 'authority', 'sourceUrl', 'effectiveFrom', 'nextRevisionExpected', 'checkedOn']) {
        assert.ok(record[key] !== undefined && record[key] !== '', `${state.state} ${record.skill}: ${key}`);
      }
      assert.ok('daily' in record);
    }
  }
});

test('short state codes 308 to published full slugs only', () => {
  for (const [from, to] of Object.entries(pathAliases).filter(([from]) => from.startsWith('/minimum-wages/'))) {
    assert.match(from, /^\/minimum-wages\/[a-z]{2}$/);
    assert.equal(statusOf(to, 'en-IN'), 'published', `${from} -> ${to}`);
  }
  assert.equal(pathAliases['/minimum-wages/up'], '/minimum-wages/uttar-pradesh');
  assert.equal(pathAliases['/minimum-wages/dl'], '/minimum-wages/delhi');
  assert.equal(pathAliases['/minimum-wages/uk'], '/minimum-wages/uttarakhand');
});

test('headline rate comes from the headline table only, as a range across zones', () => {
  const byState = Object.fromEntries(wageStates.map((s) => [s.state, s]));
  assert.equal(headlineRate(byState.uttarakhand).table.id, 'factories-and-industries');
  assert.equal(headlineRange(byState.uttarakhand), '₹13,018');
  assert.equal(headlineRange(byState['uttar-pradesh']), '₹12,356 to ₹13,690');
  assert.equal(headlineRange(byState.delhi), '₹18,456');
});

test('no sign-off means no reviewer line; a role alone reads as "a director of Vayasya Seva"', () => {
  assert.equal(checkedByLine({ ...base, checked: { on: '2026-10-16' } }), null);
  assert.equal(checkedByLine({ ...base, checked: { on: '2026-10-16', by: { role: 'Director' } } }), 'a director of Vayasya Seva');
  assert.equal(checkedByLine({ ...base, checked: { on: '2026-10-16', by: { name: 'A. Person', role: 'Director' } } }), 'A. Person, Director');
});

test('missed revisions are listed before the expected one once it has passed', () => {
  const delhi = wageStates.find((s) => s.state === 'delhi');
  assert.deepEqual(unpublishedRevisions(delhi, '2026-09-30'), ['2025-10-01', '2026-04-01']);
  assert.deepEqual(unpublishedRevisions(delhi, '2026-10-16'), ['2025-10-01', '2026-04-01', '2026-10-01']);
});

test('integrity: the next revision must follow the newest rates', () => {
  const s = withDates('2026-04-01', '2026-10-16');
  assert.ok(wageIntegrityProblems(s).some((p) => p.includes('nextRevision.expected')));
});

test('file sizes read as KB or MB', () => {
  assert.equal(formatSize(751), '751 KB');
  assert.equal(formatSize(2368), '2.3 MB');
});

test('the registry sitemap dates match the wage datasets', async () => {
  // pages.ts keeps these by hand so the registry never imports the datasets
  // (they would ship in every page's client JS).
  const { WAGE_STATE_UPDATED } = await importTs('src/content/registry/pages.ts');
  for (const state of wageStates) {
    const expected = [state.checked.on, ...state.tables.map((t) => t.effectiveFrom)].sort().at(-1);
    assert.equal(WAGE_STATE_UPDATED[state.state], expected, `${state.state}: set WAGE_STATE_UPDATED to ${expected} in src/content/registry/pages.ts`);
  }
});
