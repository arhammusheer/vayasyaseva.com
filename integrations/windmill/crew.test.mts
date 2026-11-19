// Crew offers on WhatsApp (talent/lib/crew*.ts, run-crew.ts): the templates,
// which message a crew member is due and why one cannot go, how replies read,
// the webhook's parsing, and whole runs on a real Postgres (test-db.mts) with
// Twenty and WhatsApp faked: each message once, replies into Twenty, the
// recruiters told, delivery written back.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { TALENT_SCHEMA, testDb } from "./test-db.mts";
import {
  CREW_KINDS,
  CREW_LOCALES,
  CREW_TEMPLATE_TEXT,
  crewLocale,
  renderTemplate,
  templateText,
  variableCount,
  variableValue,
} from "./talent/lib/crew-templates.ts";
import {
  formatDay,
  formatTime,
  interpretReply,
  missingFields,
  planMember,
  statusAfterReply,
  type CrewMember,
  type CrewPerson,
  type CrewRequest,
  type LedgerRow,
  type PlanContext,
} from "./talent/lib/crew.ts";
import { parseInbound, saveInbound } from "./talent/lib/crew-inbound.ts";
import { parseTestPhones, runCrew, type CrewDeps } from "./talent/lib/run-crew.ts";
import { templateRequestUrl, type WhatsAppReport } from "./talent/lib/whatsapp-ack.ts";
import { DELETE_ROWS } from "./talent/lib/sql.ts";
import { erasePerson } from "./talent/lib/crm.ts";
import { templateComponents, TEMPLATES } from "./whatsapp-templates.mts";
import type { TwentyRecord, Twenty } from "./talent/lib/twenty.ts";
import type { EmitInput } from "./notify/lib/emit.ts";

// --- the templates ------------------------------------------------------------------

test("every crew message exists in every language, buttons on the offer and the reminder only", () => {
  for (const kind of CREW_KINDS) {
    for (const locale of CREW_LOCALES) {
      const t = templateText(kind, locale);
      assert.equal(t.example.length, variableCount(t), `${kind} ${locale}: one example per variable`);
      assert.equal(Boolean(t.buttons), kind === "offer" || kind === "reminder", `${kind} ${locale} buttons`);
      // Meta: no variable at the very start or end; body at most 1024; a quick reply at most 25 characters.
      assert.doesNotMatch(t.text, /^\{\{|\}\}$/);
      assert.ok(t.text.length <= 1024);
      for (const b of t.buttons ?? []) assert.ok(b.length <= 25, b);
      // House rule: no em dash.
      assert.doesNotMatch(t.text + (t.buttons ?? []).join(""), /\u2014/);
    }
  }
  // Template names are unique per Meta language.
  const keys = CREW_TEMPLATE_TEXT.map((t) => `${t.name}/${t.language}`);
  assert.equal(new Set(keys).size, keys.length);
});

test("the submission carries the examples and the quick-reply buttons", () => {
  const offer = TEMPLATES.find((t) => t.group === "crew" && t.name === "vspl_interview_invite_stay" && t.language === "hi")!;
  const [body, buttons] = templateComponents(offer);
  assert.equal((body.example as { body_text: string[][] }).body_text[0].length, 5, "reference, job, place, start, stay and food");
  assert.deepEqual(buttons, { type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: "हाँ, इंटरव्यू देना है" }, { type: "QUICK_REPLY", text: "नहीं" }] });
  const ack = TEMPLATES.find((t) => t.group === "ack" && t.language === "en")!;
  assert.equal(templateComponents(ack).length, 1);
});

test("variable values are one line, without Fast2SMS's separator, never empty", () => {
  assert.equal(variableValue("Gate 2\nPlot 12 |  Sector 4\t"), "Gate 2 Plot 12 / Sector 4");
  assert.equal(variableValue("   "), "-");
  assert.equal(variableValue("x".repeat(300)).length, 200);
  const url = new URL(templateRequestUrl({ phone: "+919876543210", values: ["Packing", "Haridwar"], udf1: "m1" }, 77));
  assert.equal(url.searchParams.get("variables_values"), "Packing|Haridwar");
  assert.equal(url.searchParams.get("numbers"), "9876543210");
  assert.equal(url.searchParams.get("message_id"), "77");
});

test("the worker's language picks the template: Punjabi gets Hindi, Kannada English, none Hindi", () => {
  assert.equal(crewLocale("EN"), "en-IN");
  assert.equal(crewLocale("HI_LATN"), "hi-Latn-IN");
  assert.equal(crewLocale("PA"), "hi-IN");
  assert.equal(crewLocale("KN"), "en-IN");
  assert.equal(crewLocale(null), "hi-IN");
});

