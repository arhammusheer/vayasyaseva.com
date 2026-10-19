/**
 * The Fast2SMS WhatsApp webhook for the apply number (+91 78958 50598),
 * posting incoming messages to Windmill's f/talent/whatsapp (scripts.mts
 * route webhook/fast2sms-whatsapp).
 *
 *   node integrations/windmill/fast2sms-whatsapp-webhook.mts                 print the dashboard values
 *   node integrations/windmill/fast2sms-whatsapp-webhook.mts --copy-secret   the header value to the clipboard
 *
 * Fast2SMS's API answers 401 to creating webhooks (fast2sms-webhook.mts), so
 * this one is made in the dashboard too: Dev API → Webhooks → Create webhook,
 * service WhatsApp, event "received". The body is a custom template with only
 * the fields f/talent/whatsapp reads (docs: fast2sms.com/help/?p=17130).
 * Reads the secret from the cluster as deploy.mts does (FAST2SMS_WA_SECRET,
 * else FAST2SMS_DLR_SECRET) and never prints it.
 */
import { execFileSync } from "node:child_process";

export const WEBHOOK_NAME = "VSPL WhatsApp apply chat (Windmill)";
export const WEBHOOK_URL = "https://hooks.vayasyaseva.com/api/r/webhook/fast2sms-whatsapp";

export const PAYLOAD = JSON.stringify(
  {
    webhook_type: "@{{webhook_type}}",
    from: "@{{from}}",
    message_type: "@{{message_type}}",
    body: "@{{body}}",
    // Fast2SMS has no message_id variable: request_id is the message's unique id (docs.fast2sms.com/reference/whatsapp-webhook).
    message_id: "@{{request_id}}",
    phone_number_id: "@{{phone_number_id}}",
  },
  null,
  2,
);

function secretValue(key: string): string | null {
  try {
    const b64 = execFileSync("kubectl", ["-n", "growth", "get", "secret", "windmill-fast2sms", "-o", `jsonpath={.data.${key}}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return b64 ? Buffer.from(b64, "base64").toString("utf8") : null;
  } catch {
    return null;
  }
}

if (process.argv.includes("--copy-secret")) {
  const secret = secretValue("FAST2SMS_WA_SECRET") ?? secretValue("FAST2SMS_DLR_SECRET");
  if (!secret) throw new Error("growth/windmill-fast2sms has neither FAST2SMS_WA_SECRET nor FAST2SMS_DLR_SECRET");
  execFileSync("pbcopy", { input: secret });
  console.log("the x-vspl-wa-secret value is on the clipboard (not shown)");
  process.exit(0);
}

console.log(`In the Fast2SMS dashboard (Dev API → Webhooks), Create webhook with:
  Webhook Name    ${WEBHOOK_NAME}
  Service         WhatsApp
  Format          Standard Webhook
  Event           Received (incoming messages)
  Phone Number Id +91 78958 50598
  Method          POST
  URL             ${WEBHOOK_URL}
  Content-Type    JSON
  Header          x-vspl-wa-secret: (run with --copy-secret)
  Signing         on, if offered
  Status          Active
  Body
${PAYLOAD}`);
