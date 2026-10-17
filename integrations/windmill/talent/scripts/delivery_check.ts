/**
 * f/talent/delivery_check: every 15 minutes. Looks up, with Fast2SMS's DLR
 * API, accepted acknowledgements whose delivery report has not arrived
 * (lib/delivery.ts), so a lost webhook only delays the status.
 */
import { config } from "../lib/config.ts";
import { withTalentDb } from "../lib/db.ts";
import { lookupReport, runDeliveryCheck } from "../lib/delivery.ts";

export async function main() {
  const apiKey = await config("fast2sms_api_key");
  return withTalentDb((query) => runDeliveryCheck({ query, lookup: (id) => lookupReport(id, apiKey) }));
}
