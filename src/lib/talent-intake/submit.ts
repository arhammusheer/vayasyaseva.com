/**
 * The shared tail of a jobs submission: /api/jobs/submit (the form) and the
 * open agent routes under /api/agent/jobs end here. Validates the payload
 * against the contract and forwards it to the Windmill intake route.
 */
import { NextResponse } from "next/server";
import { talentIntakeSchema, type JobsSubmitResponse } from "./contract";
import { reportServerCount } from "@/lib/measurement/server";
import { areaSet } from "@/markets/index";
import { transport } from "@/server/submissions/transport";
import {
  LEGACY_SOURCE_LOCALES,
  WEB_SOURCE,
  submissionCluster,
  type IntakeChannel,
  type IntakeForm,
  type IntakeLocale,
  type IntakeSource,
  type QuickAnswers,
} from "./rules";
import {
  IntakeNotConfigured,
  TALENT_CONSENT_VERSION,
  deleteUpload,
  readTicket,
  uploadedSize,
  type Ticket,
} from "./server";

type Draft = Omit<Ticket, "exp" | "files"> & { files: Ticket["files"] };
/** What the quick form adds: which form, the typed name and the answers. */
export type FormExtras = { form?: IntakeForm; applicantName?: string | null; answers?: QuickAnswers | null };

/** The legacy page source for each locale: what n8n accepted before "web". */
const LOCALE_LEGACY_SOURCES = Object.fromEntries(
  Object.entries(LEGACY_SOURCE_LOCALES).map(([source, locale]) => [locale, source]),
) as Partial<Record<IntakeLocale, IntakeSource>>;

/**
 * Whether web submissions go to n8n as source "web" (PLAN §1a). Off until
 * the owner has deployed the n8n intake and setup workflows that accept it
 * (schema.sql widens the source and locale checks): the n8n running before
 * that rejects "web", so every application would fail. While it is off, web
 * submissions keep their legacy source (web_en, web_hi, web_hinglish); the
 * locale, cluster and page fields still go along, and the older n8n ignores
 * them. A plain server env var, so it works the same on Vercel and self-hosted.
 */
export function webSourceEnabled() {
  return process.env.TALENT_INTAKE_WEB_SOURCE === "1";
}

/** Builds, validates and forwards one submission; answers 202 with the reference. */
export async function forwardSubmission(
  draft: Draft,
  phone: string,
  text: string | null,
  extras: FormExtras = {},
  meta: { idempotencyKey: string | null } = { idempotencyKey: null },
) {
  const channel = draft.channel ?? "web";
  // The jobs pages send "web" plus the page locale; a ticket issued before
  // that carries a legacy page source, which implies the locale. The agent
  // routes keep their legacy source and gain the locale it implies.
  const locale = draft.locale ?? (draft.source === WEB_SOURCE ? null : LEGACY_SOURCE_LOCALES[draft.source]);
  const pageCluster = draft.pageCluster ?? null;
  const payload = talentIntakeSchema.safeParse({
    ref: draft.ref,
    // A locale with no legacy source (pa-IN, added after "web") always sends "web".
    source: channel !== "web" ? draft.source : webSourceEnabled() || !locale ? WEB_SOURCE : (LOCALE_LEGACY_SOURCES[locale] ?? WEB_SOURCE),
    locale,
    cluster: submissionCluster(pageCluster, extras.answers),
    pageCluster,
    pagePath: draft.pagePath ?? null,
    role: draft.role ?? null,
    hub: draft.hub ?? null,
    channel,
    agentName: draft.agentName ?? null,
    phone,
    adult: true,
    consent: { version: TALENT_CONSENT_VERSION, at: new Date().toISOString() },
    text: text || null,
    attachments: draft.files.map(({ kind, key, mime, size, name }) => ({ kind, key, mime, size, name })),
    form: channel === "web" ? (extras.form ?? "long") : null,
    applicantName: extras.applicantName?.trim() || null,
    answers: extras.answers ?? null,
  });
  if (!payload.success) {
    return NextResponse.json({ error: "invalid_request", fields: payload.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }

  await transport().application(payload.data, meta);
  reportServerCount("application_received", channel === "agent" ? "/api/agent/jobs" : "/api/jobs/submit", {
    channel,
    form: payload.data.form ?? "agent",
    role: payload.data.role ?? "none",
    hub: payload.data.hub ?? "none",
    source: payload.data.source,
    locale: payload.data.locale ?? "none",
    cluster: payload.data.cluster ?? "none",
    // The page's own market and the area answer's set (its id prefix, or
    // "haridwar" for Haridwar's unprefixed ids), to see how filing happened.
    page_cluster: payload.data.pageCluster ?? "none",
    area: areaSet(payload.data.answers?.area?.[0]),
    files: payload.data.attachments.length,
  });
  const body: JobsSubmitResponse = { ref: draft.ref };
  return NextResponse.json(body, { status: 202, headers: { "cache-control": "no-store" } });
}

/**
 * Checks the ticket from the matching start route, confirms each upload exists and
 * matches what was declared, then forwards. The attachment list comes from
 * the ticket, never from the caller.
 */
export async function submitWithTicket(
  rawTicket: string,
  phone: string,
  text: string | null,
  channel: IntakeChannel,
  extras: FormExtras = {},
  meta: { idempotencyKey: string | null } = { idempotencyKey: null },
) {
  const ticket = readTicket(rawTicket);
  if (!ticket) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }
  // A ticket only works on the submit route that matches its start route:
  // an agent ticket on /api/jobs/submit would skip the agent rate limits, and
  // a form ticket on the agent route would be filed as a form submission.
  if ((ticket.channel ?? "web") !== channel) {
    return NextResponse.json({ error: "invalid_request", fields: ["ticket"] }, { status: 400 });
  }

  for (const file of ticket.files) {
    const size = await uploadedSize(file.key);
    if (size === null) return NextResponse.json({ error: "upload_missing", key: file.key }, { status: 409 });
    if (size > file.size) {
      await deleteUpload(file.key);
      return NextResponse.json({ error: "upload_too_large", key: file.key }, { status: 413 });
    }
  }

  return forwardSubmission(ticket, phone, text, extras, meta);
}

/** The 5xx answer for a failure on our side, logged under `route`. */
export function unavailable(route: string, error: unknown) {
  if (error instanceof IntakeNotConfigured) {
    console.error(`${route} not configured:`, error.message);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  console.error(`${route} failed:`, error);
  return NextResponse.json({ error: "unavailable" }, { status: 502 });
}
