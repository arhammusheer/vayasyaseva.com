/**
 * The Fast2SMS WhatsApp webhook for incoming messages on the Business number
 * (+91 78958 50598), posting to Windmill's f/talent/whatsapp_inbound
 * (scripts.mts route webhook/fast2sms-whatsapp-in): workers' replies to
 * crew messages (docs/crew-offers.md).
 *
 *   node integrations/windmill/fast2sms-whatsapp-webhook.mts                print the dashboard values; say whether it exists
 *   node integrations/windmill/fast2sms-whatsapp-webhook.mts --copy-secret  the x-vspl-wa-secret value to the clipboard
 *   node integrations/windmill/fast2sms-whatsapp-webhook.mts --copy-url     the URL with ?key= (for a form without headers)
 *
 * Made once in the Fast2SMS dashboard (Dev API → Webhooks → Create webhook),
 * as the SMS one is (fast2sms-webhook.mts): Standard format, event Incoming
 * Messages, this number's id, the body below. The body names only what the
 * route reads (docs.fast2sms.com "WhatsApp Webhook Overview": a button tap
 * arrives as message_type "button" with the label as body). Reads the
 * Fast2SMS key and the secret from the cluster, as deploy.mts does
 * (FAST2SMS_WA_SECRET, else FAST2SMS_DLR_SECRET), and prints neither.
 */
import { execFileSync } from "node:child_process";
import { WA_PHONE_NUMBER_ID } from "./talent/lib/whatsapp-ack.ts";

const API = "https://www.fast2sms.com/dev/webhook/v2/whatsapp";
export const WEBHOOK_NAME = "VSPL crew replies (Windmill)";
export const WEBHOOK_URL = "https://hooks.vayasyaseva.com/api/r/webhook/fast2sms-whatsapp-in";

export const PAYLOAD = JSON.stringify(
  {
    webhook_type: "@{{webhook_type}}",
    from: "@{{from}}",
    message_type: "@{{message_type}}",
    body: "@{{body}}",
    caption: "@{{caption}}",
    request_id: "@{{request_id}}",
    context_message_id: "@{{context_message_id}}",
    phone_number_id: "@{{phone_number_id}}",
  },
  null,
  2,
);

function secretValue(key: string, secret = "windmill-fast2sms"): string | null {
  try {
    const b64 = execFileSync("kubectl", ["-n", "growth", "get", "secret", secret, "-o", `jsonpath={.data.${key}}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return b64 ? Buffer.from(b64, "base64").toString("utf8") : null;
  } catch {
    return null;
  }
}

const secret = () => {
  const value = secretValue("FAST2SMS_WA_SECRET") ?? secretValue("FAST2SMS_DLR_SECRET");
  if (!value) throw new Error("growth/windmill-fast2sms has neither FAST2SMS_WA_SECRET nor FAST2SMS_DLR_SECRET");
  return value;
};

if (process.argv.includes("--copy-secret")) {
  execFileSync("pbcopy", { input: secret() });
  console.log("the x-vspl-wa-secret value is on the clipboard (not shown)");
  process.exit(0);
}
if (process.argv.includes("--copy-url")) {
  execFileSync("pbcopy", { input: `${WEBHOOK_URL}?key=${encodeURIComponent(secret())}` });
  console.log("the webhook URL with ?key= is on the clipboard (not shown)");
  process.exit(0);
}

console.log(`In the Fast2SMS dashboard (Dev API → Webhooks), Create webhook with:
  Webhook Name     ${WEBHOOK_NAME}
  Select Service   WhatsApp
  Select Format    Standard Webhook
  Select Event     Incoming Messages
  Phone Number Id  ${WA_PHONE_NUMBER_ID}
  Method           POST
  URL              ${WEBHOOK_URL}
                   (if the form takes no custom header: the URL from --copy-url instead)
  Content-Type     JSON
  Header           x-vspl-wa-secret: (run with --copy-secret)
  Status           Active
  Body
${PAYLOAD}`);

const apiKey = secretValue("FAST2SMS_API_KEY", "windmill-talent");
if (apiKey) {
  try {
    const res = await fetch(API, { headers: { authorization: apiKey }, signal: AbortSignal.timeout(20_000) });
    const json = (await res.json().catch(() => null)) as { data?: Record<string, unknown>[] } | null;
    const hooks = Array.isArray(json?.data) ? json!.data : [];
    const ours = hooks.find((h) => (h.name ?? h.webhook_name) === WEBHOOK_NAME || String(h.url ?? "").startsWith(WEBHOOK_URL));
    console.log(`\n${hooks.length} WhatsApp webhook(s) on the account; ours ${ours ? `exists (${String(ours.status ?? "status unknown")})` : "is not there yet"}`);
  } catch {
    console.log("\ncould not list the account's WhatsApp webhooks");
  }
}
