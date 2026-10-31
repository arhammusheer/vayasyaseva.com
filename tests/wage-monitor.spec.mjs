// The daily compliance source monitor (PLAN §11): scripts/wage-monitor/.
// Everything here runs offline against fixtures; `pnpm wages:monitor
// --dry-run` exercises the real sources.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { deflateSync } from 'node:zlib';
import { importTs, root } from '../scripts/lib/register-ts.mjs';
import { describeDocument, diffLines, documentLinks, htmlText, sha256, spaBundleLinks, spaScript, wpDocumentLinks } from '../scripts/wage-monitor/extract.mjs';
import { ARCHIVED, buildTargets, coverageProblems, fetchSource, fingerprint, istDate, locationTargets, pageLines, registryProblems, relayFetch, runMonitor, targetKey } from '../scripts/wage-monitor/monitor.mjs';
import { extractPdfText, parseCMap } from '../scripts/wage-monitor/pdf-text.mjs';
import { CHECKS_KEY, checksDocument, checksNote, listingChecks } from '../scripts/wage-monitor/checks.mjs';
import { issueTitle, monitorFailedEvent, renderTopicMessage, reportEvents, reportToHub, safe } from '../scripts/wage-monitor/report.mjs';
import { hubClient, hubFromEnv, parseNotify } from '../scripts/lib/notify-hub.mjs';
import { seoEvents, seoFailedEvent } from '../scripts/seo-watch/hub.mjs';

const { wageStates, parseListingChecks } = await importTs('src/content/wages/index.ts');
const registry = JSON.parse(readFileSync(`${root}/scripts/wage-monitor/sources.json`, 'utf8'));

// ---------------------------------------------------------------- fixtures

/** Builds a small PDF: objects in order, optional object stream, no xref (the reader does not need one). */
function makePdf({ objects, objStm = [] }) {
  const parts = ['%PDF-1.5\n'];
  for (const [num, body, stream] of objects) {
    if (stream) {
      const data = deflateSync(Buffer.from(stream, 'latin1'));
      parts.push(`${num} 0 obj\n<< ${body} /Length ${data.length} /Filter /FlateDecode >>\nstream\n`, data, '\nendstream\nendobj\n');
    } else parts.push(`${num} 0 obj\n${body}\nendobj\n`);
  }
  if (objStm.length) {
    let header = '';
    let content = '';
    for (const [num, body] of objStm) {
      header += `${num} ${content.length} `;
      content += `${body}\n`;
    }
    const data = deflateSync(Buffer.from(header + content, 'latin1'));
    parts.push(`99 0 obj\n<< /Type /ObjStm /N ${objStm.length} /First ${header.length} /Length ${data.length} /Filter /FlateDecode >>\nstream\n`, data, '\nendstream\nendobj\n');
  }
  parts.push('trailer\n<< /Root 1 0 R >>\n%%EOF\n');
  return Buffer.concat(parts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p, 'latin1'))));
}

// Devanagari through a 2-byte ToUnicode map: 0001 न, 0002 ्, 0003 य, 0004 ू, 0005 space.
const toUnicode = `/CIDInit /ProcSet findresource begin
begincmap
1 begincodespacerange <0000> <FFFF> endcodespacerange
2 beginbfchar
<0001> <0928>
<0005> <0020>
endbfchar
1 beginbfrange
<0002> <0004> [<094D> <092F> <0942>]
endbfrange
endcmap`;

const pageContent = [
  'BT /F1 12 Tf 72 720 Td (Minimum wages from 1 April 2026) Tj ET',
  'BT /F1 12 Tf 72 700 Td [(Unskilled) -300 (13,690)] TJ ET',
  // Printed-PDF style: one glyph per Td, drawn twice for fake bold.
  'BT /F2 12 Tf 1 0 0 1 72 680 Tm <0001> Tj 6 0 Td <0002> Tj 1 0 0 1 71.5 680 Tm <0001> Tj ET',
  'BT /F2 12 Tf 1 0 0 1 90 680 Tm <00030004> Tj ET',
].join('\n');

