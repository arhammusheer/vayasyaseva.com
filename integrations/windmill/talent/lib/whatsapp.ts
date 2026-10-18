/**
 * The WhatsApp apply chat (19 Oct 2026): a short numbered conversation on the
 * apply number that ends in the same application the quick form makes
 * (job_application.v1, source and channel "whatsapp"). Fast2SMS session
 * replies are text only (no buttons), so every question is a numbered list.
 *
 *   language (when the first message names none) → consent (18+ and the
 *   jobs form's consent line) → work → area → name (optional) → done
 *
 * A prefilled message from the site carries [VS|<locale>|<work>|<area>]
 * (src/content/pages/whatsapp-apply.ts); the chat skips what it already knows.
 * Pure: run-whatsapp.ts loads and saves the chat, files the application and
 * sends the replies. The words come from the site (whatsapp-copy.json).
 */
import type { JobApplicationCanonical } from "../../../../packages/contracts/src/job-application.v1.ts";
import {
  INTAKE_LIMITS,
  INTAKE_LOCALES,
  JOB_ROLES,
  MAX_APPLICANT_NAME_LENGTH,
  QUICK_ANSWERS,
  WHATSAPP_SOURCE,
  cleanQuickAnswers,
  normaliseIndianMobile,
  submissionCluster,
  type IntakeLocale,
  type JobRole,
  type QuickAnswers,
} from "../../../../packages/contracts/src/rules.ts";
import COPY from "./whatsapp-copy.json" with { type: "json" };

export type ChatStep = "language" | "consent" | "work" | "area" | "name" | "done";

export interface Chat {
  phone: string;
  locale: IntakeLocale | null;
  step: ChatStep;
  answers: QuickAnswers;
  name: string | null;
  /** What the person wrote or sent besides the answers, for the team. */
  notes: string | null;
  consentedAt: string | null;
  ref: string | null;
  /** Incremented on every save; the save checks it (whatsapp_chats.version). */
  version: number;
  updatedAt: string;
}

export interface Inbound {
  messageId: string;
  /** +91XXXXXXXXXX */
  phone: string;
  /** Fast2SMS's message_type: text, audio, image, document, video, sticker, reaction… */
  type: string;
  body: string;
}

export interface Turn {
  /** The chat to save; null deletes it (declined, stopped). */
  chat: Chat | null;
  replies: string[];
  /** Set once, when the last question is answered. */
  application: JobApplicationCanonical | null;
}

type LocaleCopy = (typeof COPY.locales)["en-IN"];
const copyFor = (locale: IntakeLocale | null): LocaleCopy => COPY.locales[(locale ?? "en-IN") as keyof typeof COPY.locales];

/** An unfinished chat older than this starts over (WhatsApp's own reply window is 24 hours). */
export const CHAT_IDLE_MS = 24 * 60 * 60 * 1000;
const MAX_NOTES = INTAKE_LIMITS.maxTextLength;

// --- Reading what people send ---------------------------------------------------

const INDIC_DIGITS: [number, number][] = [
  [0x0966, 0x096f], // Devanagari
  [0x0a66, 0x0a6f], // Gurmukhi
  [0x0ce6, 0x0cef], // Kannada
];

/** Lower case, trimmed, with Devanagari, Gurmukhi and Kannada digits as 0-9. */
export function normalise(text: string): string {
  let out = "";
  for (const ch of text.normalize("NFC")) {
    const code = ch.codePointAt(0)!;
    const range = INDIC_DIGITS.find(([from, to]) => code >= from && code <= to);
    out += range ? String(code - range[0]) : ch;
  }
  return out.trim().toLowerCase();
}

