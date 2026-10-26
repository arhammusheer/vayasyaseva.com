// The minimum wage dataset and the staleness rule (PLAN §5.5):
// src/content/wages/index.ts and schema.ts.
import assert from 'node:assert/strict';
import test from 'node:test';
import { importTs } from '../scripts/lib/register-ts.mjs';

const { wageStates, wageStatus, wageRecords, dailyFromMonthly, formatRupees, headlineRate, headlineRange, checkedByLine, unpublishedRevisions, formatSize, employmentFigure, vdaPoints } = await importTs('src/content/wages/index.ts');
const { wageStateSchema, wageIntegrityProblems } = await importTs('src/content/wages/schema.ts');
const { pathAliases, statusOf } = await importTs('src/content/registry/index.ts');

const base = wageStates.find((s) => s.state === 'uttarakhand');
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
  assert.equal(headlineRange(byState.uttarakhand), '₹13,134');
  assert.equal(headlineRange(byState['uttar-pradesh']), '₹12,530.25 to ₹13,883.59');
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

test('integrity: each scheduled employment shows its rates one way, with a figure per column', () => {
  const uk = wageStates.find((s) => s.state === 'uttarakhand');
  const groups = uk.employments.groups;
  const shops = groups.find((g) => g.id === 'shops');
  const broken = {
    ...uk,
    employments: {
      ...uk.employments,
      groups: [...groups.filter((g) => g.id !== 'shops'), { ...shops, unpublished: true, rows: [{ label: 'Unskilled', values: [12539] }] }],
    },
  };
  const problems = wageIntegrityProblems(broken);
  assert.ok(problems.some((p) => p.includes('exactly one of table, rows or unpublished')));
  assert.ok(problems.some((p) => p.includes('1 figures for 2 column(s)')));
});

test('Andhra Pradesh: an index-linked figure is basic + (index − base) × rate per point, to the paisa', () => {
  const ap = wageStates.find((s) => s.state === 'andhra-pradesh');
  const group = (id) => ap.employments.groups.find((g) => g.id === id);
  const security = group('security-services');
  assert.equal(vdaPoints(ap.employments, security), 1958 - 590);
  // Guards without arms, Zone I: 5,000 + 1,368 × ₹6.75.
  const guards = security.rows.find((r) => /without arms/i.test(r.label));
  assert.equal(employmentFigure(ap.employments, security, guards, 0), 14234);
  // Agriculture runs on the agricultural workers' index, a day.
  const farm = group('agriculture');
  assert.equal(vdaPoints(ap.employments, farm), 1566 - 619);
  // Beedi making keeps its yearly index (1,904 from 1 April 2026).
  assert.equal(vdaPoints(ap.employments, group('beedi-staff')), 1904 - 483);
});

test('Andhra Pradesh: the main tables agree with the notifications they come from', () => {
  const ap = wageStates.find((s) => s.state === 'andhra-pradesh');
  const table = ap.tables.find((t) => t.id === 'any-manufacturing');
  const group = ap.employments.groups.find((g) => g.id === 'any-manufacturing');
  const [highly, skilled, semi, unskilled] = group.rows.map((r) => employmentFigure(ap.employments, group, r, 0));
  const monthly = (skill) => table.rates.find((r) => r.skill === skill).monthly;
  assert.deepEqual([highly, skilled, semi, unskilled], ['highly-skilled', 'skilled', 'semi-skilled', 'unskilled'].map(monthly));
  // Contract labour: the Commissioner's sheet states VDA for 1,111 points.
  for (const r of ap.tables.find((t) => t.id === 'contract-labour').rates) assert.equal(Math.round((r.vda / 1111) * 100) % 5, 0, `${r.skill}: a rate per point in whole 5 paise`);
});

