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
  fast2sms: "fast2sms-vspl",
  /** Delete rights on the talent bucket, for erasure only; intake's token stays read-only. */
  r2Erase: "r2-talent-erase",
  /** A Chatwoot agent token (api_access_token) that may delete contacts. */
  chatwootAdmin: "chatwoot-talent-admin",
} as const;

const BUCKET = "vayasya-talent-intake";
/** Privacy notice §10: details are kept up to 12 months after the person last contacts us. */
const RETENTION_MONTHS = 12;

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
  method: "GET" | "POST" | "PUT" | "DELETE";
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
  INSERT INTO submissions (ref, source, locale, phone, consent_version, consented_at, adult, text, role, hub, channel, agent_name, form, applicant_name, answers, cluster, page_cluster, page_path)
  VALUES ($1, $2, $3, $4, $5, $6::timestamptz, true, $7, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17, $18)
  ON CONFLICT (ref) DO NOTHING
  RETURNING id
), ack AS (
  INSERT INTO sms_acknowledgements (submission_id)
  SELECT id FROM s
  RETURNING 1
), person AS (
  -- The worker list (PLAN §8.2): an application is the person reaching us,
  -- so it renews last_contact_at. Lists merge; the newest name and language win.
  INSERT INTO people (phone, name, clusters, home_area, roles, locale, consent_version, last_applied_at, last_contact_at)
  SELECT $4, $14,
         CASE WHEN $16::text IS NULL THEN '{}'::text[] ELSE ARRAY[$16::text] END,
         $15::jsonb #>> '{area,0}',
         ARRAY(SELECT DISTINCT r FROM unnest(array_remove(ARRAY[$9::text], NULL) || ARRAY(SELECT jsonb_array_elements_text(coalesce($15::jsonb -> 'work', '[]'::jsonb)))) AS r),
         $3, $5, now(), now()
  FROM s
  ON CONFLICT (phone) DO UPDATE SET
    name = coalesce(EXCLUDED.name, people.name),
    clusters = ARRAY(SELECT DISTINCT c FROM unnest(people.clusters || EXCLUDED.clusters) AS c),
    home_area = coalesce(EXCLUDED.home_area, people.home_area),
    roles = ARRAY(SELECT DISTINCT r FROM unnest(people.roles || EXCLUDED.roles) AS r),
    locale = EXCLUDED.locale,
    consent_version = EXCLUDED.consent_version,
    status = CASE WHEN people.status = 'do-not-contact' THEN 'active' ELSE people.status END,
    last_applied_at = now(),
    last_contact_at = now(),
    updated_at = now()
  RETURNING 1
), a AS (
  INSERT INTO attachments (submission_id, position, kind, r2_key, mime, size_bytes, original_name, transcript_status)
  SELECT s.id, (x->>'position')::int, x->>'kind', x->>'key', x->>'mime', (x->>'size')::int, x->>'name',
         CASE WHEN x->>'kind' = 'audio' THEN 'pending' ELSE 'none' END
  FROM s, jsonb_array_elements($8::jsonb) AS x
  RETURNING 1
)
SELECT (SELECT id FROM s) AS submission_id, (SELECT count(*) FROM a) AS attachments, (SELECT count(*) FROM ack) AS acknowledgements, (SELECT count(*) FROM person) AS people;`,
      grid(2),
      "[$json.ref, $json.source, $json.locale, $json.phone, $json.consentVersion, $json.consentedAt, $json.text, JSON.stringify($json.attachments), $json.role, $json.hub, $json.channel, $json.agentName, $json.form, $json.applicantName, $json.answers ? JSON.stringify($json.answers) : null, $json.cluster, $json.pageCluster, $json.pagePath]",
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
  addAcknowledgement(w, "Respond 202", grid(4), "s.id = $1::uuid", "[$('Save submission').first().json.submission_id]");
  return w.build();
}

// Claims are shared by immediate intake and the scheduled recovery workflow.
// A timeout can mean the SMS was accepted: never automatically resend it.
function addAcknowledgement(w: WorkflowBuilder, start: string, position: Position, filter = "true", params?: string) {
  const at = (col: number): Position => [position[0] + col * 240, position[1]];
  w.add(sql("Claim acknowledgement", `
