/**
 * f/talent/crew, step by step (every minute, and started by the WhatsApp
 * route when a reply comes in). Twenty holds what recruiters decide (crew
 * members and their status); the talent database holds what was sent
 * (crew_messages) and what came back (crew_replies). One run:
 *
 *   1. replies       each saved reply into Twenty: the crew member's status
 *                    (Said yes, Said no, Can't come), Last reply, and an
 *                    inbound Communication; Said yes and Can't come tell the
 *                    recruiters (notification hub)
 *   2. plan and send each watched crew member (crew.ts planMember): send the
 *                    message it is due, mark an unanswered offer No reply,
 *                    or say in Message note why nothing can go
 *   3. reports       WhatsApp delivery reports looked up (there is no
 *                    webhook for them on this number)
 *   4. CRM           each message's state into Twenty: its Communication
 *                    (Delivery up to Read), the crew member's sent time and note
 *
 * Holds the dispatcher's lock (crew-sql.ts CREW_LOCK); a run that cannot
 * take it does nothing (the next one will). A 429 from Twenty ends the
 * run's Twenty work quietly: the key's 100 requests a minute are shared.
 */
import type { Notify } from "../../notify/lib/emit.ts";
import {
  crewDeliveryStatus,
  kindLabel,
  noteAfterSend,
  personName,
  planMember,
  SENT_FIELD,
  statusAfterReply,
  WATCHED_STATUSES,
  type Answer,
  type CrewMember,
  type CrewPerson,
  type CrewRequest,
  type LedgerRow,
} from "./crew.ts";
import {
  CLAIM_CREW_MESSAGE,
  CREW_CRM_DUE,
  CREW_LEDGER,
  CREW_LOCK,
  CREW_REPLIES_DUE,
  CREW_REPLY_DONE,
  CREW_REPLY_FAILED,
  CREW_REPORT_CHECKED,
  CREW_REPORTS_DUE,
  CREW_UNLOCK,
  MARK_CREW_CRM,
  RECOVER_CREW_SENDING,
  SAVE_CREW_REPORT,
  SAVE_CREW_SEND,
} from "./crew-sql.ts";
import { CREW_TEMPLATES, renderTemplate, templateText, type CrewKind, type CrewLocale } from "./crew-templates.ts";
import { TWENTY_APP_URL } from "./notify-application.ts";
import { eq, findEvery, isIn, type Twenty, type TwentyRecord } from "./twenty.ts";
import { classifyWhatsApp, type WhatsAppReport, type WhatsAppResponse } from "./whatsapp-ack.ts";
import type { Query } from "./db.ts";

/** At most this many WhatsApp sends a run (each costs Twenty two writes later). */
export const SENDS_PER_RUN = 10;
const REPLIES_PER_RUN = 20;
const REPORTS_PER_RUN = 20;
const CRM_PER_RUN = 15;

export interface CrewDeps {
  query: Query;
  /** Null when Twenty is not reachable: nothing is planned or written this run. */
  crm: Twenty | null;
  /** Null when WhatsApp is not set up: crew members say so in Message note. */
  sendWhatsApp: ((message: { phone: string; values: string[]; udf1: string }, templateId: number) => Promise<WhatsAppResponse>) | null;
  lookupWhatsApp: (requestId: string) => Promise<WhatsAppReport | null>;
  notify: Notify;
  now?: () => Date;
  templates?: typeof CREW_TEMPLATES;
}

export interface CrewResult {
  locked: boolean;
  replies: number;
  sent: number;
  noReply: number;
  notes: number;
  reports: number;
  crm: number;
  /** Twenty answered 429: the rest waits for the next run. */
  limited: boolean;
  errors: string[];
}

const isRateLimit = (err: unknown) => err instanceof Error && /HTTP 429|too many requests/i.test(err.message);
const isGone = (err: unknown) => err instanceof Error && /HTTP 404/.test(err.message);
const message = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 300);
const iso = (v: string | Date | null | undefined) => (v ? new Date(v).toISOString() : null);
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const memberUrl = (id: string) => `${TWENTY_APP_URL}/object/crewMember/${encodeURIComponent(id)}`;