const words = (list: string[]) => new Set(list);
const YES = words(["1", "yes", "y", "ok", "okay", "haan", "han", "ha", "haa", "ji", "ji haan", "हाँ", "हां", "हा", "जी", "जी हाँ", "ਹਾਂ", "ਜੀ", "ಹೌದು", "ಸರಿ"]);
const NO = words(["2", "no", "n", "nahi", "nahin", "na", "नहीं", "नही", "ना", "ਨਹੀਂ", "ਨਾਂਹ", "ಇಲ್ಲ"]);
const STOP = words(["stop", "band", "band karo", "बंद", "बंद करो", "ਬੰਦ", "ನಿಲ್ಲಿಸಿ", "unsubscribe"]);
const RESTART = words(["new", "naya", "नया", "ਨਵਾਂ", "ಹೊಸ", "restart", "start"]);

const bare = (text: string) => normalise(text).replace(/[.!?।,]+$/u, "").trim();

/** The numbers in a reply, when it holds nothing else ("1 3", "1,3", "1 aur 3" is not). */
function numbersIn(text: string): number[] | null {
  const t = normalise(text);
  if (!/^[\d\s,.&+-]+$/.test(t)) return null;
  const found = t.match(/\d+/g);
  return found ? found.map(Number) : null;
}

/** The language a first message is written in, from its script; null for Latin script. */
export function scriptLocale(text: string): IntakeLocale | null {
  if (/[਀-੿]/u.test(text)) return "pa-IN";
  if (/[ಀ-೿]/u.test(text)) return "kn-IN";
  if (/[ऀ-ॿ]/u.test(text)) return "hi-IN";
  return null;
}

const isLocale = (v: string): v is IntakeLocale => (INTAKE_LOCALES as readonly string[]).includes(v);
const has = <T extends object>(o: T, k: string): k is Extract<keyof T, string> => Object.hasOwn(o, k);

/** What a site link's [VS|…] code says: the language, the work (or ITI trade) and the area. */
export function readPrefill(text: string): { locale: IntakeLocale | null; answers: QuickAnswers } {
  const match = text.match(new RegExp(`\\[${COPY.prefillTag}\\|([^\\]]*)\\]`, "i"));
  const answers: QuickAnswers = {};
  let locale: IntakeLocale | null = null;
  for (const token of match?.[1]?.split("|").map((t) => t.trim()) ?? []) {
    if (isLocale(token)) locale = token;
    else if (has(QUICK_ANSWERS.work, token)) answers.work = [token];
    else if (has(QUICK_ANSWERS.trade, token)) Object.assign(answers, { work: ["iti-trades"], trade: [token] });
    else if (has(QUICK_ANSWERS.area, token)) answers.area = [token];
  }
  return { locale, answers };
}

/** The text with the [VS|…] code taken out, for the notes. */
const withoutPrefill = (text: string) => text.replace(new RegExp(`\\s*\\[${COPY.prefillTag}\\|[^\\]]*\\]`, "gi"), "").trim();

const MEDIA_LABEL: Record<string, string> = { audio: "voice note", voice: "voice note", image: "photo", document: "document", video: "video" };

// --- Writing the replies ---------------------------------------------------------

const list = (options: { label: string }[]) => options.map((o, i) => `${i + 1}. ${o.label}`).join("\n");

function languageMenu() {
  return `${COPY.languagePrompt}\n\n${list(COPY.languages)}`;
}

function consentMessage(c: LocaleCopy) {
  return `${c.welcome}\n\n${c.consent.agree} ${c.consent.keep}\n${c.consent.privacy}: ${c.consent.privacyUrl}\n\n${c.consent.reply}`;
}

function question(step: ChatStep, c: LocaleCopy): string {
  if (step === "work") return `${c.work.question}\n\n${list(c.work.options)}\n\n${c.pick.many}`;
  if (step === "area") return `${c.area.question}\n\n${list(c.area.options)}\n\n${c.pick.one}`;
  if (step === "name") return `${c.name.question} ${c.name.skip}`;
  if (step === "consent") return consentMessage(c);
  return languageMenu();
}

