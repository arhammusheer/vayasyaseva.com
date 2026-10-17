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
  folder?: "talent" | "leads";
  summary: string;
  description: string;
  /** JSON Schema of main's arguments (Windmill shows and validates it). */
  schema: Record<string, unknown>;
  hasPreprocessor?: boolean;
  schedule?: { cron: string; summary: string };
  /** Served at /api/r/<path> (workspaced_route false), so Traefik maps hooks.vayasyaseva.com/<path> straight to it. */
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
];



/** Every folder the scripts live in. */
export const FOLDERS = [...new Set(SCRIPTS.map((s) => s.folder ?? FOLDER))];

export const scriptPath = (name: string, folder: string = FOLDER) => `f/${folder}/${name}`;
export const specPath = (spec: ScriptSpec) => scriptPath(spec.name, spec.folder ?? FOLDER);