export async function runCrew(deps: CrewDeps): Promise<CrewResult> {
  const result: CrewResult = { locked: false, replies: 0, sent: 0, noReply: 0, notes: 0, reports: 0, crm: 0, limited: false, errors: [] };
  const [lock] = await deps.query<{ locked: boolean }>(CREW_LOCK);
  if (!lock?.locked) return { ...result, locked: true };
  try {
    await deps.query(RECOVER_CREW_SENDING);
    const crm = deps.crm;
    if (!crm) {
      result.errors.push("Twenty is not reachable");
      return result;
    }
    try {
      await applyReplies(deps, crm, result);
      await planAndSend(deps, crm, result);
      await lookupReports(deps, result);
      await syncCrm(deps, crm, result);
    } catch (err) {
      if (!isRateLimit(err)) throw err;
      result.limited = true;
    }
    return result;
  } finally {
    await deps.query(CREW_UNLOCK);
  }
}

// --- 1. replies --------------------------------------------------------------------

interface ReplyRow {
  key: string;
  phone: string;
  answer: Answer;
  message_type: string | null;
  body: string | null;
  received_at: string | Date;
  message_id: string;
  kind: CrewKind;
  crew_member_id: string;
  person_id: string | null;
  opportunity_id: string | null;
}

async function first(crm: Twenty, plural: string, id: string | null): Promise<TwentyRecord | null> {
  if (!id) return null;
  return (await crm.find(plural, eq("id", id)))[0] ?? null;
}

/** Creates the Communication with this sync key, or updates the one there. Returns its id. */
async function upsertCommunication(crm: Twenty, fields: Record<string, unknown>, knownId: string | null = null): Promise<string> {
  if (knownId) {
    try {
      await crm.update("communications", knownId, fields);
      return knownId;
    } catch (err) {
      if (!isGone(err)) throw err;
    }
  }
  const [existing] = await crm.find("communications", eq("externalKey", String(fields.externalKey)));
  if (existing) {
    await crm.update("communications", existing.id, fields);
    return existing.id;
  }
  return (await crm.create("communications", "Communication", fields)).id;
}

async function applyReplies(deps: CrewDeps, crm: Twenty, result: CrewResult) {
  const rows = await deps.query<ReplyRow>(CREW_REPLIES_DUE, [REPLIES_PER_RUN]);
  for (const r of rows) {
    try {
      const member = (await first(crm, "crewMembers", r.crew_member_id)) as (CrewMember & TwentyRecord) | null;
      const text = (r.body ?? "").trim();
      const next = member ? statusAfterReply(r.kind, r.answer, member.status) : null;
      if (member) {
        await crm.update("crewMembers", member.id, {
          repliedAt: iso(r.received_at),
          lastReply: clip(text || `(${r.message_type ?? "message"})`, 200),
          ...(next ? { status: next } : {}),
        });
      }
      await upsertCommunication(crm, {
        name: `WhatsApp · reply to ${kindLabel(r.kind)}`,
        channel: "WHATSAPP",
        direction: "INBOUND",
        body: text || `(${r.message_type ?? "message"} without text)`,
        provider: "Fast2SMS",
        statusAt: iso(r.received_at),
        externalKey: `crew-reply:${r.key}`,
        personId: r.person_id,
        opportunityId: r.opportunity_id,
      });
      if (member && (next === "SAID_YES" || next === "CANT_COME")) await tellRecruiters(deps, crm, member, next, r);
      await deps.query(CREW_REPLY_DONE, [r.key]);
      result.replies++;
    } catch (err) {
      if (isRateLimit(err)) throw err;
      result.errors.push(`reply: ${message(err)}`);
      await deps.query(CREW_REPLY_FAILED, [r.key, message(err)]);
    }
  }
}

