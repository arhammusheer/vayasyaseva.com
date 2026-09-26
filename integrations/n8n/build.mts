/**
 * Generates the talent workflows (integrations/n8n/workflows/*.json) for
 * import into n8n 2.x. Code-node sources in src/nodes are TypeScript: they
 * are compiled here and their helper imports inlined, each in its own scope.
 *
 *   pnpm n8n:build            write the workflow files
 *   pnpm n8n:build --check    fail if they are out of date (CI)
 *
 * Checks while building: every $("Node") a Code node reads exists in its
 * workflow, every connection targets a real node, and compiled code parses.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import ts from "typescript";

const here = dirname(new URL(import.meta.url).pathname);
const repoRoot = resolve(here, "../..");

// ---------------------------------------------------------------------------
// Workflow model

interface CredentialRef {
  id: string;
  name: string;
}

interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, CredentialRef>;
  webhookId?: string;
  executeOnce?: boolean;
  alwaysOutputData?: boolean;
  onError?: "continueRegularOutput";
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  notes?: string;
  notesInFlow?: boolean;
}

type Connections = Record<string, { main: { node: string; type: "main"; index: number }[][] }>;

interface Workflow {
  /** Stable, so re-importing a file updates the same workflow in n8n. */
  id: string;
  name: string;
  active: false;
  nodes: WorkflowNode[];
  connections: Connections;
  settings: { executionOrder: "v1"; saveDataErrorExecution: "all"; saveDataSuccessExecution: "none" };
  pinData: Record<string, never>;
}

/**
 * Credentials the workflows use, by the exact name n8n links them with on
 * import. Create each in n8n before importing (integrations/n8n/README.md).
 */
const CREDENTIALS = {
  postgres: "talent-pg",
  r2: "r2-talent-intake",
  webhook: "vspl-talent-intake-webhook",
  sarvam: "sarvam-vspl",
} as const;

const BUCKET = "vayasya-talent-intake";
const SARVAM = "https://api.sarvam.ai/speech-to-text/job/v1";

function stableId(...parts: string[]) {
  const h = createHash("sha1").update(parts.join("\u0000")).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** n8n workflow ids are 16 alphanumeric characters. */
function workflowId(name: string) {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  return [...createHash("sha256").update(`workflow\u0000${name}`).digest()]
    .slice(0, 16)
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");
}

function credential(type: string, name: string): Record<string, CredentialRef> {
  // n8n replaces an unknown id with the credential of the same name and type.
  return { [type]: { id: stableId("credential", name), name } };
}

class WorkflowBuilder {
  readonly nodes: WorkflowNode[] = [];
  readonly connections: Connections = {};
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }

  add(node: Omit<WorkflowNode, "id">): string {
    if (this.nodes.some((n) => n.name === node.name)) throw new Error(`${this.name}: duplicate node "${node.name}"`);
    this.nodes.push({ id: stableId(this.name, node.name), ...node });
    return node.name;
  }

  connect(from: string, to: string, { output = 0, input = 0 } = {}) {
    const outputs = (this.connections[from] ??= { main: [] }).main;
    while (outputs.length <= output) outputs.push([]);
    outputs[output].push({ node: to, type: "main", index: input });
  }

  chain(...names: string[]) {
    for (let i = 1; i < names.length; i++) this.connect(names[i - 1], names[i]);
  }

  build(): Workflow {
    const names = new Set(this.nodes.map((n) => n.name));
    for (const [from, { main }] of Object.entries(this.connections)) {
      if (!names.has(from)) throw new Error(`${this.name}: connection from unknown node "${from}"`);
      for (const target of main.flat()) {
        if (!names.has(target.node)) throw new Error(`${this.name}: "${from}" connects to unknown node "${target.node}"`);
      }
    }
    for (const node of this.nodes) {
      const code = node.parameters.jsCode;
      if (typeof code !== "string") continue;
      for (const [, ref] of code.matchAll(/\$\("([^"]+)"\)/g)) {
        if (!names.has(ref)) throw new Error(`${this.name}: "${node.name}" reads $("${ref}"), which is not in this workflow`);
      }
    }
    return {
      id: workflowId(this.name),
      name: this.name,
      active: false,
      nodes: this.nodes,
      connections: this.connections,
      settings: { executionOrder: "v1", saveDataErrorExecution: "all", saveDataSuccessExecution: "none" },
      pinData: {},
    };
  }
}

