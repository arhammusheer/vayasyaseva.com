// Request a crew (PLAN §8.1): contract v1.3.0 is additive (older enquiries
// stay valid), enum fields are checked against fixed ids, the lead flags
// reach the staff email only, and prefilled links map onto the form.
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
const { contactContract, contactSchema, parseContactRequest, contactFieldSchema } = await import('../src/lib/contact-contract.ts');
const { assessCrewRequest, crewPrefill, headcountToBand, requirementLines } = await import('../src/lib/crew-request.ts');

const person = { name: 'Asha Rawat', phone: '+91 98765 43210' };
const requirement = {
  roles: ['packing', 'loading-unloading'],
  headcountBand: '50-99',
  siteState: 'UK',
  siteCity: 'SIDCUL Haridwar',
  startWindow: '2-4-weeks',
  durationBand: 'ongoing',
};

test('contract is v1.3.0 and older enquiries stay valid', () => {
  assert.equal(contactContract.version, '1.3.0');
  const legacy = { ...person, details: 'Need 40 packers for a new line', company: 'Acme', location: 'Haridwar', industry: 'FMCG', headcount: '40', shiftRequirement: '2 shifts', targetStartDate: '2026-11-01' };
  assert.equal(parseContactRequest(legacy).success, true);
});

test('the structured requirement is accepted without details', () => {
  const result = parseContactRequest({ ...person, company: 'Acme', ...requirement, sitePincode: '249403', shiftPattern: 'two-shifts' });
  assert.equal(result.success, true);
  assert.deepEqual(result.data.roles, ['packing', 'loading-unloading']);
});

test('either details or the full requirement is needed', () => {
  const result = contactSchema.safeParse({ ...person, roles: ['packing'], headcountBand: '20-49' });
  assert.equal(result.success, false);
  const paths = result.error.issues.map((issue) => issue.path[0]);
  assert.ok(paths.includes('siteState') && paths.includes('durationBand'));
  assert.equal(contactSchema.safeParse({ ...person }).success, false);
});

test('enum fields reject unknown ids, repeats and bad PIN codes', () => {
  assert.equal(contactSchema.safeParse({ ...person, ...requirement, roles: ['security-guards'] }).success, false);
  assert.equal(contactSchema.safeParse({ ...person, ...requirement, roles: ['packing', 'packing'] }).success, false);
  assert.equal(contactSchema.safeParse({ ...person, ...requirement, headcountBand: '500' }).success, false);
  assert.equal(contactSchema.safeParse({ ...person, ...requirement, siteState: 'XX' }).success, false);
  assert.equal(contactSchema.safeParse({ ...person, ...requirement, sitePincode: '24940' }).success, false);
  assert.equal(contactSchema.safeParse({ ...person, ...requirement, unknownField: 'x' }).success, false);
});

test('pageCluster is a plain slug in the contract; unknown clusters are dropped, not rejected', () => {
  const field = contactContract.request.fields.pageCluster;
  assert.equal(field.type, 'string');
  assert.equal('values' in field, false);
  assert.equal(parseContactRequest({ ...person, ...requirement, pageCluster: 'haridwar' }).data.pageCluster, 'haridwar');
  const unknown = parseContactRequest({ ...person, ...requirement, pageCluster: 'mumbai' });
  assert.equal(unknown.success, true);
  assert.equal(unknown.data.pageCluster, undefined);
  assert.equal(parseContactRequest({ ...person, ...requirement, pageCluster: 'Not A Slug!' }).success, false);
});

test('a site assessment is its own field, and long briefs stay valid', () => {
  const result = parseContactRequest({ ...person, ...requirement, requestType: 'site-assessment' });
  assert.equal(result.success, true);
  assert.equal(requirementLines(result.data)[0], 'Request: A site assessment');
  assert.equal(parseContactRequest({ ...person, details: 'x'.repeat(9000) }).success, true);
});

test('compliance help needs only details, and is not judged as a crew lead', () => {
  const result = parseContactRequest({ ...person, company: 'Acme', requestType: 'compliance-help', siteState: 'UP', headcountBand: '20-49', details: 'Help with: EPF, ESIC\nNo ESIC registration yet.' });
  assert.equal(result.success, true);
  assert.deepEqual(requirementLines(result.data), ['Request: Compliance help', 'Workers: 20 to 49', 'Site: Uttar Pradesh']);
  const lead = assessCrewRequest(result.data);
  assert.equal(lead.crew, false);
  assert.equal(lead.qualified, false);
  assert.equal(assessCrewRequest({ ...person, ...requirement }).crew, true);
  assert.equal(requirementLines({ ...person, ...requirement, requestType: 'crew' })[0], 'Work: Packing, Loading and unloading');
});

