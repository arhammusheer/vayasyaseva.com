/**
 * Crew offers, the decisions (talent/lib/run-crew.ts does the work): which
 * WhatsApp message a crew member is due, or why none can go; how a reply
 * reads; how a reply moves the crew member on. Pure functions over Twenty's
 * records (integrations/twenty/setup.mts: crewMember, opportunity, person)
 * and the talent database's ledger (crew_messages), so the tests can drive
 * every case.
 *
 * The flow (docs/crew-offers.md; Twenty's labels in brackets):
 *   recruiter invites a worker to interview      Offered (Invited)          -> offer: the invitation
 *   worker taps Yes / No                         Said yes / Said no
 *   no answer in 24 hours                        No reply
 *   recruiter calls, then sets                   Confirmed (Interview fixed) -> confirmed: interview details
 *   the evening before the interview                                         -> reminder
 *   worker taps Can't come                       Can't come (the recruiter is told)
 *   interviews full, recruiter sets              Not needed                 -> not_needed (only to those who said yes)
 *   after the interview                          Reported (Came) / Didn't come
 */
import { normaliseIndianMobile } from "../../../../packages/contracts/src/rules.ts";
import { CREW_TEMPLATE_TEXT, CREW_TEMPLATES, STAY_TEXT, crewLocale, templateKey, variableValue, type CrewKind, type CrewLocale } from "./crew-templates.ts";

export const CREW_STATUSES = ["OFFERED", "SAID_YES", "SAID_NO", "NO_REPLY", "CONFIRMED", "CANT_COME", "REPORTED", "DIDNT_COME", "NOT_NEEDED"] as const;
export type CrewStatus = (typeof CREW_STATUSES)[number];

/** The statuses f/talent/crew reads each run: the ones a message follows, and Said yes (an open offer). */
export const WATCHED_STATUSES: CrewStatus[] = ["OFFERED", "SAID_YES", "CONFIRMED", "NOT_NEEDED"];
/** A worker holds one open offer at a time: these count as open. */
const OPEN: CrewStatus[] = ["OFFERED", "SAID_YES", "CONFIRMED"];

// --- Twenty's records, as f/talent/crew reads them -------------------------------

export interface CrewMember {
  id: string;
  name?: string | null;
  status?: string | null;
  personId?: string | null;
  opportunityId?: string | null;
  createdAt?: string | null;
  messageNote?: string | null;
}

export interface CrewPerson {
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  phones?: { primaryPhoneNumber?: string | null; primaryPhoneCallingCode?: string | null } | null;
  workerStatus?: string | null;
  language?: string | null;
  consentedAt?: string | null;
}

export interface CrewRequest {
  id: string;
  name?: string | null;
  startDate?: string | null;
  offerJob?: string | null;
  offerPlace?: string | null;
  offerPay?: string | null;
  offerShift?: string | null;
  /** ROOM, FOOD, ROOM_AND_FOOD; empty when nothing is given (the invitation then has no stay and food line). */
  stayAndFood?: string | null;
  reportAddress?: string | null;
  reportAt?: string | null;
  siteContact?: string | null;
  mapLink?: string | null;
}

/** One crew_messages row (CREW_LEDGER). */
export interface LedgerRow {
  id: string;
  crew_member_id: string;
  kind: CrewKind;
  status: "sending" | "accepted" | "failed" | "unknown";
  sent_at: string | Date | null;
  delivery: string | null;
  replied: boolean;
  said_yes: boolean;
}

// --- India time ---------------------------------------------------------------------

const IST_MS = 330 * 60 * 1000;
/** The wall clock in India (no daylight saving), as UTC fields of a shifted date. */
const ist = (d: Date) => new Date(d.getTime() + IST_MS);
export const istHour = (d: Date) => ist(d).getUTCHours();
const istDay = (d: Date) => ist(d).toISOString().slice(0, 10);
/** 00:00 India time on a YYYY-MM-DD day, plus `hours`. */
const istAt = (day: string, hours: number) => new Date(Date.parse(`${day}T00:00:00+05:30`) + hours * 3600_000);