// ---------------------------------------------------------------------------
// Code nodes: compile TypeScript, inline relative imports

interface CompiledModule {
  code: string;
  exports: string[];
  deps: string[];
}

const moduleCache = new Map<string, CompiledModule>();

function compileModule(path: string): CompiledModule {
  const cached = moduleCache.get(path);
  if (cached) return cached;
  const output = ts.transpileModule(readFileSync(path, "utf8"), {
    fileName: path,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true },
  }).outputText;

  const deps: string[] = [];
  let code = output.replace(/^import\s+[^;]*?\s+from\s+"([^"]+)";?\s*$/gm, (_line, spec: string) => {
    if (!spec.startsWith(".")) throw new Error(`${relative(repoRoot, path)}: Code nodes cannot import "${spec}"`);
    deps.push(resolve(dirname(path), spec));
    return "";
  });
  if (/^\s*import\s/m.test(code)) throw new Error(`${relative(repoRoot, path)}: unsupported import form`);

  const exports: string[] = [];
  code = code.replace(/^export\s+(?!default)((?:async\s+)?function\*?|const|let|class)\s+(\w+)/gm, (_m, kind: string, name: string) => {
    exports.push(name);
    return `${kind} ${name}`;
  });
  const compiled = { code: code.trim(), exports, deps };
  moduleCache.set(path, compiled);
  return compiled;
}