function doneMessage(c: LocaleCopy, ref: string) {
  return `${c.done.title}\n${c.done.refLabel}: ${ref}\n\n${c.done.body}\n\n${c.done.calls}\n${c.done.noFee}`;
}

// --- The conversation ---------------------------------------------------------------

/** The first question still open once consent is given. */
function nextAfterConsent(chat: Chat): ChatStep {
  if (!chat.answers.work?.length) return "work";
  if (!chat.answers.area?.length) return "area";
  return "name";
}

function addNote(chat: Chat, note: string): Chat {
  const trimmed = note.trim();
  if (!trimmed) return chat;
  const notes = chat.notes ? `${chat.notes}\n${trimmed}` : trimmed;
  return { ...chat, notes: notes.slice(0, MAX_NOTES) };
}

function freshChat(phone: string, now: Date, locale: IntakeLocale | null, answers: QuickAnswers, version: number): Chat {
  return { phone, locale, step: locale ? "consent" : "language", answers, name: null, notes: null, consentedAt: null, ref: null, version, updatedAt: now.toISOString() };
}

/** The role the application is tagged with: the ITI trade, else the first work that is a role. */
function roleOf(answers: QuickAnswers): JobRole | null {
  const trade = answers.trade?.find((t) => has(JOB_ROLES, t));
  if (trade) return trade as JobRole;
  const work = answers.work?.find((w) => w !== "any" && has(JOB_ROLES, w));
  return (work as JobRole | undefined) ?? null;
}

export function applicationOf(chat: Chat): JobApplicationCanonical {
  const answers = cleanQuickAnswers(chat.answers);
  return {
    ref: chat.ref!,
    source: WHATSAPP_SOURCE,
    locale: chat.locale ?? "en-IN",
    cluster: submissionCluster(null, answers),
    pageCluster: null,
    pagePath: null,
    role: roleOf(chat.answers),
    hub: null,
    channel: "whatsapp",
    agentName: null,
    phone: chat.phone,
    adult: true,
    consent: { version: COPY.consentVersion, at: chat.consentedAt! },
    text: chat.notes,
    attachments: [],
    form: null,
    applicantName: chat.name,
    answers,
  } as JobApplicationCanonical;
}

/**
 * One message in, the chat's next state and the replies out. `newRef` makes
 * the reference when the application is complete.
 */
