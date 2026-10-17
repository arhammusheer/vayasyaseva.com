/**
 * Server-side pieces of the jobs intake (/api/jobs/start and /submit).
 * Secrets come from Vercel env (pnpm talent:sync-secrets); see
 * integrations/windmill/README.md for where each one lives.
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { AwsClient } from "aws4fetch";
import type { AttachmentKind, IntakeChannel, IntakeCluster, IntakeLocale, JobHub, JobRole, SubmissionSource } from "./rules";
import { attachmentKeyPrefix } from "./rules";

const R2_ENDPOINT = "https://3f03827748ac33418f1176adaa436f26.r2.cloudflarestorage.com";
const R2_BUCKET = "vayasya-talent-intake";
/**
 * Windmill's intake route (integrations/windmill, f/talent/intake). Set
 * TALENT_INTAKE_WEBHOOK_URL to point elsewhere (the n8n route it replaced,
 * /webhook/vspl-talent-intake, is scaled to zero and due for removal).
 */
const WEBHOOK_URL = process.env.TALENT_INTAKE_WEBHOOK_URL?.trim() || "https://hooks.vayasyaseva.com/api/r/webhook/vspl-talent-intake";

/**
 * Version of the privacy notice and consent line a person agrees to on the
 * jobs pages, stored with each submission. Bump it whenever either changes.
 * Earlier versions stay valid for the records that carry them (n8n stores
 * the string as given): 2026-10-02, the first jobs notice; 2026-10-16, the
 * area, page and language fields, the worker list (the 12 months restart
 * only when the person speaks with us, replies or confirms; unanswered
 * outreach does not count), Fast2SMS, sharing with another employer only
 * with fresh agreement, no audio or Sarvam, and the phone-free withdrawal
 * route (PLAN §8.3); 2026-10-16-v7, the same day's consent v7: the checkbox
 * line "We keep your details for 12 months. Details →" and the plain
 * applicant notice at /jobs/privacy in each jobs language, with /privacy §10
 * still the governing text. Owner/counsel sign-off pending.
 */
export const TALENT_CONSENT_VERSION = "2026-10-16-v7";

/** Upload links and tickets are short-lived. */
const UPLOAD_URL_SECONDS = 15 * 60;
const TICKET_SECONDS = 60 * 60;
/** Instances' clocks differ a little. */
const CLOCK_SLACK_SECONDS = 5 * 60;

export class IntakeNotConfigured extends Error {}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new IntakeNotConfigured(`${name} is not set`);
  return value;
}

let r2: AwsClient | undefined;
function r2Client() {
  r2 ??= new AwsClient({
    accessKeyId: env("TALENT_R2_ACCESS_KEY_ID"),
    secretAccessKey: env("TALENT_R2_SECRET_ACCESS_KEY"),
    service: "s3",
    region: "auto",
  });
  return r2;
}