/** Compiles one src/nodes file into the body of an n8n Code node. */
function codeNode(file: string): string {
  const entry = resolve(here, "src/nodes", file);
  const main = compileModule(entry);
  if (!/^export default async function main\(/m.test(main.code)) {
    throw new Error(`${file}: must export \`default async function main(...)\``);
  }

  const ordered: string[] = [];
  const visit = (path: string, stack: string[]) => {
    if (stack.includes(path)) throw new Error(`import cycle: ${[...stack, path].map((p) => relative(repoRoot, p)).join(" -> ")}`);
    for (const dep of compileModule(path).deps) visit(dep, [...stack, path]);
    if (path !== entry && !ordered.includes(path)) ordered.push(path);
  };
  visit(entry, []);

  const seen = new Map<string, string>();
  const helpers = ordered.map((path) => {
    const mod = compileModule(path);
    for (const name of mod.exports) {
      const other = seen.get(name);
      if (other) throw new Error(`${file}: "${name}" is exported by both ${other} and ${relative(repoRoot, path)}`);
      seen.set(name, relative(repoRoot, path));
    }
    const indented = mod.code.replace(/^/gm, "  ");
    return `// ${relative(repoRoot, path)}\nconst { ${mod.exports.join(", ")} } = (() => {\n${indented}\n  return { ${mod.exports.join(", ")} };\n})();`;
  });

  const body = [
    `// Generated from integrations/n8n/src/nodes/${file} by integrations/n8n/build.mts. Edit the source, not this.`,
    ...helpers,
    main.code.replace(/^export default async function main\(/m, "async function main("),
    "return main.call(this);",
  ].join("\n\n");

  // Syntax check: n8n runs the body inside an async function.
  new (Object.getPrototypeOf(async function () {}).constructor)("$", "$input", "$json", body);
  return body;
}

// ---------------------------------------------------------------------------
// Node factories (n8n-nodes-base 2.40)

type Position = [number, number];

const code = (name: string, file: string, position: Position, perItem = false): Omit<WorkflowNode, "id"> => ({
  name,
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position,
  parameters: { ...(perItem ? { mode: "runOnceForEachItem" } : {}), jsCode: codeNode(file) },
});

const sql = (
  name: string,
  query: string,
  position: Position,
  params?: string,
  extra: Partial<WorkflowNode> = {},
): Omit<WorkflowNode, "id"> => ({
  name,
  type: "n8n-nodes-base.postgres",
  typeVersion: 2.6,
  position,
  parameters: {
    operation: "executeQuery",
    query: query.trim(),
    options: params ? { queryReplacement: `={{ ${params} }}` } : {},
  },
  credentials: credential("postgres", CREDENTIALS.postgres),
  ...extra,
});

interface HttpOptions {
  method: "GET" | "POST" | "PUT";
  url: string;
  auth?: string;
  headers?: [string, string][];
  json?: string;
  binaryField?: string;
  multipart?: Record<string, unknown>[];
  responseJson?: boolean;
  timeout?: number;
  /** Return { statusCode, headers, body } and never throw on HTTP errors. */
  fullResponse?: boolean;
  continueOnError?: boolean;
  retry?: boolean;
}

function http(name: string, position: Position, o: HttpOptions): Omit<WorkflowNode, "id"> {
  const parameters: Record<string, unknown> = {
    method: o.method,
    url: o.url,
    authentication: o.auth ? "genericCredentialType" : "none",
    ...(o.auth ? { genericAuthType: "httpHeaderAuth" } : {}),
    sendHeaders: Boolean(o.headers?.length),
    ...(o.headers?.length ? { headerParameters: { parameters: o.headers.map(([n, value]) => ({ name: n, value })) } } : {}),
    sendBody: Boolean(o.json || o.binaryField || o.multipart),
    options: {
      ...(o.timeout ? { timeout: o.timeout } : {}),
      ...(o.responseJson || o.fullResponse
        ? {
            response: {
              response: {
                ...(o.responseJson ? { responseFormat: "json" } : {}),
                ...(o.fullResponse ? { fullResponse: true, neverError: true } : {}),
              },
            },
          }
        : {}),
    },
  };
  if (o.json) Object.assign(parameters, { specifyBody: "json", jsonBody: o.json });
  if (o.binaryField) Object.assign(parameters, { contentType: "binaryData", inputDataFieldName: o.binaryField });
  if (o.multipart) Object.assign(parameters, { contentType: "multipart-form-data", bodyParameters: { parameters: o.multipart } });
  return {
    name,
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position,
    parameters,
    ...(o.auth ? { credentials: credential("httpHeaderAuth", o.auth) } : {}),
    ...(o.continueOnError ? { onError: "continueRegularOutput" as const } : {}),
    ...(o.retry ? { retryOnFail: true, maxTries: 3, waitBetweenTries: 5000 } : {}),
  };
}

const download = (name: string, fileKey: string, position: Position): Omit<WorkflowNode, "id"> => ({
  name,
  type: "n8n-nodes-base.s3",
  typeVersion: 1,
  position,
  parameters: { resource: "file", operation: "download", bucketName: BUCKET, fileKey, binaryPropertyName: "file" },
  credentials: credential("s3", CREDENTIALS.r2),
});

const condition = (name: string, expression: string, position: Position): Omit<WorkflowNode, "id"> => ({
  name,
  type: "n8n-nodes-base.if",
  typeVersion: 2.2,
  position,
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: "", typeValidation: "loose", version: 2 },
      conditions: [
        {
          id: stableId(name, "condition"),
          leftValue: `={{ ${expression} }}`,
          rightValue: "",
          operator: { type: "boolean", operation: "true", singleValue: true },
        },
      ],
      combinator: "and",
    },
    options: {},
  },
});

const everyMinute = (name: string, position: Position): Omit<WorkflowNode, "id"> => ({
  name,
  type: "n8n-nodes-base.scheduleTrigger",
  typeVersion: 1.2,
  position,
  parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 1 }] } },
});

