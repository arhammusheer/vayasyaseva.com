// The notification hub (notify/): rendering by policy, the Call action,
// dedupe and firing/resolved, collapsing and reminders, the digest, the
// Alertmanager mapping, the webhook's pii rule, and retries with the email
// fallback (fetch mocked; the store in memory).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { alertmanagerEvents } from "./notify/lib/alertmanager.ts";
import { setNotifyConfigForTests } from "./notify/lib/config.ts";
import { NOTIFY_CLAIM_DELIVERIES, NOTIFY_CLAIM_DIGEST, NOTIFY_CLAIM_SWEEP, NOTIFY_CLAIM_UNROUTED } from "./notify/lib/db.ts";
import { MAX_ATTEMPTS, runDigest, runDispatch } from "./notify/lib/dispatch.ts";
import { emit, tryEmit } from "./notify/lib/emit.ts";
import { maskPhone, scrubText, telUrl, validateEvent, type NotifyEvent } from "./notify/lib/event.ts";
import { checkIngest, withoutPii } from "./notify/lib/ingest.ts";
import { memoryStore } from "./notify/lib/memory-store.ts";
import { ntfyClient } from "./notify/lib/ntfy.ts";
import { DEFAULT_POLICY, decide, parsePolicy, policyErrors, resolveRoute, type KeyState } from "./notify/lib/policy.ts";
import { groupDigest, renderDigest, renderEmail, renderPush, type DigestItem } from "./notify/lib/render.ts";
import { resendClient } from "./notify/lib/resend.ts";
import { main as ingestMain, preprocessor as ingestPreprocessor } from "./notify/scripts/ingest.ts";
import { preprocessor as amPreprocessor } from "./notify/scripts/alertmanager.ts";
import { SCRIPTS } from "./scripts.mts";

// Made-up test data: no real person.
const PHONE = "+919876543210";
const NAME = "Test Applicant";

const event = (over: Partial<NotifyEvent> = {}): NotifyEvent => {
  const checked = validateEvent({
    v: 1,
    source: "talent",
    type: "application.received",
    severity: "info",
    dedupeKey: "application:VS-J-TEST01",
    occurredAt: "2026-10-18T04:30:00.000Z",
    title: "New job application: packer, Haridwar",
    summary: "VS-J-TEST01 · quick form · Hindi",
    link: { label: "View in Twenty", url: "https://crm.vayasyaseva.com/object/person/abc" },
    pii: { name: NAME, phone: PHONE },
    ...over,
  });
  assert.ok(checked.ok, JSON.stringify(!checked.ok && checked.errors));
  return checked.event;
};

const lead = (severity: "info" | "notice") =>
  event({
    source: "leads",
    type: "lead.received",
    severity,
    dedupeKey: "lead:VS-L-TEST01",
    title: "New crew request: 12 loaders, SIDCUL Haridwar",
    summary: "VS-L-TEST01 · from /contact",
    pii: { name: "Test Buyer", company: "Example Industries", phone: "+919876543211", email: "buyer@example.com" },
  });

const at = (iso: string) => new Date(iso);

/** A fetch that answers from a list of statuses (the last repeats) and records each call. */
function fakeFetch(statuses: number[]) {
  const calls: { url: string; body: Record<string, unknown>; headers: Record<string, string> }[] = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body ?? "{}")), headers: init?.headers as Record<string, string> });
    const status = statuses[Math.min(calls.length - 1, statuses.length - 1)];
    return new Response(status === 200 ? "{}" : "unavailable", { status });
  }) as typeof fetch;
  return { impl, calls };
}

