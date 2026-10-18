// The WhatsApp apply chat: the conversation (talent/lib/whatsapp.ts), the
// run that saves it and files the application (run-whatsapp.ts, on PGlite),
// the route's secret check, and the copy generated from the site.
import assert from "node:assert/strict";
import test from "node:test";
import { INTAKE_LOCALES, QUICK_ANSWERS } from "../../packages/contracts/src/rules.ts";
import { checkSubmission } from "./talent/lib/intake-payload.ts";
import { setConfigForTests } from "./talent/lib/config.ts";
import { runWhatsApp, sendSessionText } from "./talent/lib/run-whatsapp.ts";
import { DELETE_ROWS, PURGE_WHATSAPP } from "./talent/lib/sql.ts";
import { advance, normalise, parseInbound, readPrefill, scriptLocale, type Chat, type Inbound } from "./talent/lib/whatsapp.ts";
import COPY from "./talent/lib/whatsapp-copy.json" with { type: "json" };
import { main, newRef, preprocessor } from "./talent/scripts/whatsapp.ts";
import { SCRIPTS } from "./scripts.mts";
import { TALENT_SCHEMA, testDb } from "./test-db.mts";

const PHONE = "+919876543210";
const NOW = new Date("2026-10-19T10:00:00.000Z");
let n = 0;
const msg = (body: string, type = "text"): Inbound => ({ messageId: `wamid.${++n}`, phone: PHONE, type, body });
const refs = () => "VS-J-WHAT55";

/** Plays messages through advance, as the run would, and returns every turn. */
function play(...bodies: (string | [string, string])[]) {
  let chat: Chat | null = null;
  const turns = [];
  for (const b of bodies) {
    const [body, type] = Array.isArray(b) ? b : [b, "text"];
    const turn = advance(chat, msg(body, type), NOW, refs);
    if (turn.chat) turn.chat = { ...turn.chat, version: (turn.chat.version ?? 0) + 1 };
    chat = turn.chat;
    turns.push(turn);
  }
  return turns;
}

test("the generated copy covers every jobs language, with the form's own answer ids", () => {
  assert.deepEqual(Object.keys(COPY.locales).sort(), [...INTAKE_LOCALES].sort());
  for (const c of Object.values(COPY.locales)) {
    assert.deepEqual(c.work.options.map((o) => o.id), Object.keys(QUICK_ANSWERS.work));
    for (const o of c.area.options) assert.ok(Object.hasOwn(QUICK_ANSWERS.area, o.id), o.id);
    assert.ok(c.area.options.every((o) => o.label), "every area has a label");
    assert.match(c.consent.privacyUrl, /^https:\/\/www\.vayasyaseva\.com\/[a-z-]+\/jobs\/privacy$/);
    // The business line is never in the chat.
    assert.ok(!JSON.stringify(c).includes("72920"));
  }
});

test("reading replies: Indic digits, the link's code and the script", () => {
  assert.equal(normalise(" १ ३ "), "1 3");
  assert.equal(normalise("੨"), "2");
  assert.equal(normalise("೧"), "1");
  assert.deepEqual(readPrefill("Namaste [VS|hi-IN|factory-helper|market:haridwar]"), {
    locale: "hi-IN",
    answers: { work: ["factory-helper"], area: ["market:haridwar"] },
  });
  assert.deepEqual(readPrefill("hi [VS|pa-IN|welder]").answers, { work: ["iti-trades"], trade: ["welder"] });
  assert.deepEqual(readPrefill("[VS|xx|nope|market:mars]"), { locale: null, answers: {} });
  assert.equal(scriptLocale("मुझे काम चाहिए"), "hi-IN");
  assert.equal(scriptLocale("ਮੈਨੂੰ ਕੰਮ ਚਾਹੀਦਾ"), "pa-IN");
  assert.equal(scriptLocale("ನನಗೆ ಕೆಲಸ ಬೇಕು"), "kn-IN");
  assert.equal(scriptLocale("kaam chahiye"), null);
});

test("from a site link: consent, then only the name is asked, and the application is the form's", () => {
  const [first, consent, name] = play("Namaste [VS|hi-IN|factory-helper|market:haridwar]", "1", "Ravi Kumar");
  assert.equal(first.chat?.step, "consent");
  assert.match(first.replies[0], /18/);
  assert.match(first.replies[0], /कॉल नहीं/);
  assert.equal(consent.chat?.step, "name");
  assert.equal(name.chat?.step, "done");
  assert.match(name.replies[0], /VS-J-WHAT55/);
  const app = name.application!;
  assert.deepEqual(
    { source: app.source, channel: app.channel, locale: app.locale, role: app.role, cluster: app.cluster, name: app.applicantName, answers: app.answers },
    { source: "whatsapp", channel: "whatsapp", locale: "hi-IN", role: "factory-helper", cluster: "haridwar", name: "Ravi Kumar", answers: { work: ["factory-helper"], area: ["market:haridwar"] } },
  );
  assert.equal(app.consent.version, COPY.consentVersion);
  const checked = checkSubmission(app);
  assert.equal(checked.ok, true, JSON.stringify(checked));
});

