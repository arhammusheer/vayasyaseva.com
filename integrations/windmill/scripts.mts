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
  folder?: "talent" | "leads" | "notify";
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
   */
  route?: { path: string; method: "post"; secretHeader: string };
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
    schedule: { cron: "0 * * * * *", summary: "Every minute: due and interrupted acknowledgements" },
  },
  {
    name: "deliver",
    summary: "Talent · deliver",
    description: "One submission per run becomes a conversation in Chatwoot's \"Jobs, website\" inbox: the note, then every file.",
    schema: noArgs,
    schedule: { cron: "0 * * * * *", summary: "Every minute: deliver to Chatwoot" },
  },
  {
    name: "retention",
    summary: "Talent · retention",
    description: "The 12-month rule and erasure requests: queues expired people, then erases one per run (R2, Chatwoot, Twenty CRM, rows).",
    schema: noArgs,
    schedule: { cron: "0 0 * * * *", summary: "Hourly: retention and erasure" },
  },
  {
    name: "sync_crm",
    summary: "Talent · sync to Twenty CRM",
    description:
      "Writes new applications into Twenty (crm.vayasyaseva.com): the person by phone, the application and the SMS acknowledgement; updates acknowledgements whose status changed. Tracks what it wrote in crm_sync.",
    schema: noArgs,
    schedule: { cron: "30 * * * * *", summary: "Every minute: applications into Twenty CRM" },
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
    schedule: { cron: "0 */15 * * * *", summary: "Every 15 minutes: delivery reports that never came" },
  },
  {
    name: "intake",
    folder: "leads",
    summary: "Leads · intake",
    description:
      "The website's crew requests (POST /webhook/vspl-lead, from /api/contact and /api/agent/contact): checks x-vspl-lead-secret, writes the company, contact, crew request and enquiry into Twenty CRM, answers 202.",
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