function hub(opts: { ntfy?: number[]; resend?: number[] } = {}) {
  const mem = memoryStore();
  const ntfyFetch = fakeFetch(opts.ntfy ?? [200]);
  const resendFetch = fakeFetch(opts.resend ?? [200]);
  let clock = at("2026-10-18T04:31:00.000Z");
  const deps = () => ({
    store: mem.store,
    policy: DEFAULT_POLICY,
    ntfy: ntfyClient("http://ntfy.test", "tk_test", ntfyFetch.impl),
    resend: resendClient("re_test", "VSPL <notify@notify.example>", "owner@example.com", resendFetch.impl),
    now: () => clock,
  });
  return {
    mem,
    ntfyCalls: ntfyFetch.calls,
    emailCalls: resendFetch.calls,
    emit: (e: NotifyEvent) => emit(e, { store: mem.store, now: clock }),
    dispatch: () => runDispatch(deps()),
    digest: () => runDigest(deps()),
    advance: (minutes: number) => void (clock = new Date(clock.getTime() + minutes * 60_000)),
  };
}

// --- Rendering by policy -------------------------------------------------------------------

test("an application push shows the name and full phone, with Call and View in Twenty", () => {
  const e = event();
  const route = resolveRoute(DEFAULT_POLICY, e);
  assert.deepEqual([route.push, route.pii, route.call, route.topic, route.email], ["instant", "full", true, "vspl-jobs", "digest"]);
  const push = renderPush(e, route, { kind: "event", count: 1 });
  assert.match(push.message, new RegExp(`${NAME} · \\${PHONE}`));
  assert.equal(push.priority, 4);
  assert.deepEqual(push.actions, [
    { action: "view", label: "Call", url: "tel:+919876543210", clear: false },
    { action: "view", label: "View in Twenty", url: "https://crm.vayasyaseva.com/object/person/abc" },
  ]);
  assert.equal(push.click, "https://crm.vayasyaseva.com/object/person/abc");
  assert.doesNotMatch(push.title, /Test|9876/);
});

test("a lead push masks the phone, shows name and company, and qualified leads rank higher", () => {
  const info = lead("info");
  const route = resolveRoute(DEFAULT_POLICY, info);
  assert.deepEqual([route.pii, route.call, route.topic, route.email], ["masked", false, "vspl-leads", "none"]);
  const push = renderPush(info, route, { kind: "event", count: 1 });
  assert.match(push.message, /Test Buyer · Example Industries · \+91 XXXXXX3211/);
  assert.doesNotMatch(push.message, /9876543211|buyer@example\.com/);
  assert.ok(!push.actions?.some((a) => a.url.startsWith("tel:")));
  assert.equal(push.priority, 3);
  assert.equal(resolveRoute(DEFAULT_POLICY, lead("notice")).priority, 4);
});

test("titles and summaries never carry personal data, whatever the producer sent", () => {
  const checked = validateEvent({
    v: 1, source: "website", type: "form.error", severity: "warning", dedupeKey: "x",
    title: `Call ${PHONE} or mail someone@example.com now, it is a long title that will be clipped at eighty`,
    summary: "Aadhaar 2345 6789 0123, PAN ABCDE1234F, phone 98765 43210, page /jobs/haridwar?ref=12345678901",
  });
  assert.ok(checked.ok);
  const { title, summary } = checked.event;
  assert.ok(title.length <= 80);
  assert.doesNotMatch(`${title} ${summary}`, /9876|someone@|2345 6789|ABCDE1234F/);
  assert.match(summary, /XXXX XXXX 0123/);
  assert.match(summary, /\[phone removed\]/);
  assert.match(summary, /ref=12345678901/, "digits inside a URL are not a phone number");
  assert.equal(scrubText("Run 2026-10-18 took 12 s"), "Run 2026-10-18 took 12 s");
});

test("emails, resolutions, reminders and the digest never show pii", () => {
  const e = event({ severity: "critical", status: "firing", type: "platform.db_down", source: "platform", dedupeKey: "p" });
  const route = resolveRoute(DEFAULT_POLICY, e);
  for (const kind of ["event", "resolved", "fallback"] as const) {
    const mail = renderEmail(e, kind);
    assert.doesNotMatch(`${mail.subject}\n${mail.text}`, /Test Applicant|9876543210/);
  }
  for (const kind of ["resolved", "reminder", "collapsed"] as const) {
    const push = renderPush(e, { ...route, pii: "full", call: true }, { kind, count: 3 });
    assert.doesNotMatch(push.message, /Test Applicant|9876543210/);
    assert.ok(!push.actions?.some((a) => a.label === "Call"));
  }
  const digest = renderDigest([e], at("2026-10-17T02:30:00Z"), at("2026-10-18T02:30:00Z"));
  assert.doesNotMatch(digest.text, /Test Applicant|9876543210/);
});