/** Said yes: call them to confirm. Can't come: call the next one who said yes. */
async function tellRecruiters(deps: CrewDeps, crm: Twenty, member: CrewMember, next: "SAID_YES" | "CANT_COME", r: ReplyRow) {
  const person = (await first(crm, "people", member.personId ?? r.person_id)) as CrewPerson | null;
  const request = (await first(crm, "opportunities", member.opportunityId ?? r.opportunity_id)) as CrewRequest | null;
  const job = request?.offerJob?.trim() || "the job";
  const crew = request?.name?.trim() || "a crew request";
  const yes = next === "SAID_YES";
  await deps.notify({
    source: "talent",
    type: yes ? "crew.said_yes" : "crew.cant_come",
    severity: yes ? "info" : "warning",
    dedupeKey: `crew-${yes ? "yes" : "cant-come"}:${member.id}`,
    title: yes ? `Said yes: ${crew}` : `Can't come: ${crew}`,
    summary: yes ? `${job} · call to confirm` : `${job} · confirmed worker can't come; call the next one who said yes`,
    link: { label: "Open in Twenty", url: memberUrl(member.id) },
    pii: { name: personName(person) || undefined, phone: r.phone },
  });
}

// --- 2. plan and send -----------------------------------------------------------------

async function byIds(crm: Twenty, plural: string, ids: string[]): Promise<Map<string, TwentyRecord>> {
  const out = new Map<string, TwentyRecord>();
  for (let i = 0; i < ids.length; i += 50) {
    for (const rec of await findEvery(crm, plural, isIn("id", ids.slice(i, i + 50)))) out.set(rec.id, rec);
  }
  return out;
}

const unique = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))];
const createdMs = (m: CrewMember) => (m.createdAt ? new Date(m.createdAt).getTime() : 0);

/** Crew members older than this are not read (Not needed and Confirmed ones would otherwise pile up). */
export const WATCH_DAYS = 60;

/** The watched statuses, created in the last WATCH_DAYS. */
export const watchedFilter = (now: Date) =>
  `and(${isIn("status", WATCHED_STATUSES)},createdAt[gte]:${JSON.stringify(new Date(now.getTime() - WATCH_DAYS * 86_400_000).toISOString())})`;

async function planAndSend(deps: CrewDeps, crm: Twenty, result: CrewResult) {
  const now = (deps.now ?? (() => new Date()))();
  const members = ((await findEvery(crm, "crewMembers", watchedFilter(now))) as (CrewMember & TwentyRecord)[]).sort(
    (a, b) => createdMs(a) - createdMs(b) || a.id.localeCompare(b.id),
  );
  if (!members.length) return;
  const people = await byIds(crm, "people", unique(members.map((m) => m.personId)));
  const requests = await byIds(crm, "opportunities", unique(members.map((m) => m.opportunityId)));
  const ledger = await deps.query<LedgerRow>(CREW_LEDGER, [members.map((m) => m.id)]);

  for (const m of members) {
    const person = (m.personId ? people.get(m.personId) : null) as CrewPerson | null;
    const request = (m.opportunityId ? requests.get(m.opportunityId) : null) as CrewRequest | null;
    const plan = planMember({
      member: m,
      person,
      request,
      ledger: ledger.filter((r) => r.crew_member_id === m.id),
      others: members,
      now,
      templates: deps.templates,
      canSend: !!deps.sendWhatsApp,
    });

    // A crew member added by hand has no name: the worker and the crew request.
    const patch: Record<string, unknown> = {};
    if (!m.name?.trim() && person && request) patch.name = clip(`${personName(person) || "Worker"} · ${request.name ?? "crew request"}`, 120);

    if (plan.kind === "no_reply") {
      patch.status = "NO_REPLY";
      result.noReply++;
    } else if (plan.kind === "wait") {
      if ((plan.note || null) !== (m.messageNote || null)) {
        patch.messageNote = plan.note ?? "";
        result.notes++;
      }
    }
    if (Object.keys(patch).length) await crm.update("crewMembers", m.id, patch);
    if (plan.kind !== "send" || result.sent >= SENDS_PER_RUN || !deps.sendWhatsApp) continue;

    const [claimed] = await deps.query<{ id: string }>(CLAIM_CREW_MESSAGE, [
      m.id, plan.message, plan.phone, m.personId ?? null, m.opportunityId ?? null, plan.locale, plan.templateId, JSON.stringify(plan.values),
    ]);
    if (!claimed) continue;
    const outcome = classifyWhatsApp(await deps.sendWhatsApp({ phone: plan.phone, values: plan.values, udf1: claimed.id }, plan.templateId));
    await deps.query(SAVE_CREW_SEND, [claimed.id, outcome.status, outcome.requestId, outcome.status === "accepted" ? null : outcome.error]);
    result.sent++;
  }
}