test("dates and times read as people say them, in India time", () => {
  assert.equal(formatDay("2026-11-25", "hi-IN"), "बुधवार, 25 नवंबर");
  assert.equal(formatDay("2026-11-25", "en-IN"), "Wednesday, 25 November");
  const at = "2026-11-25T02:30:00.000Z"; // 8:00 am IST
  assert.equal(formatTime(at, "en-IN"), "8:00 am");
  assert.equal(formatTime(at, "hi-IN"), "सुबह 8:00 बजे");
  assert.equal(formatTime("2026-11-25T13:00:00.000Z", "hi-Latn-IN"), "shaam 6:30 baje");
});

// --- the plan ------------------------------------------------------------------------

const IST = (s: string) => new Date(`${s}+05:30`);
const TEMPLATE_IDS = {
  offer: { "hi-IN": 101, "en-IN": 102, "hi-Latn-IN": 103 },
  offer_stay: { "hi-IN": 111, "en-IN": 112, "hi-Latn-IN": 113 },
  confirmed: { "hi-IN": 201, "en-IN": 202, "hi-Latn-IN": 203 },
  reminder: { "hi-IN": 301, "en-IN": 302, "hi-Latn-IN": 303 },
  not_needed: { "hi-IN": 401, "en-IN": 402, "hi-Latn-IN": 403 },
};

const person = (over: Partial<CrewPerson> = {}): CrewPerson => ({
  id: "p1",
  name: { firstName: "Ravi", lastName: "Kumar" },
  phones: { primaryPhoneNumber: "9876543210", primaryPhoneCallingCode: "+91" },
  workerStatus: "CALLABLE",
  language: "HI",
  consentedAt: "2026-11-01T10:00:00.000Z",
  ...over,
});

const request = (over: Partial<CrewRequest> = {}): CrewRequest => ({
  id: "o1",
  name: "ITC Haridwar packing",
  startDate: "2026-11-25",
  offerJob: "Packing helper",
  offerPlace: "SIDCUL, Haridwar",
  offerPay: "₹13,500 महीना, PF और ESIC अलग",
  offerShift: "सुबह 8 से शाम 8",
  stayAndFood: "ROOM_AND_FOOD",
  reportAddress: "Gate 2, Plot 12, Sector 4, SIDCUL",
  reportAt: "2026-11-25T02:30:00.000Z",
  siteContact: "Ramesh, 98765 43210",
  mapLink: "https://maps.app.goo.gl/abc",
  ...over,
});

const member = (over: Partial<CrewMember> = {}): CrewMember => ({
  id: "c1", status: "OFFERED", personId: "p1", opportunityId: "o1", createdAt: "2026-11-19T05:00:00.000Z", messageNote: null, ...over,
});

const row = (over: Partial<LedgerRow>): LedgerRow => ({
  id: "m1", crew_member_id: "c1", kind: "offer", status: "accepted", sent_at: IST("2026-11-19T10:00:00"), delivery: null, replied: false, said_yes: false, ...over,
});

const ctx = (over: Partial<PlanContext> = {}): PlanContext => {
  const m = over.member ?? member();
  return {
    member: m, person: person(), request: request(), ledger: [], others: [m], now: IST("2026-11-19T11:00:00"), templates: TEMPLATE_IDS, reference: "VS-J-ABC234", ...over,
  };
};

test("an offered worker is sent the offer, in their language, with the crew request's words", () => {
  const plan = planMember(ctx());
  assert.equal(plan.kind, "send");
  if (plan.kind !== "send") return;
  assert.deepEqual([plan.message, plan.locale, plan.templateId, plan.phone], ["offer", "hi-IN", 111, "+919876543210"]);
  assert.deepEqual(plan.values, ["VS-J-ABC234", "Packing helper", "SIDCUL, Haridwar", "बुधवार, 25 नवंबर", "कमरा और खाना मिलेगा"]);
  const text = renderTemplate(templateText("offer", "hi-IN", true), plan.values);
  assert.match(text, /काम: Packing helper\nजगह: SIDCUL, Haridwar/);
  assert.match(text, /आवेदन VS-J-ABC234 पर अपडेट/);
  assert.match(text, /रहना और खाना: कमरा और खाना मिलेगा/);
  assert.doesNotMatch(text, /तनख़्वाह|शिफ़्ट/, "no pay or shift in the invitation");
  assert.match(text, /\[हाँ, इंटरव्यू देना है\] \[नहीं\]$/);
});