WITH candidate AS (
  SELECT a.submission_id FROM sms_acknowledgements a
  JOIN submissions s ON s.id = a.submission_id
  WHERE a.status = 'pending' AND a.next_attempt_at <= now() AND a.attempts < 3 AND ${filter}
  ORDER BY a.created_at LIMIT 1 FOR UPDATE OF a SKIP LOCKED
), claimed AS (
  UPDATE sms_acknowledgements a SET status = 'sending', attempts = attempts + 1, updated_at = now()
  FROM candidate c WHERE a.submission_id = c.submission_id RETURNING a.*
)
SELECT c.submission_id, c.attempts, s.ref, s.phone FROM claimed c
JOIN submissions s ON s.id = c.submission_id;`, at(0), params));
  w.add(condition("Acknowledgement claimed?", "Boolean($json.submission_id)", at(1)));
  w.add(http("Fast2SMS: acknowledgement", at(2), {
    method: "POST", url: "https://www.fast2sms.com/dev/bulkV2", auth: CREDENTIALS.fast2sms,
    json: `={{ JSON.stringify({ route: 'dlt', sender_id: 'VAYSPL', message: '227115', variables_values: $json.ref, numbers: $json.phone.slice(-10), sms_details: '1', udf1: $json.ref }) }}`,
    responseJson: true, fullResponse: true, continueOnError: true, timeout: 15000,
  }));
  w.add(code("Acknowledgement result", "acknowledgement-result.ts", at(3)));
  w.add(sql("Save acknowledgement result", `
UPDATE sms_acknowledgements
SET status = $2, request_id = $3, last_error = $4,
    accepted_at = CASE WHEN $2 = 'accepted' THEN now() ELSE accepted_at END,
    next_attempt_at = now() + interval '1 minute', updated_at = now()
WHERE submission_id = $1::uuid AND status = 'sending'
RETURNING submission_id, status;`, at(4), "[$json.submissionId, $json.status, $json.requestId, $json.error]"));
  w.chain(start, "Claim acknowledgement", "Acknowledgement claimed?", "Fast2SMS: acknowledgement", "Acknowledgement result", "Save acknowledgement result");
}

function acknowledgeWorkflow() {
  const w = new WorkflowBuilder("VSPL talent · acknowledge");
  w.add(everyMinute("Every minute", grid(0)));
  w.add(sql("Recover interrupted sends", `
UPDATE sms_acknowledgements SET status = 'unknown',
  last_error = 'Interrupted send; check Fast2SMS delivery history before retrying', updated_at = now()
WHERE status = 'sending' AND updated_at < now() - interval '5 minutes';`, grid(1)));
  w.chain("Every minute", "Recover interrupted sends");
  addAcknowledgement(w, "Recover interrupted sends", grid(2));
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
  RETURNING s.id, s.ref, s.source, s.role, s.hub, s.channel, s.agent_name AS "agentName", s.form, s.applicant_name AS "applicantName", s.answers, s.locale, s.cluster, s.page_cluster AS "pageCluster", s.page_path AS "pagePath", s.phone, s.text
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
      // job_role / job_hub: filter conversations by role or hub page; submitted_via: "agent" for the open agent route;
      // job_form: "long" or "quick"; job_cluster: the cluster id (conversation attributes in Chatwoot).
      json: `={{ JSON.stringify({ custom_attributes: { ...(${submission}.cluster ? { job_cluster: ${submission}.cluster } : {}), ...(${submission}.role ? { job_role: ${submission}.role } : {}), ...(${submission}.hub ? { job_hub: ${submission}.hub } : {}), ...(${submission}.channel === 'agent' ? { submitted_via: 'agent' } : {}), ...(${submission}.form ? { job_form: ${submission}.form } : {}) } }) }}`,
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
// VSPL talent · retention - the 12-month rule and erasure requests (privacy
// notice §10, PLAN §8.3). Hourly: queue everyone whose last contact is over
// 12 months old, then erase one queued person per run: R2 files, Chatwoot
// contacts (with their conversations), then their rows. Staff queue a
// person's own request by mobile number and reference (README, "Erasure").

function retentionWorkflow() {
  const w = new WorkflowBuilder("VSPL talent · retention");
  const settings = `$('Retention settings').first().json`;
  const claimed = `$('Claim erasure').first().json`;
  w.add({
    name: "Every hour",
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1.2,
    position: grid(0),
    parameters: { rule: { interval: [{ field: "hours", hoursInterval: 1 }] } },
  });
  // A manual start too: the first run is by hand (README, "Retention and
  // erasure"), and n8n's CLI `execute` needs a manual trigger to start from.
  w.add({ name: "Run by hand", type: "n8n-nodes-base.manualTrigger", typeVersion: 1, position: grid(0, 1), parameters: {} });
  w.add({
    name: "Retention settings",
    type: "n8n-nodes-base.set",
    typeVersion: 3.4,
    position: grid(1),
    notes: "chatwootAccountId: the account that holds the \"Jobs, website\" inbox.",
    notesInFlow: true,
    parameters: {
      assignments: {
        assignments: [
          ["chatwootBaseUrl", "http://chatwoot.growth.svc.cluster.local"],
          ["chatwootAccountId", "1"],
        ].map(([name, value]) => ({ id: stableId("retention-settings", name), name, value, type: "string" })),
      },
      options: {},
    },
  });
  w.add(
    sql(
      "Queue expired and recover",
      `