const objectUrl = (key: string) => `${R2_ENDPOINT}/${R2_BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;

// --- References -------------------------------------------------------------

const REF_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O, 1/I: read out on the phone

export function newRef() {
  let s = "";
  for (let i = 0; i < 6; i++) s += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `VS-J-${s}`;
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export function attachmentKey(ref: string, position: number, mime: string, at = new Date()) {
  const ext = EXTENSIONS[mime.split(";")[0]] ?? "bin";
  return `${attachmentKeyPrefix(ref, at)}${position}.${ext}`;
}

// --- Tickets: bind /submit to what /start issued ------------------------------

export interface TicketFile {
  key: string;
  kind: AttachmentKind;
  mime: string;
  size: number;
  name: string | null;
}

export interface Ticket {
  ref: string;
  /** "web" on tickets from pages that send their locale; a legacy page source otherwise. */
  source: SubmissionSource;
  /** The page's language. Missing on tickets with a legacy source, which implies it. */
  locale?: IntakeLocale | null;
  /** The cluster of the page the form sits on. Missing on older tickets. */
  pageCluster?: IntakeCluster | null;
  /** The neutral path of the page the form sits on. Missing on older tickets. */
  pagePath?: string | null;
  /** Missing on tickets issued before role pages existed. */
  role?: JobRole | null;
  /** Missing on tickets issued before hub pages sent it. */
  hub?: JobHub | null;
  /** "agent" on tickets from /api/agent/jobs/start; missing means the jobs form. */
  channel?: IntakeChannel;
  agentName?: string | null;
  files: TicketFile[];
  exp: number;
}

/**
 * Ticket keys. TICKET_SIGNING_KEY (Vercel env, the site's alone) signs new
 * tickets. Until the owner sets it, tickets are signed as before, with a key
 * derived from the webhook secret, so nothing changes on deploy. Once it is
 * set, tickets signed the old way are still accepted until they expire (an
 * hour at most), so applications that were open at the switch go through.
 */
const legacyTicketKey = () => {
  const secret = process.env.TALENT_INTAKE_WEBHOOK_SECRET;
  return secret ? createHmac("sha256", secret).update("jobs-ticket-v1").digest() : null;
};
const ticketSigningKey = () => {
  const key = process.env.TICKET_SIGNING_KEY?.trim();
  if (key) return Buffer.from(key, "utf8");
  const legacy = legacyTicketKey();
  if (!legacy) throw new IntakeNotConfigured("TICKET_SIGNING_KEY (or TALENT_INTAKE_WEBHOOK_SECRET) is not set");
  return legacy;
};
const signWith = (key: Buffer, body: string) => createHmac("sha256", key).update(body).digest("base64url");

function signatureMatches(key: Buffer, body: string, signature: string) {
  const expected = Buffer.from(signWith(key, body));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function issueTicket(ticket: Omit<Ticket, "exp">): string {
  const body = Buffer.from(JSON.stringify({ ...ticket, exp: Math.floor(Date.now() / 1000) + TICKET_SECONDS })).toString("base64url");
  return `${body}.${signWith(ticketSigningKey(), body)}`;
}

export function readTicket(value: string): Ticket | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  let signed = signatureMatches(ticketSigningKey(), body, signature);
  // The changeover: a ticket from before TICKET_SIGNING_KEY was set.
  const legacy = !signed && process.env.TICKET_SIGNING_KEY?.trim() ? legacyTicketKey() : null;
  if (legacy) signed = signatureMatches(legacy, body, signature);
  if (!signed) return null;
  try {
    const ticket = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Ticket;
    const now = Date.now() / 1000;
    // Never longer than a ticket's own hour, whichever key signed it.
    return ticket.exp > now && ticket.exp <= now + TICKET_SECONDS + CLOCK_SLACK_SECONDS ? ticket : null;
  } catch {
    return null;
  }
}

// --- R2 ---------------------------------------------------------------------

/** Presigned PUT; the Content-Type is signed, so the upload must declare it. */
export async function presignUpload(key: string, mime: string) {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(UPLOAD_URL_SECONDS));
  const signed = await r2Client().sign(new Request(url, { method: "PUT", headers: { "Content-Type": mime } }), {
    aws: { signQuery: true, allHeaders: true },
  });
  return { url: signed.url, headers: { "Content-Type": mime } };
}

/** Size of an uploaded object, or null if it isn't there. */
export async function uploadedSize(key: string): Promise<number | null> {
  const res = await r2Client().fetch(objectUrl(key), { method: "HEAD" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 HEAD ${key}: ${res.status}`);
  return Number(res.headers.get("content-length") ?? "0");
}

/** Removes an upload that failed its checks (e.g. larger than declared). */
export async function deleteUpload(key: string): Promise<void> {
  const res = await r2Client().fetch(objectUrl(key), { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw new Error(`R2 DELETE ${key}: ${res.status}`);
}

// --- intake (Windmill) ------------------------------------------------------------

/** Forwards a validated submission; the intake route answers 202 once it is saved. */
export async function forwardToIntake(payload: unknown): Promise<void> {
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-vspl-intake-secret": env("TALENT_INTAKE_WEBHOOK_SECRET") },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status !== 202) throw new Error(`intake webhook answered ${res.status}`);
}