test("nothing goes, with a note saying why, when the worker or the crew request is not ready", () => {
  const note = (c: Partial<PlanContext>) => {
    const plan = planMember(ctx(c));
    assert.equal(plan.kind, "wait");
    return plan.kind === "wait" ? plan.note : null;
  };
  assert.equal(note({ person: person({ workerStatus: "DO_NOT_CONTACT" }) }), "Do not contact: no message sent");
  assert.equal(note({ person: person({ workerStatus: "NOT_AVAILABLE" }) }), "Marked not available: no invite sent");
  assert.match(note({ person: person({ consentedAt: null }) })!, /No consent on record/);
  assert.equal(note({ person: person({ phones: { primaryPhoneNumber: "12345" } }) }), "No Indian mobile number on the person");
  assert.equal(note({ person: null }), "Pick the worker (Person) on this crew member");
  assert.equal(note({ request: request({ offerJob: "", startDate: null }) }), "Fill in on the crew request: Job (for workers), Start");
  assert.equal(note({ templates: { ...TEMPLATE_IDS, offer_stay: {} } }), "WhatsApp template not approved yet (offer_stay, hi-IN)");
  assert.equal(note({ canSend: false }), "WhatsApp template not approved yet (offer_stay, hi-IN)");
  assert.equal(note({ reference: null }), "No job application on record for this worker: call them instead");
  assert.match(note({ now: IST("2026-11-19T21:30:00") })!, /Waiting for 8:00/);
  assert.match(note({ now: IST("2026-11-20T07:59:00") })!, /Waiting for 8:00/);
  assert.deepEqual(missingFields("confirmed", request({ siteContact: " " })), ["Ask for"]);
});

test("one open offer per worker: the earlier crew member goes, the later one waits", () => {
  const first = member({ id: "c1", createdAt: "2026-11-19T05:00:00.000Z" });
  const elsewhere = member({ id: "c2", opportunityId: "o2", createdAt: "2026-11-19T06:00:00.000Z" });
  const twice = member({ id: "c3", createdAt: "2026-11-19T07:00:00.000Z" });
  const others = [first, elsewhere, twice];
  assert.equal(planMember(ctx({ member: first, others })).kind, "send");
  const a = planMember(ctx({ member: elsewhere, others }));
  assert.deepEqual(a, { kind: "wait", note: "Already has an open interview invite on another crew request: one at a time" });
  const b = planMember(ctx({ member: twice, others }));
  assert.deepEqual(b, { kind: "wait", note: "Already on this crew request (another crew member record)" });
  // Once the first is answered no, the next one can go.
  assert.equal(planMember(ctx({ member: elsewhere, others: [{ ...first, status: "SAID_NO" }, elsewhere] })).kind, "send");
});

test("an offer goes once; 24 hours without an answer is No reply", () => {
  const sent = [row({ sent_at: IST("2026-11-19T10:00:00") })];
  assert.deepEqual(planMember(ctx({ ledger: sent, now: IST("2026-11-20T09:59:00") })), { kind: "wait", note: null });
  assert.deepEqual(planMember(ctx({ ledger: sent, now: IST("2026-11-20T10:00:00") })), { kind: "no_reply" });
  assert.deepEqual(planMember(ctx({ ledger: [row({ replied: true })], now: IST("2026-11-21T10:00:00") })), { kind: "wait", note: null });
  // A failed offer keeps its note (set when it failed) and is not marked No reply.
  const failed = planMember(ctx({ member: member({ messageNote: "The WhatsApp interview invite did not reach them: call them" }), ledger: [row({ status: "failed", sent_at: null })] }));
  assert.deepEqual(failed, { kind: "wait", note: "The WhatsApp interview invite did not reach them: call them" });
});

test("confirmed sends where and when; a do-not-contact worker gets nothing at all", () => {
  const confirmed = member({ status: "CONFIRMED" });
  const plan = planMember(ctx({ member: confirmed, others: [confirmed], now: IST("2026-11-19T21:30:00") }));
  assert.equal(plan.kind, "send");
  if (plan.kind === "send") {
    assert.equal(plan.message, "confirmed");
    assert.deepEqual(plan.values, [
      "Gate 2, Plot 12, Sector 4, SIDCUL (map: https://maps.app.goo.gl/abc)", "बुधवार, 25 नवंबर, सुबह 8:00 बजे", "Ramesh, 98765 43210",
    ]);
  }
  const dnc = planMember(ctx({ member: confirmed, others: [confirmed], person: person({ workerStatus: "DO_NOT_CONTACT" }) }));
  assert.equal(dnc.kind, "wait");
});