const grid = (col: number, row = 0): Position => [col * 240, row * 180];

// ---------------------------------------------------------------------------
// VSPL talent · setup

function setupWorkflow() {
  const w = new WorkflowBuilder("VSPL talent · setup");
  w.add({ name: "Run once", type: "n8n-nodes-base.manualTrigger", typeVersion: 1, position: grid(0), parameters: {} });
  w.add(sql("Apply schema", readFileSync(resolve(here, "schema.sql"), "utf8").replace(/^--.*\n/gm, ""), grid(1)));
  w.chain("Run once", "Apply schema");
  return w.build();
}

// ---------------------------------------------------------------------------
// VSPL talent · intake - the website's POST, saved and acknowledged

function intakeWorkflow() {
  const w = new WorkflowBuilder("VSPL talent · intake");
  w.add({
    name: "Webhook",
    type: "n8n-nodes-base.webhook",
    typeVersion: 2.1,
    position: grid(0),
    webhookId: stableId("webhook", "vspl-talent-intake"),
    parameters: { httpMethod: "POST", path: "vspl-talent-intake", authentication: "headerAuth", responseMode: "responseNode", options: {} },
    credentials: credential("httpHeaderAuth", CREDENTIALS.webhook),
  });
  w.add(code("Validate submission", "validate-submission.ts", grid(1)));
  w.add(
    sql(
      "Save submission",
      `
WITH s AS (
  INSERT INTO submissions (ref, source, locale, phone, consent_version, consented_at, adult, text, role)
  VALUES ($1, $2, $3, $4, $5, $6::timestamptz, true, $7, $9)
  ON CONFLICT (ref) DO NOTHING
  RETURNING id
), a AS (
  INSERT INTO attachments (submission_id, position, kind, r2_key, mime, size_bytes, original_name, transcript_status)
  SELECT s.id, (x->>'position')::int, x->>'kind', x->>'key', x->>'mime', (x->>'size')::int, x->>'name',
         CASE WHEN x->>'kind' = 'audio' THEN 'pending' ELSE 'none' END
  FROM s, jsonb_array_elements($8::jsonb) AS x
  RETURNING 1
)
SELECT (SELECT id FROM s) AS submission_id, (SELECT count(*) FROM a) AS attachments;`,
      grid(2),
      "[$json.ref, $json.source, $json.locale, $json.phone, $json.consentVersion, $json.consentedAt, $json.text, JSON.stringify($json.attachments), $json.role]",
    ),
  );
  w.add({
    name: "Respond 202",
    type: "n8n-nodes-base.respondToWebhook",
    typeVersion: 1.5,
    position: grid(3),
    parameters: {
      respondWith: "json",
      responseBody: `={{ JSON.stringify({ ok: true, ref: $('Validate submission').first().json.ref }) }}`,
      options: { responseCode: 202 },
    },
  });
  w.chain("Webhook", "Validate submission", "Save submission", "Respond 202");
  return w.build();
}

// ---------------------------------------------------------------------------
// VSPL talent · transcribe - voice notes through Sarvam saaras:v4.
// REST first (answers in about a second, audio up to 30 seconds); a longer
// note gets Sarvam's 400 and goes through the Batch API instead.
// Verified by hand against the API on 2026-09-26 (see README).

const SARVAM_MODEL = "saaras:v4";
// One local term only: a longer list made Sarvam substitute place names.
const SARVAM_KEYTERMS = JSON.stringify(["SIDCUL"]);