test("the SEO weekly report is email only; a one-line push is the summary's first line; critical events always email", () => {
  const report = event({ source: "seo-watch", type: "seo.weekly_report", dedupeKey: "seo:2026-W42", summary: "Clicks 412 (+8%), impressions 31k\nmore lines", body: "full report", pii: undefined });
  assert.deepEqual(Object.values((({ push, email }) => ({ push, email }))(resolveRoute(DEFAULT_POLICY, report))), ["none", "instant"], "search data stays off the lock screen");
  const oneLine = { ...DEFAULT_POLICY, rules: [{ name: "one line", match: { type: "seo.weekly_report" }, push: { mode: "one_line" as const }, email: "instant" as const }, ...DEFAULT_POLICY.rules] };
  const route = resolveRoute(oneLine, report);
  assert.deepEqual([route.push, route.email], ["one_line", "instant"]);
  assert.equal(renderPush(report, route, { kind: "event", count: 1 }).message, "Clicks 412 (+8%), impressions 31k");
  assert.match(renderEmail(report, "event").text, /full report/);
  const crit = resolveRoute(DEFAULT_POLICY, { source: "platform", type: "platform.r2_down", severity: "critical" });
  assert.equal(crit.email, "instant", "platform.* is digest, but critical upgrades it");
  assert.deepEqual(
    [resolveRoute(DEFAULT_POLICY, { source: "alertmanager", type: "alert.X", severity: "warning" }).email, resolveRoute(DEFAULT_POLICY, { source: "alertmanager", type: "alert.X", severity: "critical" }).email],
    ["digest", "instant"],
  );
  assert.equal(resolveRoute(DEFAULT_POLICY, { source: "github", type: "search.pipeline_failed", severity: "warning" }).email, "none");
  assert.equal(resolveRoute(DEFAULT_POLICY, { source: "website", type: "something.new", severity: "info" }).push, "none");
});

// --- The Call action -------------------------------------------------------------------------

test("the Call action dials E.164 and appears only for pii full with call on", () => {
  assert.equal(telUrl("+91 98765 43210"), "tel:+919876543210");
  assert.equal(telUrl("9876543210"), "tel:+919876543210");
  assert.equal(telUrl("919876543210"), "tel:+919876543210");
  assert.equal(telUrl("12"), null);
  assert.equal(maskPhone("+919876543210"), "+91 XXXXXX3210");
  const e = event();
  const route = resolveRoute(DEFAULT_POLICY, e);
  assert.equal(renderPush(e, { ...route, call: false }, { kind: "event", count: 1 }).actions?.[0].label, "View in Twenty");
  assert.ok(!renderPush(e, { ...route, pii: "masked" }, { kind: "event", count: 1 }).actions?.some((a) => a.label === "Call"));
  assert.ok(!renderPush(event({ pii: { name: NAME } }), route, { kind: "event", count: 1 }).actions?.some((a) => a.label === "Call"));
  assert.ok(policyErrors({ ...DEFAULT_POLICY, rules: [{ name: "x", match: {}, push: { mode: "instant", call: true }, email: "none" }] }).some((m) => /call needs pii full/.test(m)));
});

// --- Dedupe, firing and resolved ---------------------------------------------------------------