test("the reminder goes 6 to 9 pm the evening before, not within 3 hours of the confirmation", () => {
  const confirmed = member({ status: "CONFIRMED" });
  const ledger = [row({ kind: "confirmed", sent_at: IST("2026-11-23T12:00:00") })];
  const at = (s: string) => planMember(ctx({ member: confirmed, others: [confirmed], ledger, now: IST(s) }));
  assert.equal(at("2026-11-24T17:59:00").kind, "wait");
  const due = at("2026-11-24T18:00:00");
  assert.equal(due.kind, "send");
  if (due.kind === "send") assert.deepEqual([due.message, due.values], ["reminder", ["सुबह 8:00 बजे", "Gate 2, Plot 12, Sector 4, SIDCUL"]]);
  assert.equal(at("2026-11-24T21:00:00").kind, "wait");
  // Confirmed at 5 pm the day before: too soon for a reminder.
  const late = [row({ kind: "confirmed", sent_at: IST("2026-11-24T17:00:00") })];
  assert.equal(planMember(ctx({ member: confirmed, others: [confirmed], ledger: late, now: IST("2026-11-24T19:00:00") })).kind, "wait");
  // Once sent, never again.
  const both = [...ledger, row({ id: "m2", kind: "reminder" })];
  assert.equal(planMember(ctx({ member: confirmed, others: [confirmed], ledger: both, now: IST("2026-11-24T19:00:00") })).kind, "wait");
});

test("crew full goes only to someone who said yes to the offer", () => {
  const full = member({ status: "NOT_NEEDED" });
  assert.equal(planMember(ctx({ member: full, others: [full], ledger: [row({ said_yes: true, replied: true })] })).kind, "send");
  assert.equal(planMember(ctx({ member: full, others: [full], ledger: [row({})] })).kind, "wait");
  assert.equal(planMember(ctx({ member: full, others: [full], ledger: [] })).kind, "wait");
});

// --- replies ---------------------------------------------------------------------------

test("button taps in every language, and typed answers, read as yes or no", () => {
  for (const t of CREW_TEMPLATE_TEXT.filter((x) => x.buttons)) {
    assert.equal(interpretReply(t.buttons![0]), "yes", t.buttons![0]);
    assert.equal(interpretReply(t.buttons![1]), "no", t.buttons![1]);
  }
  for (const yes of ["haan", "Haan ji", "HAAN!", "हाँ", "हां आ रहा हूँ", "ok", "1", "१", "yes please", "ji"]) assert.equal(interpretReply(yes), "yes", yes);
  for (const no of ["nahi", "Nahin bhai", "नहीं", "no", "2", "can't come", "ना"]) assert.equal(interpretReply(no), "no", no);
  for (const other of ["haan par nahi aa paunga", "salary kitni hai?", "", "kal batata hoon"]) assert.equal(interpretReply(other), "other", other);
});

test("a reply moves the crew member on only where it makes sense", () => {
  assert.equal(statusAfterReply("offer", "yes", "OFFERED"), "SAID_YES");
  assert.equal(statusAfterReply("offer", "yes", "NO_REPLY"), "SAID_YES");
  assert.equal(statusAfterReply("offer", "no", "SAID_YES"), "SAID_NO");
  assert.equal(statusAfterReply("offer", "yes", "CONFIRMED"), null);
  assert.equal(statusAfterReply("offer", "other", "OFFERED"), null);
  assert.equal(statusAfterReply("reminder", "no", "CONFIRMED"), "CANT_COME");
  assert.equal(statusAfterReply("reminder", "yes", "CONFIRMED"), null);
  assert.equal(statusAfterReply("confirmed", "no", "CONFIRMED"), null);
});

test("the webhook: an incoming message on our number from an Indian mobile; placeholders count as empty", () => {
  const msg = parseInbound({ webhook_type: "incoming_message", from: "919876543210", message_type: "button", body: "हाँ, इंटरव्यू देना है", phone_number_id: "1426644927192285" });
  assert.ok(msg);
  assert.equal(msg!.phone, "+919876543210");
  assert.equal(msg!.type, "button");
  assert.match(msg!.key, /^sha256:[0-9a-f]{64}$/);
  // A retry of the same message has the same key; Fast2SMS's own id wins when it sends one.
  assert.equal(parseInbound({ webhook_type: "incoming_message", from: "919876543210", message_type: "button", body: "हाँ, इंटरव्यू देना है" })!.key, msg!.key);
  assert.equal(parseInbound({ from: "919876543210", body: "haan", request_id: "abc" })!.key, "f2s:abc");
  assert.equal(parseInbound({ from: "919876543210", body: "haan", request_id: "@{{request_id}}" })!.key.startsWith("sha256:"), true);
  assert.equal(parseInbound({ webhook_type: "status_update", from: "919876543210", body: "x" }), null);
  assert.equal(parseInbound({ webhook_type: "incoming_message", from: "919876543210", body: "x", phone_number_id: "999" }), null);
  assert.equal(parseInbound({ webhook_type: "incoming_message", from: "14155550100", body: "x" }), null);
  assert.equal(parseInbound("nope"), null);
});