function transcribeWorkflow() {
  const w = new WorkflowBuilder("VSPL talent · transcribe");
  const claimed = `$('Claim voice notes').item.json`;
  const job = `$('Sarvam: create job').item.json.job_id`;
  // Hindi and Hinglish pages: Hindi. English page: let Sarvam detect it.
  const language = `${claimed}.locale === 'en' ? 'unknown' : 'hi-IN'`;

  w.add(everyMinute("Every minute", grid(0)));
  w.add(
    sql(
      "Recover stuck",
      `
UPDATE attachments
SET transcript_status = CASE WHEN transcript_attempts >= 3 THEN 'failed' ELSE 'pending' END,
    transcript_error = coalesce(transcript_error, 'Timed out waiting for Sarvam'),
    updated_at = now()
WHERE transcript_status = 'running' AND updated_at < now() - interval '20 minutes'
RETURNING id;`,
      grid(1),
      undefined,
      { alwaysOutputData: true, executeOnce: true },
    ),
  );
  w.add(
    sql(
      "Claim voice notes",
      `
UPDATE attachments a
SET transcript_status = 'running', transcript_attempts = a.transcript_attempts + 1,
    transcript_error = NULL, updated_at = now()
FROM submissions s
WHERE s.id = a.submission_id
  AND a.id IN (
    SELECT id FROM attachments WHERE transcript_status = 'pending'
    ORDER BY created_at LIMIT 3 FOR UPDATE SKIP LOCKED)
RETURNING a.id, a.r2_key, a.mime, s.locale,
  a.id || '.' || CASE split_part(a.mime, ';', 1)
    WHEN 'audio/webm' THEN 'webm' WHEN 'audio/ogg' THEN 'ogg' WHEN 'audio/mpeg' THEN 'mp3'
    WHEN 'audio/wav' THEN 'wav' WHEN 'audio/aac' THEN 'aac' ELSE 'm4a' END AS file_name;`,
      grid(2),
      undefined,
      { executeOnce: true },
    ),
  );
  // A Postgres query that returns no rows still outputs one {success: true}
  // item; stop here unless a voice note was actually claimed.
  w.add(condition("Claimed any?", "$json.id !== undefined", grid(3)));
  w.add(download("Download voice note", `={{ ${claimed}.r2_key }}`, grid(4)));
  w.add(
    http("Sarvam: transcribe", grid(5), {
      method: "POST",
      url: "https://api.sarvam.ai/speech-to-text",
      auth: CREDENTIALS.sarvam,
      multipart: [
        { parameterType: "formBinaryData", name: "file", inputDataFieldName: "file" },
        { parameterType: "formData", name: "model", value: SARVAM_MODEL },
        { parameterType: "formData", name: "language_code", value: `={{ ${language} }}` },
        { parameterType: "formData", name: "keyterms", value: SARVAM_KEYTERMS },
      ],
      fullResponse: true,
      retry: true,
    }),
  );
  w.add(condition("Transcribed?", "$json.statusCode === 200", grid(6)));
  w.add(code("Transcript result", "transcript-result.ts", grid(7, -1), true));
  w.add(
    sql(
      "Save transcript",
      `
UPDATE attachments
SET transcript = $2, transcript_language = $3, sarvam_job_id = $4,
    transcript_status = 'done', transcript_error = NULL, updated_at = now()
WHERE id = $1::uuid
RETURNING id;`,
      grid(8, -1),
      "[$json.attachmentId, $json.transcript, $json.language, $json.requestId]",
    ),
  );
  w.add(condition("Too long for REST?", "$json.statusCode === 400 && /30 seconds/.test($json.body?.error?.message ?? '')", grid(7, 1)));

  // Batch route, for notes over 30 seconds.
  w.add(
    http("Sarvam: create job", grid(8, 1), {
      method: "POST",
      url: SARVAM,
      auth: CREDENTIALS.sarvam,
      json: `={{ JSON.stringify({ job_parameters: { model: '${SARVAM_MODEL}', language_code: ${language}, keyterms: ${SARVAM_KEYTERMS} } }) }}`,
      retry: true,
    }),
  );
  w.add(
    http("Sarvam: upload URL", grid(9, 1), {
      method: "POST",
      url: `${SARVAM}/upload-files`,
      auth: CREDENTIALS.sarvam,
      json: `={{ JSON.stringify({ job_id: $json.job_id, files: [${claimed}.file_name] }) }}`,
      retry: true,
    }),
  );
  // The HTTP nodes above drop the binary, so fetch the note again for the PUT.
  w.add(download("Download again", `={{ ${claimed}.r2_key }}`, grid(10, 1)));
  w.add(
    http("Sarvam: upload audio", grid(11, 1), {
      method: "PUT",
      url: `={{ $('Sarvam: upload URL').item.json.upload_urls[${claimed}.file_name].file_url }}`,
      // Sarvam's upload URLs are Azure blob URLs, which need the blob type.
      headers: [
        ["x-ms-blob-type", "BlockBlob"],
        ["Content-Type", `={{ ${claimed}.mime }}`],
      ],
      binaryField: "file",
      retry: true,
    }),
  );
  w.add(http("Sarvam: start job", grid(12, 1), { method: "POST", url: `=${SARVAM}/{{ ${job} }}/start`, auth: CREDENTIALS.sarvam, retry: true }));
  w.add({ name: "Wait 10s", type: "n8n-nodes-base.wait", typeVersion: 1.1, position: grid(13, 1), parameters: { resume: "timeInterval", amount: 10, unit: "seconds" } });
  w.add(http("Sarvam: job status", grid(14, 1), { method: "GET", url: `=${SARVAM}/{{ ${job} }}/status`, auth: CREDENTIALS.sarvam, retry: true }));
  w.add(condition("Completed?", "$json.job_state === 'Completed' && $json.job_details?.[0]?.state === 'Success'", grid(15, 1)));
  w.add(
    http("Sarvam: result URL", grid(16, 0), {
      method: "POST",
      url: `${SARVAM}/download-files`,
      auth: CREDENTIALS.sarvam,
      json: `={{ JSON.stringify({ job_id: $json.job_id, files: [$json.job_details[0].outputs[0].file_name] }) }}`,
      retry: true,
    }),
  );
  // Served as application/octet-stream; read it as JSON regardless.
  w.add(http("Sarvam: fetch transcript", grid(17, 0), { method: "GET", url: `={{ Object.values($json.download_urls)[0].file_url }}`, responseJson: true, retry: true }));
  w.add(condition("Job failed?", "$json.job_state === 'Failed' || $json.job_state === 'Completed'", grid(16, 2)));
  // About 13 minutes of polling, inside the 20 minutes "Recover stuck" allows.
  w.add(condition("Keep waiting?", "$runIndex < 80", grid(17, 3)));

  w.add(
    sql(
      "Mark failed",
      `
UPDATE attachments
SET transcript_status = CASE WHEN transcript_attempts >= 3 THEN 'failed' ELSE 'pending' END,
    transcript_error = left($2, 500), updated_at = now()
WHERE id = $1::uuid
RETURNING id;`,
      grid(18, 2),
      `[${claimed}.id, $json.body?.error?.message ?? $json.error_message ?? $json.job_details?.[0]?.error_message ?? ('Sarvam answered ' + ($json.statusCode ?? $json.job_state))]`,
    ),
  );

  w.chain("Every minute", "Recover stuck", "Claim voice notes", "Claimed any?", "Download voice note", "Sarvam: transcribe", "Transcribed?");
  w.chain("Transcribed?", "Transcript result", "Save transcript");
  w.connect("Transcribed?", "Too long for REST?", { output: 1 });
  w.chain("Too long for REST?", "Sarvam: create job", "Sarvam: upload URL", "Download again", "Sarvam: upload audio", "Sarvam: start job");
  w.connect("Too long for REST?", "Mark failed", { output: 1 });
  w.chain("Sarvam: start job", "Wait 10s", "Sarvam: job status", "Completed?");
  w.chain("Completed?", "Sarvam: result URL", "Sarvam: fetch transcript", "Transcript result");
  w.connect("Completed?", "Job failed?", { output: 1 });
  w.connect("Job failed?", "Mark failed");
  w.connect("Job failed?", "Keep waiting?", { output: 1 });
  w.connect("Keep waiting?", "Wait 10s");
  return w.build();
}

