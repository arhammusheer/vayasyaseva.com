/**
 * f/talent/crew: crew offers on WhatsApp (talent/lib/run-crew.ts). Every
 * minute, and started by f/talent/whatsapp_inbound when a worker replies.
 * Reads the crew members recruiters set in Twenty, sends each the message it
 * is due, writes replies and delivery back. Its schedule is turned on only
 * with `pnpm windmill:deploy --enable-crew`.
 */
import { config } from "../lib/config.ts";
import { withTalentDb } from "../lib/db.ts";
import { runCrew } from "../lib/run-crew.ts";
import { twentyFromConfig } from "../lib/twenty.ts";
import { lookupWhatsAppReport, sendWhatsAppTemplate } from "../lib/whatsapp-ack.ts";
import { tryEmit } from "../../notify/lib/emit.ts";

export async function main() {
  const apiKey = await config("fast2sms_api_key");
  const crm = await twentyFromConfig().catch(() => null);
  const result = await withTalentDb((query) =>
    runCrew({
      query,
      crm,
      sendWhatsApp: (message, templateId) => sendWhatsAppTemplate(message, templateId, apiKey),
      lookupWhatsApp: (id) => lookupWhatsAppReport(id, apiKey),
      notify: tryEmit,
    }),
  );
  if (result.errors.length) console.error(`crew: ${result.errors.length} error(s): ${result.errors.join(" | ")}`);
  return result;
}