WITH recovered AS (
  UPDATE erasure_requests
  SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END,
      last_error = coalesce(last_error, 'Interrupted; retried'), updated_at = now()
  WHERE status = 'running' AND updated_at < now() - interval '1 hour'
  RETURNING id
), expired AS (
  SELECT p.phone FROM people p
  WHERE greatest(coalesce(p.last_contact_at, p.created_at), coalesce(p.last_confirmed_at, p.created_at)) < now() - interval '${RETENTION_MONTHS} months'
  UNION
  -- Submissions from before the people table, with no row of their own.
  SELECT s.phone FROM submissions s
  WHERE NOT EXISTS (SELECT 1 FROM people p WHERE p.phone = s.phone)
  GROUP BY s.phone HAVING max(s.created_at) < now() - interval '${RETENTION_MONTHS} months'
), queued AS (
  INSERT INTO erasure_requests (phone, reason)
  SELECT phone, 'retention' FROM expired
  ON CONFLICT (phone) WHERE status IN ('pending', 'running') DO NOTHING
  RETURNING id
)
SELECT (SELECT count(*) FROM recovered) AS recovered, (SELECT count(*) FROM queued) AS queued;`,
      grid(2),
      undefined,
      { executeOnce: true, alwaysOutputData: true },
    ),
  );
  w.add(
    sql(
      "Claim erasure",
      `
WITH claimed AS (
  UPDATE erasure_requests e
  SET status = 'running', attempts = e.attempts + 1, last_error = NULL, updated_at = now()
  WHERE e.id = (
    SELECT id FROM erasure_requests WHERE status = 'pending' AND phone IS NOT NULL
    ORDER BY requested_at LIMIT 1 FOR UPDATE SKIP LOCKED)
  RETURNING e.id, e.phone, e.reason
)
SELECT c.id, c.phone, c.reason,
  coalesce((SELECT jsonb_agg(a.r2_key) FROM attachments a JOIN submissions s ON s.id = a.submission_id WHERE s.phone = c.phone), '[]'::jsonb) AS files,
  coalesce((SELECT jsonb_agg(DISTINCT s.chatwoot_contact_id) FROM submissions s WHERE s.phone = c.phone AND s.chatwoot_contact_id IS NOT NULL), '[]'::jsonb) AS contacts
FROM claimed c;`,
      grid(3),
      undefined,
      { executeOnce: true },
    ),
  );
  w.add(condition("Claimed any?", "$json.id !== undefined", grid(4)));
  w.add(code("Files to delete", "erase-files.ts", grid(5)));
  w.add(condition("Has file?", "$json.key !== null", grid(6)));
  w.add({
    name: "R2: delete file",
    type: "n8n-nodes-base.s3",
    typeVersion: 1,
    position: grid(7, -1),
    parameters: { resource: "file", operation: "delete", bucketName: BUCKET, fileKey: "={{ $json.key }}", options: {} },
    credentials: credential("s3", CREDENTIALS.r2Erase),
  });
  w.add({ ...code("Contacts to delete", "erase-contacts.ts", grid(8)), executeOnce: true });
  w.add(condition("Has contact?", "$json.contactId !== null", grid(9)));
  w.add(
    http("Chatwoot: delete contact", grid(10, -1), {
      method: "DELETE",
      url: `={{ ${settings}.chatwootBaseUrl }}/api/v1/accounts/{{ ${settings}.chatwootAccountId }}/contacts/{{ $json.contactId }}`,
      auth: CREDENTIALS.chatwootAdmin,
      retry: true,
    }),
  );
  w.add(
    sql(
      "Delete rows",
      `
WITH gone AS (
  DELETE FROM submissions WHERE phone = $2 RETURNING id
), person AS (
  DELETE FROM people WHERE phone = $2 RETURNING 1
)
UPDATE erasure_requests
SET status = 'done', processed_at = now(), updated_at = now(),
    removed_submissions = (SELECT count(*) FROM gone), removed_files = $3::int, removed_contacts = $4::int,
    phone = NULL, ref = NULL
WHERE id = $1::uuid AND status = 'running'
RETURNING id, status, removed_submissions;`,
      grid(11),
      `[${claimed}.id, ${claimed}.phone, ${claimed}.files.length, ${claimed}.contacts.length]`,
      { executeOnce: true },
    ),
  );
  w.chain("Every hour", "Retention settings", "Queue expired and recover", "Claim erasure", "Claimed any?", "Files to delete", "Has file?", "R2: delete file", "Contacts to delete");
  w.connect("Run by hand", "Retention settings");
  // No file: straight on to the contacts.
  w.connect("Has file?", "Contacts to delete", { output: 1 });
  w.chain("Contacts to delete", "Has contact?", "Chatwoot: delete contact", "Delete rows");
  w.connect("Has contact?", "Delete rows", { output: 1 });
  return w.build();
}

// ---------------------------------------------------------------------------

const outputs: Record<string, Workflow> = {
  "vspl-talent-setup.json": setupWorkflow(),
  "vspl-talent-intake.json": intakeWorkflow(),
  "vspl-talent-deliver.json": deliverWorkflow(),
  "vspl-talent-acknowledge.json": acknowledgeWorkflow(),
  "vspl-talent-retention.json": retentionWorkflow(),
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