test("decide: a repeat is a duplicate; resolved goes out only after a firing that was sent", () => {
  const now = at("2026-10-18T05:00:00Z");
  const instant = resolveRoute(DEFAULT_POLICY, { source: "alertmanager", type: "alert.X", severity: "critical" });
  const first = decide({}, resolveRoute(DEFAULT_POLICY, event()), null, now);
  assert.equal(first.push?.kind, "event");
  assert.equal(decide({}, resolveRoute(DEFAULT_POLICY, event()), first.state, now).duplicate, true);

  const firing = decide({ status: "firing" }, instant, null, now);
  assert.deepEqual([firing.push?.kind, firing.email?.kind, firing.state.status], ["event", "event", "firing"]);
  const again = decide({ status: "firing" }, instant, firing.state, now);
  assert.equal(again.duplicate, true);
  const resolved = decide({ status: "resolved" }, instant, again.state, now);
  assert.deepEqual([resolved.push?.kind, resolved.email?.kind, resolved.state.status], ["resolved", "resolved", "resolved"]);
  assert.equal(decide({ status: "resolved" }, instant, resolved.state, now).duplicate, true, "resolved twice");
  assert.equal(decide({ status: "resolved" }, instant, null, now).duplicate, true, "resolved with no firing");

  const quiet = { ...instant, push: "none" as const, email: "digest" as const };
  const unsent = decide({ status: "firing" }, quiet, null, now);
  const r = decide({ status: "resolved" }, quiet, unsent.state, now);
  assert.deepEqual([r.push, r.email, r.digest], [null, null, true], "nothing pushed for the firing: no resolved push");
});

test("dispatch: one push per dedupeKey, firing then resolved, pii cleared once sent", async () => {
  const h = hub();
  await h.emit(event());
  await h.emit(event());
  const am = (status: "firing" | "resolved") => event({ source: "alertmanager", type: "alert.PgMainReplicaMissing", severity: "warning", dedupeKey: "am:abc", status, pii: undefined, title: "PgMainReplicaMissing (data)" });
  await h.emit(am("firing"));
  await h.emit(am("firing"));
  const out = await h.dispatch();
  assert.equal(out.routed, 4);
  assert.equal(out.duplicates, 2);
  assert.equal(h.ntfyCalls.length, 2);
  assert.equal(h.ntfyCalls[0].headers.authorization, "Bearer tk_test");
  assert.equal(h.mem.events.filter((e) => e.pii).length, 0, "pii cleared after the push was sent");
  await h.emit(am("resolved"));
  await h.dispatch();
  assert.equal(h.ntfyCalls.length, 3);
  assert.match(String(h.ntfyCalls[2].body.title), /^Resolved: PgMainReplicaMissing/);
  assert.equal(h.emailCalls.length, 0, "warning alerts go to the digest");
});

test("platform events push when firing starts, then once a day while firing", async () => {
  const h = hub();
  await h.emit(event({ source: "platform", type: "platform.windmill_down", severity: "warning", dedupeKey: "platform:windmill", status: "firing", pii: undefined, title: "Windmill is down" }));
  await h.dispatch();
  h.advance(60);
  await h.dispatch();
  assert.equal(h.ntfyCalls.length, 1);
  h.advance(23 * 60);
  await h.dispatch();
  assert.equal(h.ntfyCalls.length, 2);
  assert.match(String(h.ntfyCalls[1].body.title), /^Still firing: Windmill is down/);
});

test("windmill job failures collapse per script: the first now, then one summary per hour", async () => {
  const h = hub();
  const failure = () => event({ source: "platform", type: "windmill.job_failed", severity: "warning", dedupeKey: "wm:f/talent/deliver", pii: undefined, title: "f/talent/deliver failed" });
  await h.emit(failure());
  await h.dispatch();
  for (let i = 0; i < 3; i++) {
    h.advance(10);
    await h.emit(failure());
    await h.dispatch();
  }
  assert.equal(h.ntfyCalls.length, 1);
  h.advance(31);
  await h.dispatch();
  assert.equal(h.ntfyCalls.length, 2);
  assert.match(String(h.ntfyCalls[1].body.title), /\(3 times\)$/);
  assert.equal(h.mem.events.filter((e) => e.digest).length, 4, "every failure is in the digest");
});

// --- Retries and the email fallback (fetch mocked) -------------------------------------------

