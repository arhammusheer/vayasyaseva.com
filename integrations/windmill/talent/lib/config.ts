/**
 * Settings and secrets, read from the `vspl` workspace's variables under
 * f/talent/ (set by integrations/windmill/deploy.mts from the cluster;
 * README "Variables"). Tests replace the reader with setConfigForTests.
 */
import * as wmill from "windmill-client";

/** Every variable the scripts read, and whether deploy stores it as a secret. */
export const VARIABLES = {
  /** postgres://talent:…@pg-main-rw.data.svc.cluster.local:5432/talent */
  talent_pg_url: { secret: true },
  fast2sms_api_key: { secret: true },
  /** The x-vspl-intake-secret header the website sends. */
  intake_webhook_secret: { secret: true },
  /** Read-only R2 token scoped to vayasya-talent-intake (deliver attaches files). */
  r2_read_key_id: { secret: true },
  r2_read_secret: { secret: true },
  /** Delete rights on vayasya-talent-intake, for erasure only. */
  r2_erase_key_id: { secret: true },
  r2_erase_secret: { secret: true },
  /** Chatwoot user "Automation (retention)": deletes contacts. */
  chatwoot_admin_token: { secret: true },
  /** The "Jobs, website" API inbox identifier: it authorises Chatwoot's public API, so it is a secret too. */
  chatwoot_inbox_identifier: { secret: true },
  chatwoot_base_url: { secret: false },
  chatwoot_account_id: { secret: false },
  r2_endpoint: { secret: false },
  r2_bucket: { secret: false },
  /** Twenty CRM (crm.vayasyaseva.com): its in-cluster URL and the workspace API key (Secret growth/twenty-api). */
  twenty_base_url: { secret: false },
  twenty_api_key: { secret: true },
  /** The x-vspl-lead-secret header the website sends to f/leads/intake (Secret growth/windmill-leads). */
  lead_webhook_secret: { secret: true },
  /** The x-vspl-dlr-secret header Fast2SMS sends with delivery reports (Secret growth/windmill-fast2sms). */
  fast2sms_dlr_secret: { secret: true },
  /** postgres://leads:…@pg-main-rw.data.svc.cluster.local:5432/leads: the lead inbox (vayasya-infra pg-main-leads). */
  leads_pg_url: { secret: true },
  /**
   * SUBMISSION_SIGNING_SECRET (Secret growth/windmill-submission; Vercel has the same value): the HMAC key of
   * the signed routes webhook/vspl-submission and webhook/vspl-idempotency (packages/contracts/src/signing.ts).
   */
  submission_signing_secret: { secret: true },
} as const;

export type ConfigName = keyof typeof VARIABLES;
export const variablePath = (name: ConfigName) => `f/talent/${name}`;

let override: Partial<Record<ConfigName, string>> | null = null;

/** Tests only: answer from this map instead of Windmill. */
export function setConfigForTests(values: Partial<Record<ConfigName, string>> | null) {
  override = values;
}

export async function config(name: ConfigName): Promise<string> {
  if (override) {
    const value = override[name];
    if (value === undefined) throw new Error(`test config has no ${name}`);
    return value;
  }
  const value = await wmill.getVariable(variablePath(name));
  if (!value) throw new Error(`variable ${variablePath(name)} is empty`);
  return value;
}