// --- 3. delivery reports ------------------------------------------------------------------

async function lookupReports(deps: CrewDeps, result: CrewResult) {
  const rows = await deps.query<{ id: string; request_id: string }>(CREW_REPORTS_DUE, [REPORTS_PER_RUN]);
  for (const r of rows) {
    const report = await deps.lookupWhatsApp(r.request_id);
    if (report) await deps.query(SAVE_CREW_REPORT, [r.id, report.outcome, report.detail, report.at]);
    else await deps.query(CREW_REPORT_CHECKED, [r.id]);
    result.reports++;
  }
}

// --- 4. into Twenty -------------------------------------------------------------------------

interface CrmRow {
  id: string;
  crew_member_id: string;
  kind: CrewKind;
  person_id: string | null;
  opportunity_id: string | null;
  locale: CrewLocale;
  template_id: number;
  variables: string[] | string;
  status: string;
  request_id: string | null;
  error: string | null;
  sent_at: string | Date | null;
  delivery: string | null;
  delivery_detail: string | null;
  delivered_at: string | Date | null;
  communication_id: string | null;
  updated_at: string | Date;
  state: string;
}

export function crewCommunicationFields(r: CrmRow): Record<string, unknown> {
  const template = templateText(r.kind, r.locale);
  const values = (typeof r.variables === "string" ? JSON.parse(r.variables) : r.variables) as string[];
  return {
    name: `WhatsApp · ${kindLabel(r.kind)}`,
    channel: "WHATSAPP",
    direction: "OUTBOUND",
    deliveryStatus: crewDeliveryStatus(r.status, r.delivery),
    template: `${template.name} (${template.language}, WhatsApp)`,
    body: renderTemplate(template, values),
    provider: "Fast2SMS",
    providerId: r.request_id ?? "",
    statusAt: iso(r.delivered_at ?? r.sent_at ?? r.updated_at),
    error: r.delivery === "failed" ? (r.delivery_detail ?? "") : (r.error ?? ""),
    externalKey: `crew:${r.id}`,
    personId: r.person_id,
    opportunityId: r.opportunity_id,
  };
}

async function syncCrm(deps: CrewDeps, crm: Twenty, result: CrewResult) {
  const rows = await deps.query<CrmRow>(CREW_CRM_DUE, [CRM_PER_RUN]);
  for (const r of rows) {
    try {
      const commId = await upsertCommunication(crm, crewCommunicationFields(r), r.communication_id);
      const sentField = SENT_FIELD[r.kind];
      const patch: Record<string, unknown> = { messageNote: noteAfterSend(r.kind, r.status, r.delivery) ?? "" };
      if (sentField && r.status === "accepted") patch[sentField] = iso(r.sent_at);
      try {
        await crm.update("crewMembers", r.crew_member_id, patch);
      } catch (err) {
        // The crew member was deleted in Twenty: the Communication stays on the person.
        if (!isGone(err)) throw err;
      }
      await deps.query(MARK_CREW_CRM, [r.id, commId, r.state]);
      result.crm++;
    } catch (err) {
      if (isRateLimit(err)) throw err;
      result.errors.push(`crm: ${message(err)}`);
    }
  }
}