// --- whole runs ----------------------------------------------------------------------------

function fakeTwenty(seed: { people?: TwentyRecord[]; opportunities?: TwentyRecord[]; crewMembers?: TwentyRecord[]; applications?: TwentyRecord[] } = {}) {
  const store: Record<string, TwentyRecord[]> = {
    people: seed.people ?? [], opportunities: seed.opportunities ?? [], crewMembers: seed.crewMembers ?? [], communications: [], applications: seed.applications ?? [], attachments: [],
  };
  let limited = false;
  const match = (r: TwentyRecord, filter: string): boolean => {
    // Erasure also looks in the trash (crm.ts findAll); this fake has none.
    if (/^and\(.+,deletedAt\[is\]:NOT_NULL\)$/.test(filter)) return false;
    // The crew run's window (run-crew.ts watchedFilter).
    const since = filter.match(/^and\((.+),createdAt\[gte\]:(".*")\)$/);
    if (since) return match(r, since[1]) && String(r.createdAt) >= JSON.parse(since[2]);
    const eqm = filter.match(/^([\w.]+)\[eq\]:(".*")$/);
    if (eqm) return eqm[1].split(".").reduce<unknown>((v, k) => (v as Record<string, unknown> | undefined)?.[k], r) === JSON.parse(eqm[2]);
    const inm = filter.match(/^(\w+)\[in\]:(\[.*\])$/);
    if (inm) return (JSON.parse(inm[2]) as string[]).includes(r[inm[1]] as string);
    throw new Error(`bad filter ${filter}`);
  };
  const guard = () => {
    if (limited) throw new Error("Twenty GET /x: HTTP 429 Too many requests");
  };
  const crm: Twenty = {
    async find(plural, filter) {
      guard();
      return store[plural].filter((r) => match(r, filter));
    },
    async findPage(plural, filter) {
      guard();
      return { records: store[plural].filter((r) => match(r, filter)), next: null };
    },
    async create(plural, _s, body) {
      guard();
      // Twenty's ids are UUIDs (the ledger keeps the Communication's as uuid).
      const record = { id: randomUUID(), ...body } as TwentyRecord;
      store[plural].push(record);
      return record;
    },
    async update(plural, id, body) {
      guard();
      const r = store[plural].find((x) => x.id === id);
      if (!r) throw new Error(`Twenty PATCH /${plural}: HTTP 404 not found`);
      Object.assign(r, body);
    },
    async remove(plural, id) {
      store[plural] = store[plural].filter((x) => x.id !== id);
      return true;
    },
  };
  return { crm, store, limit: () => (limited = true) };
}

const PERSON_ID = "00000000-0000-4000-8000-0000000000a1";
const REQUEST_ID = "00000000-0000-4000-8000-0000000000b1";
const MEMBER_ID = "00000000-0000-4000-8000-0000000000c1";

async function setup(status = "OFFERED") {
  const t = fakeTwenty({
    people: [{ ...person(), id: PERSON_ID } as unknown as TwentyRecord],
    opportunities: [{ ...request(), id: REQUEST_ID } as unknown as TwentyRecord],
    crewMembers: [{ id: MEMBER_ID, name: "", status, personId: PERSON_ID, opportunityId: REQUEST_ID, createdAt: "2026-11-19T05:00:00.000Z", messageNote: "" }],
    applications: [
      { id: "a-old", name: "VS-J-OLD111", personId: PERSON_ID, submittedAt: "2026-10-01T05:00:00.000Z" },
      { id: "a-new", name: "VS-J-ABC234", personId: PERSON_ID, submittedAt: "2026-11-01T05:00:00.000Z" },
    ],
  });
  const db = await testDb(TALENT_SCHEMA);
  const sends: { phone: string; values: string[]; udf1: string; templateId: number }[] = [];
  const notes: EmitInput[] = [];
  const reports = new Map<string, WhatsAppReport>();
  let sendAnswer: { statusCode: number; body: Record<string, unknown> } = { statusCode: 200, body: { status: true, request_id: "wa-1" } };
  let now = IST("2026-11-19T11:00:00");
  const deps = (): CrewDeps => ({
    query: db.query,
    crm: t.crm,
    sendWhatsApp: async (message, templateId) => {
      sends.push({ ...message, templateId });
      return sendAnswer;
    },
    lookupWhatsApp: async (id) => reports.get(id) ?? null,
    notify: async (e) => {
      notes.push(e);
      return true;
    },
    now: () => now,
    templates: TEMPLATE_IDS,
  });
  return {
    t, db, sends, notes, reports, deps,
    setNow: (d: Date) => (now = d),
    answer: (a: typeof sendAnswer) => (sendAnswer = a),
    member: () => t.store.crewMembers[0],
  };
}

