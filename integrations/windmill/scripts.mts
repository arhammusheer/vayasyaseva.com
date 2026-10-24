/**
 * The Windmill scripts of the `vspl` workspace: what build.mts generates
 * into f/ and what deploy.mts creates around them (schedule, HTTP route).
 * One entry per script; the entry file is talent/scripts/<name>.ts.
 */

export const WORKSPACE = { id: "vspl", name: "Vayasya Seva" } as const;
export const FOLDER = "talent";

/** Windmill's cron has six fields (seconds first). Timezone for every schedule. */
export const TIMEZONE = "Asia/Kolkata";

export interface ScriptSpec {
  /** File name in <folder>/scripts and f/<folder>; the Windmill path is f/<folder>/<name>. */
  name: string;
  /** Windmill folder (and source directory). Default talent. */
  folder?: "talent" | "leads" | "platform" | "notify";
  summary: string;
  description: string;
  /** JSON Schema of main's arguments (Windmill shows and validates it). */
  schema: Record<string, unknown>;
  hasPreprocessor?: boolean;
  schedule?: { cron: string; summary: string };
  /**
   * Served at /api/r/<path> (workspaced_route false). Traefik maps
   * hooks.vayasyaseva.com/api/r/webhook/* to them; any other path (internal/…)
   * is reachable in the cluster only.
   * `secretHeader` is what the deploy warm-up sends a wrong value in (expecting 403); `rawBody` passes the
   * body unparsed as `raw_string` (the signed routes check the HMAC over it).
   */
  route?: { path: string; method: "post"; secretHeader: string; rawBody?: boolean };
  /** Had a schedule before the dispatcher (roadmap 1F): deploy turns that schedule off; the script stays runnable by hand. */
  retiredSchedule?: true;
  /** A schedule that raises notifications: turned on with --enable-notify, like the notify folder's own. */
  notifySchedule?: true;
}