const DATE_FORMAT: Record<CrewLocale, string> = { "en-IN": "en-IN", "hi-IN": "hi-IN", "hi-Latn-IN": "en-IN" };

/** "Wednesday, 25 November" / "बुधवार, 25 नवंबर" for a DATE ("2026-11-25") or a moment. */
export function formatDay(value: string | Date, locale: CrewLocale): string {
  const d = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? istAt(value, 12) : new Date(value);
  return new Intl.DateTimeFormat(DATE_FORMAT[locale], { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(d);
}

const DAY_PARTS: Record<"hi-IN" | "hi-Latn-IN", [string, string, string, string]> = {
  "hi-IN": ["सुबह", "दोपहर", "शाम", "रात"],
  "hi-Latn-IN": ["subah", "dopahar", "shaam", "raat"],
};

/** "8:00 am" / "सुबह 8:00 बजे" / "subah 8:00 baje", India time. */
export function formatTime(value: string | Date, locale: CrewLocale): string {
  const d = ist(new Date(value));
  const h = d.getUTCHours();
  const clock = `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  if (locale === "en-IN") return `${clock} ${h < 12 ? "am" : "pm"}`;
  const [morning, afternoon, evening, night] = DAY_PARTS[locale];
  const part = h >= 4 && h < 12 ? morning : h >= 12 && h < 16 ? afternoon : h >= 16 && h < 20 ? evening : night;
  return `${part} ${clock} ${locale === "hi-IN" ? "बजे" : "baje"}`;
}

// --- what each message needs ------------------------------------------------------

/** The crew request's fields each message reads, with the label staff see in Twenty. */
const NEEDS: Record<CrewKind, [keyof CrewRequest, string][]> = {
  offer: [["offerJob", "Job (for workers)"], ["offerPlace", "Place (for workers)"], ["startDate", "Start"]],
  confirmed: [["reportAddress", "Interview at"], ["reportAt", "Interview time"], ["siteContact", "Ask for"]],
  reminder: [["reportAddress", "Interview at"], ["reportAt", "Interview time"]],
  not_needed: [["offerJob", "Job (for workers)"]],
};

/** The stay and food line's words, or null when nothing is given. */
export const stayText = (req: CrewRequest, locale: CrewLocale): string | null => STAY_TEXT[req.stayAndFood ?? ""]?.[locale] ?? null;

const filled = (v: unknown) => typeof v === "string" && v.trim() !== "";

export function missingFields(kind: CrewKind, req: CrewRequest): string[] {
  return NEEDS[kind].filter(([field]) => !filled(req[field])).map(([, label]) => label);
}

/**
 * The template's variable values, in order. Assumes missingFields is empty.
 * `reference` is the worker's application (VS-J-...), for the invitation and
 * the interviews-full message.
 */
export function templateValues(kind: CrewKind, req: CrewRequest, locale: CrewLocale, reference = ""): string[] {
  const s = (v: string | null | undefined) => v ?? "";
  switch (kind) {
    case "offer": {
      const stay = stayText(req, locale);
      return [reference, s(req.offerJob), s(req.offerPlace), formatDay(s(req.startDate), locale), ...(stay ? [stay] : [])].map(variableValue);
    }
    case "confirmed": {
      const where = filled(req.mapLink) ? `${s(req.reportAddress)} (map: ${s(req.mapLink).trim()})` : s(req.reportAddress);
      return [where, `${formatDay(s(req.reportAt), locale)}, ${formatTime(s(req.reportAt), locale)}`, s(req.siteContact)].map(variableValue);
    }
    case "reminder":
      return [formatTime(s(req.reportAt), locale), s(req.reportAddress)].map(variableValue);
    case "not_needed":
      return [reference, s(req.offerJob)].map(variableValue);
  }
}

/** The worker's mobile as the talent database keeps it (+91XXXXXXXXXX), or null. */
export function personPhone(p: CrewPerson): string | null {
  const number = p.phones?.primaryPhoneNumber ?? "";
  const code = (p.phones?.primaryPhoneCallingCode ?? "+91").replace(/\s/g, "");
  if (!number || (code && code !== "+91" && code !== "91")) return null;
  return normaliseIndianMobile(number);
}

export const personName = (p: CrewPerson | null | undefined) =>
  [p?.name?.firstName, p?.name?.lastName].filter((x) => x && x.trim()).join(" ").trim();

// --- the plan for one crew member ---------------------------------------------------

/** India-time hours (start inclusive, end exclusive) each message may go in. The reminder has its own window. Test numbers skip both. */
export const SEND_HOURS: Record<Exclude<CrewKind, "reminder">, [number, number]> = {
  offer: [8, 21],
  not_needed: [8, 21],
  // Follows the recruiter's call, so a little wider.
  confirmed: [7, 22],
};
/** The reminder goes 18:00 to 21:00 the evening before, at least 2 hours before reporting, and not within 3 hours of the confirmation. */
export const REMINDER = { fromHour: 18, toHour: 21, beforeReportMs: 2 * 3600_000, afterConfirmedMs: 3 * 3600_000 };
/** An offer nobody answered for this long is No reply. */
export const NO_REPLY_AFTER_MS = 24 * 3600_000;

export interface PlanContext {
  member: CrewMember;
  person: CrewPerson | null;
  request: CrewRequest | null;
  /** This crew member's ledger rows. */
  ledger: LedgerRow[];
  /** Every watched crew member (for one open offer per worker). */
  others: CrewMember[];
  now: Date;
  templates?: typeof CREW_TEMPLATES;
  /** False when WhatsApp is not set up (tests, another workspace). */
  canSend?: boolean;
  /** The worker's latest job application reference (VS-J-...): the invitation and the interviews-full message carry it. */
  reference?: string | null;
  /**
   * A staff test number (Windmill f/talent/crew_test_phones): no quiet hours,
   * and the reminder is due a minute after the confirmation went, so the whole
   * path can be tried at any time. Every other check still applies.
   */
  test?: boolean;
}

/** How long a test number's reminder waits after the confirmation. */
export const TEST_REMINDER_AFTER_MS = 60_000;

export type Plan =
  | { kind: "send"; message: CrewKind; locale: CrewLocale; templateId: number; values: string[]; phone: string }
  /** Nothing to send now; `note` is what the crew member's Message note should say (null: clear it). */
  | { kind: "wait"; note: string | null }
  /** The offer went 24 hours ago and has no answer: status No reply. */
  | { kind: "no_reply" };

const ms = (v: string | Date | null) => (v ? new Date(v).getTime() : 0);

/** Which message (if any) this status calls for now, before the checks on the worker and the crew request. */
function dueMessage(c: PlanContext): CrewKind | "no_reply" | null {
  const sent = (k: CrewKind) => c.ledger.find((r) => r.kind === k);
  switch (c.member.status) {
    case "OFFERED": {
      const offer = sent("offer");
      if (!offer) return "offer";
      if (offer.status === "accepted" && !offer.replied && c.now.getTime() - ms(offer.sent_at) >= NO_REPLY_AFTER_MS) return "no_reply";
      return null;
    }
    case "CONFIRMED": {
      const confirmed = sent("confirmed");
      if (!confirmed) return "confirmed";
      if (sent("reminder") || !c.request?.reportAt) return null;
      if (c.test) return confirmed.status === "accepted" && c.now.getTime() - ms(confirmed.sent_at) >= TEST_REMINDER_AFTER_MS ? "reminder" : null;
      const report = new Date(c.request.reportAt);
      const eve = new Date(report.getTime() - 24 * 3600_000);
      const day = istDay(eve);
      const from = istAt(day, REMINDER.fromHour).getTime();
      const to = Math.min(istAt(day, REMINDER.toHour).getTime(), report.getTime() - REMINDER.beforeReportMs);
      const now = c.now.getTime();
      const settled = confirmed.status !== "accepted" || now - ms(confirmed.sent_at) >= REMINDER.afterConfirmedMs;
      return now >= from && now < to && settled ? "reminder" : null;
    }
    case "NOT_NEEDED": {
      // "Thank you for saying yes": only to someone whose offer they answered yes.
      const offer = sent("offer");
      return !sent("not_needed") && offer?.said_yes ? "not_needed" : null;
    }
    default:
      return null;
  }
}

/** Earlier crew members of the same worker that keep this one from being offered. */
function blockingMember(c: PlanContext): CrewMember | null {
  const created = (m: CrewMember) => ms(m.createdAt ?? null);
  const earlier = (m: CrewMember) => created(m) < created(c.member) || (created(m) === created(c.member) && m.id < c.member.id);
  return (
    c.others.find((m) => m.id !== c.member.id && m.personId === c.member.personId && OPEN.includes(m.status as CrewStatus) && earlier(m)) ?? null
  );
}

export function planMember(c: PlanContext): Plan {
  const due = dueMessage(c);
  if (due === "no_reply") return { kind: "no_reply" };
  // Nothing due: keep the note as it is (it may say why an earlier message did not go).
  if (!due) return { kind: "wait", note: c.member.messageNote ?? null };

  const p = c.person;
  if (!p) return { kind: "wait", note: "Pick the worker (Person) on this crew member" };
  if (!c.request) return { kind: "wait", note: "Pick the crew request on this crew member" };
  if (p.workerStatus === "DO_NOT_CONTACT") return { kind: "wait", note: "Do not contact: no message sent" };
  if (p.workerStatus === "NOT_AVAILABLE" && due === "offer") return { kind: "wait", note: "Marked not available: no invite sent" };
  if (!p.consentedAt) return { kind: "wait", note: "No consent on record (they have not applied on the website): call them instead" };
  const phone = personPhone(p);
  if (!phone) return { kind: "wait", note: "No Indian mobile number on the person" };

  if (due === "offer") {
    const other = blockingMember(c);
    if (other) {
      return {
        kind: "wait",
        note: other.opportunityId === c.member.opportunityId
          ? "Already on this crew request (another crew member record)"
          : "Already has an open interview invite on another crew request: one at a time",
      };
    }
  }

  const missing = missingFields(due, c.request);
  if (missing.length) return { kind: "wait", note: `Fill in on the crew request: ${missing.join(", ")}` };
  // The invitation and the interviews-full message are updates on the worker's own application (Utility, not Marketing).
  const reference = c.reference?.trim() ?? "";
  if ((due === "offer" || due === "not_needed") && !reference) {
    return { kind: "wait", note: "No job application on record for this worker: call them instead" };
  }

  const locale = crewLocale(p.language);
  const key = templateKey(due, due === "offer" && !!stayText(c.request, locale));
  const templateId = (c.templates ?? CREW_TEMPLATES)[key][locale];
  if (!templateId || c.canSend === false) return { kind: "wait", note: `WhatsApp template not approved yet (${key}, ${locale})` };

  if (due !== "reminder" && !c.test) {
    const [from, to] = SEND_HOURS[due];
    const hour = istHour(c.now);
    if (hour < from || hour >= to) return { kind: "wait", note: `Waiting for ${from}:00 to send (no messages ${to}:00 to ${from}:00)` };
  }
  return { kind: "send", message: due, locale, templateId, values: templateValues(due, c.request, locale, reference), phone };
}

// --- replies ---------------------------------------------------------------------------

export type Answer = "yes" | "no" | "other";

const YES_WORDS = new Set([
  "yes", "y", "yeah", "yep", "ok", "okay", "haan", "han", "haa", "ha", "hn", "hanji", "haanji", "ji", "jee", "theek", "thik", "sure", "coming",
  "हाँ", "हां", "हा", "जी", "हाँजी", "ठीक", "ਹਾਂ", "ਜੀ", "ಹೌದು", "1",
]);
const NO_WORDS = new Set([
  "no", "n", "nope", "nahi", "nahin", "nai", "nhi", "na", "cant", "cannot", "not",
  "नहीं", "नही", "ना", "ਨਹੀਂ", "ਨਹੀ", "ಇಲ್ಲ", "2",
]);

/** Devanagari, Gurmukhi and Kannada digits as 0-9. */
const asciiDigits = (s: string) =>
  s.replace(/[०-९੦-੯೦-೯]/g, (ch) => {
    const cp = ch.codePointAt(0)!;
    return String(cp - (cp >= 0x0ce6 ? 0x0ce6 : cp >= 0x0a66 ? 0x0a66 : 0x0966));
  });

export function normaliseReply(text: string): string {
  return asciiDigits(text.normalize("NFC").toLowerCase())
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();
}

/** Every button label of every crew template, read as the answer it gives. */
const BUTTONS: Map<string, Answer> = new Map(
  CREW_TEMPLATE_TEXT.flatMap((t): [string, Answer][] => (t.buttons ? [[normaliseReply(t.buttons[0]), "yes"], [normaliseReply(t.buttons[1]), "no"]] : [])),
);

/**
 * A button tap (its label) or a typed answer as yes, no or other. Typed:
 * the first word decides ("haan, aa raha hoon" is yes, "nahi" is no) unless
 * the message also says no ("haan par nahi aa paunga" is other: a person reads it).
 */
export function interpretReply(text: string, buttons: Map<string, Answer> = BUTTONS): Answer {
  const n = normaliseReply(text);
  if (!n) return "other";
  const tapped = buttons.get(n);
  if (tapped) return tapped;
  const words = n.split(" ");
  const sayNo = words.some((w) => NO_WORDS.has(w));
  if (NO_WORDS.has(words[0])) return "no";
  if (YES_WORDS.has(words[0]) && !sayNo) return "yes";
  return "other";
}

/** The crew member's next status after a reply to `kind`, or null to leave it (the reply is still logged). */
export function statusAfterReply(kind: CrewKind, answer: Answer, current: string | null | undefined): CrewStatus | null {
  if (kind === "offer") {
    if (answer === "yes" && (current === "OFFERED" || current === "NO_REPLY")) return "SAID_YES";
    if (answer === "no" && (current === "OFFERED" || current === "NO_REPLY" || current === "SAID_YES")) return "SAID_NO";
  }
  if (kind === "reminder" && answer === "no" && current === "CONFIRMED") return "CANT_COME";
  return null;
}

// --- Twenty fields --------------------------------------------------------------------

/** The Twenty Communication's Delivery for a crew message (as the acknowledgement's). */
export function crewDeliveryStatus(status: string, delivery: string | null): string {
  if (status === "accepted") return delivery === "read" ? "READ" : delivery === "delivered" ? "DELIVERED" : delivery === "failed" ? "FAILED" : "SENT";
  return status === "failed" ? "FAILED" : status === "unknown" ? "UNKNOWN" : "QUEUED";
}

const KIND_LABEL: Record<CrewKind, string> = { offer: "interview invite", confirmed: "interview details", reminder: "interview reminder", not_needed: "interviews full" };
export const kindLabel = (kind: CrewKind) => KIND_LABEL[kind];

/** The crew member's field each message's send time goes in. */
export const SENT_FIELD: Partial<Record<CrewKind, string>> = { offer: "offerSentAt", confirmed: "confirmationSentAt", reminder: "reminderSentAt" };

/** The Message note after a message's outcome: null when it went (or is on its way), else what to do. */
export function noteAfterSend(kind: CrewKind, status: string, delivery: string | null): string | null {
  const what = kind === "offer" ? "interview invite" : kind === "confirmed" ? "interview details" : kind === "reminder" ? "reminder" : "interviews-full message";
  if (status === "failed" || delivery === "failed") return `The WhatsApp ${what} did not reach them: call them`;
  if (status === "unknown") return `The WhatsApp ${what} may not have gone: call them`;
  return null;
}