test('integrity: an index-linked group needs the schedule index and a rate per point for every figure', () => {
  const ap = wageStates.find((s) => s.state === 'andhra-pradesh');
  const shops = ap.employments.groups.find((g) => g.id === 'shops');
  const broken = {
    ...ap,
    employments: {
      groups: [...ap.employments.groups.filter((g) => g.id !== 'shops'), { ...shops, linkedTo: { series: 'industrial', base: 525 }, rows: [{ label: 'Helper', values: [3700, 3370] }] }],
    },
  };
  const problems = wageIntegrityProblems(broken);
  assert.ok(problems.some((p) => p.includes('declares no index points')));
  assert.ok(problems.some((p) => p.includes('no VDA rate per point')));
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

test('rupee figures quoted outside the wage pages are current rates (no drift after a revision)', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const { root } = await import('../scripts/lib/register-ts.mjs');
  const norm = (s) => Number(s.replace(/,/g, ''));
  const current = new Set();
  for (const s of wageStates) {
    for (const t of s.tables) for (const r of t.rates) for (const v of [r.monthly, r.daily, r.basic, r.vda]) if (v != null) current.add(v);
    for (const g of s.employments?.groups ?? []) for (const r of g.rows ?? []) r.values.forEach((_, j) => current.add(employmentFigure(s.employments, g, r, j)));
  }
  // Employer dues: every figure in statutory.ts (PT slabs, LWF, ceilings) is current by definition.
  for (const m of readFileSync(`${root}/src/content/statutory.ts`, 'utf8').matchAll(/\b\d[\d,]*(?:\.\d+)?\b/g)) current.add(norm(m[0]));
  const dir = `${root}/src/content/locations`;
  const stale = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
    for (const m of readFileSync(`${dir}/${file}`, 'utf8').matchAll(/₹\s?(\d[\d,]*(?:\.\d+)?)/g)) if (!current.has(norm(m[1]))) stale.push(`${file}: ₹${m[1]}`);
  }
  assert.deepEqual(stale, [], 'update these figures to the current dataset rates');
});

test('state page doors come from the markets: a jobs hub where the state has one, else the official source', async () => {
  const { stateDoors } = await importTs('src/content/pages/minimum-wages.ts');
  const { WAGE_STATE_SLUGS } = await importTs('src/content/registry/identifiers.ts');
  const dept = { href: 'https://labour.example', label: 'Labour Department' };
  const doors = Object.fromEntries(WAGE_STATE_SLUGS.map((s) => [s, stateDoors(s, s, dept).map((d) => d.link.href)]));
  assert.deepEqual(doors, {
    uttarakhand: ['/jobs/uttarakhand', '/locations/uttarakhand'],
    'uttar-pradesh': [dept.href, '/locations/delhi-ncr'],
    delhi: [dept.href, '/locations/delhi-ncr'],
    haryana: [dept.href, '/locations/delhi-ncr'],
    punjab: ['/jobs/punjab', '/locations/jalandhar'],
    karnataka: ['/jobs/bengaluru', '/locations/bengaluru'],
    'andhra-pradesh': ['/jobs/andhra-pradesh', '/locations/visakhapatnam'],
    telangana: [dept.href, '/contact'],
  });
  const [jobs, crew] = stateDoors('uttarakhand', 'Uttarakhand', dept);
  assert.match(jobs.text, /^Dehradun, Haridwar and the rest of the state\. /);
  assert.equal(crew.text, 'We supply crews in Dehradun, Haridwar and the rest of Uttarakhand.');
});

test('Telangana: the table is G.O.Ms. No. 6 as printed, basic only until a VDA is declared', () => {
  const tg = wageStates.find((s) => s.state === 'telangana');
  const table = tg.tables.find((t) => t.id === 'all-employments');
  const printed = { 'zone-1': [16000, 17000, 18500, 20000], 'zone-2': [15000, 16000, 17500, 19000], 'zone-3': [14000, 15000, 16500, 18000] };
  const skills = ['unskilled', 'semi-skilled', 'skilled', 'highly-skilled'];
  for (const [zone, values] of Object.entries(printed)) {
    skills.forEach((skill, i) => {
      const r = table.rates.find((x) => x.zone === zone && x.skill === skill);
      assert.deepEqual([r.basic, r.vda, r.monthly, r.daily], [values[i], 0, values[i], dailyFromMonthly(values[i])], `${zone} ${skill}`);
    });
  }
  assert.deepEqual(tg.nextRevision.missed, ['2026-10-01']);
  const all = tg.employments.groups.find((g) => g.id === 'schedules').employments;
  assert.equal(all.length, 76);
  assert.equal(new Set(all).size, 76);
});