test("a run sends the offer once and writes it to Twenty; the next run sends nothing", async () => {
  const s = await setup();
  const first = await runCrew(s.deps());
  assert.equal(first.sent, 1);
  assert.equal(s.sends.length, 1);
  assert.equal(s.sends[0].templateId, 111, "the invitation with the stay and food line");
  assert.equal(s.sends[0].phone, "+919876543210");
  const [msg] = await s.db.query<{ id: string; status: string; request_id: string; crm_state: string }>("SELECT id, status, request_id, crm_state FROM crew_messages");
  assert.deepEqual([msg.status, msg.request_id, msg.crm_state], ["accepted", "wa-1", "accepted"]);
  assert.equal(s.sends[0].udf1, msg.id);
  const [comm] = s.t.store.communications;
  assert.deepEqual([comm.channel, comm.direction, comm.deliveryStatus, comm.externalKey, comm.opportunityId], ["WHATSAPP", "OUTBOUND", "SENT", `crew:${msg.id}`, REQUEST_ID]);
  assert.match(String(comm.body), /आवेदन VS-J-ABC234 पर अपडेट/, "the latest application's reference");
  assert.match(String(comm.body), /रहना और खाना: कमरा और खाना मिलेगा/);
  assert.ok(s.member().offerSentAt);
  assert.equal(s.member().name, "Ravi Kumar · ITC Haridwar packing");
  assert.equal(s.member().messageNote, "");

  const second = await runCrew(s.deps());
  assert.equal(second.sent, 0);
  assert.equal(s.sends.length, 1);
  assert.equal(s.t.store.communications.length, 1);
});