test("a Latin-script hello asks the language; then every question in turn", () => {
  const turns = play("hello", "3", "haan", "1 3", "3", "0");
  assert.deepEqual(turns.map((t) => t.chat?.step), ["language", "consent", "work", "area", "name", "done"]);
  assert.match(turns[0].replies[0], /ਪੰਜਾਬੀ/);
  assert.match(turns[1].replies[0], /Sirf message/);
  const app = turns.at(-1)!.application!;
  assert.equal(app.locale, "hi-Latn-IN");
  assert.deepEqual(app.answers?.work, ["factory-helper", "warehouse"]);
  assert.equal(app.applicantName, null);
  assert.equal(checkSubmission(app).ok, true);
});

test("a Devanagari first message skips the language question", () => {
  const [first] = play("मुझे नौकरी चाहिए");
  assert.equal(first.chat?.step, "consent");
  assert.equal(first.chat?.locale, "hi-IN");
});

test("no to consent keeps nothing; STOP ends the chat at any step", () => {
  const declined = play("[VS|en-IN]", "2");
  assert.equal(declined[1].chat, null);
  assert.match(declined[1].replies[0], /not kept/);
  const stopped = play("[VS|en-IN]", "1", "STOP");
  assert.equal(stopped[2].chat, null);
});

test("wrong numbers ask again; long words and media are kept for the team", () => {
  const turns = play("[VS|en-IN]", "1", "42", "I worked 3 years in a pharma packing line", ["", "audio"]);
  assert.equal(turns[2].chat?.step, "work");
  assert.match(turns[2].replies[0], /could not read/);
  assert.match(turns[3].chat?.notes ?? "", /pharma packing/);
  assert.match(turns[4].chat?.notes ?? "", /voice note/);
  assert.equal(turns[4].chat?.step, "work");
  // A reaction or sticker is not an answer.
  const ignored = advance(turns[4].chat, msg("👍", "reaction"), NOW, refs);
  assert.deepEqual(ignored.replies, []);
});

test("after applying: the reference again, NEW starts over; a chat idle a day starts over", () => {
  const turns = play("[VS|en-IN|packing|market:punjab]", "yes", "Asha", "hello", "new");
  assert.match(turns[3].replies[0], /reference VS-J-WHAT55/);
  assert.equal(turns[3].application, null);
  assert.equal(turns[4].chat?.step, "consent");
  const idle = { ...turns[1].chat!, updatedAt: "2026-10-18T09:00:00.000Z" };
  assert.equal(advance(idle, msg("5"), NOW, refs).chat?.step, "consent");
});

test("parseInbound: incoming messages from Indian mobiles only, no template placeholders", () => {
  const body = { webhook_type: "incoming_message", from: "919876543210", message_type: "text", body: "hi", message_id: "wamid.HBg", phone_number_id: "1122334455" };
  assert.deepEqual(parseInbound(body), { messageId: "wamid.HBg", phone: PHONE, type: "text", body: "hi" });
  assert.equal(parseInbound({ ...body, from: "447700900123" }), null);
  assert.equal(parseInbound({ ...body, webhook_type: "status_update" }), null);
  assert.equal(parseInbound({ ...body, message_id: "@{{message_id}}" }), null);
  assert.equal(parseInbound(null), null);
});

test("the route checks the secret and passes only the message's fields", async () => {
  setConfigForTests({ fast2sms_whatsapp_secret: "s3cret" });
  try {
    const ok = await preprocessor({ headers: { "X-Vspl-Wa-Secret": "s3cret" }, body: { from: "919876543210", body: "hi", extra: "x", message_id: "m" } });
    assert.equal(ok.authorized, true);
    assert.deepEqual(Object.keys(ok.body!).sort(), ["body", "from", "message_id"]);
    const bad = await preprocessor({ headers: { "x-vspl-wa-secret": "nope" }, body: {} });
    assert.deepEqual(bad, { authorized: false, body: null });
    assert.equal((await main(false, {})).wm_status_code, 403);
    assert.equal((await main(true, { webhook_type: "status_update" })).wm_status_code, 200);
  } finally {
    setConfigForTests(null);
  }
  const route = SCRIPTS.find((s) => s.name === "whatsapp")?.route;
  assert.deepEqual(route, { path: "webhook/fast2sms-whatsapp", method: "post", secretHeader: "x-vspl-wa-secret" });
  assert.match(newRef(), /^VS-J-[2-9A-HJ-NP-Z]{6}$/);
});