test("a push that keeps failing is retried four times in all, then a critical one is emailed", async () => {
  const h = hub({ ntfy: [503] });
  await h.emit(event({ source: "platform", type: "platform.r2_down", severity: "critical", dedupeKey: "platform:r2", status: "firing", pii: undefined, title: "R2 unreachable" }));
  await h.dispatch();
  // Critical: an instant email from the policy, plus the first push try.
  assert.equal(h.ntfyCalls.length, 1);
  assert.equal(h.emailCalls.length, 1);
  for (const wait of [1, 2, 5]) {
    h.advance(wait);
    await h.dispatch();
  }
  assert.equal(h.ntfyCalls.length, MAX_ATTEMPTS);
  const push = h.mem.deliveries.find((d) => d.channel === "push")!;
  assert.deepEqual([push.status, push.attempts], ["failed", MAX_ATTEMPTS]);
  assert.match(push.lastError ?? "", /ntfy HTTP 503/);
  assert.equal(h.emailCalls.length, 1, "already emailed by the policy: no second, fallback email");
});

test("a critical push that fails is emailed when its rule sends no email", async () => {
  const h = hub({ ntfy: [400] });
  const policy = { ...DEFAULT_POLICY, criticalEmail: false };
  const mem = h.mem;
  await h.emit(event({ source: "github", type: "search.pipeline_failed", severity: "critical", dedupeKey: "gh:run1", pii: undefined, title: "search.yml failed" }));
  const ntfyFetch = fakeFetch([400]);
  const mail = fakeFetch([200]);
  const out = await runDispatch({
    store: mem.store,
    policy,
    ntfy: ntfyClient("http://ntfy.test", "tk", ntfyFetch.impl),
    resend: resendClient("re", "from@example.com", "to@example.com", mail.impl),
    now: () => at("2026-10-18T05:00:00Z"),
  });
  assert.equal(ntfyFetch.calls.length, 1, "a 400 is not retried");
  assert.deepEqual([out.failed, out.fallbacks, out.sent], [1, 1, 1]);
  assert.match(String(mail.calls[0].body.subject), /^Push failed, by email: search\.yml failed/);
  assert.equal(mail.calls[0].headers["idempotency-key"], "vspl-notify-delivery-3");
});

test("a non-critical push that fails every try is not emailed, and its pii is cleared", async () => {
  const h = hub({ ntfy: [500] });
  await h.emit(event());
  await h.dispatch();
  for (const wait of [1, 2, 5]) {
    h.advance(wait);
    await h.dispatch();
  }
  assert.equal(h.ntfyCalls.length, 4);
  assert.equal(h.emailCalls.length, 0);
  assert.equal(h.mem.events[0].pii, undefined);
});

test("a send interrupted mid-run goes back to pending after ten minutes", async () => {
  const h = hub();
  await h.emit(event());
  await h.dispatch();
  const d = h.mem.deliveries[0];
  Object.assign(d, { status: "sending", attempts: 1 });
  h.advance(11);
  const out = await h.dispatch();
  assert.equal(out.recovered, 1);
  assert.equal(h.mem.deliveries[0].status, "sent");
});