// ---------------------------------------------------------------------------
// VSPL talent · deliver - each submission becomes a Chatwoot conversation:
// a private note with the message and transcripts, then every file attached.
// No AI in the middle; staff read the originals.

function deliverWorkflow() {
  const w = new WorkflowBuilder("VSPL talent · deliver");
  const settings = `$('Settings').first().json`;
  const submission = `$('Claim submission').first().json`;
  const contact = `$('Chatwoot: contact').first().json`;
  // Chatwoot's public API for the "Jobs, website" API inbox: it finds an
  // existing contact by phone number (so WhatsApp threads share the contact)
  // and posts messages as the job seeker's own. No user token needed.
  const inbox = `={{ ${settings}.chatwootBaseUrl }}/public/api/v1/inboxes/{{ ${settings}.chatwootInboxIdentifier }}`;

  w.add(everyMinute("Every minute", grid(0)));
  w.add({
    name: "Settings",
    type: "n8n-nodes-base.set",
    typeVersion: 3.4,
    position: grid(1),
    notes: 'chatwootInboxIdentifier: the "Jobs, website" API inbox identifier (Settings > Inboxes > Configuration). Treat it as a secret.',
    notesInFlow: true,
    parameters: {
      assignments: {
        assignments: [
          ["chatwootBaseUrl", "http://chatwoot.growth.svc.cluster.local"],
          ["chatwootInboxIdentifier", "SET_ME"],
        ].map(([name, value]) => ({ id: stableId("settings", name), name, value, type: "string" })),
      },
      options: {},
    },
  });
  w.add(
    sql(
      "Recover stuck",
      `
UPDATE submissions
SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'received' END,
    last_error = coalesce(last_error, 'Timed out delivering to Chatwoot'),
    updated_at = now()
WHERE status = 'delivering' AND updated_at < now() - interval '15 minutes'
RETURNING id;`,
      grid(2),
      undefined,
      { alwaysOutputData: true, executeOnce: true },
    ),
  );
  // Waits until every voice note of a submission is transcribed (or failed).
  w.add(
    sql(
      "Claim submission",
      `
WITH claimed AS (
  UPDATE submissions s
  SET status = 'delivering', attempts = s.attempts + 1, updated_at = now()
  WHERE s.id = (
    SELECT c.id FROM submissions c
    WHERE c.status = 'received'
      AND NOT EXISTS (
        SELECT 1 FROM attachments a
        WHERE a.submission_id = c.id AND a.transcript_status IN ('pending', 'running'))
    ORDER BY c.created_at LIMIT 1 FOR UPDATE SKIP LOCKED)
  RETURNING s.id, s.ref, s.source, s.role, s.locale, s.phone, s.text
)
SELECT c.*, coalesce((
  SELECT jsonb_agg(jsonb_build_object(
    'id', a.id, 'position', a.position, 'kind', a.kind, 'key', a.r2_key, 'mime', a.mime,
    'name', a.original_name, 'transcript', a.transcript, 'transcriptStatus', a.transcript_status
  ) ORDER BY a.position)
  FROM attachments a WHERE a.submission_id = c.id), '[]'::jsonb) AS attachments
FROM claimed c;`,
      grid(3),
      undefined,
      { executeOnce: true },
    ),
  );
  w.add(condition("Claimed any?", "$json.id !== undefined", grid(4, 1)));
  w.add(code("Compose note", "compose-note.ts", grid(4)));
  w.add(
    http("Chatwoot: contact", grid(5), {
      method: "POST",
      url: `${inbox}/contacts`,
      json: `={{ JSON.stringify({ source_id: 'talent-' + ${submission}.phone.replace('+', ''), name: $json.contactName, phone_number: ${submission}.phone }) }}`,
      retry: true,
    }),
  );
  w.add(
    http("Chatwoot: create conversation", grid(6), {
      method: "POST",
      url: `${inbox}/contacts/{{ $json.source_id }}/conversations`,
      // job_role: filter conversations by role (a "Job role" conversation attribute in Chatwoot).
      json: `={{ JSON.stringify({ custom_attributes: ${submission}.role ? { job_role: ${submission}.role } : {} }) }}`,
    }),
  );
  w.add(
    sql(
      "Record conversation",
      `
UPDATE submissions
SET chatwoot_contact_id = $2, chatwoot_conversation_id = $3, updated_at = now()
WHERE id = $1::uuid
RETURNING id;`,
      grid(7),
      `[${submission}.id, ${contact}.id ?? null, $json.id]`,
    ),
  );
  w.add(
    http("Chatwoot: post message", grid(8), {
      method: "POST",
      url: `${inbox}/contacts/{{ ${contact}.source_id }}/conversations/{{ $('Chatwoot: create conversation').first().json.id }}/messages`,
      json: `={{ JSON.stringify({ content: $('Compose note').first().json.note }) }}`,
      // No retry: Chatwoot can save the message and still answer 500, and a
      // retry then posts it twice. A failed run is redelivered by "Recover stuck".
    }),
  );
  w.add(
    sql(
      "Mark delivered",
      `UPDATE submissions SET status = 'delivered', last_error = NULL, updated_at = now() WHERE id = $1::uuid RETURNING id;`,
      grid(9),
      `[${submission}.id]`,
    ),
  );
  w.add(code("Files to fetch", "files-to-fetch.ts", grid(10)));
  w.add(download("Download files", "={{ $json.key }}", grid(11)));
  w.add(
    http("Chatwoot: attach file", grid(12), {
      method: "POST",
      url: `${inbox}/contacts/{{ ${contact}.source_id }}/conversations/{{ $('Files to fetch').item.json.conversationId }}/messages`,
      multipart: [
        { parameterType: "formData", name: "content", value: "={{ $('Files to fetch').item.json.label }}" },
        { parameterType: "formBinaryData", name: "attachments[]", inputDataFieldName: "file" },
      ],
      // No retry, for the same reason as "Chatwoot: post message".
      continueOnError: true,
    }),
  );

  w.chain("Every minute", "Settings", "Recover stuck", "Claim submission", "Claimed any?", "Compose note", "Chatwoot: contact");
  w.chain("Chatwoot: contact", "Chatwoot: create conversation", "Record conversation", "Chatwoot: post message");
  w.chain("Chatwoot: post message", "Mark delivered", "Files to fetch", "Download files", "Chatwoot: attach file");
  return w.build();
}

// ---------------------------------------------------------------------------

const outputs: Record<string, Workflow> = {
  "vspl-talent-setup.json": setupWorkflow(),
  "vspl-talent-intake.json": intakeWorkflow(),
  "vspl-talent-transcribe.json": transcribeWorkflow(),
  "vspl-talent-deliver.json": deliverWorkflow(),
};

const check = process.argv.includes("--check");
let stale = 0;
for (const [file, workflow] of Object.entries(outputs)) {
  const path = resolve(here, "workflows", file);
  const json = `${JSON.stringify(workflow, null, 2)}\n`;
  if (check) {
    let current = "";
    try {
      current = readFileSync(path, "utf8");
    } catch {}
    if (current !== json) {
      console.error(`out of date: ${relative(repoRoot, path)} (run pnpm n8n:build)`);
      stale++;
    }
  } else {
    writeFileSync(path, json);
    console.log(`wrote ${relative(repoRoot, path)} (${workflow.nodes.length} nodes)`);
  }
}
if (stale) process.exit(1);