test('empty optional values count as not given', () => {
  const result = parseContactRequest({ ...person, ...requirement, email: '', sitePincode: '', shiftPattern: '', details: '  ' });
  assert.equal(result.success, true);
  assert.equal(result.data.email, undefined);
  assert.equal(result.data.details, undefined);
});

test('the form can require what the contract leaves optional', () => {
  assert.equal(contactFieldSchema('company', { required: true }).safeParse('').success, false);
  assert.equal(contactFieldSchema('roles', { required: true }).safeParse([]).success, false);
  assert.equal(contactFieldSchema('company').safeParse('').success, true);
});

test('qualified means 20+ workers and 3+ months; starting soon is a separate label', () => {
  assert.equal(assessCrewRequest({ ...person, ...requirement }).qualified, true);
  assert.equal(assessCrewRequest({ ...person, ...requirement, headcountBand: '10-19' }).qualified, false);
  assert.equal(assessCrewRequest({ ...person, ...requirement, durationBand: '1-3-months' }).qualified, false);
  assert.equal(assessCrewRequest({ ...person, ...requirement, durationBand: '3-12-months', headcountBand: '20-49' }).qualified, true);
  assert.equal(assessCrewRequest({ ...person, ...requirement, startWindow: 'planning' }).soon, false);
  assert.equal(assessCrewRequest({ ...person, ...requirement, startWindow: 'within-1-week', headcountBand: '1-9' }).soon, true);
  // Older senders: a number of workers maps to a band.
  assert.equal(assessCrewRequest({ ...person, headcount: '50', durationBand: 'ongoing', details: 'x'.repeat(10) }).qualified, true);
});

test('out-of-scope hints by keyword, without false alarms on in-scope work', () => {
  const hints = (details) => assessCrewRequest({ ...person, details }).outOfScope;
  assert.deepEqual(hints('Need 10 security guards for night duty'), ['security']);
  assert.deepEqual(hints('Maid and cook for my house'), ['household']);
  assert.deepEqual(hints('Masons and shuttering labour for a building'), ['construction']);
  assert.deepEqual(hints('Workers for Dubai, visa provided'), ['overseas']);
  assert.deepEqual(hints('sir mujhe job chahiye, 12th pass'), ['job-seeker']);
  assert.deepEqual(hints('मुझे नौकरी चाहिए'), ['job-seeker']);
  assert.deepEqual(hints('Forklift drivers and packers for a household appliances plant'), []);
  assert.deepEqual(hints('Housekeeping for the factory canteen and offices'), []);
  // In-scope work that shares a word with an out-of-scope hint.
  for (const text of [
    'Need civil work helpers for plant modification',
    'Fabrication and civil crews, masons for floor repairs',
    'Canteen cooks for factory canteen',
    '2 truck drivers and 10 loaders for dispatch',
    'Machine guards installation on the press line',
    'Gulf Oil lubricant line, packing helpers',
    'Saudi client exports, need packers',
    'Our construction is complete, need housekeeping',
    'naukri.com ads failed, need 30 helpers',
  ]) assert.deepEqual(hints(text), [], text);
  assert.deepEqual(hints('Personal driver for my car'), ['household']);
  assert.deepEqual(hints('Labour for a building construction site'), ['construction']);
  assert.deepEqual(hints('Workers for Saudi Arabia, work visa'), ['overseas']);
  assert.deepEqual(hints('Guards for the gate, night duty'), ['security']);
});

test('headcount numbers map to bands', () => {
  assert.equal(headcountToBand('5'), '1-9');
  assert.equal(headcountToBand('about 120 workers'), '100-249');
  assert.equal(headcountToBand('40-60'), '50-99');
  assert.equal(headcountToBand('250+'), '250+');
  assert.equal(headcountToBand('many'), undefined);
});