test("the outbox and claims use SKIP LOCKED", () => {
  for (const sql of [NOTIFY_CLAIM_UNROUTED, NOTIFY_CLAIM_DELIVERIES, NOTIFY_CLAIM_SWEEP, NOTIFY_CLAIM_DIGEST]) assert.match(sql, /SKIP LOCKED/);
  const schema = readFileSync(new URL("notify/schema.sql", import.meta.url), "utf8");
  for (const table of ["notify_events", "notify_keys", "notify_deliveries"]) assert.match(schema, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
});

// --- Digest ----------------------------------------------------------------------------------------

test("the digest groups by source and type, worst first", () => {
  const item = (source: string, type: string, severity: DigestItem["severity"], minute: number): DigestItem => ({
    source, type, severity, title: `${type} ${minute}`, occurredAt: new Date(Date.UTC(2026, 9, 17, 3, minute)).toISOString(),
  });
  const groups = groupDigest([
    item("talent", "application.received", "info", 5),
    item("talent", "application.received", "info", 1),
    item("alertmanager", "alert.X", "warning", 2),
    item("talent", "talent.other", "info", 3),
    item("seo-watch", "seo.x", "info", 4),
  ]);
  assert.deepEqual(groups.map((g) => g.source), ["alertmanager", "talent", "seo-watch"]);
  assert.deepEqual(groups[1].types.map((t) => [t.type, t.count]), [["application.received", 2], ["talent.other", 1]]);
  assert.deepEqual(groups[1].types[0].items.map((i) => i.title), ["application.received 1", "application.received 5"]);
});

test("the digest emails the day's digest events once; nothing to send, no email", async () => {
  const h = hub();
  await h.emit(event());
  await h.emit(event({ dedupeKey: "application:VS-J-TEST02" }));
  await h.emit(lead("info"));
  await h.dispatch();
  const first = await h.digest();
  assert.deepEqual([first.sent, first.events], [true, 2], "applications are digest, leads are not");
  assert.match(String(h.emailCalls[0].body.subject), /^VSPL daily digest · .* · 2 events$/);
  assert.match(String(h.emailCalls[0].body.text), /talent \(2\)\n {2}application\.received × 2/);
  assert.deepEqual(await h.digest(), { sent: false, events: 0, purged: 0 });
  assert.equal(h.emailCalls.length, 1);
});

test("a digest Resend refuses is kept for the next run", async () => {
  const h = hub({ resend: [500, 200] });
  await h.emit(event());
  await h.dispatch();
  await assert.rejects(h.digest(), /digest not sent: resend HTTP 500/);
  assert.equal(h.mem.events[0].digestedAt, null);
  assert.equal((await h.digest()).sent, true);
});

// --- Alertmanager --------------------------------------------------------------------------------

const alertPayload = {
  version: "4",
  groupKey: "{}:{namespace=\"data\"}",
  status: "firing",
  receiver: "vspl-notify",
  externalURL: "https://alertmanager.vayasyaseva.com",
  alerts: [
    {
      status: "firing",
      labels: { alertname: "PgMainBackupStale", namespace: "data", severity: "critical" },
      annotations: { summary: "pg-main has no completed backup in over 26 hours.", description: "Check the barman-cloud plugin." },
      startsAt: "2026-10-18T01:00:00Z",
      endsAt: "0001-01-01T00:00:00Z",
      fingerprint: "a1b2c3",
    },
    {
      status: "resolved",
      labels: { alertname: "UmamiNoRunningPods", namespace: "growth", severity: "warning" },
      annotations: { summary: "Umami (growth) has no available pods." },
      startsAt: "2026-10-18T00:00:00Z",
      endsAt: "2026-10-18T00:20:00Z",
      fingerprint: "d4e5f6",
    },
    { status: "firing", labels: { alertname: "Watchdog", severity: "none" }, annotations: {}, startsAt: "2026-10-18T00:00:00Z", fingerprint: "w" },
  ],
};

test("Alertmanager alerts map to events keyed am:<fingerprint>", () => {
  const { events, ignored, errors } = alertmanagerEvents(alertPayload);
  assert.deepEqual([events.length, ignored, errors], [2, 1, []]);
  const [crit, warn] = events;
  assert.deepEqual(
    { source: crit.source, type: crit.type, severity: crit.severity, dedupeKey: crit.dedupeKey, status: crit.status, occurredAt: crit.occurredAt, title: crit.title },
    { source: "alertmanager", type: "alert.PgMainBackupStale", severity: "critical", dedupeKey: "am:a1b2c3", status: "firing", occurredAt: "2026-10-18T01:00:00Z", title: "PgMainBackupStale (data)" },
  );
  assert.deepEqual(crit.link, { label: "Alertmanager", url: "https://alertmanager.vayasyaseva.com/#/alerts" });
  assert.match(crit.body ?? "", /severity=critical/);
  assert.deepEqual([warn.status, warn.severity, warn.occurredAt], ["resolved", "warning", "2026-10-18T00:20:00Z"]);
  for (const e of events) assert.ok(validateEvent({ v: 1, ...e }).ok);
  assert.deepEqual(alertmanagerEvents({ version: "3", alerts: [] }).errors, ["unsupported webhook version 3"]);
  assert.equal(alertmanagerEvents("nope").errors.length, 1);
});

// --- The webhooks ----------------------------------------------------------------------------------

test("the ingest webhook drops pii before main and checks its secret", async () => {
  setNotifyConfigForTests({ ingest_secret: "s3cret", alertmanager_secret: "am-token" });
  try {
    const body = { events: [{ source: "website", type: "x.y", severity: "info", dedupeKey: "k", title: "t", summary: "s", pii: { phone: PHONE } }] };
    const ok = await ingestPreprocessor({ headers: { "X-VSPL-Notify-Secret": "s3cret" }, body });
    assert.equal(ok.authorized, true);
    assert.equal(ok.pii_dropped, 1);
    assert.doesNotMatch(JSON.stringify(ok), /9876543210/);
    const bad = await ingestPreprocessor({ headers: { "x-vspl-notify-secret": "nope" }, body });
    assert.deepEqual(bad, { authorized: false, events: [], pii_dropped: 0 });
    assert.deepEqual(await ingestMain(false, []), { wm_status_code: 403, result: { ok: false, error: "Forbidden" } });
    assert.equal((await ingestMain(true, [{ v: 1 }])).wm_status_code, 400);
    assert.equal((await amPreprocessor({ headers: { Authorization: "Bearer am-token" }, body: {} })).authorized, true);
    assert.equal((await amPreprocessor({ headers: { authorization: "am-token" }, body: {} })).authorized, false);
  } finally {
    setNotifyConfigForTests(null);
  }
  assert.equal(withoutPii({ source: "x" }).events.length, 1, "a single event is accepted too");
  const checked = checkIngest(Array.from({ length: 51 }, () => ({})));
  assert.match(checked.rejected[0].errors[0], /at most 50/);
});

test("tryEmit never throws; emit refuses an invalid event", async () => {
  const mem = memoryStore();
  await assert.rejects(emit({ source: "talent", type: "nope", severity: "info", dedupeKey: "k", title: "t", summary: "s" }, { store: mem.store }), /invalid notification event: type/);
  assert.equal(await tryEmit({ source: "talent", type: "nope", severity: "info", dedupeKey: "k", title: "t", summary: "s" }, { store: mem.store }), false);
  assert.equal(await tryEmit({ source: "talent", type: "application.received", severity: "info", dedupeKey: "k", title: "t", summary: "s" }, { store: mem.store }), true);
  assert.equal(mem.events.length, 1);
});

// --- Policy and registration ------------------------------------------------------------------------

test("the default policy is valid and a broken one falls back to it", () => {
  assert.deepEqual(policyErrors(DEFAULT_POLICY), []);
  assert.equal(parsePolicy(JSON.stringify(DEFAULT_POLICY)).problem, null);
  assert.equal(parsePolicy("{oops").policy, DEFAULT_POLICY);
  assert.match(parsePolicy(JSON.stringify({ ...DEFAULT_POLICY, rules: [{ name: "x", match: {}, push: { mode: "loud" }, email: "none" }] })).problem ?? "", /push\.mode/);
  const state: KeyState = { status: null, firingPushed: false, firingEmailed: false, lastPushAt: null, pendingCount: 0, seenCount: 0 };
  assert.equal(decide({}, resolveRoute(DEFAULT_POLICY, lead("info")), state, new Date()).duplicate, true, "a known key without status is a duplicate");
});

test("the notify scripts are registered: two schedules, two routes, setup", () => {
  const notify = SCRIPTS.filter((s) => s.folder === "notify");
  assert.deepEqual(notify.map((s) => s.name).sort(), ["alertmanager", "digest", "dispatch", "ingest", "setup"]);
  assert.equal(notify.find((s) => s.name === "dispatch")?.schedule?.cron, "0 * * * * *");
  assert.equal(notify.find((s) => s.name === "digest")?.schedule?.cron, "0 0 8 * * *");
  assert.deepEqual(notify.find((s) => s.name === "ingest")?.route, { path: "webhook/vspl-notify", method: "post", secretHeader: "x-vspl-notify-secret" });
  assert.equal(notify.find((s) => s.name === "alertmanager")?.route?.path, "internal/vspl-alertmanager");
});
