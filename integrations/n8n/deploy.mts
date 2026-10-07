/**
 * Deploys the talent workflows to the growth cluster's n8n, via kubectl.
 *
 *   pnpm n8n:build && pnpm n8n:deploy
 *
 * Needs kubectl access to the cluster (WARP on). Idempotent: credentials and
 * workflows are imported under fixed ids, so a re-run updates them in place.
 *
 * 1. Reads the secrets from the cluster: the talent database password
 *    (data/pg-main-talent), R2 key, webhook secret and Fast2SMS key (growth/n8n-env).
 *    They are piped into the n8n pod and never printed or written locally.
 * 2. Imports talent-pg, r2-talent-intake, fast2sms-vspl and
 *    vspl-talent-intake-webhook. sarvam-vspl must already exist (made by hand).
 * 3. Imports the five workflows, linking credentials by name and filling in
 *    the Chatwoot inbox identifier of the "Jobs, website" inbox.
 * 4. Runs "VSPL talent · setup" (schema), publishes intake, transcribe and
 *    deliver and acknowledge, and restarts n8n so the triggers load.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const here = dirname(new URL(import.meta.url).pathname);
const N8N = ["-n", "growth", "exec", "-i", "deploy/n8n", "--"];
const CHATWOOT = ["-n", "growth", "exec", "deploy/chatwoot", "--"];
const INBOX_NAME = "Jobs, website";
const ACCOUNT_ID = 1;

function kubectl(args: string[], input?: string): string {
  return execFileSync("kubectl", ["--request-timeout=180s", ...args], {
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
}

function secretValue(namespace: string, secret: string, key: string): string {
  const b64 = kubectl(["-n", namespace, "get", "secret", secret, "-o", `jsonpath={.data.${key}}`]);
  if (!b64) throw new Error(`secret ${namespace}/${secret} has no ${key}`);
  return Buffer.from(b64, "base64").toString("utf8");
}

/** Writes stdin to a temp file in the n8n pod, runs the CLI on it, removes it. */
function n8nWithFile(command: string, content: string): string {
  const script = `d=$(mktemp -d) && f="$d/data.json" && cat > "$f" && n8n ${command} --input="$f"; code=$?; rm -rf "$d"; exit $code`;
  return kubectl([...N8N, "sh", "-c", script], content);
}

function step(message: string) {
  console.log(`- ${message}`);
}

// 1. Secrets and ids from the cluster
step("reading secrets from the cluster");
const talentPassword = secretValue("data", "pg-main-talent", "password");
const r2KeyId = secretValue("growth", "n8n-env", "TALENT_R2_ACCESS_KEY_ID");
const r2Secret = secretValue("growth", "n8n-env", "TALENT_R2_SECRET_ACCESS_KEY");
const webhookSecret = secretValue("growth", "n8n-env", "TALENT_INTAKE_WEBHOOK_SECRET");
const fast2smsKey = secretValue("growth", "n8n-env", "FAST2SMS_API_KEY");
const r2Endpoint = `https://3f03827748ac33418f1176adaa436f26.r2.cloudflarestorage.com`;

step(`looking up the "${INBOX_NAME}" inbox identifier in Chatwoot`);
const identifierOut = kubectl([
  ...CHATWOOT,
  "bundle", "exec", "rails", "runner",
  `i = Account.find(${ACCOUNT_ID}).inboxes.find_by!(name: ${JSON.stringify(INBOX_NAME)}); puts "IDENTIFIER=#{i.channel.identifier}"`,
]);
const inboxIdentifier = identifierOut.match(/^IDENTIFIER=(\S+)$/m)?.[1];
if (!inboxIdentifier) throw new Error(`no "${INBOX_NAME}" API inbox in Chatwoot account ${ACCOUNT_ID}`);

step("listing existing n8n credentials");
// The listing script reaches the pod on stdin (`node -`): only ids, names
// and types leave the pod, never the (encrypted) credential data.
const listScript = `const c = JSON.parse(require("fs").readFileSync(process.argv[2], "utf8"));
console.log(JSON.stringify(c.map(({ id, name, type }) => ({ id, name, type }))));`;
const existing = JSON.parse(
  kubectl(
    [...N8N, "sh", "-c", 'd=$(mktemp -d) && f="$d/credentials.json" && n8n export:credentials --all --output="$f" >/dev/null 2>&1; node - "$f"; code=$?; rm -rf "$d"; exit $code'],
    listScript,
  ).trim().split("\n").pop() || "",
) as { id: string; name: string; type: string }[];

