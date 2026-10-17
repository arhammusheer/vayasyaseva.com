/**
 * The Fast2SMS SMS delivery-report webhook that posts to Windmill's
 * f/talent/delivery_report (scripts.mts route webhook/fast2sms-dlr).
 *
 *   node integrations/windmill/fast2sms-webhook.mts            check, else try to create
 *   node integrations/windmill/fast2sms-webhook.mts --copy-secret   the secret to the clipboard
 *
 * Fast2SMS (Oct 2026) lets the API key list webhooks but answers 401 to
 * creating one, so it is made once in the dashboard (Dev API → Webhooks →
 * Create webhook) with the values this prints; the script then confirms it.
 * Reads the Fast2SMS key (growth/n8n-env, as deploy.mts) and the secret
 * (growth/windmill-fast2sms) from the cluster and prints neither.
 *
 * Fast2SMS API (docs.fast2sms.com, "Webhook (New)"), header Authorization:
 *   GET /dev/webhook/v2/sms   POST /dev/webhook/v2/sms (field webhook_name)
 *
 * The body is a custom template with only what delivery_report reads, so no
 * phone number travels (the preprocessor drops it too, should one come).
 */
import { execFileSync } from "node:child_process";

const DRY_RUN = process.argv.includes("--dry-run");
const API = "https://www.fast2sms.com/dev/webhook/v2/sms";
export const WEBHOOK_NAME = "VSPL acknowledgements (Windmill)";
export const WEBHOOK_URL = "https://hooks.vayasyaseva.com/api/r/webhook/fast2sms-dlr";

export const PAYLOAD = JSON.stringify(
  {
    request_id: "@{{request_id}}",
    status: "@{{status}}",
    status_description: "@{{status_description}}",
    failure_reason: "@{{failure_reason}}",
    delivery_timestamp: "@{{delivery_timestamp}}",
  },
  null,
  2,
);

function secretValue(namespace: string, secret: string, key: string): string {
  const b64 = execFileSync("kubectl", ["-n", namespace, "get", "secret", secret, "-o", `jsonpath={.data.${key}}`], { encoding: "utf8" });
  if (!b64) throw new Error(`secret ${namespace}/${secret} has no ${key}`);
  return Buffer.from(b64, "base64").toString("utf8");
}

async function call(method: string, url: string, apiKey: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { authorization: apiKey, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || json?.return === false || json?.success === false) {
    throw new Error(`Fast2SMS ${method} ${url.replace(API, "/dev/webhook/v2/sms")}: HTTP ${res.status} ${String(json?.message ?? "")}`);
  }
  return json;
}

const apiKey = secretValue("growth", "n8n-env", "FAST2SMS_API_KEY");
const dlrSecret = secretValue("growth", "windmill-fast2sms", "FAST2SMS_DLR_SECRET");

const config = {
  webhook_name: WEBHOOK_NAME,
  name: WEBHOOK_NAME,
  template: "custom",
  event: "all",
  method: "POST",
  url: WEBHOOK_URL,
  content_type: "application/json",
  payload_transform: "standard",
  payload_type: "SIMPLIFIED",
  status: "active",
  payload: PAYLOAD,
  headers: { "x-vspl-dlr-secret": dlrSecret },
};

const COPY_SECRET = process.argv.includes("--copy-secret");
if (COPY_SECRET) {
  execFileSync("pbcopy", { input: dlrSecret });
  console.log("the x-vspl-dlr-secret value is on the clipboard (not shown)");
  process.exit(0);
}

const list = await call("GET", API, apiKey);
const hooks = (Array.isArray(list?.data) ? list.data : []) as Record<string, unknown>[];
const named = (h: Record<string, unknown>) => h.name ?? h.webhook_name;
const ours = hooks.find((h) => named(h) === WEBHOOK_NAME || String(h.url ?? "").startsWith(WEBHOOK_URL));
console.log(`${hooks.length} SMS webhook(s) on the account`);
if (ours) {
  console.log(`found "${String(named(ours))}": ${String(ours.method ?? "")} ${String(ours.url ?? "").split("?")[0]}, status ${String(ours.status ?? "?")}, event ${String(ours.event ?? "?")}`);
  process.exit(0);
}
if (DRY_RUN) {
  console.log(`[dry run] would create "${WEBHOOK_NAME}"`);
  process.exit(0);
}
try {
  await call("POST", API, apiKey, config);
  console.log(`created "${WEBHOOK_NAME}"`);
} catch (err) {
  console.log(`could not create it through the API (${err instanceof Error ? err.message : "error"}). In the Fast2SMS dashboard, Create webhook with:
  Webhook Name    ${WEBHOOK_NAME}
  Service         SMS
  Format          Standard Webhook
  Event           Default All Events
  Entity ID       Default All
  Method          POST
  URL             ${WEBHOOK_URL}
  Content-Type    JSON
  Header          x-vspl-dlr-secret: (run with --copy-secret)
                  no header field: URL ${WEBHOOK_URL}?key=<the secret>
  Status          Active
  Body
${PAYLOAD}`);
  process.exitCode = 1;
}