test('prefilled links: #location=haridwar and ids fill the form', () => {
  const { fields, extraLines } = crewPrefill({ location: 'haridwar', roles: 'packing,nope,packing', headcount: '60', start: 'within-1-week', duration: 'ongoing', shifts: 'two-shifts', name: 'Asha' });
  assert.deepEqual(fields, { name: 'Asha', roles: ['packing'], headcountBand: '50-99', pageCluster: 'haridwar', siteCity: 'Haridwar', siteState: 'UK', startWindow: 'within-1-week', durationBand: 'ongoing', shiftPattern: 'two-shifts' });
  assert.deepEqual(extraLines, []);
});

test('prefilled links: free text is kept, never dropped', () => {
  const { fields, extraLines } = crewPrefill({ location: 'Bhagwanpur industrial area', state: 'Uttar Pradesh', start: 'next Monday', shifts: '12 hours', industry: 'Pharma', pincode: '12' });
  assert.equal(fields.siteCity, 'Bhagwanpur industrial area');
  assert.equal(fields.siteState, 'UP');
  assert.equal(fields.sitePincode, undefined);
  assert.deepEqual(extraLines, ['Target start: next Monday', 'Shifts: 12 hours', 'Industry: Pharma']);
  assert.equal(crewPrefill({ city: 'Roorkee' }).fields.siteState, 'UK');
  assert.equal(crewPrefill({ cluster: 'mumbai' }).fields.pageCluster, undefined);
  assert.equal(crewPrefill({ cluster: 'uttarakhand' }).fields.pageCluster, 'uttarakhand');
});

test('the requirement recap uses labels, not ids', () => {
  const lines = requirementLines({ ...person, ...requirement, sitePincode: '249403' });
  assert.deepEqual(lines, ['Work: Packing, Loading and unloading', 'Workers: 50 to 99', 'Site: SIDCUL Haridwar, Uttarakhand, 249403', 'Start: In 2 to 4 weeks', 'Duration: Ongoing (no end date)']);
});

test('lead flags reach the staff email only, never the buyer copy', async () => {
  Object.assign(process.env, {
    MSG91_AUTH_KEY: 'unit', MSG91_DOMAIN: 'mail.example.test', MSG91_FROM_EMAIL: 'from@example.test', MSG91_FROM_NAME: 'Unit',
    MSG91_INTERNAL_TEMPLATE_ID: 'internal_tpl', MSG91_AUTOREPLY_TEMPLATE_ID: 'autoreply_tpl', CONTACT_INTERNAL_RECIPIENT_EMAIL: 'team@example.test',
  });
  const { sendInternalContactEmail, sendContactAutoReply } = await import('../src/lib/msg91.ts');
  const sent = [];
  const realFetch = globalThis.fetch;
  const realInfo = console.info;
  globalThis.fetch = async (url, init) => { sent.push(JSON.parse(init.body)); return new Response(JSON.stringify({ status: 'success', data: { message_id: 'm1' } }), { status: 200 }); };
  console.info = () => {};
  try {
    const data = { ...person, company: 'Acme', email: 'buyer@example.test', ...requirement, details: 'Also need 2 security guards', pageCluster: 'haridwar', sourcePath: '/haridwar-sidcul' };
    await sendInternalContactEmail(data, { caseId: 'REQ-UNIT' });
    await sendContactAutoReply(data, { caseId: 'REQ-UNIT' });
  } finally {
    globalThis.fetch = realFetch;
    console.info = realInfo;
  }
  const [staff, buyer] = sent;
  const staffDetails = staff.recipients[0].variables.details;
  assert.match(staffDetails, /Qualified \(20\+ workers, 3\+ months\): YES/);
  assert.match(staffDetails, /Starts within 4 weeks: yes/);
  assert.match(staffDetails, /Possibly out of scope: Security guards/);
  assert.match(staffDetails, /Came from: \/haridwar-sidcul/);
  const buyerVariables = JSON.stringify(buyer.recipients[0].variables);
  assert.doesNotMatch(buyerVariables, /Qualified|out of scope|Starts within|Page cluster|Came from/i);
  assert.match(buyer.recipients[0].variables.details, /Work: Packing, Loading and unloading/);
  assert.equal(buyer.recipients[0].bcc, undefined);
  assert.equal(buyer.recipients[0].variables.response_window, 'We aim to reply within two working days (Monday to Saturday, IST)');
  assert.equal(staff.recipients[0].variables.location, 'SIDCUL Haridwar, Uttarakhand');
  assert.equal(staff.recipients[0].variables.headcount, '50 to 99 workers');
});
