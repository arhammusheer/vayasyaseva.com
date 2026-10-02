/**
 * Server-side pieces of the jobs intake (/api/jobs/start and /submit).
 * Secrets come from Vercel env (pnpm talent:sync-secrets); see
 * integrations/n8n/README.md for where each one lives.
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { AwsClient } from "aws4fetch";
import type { AttachmentKind, IntakeSource, JobHub, JobRole } from "./rules";
import { attachmentKeyPrefix } from "./rules";

const R2_ENDPOINT = "https://3f03827748ac33418f1176adaa436f26.r2.cloudflarestorage.com";
const R2_BUCKET = "vayasya-talent-intake";
const WEBHOOK_URL = "https://hooks.vayasyaseva.com/webhook/vspl-talent-intake";
/** Cloudflare's always-pass test secret, used only in local development. */
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

/** Version of the privacy notice a person agrees to on the jobs page. */
export const TALENT_CONSENT_VERSION = "2026-09-26";

/** Upload links and tickets are short-lived. */
const UPLOAD_URL_SECONDS = 15 * 60;
const TICKET_SECONDS = 60 * 60;

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
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/mpeg": "mp3",
  "audio/aac": "aac",
  "audio/wav": "wav",
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
  source: IntakeSource;
  /** Missing on tickets issued before role pages existed. */
  role?: JobRole | null;
  /** Missing on tickets issued before hub pages sent it. */
  hub?: JobHub | null;
  files: TicketFile[];
  exp: number;
}

// Its own key, derived from the webhook secret so there is no fifth secret.
const ticketKey = () => createHmac("sha256", env("TALENT_INTAKE_WEBHOOK_SECRET")).update("jobs-ticket-v1").digest();
const sign = (body: string) => createHmac("sha256", ticketKey()).update(body).digest("base64url");

export function issueTicket(ticket: Omit<Ticket, "exp">): string {
  const body = Buffer.from(JSON.stringify({ ...ticket, exp: Math.floor(Date.now() / 1000) + TICKET_SECONDS })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readTicket(value: string): Ticket | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const ticket = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Ticket;
    return ticket.exp > Date.now() / 1000 ? ticket : null;
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

// --- Turnstile ----------------------------------------------------------------

export async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY ?? (process.env.NODE_ENV === "development" ? TURNSTILE_TEST_SECRET : undefined);
  if (!secret) throw new IntakeNotConfigured("TURNSTILE_SECRET_KEY is not set");
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean; action?: string };
  return data.success === true;
}

// --- n8n ----------------------------------------------------------------------

/** Forwards a validated submission; n8n answers 202 once it is saved. */
export async function forwardToIntake(payload: unknown): Promise<void> {
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-vspl-intake-secret": env("TALENT_INTAKE_WEBHOOK_SECRET") },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status !== 202) throw new Error(`intake webhook answered ${res.status}`);
}