export function advance(saved: Chat | null, msg: Inbound, now: Date, newRef: () => string): Turn {
  const text = msg.body ?? "";
  const word = bare(text);
  const media = MEDIA_LABEL[msg.type];
  // Reactions and stickers are not answers; nothing to say back.
  if (!media && msg.type !== "text") return { chat: saved, replies: [], application: null };

  if (STOP.has(word)) return { chat: null, replies: [copyFor(saved?.locale ?? scriptLocale(text)).stopped], application: null };

  const stale = saved && saved.step !== "done" && now.getTime() - new Date(saved.updatedAt).getTime() > CHAT_IDLE_MS;
  const version = saved?.version ?? 0;

  // A new chat: from the link's code, else the script the message is written in.
  if (!saved || stale) {
    const prefill = readPrefill(text);
    const locale = prefill.locale ?? scriptLocale(text) ?? (stale ? saved!.locale : null);
    let chat = freshChat(msg.phone, now, locale, prefill.answers, version);
    const note = withoutPrefill(text);
    if (media) chat = addNote(chat, `Sent a ${media} on WhatsApp (see the chat in the Business app).`);
    else if (!prefill.locale && note.length >= 25) chat = addNote(chat, note);
    return { chat, replies: [question(chat.step, copyFor(chat.locale))], application: null };
  }

  let chat: Chat = { ...saved, updatedAt: now.toISOString() };
  const c = copyFor(chat.locale);

  if (chat.step === "done") {
    if (RESTART.has(word)) {
      const fresh = freshChat(msg.phone, now, chat.locale, {}, version);
      return { chat: fresh, replies: [`${c.restart}\n\n${question(fresh.step, c)}`], application: null };
    }
    return { chat, replies: [c.already.replace("{ref}", chat.ref ?? "")], application: null };
  }

  if (RESTART.has(word)) {
    const fresh = freshChat(msg.phone, now, chat.locale, {}, version);
    return { chat: fresh, replies: [`${copyFor(fresh.locale).restart}\n\n${question(fresh.step, copyFor(fresh.locale))}`], application: null };
  }

  // A voice note, photo or file: kept as a note for the team, then the same question.
  if (media) {
    chat = addNote(chat, `Sent a ${media} on WhatsApp (see the chat in the Business app).`);
    return { chat, replies: [`${c.media}\n\n${question(chat.step, c)}`], application: null };
  }

  const numbers = numbersIn(text);
  const again = (prefix: string): Turn => ({ chat, replies: [`${prefix}\n\n${question(chat.step, copyFor(chat.locale))}`], application: null });
  /** Words that are not an answer: kept when they say something, then the question again. */
  const notAnAnswer = (): Turn => {
    if (word.length >= 15 && /\p{L}/u.test(word)) {
      chat = addNote(chat, text);
      return again(c.media);
    }
    return again(c.invalid);
  };

  switch (chat.step) {
    case "language": {
      const pick = numbers?.length === 1 ? COPY.languages[numbers[0] - 1] : undefined;
      const locale = (pick?.locale as IntakeLocale | undefined) ?? scriptLocale(text);
      if (!locale) return again(c.invalid);
      chat = { ...chat, locale, step: "consent" };
      return { chat, replies: [question("consent", copyFor(locale))], application: null };
    }
    case "consent": {
      if (NO.has(word)) return { chat: null, replies: [c.declined], application: null };
      if (!YES.has(word)) return notAnAnswer();
      chat = { ...chat, consentedAt: now.toISOString() };
      chat = { ...chat, step: nextAfterConsent(chat) };
      return { chat, replies: [question(chat.step, c)], application: null };
    }
    case "work": {
      const options = c.work.options;
      if (!numbers?.length || numbers.some((n) => n < 1 || n > options.length)) return notAnAnswer();
      const work = [...new Set(numbers.map((n) => options[n - 1].id))];
      chat = { ...chat, answers: { ...chat.answers, work }, step: chat.answers.area?.length ? "name" : "area" };
      return { chat, replies: [question(chat.step, c)], application: null };
    }
    case "area": {
      const options = c.area.options;
      if (numbers?.length !== 1 || numbers[0] < 1 || numbers[0] > options.length) return notAnAnswer();
      chat = { ...chat, answers: { ...chat.answers, area: [options[numbers[0] - 1].id] }, step: "name" };
      return { chat, replies: [question("name", c)], application: null };
    }
    case "name": {
      const skip = numbers?.length === 1 && numbers[0] === 0;
      const name = text.replace(/\s+/g, " ").trim();
      if (!skip && !(name.length >= 2 && name.length <= MAX_APPLICANT_NAME_LENGTH && /\p{L}/u.test(name) && !/\d/.test(name))) return again(c.invalid);
      chat = { ...chat, name: skip ? null : name, ref: newRef(), step: "done" };
      return { chat, replies: [doneMessage(c, chat.ref!)], application: applicationOf(chat) };
    }
  }
}

/** Fast2SMS's inbound webhook body (the template fast2sms-whatsapp-webhook.mts registers), checked. */
export function parseInbound(body: unknown): Inbound | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
  if (str("webhook_type") && str("webhook_type") !== "incoming_message") return null;
  const messageId = str("message_id");
  const phone = normaliseIndianMobile(str("from"));
  if (!messageId || messageId.includes("{{") || messageId.length > 200 || !phone) return null;
  return { messageId, phone, type: str("message_type").toLowerCase() || "text", body: str("body").slice(0, 4000) };
}
