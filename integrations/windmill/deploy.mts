/**
 * Deploys the talent scripts to the growth cluster's Windmill (workspace
 * `vspl`), over its API through a kubectl port-forward.
 *
 *   pnpm windmill:build && pnpm windmill:deploy [--dry-run] [--enable-schedules] [--enable-retention]
 *
 * Needs kubectl access to the cluster (WARP on). Idempotent; a re-run
 * updates in place. Nothing secret is printed or written locally: secrets
 * are read from the cluster into memory and sent to Windmill's API.
 *
 * 1. Reads the secrets from the cluster: the talent database password
 *    (data/pg-main-talent), the R2 keys, webhook secret, Fast2SMS key and
 *    retention Chatwoot token (growth/windmill-talent, vayasya-infra
 *    apps/windmill/overlays/growth/secrets-talent.sops.yaml; --secrets-from
 *    to read another Secret with the same keys), and the "Jobs, website"
 *    inbox identifier from Chatwoot. The API token is SUPERADMIN_SECRET in
 *    growth/windmill-env (Windmill accepts it as a bearer token).
 * 2. Ensures the workspace `vspl` and folder `talent`.
 * 3. Upserts the f/talent/* variables (config.ts VARIABLES: which are secret).
 * 4. Pushes each script in f/talent/ as a new version only if its content
 *    or metadata changed (parent_hash = the current version's hash).
 * 5. Runs f/talent/setup and f/leads/setup (schemas) and waits for them.
 * 6. Creates or updates the schedules and the HTTP routes. Schedules are
 *    created disabled: --enable-schedules turns f/talent/dispatch and
 *    f/leads/sync_crm on, --enable-retention turns retention on (after a
 *    hand-run check, as with n8n). A re-run without the flags leaves them as
 *    they are. The schedules the dispatcher replaced (acknowledge, deliver,
 *    sync_crm, delivery_check) are turned off; the scripts stay, for hand runs.
 * 7. Warms the route (the first call after a new version installs
 *    dependencies, ~7.5 s) with a wrong secret, expecting 403.
 *
 * Windmill API (v1.822.0, backend/windmill-api/openapi.yaml), all under /api:
 *   POST /workspaces/exists {id} -> bool          POST /workspaces/create {id, name}
 *   GET  /w/{ws}/folders/exists/{name} -> bool    POST /w/{ws}/folders/create {name, owners, extra_perms}
 *   GET  /w/{ws}/variables/exists/{path} -> bool
 *   POST /w/{ws}/variables/create  CreateVariable {path, value, is_secret, description}
 *   POST /w/{ws}/variables/update/{path}  EditVariable {value, is_secret, description}
 *   GET  /w/{ws}/scripts/exists/p/{path} -> bool  GET /w/{ws}/scripts/get/p/{path} -> Script {hash, content, summary, schema...}
 *   POST /w/{ws}/scripts/create  NewScript {path, parent_hash?, summary, description, content, schema, language, kind, has_preprocessor}
 *   POST /w/{ws}/jobs/run_wait_result/p/{path}  args -> result
 *   GET  /w/{ws}/schedules/exists/{path} -> bool
 *   POST /w/{ws}/schedules/create  NewSchedule {path, schedule, timezone, script_path, is_flow, args, enabled, summary}
 *   POST /w/{ws}/schedules/update/{path}  EditSchedule {schedule, timezone, args, summary}
 *   POST /w/{ws}/schedules/setenabled/{path} {enabled}
 *   GET  /w/{ws}/http_triggers/exists/{path} -> bool
 *   POST /w/{ws}/http_triggers/create|update/{path}  NewHttpTrigger/EditHttpTrigger
 *   Routes are served at /api/r/{route_path} (workspaced_route false).
 */
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { FOLDERS, SCRIPTS, TIMEZONE, WORKSPACE, scriptPath, specPath, type ScriptSpec } from "./scripts.mts";
import { VARIABLES, variablePath, type ConfigName } from "./talent/lib/config.ts";
import { metadata } from "./build.mts";

const here = dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ENABLE_SCHEDULES = args.includes("--enable-schedules");
const ENABLE_RETENTION = args.includes("--enable-retention");
const SECRETS_FROM = args.find((a) => a.startsWith("--secrets-from="))?.split("=")[1] ?? "windmill-talent";
const BASE_URL_ARG = args.find((a) => a.startsWith("--base-url="))?.split("=")[1];

const CHATWOOT = ["-n", "growth", "exec", "deploy/chatwoot", "--"];
const INBOX_NAME = "Jobs, website";
const ACCOUNT_ID = 1;
const R2_ENDPOINT = "https://3f03827748ac33418f1176adaa436f26.r2.cloudflarestorage.com";
const R2_BUCKET = "vayasya-talent-intake";
const TALENT_DB_HOST = "pg-main-rw.data.svc.cluster.local";