test("the run: each message once, the chat saved, the application filed like the form's, erasure and retention clear it", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const sent: string[] = [];
  const started: string[] = [];
  const deps = {
    query,
    reply: async (_to: string, text: string) => (sent.push(text), { ok: true }),
    startAcknowledgement: async (id: string) => void started.push(id),
    newRef: () => "VS-J-WHAT77",
    now: () => NOW,
  };
  const first = msg("Hello [VS|en-IN|warehouse|market:bengaluru]");
  assert.equal((await runWhatsApp(first, deps)).step, "consent");
  assert.deepEqual(await runWhatsApp(first, deps), { duplicate: true, step: null, ref: null, filed: false, replies: 0, failedReplies: 0 });
  await runWhatsApp(msg("1"), deps);
  const done = await runWhatsApp(msg("Meena"), deps);
  assert.deepEqual({ step: done.step, ref: done.ref, filed: done.filed }, { step: "done", ref: "VS-J-WHAT77", filed: true });
  assert.equal(sent.length, 3);
  assert.equal(started.length, 1);

  const [row] = await query<{ source: string; channel: string; locale: string; cluster: string; applicant_name: string }>(
    "SELECT source, channel, locale, cluster, applicant_name FROM submissions WHERE ref = 'VS-J-WHAT77'",
  );
  assert.deepEqual({ ...row }, { source: "whatsapp", channel: "whatsapp", locale: "en-IN", cluster: "bengaluru", applicant_name: "Meena" });
  const [ack] = await query("SELECT status FROM sms_acknowledgements");
  assert.equal((ack as { status: string }).status, "pending");

  // Erasure removes the chat with the person's rows.
  const [request] = await query<{ id: string }>("INSERT INTO erasure_requests (phone, reason, status) VALUES ($1, 'request', 'running') RETURNING id", [PHONE]);
  await query(DELETE_ROWS, [request.id, PHONE, 0, 0, 0]);
  assert.equal((await query("SELECT 1 FROM whatsapp_chats")).length, 0);

  // Retention: chats without consent after a day, message ids after three.
  await query("INSERT INTO whatsapp_chats (phone, step, updated_at) VALUES ('+919000000001', 'language', now() - interval '2 days')");
  await query("INSERT INTO whatsapp_chats (phone, step, consented_at, updated_at) VALUES ('+919000000002', 'work', now(), now() - interval '2 days')");
  await query("UPDATE whatsapp_messages SET received_at = now() - interval '4 days'");
  const [purged] = await query<{ chats: string | number; messages: string | number }>(PURGE_WHATSAPP);
  assert.deepEqual([Number(purged.chats), Number(purged.messages)], [1, 3]);
});

test("a declined chat leaves no row", async () => {
  const { query } = await testDb(TALENT_SCHEMA);
  const deps = { query, reply: async () => ({ ok: true }), startAcknowledgement: async () => {}, newRef, now: () => NOW };
  await runWhatsApp(msg("[VS|kn-IN]"), deps);
  assert.equal((await query("SELECT 1 FROM whatsapp_chats")).length, 1);
  assert.equal((await runWhatsApp(msg("2"), deps)).step, "deleted");
  assert.equal((await query("SELECT 1 FROM whatsapp_chats")).length, 0);
});

test("Fast2SMS session reply: the documented request; failures never throw", async () => {
  let seen: { url: string; init: RequestInit } | null = null;
  const ok = await sendSessionText("1122334455", PHONE, "hello", "KEY", (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response(JSON.stringify({ status: "success" }), { status: 200 });
  }) as typeof fetch);
  assert.deepEqual(ok, { ok: true, status: 200 });
  assert.equal(seen!.url, "https://www.fast2sms.com/dev/whatsapp-session?phone_number_id=1122334455&to=919876543210");
  assert.deepEqual(JSON.parse(String(seen!.init.body)), { type: "text", text: "hello" });
  assert.equal((seen!.init.headers as Record<string, string>).authorization, "KEY");
  const down = await sendSessionText("1", PHONE, "x", "KEY", (async () => {
    throw new Error("network");
  }) as typeof fetch);
  assert.deepEqual(down, { ok: false, status: 0 });
});