test("a yes tap on WhatsApp: saved by the route, then Said yes in Twenty and the recruiters told", async () => {
  const s = await setup();
  await runCrew(s.deps());
  // Someone with no crew message: ignored.
  assert.deepEqual(await saveInbound(s.db.query, parseInbound({ from: "919811111111", body: "haan" })!), { saved: false, reason: "no open crew message" });
  const tap = parseInbound({ webhook_type: "incoming_message", from: "919876543210", message_type: "button", body: "हाँ, इंटरव्यू देना है" })!;
  assert.deepEqual(await saveInbound(s.db.query, tap), { saved: true, answer: "yes", kind: "offer" });
  assert.deepEqual(await saveInbound(s.db.query, tap), { saved: false, reason: "already saved" });

  const run = await runCrew(s.deps());
  assert.equal(run.replies, 1);
  assert.equal(s.member().status, "SAID_YES");
  assert.equal(s.member().lastReply, "हाँ, इंटरव्यू देना है");
  const inbound = s.t.store.communications.find((c) => c.direction === "INBOUND")!;
  assert.equal(inbound.body, "हाँ, इंटरव्यू देना है");
  assert.equal(s.notes.length, 1);
  assert.deepEqual([s.notes[0].type, s.notes[0].severity, s.notes[0].pii?.phone], ["crew.said_yes", "info", "+919876543210"]);
  assert.match(s.notes[0].link!.url, /\/object\/crewMember\//);
  // The text stays in Twenty only.
  const [reply] = await s.db.query<{ status: string; body: string | null }>("SELECT status, body FROM crew_replies");
  assert.deepEqual(reply, { status: "done", body: null });
});

test("no answer in 24 hours: No reply; a late yes still counts", async () => {
  const s = await setup();
  await runCrew(s.deps());
  await s.db.query("UPDATE crew_messages SET sent_at = now() - interval '25 hours'");
  s.setNow(new Date());
  const run = await runCrew(s.deps());
  assert.equal(run.noReply, 1);
  assert.equal(s.member().status, "NO_REPLY");
  await saveInbound(s.db.query, parseInbound({ from: "919876543210", body: "haan ji" })!);
  await runCrew(s.deps());
  assert.equal(s.member().status, "SAID_YES");
});

test("confirmed, then the reminder; Can't come tells the recruiters at once", async () => {
  const s = await setup("CONFIRMED");
  s.setNow(IST("2026-11-23T12:00:00"));
  await runCrew(s.deps());
  assert.deepEqual(s.sends.map((x) => x.templateId), [201]);
  assert.ok(s.member().confirmationSentAt);
  // Sent well before the reminder is due (the database's clock is the real one).
  await s.db.query("UPDATE crew_messages SET sent_at = now() - interval '1 day'");
  s.setNow(IST("2026-11-24T18:05:00"));
  await runCrew(s.deps());
  assert.deepEqual(s.sends.map((x) => x.templateId), [201, 301]);
  assert.deepEqual(s.sends[1].values, ["सुबह 8:00 बजे", "Gate 2, Plot 12, Sector 4, SIDCUL"]);
  assert.ok(s.member().reminderSentAt);
  await saveInbound(s.db.query, parseInbound({ from: "919876543210", message_type: "button", body: "नहीं आ पाएँगे" })!);
  await runCrew(s.deps());
  assert.equal(s.member().status, "CANT_COME");
  assert.deepEqual([s.notes[0].type, s.notes[0].severity], ["crew.cant_come", "warning"]);
});

test("a refused send leaves a note to call; an interrupted one is never resent", async () => {
  const s = await setup();
  s.answer({ statusCode: 400, body: { status: false, message: "Template paused" } });
  await runCrew(s.deps());
  assert.equal(s.member().messageNote, "The WhatsApp interview invite did not reach them: call them");
  assert.equal(s.t.store.communications[0].deliveryStatus, "FAILED");
  await runCrew(s.deps());
  assert.equal(s.sends.length, 1, "a failed offer is not tried again: the recruiter calls");

  const r = await setup();
  await r.db.query(
    `INSERT INTO crew_messages (crew_member_id, kind, phone, locale, template_id, status, updated_at)
     VALUES ($1, 'offer', '+919876543210', 'hi-IN', 101, 'sending', now() - interval '10 minutes')`,
    [MEMBER_ID],
  );
  await runCrew(r.deps());
  assert.equal(r.sends.length, 0);
  assert.equal(r.member().messageNote, "The WhatsApp interview invite may not have gone: call them");
});

test("delivery reports reach the Communication: delivered, then read", async () => {
  const s = await setup();
  await runCrew(s.deps());
  // The first run looked once (nothing yet); the next look is a minute later.
  s.reports.set("wa-1", { outcome: "delivered", detail: "delivered", at: null });
  await runCrew(s.deps());
  assert.equal(s.t.store.communications[0].deliveryStatus, "SENT", "not looked up again within the minute");
  await s.db.query("UPDATE crew_messages SET checked_at = now() - interval '2 minutes'");
  await runCrew(s.deps());
  assert.equal(s.t.store.communications[0].deliveryStatus, "DELIVERED");
  await s.db.query("UPDATE crew_messages SET checked_at = now() - interval '1 hour'");
  s.reports.set("wa-1", { outcome: "read", detail: "read", at: null });
  await runCrew(s.deps());
  assert.equal(s.t.store.communications[0].deliveryStatus, "READ");
  assert.equal(s.t.store.communications.length, 1);
});

test("another run holding the lock: nothing is done; Twenty's 429 ends the run quietly", async () => {
  const s = await setup();
  const other = await s.db.query<{ locked: boolean }>("SELECT pg_try_advisory_lock(hashtext('talent:dispatch')) AS locked");
  assert.equal(other[0].locked, true);
  // PGlite is one session, so the lock is re-entrant there: release it and hold it from a second database instead.
  await s.db.query("SELECT pg_advisory_unlock(hashtext('talent:dispatch'))");
  const locked = await runCrew({ ...s.deps(), query: async (text, params) => (/pg_try_advisory_lock/.test(text) ? [{ locked: false }] as never[] : s.db.query(text, params)) });
  assert.equal(locked.locked, true);
  assert.equal(s.sends.length, 0);

  s.t.limit();
  const limited = await runCrew(s.deps());
  assert.equal(limited.limited, true);
});

test("erasure removes the worker's crew messages and replies with their last application", async () => {
  const s = await setup();
  await runCrew(s.deps());
  await saveInbound(s.db.query, parseInbound({ from: "919876543210", body: "haan" })!);
  const [req] = await s.db.query<{ id: string }>("INSERT INTO erasure_requests (phone, reason, status) VALUES ('+919876543210', 'request', 'running') RETURNING id");
  await s.db.query(DELETE_ROWS, [req.id, "+919876543210", 0, 0, []]);
  const [counts] = await s.db.query<{ messages: number; replies: number }>(
    "SELECT (SELECT count(*)::int FROM crew_messages) AS messages, (SELECT count(*)::int FROM crew_replies) AS replies",
  );
  assert.deepEqual(counts, { messages: 0, replies: 0 });
});

test("erasure in Twenty removes the worker's crew members and crew messages, even on a crew request", async () => {
  const s = await setup();
  await runCrew(s.deps());
  s.t.store.people[0].phones = { primaryPhoneNumber: "9876543210" };
  await erasePerson(s.t.crm, "+919876543210");
  assert.equal(s.t.store.crewMembers.length, 0);
  assert.equal(s.t.store.communications.length, 0);
  assert.equal(s.t.store.people.length, 0);
  assert.equal(s.t.store.opportunities.length, 1, "the crew request stays");
});

test("the run reads crew members of the last 60 days only", async () => {
  const s = await setup();
  s.t.store.crewMembers[0].createdAt = "2026-09-01T05:00:00.000Z";
  await runCrew(s.deps());
  assert.equal(s.sends.length, 0);
  s.t.store.crewMembers[0].createdAt = "2026-09-25T05:00:00.000Z";
  await runCrew(s.deps());
  assert.equal(s.sends.length, 1);
});

test("a staff test number skips the quiet hours, and its reminder follows the confirmation", () => {
  assert.deepEqual([...parseTestPhones("+91 98765 43210, 9123456789\nx, -")], ["+919876543210", "+919123456789"]);
  assert.equal(parseTestPhones("-").size, 0);
  const night = IST("2026-11-19T23:30:00");
  assert.equal(planMember(ctx({ now: night })).kind, "wait");
  assert.equal(planMember(ctx({ now: night, test: true })).kind, "send");
  const confirmed = member({ status: "CONFIRMED" });
  const ledger = [row({ kind: "confirmed", sent_at: IST("2026-11-19T23:30:00") })];
  const at = (s: string) => planMember(ctx({ member: confirmed, others: [confirmed], ledger, now: IST(s), test: true }));
  assert.equal(at("2026-11-19T23:30:30").kind, "wait");
  const due = at("2026-11-19T23:31:00");
  assert.equal(due.kind === "send" && due.message, "reminder");
  // Every other check still applies.
  assert.equal(planMember(ctx({ now: night, test: true, person: person({ consentedAt: null }) })).kind, "wait");
});

test("a run treats a number on the test list as a test, and only that one", async () => {
  const s = await setup();
  s.setNow(IST("2026-11-19T23:30:00"));
  await runCrew({ ...s.deps(), testPhones: parseTestPhones("9000000000") });
  assert.equal(s.sends.length, 0);
  await runCrew({ ...s.deps(), testPhones: parseTestPhones("98765 43210") });
  assert.equal(s.sends.length, 1);
});

test("nothing given for stay and food: the invitation without that line", () => {
  const plan = planMember(ctx({ request: request({ stayAndFood: null }) }));
  assert.equal(plan.kind, "send");
  if (plan.kind !== "send") return;
  assert.equal(plan.templateId, 101);
  assert.deepEqual(plan.values, ["VS-J-ABC234", "Packing helper", "SIDCUL, Haridwar", "बुधवार, 25 नवंबर"]);
  const text = renderTemplate(templateText("offer", "hi-IN"), plan.values);
  assert.doesNotMatch(text, /रहना और खाना/);
  const en = planMember(ctx({ person: person({ language: "EN" }), request: request({ stayAndFood: "FOOD" }) }));
  assert.equal(en.kind === "send" && en.values[4], "Food given");
});

test("interviews full carries the application reference too", () => {
  const full = member({ status: "NOT_NEEDED" });
  const plan = planMember(ctx({ member: full, others: [full], ledger: [row({ said_yes: true, replied: true })] }));
  assert.equal(plan.kind === "send" && plan.values.join("|"), "VS-J-ABC234|Packing helper");
  assert.deepEqual(planMember(ctx({ member: full, others: [full], ledger: [row({ said_yes: true, replied: true })], reference: "" })), {
    kind: "wait", note: "No job application on record for this worker: call them instead",
  });
});

test("every crew template reads as an update on the worker's own application or interview (Utility, not Marketing)", () => {
  // Meta filed earlier wordings as Marketing for opening like an announcement or promising more messages.
  const PROMOTIONAL = /offer|opportunit|hurry|don't miss|limited|next job|new jobs|we will tell you|बताएँगे|batayenge|अगला काम|agla kaam|ख़बर|khabar/i;
  for (const t of CREW_TEMPLATE_TEXT) {
    assert.doesNotMatch(t.text, PROMOTIONAL, `${t.name}/${t.language}`);
    // The invitation and the interviews-full message open with the application they are about.
    if (t.kind === "offer" || t.kind === "not_needed") assert.match(t.text.split("\n")[0], /\{\{1\}\}/, `${t.name}/${t.language} opens with the reference`);
  }
  assert.equal(CREW_TEMPLATE_TEXT.filter((t) => t.kind === "offer").length, 6, "with and without stay and food, three languages");
});