const samplePdf = (objStm) =>
  makePdf({
    objects: [
      [1, '<< /Type /Catalog /Pages 2 0 R >>'],
      [2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>'],
      [3, '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>'],
      [4, '', pageContent],
      ...(objStm ? [] : [[5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'], [6, '<< /Type /Font /Subtype /Type0 /ToUnicode 7 0 R >>']]),
      [7, '', toUnicode],
    ],
    objStm: objStm ? [[5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'], [6, '<< /Type /Font /Subtype /Type0 /ToUnicode 7 0 R >>']] : [],
  });

const listingHtml = (rows) => `<!doctype html><html><head><script>var a = '<a href="x.pdf">no</a>';</script></head><body>
<nav><a href="/about.pdf">About us</a></nav>
<table>${rows.join('\n')}</table>
<a href='../files/single.pdf' title="Single quoted order">View</a>
<a href="#top">Top</a><a href="mailto:x@example.org">Mail</a>
</body></html>`;
const row = (file, title) => `<tr><td>1</td><td>${title}</td><td><a class="download_icon" title="Click here to view details" href="/docs/${file}"><em class="fa"></em></a></td></tr>`;

/** A fetcher over a URL → response map; a missing URL fails like a dead server. */
const fakeFetcher = (pages) => async (url) => {
  const page = pages[url];
  if (page === undefined) return { ok: false, status: 0, error: 'ECONNREFUSED' };
  if (typeof page === 'number') return { ok: false, status: page };
  return { ok: true, status: 200, body: Buffer.isBuffer(page) ? page : Buffer.from(page) };
};

const DOC = 'https://labour.example.gov.in/docs/order-2026.pdf';
const LISTING = 'https://labour.example.gov.in/minimum-wages';
const docBytes = samplePdf(false);
const fakeState = {
  state: 'delhi',
  name: 'Delhi',
  sources: [
    { id: 'dl-2026-04', title: 'Order of 1 April 2026', url: DOC, listing: LISTING, sha256: sha256(docBytes) },
    { id: 'dl-2026-04-corr', title: 'Corrigendum in the same file', url: DOC, listing: LISTING, sha256: sha256(docBytes) },
  ],
};
const fakeRegistry = { states: { delhi: { listings: [{ url: LISTING, name: 'Delhi wage orders' }] } } };
const targets = buildTargets([fakeState], fakeRegistry);
const at = (iso) => new Date(`${iso}T03:00:00Z`); // 08:30 IST

// ------------------------------------------------------------------- tests

test('the source registry covers every wage dataset and its listings', () => {
  assert.deepEqual(registryProblems(wageStates, registry), []);
  const all = buildTargets(wageStates, registry);
  for (const state of wageStates) {
    // An Internet Archive capture cannot change, so it is cited but not fetched.
    for (const source of state.sources.filter((s) => !ARCHIVED.test(s.url))) {
      assert.ok(all.some((t) => t.kind === 'document' && t.url === source.url && t.sourceIds.includes(source.id)), source.id);
      // A copy found on a third party's site (via) is watched as a file only.
      if (!source.via) assert.ok(all.some((t) => t.kind === 'listing' && t.url === source.listing), source.listing);
    }
  }
  assert.equal(new Set(all.map((t) => `${t.state} ${targetKey(t)}`)).size, all.length, 'each URL is watched once per state and topic');
});

test('registryProblems catches a listing missing from the registry, a bad pattern and one file with two hashes', () => {
  const problems = registryProblems([fakeState], { states: { delhi: { listings: [{ url: 'https://other.example/', name: 'x', match: '(' }] } } });
  assert.ok(problems.some((p) => p.includes(LISTING)));
  assert.ok(problems.some((p) => p.includes('invalid match')));
  const split = { ...fakeState, sources: [fakeState.sources[0], { ...fakeState.sources[1], sha256: 'e'.repeat(64) }] };
  assert.ok(registryProblems([split], fakeRegistry).some((p) => p.includes('different sha256')));
});

test('buildTargets fetches a file cited twice only once, with both source ids', () => {
  const docs = targets.filter((t) => t.kind === 'document');
  assert.equal(docs.length, 1);
  assert.deepEqual(docs[0].sourceIds, ['dl-2026-04', 'dl-2026-04-corr']);
  assert.equal(docs[0].expectedSha256, sha256(docBytes));
  assert.equal(targets.filter((t) => t.kind === 'listing').length, 1);
});

test('documentLinks resolves, labels and filters document links', () => {
  const html = listingHtml([row('a.pdf', 'Minimum wages from 1 April 2026'), row('b.PDF?x=1', 'Dearness allowance &amp; VDA order')]);
  const links = documentLinks(html, 'https://labour.example.gov.in/pages/list.aspx');
  assert.deepEqual(
    links.map((l) => [l.url, l.label]),
    [
      ['https://labour.example.gov.in/about.pdf', 'About us'],
      ['https://labour.example.gov.in/docs/a.pdf', '1 Minimum wages from 1 April 2026'],
      ['https://labour.example.gov.in/docs/b.PDF?x=1', '1 Dearness allowance & VDA order'],
      ['https://labour.example.gov.in/files/single.pdf', 'Single quoted order'],
    ],
  );
  const wageOnly = documentLinks(html, 'https://labour.example.gov.in/pages/list.aspx', /wage|\bv?da\b/i);
  assert.deepEqual(wageOnly.map((l) => l.url.split('/').pop()), ['a.pdf', 'b.PDF?x=1']);
});

test('documentLinks drops "New" badges and "Accessible Version" size notes', () => {
  const html = `<ul><li><a href="/u/2026.pdf">Uttarakhand Minimum Wages 2026 New</a></li><li>Minimum Wages Chai 2024 Accessible Version : (2 MB) <a href="/u/chai.pdf">View</a></li></ul>`;
  assert.deepEqual(documentLinks(html, 'https://labour.example.gov.in/').map((l) => l.label), ['Uttarakhand Minimum Wages 2026', 'Minimum Wages Chai 2024']);
});

test('documentLinks reads files linked through a forceDownload script (Telangana)', () => {
  const html = `<ul><li><a href="javascript:void(0)" onclick="javascript:forceDownload('https://labour.telangana.gov.in:443/content/minimumWages/Gazzette Notification on CPI numbers for VDA calculations/A01_04_2025.pdf','A01_04_2025.pdf')">A01_04_2025</a></li><li><a href="content/minimumWages/01042026/any%20manufacturing%204.xls">Any manufacturing process</a></li><li><a href="javascript:void(0)" onclick="toggle()">More</a></li></ul>`;
  assert.deepEqual(
    documentLinks(html, 'https://labour.telangana.gov.in/MinRatesWages.do').map((l) => [l.url, l.label]),
    [
      ['https://labour.telangana.gov.in/content/minimumWages/01042026/any%20manufacturing%204.xls', 'Any manufacturing process'],
      ['https://labour.telangana.gov.in/content/minimumWages/Gazzette%20Notification%20on%20CPI%20numbers%20for%20VDA%20calculations/A01_04_2025.pdf', 'A01_04_2025'],
    ],
  );
});

test('htmlText keeps visible text only', () => {
  const text = htmlText('<style>p{}</style><p>Rates&nbsp;from <b>1 April</b></p><script>x()</script><div>Next</div>');
  assert.equal(text, 'Rates from 1 April\nNext');
});

test('extractPdfText reads simple fonts and ToUnicode fonts, drops fake-bold overdraw', () => {
  for (const objStm of [false, true]) {
    const { pages, text } = extractPdfText(samplePdf(objStm));
    assert.equal(pages, 1);
    assert.deepEqual(text.split('\n'), ['Minimum wages from 1 April 2026', 'Unskilled 13,690', 'न्यू'.normalize('NFC')], objStm ? 'object stream' : 'plain objects');
  }
});

test('extractPdfText returns no text for a PDF without a text layer, and describeDocument still hashes it', () => {
  const scan = makePdf({ objects: [[1, '<< /Type /Catalog /Pages 2 0 R >>'], [2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>'], [3, '<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>'], [4, '', 'q 600 0 0 800 0 0 cm /Im0 Do Q']] });
  const d = describeDocument(scan);
  assert.equal(d.pages, 1);
  assert.equal(d.text, '');
  assert.equal(d.textSha256, null);
  assert.equal(d.sha256, sha256(scan));
  assert.equal(describeDocument(Buffer.from('<html>not a pdf</html>')).pages, null);
});

test('parseCMap reads bfchar, bfrange with a base and with an array', () => {
  const { width, map } = parseCMap('1 begincodespacerange <00> <FF> endcodespacerange 1 beginbfchar <41> <0041> endbfchar 1 beginbfrange <61> <63> <0061> endbfrange');
  assert.equal(width, 1);
  assert.equal(map.get(0x62), 'b');
  assert.equal(parseCMap(toUnicode).map.get(3), 'य');
});

test('diffLines is a multiset difference', () => {
  assert.deepEqual(diffLines('a\nb\nb\nc', 'a\nb\nc\nd'), { added: ['d'], removed: ['b'] });
  assert.deepEqual(diffLines('', 'x'), { added: ['x'], removed: [] });
});

test('istDate uses the Indian calendar day', () => {
  assert.equal(istDate(new Date('2026-10-16T18:29:00Z')), '2026-10-16');
  assert.equal(istDate(new Date('2026-10-16T18:31:00Z')), '2026-10-17');
});

test('first run: listings become a baseline, a cited file matching the dataset is unchanged', async () => {
  const run = await runMonitor({ targets, previous: null, fetcher: fakeFetcher({ [DOC]: docBytes, [LISTING]: listingHtml([row('order-2026.pdf', 'Order')]) }), now: at('2026-10-16') });
  assert.deepEqual(run.events, []);
  assert.deepEqual(run.results.map((r) => r.outcome), ['unchanged', 'baseline']);
  assert.equal(run.state.sources[DOC].sha256, sha256(docBytes));
  assert.ok(run.state.sources[DOC].text.includes('13,690'));
  assert.equal(run.state.sources[LISTING].links.length, 3);
});

test('first run: a cited file that differs from the dataset hash is reported', async () => {
  const changed = Buffer.concat([docBytes, Buffer.from('\n% re-saved\n')]);
  const run = await runMonitor({ targets, previous: null, fetcher: fakeFetcher({ [DOC]: changed, [LISTING]: listingHtml([]) }), now: at('2026-10-16') });
  assert.equal(run.events.length, 1);
  const [e] = run.events;
  assert.equal(e.type, 'document-changed');
  assert.deepEqual(e.sourceIds, ['dl-2026-04', 'dl-2026-04-corr']);
  assert.equal(e.before.sha256, sha256(docBytes));
  assert.equal(e.diff, null, 'no stored text to diff on a first run');
});

test('a changed document reports the text diff, once', async () => {
  const day1 = await runMonitor({ targets, previous: null, fetcher: fakeFetcher({ [DOC]: docBytes, [LISTING]: listingHtml([]) }), now: at('2026-10-16') });
  const revised = makePdf({ objects: [[1, '<< /Type /Catalog /Pages 2 0 R >>'], [2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>'], [3, '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>'], [4, '', 'BT /F1 12 Tf 72 720 Td (Minimum wages from 1 April 2026) Tj ET BT /F1 12 Tf 72 700 Td (Unskilled 14,200) Tj ET'], [5, '<< /Type /Font /Subtype /Type1 >>']] });
  const day2 = await runMonitor({ targets, previous: day1.state, fetcher: fakeFetcher({ [DOC]: revised, [LISTING]: listingHtml([]) }), now: at('2026-10-17') });
  assert.equal(day2.events.length, 1);
  assert.deepEqual(day2.events[0].diff.added, ['Unskilled 14,200']);
  assert.ok(day2.events[0].diff.removed.includes('Unskilled 13,690'));
  const day3 = await runMonitor({ targets, previous: day2.state, fetcher: fakeFetcher({ [DOC]: revised, [LISTING]: listingHtml([]) }), now: at('2026-10-18') });
  assert.deepEqual(day3.events, [], 'the new file is the new baseline');
  assert.equal(day3.results[0].outcome, 'differs-from-dataset');
});

test('a listing change reports new and removed documents, flags a cited one and describes the new file', async () => {
  const before = listingHtml([row('order-2026.pdf', 'Order of 1 April 2026'), row('old.pdf', 'Old order')]);
  const after = listingHtml([row('new-order.pdf', 'Minimum wages from 1 October 2026')]);
  const pages = { [DOC]: docBytes, [LISTING]: before };
  const day1 = await runMonitor({ targets, previous: null, fetcher: fakeFetcher(pages), now: at('2026-10-16') });
  const newDoc = 'https://labour.example.gov.in/docs/new-order.pdf';
  const day2 = await runMonitor({ targets, previous: day1.state, fetcher: fakeFetcher({ ...pages, [LISTING]: after, [newDoc]: docBytes }), now: at('2026-10-17') });
  assert.equal(day2.events.length, 1);
  const [e] = day2.events;
  assert.equal(e.type, 'listing-changed');
  assert.deepEqual(e.added.map((l) => l.url), [newDoc]);
  assert.equal(e.added[0].pages, 1);
  assert.ok(e.added[0].figures.includes('Unskilled 13,690'));
  assert.deepEqual(e.removed.map((l) => [l.url.split('/').pop(), l.citedAs]), [['old.pdf', []], ['order-2026.pdf', ['dl-2026-04', 'dl-2026-04-corr']]]);
});

test('a source failing three days in a row alerts once, keeps its baseline, and its recovery is reported', async () => {
  const good = { [DOC]: docBytes, [LISTING]: listingHtml([]) };
  let state = (await runMonitor({ targets, previous: null, fetcher: fakeFetcher(good), now: at('2026-10-10') })).state;
  const down = { [DOC]: docBytes, [LISTING]: 503 };
  const days = ['2026-10-11', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'];
  const eventsPerRun = [];
  for (const day of days) {
    const run = await runMonitor({ targets, previous: state, fetcher: fakeFetcher(down), now: at(day) });
    eventsPerRun.push(run.events.map((e) => e.type));
    state = run.state;
  }
  // Two runs on the 11th count as one day; the alert comes on the third day only.
  assert.deepEqual(eventsPerRun, [[], [], [], ['unreachable'], []]);
  assert.equal(state.sources[LISTING].failing.days, 4);
  assert.equal(state.sources[LISTING].links.length, 2, 'baseline kept while failing');
  const back = await runMonitor({ targets, previous: state, fetcher: fakeFetcher(good), now: at('2026-10-15') });
  assert.deepEqual(back.events.map((e) => e.type), ['recovered']);
  assert.equal(back.state.sources[LISTING].failing, undefined);
});

test('a day with no run does not restart the count; only a successful load does', async () => {
  let state = (await runMonitor({ targets, previous: null, fetcher: fakeFetcher({ [DOC]: docBytes, [LISTING]: listingHtml([]) }), now: at('2026-10-10') })).state;
  const events = [];
  for (const day of ['2026-10-11', '2026-10-12', '2026-10-14']) {
    const run = await runMonitor({ targets, previous: state, fetcher: fakeFetcher({ [DOC]: 404, [LISTING]: listingHtml([]) }), now: at(day) });
    events.push(run.events.map((e) => e.type));
    state = run.state;
  }
  assert.deepEqual(events, [[], [], ['unreachable']], 'the missed 13th (no run) does not reset the count');
  assert.equal(state.sources[DOC].failing.since, '2026-10-11');
  const ok = await runMonitor({ targets, previous: state, fetcher: fakeFetcher({ [DOC]: docBytes, [LISTING]: listingHtml([]) }), now: at('2026-10-15') });
  assert.equal(ok.state.sources[DOC].failing, undefined);
  const again = await runMonitor({ targets, previous: ok.state, fetcher: fakeFetcher({ [DOC]: 404, [LISTING]: listingHtml([]) }), now: at('2026-10-16') });
  assert.equal(again.state.sources[DOC].failing.days, 1, 'a load starts the count again');
});

test('a listing remembers the day each link was first seen, including links that left and came back', async () => {
  const a = row('a.pdf', 'Order A');
  const b = row('b.pdf', 'Order B');
  const url = (f) => `https://labour.example.gov.in/docs/${f}`;
  const day = async (previous, rows, iso) => (await runMonitor({ targets, previous, fetcher: fakeFetcher({ [DOC]: docBytes, [LISTING]: listingHtml(rows) }), now: at(iso), describeNew: false })).state;
  const d1 = await day(null, [a], '2026-10-16');
  assert.equal(d1.sources[LISTING].firstSeen[url('a.pdf')], '2026-10-16', 'a first run counts every link as seen that day');
  const d2 = await day(d1, [a, b], '2026-10-17');
  assert.equal(d2.sources[LISTING].firstSeen[url('a.pdf')], '2026-10-16');
  assert.equal(d2.sources[LISTING].firstSeen[url('b.pdf')], '2026-10-17');
  const d3 = await day(d2, [a], '2026-10-18');
  const d4 = await day(d3, [a, b], '2026-10-19');
  assert.equal(d4.sources[LISTING].firstSeen[url('b.pdf')], '2026-10-17', 'a link that came back is not new');
  const failed = (await runMonitor({ targets, previous: d4, fetcher: fakeFetcher({ [DOC]: docBytes, [LISTING]: 503 }), now: at('2026-10-20') })).state;
  assert.deepEqual(failed.sources[LISTING].firstSeen, d4.sources[LISTING].firstSeen, 'kept while failing');
});

// The listing check (checks.mjs): Delhi-like, hand-checked on the 16th.
const checkedState = { ...fakeState, checked: { on: '2026-10-16' } };
const checkDay = async (previous, pages, iso, state = checkedState) => {
  const run = await runMonitor({ targets, previous, fetcher: fakeFetcher({ [DOC]: docBytes, [LISTING]: listingHtml([row('order-2026.pdf', 'Order')]), ...pages }), now: at(iso), describeNew: false });
  run.state.checks = listingChecks({ wageStates: [state], targets, snapshot: run.state, today: iso, previous: previous?.checks ?? {} });
  return run.state;
};

test('listing check: a clean read counts; a new link blocks it, keeping the last clean day, until a newer hand check', async () => {
  const d1 = await checkDay(null, {}, '2026-10-16');
  assert.deepEqual(d1.checks.delhi, { on: '2026-10-16', datasetCheckedOn: '2026-10-16' }, 'links seen on the day of the hand check were there for it');
  const d2 = await checkDay(d1, {}, '2026-10-17');
  assert.deepEqual(d2.checks.delhi, { on: '2026-10-17', datasetCheckedOn: '2026-10-16' });
  const added = { [LISTING]: listingHtml([row('order-2026.pdf', 'Order'), row('new.pdf', 'Minimum wages from 1 October 2026')]) };
  const d3 = await checkDay(d2, added, '2026-10-18');
  assert.equal(d3.checks.delhi.on, '2026-10-17', 'the last clean read stays true');
  assert.deepEqual(d3.checks.delhi.blocked, { since: '2026-10-18', problems: ['Delhi wage orders: 1 document first seen after the hand check of 2026-10-16'] });
  const d4 = await checkDay(d3, added, '2026-10-19');
  assert.equal(d4.checks.delhi.on, '2026-10-17', 'the listing is unchanged since yesterday, but the new link is still unread');
  assert.equal(d4.checks.delhi.blocked.since, '2026-10-18');
  const rechecked = { ...checkedState, checked: { on: '2026-10-19' } };
  const d5 = await checkDay(d4, added, '2026-10-20', rechecked);
  assert.deepEqual(d5.checks.delhi, { on: '2026-10-20', datasetCheckedOn: '2026-10-19' }, 'a hand check after the new link clears it');
});

test('listing check: a listing that did not load or a replaced cited file is not a check; a new hand check drops the old clean day', async () => {
  const d1 = await checkDay(null, {}, '2026-10-16');
  const down = await checkDay(d1, { [LISTING]: 503 }, '2026-10-18');
  assert.equal(down.checks.delhi.on, '2026-10-16');
  assert.deepEqual(down.checks.delhi.blocked.problems, ['Delhi wage orders: not read today']);
  const blank = await checkDay(d1, { [LISTING]: '<html><body>Under maintenance</body></html>' }, '2026-10-18');
  assert.deepEqual(blank.checks.delhi.blocked.problems, ['Delhi wage orders: not read today'], 'a page with no documents is a failed load, not a clean one');
  const replaced = await checkDay(d1, { [DOC]: Buffer.concat([docBytes, Buffer.from('\n% re-saved\n')]) }, '2026-10-18');
  assert.deepEqual(replaced.checks.delhi.blocked.problems, ['Order of 1 April 2026: the file differs from the one the dataset cites']);
  const newer = await checkDay(down, { [LISTING]: 503 }, '2026-10-19', { ...checkedState, checked: { on: '2026-10-19' } });
  assert.equal(newer.checks.delhi.on, undefined, 'a clean day against an older hand check says nothing about the new figures');
  assert.equal(newer.checks.delhi.datasetCheckedOn, '2026-10-19');
});

test('listing check: a snapshot from before first-seen dates (or none) proves nothing until the next hand check', async () => {
  const d1 = await checkDay(null, {}, '2026-10-16');
  assert.equal(d1.checks.delhi.on, '2026-10-16');
  delete d1.sources[LISTING].firstSeen;
  delete d1.checks;
  const d2 = await checkDay(d1, {}, '2026-10-18');
  assert.equal(d2.checks.delhi.on, undefined);
  assert.match(d2.checks.delhi.blocked.problems[0], /first seen after the hand check/);
  const fresh = await checkDay(null, {}, '2026-10-18');
  assert.equal(fresh.checks.delhi.on, undefined, 'a lost snapshot: every link is new');
});

test('listing check: --only keeps the other states, and the published file is what the pages read', async () => {
  const d1 = await checkDay(null, {}, '2026-10-16');
  const kept = listingChecks({ wageStates: [checkedState], targets: [], snapshot: d1, today: '2026-10-17', previous: { ...d1.checks, haryana: { on: '2026-10-15', datasetCheckedOn: '2026-10-10' } } });
  assert.deepEqual(kept.haryana, { on: '2026-10-15', datasetCheckedOn: '2026-10-10' });
  assert.deepEqual(kept.delhi, d1.checks.delhi, 'a state with no targets this run is left as it was');
  const doc = checksDocument({ ...kept, uttarakhand: { datasetCheckedOn: '2026-10-17', blocked: { since: '2026-10-17', problems: ['x'] } } }, at('2026-10-17'));
  assert.equal(CHECKS_KEY, 'monitor/wage-listing-checks.json');
  assert.deepEqual(parseListingChecks(JSON.parse(JSON.stringify(doc))), { delhi: { on: '2026-10-16', datasetCheckedOn: '2026-10-16' }, haryana: { on: '2026-10-15', datasetCheckedOn: '2026-10-10' } });
  assert.match(checksNote(doc.states, '2026-10-16', 'Published.'), /^Listing checks: 1 state checked clean; uttarakhand not counted \(x\)\. Published\.$/);
});

test('a firewall or error page served with 200 counts as a failed fetch, not a change', async () => {
  const full = { [DOC]: docBytes, [LISTING]: listingHtml([row('order-2026.pdf', 'Order of 1 April 2026'), row('old.pdf', 'Old order')]) };
  const rejected = '<html><body><h1>Request Rejected</h1><p>The requested URL was rejected.</p></body></html>';
  const day1 = await runMonitor({ targets, previous: null, fetcher: fakeFetcher(full), now: at('2026-10-16') });
  const blocked = async () => ({ ok: true, status: 200, contentType: 'text/html', body: Buffer.from(rejected) });
  const day2 = await runMonitor({ targets, previous: day1.state, fetcher: blocked, now: at('2026-10-17') });
  assert.deepEqual(day2.events, []);
  assert.deepEqual(day2.results.map((r) => r.outcome), ['failed', 'failed']);
  assert.match(day2.results[0].detail, /HTML page instead of the PDF/);
  assert.match(day2.results[1].detail, /looks empty/);
  assert.equal(day2.state.sources[LISTING].links.length, 4, 'baseline kept');
  assert.equal(day2.state.sources[DOC].sha256, sha256(docBytes), 'baseline kept');
  const day3 = await runMonitor({ targets, previous: day2.state, fetcher: fakeFetcher(full), now: at('2026-10-18') });
  assert.deepEqual(day3.events, [], 'the page coming back is not a change either');
  assert.deepEqual(day3.results.map((r) => r.outcome), ['unchanged', 'unchanged']);
  // A first run against a blocked listing records no empty baseline.
  const first = await runMonitor({ targets, previous: null, fetcher: blocked, now: at('2026-10-16') });
  assert.equal(first.state.sources[LISTING].links, undefined);
});

test('a listing that loses most of its links counts as a failed fetch', async () => {
  const many = Array.from({ length: 10 }, (_, i) => row(`o${i}.pdf`, `Order ${i}`));
  const day1 = await runMonitor({ targets, previous: null, fetcher: fakeFetcher({ [DOC]: docBytes, [LISTING]: listingHtml(many) }), now: at('2026-10-16') });
  const day2 = await runMonitor({ targets, previous: day1.state, fetcher: fakeFetcher({ [DOC]: docBytes, [LISTING]: listingHtml(many.slice(0, 2)) }), now: at('2026-10-17') });
  assert.deepEqual(day2.events, []);
  assert.match(day2.results[1].detail, /lost most of its links \(4 of 12\)/);
});

test('a host that does not respond costs one timeout per run, and hosts are fetched concurrently', async () => {
  const other = 'https://other.example.gov.in/wages';
  const hanging = buildTargets(
    [{ ...fakeState, sources: [...fakeState.sources, { id: 'dl-x', title: 'Second order', url: 'https://labour.example.gov.in/docs/x.pdf', listing: LISTING, sha256: 'f'.repeat(64) }] }],
    { states: { delhi: { listings: [{ url: LISTING, name: 'Delhi wage orders' }, { url: other, name: 'Other' }] } } },
  );
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    if (url.startsWith('https://labour.example.gov.in/')) return { ok: false, status: 0, error: 'TimeoutError' };
    return { ok: true, status: 200, body: Buffer.from(listingHtml([])) };
  };
  const run = await runMonitor({ targets: hanging, previous: null, fetcher, now: at('2026-10-16') });
  assert.equal(calls.filter((u) => u.startsWith('https://labour.example.gov.in/')).length, 1);
  assert.ok(calls.includes(other));
  assert.deepEqual(run.results.map((r) => r.outcome), ['failed', 'failed', 'failed', 'baseline']);
  assert.match(run.results[1].detail, /skipped: labour\.example\.gov\.in did not respond/);
});

test('a file new on two listings is fetched once and described once in the issue', async () => {
  const second = 'https://labour.example.gov.in/';
  const both = buildTargets([fakeState], { states: { delhi: { listings: [{ url: LISTING, name: 'Delhi wage orders' }, { url: second, name: 'Home page notices' }] } } });
  const before = listingHtml([row('order-2026.pdf', 'Order of 1 April 2026')]);
  const newDoc = 'https://labour.example.gov.in/docs/new-order.pdf';
  const after = listingHtml([row('order-2026.pdf', 'Order of 1 April 2026'), row('new-order.pdf', 'Minimum wages from 1 October 2026')]);
  const day1 = await runMonitor({ targets: both, previous: null, fetcher: fakeFetcher({ [DOC]: docBytes, [LISTING]: before, [second]: before }), now: at('2026-10-16') });
  const calls = [];
  const pages = fakeFetcher({ [DOC]: docBytes, [LISTING]: after, [second]: after, [newDoc]: docBytes });
  const day2 = await runMonitor({ targets: both, previous: day1.state, fetcher: (url) => (calls.push(url), pages(url)), now: at('2026-10-17') });
  assert.equal(day2.events.length, 2);
  assert.equal(calls.filter((u) => u === newDoc).length, 1);
  assert.ok(day2.events.every((e) => e.added[0].pages === 1));
  const [action] = await reportEvents(day2.events, { github: null, today: '2026-10-17', env: {} });
  assert.equal(action.stateName, 'Delhi');
  assert.equal(action.body.split('Unskilled 13,690').length - 1, 1, 'figures shown once');
  assert.ok(action.body.includes('also new on Delhi wage orders, described above'));
});

/** A GitHub client double that records calls. */
function fakeGitHub(openIssues = []) {
  const calls = [];
  return {
    calls,
    ensureLabel: async () => calls.push(['label']),
    findOpenIssue: async (title) => openIssues.find((i) => i.title === title) ?? null,
    listCommentBodies: async (n) => openIssues.find((i) => i.number === n)?.comments ?? [],
    createIssue: async (title, body) => (calls.push(['create', title, body]), { number: 7 }),
    comment: async (n, body) => calls.push(['comment', n, body]),
  };
}
const changeEvent = { type: 'document-changed', state: 'delhi', stateName: 'Delhi', url: DOC, name: 'Order [1] @someone', sourceIds: ['dl-2026-04'], before: { sha256: 'a'.repeat(64), bytes: 1000, pages: 2 }, after: { sha256: 'b'.repeat(64), bytes: 2000, pages: 3 }, diff: { added: ['Unskilled 14,200'], removed: [] }, hasText: true };

test('reportEvents opens an issue per state with the label, links and a fingerprint', async () => {
  const gh = fakeGitHub();
  const actions = await reportEvents([changeEvent], { github: gh, today: '2026-10-17', env: {} });
  assert.deepEqual(actions.map((a) => a.action), ['create']);
  const [, title, body] = gh.calls.find((c) => c[0] === 'create');
  assert.equal(title, issueTitle('Delhi'));
  assert.ok(gh.calls.some((c) => c[0] === 'label'));
  assert.ok(body.includes('src/content/wages/delhi.json'));
  assert.ok(body.includes(`](${DOC})`));
  assert.ok(body.includes('Unskilled 14,200'));
  assert.ok(body.includes('Order \\[1\\] @​someone'), 'page text cannot add links or mention anyone');
  assert.ok(body.includes(`<!-- wage-monitor:${fingerprint(changeEvent)} -->`));
});

test('reportEvents comments on the open issue and never repeats an event already reported', async () => {
  const issue = { number: 3, title: issueTitle('Delhi'), body: 'x', comments: [] };
  const gh = fakeGitHub([issue]);
  const first = await reportEvents([changeEvent], { github: gh, today: '2026-10-17', env: {} });
  assert.deepEqual(first.map((a) => [a.action, a.issue]), [['comment', 3]]);
  issue.comments.push(gh.calls.find((c) => c[0] === 'comment')[2]);
  const again = await reportEvents([changeEvent], { github: gh, today: '2026-10-18', env: {} });
  assert.deepEqual(again.map((a) => a.action), ['skip']);
  assert.equal(gh.calls.filter((c) => c[0] === 'comment').length, 1);
});

test('a recovery alone does not open an issue; a dry run plans without calling GitHub', async () => {
  const recovered = { type: 'recovered', state: 'delhi', stateName: 'Delhi', url: LISTING, name: 'Delhi wage orders', since: '2026-10-11' };
  const gh = fakeGitHub();
  assert.deepEqual((await reportEvents([recovered], { github: gh, today: '2026-10-17', env: {} })).map((a) => a.action), ['skip']);
  assert.equal(gh.calls.filter((c) => c[0] !== 'label').length, 0);
  const planned = await reportEvents([changeEvent], { github: null, today: '2026-10-17', env: {} });
  assert.deepEqual(planned.map((a) => a.action), ['create (dry run)']);
  assert.ok(planned[0].body.length > 100);
});

test('safe() escapes Markdown and HTML from government pages', () => {
  assert.equal(safe('<b>x</b> [y](z) @team'), '\\<b\\>x\\</b\\> \\[y\\]\\(z\\) @​team');
});

test('fetchSource retries a server error once, not a 404, and never throws', async () => {
  let calls = 0;
  const flaky = async () => (++calls === 1 ? new Response('busy', { status: 503 }) : new Response('ok'));
  const ok = await fetchSource('https://x.example/', { fetchImpl: flaky, retryDelayMs: 0 });
  assert.equal(ok.ok, true);
  assert.equal(calls, 2);
  calls = 0;
  const missing = await fetchSource('https://x.example/', { fetchImpl: async () => (calls++, new Response('', { status: 404 })), retryDelayMs: 0 });
  assert.deepEqual([missing.ok, missing.status, calls], [false, 404, 1]);
  const down = await fetchSource('https://x.example/', { fetchImpl: async () => { throw Object.assign(new Error('fetch failed'), { cause: { code: 'ENOTFOUND' } }); }, retryDelayMs: 0 });
  assert.deepEqual([down.ok, down.error], [false, 'ENOTFOUND']);
});

// ------------------------------------------------------------------ topics

test('every published state is watched for wages, PT, LWF and the licence; EPF, ESIC and the codes nationally; every dues source is watched', async () => {
  const { statutorySources } = await importTs('src/content/statutory.ts');
  const { guideSources } = await importTs('src/content/guides/sources.ts');
  // Guides too (18 Oct 2026), so a guide cannot go public on unwatched sources; India Code is watched as its Gazette copy.
  const cited = [...statutorySources.map((s) => s.url), ...guideSources.map((s) => s.watchedAs ?? s.url).filter(Boolean)];
  assert.deepEqual(coverageProblems(wageStates, registry, cited), []);
  const bare = coverageProblems([fakeState], fakeRegistry, ['https://example.gov.in/rules.pdf']);
  for (const want of ['delhi: no source watched for Professional Tax', 'delhi: no source watched for Labour Welfare Fund', 'national: no source watched for EPF', 'national: no source watched for ESIC', 'https://example.gov.in/rules.pdf is cited on the site but not watched']) {
    assert.ok(bare.some((p) => p.startsWith(want)), want);
  }
});

test('one page watched for two topics keeps two snapshot entries', () => {
  const page = 'https://labour.example.gov.in/acts/';
  const reg = { states: { delhi: { listings: [{ url: LISTING, name: 'Delhi wage orders' }, { url: page, name: 'Acts (LWF)', topic: 'lwf', match: 'welfare' }, { url: page, name: 'Acts (OSH)', topic: 'licence', match: 'OSH' }] } } };
  const t = buildTargets([fakeState], reg).filter((x) => x.url === page);
  assert.deepEqual(t.map((x) => x.topic), ['lwf', 'licence']);
  assert.deepEqual(t.map(targetKey), [`lwf:${page}`, `licence:${page}`]);
});

test('a watched page compares only its matching lines, in any order', async () => {
  const url = 'https://esic.example.gov.in/contribution';
  const reg = { states: {}, national: { pages: [{ url, name: 'ESIC rates', topic: 'esic', match: '%' }] } };
  const t = buildTargets([], reg);
  const html = (lines) => `<html><body>${lines.map((l) => `<p>${l}</p>`).join('')}</body></html>`;
  const fetchWith = (lines) => async () => ({ ok: true, status: 200, contentType: 'text/html', body: Buffer.from(html(lines)) });
  assert.deepEqual(pageLines(html(['b 3.25%', 'news today', 'a 0.75%']), /%/), ['a 0.75%', 'b 3.25%']);
  const d1 = await runMonitor({ targets: t, previous: null, fetcher: fetchWith(['Employee 0.75%', 'Visitors: 1', 'Employer 3.25%']), now: at('2026-10-16'), describeNew: false });
  assert.equal(d1.events.length, 0);
  const d2 = await runMonitor({ targets: t, previous: d1.state, fetcher: fetchWith(['Employer 3.25%', 'Visitors: 2', 'Employee 0.75%']), now: at('2026-10-17'), describeNew: false });
  assert.equal(d2.events.length, 0, 'reordered text and other lines are not a change');
  const d3 = await runMonitor({ targets: t, previous: d2.state, fetcher: fetchWith(['Employer 3.5%', 'Employee 0.75%']), now: at('2026-10-18'), describeNew: false });
  assert.equal(d3.events.length, 1);
  assert.deepEqual([d3.events[0].type, d3.events[0].topic, d3.events[0].state, d3.events[0].added, d3.events[0].removed], ['page-changed', 'esic', 'national', ['Employer 3.5%'], ['Employer 3.25%']]);
});

const epfEvent = { type: 'page-changed', state: 'national', stateName: 'All states', topic: 'epf', url: 'https://epfo.example.gov.in/rates', name: 'EPF rates', added: ['Ceiling 30,000'], removed: ['Ceiling 25,000'] };
const ukEvent = { ...changeEvent, topic: 'wages' };

// ---------------------------------------------------------------- notification hub

function fakeHub({ status = 202, rejected = [] } = {}) {
  const posts = [];
  const fetchImpl = async (url, init) => {
    posts.push({ url, secret: init.headers['x-vspl-notify-secret'], body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ ok: status === 202, ids: ['1'], rejected, piiDropped: 0 }), { status });
  };
  return { posts, hub: hubClient({ url: 'http://windmill.test/api/r/webhook/vspl-notify', secret: 'unit-hub-secret', fetchImpl }) };
}

test('--notify takes a comma list of known destinations', () => {
  assert.deepEqual(parseNotify('github,hub', ['github', 'hub']), ['github', 'hub']);
  assert.deepEqual(parseNotify(' hub , hub ', ['github', 'hub']), ['hub']);
  assert.throws(() => parseNotify('chatwoot,hub', ['github', 'hub']), /--notify must be one or more of github, hub/);
  assert.throws(() => parseNotify('', ['hub']), /--notify/);
  assert.throws(() => hubFromEnv({}), /NOTIFY_URL and NOTIFY_INGEST_SECRET/);
});

test('hub: one event per state and topic, source_changed for a change, the detail in the body only, never the same change twice', async () => {
  const { posts, hub } = fakeHub();
  const state = {};
  const first = await reportToHub([ukEvent, epfEvent], { hub, state, today: '2026-10-17' });
  assert.deepEqual(first.map((a) => a.action), ['hub', 'hub']);
  assert.equal(posts.length, 1, 'one request for the run');
  assert.equal(posts[0].secret, 'unit-hub-secret');
  const [uk, epf] = posts[0].body.events;
  assert.deepEqual([uk.v, uk.source, uk.type, uk.severity], [1, 'compliance', 'compliance.source_changed', 'notice']);
  assert.equal(uk.title, `Minimum wages · ${ukEvent.stateName}: a source changed`);
  assert.match(uk.dedupeKey, new RegExp(`^compliance:${ukEvent.state}:wages:[0-9a-f]{16}$`));
  assert.equal(epf.title, 'EPF · all states: a source changed');
  assert.match(epf.summary, /^1 change in the primary sources on 17 October 2026/);
  assert.doesNotMatch(`${epf.title} ${epf.summary}`, /Ceiling/, 'the figures are in the email body, not the push');
  assert.match(epf.body, /Ceiling 30,000/);
  assert.equal(epf.link.url, 'https://epfo.example.gov.in/rates');
  assert.equal(epf.pii, undefined);
  assert.deepEqual(await reportToHub([ukEvent, epfEvent], { hub, state, today: '2026-10-18' }), []);
  assert.equal(posts.length, 1);
  // The same changes in another run (the snapshot was lost) get the same dedupeKey, which the hub sends once.
  const again = fakeHub();
  await reportToHub([epfEvent], { hub: again.hub, state: {}, today: '2026-10-18' });
  assert.equal(again.posts[0].body.events[0].dedupeKey, epf.dedupeKey);
});

test('hub: an unreachable source goes to the digest; a recovery alone is sent only once the hub has heard from the monitor; a refusal fails the run', async () => {
  const unreachable = { type: 'unreachable', state: 'delhi', stateName: 'Delhi', topic: 'lwf', url: 'https://x.example/lwf', name: 'LWF', since: '2026-10-10', days: 3, error: 'HTTP 503' };
  const recovered = { ...unreachable, type: 'recovered' };
  const { posts, hub } = fakeHub();
  assert.deepEqual(await reportToHub([recovered], { hub, state: {}, today: '2026-10-17' }), []);
  const state = {};
  await reportToHub([unreachable], { hub, state, today: '2026-10-17' });
  assert.equal(posts[0].body.events[0].type, 'compliance.source_unreachable');
  assert.equal(posts[0].body.events[0].severity, 'info');
  await reportToHub([recovered], { hub, state, today: '2026-10-20' });
  assert.equal(posts[1].body.events[0].type, 'compliance.source_recovered');
  const refused = fakeHub({ status: 403 });
  const s2 = {};
  await assert.rejects(reportToHub([ukEvent], { hub: refused.hub, state: s2, today: '2026-10-17' }), /notification hub: HTTP 403/);
  assert.deepEqual(s2.hub.reported, {}, 'nothing recorded, so the next run reports it again');
  await assert.rejects(fakeHub({ rejected: [{ index: 0, errors: ['x'] }] }).hub.send([{}]), /rejected 1 of 1/);
  const planned = await reportToHub([ukEvent], { hub: null, state: {}, today: '2026-10-17' });
  assert.equal(planned[0].action, 'hub (dry run)');
});

test('hub: a failed monitor is compliance.monitor_failed, once a day', () => {
  const e = monitorFailedEvent(new Error('Source registry problems:\n- one\n- two'), '2026-10-17');
  assert.deepEqual([e.type, e.severity, e.dedupeKey], ['compliance.monitor_failed', 'warning', 'compliance:monitor_failed:2026-10-17']);
  assert.match(e.body, /Source registry problems/);
});

test('the snapshot carries what the hub was told, so a change is not reported again the next day', async () => {
  const t = buildTargets([fakeState], fakeRegistry);
  const fetcher = async () => ({ ok: true, status: 200, contentType: 'text/html', body: Buffer.from('<p>x</p>') });
  const first = await runMonitor({ targets: t, previous: null, fetcher, now: at('2026-10-17'), describeNew: false });
  first.state.hub = { reported: { abc: '2026-10-17' } };
  const next = await runMonitor({ targets: t, previous: first.state, fetcher, now: at('2026-10-18'), describeNew: false });
  assert.deepEqual(next.state.hub, { reported: { abc: '2026-10-17' } });
  assert.equal('chatwoot' in next.state, false);
});

test('seo-watch: the weekly report is email only with no search data in title or summary; a tripped rule is pushed; a failure is seo.watch_failed', () => {
  const message = '**SEO weekly** | 1,234 impressions | top query: sidcul jobs';
  const [weekly] = seoEvents({ weekEnd: '2026-10-11', ruleStatus: 'counting', message });
  assert.deepEqual([weekly.type, weekly.dedupeKey], ['seo.weekly_report', 'seo:weekly:2026-10-11']);
  assert.equal(weekly.body, message);
  assert.doesNotMatch(`${weekly.title} ${weekly.summary}`, /1,234|sidcul/);
  const tripped = seoEvents({ weekEnd: '2026-10-11', ruleStatus: 'tripped', message });
  assert.deepEqual(tripped.map((e) => e.type), ['seo.weekly_report', 'seo.rule_tripped']);
  assert.doesNotMatch(`${tripped[1].title} ${tripped[1].summary}`, /1,234|sidcul/);
  const failed = seoFailedEvent(new Error('Search Console query: HTTP 403'), '2026-10-19');
  assert.deepEqual([failed.type, failed.dedupeKey], ['seo.watch_failed', 'seo:watch_failed:2026-10-19']);
});

test('renderTopicMessage names the state file for wages and statutory.ts otherwise', () => {
  const lwf = renderTopicMessage({ topic: 'lwf', slug: 'delhi', stateName: 'Delhi', events: [{ ...epfEvent, state: 'delhi', stateName: 'Delhi', topic: 'lwf' }], today: '2026-10-17' });
  assert.match(lwf, /^\*\*Labour Welfare Fund · Delhi: a source changed\*\*/);
  assert.match(lwf, /the Delhi page/);
  assert.match(lwf, /statutory\.ts/);
});

test('a lead page may show nothing on a state, and is watched once per state', async () => {
  const lead = { kind: 'page', url: 'https://firm.example/posts/', name: 'Lead', match: 'uttar pradesh', topic: 'wages', allowEmpty: true };
  const targets = [
    { ...lead, state: 'uttar-pradesh', stateName: 'Uttar Pradesh' },
    { ...lead, state: 'punjab', stateName: 'Punjab', match: 'punjab' },
  ];
  assert.notEqual(targetKey(targets[0]), targetKey(targets[1]));
  const fetcher = async () => ({ ok: true, status: 200, contentType: 'text/html', body: Buffer.from('<p>Minimum wages: Uttar Pradesh, October 2026</p>') });
  const run = await runMonitor({ targets, previous: null, fetcher, now: at('2026-10-17') });
  assert.deepEqual(run.results.map((r) => r.outcome), ['baseline', 'baseline']);
  assert.deepEqual(run.events, []);
});

test('an empty lead page is a failed load, not every line gone', async () => {
  const lead = { kind: 'page', url: 'https://firm.example/posts/', name: 'Lead', match: 'uttar pradesh', topic: 'wages', allowEmpty: true, state: 'uttar-pradesh', stateName: 'Uttar Pradesh' };
  const page = (html) => async () => ({ ok: true, status: 200, contentType: 'text/html', body: Buffer.from(html) });
  const day1 = await runMonitor({ targets: [lead], previous: null, fetcher: page('<p>Minimum wages: Uttar Pradesh, October 2026</p>'), now: at('2026-10-17') });
  const day2 = await runMonitor({ targets: [lead], previous: day1.state, fetcher: page(''), now: at('2026-10-18') });
  assert.equal(day2.results[0].outcome, 'failed');
  assert.match(day2.results[0].detail, /came back empty/);
  assert.deepEqual(day2.events, []);
});

test('a lead page alerts on a new post, never on one that aged off the feed', async () => {
  const lead = { kind: 'page', url: 'https://firm.example/posts/', name: 'Lead', match: 'uttar pradesh', topic: 'wages', allowEmpty: true, state: 'uttar-pradesh', stateName: 'Uttar Pradesh' };
  const page = (html) => async () => ({ ok: true, status: 200, contentType: 'text/html', body: Buffer.from(html) });
  const day1 = await runMonitor({ targets: [lead], previous: null, fetcher: page('<p>Minimum wages: Uttar Pradesh, April 2026</p><p>Delhi DA order</p>'), now: at('2026-10-16') });
  // The UP post scrolled off; the page still has text, just nothing on this state.
  const day2 = await runMonitor({ targets: [lead], previous: day1.state, fetcher: page('<p>Delhi DA order</p><p>Haryana LWF notice</p>'), now: at('2026-10-17') });
  assert.equal(day2.results[0].outcome, 'unchanged');
  assert.deepEqual(day2.events, []);
  const day3 = await runMonitor({ targets: [lead], previous: day2.state, fetcher: page('<p>Minimum wages: Uttar Pradesh, October 2026</p>'), now: at('2026-10-18') });
  assert.equal(day3.results[0].outcome, 'changed');
  assert.deepEqual(day3.events.map((e) => [e.type, e.added, e.removed]), [['page-changed', ['Minimum wages: Uttar Pradesh, October 2026'], []]]);
});

test("a lead page's state menu and category tags are ignored; its posts' titles and excerpts are not", async () => {
  const registry = JSON.parse(readFileSync(new URL('../scripts/wage-monitor/sources.json', import.meta.url), 'utf8'));
  const ascent = registry.states.haryana.pages.find((p) => p.url.includes('ascent-hr.com'));
  const lead = { kind: 'page', url: ascent.url, name: 'Lead', match: ascent.match, ignore: ascent.ignore, topic: 'wages', allowEmpty: true, state: 'haryana', stateName: 'Haryana' };
  const page = (lines) => async () => ({ ok: true, status: 200, contentType: 'text/html', body: Buffer.from(lines.map((l) => `<p>${l}</p>`).join('')) });
  const menu = ['Haryana', 'Haryana , Notification', 'Karnataka , Notification'];
  const day1 = await runMonitor({ targets: [lead], previous: null, fetcher: page(['Punjab']), now: at('2026-10-18') });
  // The menu appearing (AscentHR answering again after empty pages) is not news.
  const day2 = await runMonitor({ targets: [lead], previous: day1.state, fetcher: page(menu), now: at('2026-10-19') });
  assert.deepEqual(day2.events, []);
  const post = ['Revision of Minimum Wages – Haryana – 011126', 'Haryana , Minimum Wages Act , Notification', 'The Government of Haryana, vide notification no. 123, dated 1st November 2026, has revised..'];
  const day3 = await runMonitor({ targets: [lead], previous: day2.state, fetcher: page([...menu, ...post]), now: at('2026-11-02') });
  assert.deepEqual(day3.events.map((e) => e.added), [[post[0], post[2]]]);
  assert.ok(registryProblems([], { states: {}, national: { pages: [{ url: 'https://firm.example/', name: 'x', match: 'a', ignore: '(' }] } }).some((p) => p.includes('invalid ignore')));
});

test('relayed hosts go through the relay with the secret, and the relay fetches only allowed hosts', async () => {
  const calls = [];
  const viaRelay = relayFetch({ url: 'https://relay.example/', secret: 's3cret', fetchImpl: async (url, init) => (calls.push([url, init.headers]), new Response('%PDF-1.4', { status: 200 })) });
  const res = await fetchSource('https://pblabour.gov.in/a b.pdf', { fetchImpl: viaRelay, userAgent: 'Mozilla/5.0' });
  assert.equal(res.ok, true);
  assert.equal(calls[0][0], 'https://relay.example/?url=https%3A%2F%2Fpblabour.gov.in%2Fa+b.pdf');
  assert.equal(calls[0][1]['x-relay-secret'], 's3cret');
  assert.equal(calls[0][1]['user-agent'], 'Mozilla/5.0');

  const registry = JSON.parse(readFileSync(new URL('../scripts/wage-monitor/sources.json', import.meta.url), 'utf8'));
  const toml = readFileSync(new URL('../scripts/wage-monitor/relay/wrangler.toml', import.meta.url), 'utf8');
  assert.deepEqual(toml.match(/^ALLOWED_HOSTS = "(.*)"$/m)[1].split(','), registry.relayHosts, 'the Worker allows exactly sources.json relayHosts');

  const { default: worker } = await import('../scripts/wage-monitor/relay/worker.mjs');
  const env = { RELAY_SECRET: 's3cret', ALLOWED_HOSTS: 'pblabour.gov.in' };
  const ask = (target, secret = 's3cret', method = 'GET') => worker.fetch(new Request(`https://relay.example/?url=${encodeURIComponent(target)}`, { method, headers: { 'x-relay-secret': secret } }), env);
  const real = globalThis.fetch;
  const upstream = [];
  globalThis.fetch = async (url) => {
    upstream.push(String(url));
    if (String(url).endsWith('/old.pdf')) return new Response(null, { status: 302, headers: { location: '/new.pdf' } });
    if (String(url).endsWith('/away.pdf')) return new Response(null, { status: 302, headers: { location: 'https://evil.example/x' } });
    return new Response('%PDF-1.4', { status: 200, headers: { 'content-type': 'application/pdf' } });
  };
  try {
    assert.equal((await ask('https://pblabour.gov.in/x.pdf', 'wrong')).status, 403);
    assert.equal((await ask('https://pblabour.gov.in/x.pdf', 's3cret', 'POST')).status, 405);
    assert.equal((await ask('https://evil.example/x')).status, 400);
    assert.equal((await ask('http://pblabour.gov.in/x.pdf')).status, 400);
    assert.equal(upstream.length, 0, 'nothing is fetched for a refused request');
    const moved = await ask('https://pblabour.gov.in/old.pdf');
    assert.equal(moved.status, 200);
    assert.equal(await moved.text(), '%PDF-1.4');
    assert.deepEqual(upstream, ['https://pblabour.gov.in/old.pdf', 'https://pblabour.gov.in/new.pdf']);
    assert.equal((await ask('https://pblabour.gov.in/away.pdf')).status, 502, 'a redirect off the allowed hosts is refused');
  } finally {
    globalThis.fetch = real;
  }
});

test('the Ministry of Labour documents API is read as a listing of its posts, not fetched as files', async () => {
  const body = JSON.stringify({ posts: [
    { ID: 1, post_slug: 'epfo-wage-ceiling', post_title: 'Gazette Notification- EPFO Wage Ceiling of Rs. 25,000', post_date: '2026-09-21 17:07:57', acf_data: { date: '17/09/2026' } },
    { ID: 2, post_slug: 'code-on-wages', post_title: 'Implementation of Code on Wages, 2019', post_date: '2026-09-23 16:01:19' },
  ] });
  const links = wpDocumentLinks(body, 'https://www.labour.gov.in/documents/');
  assert.deepEqual(links.map((l) => [l.url, l.label, l.page]), [
    ['https://www.labour.gov.in/documents/code-on-wages', '2026-09-23: Implementation of Code on Wages, 2019', true],
    ['https://www.labour.gov.in/documents/epfo-wage-ceiling', '17/09/2026: Gazette Notification- EPFO Wage Ceiling of Rs. 25,000', true],
  ]);
  assert.deepEqual(wpDocumentLinks('<html>not json</html>', 'https://x.example/'), []);
  const target = { kind: 'listing', url: 'https://www.labour.gov.in/cms/wp-json/document/documents?x', name: 'MoLE', topic: 'codes', format: 'wp-documents', publicBase: 'https://www.labour.gov.in/documents/', state: 'national', stateName: 'All states' };
  const json = (posts) => async () => ({ ok: true, status: 200, contentType: 'application/json', body: Buffer.from(JSON.stringify({ posts })) });
  const day1 = await runMonitor({ targets: [target], previous: null, fetcher: json(JSON.parse(body).posts), now: at('2026-10-17') });
  let described = 0;
  const day2 = await runMonitor({ targets: [target], previous: day1.state, now: at('2026-10-18'), fetcher: async (url) => (url === target.url ? json([...JSON.parse(body).posts, { ID: 3, post_slug: 'esi-ceiling', post_title: 'ESI wage ceiling', post_date: '2026-10-18 10:00:00' }])() : (described++, { ok: false, status: 404 })) });
  assert.deepEqual(day2.events.map((e) => [e.type, e.added.map((l) => l.label)]), [['listing-changed', ['2026-10-18: ESI wage ceiling']]]);
  assert.equal(described, 0);
});

test("Andhra Pradesh's labour site is read from its app bundle: the documents its notices link, by label", async () => {
  const base = 'https://api.example/download/';
  const shell = '<!doctype html><html><head><script defer="defer" src="/static/js/main.d4edcfa0.js"></script></head><body><div id="root"></div></body></html>';
  assert.equal(spaScript(shell, 'https://labour.ap.gov.in/'), 'https://labour.ap.gov.in/static/js/main.d4edcfa0.js');
  assert.equal(spaScript('<html><body>no app</body></html>', 'https://labour.ap.gov.in/'), null);
  const bundle = (extra = '') =>
    `const DU="${base}";[{text:"VDA Gazette as on 01.10.2026",link:DU+"labour/1790751054626_VDAGazetteason01.10.2026.pdf"},{text:"\\u0c35\\u0c47\\u0c24\\u0c28\\u0c3e\\u0c32 \\u0c15\\u0c4b\\u0c21\\u0c4d",link:"labour/1771002428044_2026LFBI_40325_RT39_E.pdf",isNew:!1}${extra}];var t={name:"1any manufacturing.xls",url:"labour/1757000266110_1anymanufacturing.xls"};var x="labour/1755781796413_RTI_Act2005.pdf";`;
  const links = spaBundleLinks(bundle(), base);
  assert.deepEqual(links.map((l) => [l.url.slice(base.length), l.label]), [
    ['labour/1755781796413_RTI_Act2005.pdf', '1755781796413_RTI_Act2005.pdf'],
    ['labour/1757000266110_1anymanufacturing.xls', '1any manufacturing.xls'],
    ['labour/1771002428044_2026LFBI_40325_RT39_E.pdf', 'వేతనాల కోడ్'],
    ['labour/1790751054626_VDAGazetteason01.10.2026.pdf', 'VDA Gazette as on 01.10.2026'],
  ]);
  assert.deepEqual(spaBundleLinks(bundle(), base, /vda/i).map((l) => l.label), ['VDA Gazette as on 01.10.2026']);
  // In the monitor: the shell, then its bundle; a new notice is a listing change.
  const target = { kind: 'listing', url: 'https://labour.ap.gov.in/', name: 'AP labour', topic: 'wages', format: 'spa-bundle', publicBase: base, match: 'vda|wage', state: 'andhra-pradesh', stateName: 'Andhra Pradesh' };
  const site = (js) => async (url) => ({ ok: true, status: 200, contentType: url.endsWith('.js') ? 'text/javascript' : 'text/html', body: Buffer.from(url.endsWith('.js') ? js : shell) });
  const day1 = await runMonitor({ targets: [target], previous: null, fetcher: site(bundle()), now: at('2026-10-22') });
  assert.equal(day1.results[0].outcome, 'baseline');
  const april = ',{text:"VDA Gazette as on 01.04.2027",link:DU+"labour/1806000000000_VDAGazette01.04.2027.pdf"}';
  const day2 = await runMonitor({ targets: [target], previous: day1.state, fetcher: site(bundle(april)), now: at('2027-03-28'), describeNew: false });
  assert.deepEqual(day2.events.map((e) => [e.type, e.added.map((l) => l.label)]), [['listing-changed', ['VDA Gazette as on 01.04.2027']]]);
  // A shell without its bundle is a failed load, not every document removed.
  const day3 = await runMonitor({ targets: [target], previous: day2.state, fetcher: async () => ({ ok: true, status: 200, contentType: 'text/html', body: Buffer.from('<html>maintenance</html>') }), now: at('2027-03-29') });
  assert.equal(day3.results[0].outcome, 'failed');
});

test('an Internet Archive capture is cited but never fetched: it cannot change', () => {
  const capture = 'https://web.archive.org/web/20180509064207id_/http://labour.ap.gov.in/documents/Shops.pdf';
  assert.ok(ARCHIVED.test(capture));
  assert.ok(!ARCHIVED.test('https://web.archive.org/web/2018/http://labour.ap.gov.in/documents/Shops.pdf'), 'only a fixed capture');
  const state = { state: 'andhra-pradesh', name: 'Andhra Pradesh', sources: [
    { id: 'a', url: capture, listing: 'https://labour.ap.gov.in/', via: 'Internet Archive', sha256: 'x' },
    { id: 'b', url: 'https://api.example/labour/1.pdf', listing: 'https://labour.ap.gov.in/', sha256: 'y' },
  ] };
  const urls = buildTargets([state], { states: {} }).map((t) => t.url);
  assert.ok(!urls.includes(capture));
  assert.ok(urls.includes('https://api.example/labour/1.pdf'));
});

test('location page sources are a monthly load check: deduplicated, never compared line by line', async () => {
  const pages = [{ sources: [{ label: 'SIIDCUL Haridwar', url: 'https://siidcul.com/haridwar' }, { label: 'MSME-DI', url: 'https://msme.example/profile.pdf' }] }, { sources: [{ label: 'SIIDCUL again', url: 'https://siidcul.com/haridwar' }] }];
  const targets = locationTargets(pages);
  assert.deepEqual(targets.map((t) => [t.url, t.topic, t.kind, t.allowEmpty]), [['https://siidcul.com/haridwar', 'locations', 'page', true], ['https://msme.example/profile.pdf', 'locations', 'page', true]]);
  const page = (html) => async () => ({ ok: true, status: 200, contentType: 'text/html', body: Buffer.from(html) });
  const day1 = await runMonitor({ targets, previous: null, fetcher: page('<p>Estate of 2,034 acres</p>'), now: at('2026-11-01') });
  const day2 = await runMonitor({ targets, previous: day1.state, fetcher: page('<p>Estate of 2,100 acres, new units</p>'), now: at('2026-12-01') });
  assert.deepEqual(day2.events, []);
  const { locationPages } = await importTs('src/content/locations/index.ts');
  assert.ok(locationTargets([...locationPages.values()]).length > 20, 'every location page source is in the monthly check');
});

test('R2 requests are signed as AWS documents it (SigV4 GET Object example)', async () => {
  const { signRequest } = await import('../scripts/wage-monitor/r2.mjs');
  const auth = signRequest({
    method: 'GET',
    path: '/test.txt',
    headers: { host: 'examplebucket.s3.amazonaws.com', range: 'bytes=0-9', 'x-amz-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'x-amz-date': '20130524T000000Z' },
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1',
  });
  assert.equal(auth, 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41');
});

test('the archive keeps each fetched PDF once, by hash, and never fails the fetch', async () => {
  const { archivingFetcher, originalKey } = await import('../scripts/wage-monitor/archive.mjs');
  const stored = new Map([[originalKey(sha256(Buffer.from('%PDF-old'))), Buffer.from('%PDF-old')]]);
  const client = { exists: async (k) => stored.has(k), put: async (k, body) => void stored.set(k, body) };
  const bodies = { 'https://a/new.pdf': '%PDF-new', 'https://a/again.pdf': '%PDF-new', 'https://a/old.pdf': '%PDF-old', 'https://a/page': '<html></html>' };
  const { fetcher, log } = archivingFetcher(async (url) => ({ ok: true, status: 200, body: Buffer.from(bodies[url]) }), client);
  for (const url of Object.keys(bodies)) assert.ok((await fetcher(url)).ok);
  assert.deepEqual(log.archived.map((a) => a.url), ['https://a/new.pdf']);
  assert.ok(stored.has(originalKey(sha256(Buffer.from('%PDF-new')))));
  const broken = archivingFetcher(async () => ({ ok: true, status: 200, body: Buffer.from('%PDF-x') }), { exists: async () => { throw new Error('R2 HEAD: HTTP 403'); } });
  assert.ok((await broken.fetcher('https://a/x.pdf')).ok);
  assert.equal(broken.log.failed.length, 1);
});