function step(message: string) {
  console.log(`${DRY_RUN ? "[dry run] " : ""}- ${message}`);
}

function kubectl(argv: string[]): string {
  return execFileSync("kubectl", ["--request-timeout=180s", ...argv], { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
}

function secretValue(namespace: string, secret: string, key: string): string {
  const b64 = kubectl(["-n", namespace, "get", "secret", secret, "-o", `jsonpath={.data.${key}}`]);
  if (!b64) throw new Error(`secret ${namespace}/${secret} has no ${key}`);
  return Buffer.from(b64, "base64").toString("utf8");
}

// --- 1. Values from the cluster ---------------------------------------------------

function readValues(): Record<ConfigName, string> {
  step("reading secrets from the cluster");
  const talentPassword = secretValue("data", "pg-main-talent", "password");
  // The lead inbox (vayasya-infra apps/pg-main, role leads): needed before this deploy.
  const leadsPassword = secretValue("data", "pg-main-leads", "password");
  const fromEnv = (key: string) => secretValue("growth", SECRETS_FROM, key);
  step(`looking up the "${INBOX_NAME}" inbox identifier in Chatwoot`);
  const out = kubectl([
    ...CHATWOOT,
    "bundle", "exec", "rails", "runner",
    `i = Account.find(${ACCOUNT_ID}).inboxes.find_by!(name: ${JSON.stringify(INBOX_NAME)}); puts "IDENTIFIER=#{i.channel.identifier}"`,
  ]);
  const inboxIdentifier = out.match(/^IDENTIFIER=(\S+)$/m)?.[1];
  if (!inboxIdentifier) throw new Error(`no "${INBOX_NAME}" API inbox in Chatwoot account ${ACCOUNT_ID}`);
  return {
    talent_pg_url: `postgres://talent:${encodeURIComponent(talentPassword)}@${TALENT_DB_HOST}:5432/talent`,
    fast2sms_api_key: fromEnv("FAST2SMS_API_KEY"),
    intake_webhook_secret: fromEnv("TALENT_INTAKE_WEBHOOK_SECRET"),
    r2_read_key_id: fromEnv("TALENT_R2_ACCESS_KEY_ID"),
    r2_read_secret: fromEnv("TALENT_R2_SECRET_ACCESS_KEY"),
    r2_erase_key_id: fromEnv("TALENT_R2_ERASE_ACCESS_KEY_ID"),
    r2_erase_secret: fromEnv("TALENT_R2_ERASE_SECRET_ACCESS_KEY"),
    chatwoot_admin_token: fromEnv("CHATWOOT_TALENT_ADMIN_TOKEN"),
    chatwoot_inbox_identifier: inboxIdentifier,
    chatwoot_base_url: "http://chatwoot.growth.svc.cluster.local",
    chatwoot_account_id: String(ACCOUNT_ID),
    r2_endpoint: R2_ENDPOINT,
    r2_bucket: R2_BUCKET,
    twenty_base_url: "http://twenty.growth.svc.cluster.local",
    twenty_api_key: secretValue("growth", "twenty-api", "TWENTY_API_KEY"),
    lead_webhook_secret: secretValue("growth", "windmill-leads", "LEAD_WEBHOOK_SECRET"),
    fast2sms_dlr_secret: secretValue("growth", "windmill-fast2sms", "FAST2SMS_DLR_SECRET"),
    leads_pg_url: `postgres://leads:${encodeURIComponent(leadsPassword)}@${TALENT_DB_HOST}:5432/leads`,
    submission_signing_secret: signingSecret(),
  };
}

/**
 * SUBMISSION_SIGNING_SECRET in growth/windmill-submission (the site has the
 * same value in Vercel). Until the owner creates that Secret, a random value
 * nobody knows: the signed routes then refuse every request, and the site
 * keeps using the older routes (it switches only when it has the secret).
 */
function signingSecret(): string {
  try {
    return secretValue("growth", "windmill-submission", "SUBMISSION_SIGNING_SECRET");
  } catch {
    step("growth/windmill-submission not found: the signed routes will refuse everything until it exists");
    return randomBytes(32).toString("base64url");
  }
}

// --- Windmill API ----------------------------------------------------------------

async function freePort(): Promise<number> {
  return new Promise((ok, fail) => {
    const s = createServer();
    s.listen(0, () => {
      const { port } = s.address() as { port: number };
      s.close(() => ok(port));
    });
    s.on("error", fail);
  });
}

async function portForward(): Promise<{ base: string; stop: () => void }> {
  if (BASE_URL_ARG) return { base: BASE_URL_ARG.replace(/\/$/, ""), stop: () => {} };
  const port = await freePort();
  const child = spawn("kubectl", ["-n", "growth", "port-forward", "svc/windmill", `${port}:8000`], { stdio: "ignore" });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${base}/api/version`)).ok) return { base, stop: () => child.kill() };
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill();
  throw new Error("could not reach Windmill through kubectl port-forward");
}

function api(base: string, token: string) {
  const ws = WORKSPACE.id;
  async function call(method: "GET" | "POST", path: string, body?: unknown): Promise<string> {
    const res = await fetch(`${base}/api${path.replace("{ws}", ws)}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });
    const text = await res.text();
    // Never echo request bodies: they carry secrets. Windmill's error text is safe to show.
    if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${text.slice(0, 300)}`);
    return text;
  }
  const exists = async (path: string, body?: unknown) => (await call(body === undefined ? "GET" : "POST", path, body)).trim() === "true";
  const write = async (path: string, body: unknown, what: string) => {
    step(what);
    if (!DRY_RUN) await call("POST", path, body);
  };
  return { call, exists, write };
}

/**
 * Owns the schedules and the route. Windmill runs them as their owner and
 * refuses the superadmin secret's built-in identity there, so they belong to
 * a service user, admin of the workspace, whose random password nobody
 * keeps; this script acts as it through a short-lived impersonation token.
 * Shared with nevaehfirstsource.com integrations/windmill.
 */
const SERVICE_USER = "automation@vayasyaseva.com";

// --- deploy ------------------------------------------------------------------------

async function main() {
  const values = readValues();
  const token = secretValue("growth", "windmill-env", "SUPERADMIN_SECRET");
  const { base, stop } = await portForward();
  try {
    const w = api(base, token);

    // 2. Workspace and folder
    if (!(await w.exists("/workspaces/exists", { id: WORKSPACE.id }))) {
      await w.write("/workspaces/create", { id: WORKSPACE.id, name: WORKSPACE.name }, `creating workspace ${WORKSPACE.id}`);
    }
    if (DRY_RUN && !(await w.exists("/workspaces/exists", { id: WORKSPACE.id }))) {
      step("(workspace does not exist yet: the rest of the dry run assumes it would be empty)");
    }
    const wsReady = !DRY_RUN || (await w.exists("/workspaces/exists", { id: WORKSPACE.id }));
    const exists = async (path: string) => (wsReady ? w.exists(path) : false);
    for (const folder of FOLDERS) {
      if (!(await exists(`/w/{ws}/folders/exists/${folder}`))) {
        await w.write("/w/{ws}/folders/create", { name: folder, owners: [], extra_perms: {} }, `creating folder ${folder}`);
      }
    }

    // Service user (see SERVICE_USER)
    if (!(await w.exists(`/users/exists/${encodeURIComponent(SERVICE_USER)}`))) {
      await w.write(
        "/users/create",
        { email: SERVICE_USER, password: randomBytes(32).toString("hex"), super_admin: false, name: "Automation", skip_email: true },
        `creating service user ${SERVICE_USER}`,
      );
    }
    const members: { email: string }[] = wsReady ? JSON.parse(await w.call("GET", "/w/{ws}/users/list")) : [];
    if (!members.some((m) => m.email === SERVICE_USER)) {
      await w.write("/w/{ws}/workspaces/add_user", { email: SERVICE_USER, is_admin: true, operator: false }, `adding ${SERVICE_USER} to ${WORKSPACE.id} as admin`);
    }
    const asService = DRY_RUN
      ? w
      : api(
          base,
          await w.call("POST", "/users/tokens/impersonate", {
            impersonate_email: SERVICE_USER,
            label: "deploy (vayasyaseva.com integrations/windmill)",
            expiration: new Date(Date.now() + 30 * 60_000).toISOString(),
            workspace_id: WORKSPACE.id,
          }),
        );

    // 3. Variables
    for (const [name, { secret }] of Object.entries(VARIABLES) as [ConfigName, { secret: boolean }][]) {
      const path = variablePath(name);
      const description = `Talent scripts (integrations/windmill). Set by deploy.mts${secret ? "; secret" : ""}.`;
      if (await exists(`/w/{ws}/variables/exists/${path}`)) {
        await w.write(`/w/{ws}/variables/update/${path}`, { value: values[name], is_secret: secret, description }, `updating variable ${path}`);
      } else {
        await w.write("/w/{ws}/variables/create", { path, value: values[name], is_secret: secret, description }, `creating variable ${path}`);
      }
    }

    // 4. Scripts
    for (const spec of SCRIPTS) {
      const path = specPath(spec);
      const content = readFileSync(resolve(here, `${path}.ts`), "utf8");
      const meta = metadata(spec);
      let parent: { hash: string; content: string; summary: string; description?: string; schema?: unknown } | null = null;
      if (await exists(`/w/{ws}/scripts/exists/p/${path}`)) parent = JSON.parse(await w.call("GET", `/w/{ws}/scripts/get/p/${path}`));
      const unchanged =
        parent && parent.content === content && parent.summary === meta.summary && (parent.description ?? "") === meta.description
        && JSON.stringify(parent.schema ?? null) === JSON.stringify(meta.schema);
      if (unchanged) {
        step(`script ${path} unchanged`);
        continue;
      }
      await w.write(
        "/w/{ws}/scripts/create",
        {
          path,
          ...(parent ? { parent_hash: parent.hash } : {}),
          summary: meta.summary,
          description: meta.description,
          content,
          schema: meta.schema,
          language: "bun",
          kind: "script",
          ...(spec.hasPreprocessor ? { has_preprocessor: true } : {}),
        },
        `${parent ? "new version of" : "creating"} script ${path}`,
      );
    }

    // 5. Schemas: the talent database and the lead inbox
    for (const spec of SCRIPTS.filter((s) => s.name === "setup")) {
      const path = specPath(spec);
      step(`running ${path}`);
      if (DRY_RUN) continue;
      const out = await w.call("POST", `/w/{ws}/jobs/run_wait_result/p/${path}`, {});
      if (!/"ok"\s*:\s*true/.test(out)) throw new Error(`${path} did not report ok: ${out.slice(0, 300)}`);
    }

    // 6. Schedules and the HTTP route
    for (const spec of SCRIPTS) await schedule(asService, exists, spec);
    for (const spec of SCRIPTS) await route(asService, exists, spec);

    // 7. Warm the route: a wrong secret must answer 403
    for (const spec of SCRIPTS.filter((s) => s.route)) {
      step(`warming /api/r/${spec.route!.path} (expect 403)`);
      if (DRY_RUN) continue;
      // A new route takes a few seconds to be served (404 until then).
      let res: Response | undefined;
      for (let i = 0; i < 30; i++) {
        res = await fetch(`${base}/api/r/${spec.route!.path}`, {
          method: "POST",
          headers: { "content-type": "application/json", [spec.route!.secretHeader]: "deploy-warm-up" },
          body: "{}",
          signal: AbortSignal.timeout(120_000),
        });
        if (res.status !== 404) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!res || res.status !== 403) throw new Error(`route /api/r/${spec.route!.path} answered ${res?.status}, expected 403`);
    }
    console.log("done");
  } finally {
    stop();
  }
}

type Api = ReturnType<typeof api>;

async function schedule(w: Api, exists: (path: string) => Promise<boolean>, spec: ScriptSpec) {
  const path = specPath(spec);
  if (spec.retiredSchedule) {
    // The dispatcher does this work now: turn the old schedule off (kept, so it can be turned back on by hand).
    if (await exists(`/w/{ws}/schedules/exists/${path}`)) {
      await w.write(`/w/{ws}/schedules/setenabled/${path}`, { enabled: false }, `disabling schedule ${path} (replaced by the dispatcher)`);
    }
    return;
  }
  if (!spec.schedule) return;
  const enable = spec.name === "retention" ? ENABLE_RETENTION : ENABLE_SCHEDULES;
  const body = { schedule: spec.schedule.cron, timezone: TIMEZONE, args: {}, summary: spec.schedule.summary };
  if (await exists(`/w/{ws}/schedules/exists/${path}`)) {
    await w.write(`/w/{ws}/schedules/update/${path}`, body, `updating schedule ${path} (${spec.schedule.cron})`);
    if (enable) await w.write(`/w/{ws}/schedules/setenabled/${path}`, { enabled: true }, `enabling schedule ${path}`);
  } else {
    await w.write(
      "/w/{ws}/schedules/create",
      { path, script_path: path, is_flow: false, enabled: enable, ...body },
      `creating schedule ${path} (${spec.schedule.cron}, ${enable ? "enabled" : "disabled"})`,
    );
  }
}

async function route(w: Api, exists: (path: string) => Promise<boolean>, spec: ScriptSpec) {
  if (!spec.route) return;
  const path = specPath(spec);
  const body = {
    path,
    script_path: path,
    route_path: spec.route.path,
    workspaced_route: false,
    is_flow: false,
    http_method: spec.route.method,
    request_type: "sync",
    authentication_method: "none",
    is_static_website: false,
    wrap_body: false,
    raw_string: spec.route.rawBody ?? false,
    summary: spec.summary,
  };
  if (await exists(`/w/{ws}/http_triggers/exists/${path}`)) {
    await w.write(`/w/{ws}/http_triggers/update/${path}`, body, `updating route /api/r/${spec.route.path}`);
  } else {
    await w.write("/w/{ws}/http_triggers/create", body, `creating route /api/r/${spec.route.path}`);
  }
}

await main();