const noArgs = { $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", properties: {}, required: [] };

export const SCRIPTS: ScriptSpec[] = [
  {
    name: "setup",
    summary: "Talent · setup",
    description: "Applies the talent database schema (talent/schema.sql). Safe to re-run; deploy runs it first.",
    schema: noArgs,
  },
  {
    name: "intake",
    summary: "Talent · intake",
    description:
      "The website's job applications (POST /webhook/vspl-talent-intake): checks x-vspl-intake-secret, validates, saves, answers 202 and starts the SMS acknowledgement.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        authorized: { type: "boolean", description: "Set by the preprocessor: the secret header matched." },
        body: { type: "object", description: "The application, as the website's Zod contract defines it." },
      },
      required: ["authorized", "body"],
    },
    hasPreprocessor: true,
    route: { path: "webhook/vspl-talent-intake", method: "post", secretHeader: "x-vspl-intake-secret" },
  },
  {
    name: "acknowledge",
    summary: "Talent · acknowledge",
    description:
      "The Fast2SMS application acknowledgement: for one submission when intake starts it, else the oldest due one, after flagging interrupted sends as unknown.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: { submission_id: { type: "string", description: "Only this submission (from intake). Empty: the oldest due one." } },
      required: [],
    },
    retiredSchedule: true,
  },
  {
    name: "retention",
    summary: "Talent · retention",
    description: "The 12-month rule and erasure requests: queues expired people, then erases one per run (R2, Twenty CRM, rows).",
    schema: noArgs,
    schedule: { cron: "0 0 * * * *", summary: "Hourly: retention and erasure" },
  },
  {
    name: "sync_crm",
    summary: "Talent · sync to Twenty CRM",
    description:
      "Writes new applications into Twenty (crm.vayasyaseva.com): the person by phone, the application and the SMS acknowledgement; updates acknowledgements whose status changed. Tracks what it wrote in crm_sync.",
    schema: noArgs,
    retiredSchedule: true,
  },
  {
    name: "delivery_report",
    summary: "Talent · SMS delivery report",
    description:
      "Fast2SMS's delivery reports (POST /webhook/fast2sms-dlr): checks x-vspl-dlr-secret and marks the acknowledgement delivered or failed; sync_crm carries it to Twenty.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        authorized: { type: "boolean", description: "Set by the preprocessor: the secret header matched." },
        body: { type: "object", description: "The report's request id, status and times (no phone number)." },
      },
      required: ["authorized", "body"],
    },
    hasPreprocessor: true,
    route: { path: "webhook/fast2sms-dlr", method: "post", secretHeader: "x-vspl-dlr-secret" },
  },
  {
    name: "delivery_check",
    summary: "Talent · SMS delivery check",
    description:
      "Looks up, with Fast2SMS's DLR API, accepted acknowledgements whose delivery report has not come after ten minutes (each at most hourly, for the 7 days Fast2SMS keeps them).",
    schema: noArgs,
    retiredSchedule: true,
  },
  {
    name: "dispatch",
    summary: "Talent · dispatch",
    description:
      "The one worker for every application's deliveries (SMS acknowledgement, Twenty CRM, files into Twenty), on one connection, with backoff and attempt caps; every 15 minutes also looks up missing SMS delivery reports. Started by intake for a new application's SMS.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: { submission_id: { type: "string", description: "Only this application's SMS (from intake). Empty: everything due." } },
      required: [],
    },
    schedule: { cron: "0 * * * * *", summary: "Every minute: SMS and Twenty deliveries" },
  },
  {
    name: "setup",
    folder: "leads",
    summary: "Leads · setup",
    description: "Applies the lead inbox schema (leads/schema.sql) to the leads database. Safe to re-run; deploy runs it first.",
    schema: noArgs,
  },
  {
    name: "intake",
    folder: "leads",
    summary: "Leads · intake",
    description:
      "The website's business enquiries (POST /webhook/vspl-lead, from /api/contact and /api/agent/contact): checks x-vspl-lead-secret, validates (business_enquiry.v1), saves the lead in the inbox and answers 202; f/leads/sync_crm files it in Twenty.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        authorized: { type: "boolean", description: "Set by the preprocessor: the secret header matched." },
        body: { type: "object", description: "The lead, as src/lib/lead-forward.ts builds it." },
      },
      required: ["authorized", "body"],
    },
    hasPreprocessor: true,
    route: { path: "webhook/vspl-lead", method: "post", secretHeader: "x-vspl-lead-secret" },
  },
  {
    name: "sync_crm",
    folder: "leads",
    summary: "Leads · sync to Twenty CRM",
    description:
      "Files the inbox's due leads in Twenty (company, contact, crew request, enquiry; each found before it is created), with backoff and an attempt cap. Started by intake for a new lead.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: { lead_id: { type: "string", description: "Only this lead (from intake). Empty: everything due." } },
      required: [],
    },
    schedule: { cron: "15 * * * * *", summary: "Every minute: leads into Twenty CRM" },
  },
  {
    name: "erase",
    folder: "leads",
    summary: "Leads · erasure",
    description:
      "Erasure requests for business enquiries (by case ID or phone, queued by hand): removes the crew requests, enquiries, files, notes and tasks from Twenty, the contact and company when nothing else uses them, then the inbox rows; keeps only counts. One request per run.",
    schema: noArgs,
    schedule: { cron: "0 30 * * * *", summary: "Hourly: enquiry erasure requests" },
  },
  {
    name: "submission",
    folder: "platform",
    summary: "Platform · submission",
    description:
      "One signed route for every submission (POST /webhook/vspl-submission, envelope.v1): checks the HMAC over timestamp and raw body (five minutes of skew), saves a job application (talent) or a lead (inbox), answers 202.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        authorized: { type: "boolean", description: "Set by the preprocessor: the signature matched." },
        body: { type: "object", description: "The envelope (packages/contracts envelope.v1)." },
      },
      required: ["authorized", "body"],
    },
    hasPreprocessor: true,
    route: { path: "webhook/vspl-submission", method: "post", secretHeader: "x-vspl-signature", rawBody: true },
  },
  {
    name: "idempotency",
    folder: "platform",
    summary: "Platform · Idempotency-Key store",
    description:
      "The site's durable Idempotency-Key store (POST /webhook/vspl-idempotency, signed): begin, complete and abandon a key; jobs keys in the talent database, contact keys in the lead inbox.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        authorized: { type: "boolean", description: "Set by the preprocessor: the signature matched." },
        body: { type: "object", description: "{ op, scope, key, fingerprint | answer | carry }" },
      },
      required: ["authorized", "body"],
    },
    hasPreprocessor: true,
    route: { path: "webhook/vspl-idempotency", method: "post", secretHeader: "x-vspl-signature", rawBody: true },
  },
  {
    name: "health",
    folder: "platform",
    summary: "Platform · health",
    description:
      "Counts of dead, unknown (SMS), stuck and overdue deliveries in the talent database and the lead inbox, and failed erasures. Every 15 minutes; each condition goes to the notification hub (platform.*) when it starts and when it clears.",
    schema: noArgs,
    schedule: { cron: "0 */15 * * * *", summary: "Every 15 minutes: dead and stuck work into the notification hub" },
    notifySchedule: true,
  },
  {
    name: "setup",
    folder: "notify",
    summary: "Notify · setup",
    description: "Applies the notify database schema (notify/schema.sql): events, keys, the delivery outbox. Safe to re-run; deploy runs it.",
    schema: noArgs,
  },
  {
    name: "dispatch",
    folder: "notify",
    summary: "Notify · dispatch",
    description:
      "Routes new events by f/notify/policy (dedupe, firing/resolved, hourly collapsing, daily reminders) and sends the outbox: ntfy pushes and Resend emails, four tries each, critical pushes falling back to email. Clears personal data once sent.",
    schema: noArgs,
    schedule: { cron: "0 * * * * *", summary: "Every minute: route and send notifications" },
  },
  {
    name: "digest",
    folder: "notify",
    summary: "Notify · daily digest",
    description: "08:00 IST: one email with the day's digest events, grouped by source and type; deletes events older than 90 days.",
    schema: noArgs,
    schedule: { cron: "0 0 8 * * *", summary: "08:00 IST: the daily notification digest" },
  },
  {
    name: "ingest",
    folder: "notify",
    summary: "Notify · ingest",
    description:
      "Events from outside Windmill (POST /webhook/vspl-notify: CronJobs, GitHub Actions, the website): checks x-vspl-notify-secret, drops any pii, validates (schema v1) and queues them, answers 202.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        authorized: { type: "boolean", description: "Set by the preprocessor: the secret header matched." },
        events: { type: "array", description: "The events, without pii (the preprocessor drops it)." },
        pii_dropped: { type: "integer", description: "How many events carried pii that was dropped." },
      },
      required: ["authorized", "events"],
    },
    hasPreprocessor: true,
    route: { path: "webhook/vspl-notify", method: "post", secretHeader: "x-vspl-notify-secret" },
  },
  {
    name: "alertmanager",
    folder: "notify",
    summary: "Notify · Alertmanager",
    description:
      "Alertmanager's webhook (v4), in the cluster only (POST /api/r/internal/vspl-alertmanager, Authorization: Bearer): one event per alert, dedupeKey am:<fingerprint>, firing and resolved.",
    schema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        authorized: { type: "boolean", description: "Set by the preprocessor: the bearer token matched." },
        body: { type: "object", description: "Alertmanager's webhook payload, version 4." },
      },
      required: ["authorized", "body"],
    },
    hasPreprocessor: true,
    route: { path: "internal/vspl-alertmanager", method: "post", secretHeader: "authorization" },
  },
];

/** Every folder the scripts live in. */
export const FOLDERS = [...new Set(SCRIPTS.map((s) => s.folder ?? FOLDER))];

export const scriptPath = (name: string, folder: string = FOLDER) => `f/${folder}/${name}`;
export const specPath = (spec: ScriptSpec) => scriptPath(spec.name, spec.folder ?? FOLDER);