// 2. Credentials. Ids come from the generated workflows, so links are exact;
//    an existing credential with the same name keeps its id.
const workflowFiles = ["vspl-talent-setup", "vspl-talent-intake", "vspl-talent-transcribe", "vspl-talent-deliver", "vspl-talent-acknowledge"];
const workflows = workflowFiles.map((f) => JSON.parse(readFileSync(resolve(here, "workflows", `${f}.json`), "utf8")));

const referenced = new Map<string, { id: string; type: string }>();
for (const w of workflows) {
  for (const node of w.nodes) {
    for (const [type, ref] of Object.entries<{ id: string; name: string }>(node.credentials ?? {})) {
      referenced.set(ref.name, { id: ref.id, type });
    }
  }
}
const idFor = (name: string) => existing.find((c) => c.name === name)?.id ?? referenced.get(name)?.id;

const credentials = [
  {
    name: "fast2sms-vspl",
    type: "httpHeaderAuth",
    data: { name: "Authorization", value: fast2smsKey },
  },
  {
    name: "talent-pg",
    type: "postgres",
    data: {
      host: "pg-main-rw.data.svc.cluster.local",
      port: 5432,
      database: "talent",
      user: "talent",
      password: talentPassword,
      ssl: "disable",
    },
  },
  {
    name: "r2-talent-intake",
    type: "s3",
    data: { endpoint: r2Endpoint, region: "auto", accessKeyId: r2KeyId, secretAccessKey: r2Secret, forcePathStyle: true },
  },
  {
    name: "vspl-talent-intake-webhook",
    type: "httpHeaderAuth",
    data: { name: "x-vspl-intake-secret", value: webhookSecret },
  },
].map((c) => ({ ...c, id: idFor(c.name) }));

for (const name of referenced.keys()) {
  if (!credentials.some((c) => c.name === name) && !existing.some((c) => c.name === name)) {
    throw new Error(`credential "${name}" must exist in n8n before deploying (create it by hand)`);
  }
}

step(`importing credentials: ${credentials.map((c) => c.name).join(", ")}`);
n8nWithFile("import:credentials", JSON.stringify(credentials));

// 3. Workflows, with credential ids resolved and the inbox identifier set
for (const w of workflows) {
  for (const node of w.nodes) {
    for (const ref of Object.values<{ id: string; name: string }>(node.credentials ?? {})) {
      const id = idFor(ref.name);
      if (!id) throw new Error(`no id for credential "${ref.name}"`);
      ref.id = id;
    }
    if (node.name === "Settings") {
      for (const a of node.parameters.assignments.assignments) {
        if (a.name === "chatwootInboxIdentifier") a.value = inboxIdentifier;
      }
    }
  }
  step(`importing workflow "${w.name}" (${w.id})`);
  n8nWithFile("import:workflow", JSON.stringify(w));
}

// 4. Schema, publish, restart
const setup = workflows[0];
step(`running "${setup.name}"`);
// A one-off n8n process beside the running one: give its task broker its own port.
const setupOut = kubectl([...N8N, "env", "N8N_RUNNERS_BROKER_PORT=5690", "n8n", "execute", `--id=${setup.id}`]);
if (!/Execution was successful/i.test(setupOut)) {
  console.error(setupOut.split("\n").slice(-20).join("\n"));
  throw new Error("setup workflow failed");
}

for (const w of workflows.slice(1)) {
  step(`publishing "${w.name}"`);
  kubectl([...N8N, "n8n", "publish:workflow", `--id=${w.id}`]);
}

step("restarting n8n so the published triggers load");
kubectl(["-n", "growth", "rollout", "restart", "deploy/n8n"]);
kubectl(["-n", "growth", "rollout", "status", "deploy/n8n", "--timeout=300s"]);
console.log("done");
